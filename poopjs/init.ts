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

	export function __init__(window: Window & typeof globalThis): "inited" | "already inited" {
		if (!window) window = globalThis.window as Window & typeof globalThis;

		window.elm = Elm.elm;
		window.q = Object.assign(QuerySelector.WindowQ.q, { orElm: PoopJs.Elm.qOrElm });
		window.qq = QuerySelector.WindowQ.qq;
		ObjectExtension.defineValue(window.Element.prototype, 'q', QuerySelector.ElementQ.q);
		ObjectExtension.defineValue(window.Element.prototype, 'qq', QuerySelector.ElementQ.qq);
		ObjectExtension.defineValue(window.Element.prototype, 'appendTo', ElementExtension.appendTo);
		ObjectExtension.defineValue(window.Element.prototype, 'emit', ElementExtension.emit);
		ObjectExtension.defineValue(window.Document.prototype, 'q', QuerySelector.DocumentQ.q);
		ObjectExtension.defineValue(window.Document.prototype, 'qq', QuerySelector.DocumentQ.qq);

		ObjectExtension.defineValue(window.Promise, 'empty', PromiseExtension.empty);
		ObjectExtension.defineValue(window.Promise, 'frame', PromiseExtension.frame);
		ObjectExtension.defineValue(window.Promise, 'raf', PromiseExtension.frame);

		window.fetch.cached = FetchExtension.cached as any;
		window.fetch.doc = FetchExtension.doc as any;
		window.fetch.json = FetchExtension.json as any;
		window.fetch.cached.doc = FetchExtension.cachedDoc;
		window.fetch.doc.cached = FetchExtension.cachedDoc;
		window.fetch.cachedDoc = FetchExtension.cachedDoc;
		window.fetch.json.cached = FetchExtension.cachedJson;
		window.fetch.cached.json = FetchExtension.cachedJson;
		window.fetch.isCached = FetchExtension.isCached;
		ObjectExtension.defineValue(window.Response.prototype, 'cachedAt', 0);
		ObjectExtension.defineValue(window.Document.prototype, 'cachedAt', 0);

		ObjectExtension.defineValue(window.Object, 'defineValue', ObjectExtension.defineValue);
		ObjectExtension.defineValue(window.Object, 'defineGetter', ObjectExtension.defineGetter);
		// ObjectExtension.defineValue(Object, 'map', ObjectExtension.map);

		ObjectExtension.defineValue(window.Array, 'map', ArrayExtension.map);
		ObjectExtension.defineValue(window.Array.prototype, 'pmap', ArrayExtension.PMap.this_pmap);
		ObjectExtension.defineValue(window.Array.prototype, 'vsort', ArrayExtension.vsort);
		if (![].at)
			ObjectExtension.defineValue(window.Array.prototype, 'at', ArrayExtension.at);
		if (![].findLast)
			ObjectExtension.defineValue(window.Array.prototype, 'findLast', ArrayExtension.findLast);

		window.paginate = PoopJs.paginate as any;
		window.imageScrolling = PoopJs.ImageScrollingExtension;

		ObjectExtension.defineValue(window, '__init__', 'already inited');
		return 'inited';
	}

	ObjectExtension.defineGetter(window, '__init__', () => __init__(window));
	// Object.assign(globalThis, { PoopJs });

	if (window.localStorage.__init__) {
		window.__init__;
	}

}