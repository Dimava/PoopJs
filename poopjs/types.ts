namespace PoopJs {
	export type ValueOf<T> = T[keyof T];
	export type MappedObject<T, V> = { [P in keyof T]: V };

	export type selector = string | string & { _?: 'selector' }
	export type url = `http${string}` & { _?: 'url' };
	export type Link = HTMLAnchorElement | selector | url;




	type trimStart<S, C extends string> = S extends `${C}${infer S1}` ? trimStart<S1, C> : S;
	type trimEnd<S, C extends string> = S extends `${infer S1}${C}` ? trimEnd<S1, C> : S;
	type trim<S, C extends string = ' ' | '\t' | '\n'> = trimStart<trimEnd<S, C>, C>;

	type split<S, C extends string> = S extends `${infer S1}${C}${infer S2}` ? split<S1, C> | split<S2, C> : S;
	type splitStart<S, C extends string> = S extends `${infer S1}${C}${infer _S2}` ? splitStart<S1, C> : S;
	type splitEnd<S, C extends string> = S extends `${infer _S1}${C}${infer S2}` ? splitEnd<S2, C> : S;

	type replace<S, C extends string, V extends string> = S extends `${infer S1}${C}${infer S3}` ? replace<`${S1}${V}${S3}`, C, V> : S;

	type ws = ' ' | '\t' | '\n';

	// type insaneSelector = ' a , b[qwe] \n , c.x , d#y , x e , x>f , x > g , [qwe] , h:not(x>y) , img ';

	// type _i1 = replace<insaneSelector, `[${string}]`, '.'>;
	// type _i15 = replace<_i1, `(${string})`, '.'>;
	// type _i17 = replace<_i15, Exclude<ws, ' '>, ' '>;
	// type _i2 = split<_i17, ','>;
	// type _i3 = trim<_i2>;
	// type _i4 = splitEnd<_i3, ws | '>'>;
	// type _i5 = splitStart<_i4, '.' | '#' | ':'>;
	// type _i6 = (HTMLElementTagNameMap & { '': HTMLElement } & { [k: string]: HTMLElement })[_i5];
	export type TagNameFromSelector<S extends string> = splitStart<splitEnd<trim<split<replace<replace<replace<S, `[${string}]`, '.'>, `(${string})`, '.'>, Exclude<ws, ' '>, ' '>, ','>>, ws | '>'>, '.' | '#' | ':'>;

	export type TagElementFromTagName<S> = S extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[S] : HTMLElement;
}


declare const __init__: "inited" | "already inited";
declare const elm: typeof PoopJs.Elm.elm;
declare const q: typeof PoopJs.QuerySelector.WindowQ.q & { orElm: typeof PoopJs.Elm.qOrElm };;
declare const qq: typeof PoopJs.QuerySelector.WindowQ.qq;
declare const paginate: typeof PoopJs.paginate;
declare const imageScrolling: typeof PoopJs.ImageScrollingExtension;
declare namespace fetch {
	export let cached: typeof PoopJs.FetchExtension.cached & { doc: typeof PoopJs.FetchExtension.cachedDoc, json: typeof PoopJs.FetchExtension.cachedJson };
	export let doc: typeof PoopJs.FetchExtension.doc & { cached: typeof PoopJs.FetchExtension.cachedDoc };
	export let cachedDoc: typeof PoopJs.FetchExtension.cachedDoc;
	export let json: typeof PoopJs.FetchExtension.json & { cached: typeof PoopJs.FetchExtension.cachedJson };
	export let isCached: typeof PoopJs.FetchExtension.isCached;
}

interface Window {
	readonly __init__: "inited" | "already inited";
	elm: typeof PoopJs.Elm.elm;
	q: typeof PoopJs.QuerySelector.WindowQ.q & { orElm: typeof PoopJs.Elm.qOrElm };
	qq: typeof PoopJs.QuerySelector.WindowQ.qq;
	paginate: typeof PoopJs.paginate;
	imageScrolling: typeof PoopJs.ImageScrollingExtension;
	fetch: {
		(input: RequestInfo, init?: RequestInit): Promise<Response>;
		cached: typeof PoopJs.FetchExtension.cached & { doc: typeof PoopJs.FetchExtension.cachedDoc, json: typeof PoopJs.FetchExtension.cachedJson };
		doc: typeof PoopJs.FetchExtension.doc & { cached: typeof PoopJs.FetchExtension.cachedDoc };
		cachedDoc: typeof PoopJs.FetchExtension.cachedDoc;
		json: typeof PoopJs.FetchExtension.json & { cached: typeof PoopJs.FetchExtension.cachedJson };
		isCached: typeof PoopJs.FetchExtension.isCached;
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


	fromEntries<K extends string | number | symbol, V>(
		entries: readonly (readonly [K, V])[]
	): { [k in K]: V };
}
interface PromiseConstructor {
	empty: typeof PoopJs.PromiseExtension.empty;
	frame: typeof PoopJs.PromiseExtension.frame;
	raf: typeof PoopJs.PromiseExtension.frame;
}

interface Array<T> {
	vsort: typeof PoopJs.ArrayExtension.vsort;
	// pmap: typeof PoopJs.ArrayExtension.pmap;
	pmap: typeof PoopJs.ArrayExtension.PMap.this_pmap;
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
interface Performance {
	_now: Performance['now'];
}
interface Window {
	_requestAnimationFrame: Window['requestAnimationFrame'];
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

// force allow ''.split('.').pop()!
interface String {
	split(splitter: string): [string, ...string[]];
}
interface Array<T> {
	pop(): this extends [T, ...T[]] ? T : T | undefined;
	at(index: number): T;
	findLast<S extends T>(predicate: (this: void, value: T, index: number, obj: T[]) => value is S, thisArg?: any): S | undefined;
	findLast(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): T | undefined;
}

interface Math {
	sign(x: number): -1 | 0 | 1;
}
