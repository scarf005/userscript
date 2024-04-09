import { assertEquals } from "https://deno.land/std@0.221.0/assert/assert_equals.ts"
import { linkifyEsmSh } from "./linkify_esm_sh.ts"

/** https://esm.sh/gh/scarf005/typed_regex@0.2.0/mod.ts */
const given = `\
/* esm.sh - gh/scarf005/typed_regex@0.2.0/mod.ts */
export * from "/v135/gh/scarf005/typed_regex@0.2.0/es2022/mod.ts.js";
export { default } from "/v135/gh/scarf005/typed_regex@0.2.0/es2022/mod.ts.js";`

const expected = /*html*/ `\
/* esm.sh - <a href="https://github.com/scarf005/typed_regex/tree/0.2.0/">gh/scarf005/typed_regex@0.2.0/</a><a href="https://github.com/scarf005/typed_regex/blob/0.2.0/mod.ts">mod.ts</a> */
export * from <a href="https://esm.sh/v135/gh/scarf005/typed_regex@0.2.0/es2022/mod.ts.js">"/v135/gh/scarf005/typed_regex@0.2.0/es2022/mod.ts.js"</a>;
export { default } from <a href="https://esm.sh/v135/gh/scarf005/typed_regex@0.2.0/es2022/mod.ts.js">"/v135/gh/scarf005/typed_regex@0.2.0/es2022/mod.ts.js"</a>;`

Deno.test("linkifyEsmSh() adds anchor to code", () => {
	assertEquals(linkifyEsmSh(given), expected)
})
