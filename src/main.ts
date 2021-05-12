import { defineValue, defineGetter } from "./Object";
import { elm } from "./elm";
import { q as winq, qq as winqq } from "./winq";
import "./types";
import { empty as promiseEmpty, frame as promiseFrame } from "./Promise";
import { cached, cachedDoc, doc } from "./fetch";





export function __init__(window: Window): "inited" | "already inited" {
	if (!window) window = globalThis.window as unknown as Window;
	if (Object.prototype.hasOwnProperty.call(window, '__init__')) return 'already inited';

	window.elm = elm;
	window.q = winq;
	window.qq = winqq;

	defineValue(Promise, 'empty', promiseEmpty);
	defineValue(Promise, 'frame', promiseFrame);
	defineValue(Promise, 'raf', promiseFrame);

	window.fetch.cached = cached as any;
	window.fetch.doc = doc as any;
	window.fetch.cached.doc = cachedDoc;
	window.fetch.doc.cached = cachedDoc;
	window.fetch.cachedDoc = cachedDoc;






	// globalThis.DateNowHack = DateNowHack;
	// globalThis.paginate = paginate;
	
	
	// Array.map = map;
	// Object.defineValue = defineValue;
	// Object.defineGetter = defineGetter;
	// Object.map = function(o, mapper) {
	// 	return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, mapper(v, k, o)]));
	// }
	// Object.defineValue(Array.prototype, pmap);
	// Object.defineValue(Array.prototype, vsort);
}

defineGetter(window, '__init__', __init__);