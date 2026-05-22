type DcinsideOutLink = {
	applyWarningCheckboxState?: () => unknown
	renderOutLinkWarning?: (...args: unknown[]) => unknown
	toggleWarning?: (...args: unknown[]) => unknown
}

type JQueryResult = {
	off?: (events?: string, selector?: string) => JQueryResult
	prop?: (name: string, value: unknown) => JQueryResult
}

type JQueryLike = (selector: string) => JQueryResult

declare global {
	interface Window {
		OutLink?: DcinsideOutLink
		$?: JQueryLike
	}
}

export const isDcinsideHost = (hostname: string) => {
	return /(^|\.)dcinside\.com$/iu.test(hostname)
}

export const resolveHttpUrl = ({ href, baseHref }: { href: string; baseHref: string }) => {
	try {
		const url = new URL(href, baseHref)
		return url.protocol === "http:" || url.protocol === "https:" ? url : null
	} catch {
		return null
	}
}

export const shouldBypassHref = ({ href, baseHref }: { href: string; baseHref: string }) => {
	const url = resolveHttpUrl({ href, baseHref })
	if (!url) return false

	return !isDcinsideHost(url.hostname)
}

const isRecord = (value: unknown): value is Record<PropertyKey, unknown> => {
	return typeof value === "object" && value !== null
}

const patchOutLink = (value: unknown) => {
	if (!isRecord(value)) return value

	const outLink = value as DcinsideOutLink
	outLink.renderOutLinkWarning = () => undefined
	outLink.applyWarningCheckboxState = () => {
		window.$?.("#chk_outlink").prop?.("checked", false)
		return true
	}
	outLink.toggleWarning = () => true

	return outLink
}

const installOutLinkPatch = () => {
	const descriptor = Object.getOwnPropertyDescriptor(window, "OutLink")
	if (descriptor && !descriptor.configurable) {
		patchOutLink(window.OutLink)
		return
	}

	let outLinkValue = patchOutLink(window.OutLink) as DcinsideOutLink | undefined

	Object.defineProperty(window, "OutLink", {
		configurable: true,
		enumerable: true,
		get: () => outLinkValue,
		set: (value) => {
			outLinkValue = patchOutLink(value) as DcinsideOutLink | undefined
			disableOutLinkWarning()
		},
	})
}

const removeWarningLayers = () => {
	document.querySelectorAll(".outlink_warning_host, #outlink_warning_layer").forEach((element) => {
		element.remove()
	})
}

const unbindDcinsideOutLinkHandler = () => {
	window.$?.("#container .write_div").off?.("click.outlinkOpen", "a")
	window.$?.(".write_div").off?.("click.outlinkOpen", "a")
	window.$?.("#chk_outlink").prop?.("checked", false)
}

const disableOutLinkWarning = () => {
	patchOutLink(window.OutLink)
	unbindDcinsideOutLinkHandler()
	removeWarningLayers()
}

const findAnchor = (target: EventTarget | null) => {
	return target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null
}

const bypassClick = (event: MouseEvent) => {
	const anchor = findAnchor(event.target)
	const href = anchor?.getAttribute("href")?.trim()
	if (!href || !shouldBypassHref({ href, baseHref: window.location.href })) return

	disableOutLinkWarning()
	event.stopImmediatePropagation()
}

const observeWarningLayers = () => {
	const root = document.documentElement
	if (!root) return

	const observer = new MutationObserver(removeWarningLayers)
	observer.observe(root, { childList: true, subtree: true })
}

const install = () => {
	installOutLinkPatch()
	window.addEventListener("click", bypassClick, { capture: true })
	window.addEventListener("auxclick", bypassClick, { capture: true })
	window.addEventListener("DOMContentLoaded", disableOutLinkWarning)
	window.addEventListener("load", disableOutLinkWarning)
	queueMicrotask(disableOutLinkWarning)

	if (document.documentElement) {
		observeWarningLayers()
	} else {
		window.addEventListener("DOMContentLoaded", observeWarningLayers, { once: true })
	}
}

if (typeof document !== "undefined") {
	install()
}
