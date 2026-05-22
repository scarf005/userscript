import { resolve } from "https://deno.land/std@0.220.1/path/resolve.ts"

import { bundleUserScript } from "../../build.ts"
import { metadataBlock } from "../../userscript.ts"
import type { UserscriptPackage } from "../types.ts"

const metadata = metadataBlock({
	entries: {
		name: "dcinside external link warning bypass",
		"name:ko": "디시인사이드 외부 링크 경고 우회",
		namespace: "https://github.com/scarf005",
		description: "open external links on dcinside directly without the warning modal",
		"description:ko": "디시인사이드 외부 링크를 경고 모달 없이 바로 엽니다.",
		version: "0.1.0",
		homepageURL: new URL("https://github.com/scarf005/userscript"),
		supportURL: new URL(
			"https://github.com/scarf005/userscript/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc",
		),
		downloadURL: new URL(
			"https://raw.githubusercontent.com/scarf005/userscript/main/dist/dcinside-outlink-bypass.user.js",
		),
		"run-at": "document-start",
	},
	resources: {
		match: ["https://*.dcinside.com/*"],
	},
})

const output = resolve(import.meta.dirname!, "../../dist/dcinside-outlink-bypass.user.js")

const build = async () => {
	const code = await bundleUserScript({ url: import.meta.resolve("./mod.ts"), metadata })
	await Deno.writeTextFile(output, code)
	return code
}

export const userscriptPackage = {
	id: "dcinside-outlink-bypass",
	buildFile: new URL(import.meta.url),
	output,
	build,
} satisfies UserscriptPackage

if (import.meta.main) {
	await userscriptPackage.build()
}
