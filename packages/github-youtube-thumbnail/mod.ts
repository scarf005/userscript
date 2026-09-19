import { convertYouTubeLinks } from "./youtube.ts"

type EditableElement = HTMLTextAreaElement | HTMLElement

type UserscriptGlobal = typeof globalThis & {
	__githubYouTubeThumbnailInstalled?: boolean
}

const findEditableElement = (target: EventTarget | null): EditableElement | null => {
	if (!(target instanceof HTMLElement)) return null

	const editable = target.closest<HTMLElement>(
		"textarea, [contenteditable='true'], [contenteditable='plaintext-only']",
	)
	if (!editable) return null

	return editable.matches("textarea") ? editable as HTMLTextAreaElement : editable
}

const dispatchInput = (element: EditableElement, data: string) => {
	try {
		element.dispatchEvent(
			new InputEvent("input", {
				bubbles: true,
				inputType: "insertFromPaste",
				data,
			}),
		)
	} catch {
		element.dispatchEvent(new Event("input", { bubbles: true }))
	}
}

const insertIntoTextArea = (element: HTMLTextAreaElement, value: string) => {
	const start = element.selectionStart ?? element.value.length
	const end = element.selectionEnd ?? start
	element.setRangeText(value, start, end, "end")
	dispatchInput(element, value)
}

const insertIntoContentEditable = (element: HTMLElement, value: string) => {
	element.focus()

	if (
		typeof document.execCommand === "function" && document.execCommand("insertText", false, value)
	) {
		return
	}

	const selection = document.getSelection()
	const range = selection?.rangeCount ? selection.getRangeAt(0) : null
	if (!range || !element.contains(range.commonAncestorContainer)) {
		element.append(document.createTextNode(value))
		dispatchInput(element, value)
		return
	}

	range.deleteContents()
	range.insertNode(document.createTextNode(value))
	range.collapse(false)
	selection?.removeAllRanges()
	selection?.addRange(range)
	dispatchInput(element, value)
}

const insertText = (element: EditableElement, value: string) => {
	if (element instanceof HTMLTextAreaElement || element.matches("textarea")) {
		insertIntoTextArea(element as HTMLTextAreaElement, value)
		return
	}

	insertIntoContentEditable(element, value)
}

const handlePaste = (event: ClipboardEvent) => {
	const element = findEditableElement(event.target)
	if (!element) return

	const pastedText = event.clipboardData?.getData("text/plain") ?? ""
	const convertedText = convertYouTubeLinks(pastedText)
	if (convertedText === pastedText) return

	event.preventDefault()
	insertText(element, convertedText)
}

const globalState = globalThis as UserscriptGlobal
if (!globalState.__githubYouTubeThumbnailInstalled) {
	document.addEventListener("paste", handlePaste, true)
	globalState.__githubYouTubeThumbnailInstalled = true
}
