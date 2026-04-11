import { userscriptPackage as esmSh } from "./esm.sh/build.ts"
import { userscriptPackage as isomorph } from "./isomorph/build.ts"
import { userscriptPackage as itchJamGallery } from "./itch-jam-gallery/build.ts"
import { userscriptPackage as youtubeSiSubtitles } from "./youtube-si-subtitles/build.ts"

import type { UserscriptPackage } from "./types.ts"

export const userscriptPackages = [
	esmSh,
	isomorph,
	itchJamGallery,
	youtubeSiSubtitles,
] as const satisfies readonly UserscriptPackage[]

export const findUserscriptPackage = (id: string) => {
	return userscriptPackages.find((userscriptPackage) => userscriptPackage.id === id)
}
