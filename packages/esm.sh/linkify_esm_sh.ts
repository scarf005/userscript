const ghRe = /gh\/(?<owner>[^/]+)\/(?<repo>[^@]+)@(?<version>[^/]+)\/(?<file>[^ ]+)/
const ghBase = (kind: "tree" | "blob") => `https://github.com/$<owner>/$<repo>/${kind}/$<version>/`
const ghTemplate = `<a href="${ghBase("tree")}">gh/$<owner>/$<repo>@$<version>/</a>` +
	`<a href="${ghBase("blob")}$<file>">$<file></a>`

const vRe = /"\/(?<version>v\d+)\/(?<url>.*)"/
const vTemplate = `<a href="https://esm.sh/$<version>/$<url>">$&</a>`

export const linkifyEsmSh = (text: string): string => {
	const [head, ...lines] = text.split("\n")

	return [
		head.replace(ghRe, ghTemplate),
		...lines.map((line) => line.replace(vRe, vTemplate)),
	].join("\n")
}
