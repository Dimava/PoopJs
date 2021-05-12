

// export const winq: typeof HTMLElement.prototype.querySelector | ((selector: string, el: ParentNode) => HTMLElement)
// 	= function q(selector: string, ) {

// 	};


export function q<K extends keyof HTMLElementTagNameMap>(this: Element,selector: K): HTMLElementTagNameMap[K] | null;
export function q<E extends Element = Element>(this: Element,selector: string): E | null;
export function q(this: Element,selector: string) {
	return this.querySelector(selector);
}


export function qq<K extends keyof HTMLElementTagNameMap>(this: Element, selector: K): (HTMLElementTagNameMap[K])[];
export function qq<E extends Element = Element>(this: Element, selector: string): E[];
export function qq(this: Element, selector: string) {
	return [...this.querySelectorAll(selector)];
}







// function q(sel, el = document) {
// 	return el.querySelector(sel);
// }
// function qq(sel, el = document) {
// 	return [...el.querySelectorAll(sel)];
// }
