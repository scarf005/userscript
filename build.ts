import { resolve } from "https://deno.land/std@0.220.1/path/resolve.ts"
import { dirname } from "https://deno.land/std@0.220.1/path/dirname.ts"
import { basename } from "https://deno.land/std@0.220.1/path/basename.ts"

import { bundle } from "https://deno.land/x/emit@0.28.0/mod.ts"

type Option = {
	metadata: string
	url: URL | string
}
export const bundleUserScript = async ({ url, metadata }: Option) => {
	const { code } = await bundle(url)

	const output = `\
${metadata}
{
"use strict"
${code}
}`

	return output
}

export const build = async ({ url, metadata }: Option) => {
	const code = await bundleUserScript({ url, metadata })
	const name = basename(dirname(import.meta.resolve("./mod.ts")))

	await Deno.writeTextFile(resolve(`../dist/${name}.user.js`), code)
	return code
}
