declare namespace PoopJs {
    namespace array {
        function pmap<T, V>(this: T[], mapper: (e: T, i: number, a: T[]) => Promise<V> | V, threads?: number): Promise<V[]>;
        function map<T = number>(this: ArrayConstructor, length: number, mapper?: (number: any) => T): T[];
        function vsort<T>(this: T[], mapper: (e: T, i: number, a: T[]) => number, sorter?: ((a: number, b: number, ae: T, be: T) => number) | -1): T[];
    }
}
declare namespace PoopJs {
    namespace object {
        function defineValue<T>(o: T, p: string, value: any): T & {};
        function defineValue<T>(o: T, fn: Function): T & {};
        function defineGetter<T>(o: T, p: keyof T, get: any): T & {};
        function defineGetter<T>(o: T, fn: Function): T & {};
    }
}
declare namespace PoopJs {
    namespace promise {
        type UnwrappedPromise<T> = Promise<T> & {
            resolve: (value: T | PromiseLike<T>) => void;
            reject: (reason?: any) => void;
            r: (value: T | PromiseLike<T>) => void;
            j: (reason?: any) => void;
        };
        /**
         * Creates unwrapped promise
         */
        export function empty<T>(): UnwrappedPromise<T>;
        export function frame(n?: number): Promise<number>;
        export {};
    }
}
declare namespace PoopJs {
    namespace winq {
        function q<K extends keyof HTMLElementTagNameMap>(selector: K, parent?: ParentNode): HTMLElementTagNameMap[K] | null;
        function q<E extends Element = Element>(selector: string, parent?: ParentNode): E | null;
        function qq<K extends keyof HTMLElementTagNameMap>(selector: K, parent?: ParentNode): (HTMLElementTagNameMap[K])[];
        function qq<E extends Element = Element>(selector: string, parent?: ParentNode): E[];
    }
    namespace docq {
        function q<K extends keyof HTMLElementTagNameMap>(this: Document, selector: K): HTMLElementTagNameMap[K] | null;
        function q<E extends Element = Element>(this: Document, selector: string): E | null;
        function qq<K extends keyof HTMLElementTagNameMap>(this: Document, selector: K): (HTMLElementTagNameMap[K])[];
        function qq<E extends Element = Element>(this: Document, selector: string): E[];
    }
    namespace element {
        function q<K extends keyof HTMLElementTagNameMap>(this: Element, selector: K): HTMLElementTagNameMap[K] | null;
        function q<E extends Element = Element>(this: Element, selector: string): E | null;
        function qq<K extends keyof HTMLElementTagNameMap>(this: Element, selector: K): (HTMLElementTagNameMap[K])[];
        function qq<E extends Element = Element>(this: Element, selector: string): E[];
        function emit(this: Element, type: any, detail: any): void;
        function appendTo(this: Element, parent: Element): any;
        function appendTo(this: Element, selector: string): any;
    }
}
declare namespace PoopJs {
    namespace Elm {
        type Child = any;
        type Listener = (event: Event) => any;
        /**
         * Creates an element matching provided selector, with provided children and listeners
         */
        export function elm(selector: string, ...children: (Child | Listener)[]): HTMLElement;
        export function elm(selector: `input${string}`, ...children: (Child | Listener)[]): HTMLInputElement;
        export function elm(selector: `img${string}`, ...children: (Child | Listener)[]): HTMLImageElement;
        export {};
    }
}
declare namespace PoopJs {
    namespace Fetch {
        function cached(url: string): Promise<Response>;
        function cachedDoc(url: string): Promise<Document>;
        function doc(url: string): Promise<Document>;
    }
}
declare namespace PoopJs {
    function __init__(window: Window): "inited" | "already inited";
}
declare namespace PoopJs {
}
declare const __init__: "inited" | "already inited";
declare const q: typeof PoopJs.winq.q;
declare const qq: typeof PoopJs.winq.qq;
declare const fetch: {
    (input: RequestInfo, init?: RequestInit): Promise<Response>;
    cached: typeof PoopJs.Fetch.cached & {
        doc: typeof PoopJs.Fetch.cachedDoc;
    };
    doc: typeof PoopJs.Fetch.doc & {
        cached: typeof PoopJs.Fetch.cachedDoc;
    };
    cachedDoc: typeof PoopJs.Fetch.cachedDoc;
};
interface Window {
    readonly __init__: "inited" | "already inited";
    elm: typeof PoopJs.Elm.elm;
    q: typeof PoopJs.winq.q;
    qq: typeof PoopJs.winq.qq;
    fetch: {
        (input: RequestInfo, init?: RequestInit): Promise<Response>;
        cached: typeof PoopJs.Fetch.cached & {
            doc: typeof PoopJs.Fetch.cachedDoc;
        };
        doc: typeof PoopJs.Fetch.doc & {
            cached: typeof PoopJs.Fetch.cachedDoc;
        };
        cachedDoc: typeof PoopJs.Fetch.cachedDoc;
    };
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
