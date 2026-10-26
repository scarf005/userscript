import { compilePattern, type Cue, findWarnings, parseCaptions } from "./captions.ts"

const patternKey = "youtube-timeline-marker:pattern"
const containerId = "timeline-marker-markers"
const cuesByTrack = new Map<string, Cue[]>()

const trackKey = (url: URL) => {
	const params = ["v", "lang", "tlang", "kind", "name"].map((key) => url.searchParams.get(key))
	return params.join("|")
}

const store = (rawUrl: string, body: string) => {
	const url = new URL(rawUrl, location.href)
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

const marker = (cue: Cue, duration: number) => {
	const element = document.createElement("div")
	element.title = cue.text
	element.style.cssText = [
		"position:absolute",
		"top:0",
		"bottom:0",
		"width:3px",
		"margin-left:-1px",
		"background:#ff3b30",
		`left:${cue.start / duration * 100}%`,
	].join(";")
	return element
}

let rendered = ""

const render = () => {
	const bar = document.querySelector<HTMLElement>(".ytp-progress-bar")
	const video = document.querySelector<HTMLVideoElement>("video.html5-main-video")
	const videoId = new URLSearchParams(location.search).get("v")
	const existing = document.getElementById(containerId)

	if (!bar || !video || !videoId || !Number.isFinite(video.duration)) return
	if (document.querySelector(".html5-video-player.ad-showing")) return existing?.remove()

	const warnings = warningsOf(videoId)
	const signature = `${videoId}|${video.duration}|${warnings.map((cue) => cue.start)}`
	if (existing && signature === rendered) return

	existing?.remove()
	rendered = signature
	if (!warnings.length) return

	const container = document.createElement("div")
	container.id = containerId
	container.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:40"
	container.append(...warnings.map((cue) => marker(cue, video.duration)))
	bar.append(container)
}

const state = globalThis as typeof globalThis & { __youtubeTimelineMarker?: boolean }

if (!state.__youtubeTimelineMarker) {
	state.__youtubeTimelineMarker = true
	hookFetch()
	hookXhr()
	setInterval(render, 1000)
}
