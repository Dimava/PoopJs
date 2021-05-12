namespace PoopJs {

	export namespace winq {
		export function q<K extends keyof HTMLElementTagNameMap>(selector: K, parent?: ParentNode): HTMLElementTagNameMap[K] | null;
		export function q<E extends Element = Element>(selector: string, parent?: ParentNode): E | null;
		export function q(selector: string, parent: ParentNode = document) {
			return parent.querySelector(selector);
		}

		export function qq<K extends keyof HTMLElementTagNameMap>(selector: K, parent?: ParentNode): (HTMLElementTagNameMap[K])[];
		export function qq<E extends Element = Element>(selector: string, parent?: ParentNode): E[];
		export function qq(selector: string, parent: ParentNode = document) {
			return [...parent.querySelectorAll(selector)];
		}
	}

	export namespace docq {
		export function q<K extends keyof HTMLElementTagNameMap>(this: Document, selector: K): HTMLElementTagNameMap[K] | null;
		export function q<E extends Element = Element>(this: Document, selector: string): E | null;
		export function q(this: Document, selector: string) {
			return this.documentElement.querySelector(selector);
		}

		export function qq<K extends keyof HTMLElementTagNameMap>(this: Document, selector: K): (HTMLElementTagNameMap[K])[];
		export function qq<E extends Element = Element>(this: Document, selector: string): E[];
		export function qq(this: Document, selector: string) {
			return [...this.documentElement.querySelectorAll(selector)];
		}
	}

	export namespace element {
		export function q<K extends keyof HTMLElementTagNameMap>(this: Element, selector: K): HTMLElementTagNameMap[K] | null;
		export function q<E extends Element = Element>(this: Element, selector: string): E | null;
		export function q(this: Element, selector: string) {
			return this.querySelector(selector);
		}

		export function qq<K extends keyof HTMLElementTagNameMap>(this: Element, selector: K): (HTMLElementTagNameMap[K])[];
		export function qq<E extends Element = Element>(this: Element, selector: string): E[];
		export function qq(this: Element, selector: string) {
			return [...this.querySelectorAll(selector)];
		}

		export function emit(this: Element, type, detail) {
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


	// Object.defineGetter(Element.prototype, function data(){
	// 	let data = JSON.parse(this.dataset.data || '{}');
	// 	return new Proxy(data, {
	// 		get: (target, name) => {
	// 			if (name == 'data') return data;
	// 			return data[name];
	// 		},
	// 		set: (target, name, value) => {
	// 			data[name] = value;
	// 			this.dataset.data = JSON.stringify(data);
	// 		},
	// 	});
	// });