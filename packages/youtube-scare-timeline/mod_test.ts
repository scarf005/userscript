import { assertEquals } from "https://deno.land/std@0.221.0/assert/assert_equals.ts"
import { chromium } from "npm:playwright"
import { bundleUserScript } from "../../build.ts"
import { metadataBlock } from "../../userscript.ts"
import { compilePattern, defaultPattern, findWarnings, parseCaptions } from "./captions.ts"

const json3 = JSON.stringify({
	events: [
		{ tStartMs: 1000, segs: [{ utf8: "안녕하세요" }] },
		{ tStartMs: 30000, segs: [{ utf8: "깜놀 " }, { utf8: "주의" }] },
		{ tStartMs: 30400, segs: [{ utf8: "깜놀주의" }] },
		{ tStartMs: 60000, segs: [{ utf8: "Jump  Scare ahead" }] },
		{ tStartMs: 70000 },
	],
})

Deno.test("parses json3 events and skips empty ones", () => {
	assertEquals(parseCaptions(json3).map((cue) => cue.start), [1, 30, 30.4, 60])
})

Deno.test("parses srv3 XML cues", () => {
	const xml =
		`<timedtext><body><p t="5000" d="1000"><s>깜놀주의</s></p><p t="6000"></p></body></timedtext>`
	assertEquals(parseCaptions(xml), [{ start: 5, text: "깜놀주의" }])
})

Deno.test("returns no cues for malformed bodies", () => {
	assertEquals(parseCaptions("{broken"), [])
})

Deno.test("finds matching cues and dedupes within the same second", () => {
	const warnings = findWarnings(parseCaptions(json3), compilePattern(null))
	assertEquals(warnings.map((cue) => cue.start), [30, 60])
})

Deno.test("falls back to the default pattern for an invalid custom regex", () => {
	assertEquals(compilePattern("(").source, defaultPattern)
	assertEquals(compilePattern("안녕").test("안녕하세요"), true)
})

Deno.test({
	name: "Playwright integration test: marks matching captions on the progress bar",
	fn: async () => {
		const userscriptCode = await bundleUserScript({
			url: import.meta.resolve("./mod.ts"),
			metadata: metadataBlock({
				entries: {
					name: "YouTube scare timeline test",
					description: "test description",
					version: "0.1.0",
					homepageURL: new URL("https://example.com/homepage"),
					supportURL: new URL("https://example.com/support"),
					downloadURL: new URL("https://example.com/download"),
				},
				resources: { match: ["https://www.youtube.com/*"] },
			}),
		})

		const browser = await chromium.launch({ headless: true })
		try {
			const page = await browser.newPage()
			await page.route("https://www.youtube.com/**", (route) => {
				const url = new URL(route.request().url())
				return url.pathname === "/api/timedtext"
					? route.fulfill({ contentType: "application/json", body: json3 })
					: route.fulfill({
						contentType: "text/html",
						body:
							`<div class="html5-video-player"><video class="html5-main-video"></video><div class="ytp-progress-bar" style="position:relative;width:600px;height:5px"></div></div>`,
					})
			})
			await page.addInitScript(userscriptCode)
			await page.goto("https://www.youtube.com/watch?v=abc")
			await page.evaluate(async () => {
				const video = document.querySelector("video")!
				Object.defineProperty(video, "duration", { value: 100 })
				await fetch("/api/timedtext?v=abc&lang=ko&fmt=json3")
			})

			await page.waitForSelector("#scare-timeline-markers > div", { timeout: 5000 })
			const markers = await page.$$eval(
				"#scare-timeline-markers > div",
				(elements) => elements.map((element) => (element as HTMLElement).style.left),
			)
			assertEquals(markers, ["30%", "60%"])
		} finally {
			await browser.close()
		}
	},
})
