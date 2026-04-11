import { userscriptPackages } from "../../packages/registry.ts"

type UserScriptEntry = {
	id: string
	name: string
	description: string
	version: string
	matches: string[]
	downloadURL: string
	homepageURL?: string
	supportURL?: string
	faviconURL: string
}

const headerStart = "// ==UserScript=="
const headerEnd = "// ==/UserScript=="
const metadataLine = /^\s*\/\/\s*@([^\s]+)\s+(.+)$/

const toArray = (value: string | string[] | undefined): string[] => {
	if (!value) return []
	return Array.isArray(value) ? value : [value]
}

const isSafeHttpUrl = (value: string) => {
	try {
		const parsed = new URL(value)
		return parsed.protocol === "https:" || parsed.protocol === "http:"
	} catch {
		return false
	}
}

const faviconFromDomain = (domain: string) => {
	return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(domain)}`
}

const domainFromMatch = (match: string) => {
	if (!match.startsWith("http://") && !match.startsWith("https://")) {
		return undefined
	}

	try {
		const parsed = new URL(match)
		return parsed.hostname.replace(/^\*\./u, "")
	} catch {
		return undefined
	}
}

const parseMetadata = (source: string) => {
	const start = source.indexOf(headerStart)
	const end = source.indexOf(headerEnd)

	if (start === -1 || end === -1 || end <= start) {
		return null
	}

	const body = source.slice(start + headerStart.length, end).split("\n")
	const metadata: Record<string, string | string[]> = {}

	for (const line of body) {
		const match = metadataLine.exec(line)
		if (!match) continue

		const [, key, value] = match
		const previous = metadata[key]

		if (previous === undefined) {
			metadata[key] = value.trim()
			continue
		}

		if (Array.isArray(previous)) {
			previous.push(value.trim())
			continue
		}

		metadata[key] = [previous, value.trim()]
	}

	return metadata
}

const chooseName = (metadata: Record<string, string | string[]>) => {
	const name = metadata.name
	if (typeof name === "string" && name.trim().length > 0) {
		return name
	}

	const localized = Object.entries(metadata).find(([key, value]) => {
		return key.startsWith("name:") && typeof value === "string" && value.trim().length > 0
	})

	if (localized && typeof localized[1] === "string") {
		return localized[1]
	}

	return "Untitled userscript"
}

const chooseDescription = (metadata: Record<string, string | string[]>) => {
	const description = metadata.description
	if (typeof description === "string" && description.trim().length > 0) {
		return description
	}

	const localized = Object.entries(metadata).find(([key, value]) => {
		return key.startsWith("description:") && typeof value === "string" && value.trim().length > 0
	})

	if (localized && typeof localized[1] === "string") {
		return localized[1]
	}

	return "No description"
}

const normalizeEntry = (
	id: string,
	metadata: Record<string, string | string[]>,
): UserScriptEntry | null => {
	const downloadURL = metadata.downloadURL
	if (typeof downloadURL !== "string" || downloadURL.trim().length === 0) {
		return null
	}

	const version = metadata.version
	const homepageURL = metadata.homepageURL
	const supportURL = metadata.supportURL
	const icon = metadata.icon
	const matches = toArray(metadata.match)

	const hasDcinside = matches.some((match) => match.includes("dcinside.com"))
	const homepageDomain = typeof homepageURL === "string" && isSafeHttpUrl(homepageURL)
		? new URL(homepageURL).hostname
		: undefined
	const firstMatchDomain = matches.map(domainFromMatch).find(Boolean)

	const faviconURL = hasDcinside
		? "https://www.dcinside.com/favicon.ico"
		: typeof icon === "string" && isSafeHttpUrl(icon)
		? icon
		: homepageDomain
		? faviconFromDomain(homepageDomain)
		: firstMatchDomain
		? faviconFromDomain(firstMatchDomain)
		: faviconFromDomain("github.com")

	const optional = {
		...(typeof homepageURL === "string" ? { homepageURL } : {}),
		...(typeof supportURL === "string" ? { supportURL } : {}),
	}

	return {
		id,
		name: chooseName(metadata),
		description: chooseDescription(metadata),
		version: typeof version === "string" ? version : "0.0.0",
		matches,
		downloadURL,
		faviconURL,
		...optional,
	}
}

const loadUserscripts = async (): Promise<UserScriptEntry[]> => {
	const entries = await Promise.all(userscriptPackages.map(async ({ id, output }) => {
		const source = await Deno.readTextFile(output)
		const metadata = parseMetadata(source)
		if (!metadata) return null

		return normalizeEntry(id, metadata)
	}))

	return entries
		.filter((entry): entry is UserScriptEntry => entry !== null)
		.sort((left, right) => left.name.localeCompare(right.name, "en"))
}

export default await loadUserscripts()
