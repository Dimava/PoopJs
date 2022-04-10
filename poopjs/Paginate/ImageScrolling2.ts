

namespace PoopJs {


	export class ScrollInfo {
		el: HTMLElement;
		/** absolute rect */
		rect: DOMRect;

		constructor(el: HTMLElement) {
			this.el = el;
			let rect = el.getBoundingClientRect();
			function n(v: number) { return +v.toFixed(3); }
			this.rect = new DOMRect(
				n(rect.x / innerWidth), n((rect.y + scrollY) / innerHeight),
				n(rect.width / innerWidth), n(rect.height / innerHeight));
		}
		topOffset(scrollY = window.scrollY) {
			let windowY = scrollY / innerHeight;
			let offset = this.rect.top - windowY;
			return +offset.toFixed(3);
		}
		centerOffset(scrollY = window.scrollY) {
			let windowY = scrollY / innerHeight + 0.5;
			let offset = this.rect.top + this.rect.height / 2 - windowY;
			return +offset.toFixed(3);
		}
		bottomOffset(scrollY = window.scrollY) {
			let windowY = scrollY / innerHeight + 1;
			let offset = this.rect.bottom - windowY;
			return +offset.toFixed(3);
		}
		distanceFromScreen(scrollY = window.scrollY) {
			let windowY = scrollY / innerHeight;
			if (this.rect.bottom < windowY - 0.0001) return this.rect.bottom - windowY;
			if (this.rect.top > windowY + 1.001) return this.rect.top - windowY - 1;
		}

		get fullDir() {
			if (this.topOffset() < -0.001)
				return -1;
			if (this.bottomOffset() > 0.001)
				return 1;
			return 0;
		}
		get _offsets() {
			return [this.topOffset(), this.centerOffset(), this.bottomOffset()];
		}

	}

	export class ImageScroller {
		selector = 'img';

		enabled = false;
		disableWheel = false;
		listener?: any;

		stopPropagation = false;

		constructor(selector = '') {
			if (selector) this.selector = selector;
		}

		_wheelListener?: (event: WheelEvent) => void;
		onWheelScrollFailed?: (event: WheelEvent) => void;
		bindWheel() {
			if (this._wheelListener) return;
			let l = this._wheelListener = (event) => {
				if (this._wheelListener != l) return removeEventListener('wheel', l);
				if (!this.enabled) return;
				if (!event.deltaY) return;
				if (event.shiftKey || event.ctrlKey) return;
				if (this.scroll(Math.sign(event.deltaY))) {
					event.preventDefault();
					this.stopPropagation && event.stopImmediatePropagation();
				} else {
					this.onWheelScrollFailed?.(event);
				}
			}
			addEventListener('wheel', this._wheelListener, { passive: false });
		}
		_arrowListener?: (event: KeyboardEvent) => void;
		bindArrows() {
			if (this._arrowListener) return;
			this._arrowListener = (event) => {
				if (!this.enabled) return;
				if (event.code == 'ArrowLeft') {
					if (this.scroll(-1)) {
						event.preventDefault();
						this.stopPropagation && event.stopImmediatePropagation();
					}
				}
				if (event.code == 'ArrowRight') {
					if (this.scroll(1)) {
						event.preventDefault();
						this.stopPropagation && event.stopImmediatePropagation();
					}
				}

			}
			addEventListener('keydown', this._arrowListener, { capture: true });
		}

		/** enable this scroller */
		on(selector = ''): this {
			if (selector) this.selector = selector;
			this.enabled = true;
			this.bindArrows();
			this.bindWheel();
			return this;
		}

		/** disable this scroller */
		off(selector = ''): this {
			if (selector) this.selector = selector;
			this.enabled = false;
			return this;
		}

		mode: 'single' | 'group' = 'group';

		/** scroll to the next item */
		scroll(dir: -1 | 0 | 1): boolean {
			if (this.mode == 'group') {
				return this.scrollToNextGroup(dir);
			}
			if (this.mode == 'single') {
				return this.scrollToNextCenter(dir);
			}
		}


		scrollToNextCenter(dir: -1 | 0 | 1): boolean {
			let next = this._nextScrollTarget(dir, 'single');
			if (PoopJs.debug) { console.log(`scroll: `, next); }
			if (!next) return false;
			next.el.scrollIntoView({ block: 'center' });
			return true;
		}

