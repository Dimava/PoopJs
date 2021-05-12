import { elm as _elm } from "./elm";
import { cached, cachedDoc, doc } from "./fetch";
import { defineGetter, defineValue } from "./Object";
import { empty, frame } from "./Promise";
import { q as winq, qq as winqq } from "./winq";


declare global {
	interface Window {
		readonly __init__: "inited" | "already inited";
		elm: typeof _elm;
		q: typeof winq;
		qq: typeof winqq;
		fetch: {
			(input: RequestInfo, init?: RequestInit): Promise<Response>;
			cached: typeof cached & { doc: typeof cachedDoc };
			doc: typeof doc & { cached: typeof cachedDoc };
			cachedDoc: typeof cachedDoc;
		}
	}
	interface ObjectConstructor {
		defineValue: typeof defineValue;
		defineGetter: typeof defineGetter;
	}
	interface PromiseConstructor {
		empty: typeof empty;
		frame: typeof frame;
		raf: typeof frame;
	}
}


declare const __init__: "inited" | "already inited";
declare const elm: typeof _elm;
declare const q: typeof winq;
declare const qq: typeof winqq;
declare const fetch: {

};