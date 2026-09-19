const videoIdPattern = /^[A-Za-z0-9_-]{11}$/u
const urlPattern = /https?:\/\/[^\s<>"']+/giu
const trailingPunctuationPattern = /[),.;!?]+$/u

const youtubeHosts = new Set([
	"youtube.com",
	"www.youtube.com",
	"m.youtube.com",
	"music.youtube.com",
])

const isVideoId = (value: string | null): value is string => {
	return value !== null && videoIdPattern.test(value)
}

export const videoIdFromYouTubeUrl = (value: string) => {
	try {
		const url = new URL(value)
		const host = url.hostname.toLowerCase()
		const pathSegments = url.pathname.split("/").filter(Boolean)

		if (host === "youtu.be") {
			return isVideoId(pathSegments[0] ?? null) ? pathSegments[0] : null
		}

		if (!youtubeHosts.has(host)) return null

		if (url.pathname === "/watch") {
			const videoId = url.searchParams.get("v")
			return isVideoId(videoId) ? videoId : null
		}

		if (["shorts", "embed", "live"].includes(pathSegments[0] ?? "")) {
			const videoId = pathSegments[1] ?? null
			return isVideoId(videoId) ? videoId : null
		}

		return null
	} catch {
		return null
	}
}

const splitTrailingPunctuation = (value: string) => {
	const match = trailingPunctuationPattern.exec(value)
	if (!match) return { url: value, trailing: "" }

	return {
		url: value.slice(0, -match[0].length),
		trailing: match[0],
	}
}

const thumbnailUrl = (videoId: string) => `https://img.youtube.com/vi/${videoId}/0.jpg`

export const convertYouTubeLinks = (value: string) => {
	return value.replace(urlPattern, (rawUrl) => {
		const { url, trailing } = splitTrailingPunctuation(rawUrl)
		const videoId = videoIdFromYouTubeUrl(url)
		if (!videoId) return rawUrl

		return `[![](${thumbnailUrl(videoId)})](${url})${trailing}`
	})
}
