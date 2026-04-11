import { format, increment, parse, type ReleaseType } from "jsr:@std/semver"
import $ from "jsr:@david/dax"

import { findUserscriptPackage } from "./registry.ts"

const [packageId, release = "patch"] = Deno.args

if (!packageId) {
	throw new Error("usage: deno task version-up <package-id> [release-type]")
}

const userscriptPackage = findUserscriptPackage(packageId)

if (!userscriptPackage) {
	throw new Error(`unknown package: ${packageId}`)
}

const file = $.path(userscriptPackage.buildFile)
const source = file.readTextSync()
const currentMatch = source.match(/version:\s*"([^"]+)"/u)

if (!currentMatch) {
	throw new Error(`version not found in ${file}`)
}

const currentVersion = parse(currentMatch[1])
const nextVersion = increment(currentVersion, release as ReleaseType)

if (!nextVersion) {
	throw new Error(`unable to increment version for ${packageId}`)
}

file.writeTextSync(source.replace(/version:\s*"([^"]+)"/u, `version: "${format(nextVersion)}"`))

await $`deno fmt ${file.toString()}`

await $`deno task build`

$.logStep(`versioned ${packageId} to ${format(nextVersion)}`)
