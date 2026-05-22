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
