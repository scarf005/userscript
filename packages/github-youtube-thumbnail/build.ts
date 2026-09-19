import { resolve } from "https://deno.land/std@0.220.1/path/resolve.ts"

import { bundleUserScript } from "../../build.ts"
import { metadataBlock } from "../../userscript.ts"
import type { UserscriptPackage } from "../types.ts"

const metadata = metadataBlock({
	entries: {
		name: "GitHub YouTube thumbnail paste",
		"name:ko": "GitHub YouTube 썸네일 붙여넣기",
		namespace: "https://github.com/scarf005",
		description: "convert pasted YouTube video links into clickable thumbnail Markdown on GitHub",
		"description:ko":
			"GitHub에 YouTube 동영상 링크를 붙여넣으면 클릭 가능한 썸네일 Markdown으로 변환합니다.",
		version: "0.1.1",
		homepageURL: new URL("https://github.com/scarf005/userscript"),
		supportURL: new URL(
			"https://github.com/scarf005/userscript/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc",
		),
		downloadURL: new URL(
			"https://scarf005.github.io/userscript/dist/github-youtube-thumbnail.user.js",
		),
	},
	resources: {
		match: ["https://github.com/*"],
	},
})

const output = resolve(import.meta.dirname!, "../../web/dist/github-youtube-thumbnail.user.js")

const build = async () => {
	const code = await bundleUserScript({ url: import.meta.resolve("./mod.ts"), metadata })
	await Deno.writeTextFile(output, code)
	return code
}

export const userscriptPackage = {
	id: "github-youtube-thumbnail",
	buildFile: new URL(import.meta.url),
	output,
	build,
} satisfies UserscriptPackage

if (import.meta.main) {
	await userscriptPackage.build()
}
