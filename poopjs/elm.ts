namespace PoopJs {

	export namespace Elm {
		type Child = Node | string | number | boolean;
		type SomeEvent = Event & MouseEvent & KeyboardEvent & { target: HTMLElement };
		type Listener = ((event: SomeEvent) => any)
			& { name?: `${'' | 'bound '}${'on' | ''}${keyof HTMLElementEventMap}` | '' } | ((event: SomeEvent) => any);

		const elmRegex = new RegExp([
			/^(?<tag>[\w-]+)/,
			/#(?<id>[\w-]+)/,
			/\.(?<class>[\w-]+)/,
			/\[(?<attr1>[\w-]+)\]/,
			/\[(?<attr2>[\w-]+)=(?!['"])(?<val2>[^\]]*)\]/,
			/\[(?<attr3>[\w-]+)="(?<val3>(?:[^"]|\\")*)"\]/,
			/\[(?<attr4>[\w-]+)="(?<val4>(?:[^']|\\')*)"\]/,
		].map(e => e.source).join('|'), 'g');

		/** if `elm` should disallow listeners not existing as `on * ` property on the element */
		export let allowOnlyExistingListeners = true;

		/** if `elm` should allow overriding `on * ` listeners if multiple of them are provided */
		export let allowOverrideOnListeners = false;

		export function elm<K extends keyof HTMLElementTagNameMap>(selector: K, ...children: (Child | Listener)[]): HTMLElementTagNameMap[K];
		export function elm<K extends keyof HTMLElementTagNameMap>(selector: keyof HTMLElementTagNameMap extends K ? never : selector, ...children: (Child | Listener)[]): HTMLElementTagNameMap[K];
		export function elm<S extends selector, N = TagNameFromSelector<S>>(selector: S, ...children: (Child | Listener)[]): TagElementFromTagName<N>;
		export function elm<E extends Element = HTMLElement>(selector: selector, ...children: (Child | Listener)[]): E;
		export function elm(): HTMLDivElement;
		export function elm(selector: string = '', ...children: (Child | Listener)[]): HTMLElement {
			if (selector.replaceAll(elmRegex, '') != '') {
				throw new Error(`invalid selector: ${selector} `);
			}
			let element: HTMLElement = document.createElement('div');
			// let tag = '';
			// let firstMatch = false;
			for (let match of selector.matchAll(elmRegex)) {
				if (match.groups.tag) {
					// if (tag && match.groups.tag != tag) {
					// 	throw new Error(`selector has two different tags at once : <${tag}> and <${match.groups.tag}>`);
					// }
					// tag = match.groups.tag;
					// if (!firstMatch) return elm(tag + selector, ...children);
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
				// firstMatch = false;
			}
			for (let listener of children.filter(e => typeof e == 'function') as Listener[]) {
				let name: string = listener.name;
				if (!name) name = (listener + '').match(/\b(?!function\b)\w+/)[0];
				if (!name) throw new Error('trying to bind unnamed function');
				if (name.startsWith('bound ')) name = name.slice('bound '.length);
				if (name.startsWith('on')) {
					if (!element.hasOwnProperty(name)) throw new Error(`< ${element.tagName.toLowerCase()}> does not have "${name}" listener`);
					if (!allowOverrideOnListeners && element[name]) throw new Error('overriding `on * ` listeners is disabled');
					element[name] = listener;
				} else {
					if (allowOnlyExistingListeners && element['on' + name] === undefined)
						throw new Error(`<${element.tagName.toLowerCase()}> does not have "on'${name}'" listener`);
					element.addEventListener(name, listener);
				}
			}
			element.append(...children.filter(e => typeof e != 'function') as (Node | string)[]);
			return element;
		}

		export function qOrElm<K extends keyof HTMLElementTagNameMap>(selector: K, parent?: ParentNode | selector): HTMLElementTagNameMap[K];
		export function qOrElm<S extends selector, N = TagNameFromSelector<S>>(selector: S, parent?: ParentNode | selector): TagElementFromTagName<N>;
		export function qOrElm<E extends Element = HTMLElement>(selector: string, parent?: ParentNode | selector): E;
		export function qOrElm(selector: string, parent?: ParentNode | string) {
			if (typeof parent == 'string') {
				parent = document.querySelector(parent) as ParentNode;
				if (!parent) throw new Error('failed to find parent element');
			}
			if (selector.includes('>')) {
				let parentSelector = selector.split('>').slice(0, -1).join('>');
				selector = selector.split('>').pop();
				parent = (parent || document).querySelector(parentSelector) as ParentNode;
				if (!parent) throw new Error('failed to find parent element');
			}
			let child = (parent || document).querySelector(selector);
			if (child) return child;

			child = elm(selector);
			parent?.append(child);
			return child;
		}
	}

}