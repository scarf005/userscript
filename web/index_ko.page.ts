import { renderCatalogPage, type UserScriptEntry } from "./catalog_page.ts"

type Data = {
	userscripts: UserScriptEntry[]
}

export const id = "home"
export const lang = "ko"
export const url = "/"
export const title = "유저스크립트 카탈로그"

export default (data: Data) => renderCatalogPage(data, "ko")
