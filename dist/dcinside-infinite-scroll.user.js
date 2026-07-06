// ==UserScript==
// @icon           https://www.google.com/s2/favicons?sz=64&domain=github.com
// @license        AGPL-3.0-only
// @name           dcinside gallery infinite scroll
// @name:ko        디시인사이드 갤러리 무한 스크롤
// @namespace      https://github.com/scarf005
// @description    append dcinside gallery list pages every 3 seconds while enabled
// @description:ko 켜져 있는 동안 디시인사이드 갤러리 목록 다음 페이지를 3초마다 이어 붙입니다.
// @version        0.1.0
// @homepageURL    https://github.com/scarf005/userscript
// @supportURL     https://github.com/scarf005/userscript/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc
// @downloadURL    https://raw.githubusercontent.com/scarf005/userscript/main/dist/dcinside-infinite-scroll.user.js
// @match          https://gall.dcinside.com/board/lists/*
// @match          https://gall.dcinside.com/*/board/lists/*
// ==/UserScript==
{
"use strict"
const scriptId = "dcinside-infinite-scroll";
const controlId = `${scriptId}-control`;
const checkboxId = `${scriptId}-checkbox`;
const statusId = `${scriptId}-status`;
const storageKey = `${scriptId}:enabled`;
const crawlIntervalMs = 3000;
const localDcinsideWindow = window;
const state = {
    enabled: false,
    loading: false,
    loadedPages: 0,
    nextUrl: null,
    timer: null,
    seenPostNos: new Set()
};
const readEnabled = ()=>{
    try {
        return localStorage.getItem(storageKey) === "true";
    } catch  {
        return false;
    }
};
const writeEnabled = (enabled)=>{
    try {
        localStorage.setItem(storageKey, String(enabled));
    } catch  {}
};
const setStatus = (message)=>{
    const status = document.getElementById(statusId);
    if (status) status.textContent = message;
};
const getListBody = (root)=>{
    return root.querySelector(".gall_listwrap.list table.gall_list tbody.listwrap2");
};
const getPagingBox = (root)=>{
    return root.querySelector(".bottom_paging_wrap.re .bottom_paging_box");
};
const toAbsoluteUrl = (href, baseUrl)=>{
    try {
        return new URL(href, baseUrl).href;
    } catch  {
        return null;
    }
};
const getPageFromUrl = (url)=>{
    try {
        const value = new URL(url).searchParams.get("page");
        const page = value ? Number.parseInt(value, 10) : 1;
        return Number.isFinite(page) && page > 0 ? page : 1;
    } catch  {
        return 1;
    }
};
const withPage = (url, page)=>{
    const next = new URL(url);
    next.searchParams.set("page", String(page));
    return next.href;
};
const nextSearchUrl = (root, baseUrl)=>{
    const link = getPagingBox(root)?.querySelector("a.search_next[href]");
    const href = link?.getAttribute("href");
    return href ? toAbsoluteUrl(href, baseUrl) : null;
};
const nextRegularPageUrl = (url)=>{
    return withPage(url, getPageFromUrl(url) + 1);
};
const getNextUrl = (root, baseUrl)=>{
    return nextSearchUrl(root, baseUrl) ?? nextRegularPageUrl(baseUrl);
};
const collectSeenPostNos = ()=>{
    document.querySelectorAll(".gall_listwrap.list tr.ub-content[data-no]").forEach((row)=>{
        const postNo = row.dataset.no?.trim();
        if (postNo) state.seenPostNos.add(postNo);
    });
};
const appendRows = (doc)=>{
    const body = getListBody(document);
    const sourceBody = getListBody(doc);
    if (!body || !sourceBody) return 0;
    let appended = 0;
    const rows = sourceBody.querySelectorAll("tr.ub-content[data-no]");
    rows.forEach((row)=>{
        const postNo = row.dataset.no?.trim();
        if (!postNo || state.seenPostNos.has(postNo)) return;
        state.seenPostNos.add(postNo);
        const nextRow = document.importNode(row, true);
        nextRow.setAttribute(`data-${scriptId}-loaded`, "true");
        body.append(nextRow);
        appended += 1;
    });
    if (appended > 0) {
        localDcinsideWindow.UserMemo?.renderWriterMemoBadges?.("#container .gall_listwrap.list");
    }
    return appended;
};
const stopTimer = ()=>{
    if (state.timer === null) return;
    window.clearInterval(state.timer);
    state.timer = null;
};
const crawlNext = async ()=>{
    if (!state.enabled || state.loading || !state.nextUrl) return;
    const url = state.nextUrl;
    state.loading = true;
    setStatus(`${state.loadedPages + 1}쪽 로딩`);
    try {
        const response = await fetch(url, {
            credentials: "include",
            cache: "no-store"
        });
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const nextUrl = getNextUrl(doc, url);
        const appended = appendRows(doc);
        state.loadedPages += 1;
        state.nextUrl = nextUrl !== url ? nextUrl : null;
        if (!state.nextUrl && appended === 0) {
            setStatus("다음 없음");
            return;
        }
        setStatus(appended > 0 ? `${appended}개 추가` : "새 글 없음");
    } catch  {
        setStatus("로드 실패");
    } finally{
        state.loading = false;
    }
};
const start = ()=>{
    if (state.enabled) return;
    state.enabled = true;
    collectSeenPostNos();
    state.nextUrl = getNextUrl(document, window.location.href);
    writeEnabled(true);
    setStatus("켜짐");
    void crawlNext();
    stopTimer();
    state.timer = window.setInterval(()=>void crawlNext(), crawlIntervalMs);
};
const stop = ()=>{
    state.enabled = false;
    writeEnabled(false);
    stopTimer();
    setStatus("꺼짐");
};
const addStyle = ()=>{
    const style = document.createElement("style");
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
	`;
    document.head.append(style);
};
const createControl = ()=>{
    const label = document.createElement("label");
    label.id = controlId;
    label.htmlFor = checkboxId;
    const checkbox = document.createElement("input");
    checkbox.id = checkboxId;
    checkbox.type = "checkbox";
    checkbox.checked = readEnabled();
    const text = document.createElement("span");
    text.textContent = "무한 스크롤";
    const status = document.createElement("output");
    status.id = statusId;
    status.setAttribute("for", checkboxId);
    status.setAttribute("aria-live", "polite");
    label.append(checkbox, text, status);
    checkbox.addEventListener("change", ()=>{
        if (checkbox.checked) {
            start();
            return;
        }
        stop();
    });
    return {
        label,
        checkbox
    };
};
const install = ()=>{
    if (document.getElementById(controlId)) return;
    if (!getListBody(document)) return;
    const title = document.querySelector(".page_head h2");
    if (!title?.parentElement) return;
    addStyle();
    const { label, checkbox } = createControl();
    title.insertAdjacentElement("afterend", label);
    if (checkbox.checked) start();
};
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, {
        once: true
    });
} else {
    install();
}

}