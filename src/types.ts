namespace PoopJs {
	export type ValueOf<T> = T[keyof T];
	export type MappedObject<T, V> = { [P in keyof T]: V };

	export type selector = string | (string & { _: 'selector' })
	export type url = `http${string}` & { _: 'url' };
	export type Link = HTMLAnchorElement | selector | url;
}


declare const __init__: "inited" | "already inited";
declare const elm: typeof PoopJs.Elm.elm;
declare const q: typeof PoopJs.QuerySelector.WindowQ.q & { orElm: typeof PoopJs.Elm.qOrElm };;
declare const qq: typeof PoopJs.QuerySelector.WindowQ.qq;
declare const paginate: typeof PoopJs.paginate;
declare const imageScrolling: typeof PoopJs.ImageScrollingExtension;
declare const DateNowHack: typeof PoopJs.DateNowHack.DateNowHack;
declare namespace fetch {
	export const cached: typeof PoopJs.FetchExtension.cached & { doc: typeof PoopJs.FetchExtension.cachedDoc, json: typeof PoopJs.FetchExtension.cachedJson };
	export const doc: typeof PoopJs.FetchExtension.doc & { cached: typeof PoopJs.FetchExtension.cachedDoc };
	export const cachedDoc: typeof PoopJs.FetchExtension.cachedDoc;
	export const json: typeof PoopJs.FetchExtension.json & { cached: typeof PoopJs.FetchExtension.cachedJson };
}

interface Window {
	readonly __init__: "inited" | "already inited";
	elm: typeof PoopJs.Elm.elm;
	q: typeof PoopJs.QuerySelector.WindowQ.q & { orElm: typeof PoopJs.Elm.qOrElm };
	qq: typeof PoopJs.QuerySelector.WindowQ.qq;
	paginate: typeof PoopJs.paginate;
	imageScrolling: typeof PoopJs.ImageScrollingExtension;
	DateNowHack: typeof PoopJs.DateNowHack.DateNowHack;
	fetch: {
		(input: RequestInfo, init?: RequestInit): Promise<Response>;
		cached: typeof PoopJs.FetchExtension.cached & { doc: typeof PoopJs.FetchExtension.cachedDoc, json: typeof PoopJs.FetchExtension.cachedJson };
		doc: typeof PoopJs.FetchExtension.doc & { cached: typeof PoopJs.FetchExtension.cachedDoc };
		cachedDoc: typeof PoopJs.FetchExtension.cachedDoc;
		json: typeof PoopJs.FetchExtension.json & { cached: typeof PoopJs.FetchExtension.cachedJson };
	}
}

interface Element {
	q: typeof PoopJs.QuerySelector.ElementQ.q;
	qq: typeof PoopJs.QuerySelector.ElementQ.qq;
	appendTo: typeof PoopJs.ElementExtension.appendTo;
	emit: typeof PoopJs.ElementExtension.emit;
	addEventListener<T extends CustomEvent<{ _event?: string }>>(type: T['detail']['_event'], listener: (this: Document, ev: T) => any, options?: boolean | AddEventListenerOptions): void;
}
interface Document {
	q: typeof PoopJs.QuerySelector.DocumentQ.q;
	qq: typeof PoopJs.QuerySelector.DocumentQ.qq;
	cachedAt: number;
	addEventListener<T extends CustomEvent<{ _event?: string }>>(type: T['detail']['_event'], listener: (this: Document, ev: T) => any, options?: boolean | AddEventListenerOptions): void;
}

interface ObjectConstructor {
	defineValue: typeof PoopJs.ObjectExtension.defineValue;
	defineGetter: typeof PoopJs.ObjectExtension.defineGetter;
	// map: typeof PoopJs.ObjectExtension.map;
	setPrototypeOf<T, P>(o: T, proto: P): T & P;
}
interface PromiseConstructor {
	empty: typeof PoopJs.PromiseExtension.empty;
	frame: typeof PoopJs.PromiseExtension.frame;
	raf: typeof PoopJs.PromiseExtension.frame;
}

interface Array<T> {
	vsort: typeof PoopJs.ArrayExtension.vsort;
	pmap: typeof PoopJs.ArrayExtension.pmap;
}
interface ArrayConstructor {
	map: typeof PoopJs.ArrayExtension.map;
}

interface DateConstructor {
	_now(): number;
}
interface Date {
	_getTime(): number;
}

interface Response {
	cachedAt: number;
}

// interface CustomEvent<T> {
// 	detail?: T;
// }

interface Function {
	bind<T, R, ARGS extends any[]>(this: (this: T, ...args: ARGS) => R, thisArg: T): ((...args: ARGS) => R)
}