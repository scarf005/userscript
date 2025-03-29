import { basename, dirname, resolve } from "jsr:@std/path"

import { bundle } from "jsr:@deno/emit"

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
