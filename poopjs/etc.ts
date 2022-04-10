namespace PoopJs {
	export let debug = false;

	export namespace etc {


		export async function fullscreen(on?: boolean) {
			let central = ImageScrollingExtension.imageScrollingActive && ImageScrollingExtension.getCentralImg();
			if (!document.fullscreenElement) {
				if (on == false) return;
				await document.documentElement.requestFullscreen().catch(() => { });
			} else {
				if (on == true) return;
				await document.exitFullscreen().catch(() => { });
			}
			if (central) {
				central.scrollIntoView();
			}
			return !!document.fullscreenElement;
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
			function onwheel(event: WheelEvent) {
				if (event.defaultPrevented) return;
				if (event.ctrlKey || event.shiftKey) return;
				scrollBy(0, -Math.sign(event.deltaY) * innerHeight * fastScroll.speed);
				event.preventDefault();
			}
			addEventListener('wheel', onwheel, { passive: false });
			fastScroll.off = () => {
				fastScroll.active = false;
				removeEventListener('wheel', onwheel);
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

		export declare const kds: {
			[k: string]: string | ((e: KeyboardEvent & MouseEvent) => void)
		};

		Object.defineProperty(etc, 'kds', {
			configurable: true,
			get() {
				let kds = initKds();
				Object.defineProperty(etc, 'kds', { value: kds });
				return kds;
			},
		});
		Object.defineProperty(PoopJs, 'kds', {
			configurable: true,
			enumerable: true,
			get: () => etc.kds,
			set: (v) => Object.assign(etc.kds, v),
		});

		export function generateKdsCodes(e: KeyboardEvent & MouseEvent) {
			let basePrefix = `${e.shiftKey ? '<' : ''}${e.ctrlKey ? '^' : ''}${e.altKey ? '>' : ''}`;
			let baseCode = e.code
				? e.code.replace(/Key|Digit|Arrow|Left|Right/, '')
				: ['LMB', 'RMB', 'MMB'][e.button];
			let extraCode = e.code
				? baseCode.replace('Control', 'Ctrl')
				: baseCode;// ['Left', 'Right', 'Middle'][e.button];
			let rawCode = e.code ?? baseCode;
			let keyCode = e.key ?? baseCode;
			let extraPrefix = basePrefix.replace(
				baseCode == 'Shift' ? '<' : baseCode == 'Control' ? '^' : baseCode == 'Alt' ? '>' : ''
				, '');

			let codes = [baseCode, extraCode, rawCode, keyCode].flatMap(
				c => [basePrefix, extraPrefix].map(p => p + c)
			);
			//.flatMap(e => [e, e.toUpperCase(), e.toLowerCase()]);
			codes.push(e.code ? 'key' : 'mouse');
			codes.push('any');
			return Array.from(new Set(codes));
		}
		export function kdsListener(e: KeyboardEvent & MouseEvent) {
			let codes = generateKdsCodes(e);
			Object.assign(e, { _codes: codes });
			for (let c of codes) {
				let listener = etc.kds[c];
				if (typeof listener == 'string') {
					q(listener).click();
				} else if (typeof listener == 'function') {
					(etc.kds[c] as any)(e);
				}
			}
		}
		function initKds() {
			addEventListener('keydown', kdsListener);
			addEventListener('mousedown', kdsListener);
			return {};
		}
	}
	export declare let kds: typeof etc.kds;
}

