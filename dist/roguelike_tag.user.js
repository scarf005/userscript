// ==UserScript==
// @name         로갤 말머리 태그
// @namespace    https://github.com/scarf005
// @version      0.1.1
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
	const reTag = (r) => new RegExp(`^(${r.source}\\s*?(?:\\)|\\s)\\s*)`, "i")

	/** @type {(html: string) => Element} */
	const fromHTML = (html) => {
		const template = document.createElement("template")

		template.innerHTML = html
		return template.content.children[0]
	}

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
        :root { --label-color: black; }
        ${colors}

        legend,
        span[data-label],
        input[type="radio"]+label {
            font-size: var(--label-size);
            line-height: var(--label-size);
        }

        span[data-label],
        input[type="radio"]+label {
            color: white;
            display: inline-block;
            font-weight: bold;
            padding: 0.1em 0.5em;
            border-radius: 2em;
        }

        span[data-label] {
            --label-size: 1em;
            background-color: var(--label-color);
        }

        legend,
        input[type="radio"]+label { --label-size: 1.2em; }

        input[type="radio"] { display: none; }
        input[type="radio"]+label { background-color: gray; }
        input[type="radio"]:checked+label { background-color: var(--label-color); }

        fieldset#말머리 {
            display: flex;
            align-items: center;
            gap: 0.2em;
        }

        legend {
            float: left;
            padding: 0.5em 1em;
            font-weight: bold;
            background-color: #eee;
        }

        @media (width > 768px) {
            fieldset#말머리 {
                margin-top: 1em;
                padding-right: 1em;
                width: max-content;
                border: 1px solid #cecdce;
            }
        }

        @media (width <= 768px) {
            legend { display: none; }
            fieldset#말머리 {
                flex-wrap: wrap;
                border: none;
                width: 100%;
                padding: 0.2em;
            }
        }
    `)

	const fieldset = () =>
		fromHTML(/*html*/ `
        <fieldset id="말머리">
            <legend>말머리</legend>
            <input type="radio" name="말머리" value="" id="일반" checked />
            <label for="일반">일반</label>
            ${
			Object.keys(tags)
				.map((key) => /*html*/ `
                <input type="radio" name="말머리" value="${key}" id="${key}" />
                <label for="${key}" data-label="${key}">${key}</label>
            `).join("")
		}
        </fieldset>`)

	// https://gall.dcinside.com/board/write
	// https://m.dcinside.com/write/rlike
	if (location.pathname.includes("write")) {
		const titleInput = document.querySelector("input[name=subject]")
		const titleHover = document.querySelector("label[for=subject]")
		if (titleInput) {
			const tagRadio = fieldset()

			const strictTags = Object.keys(tags).map((key) => new RegExp(`^${key}\\)\\s*`, "i"))

			const removeTag = () => {
				titleInput.value = strictTags.reduce((acc, re) => acc.replace(re, ""), titleInput.value)
			}

			tagRadio.addEventListener("change", (e) => {
				const target = e.target
				if (!(target instanceof HTMLInputElement && target.checked)) return
				if (titleHover) titleHover.innerText = ""

				const value = target.value
				removeTag()

				if (value.length === 0) return
				titleInput.value = `${value}) ${titleInput.value}`
			})

			document.querySelector("fieldset:has(input[name=subject]),#placeholder0")
				?.insertAdjacentElement("afterend", tagRadio)
		}
	}

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

	const tbody = document.querySelector("tbody")
	if (tbody) {
		tag()

		const observer = new MutationObserver(tag)

		observer.observe(tbody, { childList: true })
	}
}
