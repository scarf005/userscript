import { resolve } from "https://deno.land/std@0.220.1/path/resolve.ts"

import { bundleUserScript } from "../../build.ts"
import { metadataBlock } from "../../userscript.ts"
import type { UserscriptPackage } from "../types.ts"

const metadata = metadataBlock({
	entries: {
		name: "YouTube subtitle metric append",
		"name:ko": "YouTube 자막 미터법 보조",
		namespace: "https://github.com/scarf005",
		description: "append SI conversions to explicit US customary units in YouTube subtitles live",
		"description:ko": "YouTube 자막의 명시적 미국 단위를 실시간으로 SI 단위와 함께 표시합니다.",
		version: "0.2.0",
		homepageURL: new URL("https://github.com/scarf005/userscript"),
		supportURL: new URL(
			"https://github.com/scarf005/userscript/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc",
		),
		downloadURL: new URL(
			"https://raw.githubusercontent.com/scarf005/userscript/main/dist/youtube-si-subtitles.user.js",
		),
	},
	resources: {
		match: [
			"https://www.youtube.com/*",
			"https://m.youtube.com/*",
			"https://music.youtube.com/*",
		],
	},
})

const output = resolve(import.meta.dirname!, "../../dist/youtube-si-subtitles.user.js")

const build = async () => {
	const code = await bundleUserScript({ url: import.meta.resolve("./mod.ts"), metadata })
	await Deno.writeTextFile(output, code)
	return code
}

export const userscriptPackage = {
	id: "youtube-si-subtitles",
	buildFile: new URL(import.meta.url),
	output,
	build,
} satisfies UserscriptPackage

if (import.meta.main) {
	await userscriptPackage.build()
}
