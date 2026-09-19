import { assertEquals } from "https://deno.land/std@0.221.0/assert/assert_equals.ts"
import { chromium } from "npm:playwright"
import { bundleUserScript } from "../../build.ts"
import { metadataBlock } from "../../userscript.ts"
import { convertYouTubeLinks, videoIdFromYouTubeUrl } from "./youtube.ts"

const thumbnail = "https://img.youtube.com/vi/0N1ZOuFkYdI/0.jpg"
const markdown = `[![](${thumbnail})](https://www.youtube.com/watch?v=0N1ZOuFkYdI)`

Deno.test("converts a YouTube watch URL to thumbnail Markdown", () => {
	assertEquals(convertYouTubeLinks("https://www.youtube.com/watch?v=0N1ZOuFkYdI"), markdown)
})

Deno.test("supports short, Shorts, embed, and live YouTube URLs", () => {
	assertEquals(videoIdFromYouTubeUrl("https://youtu.be/0N1ZOuFkYdI"), "0N1ZOuFkYdI")
	assertEquals(videoIdFromYouTubeUrl("https://www.youtube.com/shorts/0N1ZOuFkYdI"), "0N1ZOuFkYdI")
	assertEquals(videoIdFromYouTubeUrl("https://www.youtube.com/embed/0N1ZOuFkYdI"), "0N1ZOuFkYdI")
	assertEquals(videoIdFromYouTubeUrl("https://www.youtube.com/live/0N1ZOuFkYdI"), "0N1ZOuFkYdI")
})

Deno.test("keeps unrelated and invalid URLs unchanged", () => {
	const value = "https://example.com https://www.youtube.com/watch?v=invalid"
	assertEquals(convertYouTubeLinks(value), value)
	assertEquals(videoIdFromYouTubeUrl("https://www.youtube.com/channel/0N1ZOuFkYdI"), null)
})

Deno.test("converts links in surrounding text and preserves punctuation", () => {
	assertEquals(
		convertYouTubeLinks("Watch this: https://www.youtube.com/watch?v=0N1ZOuFkYdI."),
		`Watch this: ${markdown}.`,
	)
})

Deno.test({
	name: "Playwright integration test: converts a pasted link in a textarea",
	fn: async () => {
		const userscriptCode = await bundleUserScript({
			url: import.meta.resolve("./mod.ts"),
			metadata: metadataBlock({
				entries: {
					name: "GitHub YouTube thumbnail paste test",
					description: "test description",
					version: "0.1.0",
					homepageURL: new URL("https://example.com/homepage"),
					supportURL: new URL("https://example.com/support"),
					downloadURL: new URL("https://example.com/download"),
				},
				resources: { match: ["https://github.com/*"] },
			}),
		})

		const browser = await chromium.launch({ headless: true })
		try {
			const page = await browser.newPage()
			await page.addInitScript(userscriptCode)
			await page.goto("data:text/html,<textarea></textarea>")

			const result = await page.evaluate(() => {
				const textarea = document.querySelector("textarea")!
				const dataTransfer = new DataTransfer()
				dataTransfer.setData("text/plain", "https://www.youtube.com/watch?v=0N1ZOuFkYdI")
				const event = new ClipboardEvent("paste", {
					bubbles: true,
					cancelable: true,
					clipboardData: dataTransfer,
				})
				textarea.dispatchEvent(event)
				return { value: textarea.value, defaultPrevented: event.defaultPrevented }
			})

			assertEquals(result, {
				value: markdown,
				defaultPrevented: true,
			})
		} finally {
			await browser.close()
		}
	},
})
