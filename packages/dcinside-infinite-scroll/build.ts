import { resolve } from "https://deno.land/std@0.220.1/path/resolve.ts"

import { bundleUserScript } from "../../build.ts"
import { metadataBlock } from "../../userscript.ts"
import type { UserscriptPackage } from "../types.ts"

const metadata = metadataBlock({
	entries: {
		name: "dcinside gallery infinite scroll",
		"name:ko": "디시인사이드 갤러리 무한 스크롤",
		namespace: "https://github.com/scarf005",
		description: "append dcinside gallery list pages every 3 seconds while enabled",
		"description:ko":
			"켜져 있는 동안 디시인사이드 갤러리 목록 다음 페이지를 3초마다 이어 붙입니다.",
		version: "0.1.0",
		homepageURL: new URL("https://github.com/scarf005/userscript"),
		supportURL: new URL(
			"https://github.com/scarf005/userscript/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc",
		),
		downloadURL: new URL(
			"https://raw.githubusercontent.com/scarf005/userscript/main/dist/dcinside-infinite-scroll.user.js",
		),
	},
	resources: {
		match: [
			"https://gall.dcinside.com/board/lists/*",
			"https://gall.dcinside.com/*/board/lists/*",
		],
	},
})

const output = resolve(import.meta.dirname!, "../../dist/dcinside-infinite-scroll.user.js")

const build = async () => {
	const code = await bundleUserScript({ url: import.meta.resolve("./mod.ts"), metadata })
	await Deno.writeTextFile(output, code)
	return code
}

export const userscriptPackage = {
	id: "dcinside-infinite-scroll",
	buildFile: new URL(import.meta.url),
	output,
	build,
} satisfies UserscriptPackage

if (import.meta.main) {
	await userscriptPackage.build()
}
