namespace PoopJs {

	export namespace QuerySelector {

		export namespace WindowQ {
			export function q<K extends keyof HTMLElementTagNameMap>(selector: K): HTMLElementTagNameMap[K];
			export function q<E extends Element = HTMLElement>(selector: string): E;
			export function q<K extends keyof HTMLElementTagNameMap>(selector: string): HTMLElementTagNameMap[K];
			export function q(selector: string) {
				return document.querySelector(selector);
			}

			export function qq<K extends keyof HTMLElementTagNameMap>(selector: K): (HTMLElementTagNameMap[K])[];
			export function qq<E extends Element = HTMLElement>(selector: string): E[];
			export function qq<K extends keyof HTMLElementTagNameMap>(selector: string): (HTMLElementTagNameMap[K])[];
			export function qq(selector: string) {
				return [...document.querySelectorAll(selector)];
			}
		}

		export namespace DocumentQ {
			export function q<K extends keyof HTMLElementTagNameMap>(this: Document, selector: K): HTMLElementTagNameMap[K];
			export function q<E extends Element = HTMLElement>(this: Document, selector: string): E;
			export function q<K extends keyof HTMLElementTagNameMap>(this: Document, selector: string): HTMLElementTagNameMap[K];
			export function q(this: Document, selector: string) {
				return this.documentElement.querySelector(selector);
			}

			export function qq<K extends keyof HTMLElementTagNameMap>(this: Document, selector: K): (HTMLElementTagNameMap[K])[];
			export function qq<E extends Element = HTMLElement>(this: Document, selector: string): E[];
			export function qq<K extends keyof HTMLElementTagNameMap>(this: Document, selector: string): (HTMLElementTagNameMap[K])[];
			export function qq(this: Document, selector: string) {
				return [...this.documentElement.querySelectorAll(selector)];
			}
		}

		export namespace ElementQ {
			export function q<K extends keyof HTMLElementTagNameMap>(this: Element, selector: K): HTMLElementTagNameMap[K];
			export function q<E extends Element = HTMLElement>(this: Element, selector: string): E;
			export function q<K extends keyof HTMLElementTagNameMap>(this: Element, selector: string): HTMLElementTagNameMap[K];
			export function q(this: Element, selector: string) {
				return this.querySelector(selector);
			}

			export function qq<K extends keyof HTMLElementTagNameMap>(this: Element, selector: K): (HTMLElementTagNameMap[K])[];
			export function qq<E extends Element = HTMLElement>(this: Element, selector: string): E[];
			export function qq<K extends keyof HTMLElementTagNameMap>(this: Element, selector: string): (HTMLElementTagNameMap[K])[];
			export function qq(this: Element, selector: string) {
				return [...this.querySelectorAll(selector)];
			}
		}
	}

	export namespace ElementExtension {
		export function emit(this: Element, type: string, detail?: any) {
			let event = new CustomEvent(type, {
				bubbles: true,
				detail,
			});
			this.dispatchEvent(event);
		}

		export function appendTo(this: Element, parent: Element);
		export function appendTo(this: Element, selector: string);
		export function appendTo(this: Element, parent: Element | string) {
			if (typeof parent == 'string') {
				parent = document.querySelector(parent);
			}
			parent.append(this);
			return this;
		}
	}

}
