import { resolve } from "https://deno.land/std@0.220.1/path/resolve.ts"

import { bundleUserScript } from "../../build.ts"
import { metadataBlock } from "../../userscript.ts"
import type { UserscriptPackage } from "../types.ts"

const metadata = metadataBlock({
	entries: {
		name: "YouTube scare warning timeline",
		"name:ko": "YouTube 깜놀 경고 타임라인",
		namespace: "https://github.com/scarf005",
		description: "mark subtitles matching a regex (jump scare warnings) on the YouTube timeline",
		"description:ko":
			"정규식에 맞는 자막(깜놀 주의 등)의 위치를 YouTube 타임라인에 미리 표시합니다. 자막(CC)이 켜져 있어야 합니다.",
		version: "0.1.0",
		"run-at": "document-start",
		homepageURL: new URL("https://github.com/scarf005/userscript"),
		supportURL: new URL(
			"https://github.com/scarf005/userscript/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc",
		),
		downloadURL: new URL(
			"https://scarf005.github.io/userscript/dist/youtube-scare-timeline.user.js",
		),
	},
	resources: {
		match: ["https://www.youtube.com/*", "https://m.youtube.com/*"],
	},
})

const output = resolve(import.meta.dirname!, "../../web/dist/youtube-scare-timeline.user.js")

const build = async () => {
	const code = await bundleUserScript({ url: import.meta.resolve("./mod.ts"), metadata })
	await Deno.writeTextFile(output, code)
	return code
}

export const userscriptPackage = {
	id: "youtube-scare-timeline",
	buildFile: new URL(import.meta.url),
	output,
	build,
} satisfies UserscriptPackage

if (import.meta.main) {
	await userscriptPackage.build()
}
