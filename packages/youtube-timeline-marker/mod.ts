import { compilePattern, type Cue, findWarnings, parseCaptions } from "./captions.ts"
import { findPeak, type Peak, videoIdOf } from "./heatmap.ts"

const patternKey = "youtube-timeline-marker:pattern"
const containerId = "timeline-marker-markers"
const cuesByTrack = new Map<string, Cue[]>()
const peaks = new Map<string, Peak>()

const trackKey = (url: URL) => {
	const params = ["v", "lang", "tlang", "kind", "name"].map((key) => url.searchParams.get(key))
	return params.join("|")
}

const storePeak = (data: unknown) => {
	const videoId = videoIdOf(data) ?? new URLSearchParams(location.search).get("v")
	const peak = findPeak(data)
	if (videoId && peak) peaks.set(videoId, peak)
}

const store = (rawUrl: string, body: string) => {
	const url = new URL(rawUrl, location.href)
	if (url.pathname.endsWith("/youtubei/v1/next")) {
		try {
			storePeak(JSON.parse(body))
		} catch { /* not JSON */ }
		return
	}
	if (!url.pathname.endsWith("/api/timedtext")) return

	const cues = parseCaptions(body)
	if (cues.length) cuesByTrack.set(trackKey(url), cues)
}

const hookFetch = () => {
	const original = globalThis.fetch
	globalThis.fetch = async function (...args) {
		const response = await original.apply(this, args)
		const input = args[0]
		const url = input instanceof Request ? input.url : String(input)
		response.clone().text().then((body) => store(url, body), () => {})
		return response
	}
}

const hookXhr = () => {
	const { open } = XMLHttpRequest.prototype
	XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: [string, string | URL]) {
		this.addEventListener("load", () => {
			if (this.responseType === "" || this.responseType === "text") {
				store(String(args[1]), this.responseText)
			}
		})
		// deno-lint-ignore no-explicit-any
		return (open as any).apply(this, args)
	} as typeof open
}

const pattern = () => {
	try {
		return compilePattern(localStorage.getItem(patternKey))
	} catch {
		return compilePattern(null)
	}
}

const warningsOf = (videoId: string) => {
	const cues = [...cuesByTrack].flatMap(([key, value]) =>
		key.startsWith(`${videoId}|`) ? value : []
	)
	return findWarnings(cues, pattern())
}

const marker = (
	{ start, end, text, color, minWidth }: {
		start: number
		end: number
		text: string
		color: string
		minWidth: number
	},
	duration: number,
) => {
	const element = document.createElement("div")
	element.title = text
	element.style.cssText = [
		"position:absolute",
		"top:0",
		"bottom:0",
		`min-width:${minWidth}px`,
		`background:${color}`,
		`left:${start / duration * 100}%`,
		`width:${(end - start) / duration * 100}%`,
	].join(";")
	return element
}

let initialDataRead = false

const readInitialData = () => {
	const data = (globalThis as { ytInitialData?: unknown }).ytInitialData
	if (!data || initialDataRead) return
	initialDataRead = true
	storePeak(data)
}

let rendered = ""

const buttonId = "timeline-marker-pattern"

const editPattern = () => {
	const input = prompt("정규식 (비우면 기본값)", pattern().source)
	if (input === null) return

	try {
		input ? localStorage.setItem(patternKey, input) : localStorage.removeItem(patternKey)
	} catch { /* storage unavailable */ }
	rendered = ""
	render()
}

const ensureButton = () => {
	const controls = document.querySelector(".ytp-right-controls")
	if (!controls || document.getElementById(buttonId)) return

	const button = document.createElement("button")
	button.id = buttonId
	button.className = "ytp-button"
	button.title = "타임라인 마커 정규식"
	button.textContent = "/re/"
	button.style.cssText = "color:#fff;font-size:13px;width:auto;padding:0 8px"
	button.addEventListener("click", editPattern)
	controls.prepend(button)
}

const render = () => {
	ensureButton()
	const bar = document.querySelector<HTMLElement>(".ytp-progress-bar")
	const video = document.querySelector<HTMLVideoElement>("video.html5-main-video")
	const videoId = new URLSearchParams(location.search).get("v")
	const existing = document.getElementById(containerId)

	if (!bar || !video || !videoId || !Number.isFinite(video.duration)) return
	if (document.querySelector(".html5-video-player.ad-showing")) return existing?.remove()

	readInitialData()
	const warnings = warningsOf(videoId)
	const peak = peaks.get(videoId)
	const signature = `${videoId}|${video.duration}|${
		warnings.map((cue) => cue.start)
	}|${peak?.start}`
	if (existing && signature === rendered) return

	existing?.remove()
	rendered = signature
	if (!warnings.length && !peak) return

	const container = document.createElement("div")
	container.id = containerId
	container.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:40"
	if (peak) {
		container.append(
			marker({ ...peak, text: "가장 많이 본 장면", color: "#ffcc00", minWidth: 3 }, video.duration),
		)
	}
	container.append(
		...warnings.map(({ start, text }) =>
			marker({ start, end: start, text, color: "#ff3b30", minWidth: 3 }, video.duration)
		),
	)
	bar.append(container)
}

const state = globalThis as typeof globalThis & { __youtubeTimelineMarker?: boolean }

if (!state.__youtubeTimelineMarker) {
	state.__youtubeTimelineMarker = true
	hookFetch()
	hookXhr()
	setInterval(render, 1000)
}
