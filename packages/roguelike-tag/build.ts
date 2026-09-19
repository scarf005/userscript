import { resolve } from "https://deno.land/std@0.220.1/path/resolve.ts"

import { bundleUserScript } from "../../build.ts"
import { metadataBlock } from "../../userscript.ts"
import type { UserscriptPackage } from "../types.ts"

const metadata = metadataBlock({
	entries: {
		name: "로갤 말머리 태그",
		author: "scarf005",
		namespace: "https://github.com/scarf005",
		description: "제목별 태그 및 말머리 추가",
		version: "0.5.1",
		homepageURL: new URL("https://github.com/scarf005/userscript"),
		supportURL: new URL(
			"https://github.com/scarf005/userscript/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc",
		),
		downloadURL: new URL(
			"https://scarf005.github.io/userscript/dist/roguelike_tag.user.js",
		),
	},
	resources: {
		match: ["https://gall.dcinside.com/*", "https://m.dcinside.com/*/rlike*"],
		grant: ["GM_addStyle"],
	},
})

const output = resolve(import.meta.dirname!, "../../web/dist/roguelike_tag.user.js")

const build = async () => {
	const code = await bundleUserScript({ url: import.meta.resolve("./mod.js"), metadata })
	await Deno.writeTextFile(output, code)
	return code
}

export const userscriptPackage = {
	id: "roguelike_tag",
	buildFile: new URL(import.meta.url),
	output,
	build,
} satisfies UserscriptPackage

if (import.meta.main) {
	await userscriptPackage.build()
}
