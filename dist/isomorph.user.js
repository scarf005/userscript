// ==UserScript==
// @name        isomorph
// @namespace   https://github.com/scarf005
// @description use the superior time unit
// @description:ko-KR 웹페이지 날짜 형식을 ISO 8601로 변경합니다.
// @author      scarf
// @version     1.0.0
// @icon        https://www.google.com/s2/favicons?sz=64&domain=github.com
//
// @match       *://*/*
// @exclude-match *://*.github.com/*
// @license      AGPL-3.0-only
// @grant        GM_addStyle
// ==/UserScript==

{
	"use strict"

	/** @type {(s: Date) => string} */
	const toISODate = (s) => s.toISOString().split("T")[0]

	/** @type {(s: Date) => string} */
	const toISODateTime = (s) => s.toISOString().split(".")[0].replace("T", " ")

	/** @type {(el: HTMLElement, s: string) => void} */
	const replaceText = (el, s) =>
		Array.from(el.childNodes)
			.filter((node) => node.nodeType === Node.TEXT_NODE)
			.forEach((node) => node.textContent = s)

	/** @type {Record<string, string>} */
	const monthname = {
		"January": "01",
		"February": "02",
		"March": "03",
		"April": "04",
		"May": "05",
		"June": "06",
		"July": "07",
		"August": "08",
		"September": "09",
		"October": "10",
		"November": "11",
		"December": "12",
	}

	/**
	 * `30 January 2023 @ 19:06 UTC` -> `2023-01-30T19:06:00.000Z`
	 * @type {(s: string) => Date} */
	const parseItch = (s) => {
		const [date, time] = s.split(" @ ")
		const [day, month, year] = date.split(" ")
		const [hour, minute] = time.replace(" UTC", "").split(":")

		return new Date(`${year}-${monthname[month]}-${day}T${hour}:${minute}:00.000Z`)
	}

	/** @type {({ xs, fn }: {
	 *      getTime: (x: HTMLElement) => Date
	 *      fn?: (x: HTMLElement, time: Date) => void
	 *      xs: NodeListOf<HTMLElement>}) => void}
	 */
	const isoMorph = ({ getTime, xs, fn = (el, time) => void (el.innerText = toISODate(time)) }) =>
		Array.from(xs)
			.forEach((el) => {
				const datetime = getTime(el)
				fn(el, datetime)
				el.setAttribute("data-isomorph", "true")
			})

	isoMorph({
		xs: document.querySelectorAll("time"),
		getTime: (el) => new Date(el.getAttribute("datetime") || el.innerText),
	})

	/**
	 * `<abbr title="30 January 2023 @ 19:06 UTC"><span class="icon icon-stopwatch" aria-hidden="true"></span> Jan 30, 2023</abbr>`
	 */
	if (location.hostname.endsWith("itch.io")) {
		isoMorph({
			xs: document.querySelectorAll("abbr[title]"),
			getTime: (el) => parseItch(/** @type {string} */ (el.getAttribute("title"))),
			fn: (el, time) => {
				console.log(el)
				el.setAttribute("title", toISODateTime(time))
				replaceText(el, toISODate(time))
			},
		})
	}
}
