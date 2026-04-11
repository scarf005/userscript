import lume from "lume/mod.ts"
import basePath from "lume/plugins/base_path.ts"
import multilanguage from "lume/plugins/multilanguage.ts"
import pagefind from "lume/plugins/pagefind.ts"
import relativeUrls from "lume/plugins/relative_urls.ts"
import { buildUserscripts } from "./packages/build.ts"

const site = lume({
	src: "./web",
	dest: "./_site",
	location: new URL("https://scarf005.github.io/userscript/"),
})

site.add("assets")
site.add("favicon.svg")

site.use(basePath())

site.use(multilanguage({
	languages: ["en", "ko"],
	defaultLanguage: "en",
}))

site.use(pagefind({
	ui: {
		containerId: "pagefind-search",
		showImages: false,
		excerptLength: 0,
		showEmptyFilters: true,
		showSubResults: false,
		resetStyles: true,
	},
	indexing: {
		rootSelector: "html",
		verbose: false,
	},
}))

const isPackageChange = (file: string) => {
	return file.includes("/packages/") || file.includes("\\packages\\") ||
		file.endsWith("/build.ts") || file.endsWith("\\build.ts") ||
		file.endsWith("/userscript.ts") || file.endsWith("\\userscript.ts") ||
		file.endsWith("/langauge.ts") || file.endsWith("\\langauge.ts")
}

const syncPackages = async () => {
	await buildUserscripts()
}

site.addEventListener("beforeBuild", syncPackages)
site.addEventListener("beforeUpdate", ({ files }) => {
	if (Array.from(files).some(isPackageChange)) {
		return syncPackages()
	}
})

site.use(relativeUrls())

export default site
