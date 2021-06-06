/// <reference path="./Array.ts" />
/// <reference path="./DateNowHack.ts" />
/// <reference path="./Element.ts" />
/// <reference path="./elm.ts" />
/// <reference path="./fetch.ts" />
/// <reference path="./Object.ts" />
/// <reference path="./paginate.ts" />
/// <reference path="./Promise.ts" />




namespace PoopJs {

	export function __init__(window: Window): "inited" | "already inited" {
		if (!window) window = globalThis.window as Window;

		window.elm = Elm.elm;
		window.q = winq.q;
		window.qq = winq.qq;
		object.defineValue(Element.prototype, 'q', element.q);
		object.defineValue(Element.prototype, 'qq', element.qq);
		object.defineValue(Element.prototype, 'appendTo', element.appendTo);
		object.defineValue(Element.prototype, 'emit', element.emit);
		object.defineValue(Document.prototype, 'q', docq.q);
		object.defineValue(Document.prototype, 'qq', docq.qq);

		object.defineValue(Promise, 'empty', promise.empty);
		object.defineValue(Promise, 'frame', promise.frame);
		object.defineValue(Promise, 'raf', promise.frame);

		window.fetch.cached = Fetch.cached as any;
		window.fetch.doc = Fetch.doc as any;
		window.fetch.cached.doc = Fetch.cachedDoc;
		window.fetch.doc.cached = Fetch.cachedDoc;
		window.fetch.cachedDoc = Fetch.cachedDoc;

		object.defineValue(Object, 'defineValue', object.defineValue);
		object.defineValue(Object, 'defineGetter', object.defineGetter);
		Object.defineValue(Object, 'map', object.map);

		object.defineValue(Array, 'map', array.map);
		object.defineValue(Array.prototype, 'pmap', array.pmap);
		object.defineValue(Array.prototype, 'vsort', array.vsort);

		window.paginate = PoopJs.paginate;
		window.DateNowHack = PoopJs.DateNowHack.DateNowHack;

		object.defineValue(window, '__init__', 'already inited');
		return 'inited';
	}

	object.defineGetter(window, '__init__', () => __init__(window));

	if (window.localStorage.__init__) {
		window.__init__;
	}

}