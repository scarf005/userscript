const overlayId = "itch-jam-gallery-overlay"

type GalleryState = {
	links: HTMLAnchorElement[]
	index: number
}

const existingOverlay = document.getElementById(overlayId)

if (!existingOverlay) {
	const style = document.createElement("style")
	style.textContent = `
		#${overlayId} {
			position: fixed;
			inset: 0;
			z-index: 2147483647;
			display: none;
			align-items: center;
			justify-content: center;
			background: rgba(8, 10, 16, 0.92);
			backdrop-filter: blur(10px);
			color: #fff;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
		}

		#${overlayId}[data-open="true"] {
			display: flex;
		}

		#${overlayId} button {
			border: 0;
			border-radius: 0;
			background: rgba(255, 255, 255, 0.14);
			color: inherit;
			cursor: pointer;
		}

		#${overlayId} .itch-jam-gallery__frame {
			position: relative;
			width: min(96vw, 1400px);
			height: min(92vh, 900px);
			display: grid;
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: auto minmax(0, 1fr) auto;
			gap: 12px;
		}

		#${overlayId} .itch-jam-gallery__toolbar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
		}

		#${overlayId} .itch-jam-gallery__counter {
			padding: 8px 12px;
			border-radius: 0;
			background: rgba(255, 255, 255, 0.14);
			font-size: 14px;
		}

		#${overlayId} .itch-jam-gallery__close {
			width: 40px;
			height: 40px;
			border-radius: 0;
			font-size: 24px;
			line-height: 1;
		}

		#${overlayId} .itch-jam-gallery__stage {
			position: relative;
			min-height: 0;
			border-radius: 0;
			overflow: hidden;
			background: rgba(255, 255, 255, 0.05);
			box-shadow: 0 20px 80px rgba(0, 0, 0, 0.45);
		}

		#${overlayId} .itch-jam-gallery__image {
			width: 100%;
			height: 100%;
			object-fit: contain;
			user-select: none;
		}

		#${overlayId} .itch-jam-gallery__hint {
			text-align: center;
			font-size: 13px;
			color: rgba(255, 255, 255, 0.72);
		}

		#${overlayId} .itch-jam-gallery__nav {
			position: absolute;
			top: 0;
			bottom: 0;
			width: 50%;
			background: transparent;
		}

		#${overlayId} .itch-jam-gallery__nav--prev {
			left: 0;
			cursor: w-resize;
		}

		#${overlayId} .itch-jam-gallery__nav--next {
			right: 0;
			cursor: e-resize;
		}

		#${overlayId} .itch-jam-gallery__nav::after {
			position: absolute;
			top: 50%;
			transform: translateY(-50%);
			padding: 14px 18px;
			border-radius: 0;
			background: rgba(0, 0, 0, 0.35);
			font-size: 28px;
			opacity: 1;
		}

		#${overlayId} .itch-jam-gallery__nav--prev::after {
			content: "<";
			left: 16px;
		}

		#${overlayId} .itch-jam-gallery__nav--next::after {
			content: ">";
			right: 16px;
		}

		@media (max-width: 640px) {
			#${overlayId} .itch-jam-gallery__frame {
				width: 100vw;
				height: 100vh;
				padding: 16px;
				box-sizing: border-box;
			}

			#${overlayId} .itch-jam-gallery__stage {
				border-radius: 0;
			}

			#${overlayId} .itch-jam-gallery__hint {
				font-size: 12px;
			}
		}
	`
	document.head.append(style)

	const overlay = document.createElement("div")
	overlay.id = overlayId
	overlay.setAttribute("aria-hidden", "true")
	overlay.innerHTML = `
		<div class="itch-jam-gallery__frame" role="dialog" aria-modal="true" aria-label="Screenshot gallery">
			<div class="itch-jam-gallery__toolbar">
				<div class="itch-jam-gallery__counter"></div>
				<button class="itch-jam-gallery__close" type="button" aria-label="Close gallery">&times;</button>
			</div>
			<div class="itch-jam-gallery__stage">
				<button class="itch-jam-gallery__nav itch-jam-gallery__nav--prev" type="button" aria-label="Previous screenshot"></button>
				<img class="itch-jam-gallery__image" alt="">
				<button class="itch-jam-gallery__nav itch-jam-gallery__nav--next" type="button" aria-label="Next screenshot"></button>
			</div>
			<div class="itch-jam-gallery__hint">Click left or right side to browse, press Esc to close.</div>
		</div>
	`
	document.body.append(overlay)

	const image = overlay.querySelector<HTMLImageElement>(".itch-jam-gallery__image")!
	const counter = overlay.querySelector<HTMLElement>(".itch-jam-gallery__counter")!
	const closeButton = overlay.querySelector<HTMLButtonElement>(".itch-jam-gallery__close")!
	const prevButton = overlay.querySelector<HTMLButtonElement>(".itch-jam-gallery__nav--prev")!
	const nextButton = overlay.querySelector<HTMLButtonElement>(".itch-jam-gallery__nav--next")!

	let state: GalleryState | null = null
	let previousOverflow = ""

	const clampIndex = (index: number, length: number) => {
		return (index + length) % length
	}

	const render = () => {
		if (!state) return
		const current = state.links[state.index]
		const thumbnail = current.querySelector<HTMLImageElement>("img")

		image.src = current.href
		image.alt = thumbnail?.alt || "Jam screenshot"
		counter.textContent = `${state.index + 1} / ${state.links.length}`
	}

	const setOpen = (open: boolean) => {
		overlay.dataset.open = String(open)
		overlay.setAttribute("aria-hidden", String(!open))
		document.documentElement.style.overflow = open ? "hidden" : previousOverflow
	}

	const openGallery = (nextState: GalleryState) => {
		state = nextState
		previousOverflow = document.documentElement.style.overflow
		setOpen(true)
		render()
		closeButton.focus()
	}

	const closeGallery = () => {
		state = null
		image.removeAttribute("src")
		setOpen(false)
	}

	const move = (delta: number) => {
		if (!state) return
		state.index = clampIndex(state.index + delta, state.links.length)
		render()
	}

	closeButton.addEventListener("click", closeGallery)
	prevButton.addEventListener("click", () => move(-1))
	nextButton.addEventListener("click", () => move(1))

	overlay.addEventListener("click", (event) => {
		if (event.target === overlay) {
			closeGallery()
		}
	})

	document.addEventListener("keydown", (event) => {
		if (!state) return
		if (event.key === "Escape") {
			event.preventDefault()
			closeGallery()
			return
		}
		if (event.key === "ArrowLeft") {
			event.preventDefault()
			move(-1)
			return
		}
		if (event.key === "ArrowRight") {
			event.preventDefault()
			move(1)
		}
	})

	document.addEventListener("click", (event) => {
		const target = event.target
		if (!(target instanceof Element)) return

		const link = target.closest<HTMLAnchorElement>(".game_screenshots a[data-image_lightbox][href]")
		if (!link) return

		const container = link.closest(".game_screenshots")
		if (!container) return

		const links = Array.from(
			container.querySelectorAll<HTMLAnchorElement>("a[data-image_lightbox][href]"),
		).filter((item) => item.href.length > 0)
		const index = links.indexOf(link)
		if (index === -1 || links.length === 0) return

		event.preventDefault()
		event.stopPropagation()
		openGallery({ links, index })
	}, true)
}
