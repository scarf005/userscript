// ==UserScript==
// @name         로갤 말머리 태그
// @namespace    https://github.com/scarf005
// @version      0.0.3
// @description  제목별 태그 추가
// @author       scarf005
// @match        https://gall.dcinside.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @homepageURL  https://github.com/scarf005/userscript
// @supportURL   https://github.com/scarf005/userscript/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc
// @downloadURL  https://raw.githubusercontent.com/scarf005/userscript/main/dist/roguelike_tag.user.js
// @license      AGPL-3.0-only
// @grant        GM_addStyle
// ==/UserScript==

{
	"use strict"

	GM_addStyle(/*css*/ `
        span[data-label] {
            color: white;
            display: inline-block;
            font-weight: bold;
            padding: 0.1em 0.5em;
            border-radius: 2em;
            background-color: var(--label-color);
        }

        [data-label="돌죽"] { --label-color: #63200b; }
        [data-label="톰죽"] { --label-color: #9227b0; }
        [data-label="밝밤"] { --label-color: rgb(21, 152, 24); }
        [data-label="dda"] { --label-color: #1c4f3c; }
        [data-label="coq"] { --label-color: #6fa698; }
        [data-label="엘린"] { --label-color: #f5ab7a; }
        [data-label="엘로나"] { --label-color: #d6651a; }
        [data-label="드포"] { --label-color: #f5bf36; }
    `)

	/** @type {(r: RegExp) => RegExp} */
	const re = (r) => new RegExp(`^(${r.source}\\s*\\)?\\s*)`, "i")

	const 돌죽 = re(/(?:돌죽|ㄷㅈ)/)
	const 톰죽 = re(/(?:톰죽|ㅌㅈ|tome4?)/)
	const 밝밤 = re(/(?:카타클|ㅋㅌㅋ)?\s*(?:ㅂㅂ|밝밤|bn)/)
	const dda = re(/(?:카타클|ㅋㅌㅋ)?\s*(?:어둠밤|dda)/)
	const coq = re(/(?:coq|caves of qud|qud)/)
	const 엘린 = re(/엘린/)
	const 엘로나 = re(/엘로나\+?/)
    const 드포 = re(/(?:ㄷㅍ|드포)/)

	const tags = { 돌죽, 톰죽, 밝밤, dda, coq, 엘린, 엘로나, 드포 }

	const tag = () =>
		Array
			.from(document.querySelectorAll("tr.us-post td.gall_tit a:first-child:has(em)"))
			.forEach((el) => {
				const key = Object.entries(tags).find(([, tag]) => tag.test(el.innerText))?.[0]
				if (!key) return

				el.innerHTML = /*html*/ `
                    <span data-label="${key}">${key}</span>
                    ${el.innerText.replace(tags[key], "")}
                `
			})

	const tbody = document.querySelector("tbody")
	const observer = new MutationObserver(tag)

	tag()
	observer.observe(tbody, { childList: true })
}
