namespace PoopJs {

	type Link = Element | string | `http${string}`;

	export namespace paginate {
		export let active = false;
		export let queued = 0;
		export let wip = false;
		export let doc: Document;
		export function init() {
			if (active)
				return;
			active = true;

			document.documentElement.addEventListener('mousedown', (event) => {
				if (event.button != 1)
					return;
				let target = event.target as Element;
				if (target.closest('a'))
					return;
				target.emit('paginationrequest', event);
				paginationrequest(event);
			});
			document.documentElement.addEventListener('keydown', (event) => {
				if (event.code != 'AltRight')
					return;
				event.preventDefault();
				let target = event.target as Element;
				target.emit('paginationrequest', event);
				paginationrequest(event);
			});
			document.documentElement.addEventListener('paginationend', (event) => {
				wip = false;
				if (queued) {
					queued--;
					run();
				}
			});
		}
		export function paginationrequest(event) {
			getSelection().removeAllRanges();
			if (event.shiftKey || event.detail?.shiftKey
				|| event.buttons == 1) {
				queued += 9;
			}
			if (wip) {
				queued++;
				return;
			}
			run();
		}
		export function run() {
			wip = true;
			document.documentElement.emit('paginationstart');
		}
		export function onrun(condition, fn = condition) {
			init();
			if (!condition) return;
			console.log('paginate registered:', fn);
			document.addEventListener('paginationstart', fn);
		}


		export function onRunO(data: { prefetch?: string | string[], click?: string, aDoc?: string, afterLast?: string | string[], replace?: string | string[] });
		export function onRunO(condition: any, data: { prefetch?: string | string[], click?: string, aDoc?: string, afterLast?: string | string[], replace?: string | string[] });
		export function onRunO(condition: any, data: { prefetch?: string | string[], click?: string, aDoc?: string, afterLast?: string | string[], replace?: string | string[] } = condition) {
			if (!condition) return;

			function makeArray(data: string | string[] | undefined): string[] {
				return !data ? [] : Array.isArray(data) ? data : [data];
			}
			let fixedData = {
				prefetch: makeArray(data.prefetch),
				aDoc: data.aDoc,
				click: makeArray(data.click),
				afterLast: makeArray(data.afterLast),
				replace: makeArray(data.replace),
			};

			fixedData.prefetch.map(e => prefetch(e));

			onrun(async () => {
				fixedData.click.map(e => q(e)?.click());
				if (data.aDoc) {
					await aDoc(data.aDoc);
					fixedData.afterLast.map(e => afterLast(e));
					fixedData.replace.map(e => replace(e));
				}
				end();
			});
			onend(() => {
				fixedData.prefetch.map(prefetch);
			});
		}
		export function onchange(condition, fn = condition) {
			init();
			if (!condition) return;
			document.addEventListener('paginationchange', fn);
		}
		export function end() {
			document.documentElement.emit('paginationend');
		}
		export function onend(condition, fn = condition) {
			if (!condition) return;
			document.addEventListener('paginationend', fn);
		}
		export function toHref(link: Link) {
			if (typeof link == 'string') {
				if (link.startsWith('http')) {
					return link;
				}
				link = q(link);
			}
			return (link as HTMLAnchorElement).href;
		}
		export function toAnchor(link: Link): HTMLAnchorElement {
			if (typeof link == 'string') {
				if (link.startsWith('http')) {
					return elm(`a[href=${link}]`) as HTMLAnchorElement;
				}
				return q(link);
			}
			return link as HTMLAnchorElement;
		}
		export async function aDoc(link: Link) {
			let a = toAnchor(link);
			if (!a) throw new Error('not a link');
			a.classList.add('paginate-spin');
			let doc = await fetch.doc(a.href);
			paginate.doc = doc;
			return doc;
		}
		export async function aCachedDoc(link: Link) {
			let a = toAnchor(link);
			if (!a) throw new Error('not a link');
			a.classList.add('paginate-spin');
			let doc = await fetch.cached.doc(a.href);
			a.classList.remove('paginate-spin');
			paginate.doc = doc;
			return doc;
		}
		export function appendChildren(doc, source, target = source) {
			if (typeof doc == 'string')
				return appendChildren(paginate.doc, doc, source);
			let children = [...doc.q(source).children];
			q(target).append(...children);
			document.documentElement.emit('paginationchange', children);
			return paginate;
		}

		export function afterLast(doc: Document, source: string, target?: string): typeof paginate;
		export function afterLast(source: string, target?: string): typeof paginate;
		export function afterLast(doc: Document | string, source: string, target = source): typeof paginate {
			if (typeof doc == 'string')
				return afterLast(paginate.doc, doc, source);
			let children = doc.qq(source);
			let last = qq(target).pop();
			last.after(...children);
			document.documentElement.emit('paginationchange', children);
			return paginate;
		}
		export function replace(doc: Document, source: string, target?: string): typeof paginate;
		export function replace(source: string, target?: string): typeof paginate;
		export function replace(doc: Document | string, source: string, target = source): typeof paginate {
			if (typeof doc == 'string')
				return replace(paginate.doc, doc, source);
			return replaceEach(doc, source, target); // !!! should check if this one is actually useless
			// let child = doc.q(source)
			// q(target).replaceWith(child);
			// document.documentElement.emit('paginationchange', [child]);
			// return paginate;
		}

		export function replaceEach(doc: Document, source: string, target?: string): typeof paginate;
		export function replaceEach(source: string, target?: string): typeof paginate;
		export function replaceEach(doc: Document | string, source: string, target = source): typeof paginate {
			if (typeof doc == 'string')
				return replaceEach(paginate.doc, doc, source);
			let children = doc.qq(source);
			qq(target).map((e, i) => e.replaceWith(children[i]));
			document.documentElement.emit('paginationchange', children);
			return paginate;
		}

		export function prefetch(enabled: any, link: Link): boolean;
		export function prefetch(link: Link): boolean;
		export function prefetch(enabled: any, link: string | Element = enabled) {
			if (!enabled) return false;

			elm(`link[rel="prefetch"][href="${toHref(link)}"]`).appendTo('head');
			return true;
		}

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
			});
			return datas;
		}

		export let scrollWholeImagePending = false;

		export function getCentralImg() {
			return getAllImageInfo().vsort(e => Math.abs(e.yToScreenCenter))[0]?.img;
		}
		export function scrollWholeImage(dir = 1) {
			if (scrollWholeImagePending) return true;

			dir = Math.sign(dir);
			let datas = getAllImageInfo();
			let central = datas.vsort(e => Math.abs(e.yToScreenCenter))[0];

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
				return scrollToImage(datas[datas.indexOf(central) + dir]);
			}

			// if to scroll to current image you have to scroll in opposide direction, scroll to next one
			if (Math.sign(central.yToScreenCenter) != dir) {
				return scrollToImage(datas[datas.indexOf(central) + dir]);
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