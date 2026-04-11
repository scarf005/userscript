const subtitleRootSelector = [
	".ytp-caption-window-container",
	".caption-window",
	".ytp-caption-segment",
	"ytd-transcript-segment-renderer",
].join(", ")

type ConversionRule = {
	pattern: RegExp
	format: (value: number) => string
}

const stripTrailingZero = (value: string) => {
	return value.replace(/\.0$/u, "")
}

const formatFixed = (value: number, digits = 1) => {
	return stripTrailingZero(value.toFixed(digits))
}

const formatKilograms = (value: number) => {
	if (value < 1) {
		return `${Math.round(value * 1000)}g`
	}

	return `${formatFixed(value)}kg`
}

const formatLiters = (value: number) => {
	if (value < 1) {
		return `${Math.round(value * 1000)}mL`
	}

	return `${formatFixed(value)}L`
}

const conversionRules: ConversionRule[] = [
	{
		pattern: /\b(\d+(?:\.\d+)?)\s*(mph|miles?\s+per\s+hour)\b(?!\s*\(~[^)]+\))/gi,
		format: (value) => `${formatFixed(value * 1.60934)}km/h`,
	},
	{
		pattern: /\b(\d+(?:\.\d+)?)\s*(mile|miles|mi)\b(?!\s*\(~[^)]+\))/gi,
		format: (value) => `${formatFixed(value * 1.60934)}km`,
	},
	{
		pattern: /\b(\d+(?:\.\d+)?)\s*(yard|yards|yd)\b(?!\s*\(~[^)]+\))/gi,
		format: (value) => `${formatFixed(value * 0.9144)}m`,
	},
	{
		pattern: /\b(\d+(?:\.\d+)?)\s*(ft|feet|foot)\b(?!\s*\(~[^)]+\))/gi,
		format: (value) => `${formatFixed(value * 0.3048)}m`,
	},
	{
		pattern: /\b(\d+(?:\.\d+)?)\s*(inch|inches)\b(?!\s*\(~[^)]+\))/gi,
		format: (value) => `${formatFixed(value * 2.54)}cm`,
	},
	{
		pattern: /\b(\d+(?:\.\d+)?)\s*(lb|lbs|pound|pounds)\b(?!\s*\(~[^)]+\))/gi,
		format: (value) => formatKilograms(value * 0.45359237),
	},
	{
		pattern: /\b(\d+(?:\.\d+)?)\s*(gallon|gallons|gal)\b(?!\s*\(~[^)]+\))/gi,
		format: (value) => `${formatFixed(value * 3.78541)}L`,
	},
	{
		pattern: /\b(\d+(?:\.\d+)?)\s*(quart|quarts|qt|qts)\b(?!\s*\(~[^)]+\))/gi,
		format: (value) => formatLiters(value * 0.946353),
	},
	{
		pattern: /\b(\d+(?:\.\d+)?)\s*(pint|pints)\b(?!\s*\(~[^)]+\))/gi,
		format: (value) => formatLiters(value * 0.473176),
	},
	{
		pattern: /\b(\d+(?:\.\d+)?)\s*(cup|cups)\b(?!\s*\(~[^)]+\))/gi,
		format: (value) => formatLiters(value * 0.236588),
	},
	{
		pattern: /\b(\d+(?:\.\d+)?)\s*(fl\.?\s*oz|fluid ounce|fluid ounces)\b(?!\s*\(~[^)]+\))/gi,
		format: (value) => formatLiters(value * 0.0295735),
	},
	{
		pattern: /\b(\d+(?:\.\d+)?)\s*(sq\.?\s*ft|square foot|square feet)\b(?!\s*\(~[^)]+\))/gi,
		format: (value) => `${formatFixed(value * 0.092903)}m²`,
	},
	{
		pattern: /\b(\d+(?:\.\d+)?)\s*(acre|acres)\b(?!\s*\(~[^)]+\))/gi,
		format: (value) => `${formatFixed(value * 0.404686)}ha`,
	},
	{
		pattern: /\b(\d+(?:\.\d+)?)\s*(psi)\b(?!\s*\(~[^)]+\))/gi,
		format: (value) => `${formatFixed(value * 6.89476)}kPa`,
	},
	{
		pattern:
			/\b(\d+(?:\.\d+)?)\s*(°\s*F|º\s*F|degrees?\s+Fahrenheit|degrees?\s+F)\b(?!\s*\(~[^)]+\))/gi,
		format: (value) => `${formatFixed((value - 32) * 5 / 9)}C`,
	},
]

const convertSubtitleText = (value: string) => {
	return conversionRules.reduce((current, rule) => {
		return current.replace(rule.pattern, (match, numericValue) => {
			return `${match} (~${rule.format(Number(numericValue))})`
		})
	}, value)
}

const shouldHandleTextNode = (node: Text) => {
	const parent = node.parentElement
	if (!parent) return false

	return parent.closest(subtitleRootSelector) !== null
}

const processTextNode = (node: Text) => {
	if (!shouldHandleTextNode(node)) return

	const original = node.textContent ?? ""
	const converted = convertSubtitleText(original)
	if (converted === original) return

	node.textContent = converted
}

const processNode = (node: Node) => {
	if (node instanceof Text) {
		processTextNode(node)
		return
	}

	if (!(node instanceof Element)) {
		return
	}

	if (
		node.closest(subtitleRootSelector) === null && node.querySelector(subtitleRootSelector) === null
	) {
		return
	}

	const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
	let current = walker.nextNode()

	while (current) {
		if (current instanceof Text) {
			processTextNode(current)
		}

		current = walker.nextNode()
	}
}

const observeSubtitles = () => {
	processNode(document.body)

	const observer = new MutationObserver((records) => {
		for (const record of records) {
			if (record.type === "characterData" && record.target instanceof Text) {
				processTextNode(record.target)
				continue
			}

			for (const addedNode of record.addedNodes) {
				processNode(addedNode)
			}
		}
	})

	observer.observe(document.body, {
		childList: true,
		subtree: true,
		characterData: true,
	})
	return observer
}

const state = globalThis as typeof globalThis & {
	__youtubeSiSubtitlesObserver?: MutationObserver
}

if (!state.__youtubeSiSubtitlesObserver) {
	state.__youtubeSiSubtitlesObserver = observeSubtitles()
}
