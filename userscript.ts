import { LanguageCode } from "./langauge.ts"
import { deepMerge } from "jsr:@std/collections"

export type Grant =
	| "window.close"
	| "window.focus"
	| "GM_info"
	| "GM_getValue"
	| "GM_setValue"
	| "GM_deleteValue"
	| "GM_listValues"
	| "GM_addValueChangeListener"
	| "GM_removeValueChangeListener"
	| "GM_getResourceText"
	| "GM_getResourceURL"
	| "GM_addElement"
	| "GM_addStyle"
	| "GM_openInTab"
	| "GM_registerMenuCommand"
	| "GM_unregisterMenuCommand"
	| "GM_notification"
	| "GM_setClipboard"
	| "GM_xmlhttpRequest"
	| "GM_download"

type Multiple<K extends string, V> = Partial<Record<K, V>>

type MetadataName = { name: string } & Multiple<`name:${LanguageCode}`, string>
type MetadataDescription = { description: string } & Multiple<`description:${LanguageCode}`, string>

export type MetadataResources = {
	match: string[]
	"exclude-match"?: string[]

	require?: URL[]
	resource?: URL[]
	grant?: Grant[]
}
export type MetadataEntries =
	& MetadataName
	& MetadataDescription
	& {
		icon?: URL
		version: `${number}.${number}.${number}`

		namespace?: string | URL

		/** @default "document-end" */
		"run-at"?: "document-end" | "document-start" | "document-idle"
		// /** @default undefined */
		// noframes?: boolean
	}
	& Record<"downloadURL" | "supportURL" | "homepageURL", URL>

const defaultOption = {
	entries: {
		icon: new URL("https://www.google.com/s2/favicons?sz=64&domain=github.com"),
		license: "AGPL-3.0-only",
	},
	resources: {
		match: [],
		"exclude-match": [],
		grant: [],
		require: [],
		resource: [],
	},
}
type Option = {
	entries: MetadataEntries
	resources: MetadataResources
}
export const metadataBlock = (option: Option) => {
	const { entries, resources } = deepMerge(defaultOption, option)

	const pairs = [
		...Object.entries(entries),
		...Object.entries(resources).flatMap(([key, value]) => value.map((v) => [key, v])),
	] as [string, string | URL][]

	const longest = pairs.reduce((max, [key]) => Math.max(max, key.length), 0)
	const entry = pairs.map(([key, value]) => `// @${key.padEnd(longest)} ${value}`).join("\n")

	return `// ==UserScript==\n${entry}\n// ==/UserScript==`
}

if (import.meta.main) {
	const homepageHost = new URL("https://github.com/scarf005")
	const homepageURL = new URL(`${homepageHost}/userscript`)
	const downloadHost = new URL("https://raw.githubusercontent.com/scarf005")
	const issues = new URLSearchParams({ q: "is:issue+is:open+sort:updated-desc" })

	const downloadURL = new URL(`${downloadHost}/userscript/main/dist/roguelike_tag.user.js`)
	const meta = metadataBlock({
		entries: {
			name: "로갤 말머리 태그",
			namespace: "scarf",
			version: "0.2.0",
			description: "제목별 태그 추가",
			homepageURL,
			supportURL: new URL(`${homepageURL}?${issues}`),
			downloadURL,
		},
		resources: {
			match: [
				"https://gall.dcinside.com/*",
				"https://m.dcinside.com/*/rlike*",
			],
			grant: ["GM_addStyle"],
		},
	})
	console.log(meta)
}
