export type UserscriptPackage = {
	id: string
	buildFile: URL
	output: string
	build: () => Promise<string>
}
