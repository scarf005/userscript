import { userscriptPackages } from "./registry.ts"

export const buildUserscripts = async () => {
	await Deno.mkdir("./dist", { recursive: true })

	for (const userscriptPackage of userscriptPackages) {
		await userscriptPackage.build()
	}

	await Deno.writeTextFile(
		new URL("../web/_data/package_build.ts", import.meta.url),
		`export default ${Date.now()}\n`,
	)
}

if (import.meta.main) {
	await buildUserscripts()
}
