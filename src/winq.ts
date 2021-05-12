

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




