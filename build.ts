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
