import { resolve } from "https://deno.land/std@0.220.1/path/resolve.ts"

import { bundleUserScript } from "../../build.ts"
import { metadataBlock } from "../../userscript.ts"
import type { UserscriptPackage } from "../types.ts"

const metadata = metadataBlock({
	entries: {
		name: "esm.sh links",
		"name:ko": "esm.sh 링크 추가",
		namespace: "https://github.com/scarf005",
		description: "add links to esm.sh imports",
		"description:ko": "esm.sh import 구문에 링크를 추가합니다.",
		version: "0.0.1",
		homepageURL: new URL("https://github.com/scarf005/userscript"),
		supportURL: new URL(
			"https://github.com/scarf005/userscript/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc",
		),
		downloadURL: new URL(
			"https://raw.githubusercontent.com/scarf005/userscript/main/dist/esm.sh.user.js",
		),
	},
	resources: {
		match: ["https://esm.sh/*"],
	},
})

const output = resolve(import.meta.dirname!, "../../dist/esm.sh.user.js")

const build = async () => {
	const code = await bundleUserScript({ url: import.meta.resolve("./mod.ts"), metadata })
	await Deno.writeTextFile(output, code)
	return code
}

export const userscriptPackage = {
	id: "esm.sh",
	buildFile: new URL(import.meta.url),
	output,
	build,
} satisfies UserscriptPackage

if (import.meta.main) {
	await userscriptPackage.build()
}
