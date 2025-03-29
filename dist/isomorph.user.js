// ==UserScript==
// @icon           https://www.google.com/s2/favicons?sz=64&domain=github.com
// @license        AGPL-3.0-only
// @name           isoMorph
// @namespace      https://github.com/scarf005
// @description    use the superior time unit
// @description:kr 웹페이지 날짜 형식을 ISO 8601로 변경합니다.
// @version        1.0.0
// @homepageURL    https://github.com/scarf005/userscript
// @supportURL     https://github.com/scarf005/userscript/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc
// @downloadURL    https://raw.githubusercontent.com/scarf005/userscript/main/dist/isomorph.user.js
// @match          *://*/*
// ==/UserScript==
{
	"use strict"
	const toISODate = (s) => s.toISOString().split("T")[0]
	const toISODateTime = (s) => s.toISOString().split(".")[0].replace("T", " ")
	const replaceText = (el, s) =>
		Array.from(el.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE).forEach((node) =>
			node.textContent = s
		)
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
	const parseItch = (s) => {
		const [date, time] = s.split(" @ ")
		const [day, month, year] = date.split(" ")
		const [hour, minute] = time.replace(" UTC", "").split(":")
		return new Date(`${year}-${monthname[month]}-${day}T${hour}:${minute}:00.000Z`)
	}
	const isoMorphRaw = ({ xs, fn }) =>
		xs.forEach((el) => {
			fn(el)
			el.setAttribute("data-isomorph", "true")
		})
	const isoMorph = ({ getTime, xs, fn = (el, time) => void (el.innerText = toISODate(time)) }) =>
		Array.from(xs).forEach((el) => {
			const datetime = getTime(el)
			fn(el, datetime)
			el.setAttribute("data-isomorph", "true")
		})
	isoMorph({
		xs: document.querySelectorAll("time"),
		getTime: (el) => new Date(el.getAttribute("datetime") || el.innerText),
	})
	if (location.hostname.endsWith("itch.io")) {
		isoMorph({
			xs: document.querySelectorAll("abbr[title]"),
			getTime: (el) => parseItch(el.getAttribute("title")),
			fn: (el, time) => {
				console.log(el)
				el.setAttribute("title", toISODateTime(time))
				replaceText(el, toISODate(time))
			},
		})
	}
	if (location.hostname.endsWith("github.com")) {
		const github = () => {
			isoMorphRaw({
				xs: document.querySelectorAll("relative-time"),
				fn: (el) => el.setAttribute("lang", "ko-KR"),
			})
			isoMorph({
				xs: document.querySelectorAll(
					`div.TimelineItem-body > h3,h3[data-testid="commit-group-title"]`,
				),
				getTime: (el) => new Date(el.innerText.split("Commits on ")[1]),
				fn: (el, time) => {
					console.log(el)
					replaceText(el, `Commits on ${toISODate(time)}`)
				},
			})
		}
		github()
		globalThis.addEventListener("turbo:render", github)
	}
}
