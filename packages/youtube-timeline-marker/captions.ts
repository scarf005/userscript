export type Cue = { start: number; text: string }

export const defaultPattern = "주의|공포|깜놀|깜짝\s*놀|점프\s*스케어|jump\s*scare"

const parseJson3 = (body: string): Cue[] => {
	const { events = [] } = JSON.parse(body) as {
		events?: { tStartMs?: number; segs?: { utf8?: string }[] }[]
	}
	return events.flatMap(({ tStartMs, segs }) => {
		const text = segs?.map((seg) => seg.utf8 ?? "").join("").trim()
		return tStartMs === undefined || !text ? [] : [{ start: tStartMs / 1000, text }]
	})
}

const parseXml = (body: string): Cue[] => {
	return [...body.matchAll(/<p\s[^>]*?\bt="(\d+)"[^>]*>([\s\S]*?)<\/p>/g)].flatMap(
		([, t, inner]) => {
			const text = inner.replace(/<[^>]+>/g, "").trim()
			return text ? [{ start: Number(t) / 1000, text }] : []
		},
	)
}

export const parseCaptions = (body: string): Cue[] => {
	try {
		return body.trimStart().startsWith("{") ? parseJson3(body) : parseXml(body)
	} catch {
		return []
	}
}

export const compilePattern = (source: string | null) => {
	try {
		return new RegExp(source || defaultPattern, "iu")
	} catch {
		return new RegExp(defaultPattern, "iu")
	}
}

export const findWarnings = (cues: Cue[], pattern: RegExp): Cue[] => {
	const seen = new Set<number>()
	return cues
		.filter((cue) => pattern.test(cue.text))
		.filter(({ start }) => !seen.has(Math.floor(start)) && seen.add(Math.floor(start)))
		.sort((a, b) => a.start - b.start)
}
