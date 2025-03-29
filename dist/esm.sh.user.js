// ==UserScript==
// @icon           https://www.google.com/s2/favicons?sz=64&domain=github.com
// @license        AGPL-3.0-only
// @name           esm.sh links
// @name:ko        esm.sh 링크 추가
// @namespace      https://github.com/scarf005
// @description    add links to esm.sh imports
// @description:ko esm.sh import 구문에 링크를 추가합니다.
// @version        0.0.0
// @homepageURL    https://github.com/scarf005/userscript
// @supportURL     https://github.com/scarf005/userscript/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc
// @downloadURL    https://raw.githubusercontent.com/scarf005/userscript/main/dist/esm.sh.user.js
// @match          https://esm.sh/*
// ==/UserScript==
{
	"use strict"
	const ghRe = /gh\/(?<owner>[^/]+)\/(?<repo>[^@]+)@(?<version>[^/]+)\/(?<file>[^ ]+)/
	const ghBase = (kind) => `https://github.com/$<owner>/$<repo>/${kind}/$<version>/`
	const ghTemplate = `<a href="${ghBase("tree")}">gh/$<owner>/$<repo>@$<version>/</a>` +
		`<a href="${ghBase("blob")}$<file>">$<file></a>`
	const vRe = /"\/(?<version>v\d+)\/(?<url>.*)"/
	const vTemplate = `<a href="https://esm.sh/$<version>/$<url>">$&</a>`
	const linkifyEsmSh = (text) => {
		const [head, ...lines] = text.split("\n")
		return [
			head.replace(ghRe, ghTemplate),
			...lines.map((line) => line.replace(vRe, vTemplate)),
		].join("\n")
	}
	const pre = document.querySelector("pre")
	pre.innerHTML = linkifyEsmSh(pre.innerHTML)
}
