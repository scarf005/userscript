import { resolve } from "https://deno.land/std@0.220.1/path/resolve.ts"

import { bundleUserScript } from "../../build.ts"
import { metadataBlock } from "../../userscript.ts"

const metadata = metadataBlock({
	entries: {
		name: "itch.io jam screenshot gallery",
		"name:ko": "itch.io 잼 스크린샷 갤러리",
		namespace: "https://github.com/scarf005",
		description: "open jam screenshots in an in-page gallery with keyboard and click navigation",
		"description:ko": "itch.io 잼 스크린샷을 페이지 안 갤러리로 열고 키보드와 클릭으로 넘깁니다.",
		version: "0.1.0",
		homepageURL: new URL("https://github.com/scarf005/userscript"),
		supportURL: new URL(
			"https://github.com/scarf005/userscript/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc",
		),
		downloadURL: new URL(
			"https://raw.githubusercontent.com/scarf005/userscript/main/dist/itch-jam-gallery.user.js",
		),
	},
	resources: {
		match: ["https://itch.io/*"],
	},
})

if (import.meta.main) {
	const code = await bundleUserScript({ url: import.meta.resolve("./mod.ts"), metadata })
	await Deno.writeTextFile(
		resolve(import.meta.dirname!, "../../dist/itch-jam-gallery.user.js"),
		code,
	)
}
