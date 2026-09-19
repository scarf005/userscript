// ==UserScript==
// @icon           https://www.google.com/s2/favicons?sz=64&domain=github.com
// @license        AGPL-3.0-only
// @name           GitHub YouTube thumbnail paste
// @name:ko        GitHub YouTube 썸네일 붙여넣기
// @namespace      https://github.com/scarf005
// @description    convert pasted YouTube video links into clickable thumbnail Markdown on GitHub
// @description:ko GitHub에 YouTube 동영상 링크를 붙여넣으면 클릭 가능한 썸네일 Markdown으로 변환합니다.
// @version        0.1.0
// @homepageURL    https://github.com/scarf005/userscript
// @supportURL     https://github.com/scarf005/userscript/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc
// @downloadURL    https://raw.githubusercontent.com/scarf005/userscript/main/dist/github-youtube-thumbnail.user.js
// @match          https://github.com/*
// ==/UserScript==
{
"use strict"
const videoIdPattern = /^[A-Za-z0-9_-]{11}$/u;
const urlPattern = /https?:\/\/[^\s<>"']+/giu;
const trailingPunctuationPattern = /[),.;!?]+$/u;
const youtubeHosts = new Set([
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com"
]);
const isVideoId = (value)=>{
    return value !== null && videoIdPattern.test(value);
};
const videoIdFromYouTubeUrl = (value)=>{
    try {
        const url = new URL(value);
        const host = url.hostname.toLowerCase();
        const pathSegments = url.pathname.split("/").filter(Boolean);
        if (host === "youtu.be") {
            return isVideoId(pathSegments[0] ?? null) ? pathSegments[0] : null;
        }
        if (!youtubeHosts.has(host)) return null;
        if (url.pathname === "/watch") {
            const videoId = url.searchParams.get("v");
            return isVideoId(videoId) ? videoId : null;
        }
        if ([
            "shorts",
            "embed",
            "live"
        ].includes(pathSegments[0] ?? "")) {
            const videoId = pathSegments[1] ?? null;
            return isVideoId(videoId) ? videoId : null;
        }
        return null;
    } catch  {
        return null;
    }
};
const splitTrailingPunctuation = (value)=>{
    const match = trailingPunctuationPattern.exec(value);
    if (!match) return {
        url: value,
        trailing: ""
    };
    return {
        url: value.slice(0, -match[0].length),
        trailing: match[0]
    };
};
const thumbnailUrl = (videoId)=>`https://img.youtube.com/vi/${videoId}/0.jpg`;
const convertYouTubeLinks = (value)=>{
    return value.replace(urlPattern, (rawUrl)=>{
        const { url, trailing } = splitTrailingPunctuation(rawUrl);
        const videoId = videoIdFromYouTubeUrl(url);
        if (!videoId) return rawUrl;
        return `[![](${thumbnailUrl(videoId)})](${url})${trailing}`;
    });
};
const findEditableElement = (target)=>{
    if (!(target instanceof HTMLElement)) return null;
    const editable = target.closest("textarea, [contenteditable='true'], [contenteditable='plaintext-only']");
    if (!editable) return null;
    return editable.matches("textarea") ? editable : editable;
};
const dispatchInput = (element, data)=>{
    try {
        element.dispatchEvent(new InputEvent("input", {
            bubbles: true,
            inputType: "insertFromPaste",
            data
        }));
    } catch  {
        element.dispatchEvent(new Event("input", {
            bubbles: true
        }));
    }
};
const insertIntoTextArea = (element, value)=>{
    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? start;
    element.setRangeText(value, start, end, "end");
    dispatchInput(element, value);
};
const insertIntoContentEditable = (element, value)=>{
    element.focus();
    if (typeof document.execCommand === "function" && document.execCommand("insertText", false, value)) {
        return;
    }
    const selection = document.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (!range || !element.contains(range.commonAncestorContainer)) {
        element.append(document.createTextNode(value));
        dispatchInput(element, value);
        return;
    }
    range.deleteContents();
    range.insertNode(document.createTextNode(value));
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
    dispatchInput(element, value);
};
const insertText = (element, value)=>{
    if (element instanceof HTMLTextAreaElement || element.matches("textarea")) {
        insertIntoTextArea(element, value);
        return;
    }
    insertIntoContentEditable(element, value);
};
const handlePaste = (event)=>{
    const element = findEditableElement(event.target);
    if (!element) return;
    const pastedText = event.clipboardData?.getData("text/plain") ?? "";
    const convertedText = convertYouTubeLinks(pastedText);
    if (convertedText === pastedText) return;
    event.preventDefault();
    insertText(element, convertedText);
};
const globalState = globalThis;
if (!globalState.__githubYouTubeThumbnailInstalled) {
    document.addEventListener("paste", handlePaste, true);
    globalState.__githubYouTubeThumbnailInstalled = true;
}

}