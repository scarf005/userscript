export type UserScriptEntry = {
	id: string
	name: string
	description: string
	version: string
	matches: string[]
	downloadURL: string
	homepageURL?: string
	supportURL?: string
	faviconURL: string
}

type Locale = "en" | "ko"
const guideVersion = "20260222i"

const text = {
	en: {
		lang: "en",
		title: "Userscript Catalog",
		subtitle: "Repository userscripts with one-touch install links.",
		repository: "Repository",
		languageLabel: "Language",
		languageEnglish: "English",
		languageKorean: "Korean",
		quickFilterLabel: "Quick filter",
		quickFilterPlaceholder: "Filter by name, id, or description",
		quickFilterEmpty: "No scripts match this filter.",
		countSuffix: "scripts",
		searchTitle: "Site search",
		searchHint: "Search across script metadata and guide text.",
		installGuideTitle: "Install guide",
		installGuideSteps: [
			'Install a userscript manager extension (<a href="https://violentmonkey.github.io/get-it/" target="_blank" rel="noreferrer">Install manager extension</a>).',
			"Open this catalog and find your target script card.",
			"Press install and approve in your userscript manager.",
			"If a script source page opens, continue with install in your manager dialog.",
		],
		guideVisualTitle: "Step-by-step screenshots",
		guideVisuals: [
			{
				title: "Step 1 · Install manager extension",
				file: `/assets/guide/step-1-manager.webp?v=${guideVersion}`,
			},
			{
				title: "Step 2 · Find script card",
				file: `/assets/guide/step-2-catalog.webp?v=${guideVersion}`,
			},
			{
				title: "Step 3 · Click install button",
				file: `/assets/guide/step-3-install-target.webp?v=${guideVersion}`,
			},
			{
				title: "Step 4 · Violentmonkey install page",
				file: `/assets/guide/step-4-install-source.webp?v=${guideVersion}`,
			},
		],
		metaId: "id",
		metaVersion: "version",
		matches: "matches",
		install: "install",
		support: "support",
	},
	ko: {
		lang: "ko",
		title: "유저스크립트 카탈로그",
		subtitle: "원터치 설치 링크와 함께 제공되는 저장소 유저스크립트 목록입니다.",
		repository: "저장소",
		languageLabel: "언어",
		languageEnglish: "영어",
		languageKorean: "한국어",
		quickFilterLabel: "빠른 필터",
		quickFilterPlaceholder: "이름, id, 설명으로 필터링",
		quickFilterEmpty: "필터 결과가 없습니다.",
		countSuffix: "개 스크립트",
		searchTitle: "사이트 검색",
		searchHint: "스크립트 메타데이터와 가이드 내용을 검색합니다.",
		installGuideTitle: "설치 가이드",
		installGuideSteps: [
			'유저스크립트 매니저 확장을 설치합니다 (<a href="https://violentmonkey.github.io/get-it/" target="_blank" rel="noreferrer">Install manager extension</a>).',
			"카탈로그에서 원하는 스크립트 카드를 찾습니다.",
			"설치 버튼을 누른 뒤 매니저에서 승인합니다.",
			"스크립트 소스 페이지가 열리면 매니저 설치 대화상자를 진행합니다.",
		],
		guideVisualTitle: "스크린샷 단계 안내",
		guideVisuals: [
			{
				title: "1단계 · 매니저 확장 설치",
				file: `/assets/guide/step-1-manager.webp?v=${guideVersion}`,
			},
			{
				title: "2단계 · 카탈로그에서 스크립트 찾기",
				file: `/assets/guide/step-2-catalog.webp?v=${guideVersion}`,
			},
			{
				title: "3단계 · 설치 버튼 클릭",
				file: `/assets/guide/step-3-install-target.webp?v=${guideVersion}`,
			},
			{
				title: "4단계 · Violentmonkey 설치 페이지",
				file: `/assets/guide/step-4-install-source.webp?v=${guideVersion}`,
			},
		],
		metaId: "id",
		metaVersion: "버전",
		matches: "적용 주소",
		install: "설치",
		support: "지원",
	},
} as const

