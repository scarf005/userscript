import { userscriptPackages } from "./registry.ts"

export const buildUserscripts = async () => {
	await Deno.mkdir("./web/dist", { recursive: true })

	for (const userscriptPackage of userscriptPackages) {
		await userscriptPackage.build()
	}
}

if (import.meta.main) {
	await buildUserscripts()
}
