export type Peak = { start: number; end: number }

type Marker = {
	startMillis?: string | number
	durationMillis?: string | number
	intensityScoreNormalized?: number
}

const isMarkers = (value: unknown): value is Marker[] =>
	Array.isArray(value) && value.length > 0 &&
	value.every((item) => typeof item?.intensityScoreNormalized === "number")

const findMarkers = (node: unknown): Marker[] | undefined => {
	if (typeof node !== "object" || node === null) return undefined
	const markers = (node as { markersList?: { markers?: unknown } }).markersList?.markers
	if (isMarkers(markers)) return markers

	for (const child of Object.values(node)) {
		const found = findMarkers(child)
		if (found) return found
	}
}

/** The "most replayed" section: the marker with the highest normalized intensity. */
export const findPeak = (data: unknown): Peak | undefined => {
	const markers = findMarkers(data)
	if (!markers) return undefined

	const top = markers.reduce((best, marker) =>
		marker.intensityScoreNormalized! > best.intensityScoreNormalized! ? marker : best
	)
	const start = Number(top.startMillis) / 1000
	const end = start + Number(top.durationMillis) / 1000
	return Number.isFinite(start) && Number.isFinite(end) ? { start, end } : undefined
}

export const videoIdOf = (data: unknown): string | undefined =>
	(data as { currentVideoEndpoint?: { watchEndpoint?: { videoId?: string } } })
		?.currentVideoEndpoint?.watchEndpoint?.videoId
