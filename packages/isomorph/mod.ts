const toISODate: (s: Date) => string = (s): string => s.toISOString().split("T")[0]

const toISODateTime: (s: Date) => string = (s): string =>
	s.toISOString().split(".")[0].replace("T", " ")

const replaceText: (el: HTMLElement, s: string) => void = (el, s): void =>
	Array.from(el.childNodes)
		.filter((node) => node.nodeType === Node.TEXT_NODE)
		.forEach((node) => node.textContent = s)

const monthname: Record<string, string> = {
	"January": "01",
	"February": "02",
	"March": "03",
	"April": "04",
	"May": "05",
	"June": "06",
	"July": "07",
	"August": "08",
	"September": "09",
	"October": "10",
	"November": "11",
	"December": "12",
}

/**
 * `30 January 2023 @ 19:06 UTC` -> `2023-01-30T19:06:00.000Z`
 */
const parseItch: (s: string) => Date = (s): Date => {
	const [date, time] = s.split(" @ ")
	const [day, month, year] = date.split(" ")
	const [hour, minute] = time.replace(" UTC", "").split(":")

	return new Date(`${year}-${monthname[month]}-${day}T${hour}:${minute}:00.000Z`)
}

const isoMorphRaw = ({ xs, fn }: { xs: NodeListOf<HTMLElement>; fn: (el: HTMLElement) => void }) =>
	xs.forEach((el) => {
		fn(el)
		el.setAttribute("data-isomorph", "true")
	})

/**
 * @param xs - target elements
 * @param getTime - query the time from the element
 * @param fn - modify the element
 */
const isoMorph: ({ xs, fn }: {
	xs: NodeListOf<HTMLElement>
	getTime: (x: HTMLElement) => Date
	fn?: (x: HTMLElement, time: Date) => void
}) => void = ({ getTime, xs, fn = (el, time) => void (el.innerText = toISODate(time)) }) =>
	Array.from(xs)
		.forEach((el) => {
			const datetime = getTime(el)
			fn(el, datetime)
			el.setAttribute("data-isomorph", "true")
		})

isoMorph({
	xs: document.querySelectorAll("time"),
	getTime: (el) => new Date(el.getAttribute("datetime") || el.innerText),
})

/**
 * `<abbr title="30 January 2023 @ 19:06 UTC"><span class="icon icon-stopwatch" aria-hidden="true"></span> Jan 30, 2023</abbr>`
 */
if (location.hostname.endsWith("itch.io")) {
	isoMorph({
		xs: document.querySelectorAll("abbr[title]"),
		getTime: (el) => parseItch(el.getAttribute("title")!),
		fn: (el, time) => {
			console.log(el)
			el.setAttribute("title", toISODateTime(time))
			replaceText(el, toISODate(time))
		},
	})
}

if (location.hostname.endsWith("github.com")) {
	const github = () => {
		isoMorphRaw({
			xs: document.querySelectorAll<HTMLElement>("relative-time"),
			fn: (el) => el.setAttribute("lang", "ko-KR"),
		})
		isoMorph({
			xs: document.querySelectorAll(
				`div.TimelineItem-body > h3,h3[data-testid="commit-group-title"]`,
			),
			getTime: (el) => new Date(el.innerText.split("Commits on ")[1]),
			fn: (el, time) => {
				console.log(el)
				replaceText(el, `Commits on ${toISODate(time)}`)
			},
		})
	}
	github()
	globalThis.addEventListener("turbo:render", github)
}
