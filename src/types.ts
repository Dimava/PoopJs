namespace PoopJs {

}


declare const __init__: "inited" | "already inited";
elm: typeof PoopJs.Elm.elm;
declare const q: typeof PoopJs.winq.q;
declare const qq: typeof PoopJs.winq.qq;
// @ts-ignore
declare const fetch: {
	(input: RequestInfo, init?: RequestInit): Promise<Response>;
	cached: typeof PoopJs.Fetch.cached & { doc: typeof PoopJs.Fetch.cachedDoc };
	doc: typeof PoopJs.Fetch.doc & { cached: typeof PoopJs.Fetch.cachedDoc };
	cachedDoc: typeof PoopJs.Fetch.cachedDoc;
}

interface Window {
	readonly __init__: "inited" | "already inited";
	elm: typeof PoopJs.Elm.elm;
	q: typeof PoopJs.winq.q;
	qq: typeof PoopJs.winq.qq;
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
	appentTo: typeof PoopJs.element.appendTo;
}

interface Document {
	q: typeof PoopJs.docq.q;
	qq: typeof PoopJs.docq.qq;
}

interface ObjectConstructor {
	defineValue: typeof PoopJs.object.defineValue;
	defineGetter: typeof PoopJs.object.defineGetter;
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