		scrollToNextGroup(dir: -1 | 0 | 1): boolean {
			let next = this._nextScrollTarget(dir, 'group');
			if (PoopJs.debug) { console.log(`scroll: `, next); }
			if (!next || !next.length) return false;
			let y = (next[0].rect.top + next.at(-1).rect.bottom - 1) / 2;
			// fixme
			if (Math.abs(scrollY / innerHeight - y) > 0.750) {
				if (!this.getAllScrolls().find(e => e.fullDir == 0)) {
					if (PoopJs.debug) { console.log(`scroll too far`, next); }
					return false;
				}
			}
			scrollTo(0, y * innerHeight);
			return true;
		}

		_nextScrollTarget(dir: -1 | 0 | 1, mode: 'single'): ScrollInfo | undefined;
		_nextScrollTarget(dir: -1 | 0 | 1, mode: 'group'): ScrollInfo[] | undefined;
		_nextScrollTarget(dir: -1 | 0 | 1, mode: 'single' | 'group') {
			let scrolls = this.getAllScrolls();
			if (mode == 'single') {
				if (dir == -1) {
					return scrolls.findLast(e => e.fullDir == -1);
				}
				if (dir == 0) {
					let list = scrolls.filter(e => e.fullDir == 0);
					return list[~~(list.length / 2)];
				}
				if (dir == 1) {
					return scrolls.find(e => e.fullDir == 1);
				}
			}
			if (mode == 'group') {
				if (dir == -1) {
					let last = scrolls.findLast(e => e.fullDir == -1);
					if (!last) return;
					return scrolls.filter(e => Math.abs(e.rect.top - last.rect.bottom) <= 1.001 && e.fullDir == -1);
				}
				if (dir == 0) {
					return scrolls.filter(e => e.fullDir == 0);
				}
				if (dir == 1) {
					let last = scrolls.find(e => e.fullDir == 1);
					if (!last) return;
					return scrolls.filter(e => Math.abs(last.rect.top - e.rect.bottom) <= 1.001 && e.fullDir == 1);
				}
			}
		}


		getAllScrolls(selector = this.selector) {
			return qq(selector).map(e => new ScrollInfo(e)).vsort(e => e.centerOffset());
		}





		/** used  */
		async keep(resizer: () => any | Promise<any>, raf = false) {
			let pos = this.save();
			await resizer();
			pos.restore();
			if (raf) {
				await Promise.frame();
				pos.restore();
			}
		}

		/** save current item scroll position */
		save(): { info: ScrollInfo, offset: number, restore(): void } {
			let scrolls = this.getAllScrolls();
			if (!scrolls.length) {
				return { info: undefined as any, offset: -1, restore: () => { } };
			}
			let info = scrolls.vsort(e => Math.abs(e.centerOffset()))[0];
			let offset = info.centerOffset();
			function restore() {
				let newInfo = new ScrollInfo(info.el);
				let newOffset = newInfo.centerOffset();
				scrollTo(0, scrollY + (newOffset - offset) * innerHeight);
			}
			return { info, offset, restore };
		}


		static createDefault(): ImageScroller {
			return new ImageScroller();
		}
	}

	export declare let is: ImageScroller;

	defineLazy(PoopJs, 'is', () => ImageScroller.createDefault());


	function defineLazy<T, K extends keyof T, V extends T[K]>(
		target: T, prop: K, get: (this: void) => V
	) {
		Object.defineProperty(target, prop, {
			get: () => {
				Object.defineProperty(target, prop, {
					value: get(),
					configurable: true,
					writable: true,
				});
				return target[prop];
			},
			set(v) {
				Object.defineProperty(target, prop, {
					value: v,
					configurable: true,
					writable: true,
				});
				return target[prop];
			},
			configurable: true,
		});
	}

	const vars = {} as Record<string, number | string>;
	export const styleVars = new Proxy(vars as Record<string, string>, {
		get(target, prop: string): string {
			if (prop.startsWith('--')) prop = prop.slice(2);
			let style = document.body.style;
			let v = style.getPropertyValue('--' + prop);
			target[prop] = v;
			return v;
		},
		set(target, prop: string, v: string): true {
			if (prop.startsWith('--')) prop = prop.slice(2);
			let style = document.body.style;
			target[prop] = v;
			style.setProperty('--' + prop, v + '');
			return true;
		},
	});
	export const styleVarsN = new Proxy(vars as Record<string, number>, {
		get(target, prop: string): number {
			if (prop.startsWith('--')) prop = prop.slice(2);
			let style = document.body.style;
			let v: string = style.getPropertyValue('--' + prop);
			return +v;
		},
		set(target, prop: string, v: number): true {
			if (prop.startsWith('--')) prop = prop.slice(2);
			let style = document.body.style;
			target[prop] = +v;
			style.setProperty('--' + prop, v + '');
			return true;
		},
	});

}