const escapeHtml = (value: string) => {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;")
}

const renderMatches = (matches: string[]) => {
	if (matches.length === 0) return "-"
	return matches.map((match) => `<li>${escapeHtml(match)}</li>`).join("")
}

const renderCard = (script: UserScriptEntry, locale: Locale) => {
	const copy = text[locale]
	const support = script.supportURL
		? `<a href="${
			escapeHtml(script.supportURL)
		}" target="_blank" rel="noreferrer">${copy.support}</a>`
		: ""

	return `
		<li>
			<article class="script-card" data-card data-search="${
		escapeHtml(`${script.name} ${script.description} ${script.id}`.toLowerCase())
	}" data-pagefind-body>
				<header class="card-header">
					<img class="script-favicon" src="${
		escapeHtml(script.faviconURL)
	}" alt="" width="20" height="20" loading="lazy" onerror="this.onerror=null;this.src='https://www.google.com/s2/favicons?sz=64&domain=github.com'">
					<h2>${escapeHtml(script.name)}</h2>
				</header>
				<p>${escapeHtml(script.description)}</p>
				<dl>
					<div><dt>${copy.metaId}</dt><dd>${escapeHtml(script.id)}</dd></div>
					<div><dt>${copy.metaVersion}</dt><dd>${escapeHtml(script.version)}</dd></div>
				</dl>
				<section aria-label="match rules">
					<h3>${copy.matches}</h3>
					<ul class="match-list">${renderMatches(script.matches)}</ul>
				</section>
				<footer class="card-footer">
					<a class="install" href="${escapeHtml(script.downloadURL)}">${copy.install}</a>
					<nav aria-label="script links">${support}</nav>
				</footer>
			</article>
		</li>
	`
}

