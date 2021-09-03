namespace PoopJs {
	export type ValueOf<T> = T[keyof T];
	export type MappedObject<T, V> = {[P in keyof T]: V};
}


declare const __init__: "inited" | "already inited";
declare const elm: typeof PoopJs.Elm.elm;
declare const q: typeof PoopJs.QuerySelector.WindowQ.q;
declare const qq: typeof PoopJs.QuerySelector.WindowQ.qq;
declare const paginate: typeof PoopJs.paginate;
declare const DateNowHack: typeof PoopJs.DateNowHack.DateNowHack;
declare namespace fetch {
	export const cached: typeof PoopJs.FetchExtension.cached & { doc: typeof PoopJs.FetchExtension.cachedDoc, json: typeof PoopJs.FetchExtension.cachedJson };
	export const doc: typeof PoopJs.FetchExtension.doc & { cached: typeof PoopJs.FetchExtension.cachedDoc };
	export const cachedDoc: typeof PoopJs.FetchExtension.cachedDoc;
	export const json: typeof PoopJs.FetchExtension.json & {cached:typeof PoopJs.FetchExtension.cachedJson };
}

interface Window {
	readonly __init__: "inited" | "already inited";
	elm: typeof PoopJs.Elm.elm;
	q: typeof PoopJs.QuerySelector.WindowQ.q;
	qq: typeof PoopJs.QuerySelector.WindowQ.qq;
	paginate: typeof PoopJs.paginate;
	DateNowHack: typeof PoopJs.DateNowHack.DateNowHack;
	fetch: {
		(input: RequestInfo, init?: RequestInit): Promise<Response>;
		cached: typeof PoopJs.FetchExtension.cached & { doc: typeof PoopJs.FetchExtension.cachedDoc, json: typeof PoopJs.FetchExtension.cachedJson };
		doc: typeof PoopJs.FetchExtension.doc & { cached: typeof PoopJs.FetchExtension.cachedDoc };
		cachedDoc: typeof PoopJs.FetchExtension.cachedDoc;
		json: typeof PoopJs.FetchExtension.json & {cached:typeof PoopJs.FetchExtension.cachedJson };
	}
}

interface Element {
	q: typeof PoopJs.QuerySelector.ElementQ.q;
	qq: typeof PoopJs.QuerySelector.ElementQ.qq;
	appendTo: typeof PoopJs.ElementExtension.appendTo;
	emit: typeof PoopJs.ElementExtension.emit;
}

interface Document {
	q: typeof PoopJs.QuerySelector.DocumentQ.q;
	qq: typeof PoopJs.QuerySelector.DocumentQ.qq;
}

interface ObjectConstructor {
	defineValue: typeof PoopJs.ObjectExtension.defineValue;
	defineGetter: typeof PoopJs.ObjectExtension.defineGetter;
	map: typeof PoopJs.ObjectExtension.map;
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