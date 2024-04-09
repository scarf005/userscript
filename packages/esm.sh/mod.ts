import { linkifyEsmSh } from "./linkify_esm_sh.ts"

const pre = document.querySelector("pre")!
pre.innerHTML = linkifyEsmSh(pre.innerHTML)
