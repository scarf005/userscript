import { buildUserscripts } from "./build.ts"
import { userscriptPackages } from "./registry.ts"

const expectedScripts = {
	"dcinside-infinite-scroll": "0.1.2",
	"dcinside-outlink-bypass": "0.1.1",
	"esm.sh": "0.0.2",
	"github-youtube-thumbnail": "0.1.1",
	isomorph: "1.0.1",
	"itch-jam-gallery": "0.1.1",
	roguelike_tag: "0.5.1",
	"youtube-si-subtitles": "0.2.1",
}

Deno.test("builds every userscript for the Pages install URL", async () => {
	await buildUserscripts()

	for (const userscriptPackage of userscriptPackages) {
		const source = await Deno.readTextFile(userscriptPackage.output)
		const expectedVersion = expectedScripts[userscriptPackage.id as keyof typeof expectedScripts]
		const expectedDownloadUrl = `https://scarf005.github.io/userscript/dist/${
			userscriptPackage.output.split("/").at(-1)
		}`

		if (!expectedVersion) {
			throw new Error(`unexpected userscript package: ${userscriptPackage.id}`)
		}

		if (!new RegExp(`^// @version\\s+${expectedVersion}$`, "m").test(source)) {
			throw new Error(`missing version ${expectedVersion} for ${userscriptPackage.id}`)
		}

		if (!new RegExp(`^// @downloadURL\\s+${expectedDownloadUrl}$`, "m").test(source)) {
			throw new Error(`missing Pages download URL for ${userscriptPackage.id}`)
		}

		if (source.includes("raw.githubusercontent.com")) {
			throw new Error(`raw GitHub URL remains in ${userscriptPackage.id}`)
		}
	}
})
