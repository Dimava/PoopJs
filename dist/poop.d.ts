declare namespace PoopJs {
    namespace ArrayExtension {
        function pmap<T, V>(this: T[], mapper: (e: T, i: number, a: T[]) => Promise<V> | V, threads?: number): Promise<V[]>;
        function map<T = number>(this: ArrayConstructor, length: number, mapper?: (number: any) => T): T[];
        function vsort<T>(this: T[], mapper: (e: T, i: number, a: T[]) => number, sorter?: ((a: number, b: number, ae: T, be: T) => number) | -1): T[];
    }
}
declare namespace PoopJs {
    namespace DateNowHack {
        function DateNowHack(n?: number): void;
    }
}
declare namespace PoopJs {
    namespace EntryFiltererExtension {
        type Wayness = false | true | 'dir';
        type Mode = 'off' | 'on' | 'opposite';
        type ParserFn<Data> = (el: HTMLElement, data: Partial<Data>) => Partial<Data> | PromiseLike<Partial<Data>> | void;
        type FilterFn<Data> = (data: Data, el: HTMLElement) => boolean | number;
        type SorterFn<Data> = (data: Data, el: HTMLElement) => number;
        type ModifierFn<Data> = (data: Data, el: HTMLElement, mode: Mode, oldMode: Mode | null) => void;
        type FilterWIFn<Data, V> = ((data: Data, el: HTMLElement, ...values: V[]) => boolean | number);
        export class FiltererItem<Data> {
            id: string;
            name?: string;
            description?: string;
            threeWay: Wayness;
            mode: Mode;
            parent: EntryFilterer;
            button: HTMLButtonElement;
            incompatible?: string[];
            hidden: boolean;
            constructor(selector: string, data: Partial<FiltererItem<Data>>);
            click(event: MouseEvent): void;
            contextmenu(event: MouseEvent): void;
            toggleMode(mode: Mode, force?: boolean): void;
            remove(): void;
            show(): void;
            hide(): void;
        }
        export class Filter<Data> extends FiltererItem<Data> {
            filter: FilterFn<Data>;
            constructor(data?: Partial<Filter<Data>>);
            /** returns if item should be visible */
            apply(data: Data, el: HTMLElement): boolean;
        }
        export class FilterWithInput<Data, V extends number | string> extends Filter<Data> {
            filter: FilterWIFn<Data, V>;
            input: HTMLInputElement | string | number;
            constructor(data: Partial<FilterWithInput<Data, V>>);
            convert: (e: HTMLInputElement) => V;
            /** returns if item should be visible */
            apply(data: Data, el: HTMLElement): boolean;
        }
        export class Sorter<Data> extends FiltererItem<Data> {
            sorter: SorterFn<Data>;
            constructor(data: Partial<Sorter<Data>>);
            toggleMode(mode: Mode, force?: boolean): void;
            /** returns order of entry */
            apply(data: Data, el: HTMLElement): number;
        }
        export class Modifier<Data> extends FiltererItem<Data> {
            modifier: ModifierFn<Data>;
            runOnNoChange: boolean;
            constructor(data: Partial<Modifier<Data>>);
            toggleMode(mode: Mode, force?: boolean): void;
            apply(data: Data, el: HTMLElement): void;
        }
        export class EntryFilterer<Data extends {} = {}> {
            on: boolean;
            container: HTMLElement;
            entrySelector: string | (() => HTMLElement[]);
            constructor(entrySelector: string | (() => HTMLElement[]), enabled?: boolean);
            entries: HTMLElement[];
            entryDatas: Map<HTMLElement, Data>;
            getData(el: HTMLElement): Data;
            updatePending: boolean;
            reparsePending: boolean;
            requestUpdate(reparse?: boolean): void;
            addItem<T extends FiltererItem<Data>>(id: string, data: Partial<T>, list: T[], constructor: (item: Partial<T>) => T): T;
            parsers: ParserFn<Data>[];
            writeDataAttribute: boolean;
            addParser(parser: ParserFn<Data>): void;
            parseEntry(el: HTMLElement): Data;
            filters: Filter<Data>[];
            addFilter(id: string, filter: FilterFn<Data>, data?: Partial<Filter<Data>>): Filter<Data>;
            addFilterWithInput<V extends string | number>(id: string, filter: FilterWIFn<Data, V>, data?: Partial<FilterWithInput<Data, V>> & {
                input?: V;
            }): Filter<Data>;
            sorters: Sorter<Data>[];
            addSorter(id: string, sorter: SorterFn<Data>, data?: Partial<Sorter<Data>>): Sorter<Data>;
            modifiers: Modifier<Data>[];
            addModifier(id: string, modifier: ModifierFn<Data>, data?: Partial<Modifier<Data>>): Modifier<Data>;
            filterEntries(): void;
            sortEntries(): void;
            modifyEntries(): void;
            moveToTop(item: Sorter<Data> | Modifier<Data>): void;
            update(reparse?: boolean): void;
            offIncompatible(incompatible: string[]): void;
            style(s?: string): this;
            static style(s?: string): void;
            disabled: boolean;
            disable(): void;
            enable(): void;
            clear(): void;
            get _datas(): Data[];
        }
        export {};
    }
    let EntryFilterer: typeof EntryFiltererExtension.EntryFilterer;
}
declare namespace PoopJs {
    namespace EntryFiltererExtension2 {
        type Wayness = false | true | 'dir';
        type Mode = 'off' | 'on' | 'opposite';
        type ParserFn<Data> = (el: HTMLElement, data: Partial<Data>) => Partial<Data> | PromiseLike<Partial<Data>> | void;
        type FilterFn<Data> = (data: Data, el: HTMLElement) => boolean;
        type SorterFn<Data> = (data: Data, el: HTMLElement) => number;
        type ModifierFn<Data> = (data: Data, el: HTMLElement, mode: Mode, oldMode: Mode | null) => void;
        class FiltererItem<Data> {
            id: string;
            name?: string;
            description?: string;
            threeWay: Wayness;
            mode: Mode;
            parent: EntryFilterer;
            button: HTMLButtonElement;
            incompatible?: string[];
            hidden: boolean;
            constructor(selector: string, data: Partial<FiltererItem<Data>>);
            click(event: MouseEvent): void;
            contextmenu(event: MouseEvent): void;
            toggleMode(mode: Mode, force?: boolean): void;
            remove(): void;
            show(): void;
            hide(): void;
        }
        class Filter<Data> extends FiltererItem<Data> {
            filter: FilterFn<Data>;
            constructor(data?: Partial<Filter<Data>>);
            /** returns if item should be visible */
            apply(data: Data, el: HTMLElement): boolean;
        }
        class Sorter<Data> extends FiltererItem<Data> {
            sorter: SorterFn<Data>;
            constructor(data: Partial<Sorter<Data>>);
            toggleMode(mode: Mode, force?: boolean): void;
            /** returns order of entry */
            apply(data: Data, el: HTMLElement): number;
        }
        class Modifier<Data> extends FiltererItem<Data> {
            modifier: ModifierFn<Data>;
            runOnNoChange: boolean;
            constructor(data: Partial<Modifier<Data>>);
            toggleMode(mode: Mode, force?: boolean): void;
            apply(data: Data, el: HTMLElement): void;
        }
        class EntryFilterer<Data extends {} = {}> {
            on: boolean;
            container: HTMLElement;
            entrySelector: string | (() => HTMLElement[]);
            constructor(entrySelector: string | (() => HTMLElement[]), enabled?: boolean);
            entries: HTMLElement[];
            entryDatas: Map<HTMLElement, Data>;
            getData(el: HTMLElement): Data;
            updatePending: boolean;
            reparsePending: boolean;
            requestUpdate(reparse?: boolean): void;
            addItem<T extends FiltererItem<Data>>(id: string, data: Partial<T>, list: T[], constructor: (item: Partial<T>) => T): T;
            parsers: ParserFn<Data>[];
            writeDataAttribute: boolean;
            addParser(parser: ParserFn<Data>): void;
            parseEntry(el: HTMLElement): Data;
            filters: Filter<Data>[];
            addFilter(id: string, filter: FilterFn<Data>, data?: Partial<Filter<Data>>): Filter<Data>;
            sorters: Sorter<Data>[];
            addSorter(id: string, sorter: SorterFn<Data>, data?: Partial<Sorter<Data>>): Sorter<Data>;
            modifiers: Modifier<Data>[];
            addModifier(id: string, modifier: ModifierFn<Data>, data?: Partial<Modifier<Data>>): Modifier<Data>;
            filterEntries(): void;
            sortEntries(): void;
            modifyEntries(): void;
            moveToTop(item: Sorter<Data> | Modifier<Data>): void;
            update(reparse?: boolean): void;
            offIncompatible(incompatible: string[]): void;
            style(s?: string): this;
            static style(s?: string): void;
            disabled: boolean;
            disable(): void;
            enable(): void;
            clear(): void;
            get _datas(): Data[];
        }
    }
    let EF2: typeof EntryFiltererExtension2.EntryFilterer;
}
declare namespace PoopJs {
    namespace ObjectExtension {
        function defineValue<T>(o: T, p: keyof T, value: any): T;
        function defineValue<T>(o: T, fn: Function): T;
        function defineGetter<T>(o: T, p: keyof T, get: () => ValueOf<T>): T;
        function defineGetter<T>(o: T, get: Function): T;
        function map<T, V>(o: T, mapper: (v: ValueOf<T>, k: keyof T, o: T) => V): MappedObject<T, V>;
    }
}
declare namespace PoopJs {
    namespace PromiseExtension {
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
    namespace QuerySelector {
        namespace WindowQ {
            function q<K extends keyof HTMLElementTagNameMap>(selector: K, parent?: ParentNode): HTMLElementTagNameMap[K] | null;
            function q<E extends Element = HTMLElement>(selector: string, parent?: ParentNode): E | null;
            function qq<K extends keyof HTMLElementTagNameMap>(selector: K, parent?: ParentNode): (HTMLElementTagNameMap[K])[];
            function qq<E extends Element = HTMLElement>(selector: string, parent?: ParentNode): E[];
        }
        namespace DocumentQ {
            function q<K extends keyof HTMLElementTagNameMap>(this: Document, selector: K): HTMLElementTagNameMap[K] | null;
            function q<E extends Element = HTMLElement>(this: Document, selector: string): E | null;
            function qq<K extends keyof HTMLElementTagNameMap>(this: Document, selector: K): (HTMLElementTagNameMap[K])[];
            function qq<E extends Element = HTMLElement>(this: Document, selector: string): E[];
        }
        namespace ElementQ {
            function q<K extends keyof HTMLElementTagNameMap>(this: Element, selector: K): HTMLElementTagNameMap[K] | null;
            function q<E extends Element = HTMLElement>(this: Element, selector: string): E | null;
            function qq<K extends keyof HTMLElementTagNameMap>(this: Element, selector: K): (HTMLElementTagNameMap[K])[];
            function qq<E extends Element = HTMLElement>(this: Element, selector: string): E[];
        }
    }
    namespace ElementExtension {
        function emit(this: Element, type: string, detail?: any): void;
        function appendTo(this: Element, parent: Element): any;
        function appendTo(this: Element, selector: string): any;
    }
}
declare namespace PoopJs {
    namespace Elm {
        type Child = Node | string;
        type Listener = (event: Event | MouseEvent | KeyboardEvent) => any;
        /**
         * Creates an element matching provided selector, with provided children and listeners
         */
        export function elm<T extends HTMLElement>(selector?: string, ...children: (Child | Listener)[]): T;
        export function elm(selector?: string, ...children: (Child | Listener)[]): HTMLElement;
        export function elm(selector: `input${string}`, ...children: (Child | Listener)[]): HTMLInputElement;
        export function elm(selector: `img${string}`, ...children: (Child | Listener)[]): HTMLImageElement;
        export function elm(selector: `button${string}`, ...children: (Child | Listener)[]): HTMLButtonElement;
        export {};
    }
}
declare namespace PoopJs {
    namespace etc {
        function keybind(key: string, fn: (event: KeyboardEvent) => void): () => void;
        function fullscreen(on?: boolean): Promise<void>;
        function anybind(keyOrEvent: string | number, fn: (event: Event) => void): void;
        function fullscreenOn(key: string): () => void;
        function fIsForFullscreen(): void;
        function hashCode(this: string): any;
        function hashCode(value: string): any;
        function init(): void;
        function currentScriptHash(): any;
        function reloadOnCurrentScriptChanged(scriptName?: string): void;
        let fastScroll: {
            (speed?: number): void;
            speed?: number;
            active?: boolean;
            off?: () => void;
        };
        function onraf(f: () => void): () => void;
        function onheightchange(f: (newHeight: number, oldHeight: number) => void): () => void;
    }
}
declare namespace PoopJs {
    namespace FetchExtension {
        let defaults: RequestInit;
        function cached(url: string, init?: RequestInit): Promise<Response>;
        function cachedDoc(url: string, init?: RequestInit): Promise<Document>;
        function cachedJson(url: string, init?: RequestInit): Promise<unknown>;
        function doc(url: string): Promise<Document>;
        function json(url: string, init?: RequestInit): Promise<unknown>;
        function clearCache(): Promise<boolean>;
    }
}
declare namespace PoopJs {
    class Observer {
    }
}
declare namespace PoopJs {
    type Link = Element | string | `http${string}`;
    export namespace paginate {
        let active: boolean;
        let queued: number;
        let wip: boolean;
        let doc: Document;
        function init(): void;
        function paginationrequest(event: any): void;
        function run(): void;
        function onrun(condition: any, fn?: any): void;
        function onRunO(data: {
            prefetch?: string | string[];
            click?: string;
            aDoc?: string;
            afterLast?: string | string[];
            replace?: string | string[];
        }): any;
        function onRunO(condition: any, data: {
            prefetch?: string | string[];
            click?: string;
            aDoc?: string;
            afterLast?: string | string[];
            replace?: string | string[];
        }): any;
        function onchange(condition: any, fn?: any): void;
        function end(): void;
        function onend(condition: any, fn?: any): void;
        function toHref(link: Link): string;
        function toAnchor(link: Link): HTMLAnchorElement;
        function aDoc(link: Link): Promise<Document>;
        function aCachedDoc(link: Link): Promise<Document>;
        function appendChildren(doc: any, source: any, target?: any): any;
        function afterLast(doc: Document, source: string, target?: string): typeof paginate;
        function afterLast(source: string, target?: string): typeof paginate;
        function replace(doc: Document, source: string, target?: string): typeof paginate;
        function replace(source: string, target?: string): typeof paginate;
        function replaceEach(doc: Document, source: string, target?: string): typeof paginate;
        function replaceEach(source: string, target?: string): typeof paginate;
        function prefetch(enabled: any, link: Link): boolean;
        function prefetch(link: Link): boolean;
        let imageScrollingActive: boolean;
        let imgSelector: string;
        function imageScrolling(selector?: string): () => void;
        let imageScrollingOff: () => void;
        function imgToWindowCenter(img: Element): number;
        function getAllImageInfo(): {
            img: HTMLImageElement;
            rect: DOMRect;
            index: number;
            inScreen: boolean;
            crossScreen: boolean;
            yToScreenCenter: number;
            isInCenter: boolean;
            isScreenHeight: boolean;
        }[];
        let scrollWholeImagePending: boolean;
        function getCentralImg(): HTMLImageElement;
        function scrollWholeImage(dir?: number): boolean;
    }
    export {};
}
declare namespace PoopJs {
    function __init__(window: Window): "inited" | "already inited";
}
declare namespace PoopJs {
    type ValueOf<T> = T[keyof T];
    type MappedObject<T, V> = {
        [P in keyof T]: V;
    };
}
declare const __init__: "inited" | "already inited";
declare const elm: typeof PoopJs.Elm.elm;
declare const q: typeof PoopJs.QuerySelector.WindowQ.q;
declare const qq: typeof PoopJs.QuerySelector.WindowQ.qq;
declare const paginate: typeof PoopJs.paginate;
declare const DateNowHack: typeof PoopJs.DateNowHack.DateNowHack;
declare namespace fetch {
    const cached: typeof PoopJs.FetchExtension.cached & {
        doc: typeof PoopJs.FetchExtension.cachedDoc;
        json: typeof PoopJs.FetchExtension.cachedJson;
    };
    const doc: typeof PoopJs.FetchExtension.doc & {
        cached: typeof PoopJs.FetchExtension.cachedDoc;
    };
    const cachedDoc: typeof PoopJs.FetchExtension.cachedDoc;
    const json: typeof PoopJs.FetchExtension.json & {
        cached: typeof PoopJs.FetchExtension.cachedJson;
    };
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
        cached: typeof PoopJs.FetchExtension.cached & {
            doc: typeof PoopJs.FetchExtension.cachedDoc;
            json: typeof PoopJs.FetchExtension.cachedJson;
        };
        doc: typeof PoopJs.FetchExtension.doc & {
            cached: typeof PoopJs.FetchExtension.cachedDoc;
        };
        cachedDoc: typeof PoopJs.FetchExtension.cachedDoc;
        json: typeof PoopJs.FetchExtension.json & {
            cached: typeof PoopJs.FetchExtension.cachedJson;
        };
    };
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
