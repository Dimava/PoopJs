namespace PoopJs {

	export namespace Elm {
		type Child = Node | string | number | boolean;
		type SomeEvent = Event & MouseEvent & KeyboardEvent & { target: HTMLElement };
		type Listener = (event: SomeEvent) => any;

		const elmRegex = new RegExp([
			/^(?<tag>[\w-]+)/,
			/#(?<id>[\w-]+)/,
			/\.(?<class>[\w-]+)/,
			/\[(?<attr1>[\w-]+)\]/,
			/\[(?<attr2>[\w-]+)=(?!['"])(?<val2>[^\]]*)\]/,
			/\[(?<attr3>[\w-]+)="(?<val3>(?:[^"]|\\")*)"\]/,
			/\[(?<attr4>[\w-]+)="(?<val4>(?:[^']|\\')*)"\]/,
		].map(e => e.source).join('|'), 'g');

		
		export function elm<K extends keyof HTMLElementTagNameMap>(selector: K, ...children: (Child | Listener)[]): HTMLElementTagNameMap[K];
		export function elm<E extends Element = HTMLElement>(selector?: string, ...children: (Child | Listener)[]): E;
		export function elm<K extends keyof HTMLElementTagNameMap>(selector: string, ...children: (Child | Listener)[]): HTMLElementTagNameMap[K];
		export function elm(): HTMLDivElement;
		/**
		 * Creates an element matching provided selector, with provided children and listeners
		 */
		export function elm(selector: string = '', ...children: (Child | Listener)[]): HTMLElement {
			if (selector.replaceAll(elmRegex, '') != '') {
				throw new Error(`invalid selector: ${selector}`);
			}
			let element: HTMLElement = document.createElement('div');
			for (let match of selector.matchAll(elmRegex)) {
				if (match.groups.tag) {
					element = document.createElement(match.groups.tag);
				} else if (match.groups.id) {
					element.id = match.groups.id;
				} else if (match.groups.class) {
					element.classList.add(match.groups.class);
				} else if (match.groups.attr1) {
					element.setAttribute(match.groups.attr1, "true");
				} else if (match.groups.attr2) {
					element.setAttribute(match.groups.attr2, match.groups.val2);
				} else if (match.groups.attr3) {
					element.setAttribute(match.groups.attr3, match.groups.val3.replace(/\\"/g, '"'));
				} else if (match.groups.attr4) {
					element.setAttribute(match.groups.attr4, match.groups.val4.replace(/\\'/g, '\''));
				}
			}
			for (let listener of children.filter(e => typeof e == 'function') as Listener[]) {
				let name = listener.name;
				if (!name) name = (listener + '').match(/\w+/)[0];
				if (name.startsWith('on')) name = name.slice(2);
				if (element['on' + name] === null) {
					element['on' + name] = listener;
				} else {
					element.addEventListener(name, listener);
				}
			}
			element.append(...children.filter(e => typeof e != 'function') as (Node | string)[]);
			return element;
		}
	}

}