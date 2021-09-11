namespace PoopJs {
	export namespace etc {
		export function keybind(key: string, fn: (event: KeyboardEvent) => void) {
			let code = key.length == 1 ? 'Key' + key.toUpperCase() : key;
			function onkeydown(event: KeyboardEvent) {
				if (event.code == code) {
					fn(event);
				}
			}
			addEventListener('keydown', onkeydown);
			return () => removeEventListener('keydown', onkeydown);
		}

		export async function fullscreen(on?: boolean) {
			let central = ImageScrollingExtension.imageScrollingActive && ImageScrollingExtension.getCentralImg();
			if (!document.fullscreenElement) {
				if (on == false) return;
				await document.documentElement.requestFullscreen();
			} else {
				if (on == true) return;
				await document.exitFullscreen();
			}
			if (central) {
				central.scrollIntoView();
			}
		}

		export function anybind(keyOrEvent: string | number, fn: (event: Event) => void) {
			if (typeof keyOrEvent == "number") keyOrEvent = keyOrEvent + '';
			// detect if it is event
			let isEvent = window.hasOwnProperty('on' + keyOrEvent);
			if (isEvent) {
				addEventListener(keyOrEvent, fn);
				return;
			}
			// parse key code
			if (!isNaN(parseInt(keyOrEvent))) {
				keyOrEvent = `Digit${keyOrEvent}`;
			} else if (keyOrEvent.length == 1) {
				keyOrEvent = `Key${keyOrEvent.toUpperCase()}`;
			}
			addEventListener('keydown', ev => {
				if (ev.code != keyOrEvent) return;
				fn(ev);
			});
		}

		export function fullscreenOn(key: string) {
			if (key == 'scroll') {
				addEventListener('scroll', () => fullscreen(true));
				return;
			}
			return keybind(key, () => fullscreen());
		}

		export function fIsForFullscreen() {
			keybind('F', () => fullscreen());
		}

		export function hashCode(this: string);
		export function hashCode(value: string);
		export function hashCode(this: string, value?: string) {
			value ??= this;
			let hash = 0;
			for (let c of value) {
				hash = ((hash << 5) - hash) + c.charCodeAt(0);
				hash = hash & hash;
			}
			return hash;
		}

		export function init() {
			// String.prototype.hashCode = hashCode;
		}

		export function currentScriptHash() {
			return hashCode(document.currentScript.innerHTML);
		}

		export function reloadOnCurrentScriptChanged(scriptName: string = location.hostname + '.ujs') {
			let scriptId = `reloadOnCurrentScriptChanged_${scriptName}`;
			let scriptHash = currentScriptHash() + '';
			localStorage.setItem(scriptId, scriptHash);
			addEventListener('focus', () => {
				if (localStorage.getItem(scriptId) != scriptHash) {
					location.reload();
				}
			});
		}

		export let fastScroll: {
			(speed?: number): void;
			speed?: number;
			active?: boolean;
			off?: () => void;
		} = function (speed = 0.25) {
			if (fastScroll.active) fastScroll.off();
			fastScroll.active = true;
			fastScroll.speed = speed;
			function onwheel(event: MouseEvent & { wheelDeltaY: number }) {
				if (event.defaultPrevented) return;
				if (event.ctrlKey || event.shiftKey) return;
				scrollBy(0, -Math.sign(event.wheelDeltaY) * innerHeight * fastScroll.speed);
				event.preventDefault();
			}
			addEventListener('mousewheel', onwheel, { passive: false });
			fastScroll.off = () => {
				fastScroll.active = false;
				removeEventListener('mousewheel', onwheel);
			}
		}
		fastScroll.active = false;
		fastScroll.off = () => { };



		export function onraf(f: () => void) {
			let loop = true;
			void async function () {
				while (loop) {
					await Promise.frame();
					f();
				}
			}();
			return () => { loop = false };
		}

		let resizeObserver: ResizeObserver;
		let resizeListeners: ((newHeight: number, oldHeight: number) => void)[] = [];
		let previousBodyHeight = 0;
		export function onheightchange(f: (newHeight: number, oldHeight: number) => void) {
			if (!resizeObserver) {
				previousBodyHeight = document.body.clientHeight;
				resizeObserver = new ResizeObserver(entries => {
					for (let e of entries) {
						if (e.target != document.body) continue;

						let newBodyHeight = e.target.clientHeight;
						for (let f of resizeListeners) {
							f(newBodyHeight, previousBodyHeight);
						}
						previousBodyHeight = newBodyHeight;
					}
				});
				resizeObserver.observe(document.body);
			}
			resizeListeners.push(f);
			return function removeListener() {
				resizeListeners.splice(resizeListeners.indexOf(f));
			}
		}
	}
}

// interface String {
// 	hashCode: () => number;
// }
