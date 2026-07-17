import { assertEquals } from "https://deno.land/std@0.221.0/assert/assert_equals.ts"
import { isDcinsideHost, resolveHttpUrl, shouldBypassHref } from "./url.ts"
import { chromium } from "npm:playwright"
import { bundleUserScript } from "../../build.ts"
import { metadataBlock } from "../../userscript.ts"

const baseHref = "https://gall.dcinside.com/person/board/view/?id=dororong&no=13945"

Deno.test("isDcinsideHost() accepts dcinside subdomains only", () => {
	assertEquals(isDcinsideHost("dcinside.com"), true)
	assertEquals(isDcinsideHost("gall.dcinside.com"), true)
	assertEquals(isDcinsideHost("m.dcinside.com"), true)
	assertEquals(isDcinsideHost("dcinside.com.evil.test"), false)
})

Deno.test("resolveHttpUrl() resolves absolute and protocol-relative http URLs", () => {
	assertEquals(
		resolveHttpUrl({ href: "https://www.pixiv.net/artworks/142110586", baseHref })?.href,
		"https://www.pixiv.net/artworks/142110586",
	)
	assertEquals(
		resolveHttpUrl({ href: "//www.pixiv.net/artworks/142110586", baseHref })?.href,
		"https://www.pixiv.net/artworks/142110586",
	)
	assertEquals(resolveHttpUrl({ href: "javascript:alert(1)", baseHref }), null)
})

Deno.test("shouldBypassHref() bypasses external links but leaves dcinside links alone", () => {
	assertEquals(
		shouldBypassHref({ href: "https://www.pixiv.net/artworks/142110586", baseHref }),
		true,
	)
	assertEquals(
		shouldBypassHref({ href: "https://gall.dcinside.com/board/view/?id=dcbest&no=1", baseHref }),
		false,
	)
	assertEquals(shouldBypassHref({ href: "/person/board/lists/?id=dororong", baseHref }), false)
})

Deno.test({
	name: "Playwright Integration Test: bypasses dcinside outlink warning",
	fn: async () => {
		const metadata = metadataBlock({
			entries: {
				name: "dcinside external link warning bypass test",
				description: "test description",
				version: "0.1.0",
				"run-at": "document-start",
				downloadURL: new URL("https://example.com/download"),
				supportURL: new URL("https://example.com/support"),
				homepageURL: new URL("https://example.com/homepage"),
			},
			resources: {
				match: ["https://*.dcinside.com/*"],
			},
		})
		const userscriptCode = await bundleUserScript({
			url: import.meta.resolve("./mod.ts"),
			metadata,
		})

		const browser = await chromium.launch({ headless: true })
		try {
			const context = await browser.newContext()
			const page = await context.newPage()

			await page.addInitScript(userscriptCode)
			await page.goto("https://gall.dcinside.com/mgallery/board/view/?id=rimworld&no=849092", {
				waitUntil: "domcontentloaded",
			})

			const linkSelector = ".write_div a[href*='steamcommunity.com']"
			await page.waitForSelector(linkSelector)

			const warningLayerPromise = page.waitForSelector("#outlink_warning_layer, .outlink_warning_host", {
				timeout: 3000,
			}).then(() => true).catch(() => false)

			const popupPromise = page.context().waitForEvent("page", { timeout: 5000 })
				.then((p) => p.url())
				.catch(() => null)

			await page.click(linkSelector)

			const warningAppeared = await warningLayerPromise
			const popupUrl = await popupPromise

			assertEquals(warningAppeared, false, "Warning layer should not have appeared")
			assertEquals(
				popupUrl?.includes("steamcommunity.com"),
				true,
				`Should have navigated to steamcommunity, but got ${popupUrl}`,
			)
		} finally {
			await browser.close()
		}
	},
})