export const renderCatalogPage = (
	{ userscripts }: { userscripts: UserScriptEntry[] },
	locale: Locale,
) => {
	const copy = text[locale]
	const repoUrl = "https://github.com/scarf005/userscript"
	const languageSwitcher = locale === "en"
		? `<a href="/" aria-current="page" data-lang-link data-lang="en">${copy.languageEnglish}</a><a href="/ko/" data-lang-link data-lang="ko">${copy.languageKorean}</a>`
		: `<a href="/" data-lang-link data-lang="en">${copy.languageEnglish}</a><a href="/ko/" aria-current="page" data-lang-link data-lang="ko">${copy.languageKorean}</a>`
	const cards = userscripts.map((script) => renderCard(script, locale)).join("")
	const visuals = copy.guideVisuals.map((item) => {
		return `<li><figure><figcaption>${item.title}</figcaption><img src="${item.file}" alt="${item.title}" loading="lazy"></figure></li>`
	}).join("")

	return `<!doctype html>
<html lang="${copy.lang}">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>${copy.title}</title>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml">
	<style>
		@import url("https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&family=Noto+Sans+KR:wght@400;500;700&display=swap");

		:root {
			--bg: #f2f2f2;
			--surface: #ffffff;
			--ink: #111111;
			--muted: #565656;
			--line: #111111;
			--accent: #0d6e4f;
			--accent-ink: #ffffff;
			--pagefind-ui-border-radius: 0;
			--pagefind-ui-image-border-radius: 0;
			--pagefind-ui-font: "Fira Code", "Noto Sans KR", "JetBrains Mono", monospace;
			--pagefind-ui-primary: #111111;
			--pagefind-ui-text: #111111;
			--pagefind-ui-background: #ffffff;
			--pagefind-ui-border: #111111;
			--pagefind-ui-tag: #efefef;
			--pagefind-ui-border-width: 1px;
		}

		* {
			box-sizing: border-box;
			border-radius: 0 !important;
			animation: none !important;
			transition: none !important;
		}

		body {
			margin: 0;
			background: var(--bg);
			color: var(--ink);
			font-family: "Fira Code", "Noto Sans KR", "JetBrains Mono", monospace;
			font-feature-settings: "liga" 1, "calt" 1;
			font-variant-ligatures: common-ligatures;
			line-height: 1.45;
		}

		a { color: inherit; }

		.wrapper {
			max-width: 1080px;
			margin: 0 auto;
			padding: 24px 16px 48px;
			display: grid;
			gap: 16px;
		}

		h1 {
			margin: 0;
			font-size: clamp(1.6rem, 3.2vw, 2.5rem);
			font-weight: 700;
		}

		.lang-switch {
			margin-top: 8px;
			display: flex;
			gap: 8px;
			align-items: center;
			font-size: 0.85rem;
		}

		.lang-switch span {
			color: var(--muted);
		}

		.lang-switch a {
			padding: 3px 8px;
			border: 1px solid var(--line);
			text-decoration: none;
			background: var(--surface);
		}

		.lang-switch a[aria-current="page"] {
			background: #111;
			color: #fff;
		}

		.lead {
			margin: 0;
			color: var(--muted);
		}

		.surface {
			border: 1px solid var(--line);
			background: var(--surface);
			padding: 12px;
		}

		.instructions > ol {
			margin: 0;
			padding-left: 22px;
			display: grid;
			gap: 6px;
		}

		.screenshot-guide h3 {
			margin: 12px 0 8px;
			font-size: 1rem;
		}

		.screenshot-guide ol {
			margin: 8px 0 0;
			padding: 0;
			list-style: none;
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 10px;
		}

		.screenshot-guide figure {
			margin: 0;
			display: grid;
			gap: 8px;
		}

		.screenshot-guide img {
			display: block;
			width: 100%;
			height: 180px;
			object-fit: contain;
			background: #fff;
			border: 1px solid var(--line);
		}

		.controls {
			display: grid;
			gap: 8px;
			margin: 0;
		}

		.controls h2 {
			margin: 0;
		}

		label[for="card-filter"] {
			font-size: 0.9rem;
			font-weight: 700;
		}

		#card-filter {
			width: 100%;
			border: 1px solid var(--line);
			padding: 10px;
			min-height: 42px;
			background: var(--surface);
			font: inherit;
		}

		#count,
		.search-hint {
			margin: 0;
			font-size: 0.9rem;
			color: var(--muted);
		}

		#cards {
			list-style: none;
			margin: 0;
			padding: 0;
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
			gap: 12px;
		}

		.controls + #cards {
			margin-top: 14px;
		}

		.script-card {
			height: 100%;
			border: 1px solid var(--line);
			padding: 12px;
			display: flex;
			flex-direction: column;
			gap: 10px;
			background: var(--surface);
		}

		.card-header {
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.script-favicon {
			object-fit: contain;
		}

		.script-card h2,
		.script-card p,
		dl,
		h3,
		.match-list {
			margin: 0;
		}

		dl {
			display: grid;
			gap: 4px;
		}

		dl div {
			display: grid;
			grid-template-columns: 76px 1fr;
			gap: 8px;
		}

		dd {
			margin: 0;
			overflow-wrap: anywhere;
		}

		.match-list {
			margin-top: 8px;
			padding-left: 18px;
			display: grid;
			gap: 4px;
		}

		.card-footer {
			margin-top: auto;
			display: grid;
			gap: 8px;
		}

		.card-footer nav {
			display: flex;
			gap: 10px;
			flex-wrap: wrap;
			font-size: 0.9rem;
		}

		.install {
			display: inline-block;
			padding: 10px 12px;
			border: 1px solid #084332;
			background: var(--accent);
			color: var(--accent-ink);
			text-decoration: none;
			font-weight: 700;
			text-transform: uppercase;
		}

		.empty {
			border: 1px solid var(--line);
			background: var(--surface);
			padding: 12px;
		}

		@media (max-width: 760px) {
			.wrapper {
				padding: 16px 12px 28px;
			}

			.screenshot-guide ol {
				grid-template-columns: 1fr;
			}

			#cards {
				grid-template-columns: 1fr;
			}
		}
	</style>
</head>
<body>
	<div class="wrapper" data-pagefind-body>
		<header class="surface">
			<h1>${copy.title}</h1>
			<p class="lead">${copy.subtitle}</p>
			<p><a href="${repoUrl}" target="_blank" rel="noreferrer">${copy.repository}</a></p>
			<nav class="lang-switch" aria-label="language switcher"><span>${copy.languageLabel}</span>${languageSwitcher}</nav>
		</header>

		<section class="surface instructions" aria-label="installation guide">
			<h2>${copy.installGuideTitle}</h2>
			<ol>${copy.installGuideSteps.map((step) => `<li>${step}</li>`).join("")}</ol>
			<section class="screenshot-guide" aria-label="screenshots">
				<h3>${copy.guideVisualTitle}</h3>
				<ol>${visuals}</ol>
			</section>
		</section>

		<main class="surface" aria-label="userscript list">
			<section class="controls" aria-label="search controls">
				<div>
					<label for="card-filter">${copy.quickFilterLabel}</label>
					<input id="card-filter" type="search" placeholder="${copy.quickFilterPlaceholder}" autocomplete="off">
				</div>
				<p id="count" aria-live="polite">${userscripts.length} ${copy.countSuffix}</p>
				<div>
					<h2>${copy.searchTitle}</h2>
					<p class="search-hint">${copy.searchHint}</p>
					<div id="pagefind-search"></div>
				</div>
			</section>

			<ul id="cards">${cards}</ul>
			<p id="empty" class="empty" hidden>${copy.quickFilterEmpty}</p>
		</main>
	</div>

	<script>
		(() => {
			const langKey = "userscript_lang"
			const path = window.location.pathname
			const normalized = path.endsWith("/") ? path : path + "/"
			const basePath = normalized.startsWith("/userscript/") ? "/userscript" : ""
			const rootPath = basePath + "/"
			const koPath = basePath + "/ko/"

			const readStoredLang = () => {
				try {
					const value = window.localStorage.getItem(langKey)
					return value === "ko" || value === "en" ? value : null
				} catch {
					return null
				}
			}

			const writeStoredLang = (value) => {
				try {
					window.localStorage.setItem(langKey, value)
				} catch {
					return
				}
			}

			const detectBrowserLang = () => {
				return window.navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en"
			}

			const preferredLang = readStoredLang() ?? detectBrowserLang()

			if (normalized === rootPath && preferredLang === "ko") {
				window.location.replace(koPath + window.location.search + window.location.hash)
				return
			}

			if (normalized === koPath) {
				writeStoredLang("ko")
			} else if (normalized === rootPath) {
				writeStoredLang("en")
			}

			for (const link of document.querySelectorAll("[data-lang-link]")) {
				if (!(link instanceof HTMLAnchorElement)) continue
				const lang = link.dataset.lang
				if (lang !== "en" && lang !== "ko") continue
				link.addEventListener("click", () => writeStoredLang(lang))
			}

			const input = document.querySelector("#card-filter")
			const cards = Array.from(document.querySelectorAll("[data-card]"))
			const count = document.querySelector("#count")
			const empty = document.querySelector("#empty")

			if (!(input instanceof HTMLInputElement) || !count || !empty) return

			const sync = () => {
				const query = input.value.trim().toLowerCase()
				let visible = 0

				for (const card of cards) {
					if (!(card instanceof HTMLElement)) continue
					const key = card.dataset.search ?? ""
					const matched = key.includes(query)
					card.parentElement?.toggleAttribute("hidden", !matched)
					if (matched) visible += 1
				}

				count.textContent = String(visible) + " ${copy.countSuffix}"
				empty.toggleAttribute("hidden", visible !== 0)
			}

			input.addEventListener("input", sync)
			sync()
		})()
	</script>
</body>
</html>`
}
