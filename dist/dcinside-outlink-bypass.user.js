// ==UserScript==
// @icon           https://www.google.com/s2/favicons?sz=64&domain=github.com
// @license        AGPL-3.0-only
// @name           dcinside external link warning bypass
// @name:ko        디시인사이드 외부 링크 경고 우회
// @namespace      https://github.com/scarf005
// @description    open external links on dcinside directly without the warning modal
// @description:ko 디시인사이드 외부 링크를 경고 모달 없이 바로 엽니다.
// @version        0.1.0
// @homepageURL    https://github.com/scarf005/userscript
// @supportURL     https://github.com/scarf005/userscript/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc
// @downloadURL    https://raw.githubusercontent.com/scarf005/userscript/main/dist/dcinside-outlink-bypass.user.js
// @run-at         document-start
// @match          https://*.dcinside.com/*
// ==/UserScript==
{
"use strict"
const isDcinsideHost = (hostname)=>{
    return /(^|\.)dcinside\.com$/iu.test(hostname);
};
const resolveHttpUrl = ({ href, baseHref })=>{
    try {
        const url = new URL(href, baseHref);
        return url.protocol === "http:" || url.protocol === "https:" ? url : null;
    } catch  {
        return null;
    }
};
const shouldBypassHref = ({ href, baseHref })=>{
    const url = resolveHttpUrl({
        href,
        baseHref
    });
    if (!url) return false;
    return !isDcinsideHost(url.hostname);
};
const isRecord = (value)=>{
    return typeof value === "object" && value !== null;
};
const patchOutLink = (value)=>{
    if (!isRecord(value)) return value;
    const outLink = value;
    outLink.renderOutLinkWarning = ()=>undefined;
    outLink.applyWarningCheckboxState = ()=>{
        window.$?.("#chk_outlink").prop?.("checked", false);
        return true;
    };
    outLink.toggleWarning = ()=>true;
    return outLink;
};
const installOutLinkPatch = ()=>{
    const descriptor = Object.getOwnPropertyDescriptor(window, "OutLink");
    if (descriptor && !descriptor.configurable) {
        patchOutLink(window.OutLink);
        return;
    }
    let outLinkValue = patchOutLink(window.OutLink);
    Object.defineProperty(window, "OutLink", {
        configurable: true,
        enumerable: true,
        get: ()=>outLinkValue,
        set: (value)=>{
            outLinkValue = patchOutLink(value);
            disableOutLinkWarning();
        }
    });
};
const removeWarningLayers = ()=>{
    document.querySelectorAll(".outlink_warning_host, #outlink_warning_layer").forEach((element)=>{
        element.remove();
    });
};
const unbindDcinsideOutLinkHandler = ()=>{
    window.$?.("#container .write_div").off?.("click.outlinkOpen", "a");
    window.$?.(".write_div").off?.("click.outlinkOpen", "a");
    window.$?.("#chk_outlink").prop?.("checked", false);
};
const disableOutLinkWarning = ()=>{
    patchOutLink(window.OutLink);
    unbindDcinsideOutLinkHandler();
    removeWarningLayers();
};
const findAnchor = (target)=>{
    return target instanceof Element ? target.closest("a[href]") : null;
};
const bypassClick = (event)=>{
    const anchor = findAnchor(event.target);
    const href = anchor?.getAttribute("href")?.trim();
    if (!href || !shouldBypassHref({
        href,
        baseHref: window.location.href
    })) return;
    disableOutLinkWarning();
    event.stopImmediatePropagation();
};
const observeWarningLayers = ()=>{
    const root = document.documentElement;
    if (!root) return;
    const observer = new MutationObserver(removeWarningLayers);
    observer.observe(root, {
        childList: true,
        subtree: true
    });
};
const install = ()=>{
    installOutLinkPatch();
    window.addEventListener("click", bypassClick, {
        capture: true
    });
    window.addEventListener("auxclick", bypassClick, {
        capture: true
    });
    window.addEventListener("DOMContentLoaded", disableOutLinkWarning);
    window.addEventListener("load", disableOutLinkWarning);
    queueMicrotask(disableOutLinkWarning);
    if (document.documentElement) {
        observeWarningLayers();
    } else {
        window.addEventListener("DOMContentLoaded", observeWarningLayers, {
            once: true
        });
    }
};
if (typeof document !== "undefined") {
    install();
}
export { isDcinsideHost as isDcinsideHost };
export { resolveHttpUrl as resolveHttpUrl };
export { shouldBypassHref as shouldBypassHref };

}