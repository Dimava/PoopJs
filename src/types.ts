namespace PoopJs {
	export type ValueOf<T> = T[keyof T];
	export type MappedObject<T, V> = {[P in keyof T]: V};
}


declare const __init__: "inited" | "already inited";
declare const elm: typeof PoopJs.Elm.elm;
declare const q: typeof PoopJs.winq.q;
declare const qq: typeof PoopJs.winq.qq;
declare const paginate: typeof PoopJs.paginate;
declare const DateNowHack: typeof PoopJs.DateNowHack.DateNowHack;
declare namespace fetch {
	export const cached: typeof PoopJs.Fetch.cached & { doc: typeof PoopJs.Fetch.cachedDoc };
	export const doc: typeof PoopJs.Fetch.doc & { cached: typeof PoopJs.Fetch.cachedDoc };
	export const cachedDoc: typeof PoopJs.Fetch.cachedDoc;
}

interface Window {
	readonly __init__: "inited" | "already inited";
	elm: typeof PoopJs.Elm.elm;
	q: typeof PoopJs.winq.q;
	qq: typeof PoopJs.winq.qq;
	paginate: typeof PoopJs.paginate;
	DateNowHack: typeof PoopJs.DateNowHack.DateNowHack;
	fetch: {
		(input: RequestInfo, init?: RequestInit): Promise<Response>;
		cached: typeof PoopJs.Fetch.cached & { doc: typeof PoopJs.Fetch.cachedDoc };
		doc: typeof PoopJs.Fetch.doc & { cached: typeof PoopJs.Fetch.cachedDoc };
		cachedDoc: typeof PoopJs.Fetch.cachedDoc;
	}
}

interface Element {
	q: typeof PoopJs.element.q;
	qq: typeof PoopJs.element.qq;
	appendTo: typeof PoopJs.element.appendTo;
	emit: typeof PoopJs.element.emit;
}

interface Document {
	q: typeof PoopJs.docq.q;
	qq: typeof PoopJs.docq.qq;
}

interface ObjectConstructor {
	defineValue: typeof PoopJs.object.defineValue;
	defineGetter: typeof PoopJs.object.defineGetter;
	map: typeof PoopJs.object.map;
}
interface PromiseConstructor {
	empty: typeof PoopJs.promise.empty;
	frame: typeof PoopJs.promise.frame;
	raf: typeof PoopJs.promise.frame;
}

interface Array<T> {
	vsort: typeof PoopJs.array.vsort;
	pmap: typeof PoopJs.array.pmap;
}
interface ArrayConstructor {
	map: typeof PoopJs.array.map;
}

interface DateConstructor {
	_now(): number;
}
interface Date {
	_getTime(): number;
}