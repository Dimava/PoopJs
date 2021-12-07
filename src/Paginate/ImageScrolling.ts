namespace PoopJs {
	export namespace ImageScrollingExtension {

		export let imageScrollingActive = false;
		export let imgSelector = 'img';

		export function imageScrolling(selector?: string) {
			if (imageScrollingActive) return;
			if (selector) imgSelector = selector;
			imageScrollingActive = true;
			function onwheel(event: MouseEvent & { wheelDeltaY: number }) {
				if (event.shiftKey || event.ctrlKey) return;
				if (scrollWholeImage(-Math.sign(event.wheelDeltaY))) {
					event.preventDefault();
				}
			}
			document.addEventListener('mousewheel', onwheel, { passive: false });
			return imageScrollingOff = () => {
				imageScrollingActive = false;
				document.removeEventListener('mousewheel', onwheel);
			};
		}
		export function bindArrows() {
			addEventListener('keydown', event => {
				if (event.code == 'ArrowLeft') {
					scrollWholeImage(-1);
				}
				if (event.code == 'ArrowRight') {
					scrollWholeImage(1);
				}
			})
		}
		export let imageScrollingOff = () => { };

		export function imgToWindowCenter(img: Element) {
			let rect = img.getBoundingClientRect();
			return (rect.top + rect.bottom) / 2 - innerHeight / 2;
		}

		export function getAllImageInfo() {
			let images = qq(imgSelector) as HTMLImageElement[];
			let datas = images.map((img, index) => {
				let rect = img.getBoundingClientRect();
				return {
					img, rect, index,
					inScreen: rect.top >= -1 && rect.bottom <= innerHeight,
					crossScreen: rect.bottom >= 1 && rect.top <= innerHeight - 1,
					yToScreenCenter: (rect.top + rect.bottom) / 2 - innerHeight / 2,
					isInCenter: Math.abs((rect.top + rect.bottom) / 2 - innerHeight / 2) < 3,
					isScreenHeight: Math.abs(rect.height - innerHeight) < 3,
				};
			}).filter(e => e.rect?.width || e.rect?.width);
			return datas;
		}

		export let scrollWholeImagePending = false;

		export function getCentralImg() {
			return getAllImageInfo().vsort(e => Math.abs(e.yToScreenCenter))[0]?.img;
		}
		export function scrollWholeImage(dir = 1): boolean {
			if (scrollWholeImagePending) return true;
			// if (dir == 0) throw new Error('scrolling in no direction!');
			if (!dir) return false;

			dir = Math.sign(dir);
			let datas = getAllImageInfo().vsort(e => e.yToScreenCenter);
			let central = datas.vsort(e => Math.abs(e.yToScreenCenter))[0];
			let nextCentralIndex = datas.indexOf(central);
			while (
				datas[nextCentralIndex + dir] &&
				Math.abs(datas[nextCentralIndex + dir].yToScreenCenter - central.yToScreenCenter) < 10
			) nextCentralIndex += dir;
			central = datas[nextCentralIndex];
			let next = datas[nextCentralIndex + dir];

			function scrollToImage(data: typeof central | undefined): boolean {
				if (!data) return false;
				if (scrollY + data.yToScreenCenter <= 0 && scrollY <= 0) {
					return false;
				}
				if (data.isScreenHeight) {
					data.img.scrollIntoView();
				} else {
					scrollTo(scrollX, scrollY + data.yToScreenCenter);
				}
				scrollWholeImagePending = true;
				Promise.raf(2).then(() => scrollWholeImagePending = false);
				return true;
			}

			// if no images, don't scroll;
			if (!central) return false;

			// if current image is outside view, don't scroll
			if (!central.crossScreen) return false;

			// if current image is in center, scroll to the next one
			if (central.isInCenter) {
				return scrollToImage(next);
			}

			// if to scroll to current image you have to scroll in opposide direction, scroll to next one
			if (Math.sign(central.yToScreenCenter) != dir) {
				return scrollToImage(next);
			}

			// if current image is first/last, don't scroll over 25vh to it
			if (dir == 1 && central.index == 0 && central.yToScreenCenter > innerHeight / 2) {
				return false;
			}
			if (dir == -1 && central.index == datas.length - 1 && central.yToScreenCenter < -innerHeight / 2) {
				return false;
			}

			return scrollToImage(central);
		}
	}
}