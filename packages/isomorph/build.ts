import { resolve } from "https://deno.land/std@0.220.1/path/resolve.ts"

import { bundleUserScript } from "../../build.ts"
import { metadataBlock } from "../../userscript.ts"
import type { UserscriptPackage } from "../types.ts"

const metadata = metadataBlock({
	entries: {
		name: "isoMorph",
		namespace: "https://github.com/scarf005",
		description: "use the superior time unit",
		"description:kr": "웹페이지 날짜 형식을 ISO 8601로 변경합니다.",
		version: "1.0.0",
		icon: new URL("https://www.google.com/s2/favicons?sz=64&domain=github.com"),
		homepageURL: new URL("https://github.com/scarf005/userscript"),
		supportURL: new URL(
			"https://github.com/scarf005/userscript/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc",
		),
		downloadURL: new URL(
			"https://raw.githubusercontent.com/scarf005/userscript/main/dist/isomorph.user.js",
		),
	},
	resources: {
		match: ["*://*/*"],
	},
})

const output = resolve(import.meta.dirname!, "../../dist/isomorph.user.js")

const build = async () => {
	const code = await bundleUserScript({ url: import.meta.resolve("./mod.ts"), metadata })
	await Deno.writeTextFile(output, code)
	return code
}

export const userscriptPackage = {
	id: "isomorph",
	buildFile: new URL(import.meta.url),
	output,
	build,
} satisfies UserscriptPackage

if (import.meta.main) {
	await userscriptPackage.build()
}
