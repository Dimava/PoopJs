
export function q<K extends keyof HTMLElementTagNameMap>(this: HTMLDocument, selector: K): HTMLElementTagNameMap[K] | null;
export function q<E extends Element = Element>(this: HTMLDocument, selector: string): E | null;
export function q(this: HTMLDocument, selector: string) {
	return this.documentElement.querySelector(selector);
}


export function qq<K extends keyof HTMLElementTagNameMap>(this: HTMLDocument, selector: K): (HTMLElementTagNameMap[K])[];
export function qq<E extends Element = Element>(this: HTMLDocument, selector: string): E[];
export function qq(this: HTMLDocument, selector: string) {
	return [...this.documentElement.querySelectorAll(selector)];
}




