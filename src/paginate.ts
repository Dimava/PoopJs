namespace PoopJs {

	type Link = Element | string | `http${string}`;

	export class paginate {
		static active = false;
		static queued = 0;
		static wip = false;
		static doc: Document;
		static init() {
			if (paginate.active)
				return;
			paginate.active = true;

			document.documentElement.addEventListener('mousedown', (event) => {
				if (event.button != 1)
					return;
				let target = event.target as Element;
				if (target.closest('a'))
					return;
				target.emit('paginationrequest', event);
				this.paginationrequest(event);
			});
			document.documentElement.addEventListener('keydown', (event) => {
				if (event.code != 'AltRight')
					return;
				event.preventDefault();
				let target = event.target as Element;
				target.emit('paginationrequest', event);
				this.paginationrequest(event);
			});
			document.documentElement.addEventListener('paginationend', (event) => {
				paginate.wip = false;
				if (paginate.queued) {
					paginate.queued--;
					paginate.run();
				}
			});
		}
		static paginationrequest(event) {
			getSelection().removeAllRanges();
			if (event.shiftKey || event.detail?.shiftKey
				|| event.buttons == 1) {
				paginate.queued += 9;
			}
			if (paginate.wip) {
				paginate.queued++;
				return;
			}
			paginate.run();
		}
		static run() {
			paginate.wip = true;
			document.documentElement.emit('paginationstart');
		}
		static onrun(condition, fn = condition) {
			paginate.init();
			if (!condition) return;
			console.log('paginate registered:', fn);
			document.addEventListener('paginationstart', fn);
		}
		static onchange(condition, fn = condition) {
			paginate.init();
			if (!condition) return;
			document.addEventListener('paginationchange', fn);
		}
		static end() {
			document.documentElement.emit('paginationend');
		}
		static onend(condition, fn = condition) {
			if (!condition) return;
			document.addEventListener('paginationend', fn);
		}
		static toHref(link: Link) {
			if (typeof link == 'string') {
				if (link.startsWith('http')) {
					return link;
				}
				link = q(link);
			}
			return (link as HTMLAnchorElement).href;
		}
		static toAnchor(link: Link): HTMLAnchorElement {
			if (typeof link == 'string') {
				if (link.startsWith('http')) {
					return elm(`a[href=${link}]`) as HTMLAnchorElement;
				}
				return q(link);
			}
			return link as HTMLAnchorElement;
		}
		static async aDoc(link: Link) {
			let a = this.toAnchor(link);
			if (!a) throw new Error('not a link');
			a.classList.add('paginate-spin');
			let doc = await fetch.doc(a.href);
			this.doc = doc;
			return doc;
		}
		static async aCachedDoc(link: Link) {
			let a = this.toAnchor(link);
			if (!a) throw new Error('not a link');
			a.classList.add('paginate-spin');
			let doc = await fetch.cached.doc(a.href);
			a.classList.remove('paginate-spin');
			this.doc = doc;
			return doc;
		}
		static appendChildren(doc, source, target = source) {
			if (typeof doc == 'string')
				return this.appendChildren(this.doc, doc, source);
			let children = [...doc.q(source).children];
			q(target).append(...children);
			document.documentElement.emit('paginationchange', children);
			return this;
		}
		static afterLast(doc, source, target = source) {
			if (typeof doc == 'string')
				return this.afterLast(this.doc, doc, source);
			let children = doc.qq(source);
			let last = qq(target).pop();
			last.after(...children);
			document.documentElement.emit('paginationchange');
			return this;
		}
		static replace(doc: Document, source: string, target?: string): typeof paginate;
		static replace(source: string, target?: string): typeof paginate;
		static replace(doc: Document | string, source: string, target = source): typeof paginate {
			if (typeof doc == 'string')
				return this.replace(this.doc, doc, source);
			let child = doc.q(source)
			q(target).replaceWith(child);
			document.documentElement.emit('paginationchange', [child]);
			return this;
		}

		static prefetch(enabled: any, link: string | Element): typeof paginate;
		static prefetch(link: string | Element): typeof paginate;
		static prefetch(enabled: any, link?: string | Element) {
			if (!link) {
				link = enabled;
			} else {
				if (!enabled) return;
			}
			if (typeof link == 'string') {
				if (!link.startsWith('http')) {
					link = q(link);
				}
			}
			if (typeof link != 'string') {
				link = (link as HTMLAnchorElement).href;
			}
			elm(`link[rel="prefetch"][href="${link}"]`).appendTo('head');
			return this;
		}

		static imageScrollingActive = false;
		static imageScrolling(selector?: string) {
			if (this.imageScrollingActive) return;
			if (selector) this.imgSelector = selector;
			this.imageScrollingActive = true;
			document.addEventListener(
				'mousewheel',
				(e: any) => {
					this.scrollWholeImage(-Math.sign(e.wheelDeltaY));
					e.preventDefault();
				}, {
				passive: false
			}
			);

		}
		static imgSelector = 'img';
		static imgToWindowCenter(img) {
			let rect = img.getBoundingClientRect();
			return rect.y + rect.height / 2 - innerHeight / 2;
		}
		static getImages() {
			return qq(this.imgSelector);
		}
		static getCentralImg() {
			return this.getImages().vsort(img => Math.abs(this.imgToWindowCenter(img)))[0];
		}
		static scrollWholeImage(dir = 1) {
			let img = this.getCentralImg();
			let images = this.getImages();
			let index = images.indexOf(img);
			let nextImg = images[index + (dir == 1 ? 1 : -1)];
			let delta = this.imgToWindowCenter(nextImg);
			scrollBy(0, delta);
		}
	};


}