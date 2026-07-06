const scriptId = "dcinside-infinite-scroll"
const controlId = `${scriptId}-control`
const checkboxId = `${scriptId}-checkbox`
const statusId = `${scriptId}-status`
const storageKey = `${scriptId}:enabled`
const crawlIntervalMs = 3000

type UserMemoApi = {
	renderWriterMemoBadges?: (selector: string) => unknown
}

type DcinsideWindow = Window & typeof globalThis & {
	UserMemo?: UserMemoApi
}

type CrawlState = {
	enabled: boolean
	loading: boolean
	loadedPages: number
	nextUrl: string | null
	timer: number | null
	seenResultKeys: Set<string>
}

const localDcinsideWindow = window as DcinsideWindow

const state: CrawlState = {
	enabled: false,
	loading: false,
	loadedPages: 0,
	nextUrl: null,
	timer: null,
	seenResultKeys: new Set(),
}

const readEnabled = () => {
	try {
		return localStorage.getItem(storageKey) === "true"
	} catch {
		return false
	}
}

const writeEnabled = (enabled: boolean) => {
	try {
		localStorage.setItem(storageKey, String(enabled))
	} catch {
		// ignore storage errors in private or restricted contexts
	}
}

const setStatus = (message: string) => {
	const status = document.getElementById(statusId)
	if (status) status.textContent = message
}

const getListBody = (root: ParentNode) => {
	return root.querySelector<HTMLTableSectionElement>(
		".gall_listwrap.list table.gall_list tbody.listwrap2",
	)
}

const getPagingBox = (root: ParentNode) => {
	return root.querySelector<HTMLElement>(".bottom_paging_wrap.re .bottom_paging_box")
}

const toAbsoluteUrl = (href: string, baseUrl: string) => {
	try {
		return new URL(href, baseUrl).href
	} catch {
		return null
	}
}

const getPageFromUrl = (url: string) => {
	try {
		const value = new URL(url).searchParams.get("page")
		const page = value ? Number.parseInt(value, 10) : 1
		return Number.isFinite(page) && page > 0 ? page : 1
	} catch {
		return 1
	}
}

const withPage = (url: string, page: number) => {
	const next = new URL(url)
	next.searchParams.set("page", String(page))
	return next.href
}

const nextSearchUrl = (root: ParentNode, baseUrl: string) => {
	const link = getPagingBox(root)?.querySelector<HTMLAnchorElement>("a.search_next[href]")
	const href = link?.getAttribute("href")
	return href ? toAbsoluteUrl(href, baseUrl) : null
}

const nextRegularPageUrl = (url: string) => {
	return withPage(url, getPageFromUrl(url) + 1)
}

const getNextUrl = (root: ParentNode, baseUrl: string) => {
	return nextSearchUrl(root, baseUrl) ?? nextRegularPageUrl(baseUrl)
}

const getCommentRow = (row: HTMLTableRowElement) => {
	const next = row.nextElementSibling
	return next instanceof HTMLTableRowElement && next.matches("tr.search.search_comment[data-cmt]")
		? next
		: null
}

const getResultKey = (row: HTMLTableRowElement) => {
	const postNo = row.dataset.no?.trim()
	const commentId = getCommentRow(row)?.dataset.cmt?.trim()
	if (commentId) return `comment:${commentId}`
	return postNo ? `post:${postNo}` : null
}

const markLoaded = (row: HTMLTableRowElement) => {
	row.setAttribute(`data-${scriptId}-loaded`, "true")
}

const collectSeenResults = () => {
	document.querySelectorAll<HTMLTableRowElement>(".gall_listwrap.list tr.ub-content[data-no]")
		.forEach((row) => {
			const key = getResultKey(row)
			if (key) state.seenResultKeys.add(key)
		})
}

