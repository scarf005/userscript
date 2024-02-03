// ==UserScript==
// @name         로갤 말머리 태그
// @namespace    https://github.com/scarf005
// @version      0.0.4
// @description  제목별 태그 추가
// @author       scarf005
// @match        https://gall.dcinside.com/*
// @match        https://m.dcinside.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @homepageURL  https://github.com/scarf005/userscript
// @supportURL   https://github.com/scarf005/userscript/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc
// @downloadURL  https://raw.githubusercontent.com/scarf005/userscript/main/dist/roguelike_tag.user.js
// @license      AGPL-3.0-only
// @grant        GM_addStyle
// ==/UserScript==

{
	"use strict"

	/** @type {<T, O, K extends string>(record: Readonly<Record<K, T>>, fn: (value: T, key: K) => O) => Record<K, O>} */
	const mapValues = (record, fn) =>
		// @ts-ignore: using typescript on js is hard
		Object.fromEntries(Object.entries(record).map(([k, v]) => [k, fn(v)]))

	/** @type {(r: RegExp) => RegExp} */
	const reTag = (r) => new RegExp(`^(${r.source}\\s*\\)?\\s*)`, "i")

	/** @type {Record<string, { re: RegExp, color: string }>} */
	const tags = mapValues({
		돌죽: { re: /(?:돌죽|ㄷㅈ)/, color: "#63200b" },
		톰죽: { re: /(?:톰죽|ㅌㅈ|tome4?)/, color: "#9227b0" },
		밝밤: { re: /(?:카타클|ㅋㅌㅋ)?\s*(?:ㅂㅂ|밝밤|bn)/, color: "#2db53d" },
		dda: { re: /(?:카타클|ㅋㅌㅋ)?\s*(?:어둠밤|dda)/, color: "#1c4f3c" },
		coq: { re: /(?:coq|caves of qud|qud)/, color: "#6fa698" },
		엘린: { re: /엘린/, color: "#f5ab7a" },
		엘로나: { re: /엘로나\+?/, color: "#d6651a" },
		드포: { re: /(?:ㄷㅍ|드포)/, color: "#f5bf36" },
	}, ({ re, color }) => ({ re: reTag(re), color }))

	const colors = Object.entries(tags)
		.map(([key, { color }]) => /*css*/ `[data-label="${key}"] { --label-color: ${color}; }`)
		.join("\n")

	GM_addStyle(/*css*/ `
        span[data-label] {
            color: white;
            display: inline-block;
            font-weight: bold;
            padding: 0.1em 0.5em;
            border-radius: 2em;
            background-color: var(--label-color);
        }

        ${colors}
    `)

	const tag = () =>
		Array
			.from(
				document.querySelectorAll("tr.us-post td.gall_tit a:first-child:has(em),span.subjectin"),
			)
			.flatMap((el) => {
				const search = Object.entries(tags).find(([, { re }]) => re.test(el.innerText))
				if (!search) return []

				const [key, { re }] = search
				return [{ el, key, re }]
			})
			.forEach(({ el, key, re }) => {
				el.innerHTML = /*html*/ `
                    <span data-label="${key}">${key}</span>
                    ${el.innerText.replace(re, "")}
                `
			})

	tag()

	const tbody = document.querySelector("tbody")
	if (tbody) {
		const observer = new MutationObserver(tag)

		observer.observe(tbody, { childList: true })
	}
}
