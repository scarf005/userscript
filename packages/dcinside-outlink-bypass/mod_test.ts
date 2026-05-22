import { assertEquals } from "https://deno.land/std@0.221.0/assert/assert_equals.ts"
import { isDcinsideHost, resolveHttpUrl, shouldBypassHref } from "./url.ts"

const baseHref = "https://gall.dcinside.com/person/board/view/?id=dororong&no=13945"

Deno.test("isDcinsideHost() accepts dcinside subdomains only", () => {
	assertEquals(isDcinsideHost("dcinside.com"), true)
	assertEquals(isDcinsideHost("gall.dcinside.com"), true)
	assertEquals(isDcinsideHost("m.dcinside.com"), true)
	assertEquals(isDcinsideHost("dcinside.com.evil.test"), false)
})

Deno.test("resolveHttpUrl() resolves absolute and protocol-relative http URLs", () => {
	assertEquals(
		resolveHttpUrl({ href: "https://www.pixiv.net/artworks/142110586", baseHref })?.href,
		"https://www.pixiv.net/artworks/142110586",
	)
	assertEquals(
		resolveHttpUrl({ href: "//www.pixiv.net/artworks/142110586", baseHref })?.href,
		"https://www.pixiv.net/artworks/142110586",
	)
	assertEquals(resolveHttpUrl({ href: "javascript:alert(1)", baseHref }), null)
})

Deno.test("shouldBypassHref() bypasses external links but leaves dcinside links alone", () => {
	assertEquals(
		shouldBypassHref({ href: "https://www.pixiv.net/artworks/142110586", baseHref }),
		true,
	)
	assertEquals(
		shouldBypassHref({ href: "https://gall.dcinside.com/board/view/?id=dcbest&no=1", baseHref }),
		false,
	)
	assertEquals(shouldBypassHref({ href: "/person/board/lists/?id=dororong", baseHref }), false)
})
