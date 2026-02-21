const ghRe = /gh\/(?<owner>[^/]+)\/(?<repo>[^@]+)@(?<version>[^/]+)\/(?<file>[^ ]+)/
const ghBase = (kind: "tree" | "blob") => `https://github.com/$<owner>/$<repo>/${kind}/$<version>/`
const ghTemplate = `<a href="${ghBase("tree")}">gh/$<owner>/$<repo>@$<version>/</a>` +
	`<a href="${ghBase("blob")}$<file>">$<file></a>`

const esmPathRe = /"(?<path>\/[^"]+)"/g
const esmPathTemplate = `<a href="https://esm.sh$<path>">$&</a>`

export const linkifyEsmSh = (text: string): string => {
	const [head, ...lines] = text.split("\n")

	return [
		head.replace(ghRe, ghTemplate),
		...lines.map((line) => line.replace(esmPathRe, esmPathTemplate)),
	].join("\n")
}
