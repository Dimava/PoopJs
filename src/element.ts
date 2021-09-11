namespace PoopJs {

	export namespace QuerySelector {

		export namespace WindowQ {
			export function q<K extends keyof HTMLElementTagNameMap>(selector: K): HTMLElementTagNameMap[K];
			export function q<E extends Element = HTMLElement>(selector: selector): E;
			export function q<K extends keyof HTMLElementTagNameMap>(selector: selector): HTMLElementTagNameMap[K];
			export function q(selector: string) {
				return document.querySelector(selector);
			}

			export function qq<K extends keyof HTMLElementTagNameMap>(selector: K): (HTMLElementTagNameMap[K])[];
			export function qq<E extends Element = HTMLElement>(selector: selector): E[];
			export function qq<K extends keyof HTMLElementTagNameMap>(selector: selector): (HTMLElementTagNameMap[K])[];
			export function qq(selector: string) {
				return [...document.querySelectorAll(selector)];
			}
		}

		export namespace DocumentQ {
			export function q<K extends keyof HTMLElementTagNameMap>(this: Document, selector: K): HTMLElementTagNameMap[K];
			export function q<E extends Element = HTMLElement>(this: Document, selector: selector): E;
			export function q<K extends keyof HTMLElementTagNameMap>(this: Document, selector: selector): HTMLElementTagNameMap[K];
			export function q(this: Document, selector: string) {
				return this.documentElement.querySelector(selector);
			}

			export function qq<K extends keyof HTMLElementTagNameMap>(this: Document, selector: K): (HTMLElementTagNameMap[K])[];
			export function qq<E extends Element = HTMLElement>(this: Document, selector: selector): E[];
			export function qq<K extends keyof HTMLElementTagNameMap>(this: Document, selector: selector): (HTMLElementTagNameMap[K])[];
			export function qq(this: Document, selector: string) {
				return [...this.documentElement.querySelectorAll(selector)];
			}
		}

		export namespace ElementQ {
			export function q<K extends keyof HTMLElementTagNameMap>(this: Element, selector: K): HTMLElementTagNameMap[K];
			export function q<E extends Element = HTMLElement>(this: Element, selector: selector): E;
			export function q<K extends keyof HTMLElementTagNameMap>(this: Element, selector: selector): HTMLElementTagNameMap[K];
			export function q(this: Element, selector: string) {
				return this.querySelector(selector);
			}

			export function qq<K extends keyof HTMLElementTagNameMap>(this: Element, selector: K): (HTMLElementTagNameMap[K])[];
			export function qq<E extends Element = HTMLElement>(this: Element, selector: selector): E[];
			export function qq<K extends keyof HTMLElementTagNameMap>(this: Element, selector: selector): (HTMLElementTagNameMap[K])[];
			export function qq(this: Element, selector: string) {
				return [...this.querySelectorAll(selector)];
			}
		}
	}

	export namespace ElementExtension {
		export function emit<T extends CustomEvent<{ _event?: string }>>(this: Element, type: T['detail']['_event'], detail?: T['detail']);
		export function emit<T>(this: Element, type: string, detail?: T) {
			let event = new CustomEvent(type, {
				bubbles: true,
				detail,
			});
			this.dispatchEvent(event);
		}

		export function appendTo<E extends Element>(this: E, parent: Element | selector): E {
			if (typeof parent == 'string') {
				parent = document.querySelector(parent);
			}
			parent.append(this);
			return this;
		}
	}

}
