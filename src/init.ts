/// <reference path="./Array.ts" />
/// <reference path="./DateNowHack.ts" />
/// <reference path="./element.ts" />
/// <reference path="./elm.ts" />
/// <reference path="./Filterer/EntityFilterer.ts" />
/// <reference path="./etc.ts" />
/// <reference path="./fetch.ts" />
/// <reference path="./Object.ts" />
/// <reference path="./observer.ts" />
/// <reference path="./Paginate/Pagination.ts" />
/// <reference path="./Paginate/ImageScrolling.ts" />
/// <reference path="./Promise.ts" />





namespace PoopJs {

	export function __init__(window: Window): "inited" | "already inited" {
		if (!window) window = globalThis.window as Window;

		window.elm = Elm.elm;
		window.q = Object.assign(QuerySelector.WindowQ.q, { orElm: PoopJs.Elm.qOrElm });
		window.qq = QuerySelector.WindowQ.qq;
		ObjectExtension.defineValue(Element.prototype, 'q', QuerySelector.ElementQ.q);
		ObjectExtension.defineValue(Element.prototype, 'qq', QuerySelector.ElementQ.qq);
		ObjectExtension.defineValue(Element.prototype, 'appendTo', ElementExtension.appendTo);
		ObjectExtension.defineValue(Element.prototype, 'emit', ElementExtension.emit);
		ObjectExtension.defineValue(Document.prototype, 'q', QuerySelector.DocumentQ.q);
		ObjectExtension.defineValue(Document.prototype, 'qq', QuerySelector.DocumentQ.qq);

		ObjectExtension.defineValue(Promise, 'empty', PromiseExtension.empty);
		ObjectExtension.defineValue(Promise, 'frame', PromiseExtension.frame);
		ObjectExtension.defineValue(Promise, 'raf', PromiseExtension.frame);

		window.fetch.cached = FetchExtension.cached as any;
		window.fetch.doc = FetchExtension.doc as any;
		window.fetch.json = FetchExtension.json as any;
		window.fetch.cached.doc = FetchExtension.cachedDoc;
		window.fetch.doc.cached = FetchExtension.cachedDoc;
		window.fetch.cachedDoc = FetchExtension.cachedDoc;
		window.fetch.json.cached = FetchExtension.cachedJson;
		window.fetch.cached.json = FetchExtension.cachedJson;
		ObjectExtension.defineValue(Response.prototype, 'cachedAt', 0);
		ObjectExtension.defineValue(Document.prototype, 'cachedAt', 0);

		ObjectExtension.defineValue(Object, 'defineValue', ObjectExtension.defineValue);
		ObjectExtension.defineValue(Object, 'defineGetter', ObjectExtension.defineGetter);
		// ObjectExtension.defineValue(Object, 'map', ObjectExtension.map);

		ObjectExtension.defineValue(Array, 'map', ArrayExtension.map);
		ObjectExtension.defineValue(Array.prototype, 'pmap', ArrayExtension.pmap);
		ObjectExtension.defineValue(Array.prototype, 'vsort', ArrayExtension.vsort);

		window.paginate = PoopJs.paginate as any;
		window.imageScrolling = PoopJs.ImageScrollingExtension;

		ObjectExtension.defineValue(window, '__init__', 'already inited');
		return 'inited';
	}

	ObjectExtension.defineGetter(window, '__init__', () => __init__(window));

	if (window.localStorage.__init__) {
		window.__init__;
	}

}