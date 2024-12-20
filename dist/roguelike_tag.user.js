// ==UserScript==
// @name         로갤 말머리 태그
// @namespace    https://github.com/scarf005
// @version      0.4.0
// @description  제목별 태그 및 말머리 추가
// @author       scarf005
// @match        https://gall.dcinside.com/*
// @match        https://m.dcinside.com/*/rlike*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @homepageURL  https://github.com/scarf005/userscript
// @supportURL   https://github.com/scarf005/userscript/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc
// @downloadURL  https://raw.githubusercontent.com/scarf005/userscript/main/dist/roguelike_tag.user.js
// @license      AGPL-3.0-only
// @grant        GM_addStyle
// ==/UserScript==

// @ts-check
const main = () => {
	"use strict"

	/** @type {(html: string) => Element} */
	const fromHTML = (html) => {
		const template = document.createElement("template")

		template.innerHTML = html
		return template.content.children[0]
	}

	/** @type {Map<string, string>} */
	const rgbCache = new Map()
	const salt = "asdf"

	/**
	 * hashes given string into random RGB color
	 * @type {(str: string) => string}
	 */
	const hashRGB = (str) => {
		const cache = rgbCache.get(str)
		if (cache) return cache
		const hashed = (str + salt)
			.split("").reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)
		const color = `rgb(${(hashed >> 16) & 0xff},${(hashed >> 8) & 0xff},${hashed & 0xff})`
		rgbCache.set(str, color)
		return color
	}

	/**
	 * @type {<T>(arr: T[], x: number) => [T[], T[]]}
	 */
	const splitAt = (arr, x) => [arr.slice(0, x), arr.slice(x)]

	/** @type {Record<string, RegExp>} */
	const tagPreset = {
		엘린: /ㅇㄹ/,
		돌죽: /ㄷㅈ/,
		톰죽: /(톰죽|ㅌㅈ|tome4?)/,
		밝밤: /(카타클|ㅋㅌㅋ)?\s*(ㅂㅂ|밝밤|bn)/,
		dda: /(카타클|ㅋㅌㅋ)?\s*(어둠밤|dda)/,
		coq: /(coq|caves of qud|qud)/,
		드포: /ㄷㅍ/,
		넷핵: /ㄴㅎ/,
		파토스: /ㅍㅌㅅ/,
		스톤샤드: /ㅅㅌㅅㄷ/,
		콰지모프: /ㅋㅈㅁㅍ|ㅋㅈ/,
	}

	/** @type {(x: string) => string[] | undefined} */
	const parseTags = (x) =>
		tagsRe.exec(x)?.[1].split(",").map((y) => y.trim().toLocaleLowerCase()).map(parseTag)

	const tagsRe = /^([^\)]*)\)\s*/

	/** @type {(x: string) => string} */
	const parseTag = (x) => tagPresetKeys.find((name) => tagPreset[name].test(x)) ?? x
	const tagPresetKeys = Object.keys(tagPreset)

	GM_addStyle(/*css*/ `
        :root { --label-color: black; }

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
            padding: 0.1em 0.4em;
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

        .mal-sw-wrap a[data-label] {
            color: white;
            background-color: var(--label-color);
            padding: 0.1em 0.4em;
            margin: 0.1em;
            border-radius: 2.2em;
        }

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

            td.gall_writer.ub-writer { text-align: left; }
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

	/** @type {(key: string) => string} */
	const attr = (key) => /*html*/ `data-label="${key}" style="--label-color:${hashRGB(key)}"`

	const fieldset = () =>
		fromHTML(/*html*/ `
        <fieldset id="말머리">
            <legend>말머리</legend>
            <input type="radio" name="말머리" value="" id="일반" checked />
            <label for="일반">일반</label>
            ${
			tagPresetKeys
				.map((key) => /*html*/ `
                <input type="radio" name="말머리" value="${key}" id="${key}" />
                <label for="${key}" ${attr(key)}>${key}</label>
            `).join("")
		}
        </fieldset>`)

	const url = new URL(globalThis.location.href)
	const isMobile = url.host === "m.dcinside.com"
	if (
		(isMobile || url.searchParams.get("id") === "rlike") &&
		url.pathname.includes("write")
	) {
		const titleInput = document.querySelector("input[name=subject]")
		const titleHover = document.querySelector("label[for=subject]")
		if (!titleInput) return
		const tagRadio = fieldset()

		const strictTags = tagPresetKeys.map((key) => new RegExp(`^${key}\\)\\s*`, "i"))

		const removeTag = () => {
			titleInput.value = strictTags.reduce(
				(acc, re) => acc.replace(re, ""),
				titleInput.value,
			)
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

	const tag = () =>
		Array
			.from(
				document.querySelectorAll(
					"tr.us-post td.gall_tit a:first-child:has(em),span.subjectin",
				),
			)
			.flatMap((el) => {
				const tags = parseTags(el.innerText)
				return tags ? { el, tags } : []
			})
			.forEach(({ el, tags }) => {
				const labels = tags.map((key) => /*html*/ `<span ${attr(key)}>${key}</span>`)
				const em = el.querySelector("em")?.cloneNode()

				el.innerHTML = /*html*/ `${labels.join("")}${el.innerText.replace(tagsRe, "")}`
				if (em) el.prepend(em)
			})

	/** @type {(keyword: string) => string} */
	const encodeKeyword = (keyword) => encodeURIComponent(`${keyword})`).replaceAll("%", ".")

	/** @type {(keyword: string) => string} */
	const decodeKeyword = (keyword) =>
		decodeURIComponent(keyword.replaceAll(".", "%")).replace(")", "")

	/** @type {(currentKeyword: string) => (keyword: string) => string} */
	const asSearchLink = (currentKeyword) => (keyword) => {
		const searchParams = new URLSearchParams(location.search)
		searchParams.set("s_type", isMobile ? "subject_m" : "search_subject")
		searchParams.set(
			isMobile ? "serval" : "s_keyword",
			isMobile ? `${keyword})` : encodeKeyword(keyword),
		)
		const on = currentKeyword === keyword ? "on" : ""
		return /*html*/ `
            <li class="${isMobile ? "swiper-slide" : ""} ${on}">
                <a
                    class="${on}"
                    ${attr(keyword)}
                    href="${location.pathname}?${searchParams}"
                >${keyword}</a>
            </li>`
	}

	const initKeywordNav = () => {
		const isRoguelike = location.pathname.includes("rlike") || location.search.includes("rlike")
		if (!isRoguelike || document.querySelector(".center_box")) return
		const currentKeyword = decodeKeyword(
			new URLSearchParams(location.search).get(isMobile ? "serval" : "s_keyword") ?? "",
		)
		const searchLinks = tagPresetKeys.map(asSearchLink(currentKeyword))
		const allClass = currentKeyword ? "" : "on"

		const pcLayout = () => {
			const [links, more] = splitAt(searchLinks, 8)

			const moreTemplate = /*html*/ `
                <button
                    type="button"
                    class="btn_subject_more"
                    style="z-index:2;"
                    onclick="showLayer(this,'subject_morelist');return false;"
                >
                    <em class="icon_subject_more sp_img"></em><span class="blind">말머리 더보기</span>
                </button>
                <div class="subject_morelist" id="subject_morelist" style="display:none;">
                    <ul>${more.join("\n")}</ul>
                </div>`

			const template = /*html*/ `
            <div class="center_box">
                <div class="inner">
                    <ul>
                        <li>
                            <a class="${allClass}" onclick="listSearchHead('all')">전체</a>
                        </li>
                        ${links.join("\n")}
                    </ul>
                    ${more.length > 0 ? moreTemplate : ""}
                </div>
            </div>`

			document.querySelector(".array_tab.left_box")?.insertAdjacentHTML("afterend", template)
		}
		const mobileLayout = () => {
			const template = /*html*/ `
            <div class="mal-sw-wrap">
                <div class="detail-sel-box">
                    <div class="mal-slider">
                    <div class="mal-swiper swiper-container swiper-container-horizontal" id="swiper-headtxt">
                        <ul class="mal-lst swiper-wrapper">
                        <li class="swiper-slide ${allClass}"> <a href="javascript:headText_change();">전체</a> </li>
                        ${searchLinks.join("\n")}
                        </ul>
                    </div>
                    </div>
                    <div class="rt"> </div>
                </div>
            </div>
            `
			document.querySelector("section.gall-lst-group.grid  .tab-basic")?.insertAdjacentHTML(
				"afterend",
				template,
			)
		}
		isMobile ? mobileLayout() : pcLayout()
	}

	const tbody = document.querySelector("tbody,ul.gall-detail-lst")
	if (!tbody) return

	initKeywordNav()

	const evilJquerySearchTrigger = document.querySelector("input[name=s_keyword]")
	if (evilJquerySearchTrigger) evilJquerySearchTrigger.value = ""

	const now = performance.now()
	tag()
	console.log(`adding tags took ${Math.round(performance.now() - now)}ms`)

	const observer = new MutationObserver(tag)

	observer.observe(tbody, { childList: true })
}

main()
