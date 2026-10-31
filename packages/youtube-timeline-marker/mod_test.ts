import { assertEquals } from "https://deno.land/std@0.221.0/assert/assert_equals.ts"
import { chromium } from "npm:playwright"
import { bundleUserScript } from "../../build.ts"
import { metadataBlock } from "../../userscript.ts"
import { findPeak } from "./heatmap.ts"
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

const next = {
	currentVideoEndpoint: { watchEndpoint: { videoId: "abc" } },
	frameworkUpdates: {
		entityBatchUpdate: {
			mutations: [{
				payload: {
					macroMarkersListEntity: {
						markersList: {
							markers: [
								{ startMillis: "0", durationMillis: "10000", intensityScoreNormalized: 0.2 },
								{ startMillis: "40000", durationMillis: "10000", intensityScoreNormalized: 1 },
								{ startMillis: "50000", durationMillis: "10000", intensityScoreNormalized: 0.5 },
							],
						},
					},
				},
			}],
		},
	},
}

Deno.test("finds the most replayed marker", () => {
	assertEquals(findPeak(next), { start: 40, end: 50 })
})

Deno.test("returns no peak without heatmap markers", () => {
	assertEquals(findPeak({ markersList: { markers: [] } }), undefined)
	assertEquals(findPeak(null), undefined)
})

Deno.test({
	name: "Playwright integration test: marks matching captions on the progress bar",
	fn: async () => {
		const userscriptCode = await bundleUserScript({
			url: import.meta.resolve("./mod.ts"),
			metadata: metadataBlock({
				entries: {
					name: "YouTube timeline marker test",
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
				if (url.pathname === "/youtubei/v1/next") {
					return route.fulfill({ contentType: "application/json", body: JSON.stringify(next) })
				}
				return url.pathname === "/api/timedtext"
					? route.fulfill({ contentType: "application/json", body: json3 })
					: route.fulfill({
						contentType: "text/html",
						body:
							`<div class="html5-video-player"><video class="html5-main-video"></video><div class="ytp-right-controls"></div><div class="ytp-progress-bar" style="position:relative;width:600px;height:5px"></div></div>`,
					})
			})
			await page.addInitScript(userscriptCode)
			await page.goto("https://www.youtube.com/watch?v=abc")
			await page.evaluate(async () => {
				const video = document.querySelector("video")!
				Object.defineProperty(video, "duration", { value: 100 })
				await fetch("/api/timedtext?v=abc&lang=ko&fmt=json3")
				await fetch("/youtubei/v1/next")
			})

			await page.waitForSelector("#timeline-marker-markers > div", { timeout: 5000 })
			const markers = await page.$$eval(
				"#timeline-marker-markers > div",
				(elements) => elements.map((element) => (element as HTMLElement).style.left),
			)
			assertEquals(markers, ["40%", "30%", "60%"])

			page.once("dialog", (dialog) => dialog.accept("Scare"))
			await page.click("#timeline-marker-pattern")
			await page.waitForFunction(() =>
				document.querySelectorAll("#timeline-marker-markers > div").length === 2
			)
			assertEquals(
				await page.$$eval(
					"#timeline-marker-markers > div",
					(elements) => elements.map((element) => (element as HTMLElement).style.left),
				),
				["40%", "60%"],
			)
		} finally {
			await browser.close()
		}
	},
})

Deno.test({
	name: "Playwright integration test: turns CC on to collect captions, then off again",
	fn: async () => {
		const userscriptCode = await bundleUserScript({
			url: import.meta.resolve("./mod.ts"),
			metadata: metadataBlock({
				entries: {
					name: "YouTube timeline marker test",
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
							`<div class="html5-video-player"><video class="html5-main-video"></video><button class="ytp-subtitles-button" aria-pressed="false"></button><div class="ytp-right-controls"></div><div class="ytp-progress-bar" style="position:relative;width:600px;height:5px"></div></div>`,
					})
			})
			await page.addInitScript(userscriptCode)
			await page.goto("https://www.youtube.com/watch?v=abc")
			await page.evaluate(() => {
				const video = document.querySelector("video")!
				Object.defineProperty(video, "duration", { value: 100 })
				const button = document.querySelector(".ytp-subtitles-button")!
				button.addEventListener("click", () => {
					const on = button.getAttribute("aria-pressed") !== "true"
					button.setAttribute("aria-pressed", String(on))
					if (on) fetch("/api/timedtext?v=abc&lang=ko&fmt=json3")
				})
			})

			await page.waitForSelector("#timeline-marker-markers > div", { timeout: 5000 })
			await page.waitForFunction(() =>
				document.querySelector(".ytp-subtitles-button")!.getAttribute("aria-pressed") === "false"
			)
		} finally {
			await browser.close()
		}
	},
})
