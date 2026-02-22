import { renderCatalogPage, type UserScriptEntry } from "./catalog_page.ts"

type Data = {
	userscripts: UserScriptEntry[]
}

export const id = "home"
export const lang = "en"
export const url = "/"
export const title = "Userscript Catalog"

export default (data: Data) => renderCatalogPage(data, "en")