const appendResultRows = (doc: Document) => {
	const body = getListBody(document)
	const sourceBody = getListBody(doc)
	if (!body || !sourceBody) return 0

	let appended = 0
	const rows = sourceBody.querySelectorAll<HTMLTableRowElement>("tr.ub-content[data-no]")
	rows.forEach((row) => {
		const key = getResultKey(row)
		if (!key || state.seenResultKeys.has(key)) return

		state.seenResultKeys.add(key)
		const nextRow = document.importNode(row, true)
		markLoaded(nextRow)
		body.append(nextRow)

		const commentRow = getCommentRow(row)
		if (commentRow) {
			const nextCommentRow = document.importNode(commentRow, true)
			markLoaded(nextCommentRow)
			body.append(nextCommentRow)
		}

		appended += 1
	})

	if (appended > 0) {
		localDcinsideWindow.UserMemo?.renderWriterMemoBadges?.("#container .gall_listwrap.list")
	}

	return appended
}

const stopTimer = () => {
	if (state.timer === null) return
	window.clearInterval(state.timer)
	state.timer = null
}

const crawlNext = async () => {
	if (!state.enabled || state.loading || !state.nextUrl) return

	const url = state.nextUrl
	state.loading = true
	setStatus(`${state.loadedPages + 1}쪽 로딩`)

	try {
		const response = await fetch(url, { credentials: "include", cache: "no-store" })
		if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)

		const html = await response.text()
		const doc = new DOMParser().parseFromString(html, "text/html")
		const nextUrl = getNextUrl(doc, url)
		const appended = appendResultRows(doc)

		state.loadedPages += 1
		state.nextUrl = nextUrl !== url ? nextUrl : null

		if (!state.nextUrl && appended === 0) {
			setStatus("다음 없음")
			return
		}

		setStatus(appended > 0 ? `${appended}개 추가` : "새 글 없음")
	} catch {
		setStatus("로드 실패")
	} finally {
		state.loading = false
	}
}

const start = () => {
	if (state.enabled) return

	state.enabled = true
	collectSeenResults()
	state.nextUrl = getNextUrl(document, window.location.href)
	writeEnabled(true)
	setStatus("켜짐")

	void crawlNext()
	stopTimer()
	state.timer = window.setInterval(() => void crawlNext(), crawlIntervalMs)
}

const stop = () => {
	state.enabled = false
	writeEnabled(false)
	stopTimer()
	setStatus("꺼짐")
}

const addStyle = () => {
	const style = document.createElement("style")
	style.textContent = `
		#${controlId} {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			margin-left: 8px;
			border-radius: 0;
			color: #555;
			font-size: 12px;
			line-height: 1;
			vertical-align: middle;
		}

		#${controlId} input {
			width: 13px;
			height: 13px;
			margin: 0;
			border-radius: 0;
			vertical-align: middle;
		}

		#${statusId} {
			min-width: 46px;
			margin-left: 2px;
			border-radius: 0;
			color: #777;
			font-size: 11px;
		}
	`
	document.head.append(style)
}

const createControl = () => {
	const label = document.createElement("label")
	label.id = controlId
	label.htmlFor = checkboxId

	const checkbox = document.createElement("input")
	checkbox.id = checkboxId
	checkbox.type = "checkbox"
	checkbox.checked = readEnabled()

	const text = document.createElement("span")
	text.textContent = "무한 스크롤"

	const status = document.createElement("output")
	status.id = statusId
	status.setAttribute("for", checkboxId)
	status.setAttribute("aria-live", "polite")

	label.append(checkbox, text, status)
	checkbox.addEventListener("change", () => {
		if (checkbox.checked) {
			start()
			return
		}

		stop()
	})

	return { label, checkbox }
}

const install = () => {
	if (document.getElementById(controlId)) return
	if (!getListBody(document)) return

	const title = document.querySelector<HTMLElement>(".page_head h2")
	if (!title?.parentElement) return

	addStyle()
	const { label, checkbox } = createControl()
	title.insertAdjacentElement("afterend", label)

	if (checkbox.checked) start()
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", install, { once: true })
} else {
	install()
}
