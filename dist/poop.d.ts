declare namespace PoopJs {
    namespace ArrayExtension {
        function pmap<T, V>(this: T[], mapper: (e: T, i: number, a: T[]) => Promise<V> | V, threads?: number): Promise<V[]>;
        function map<T = number>(this: ArrayConstructor, length: number, mapper?: (number: any) => T): T[];
        function vsort<T>(this: T[], mapper: (e: T, i: number, a: T[]) => number, sorter?: ((a: number, b: number, ae: T, be: T) => number) | -1): any;
        function vsort<T, V>(this: T[], mapper: (e: T, i: number, a: T[]) => V, sorter: ((a: V, b: V, ae: T, be: T) => number) | -1): any;
    }
}
declare namespace PoopJs {
    namespace DateNowHack {
        function DateNowHack(n?: number): void;
    }
}
declare namespace PoopJs {
    namespace ObjectExtension {
        function defineValue<T, K extends keyof T>(o: T, p: K, value: T[K]): T;
        function defineValue<T>(o: T, fn: Function): T;
        function defineGetter<T, K extends keyof T>(o: T, p: K, get: () => T[K]): T;
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
            function q<K extends keyof HTMLElementTagNameMap>(selector: K): HTMLElementTagNameMap[K];
            function q<E extends Element = HTMLElement>(selector: selector): E;
            function q<K extends keyof HTMLElementTagNameMap>(selector: selector): HTMLElementTagNameMap[K];
            function qq<K extends keyof HTMLElementTagNameMap>(selector: K): (HTMLElementTagNameMap[K])[];
            function qq<E extends Element = HTMLElement>(selector: selector): E[];
            function qq<K extends keyof HTMLElementTagNameMap>(selector: selector): (HTMLElementTagNameMap[K])[];
        }
        namespace DocumentQ {
            function q<K extends keyof HTMLElementTagNameMap>(this: Document, selector: K): HTMLElementTagNameMap[K];
            function q<E extends Element = HTMLElement>(this: Document, selector: selector): E;
            function q<K extends keyof HTMLElementTagNameMap>(this: Document, selector: selector): HTMLElementTagNameMap[K];
            function qq<K extends keyof HTMLElementTagNameMap>(this: Document, selector: K): (HTMLElementTagNameMap[K])[];
            function qq<E extends Element = HTMLElement>(this: Document, selector: selector): E[];
            function qq<K extends keyof HTMLElementTagNameMap>(this: Document, selector: selector): (HTMLElementTagNameMap[K])[];
        }
        namespace ElementQ {
            function q<K extends keyof HTMLElementTagNameMap>(this: Element, selector: K): HTMLElementTagNameMap[K];
            function q<E extends Element = HTMLElement>(this: Element, selector: selector): E;
            function q<K extends keyof HTMLElementTagNameMap>(this: Element, selector: selector): HTMLElementTagNameMap[K];
            function qq<K extends keyof HTMLElementTagNameMap>(this: Element, selector: K): (HTMLElementTagNameMap[K])[];
            function qq<E extends Element = HTMLElement>(this: Element, selector: selector): E[];
            function qq<K extends keyof HTMLElementTagNameMap>(this: Element, selector: selector): (HTMLElementTagNameMap[K])[];
        }
    }
    namespace ElementExtension {
        function emit<T extends CustomEvent<{
            _event?: string;
        }>>(this: Element, type: T['detail']['_event'], detail?: T['detail']): any;
        function appendTo<E extends Element>(this: E, parent: Element | selector): E;
    }
}
declare namespace PoopJs {
    namespace Elm {
        type Child = Node | string | number | boolean;
        type SomeEvent = Event & MouseEvent & KeyboardEvent & {
            target: HTMLElement;
        };
        type Listener = (((event: SomeEvent) => any) & {
            name?: `${'' | 'bound '}${'on' | ''}${keyof HTMLElementEventMap}` | '';
        }) | ((event: SomeEvent) => any);
        /** if `elm` should disallow listeners not existing as `on * ` property on the element */
        export let allowOnlyExistingListeners: boolean;
        /** if `elm` should allow overriding `on * ` listeners if multiple of them are provided */
        export let allowOverrideOnListeners: boolean;
        export function elm<K extends keyof HTMLElementTagNameMap>(selector: K, ...children: (Child | Listener)[]): HTMLElementTagNameMap[K];
        export function elm<E extends Element = HTMLElement>(selector: selector, ...children: (Child | Listener)[]): E;
        export function elm<K extends keyof HTMLElementTagNameMap>(selector: selector, ...children: (Child | Listener)[]): HTMLElementTagNameMap[K];
        export function elm(): HTMLDivElement;
        export function qOrElm<K extends keyof HTMLElementTagNameMap>(selector: K, parent?: ParentNode | selector): HTMLElementTagNameMap[K];
        export function qOrElm<E extends Element = HTMLElement>(selector: string, parent?: ParentNode | selector): E;
        export function qOrElm<K extends keyof HTMLElementTagNameMap>(selector: string, parent?: ParentNode | selector): HTMLElementTagNameMap[K];
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
    namespace EntryFiltererExtension {
        /**
         * can be either Map or WeakMap
         * (WeakMap is likely to be useless if there are less then 10k old nodes in map)
         */
        let MapType: MapConstructor;
        type MapType<K extends object, V> = WeakMap<K, V>;
        export class EntryFilterer<Data extends {} = {}> {
            on: boolean;
            container: HTMLElement;
            entrySelector: selector | (() => HTMLElement[]);
            constructor(entrySelector: selector | (() => HTMLElement[]), enabled?: boolean);
            entries: HTMLElement[];
            entryDatas: MapType<HTMLElement, Data>;
            getData(el: HTMLElement): Data;
            updatePending: boolean;
            reparsePending: boolean;
            requestUpdate(reparse?: boolean): void;
            parsers: ParserFn<Data>[];
            writeDataAttribute: boolean;
            addParser(parser: ParserFn<Data>): void;
            parseEntry(el: HTMLElement): Data;
            addItem<IT, T extends IT, IS extends FiltererItemPartial, S, TS extends S & IS & FiltererItemSource>(constructor: {
                new (data: TS): T;
            }, list: IT[], data: IS, source: S): T;
            filters: IFilter<Data>[];
            sorters: ISorter<Data>[];
            modifiers: IModifier<Data>[];
            addFilter(id: string, filter: FilterFn<Data>, data?: FilterPartial<Data>): Filter<Data>;
            addVFilter<V extends number | string>(id: string, filter: ValueFilterFn<Data, V>, data: ValueFilterPartial<Data, V>): ValueFilter<Data, V>;
            addVFilter<V extends number | string>(id: string, filter: ValueFilterFn<Data, V>, data: V): any;
            addSorter<V extends number | string>(id: string, sorter: SorterFn<Data, V>, data?: SorterPartialSource<Data, V>): Sorter<Data, V>;
            addModifier(id: string, modifier: ModifierFn<Data>, data?: ModifierPartial<Data>): Modifier<Data>;
            addPrefix(id: string, prefix: PrefixerFn<Data>, data?: PrefixerPartial<Data>): Prefixer<Data>;
            filterEntries(): void;
            orderedEntries: HTMLElement[];
            sortEntries(): void;
            modifyEntries(): void;
            moveToTop(item: ISorter<Data> | IModifier<Data>): void;
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
}
declare namespace PoopJs {
    class Observer {
    }
}
declare namespace PoopJs {
    namespace PaginateExtension {
        type PRequestEvent = CustomEvent<{
            reason?: Event;
            count: number;
            consumed: number;
            _event?: 'paginationrequest';
        }>;
        type PStartEvent = CustomEvent<{
            paginate: Paginate;
            _event?: 'paginationstart';
        }>;
        type PEndEvent = CustomEvent<{
            paginate: Paginate;
            _event?: 'paginationend';
        }>;
        type PModifyEvent = CustomEvent<{
            paginate: Paginate;
            added: HTMLElement[];
            removed: HTMLElement[];
            selector: selector;
            _event?: 'paginationmodify';
        }>;
        class Paginate {
            doc: Document;
            enabled: boolean;
            condition: selector | (() => boolean);
            queued: number;
            running: boolean;
            _inited: boolean;
            static shiftRequestCount: number;
            static _inited: boolean;
            static removeDefaultRunBindings: () => void;
            static addDefaultRunBindings(): void;
            init(): void;
            onPaginationRequest(event: PRequestEvent): void;
            onPaginationEnd(event: PEndEvent): void;
            canConsumeRequest(): boolean;
            consumeRequest(): Promise<void>;
            onrun: () => Promise<void>;
            static requestPagination(count?: number, reason?: Event, target?: Element): void;
            emitStart(): void;
            emitModify(added: any, removed: any, selector: any): void;
            emitEnd(): void;
            fetchDocument(link: Link, spinner?: boolean): Promise<Document>;
            fetchCachedDocument(link: Link, spinner?: boolean): Promise<Document>;
            prefetch(source: selector): void;
            after(source: selector, target?: selector): void;
            replaceEach(source: selector, target?: selector): void;
            replace(source: selector, target?: selector): void;
            static linkToUrl(link: Link): url;
            static linkToAnchor(link: Link): HTMLAnchorElement;
            static staticCall<T>(data: {
                condition?: selector | (() => boolean);
                prefetch?: selector | selector[];
                click?: selector | selector[];
                doc?: selector | selector[];
                after?: selector | selector[];
                replace?: selector | selector[];
                start?: () => void;
                end?: () => void;
            }): Paginate;
            staticCall(data: {
                condition?: selector | (() => boolean);
                prefetch?: selector | selector[];
                click?: selector | selector[];
                doc?: selector | selector[];
                after?: selector | selector[];
                replace?: selector | selector[];
                start?: () => void;
                end?: () => void;
            }): void;
        }
        const paginate: ((data: {
            condition?: selector | (() => boolean);
            prefetch?: selector | selector[];
            click?: selector | selector[];
            doc?: selector | selector[];
            after?: selector | selector[];
            replace?: selector | selector[];
            start?: () => void;
            end?: () => void;
        }) => Paginate) & Paginate;
    }
    const paginate: ((data: {
        condition?: selector | (() => boolean);
        prefetch?: selector | selector[];
        click?: selector | selector[];
        doc?: selector | selector[];
        after?: selector | selector[];
        replace?: selector | selector[];
        start?: () => void;
        end?: () => void;
    }) => PaginateExtension.Paginate) & PaginateExtension.Paginate;
}
declare namespace PoopJs {
    namespace ImageScrollingExtension {
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
        function getCentralImg(): any;
        function scrollWholeImage(dir?: number): boolean;
    }
}
declare namespace PoopJs {
    function __init__(window: Window): "inited" | "already inited";
}
declare namespace PoopJs {
    type ValueOf<T> = T[keyof T];
    type MappedObject<T, V> = {
        [P in keyof T]: V;
    };
    type selector = string | (string & {
        _: 'selector';
    });
    type url = `http${string}` & {
        _: 'url';
    };
    type Link = HTMLAnchorElement | selector | url;
}
declare const __init__: "inited" | "already inited";
declare const elm: typeof PoopJs.Elm.elm;
declare const q: typeof PoopJs.QuerySelector.WindowQ.q & {
    orElm: typeof PoopJs.Elm.qOrElm;
};
declare const qq: typeof PoopJs.QuerySelector.WindowQ.qq;
declare const paginate: typeof PoopJs.paginate;
declare const imageScrolling: typeof PoopJs.ImageScrollingExtension;
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
    q: typeof PoopJs.QuerySelector.WindowQ.q & {
        orElm: typeof PoopJs.Elm.qOrElm;
    };
    qq: typeof PoopJs.QuerySelector.WindowQ.qq;
    paginate: typeof PoopJs.paginate;
    imageScrolling: typeof PoopJs.ImageScrollingExtension;
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
    addEventListener<T extends CustomEvent<{
        _event?: string;
    }>>(type: T['detail']['_event'], listener: (this: Document, ev: T) => any, options?: boolean | AddEventListenerOptions): void;
}
interface Document {
    q: typeof PoopJs.QuerySelector.DocumentQ.q;
    qq: typeof PoopJs.QuerySelector.DocumentQ.qq;
    cachedAt: number;
    addEventListener<T extends CustomEvent<{
        _event?: string;
    }>>(type: T['detail']['_event'], listener: (this: Document, ev: T) => any, options?: boolean | AddEventListenerOptions): void;
}
interface ObjectConstructor {
    defineValue: typeof PoopJs.ObjectExtension.defineValue;
    defineGetter: typeof PoopJs.ObjectExtension.defineGetter;
    setPrototypeOf<T, P>(o: T, proto: P): T & P;
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
interface Response {
    cachedAt: number;
}
interface Function {
    bind<T, R, ARGS extends any[]>(this: (this: T, ...args: ARGS) => R, thisArg: T): ((...args: ARGS) => R);
}
declare namespace PoopJs {
    namespace EntryFiltererExtension {
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
            constructor(data: FiltererItemSource);
            click(event: MouseEvent): void;
            contextmenu(event: MouseEvent): void;
            toggleMode(mode: Mode, force?: boolean): void;
            remove(): void;
            show(): void;
            hide(): void;
        }
    }
}
declare namespace PoopJs {
    namespace EntryFiltererExtension {
        class Filter<Data> extends FiltererItem<Data> implements IFilter<Data> {
            filter: FilterFn<Data>;
            constructor(data: FilterSource<Data>);
            /** returns if item should be visible */
            apply(data: Data, el: HTMLElement): boolean;
        }
        class ValueFilter<Data, V extends string | number> extends FiltererItem<Data> implements IFilter<Data> {
            filter: ValueFilterFn<Data, V>;
            input: HTMLInputElement;
            lastValue: V;
            constructor(data: ValueFilterSource<Data, V>);
            change(): void;
            /** returns if item should be visible */
            apply(data: Data, el: HTMLElement): boolean;
            getValue(): V;
        }
    }
}
declare namespace PoopJs {
    namespace EntryFiltererExtension {
        class Modifier<Data> extends FiltererItem<Data> implements IModifier<Data> {
            modifier: ModifierFn<Data>;
            runOnNoChange?: boolean;
            constructor(data: ModifierSource<Data>);
            toggleMode(mode: Mode, force?: boolean): void;
            apply(data: Data, el: HTMLElement): void;
        }
        class Prefixer<Data> extends FiltererItem<Data> implements IModifier<Data> {
            target: selector | ((e: HTMLElement, data: Data, mode: Mode) => (HTMLElement | HTMLElement[]));
            prefix?: (data: Data, el: HTMLElement, mode: Mode) => string;
            postfix?: (data: Data, el: HTMLElement, mode: Mode) => string;
            prefixAttribute: string;
            postfixAttribute: string;
            all: boolean;
            constructor(data: PrefixerSource<Data>);
            apply(data: Data, el: HTMLElement): void;
            getTargets(el: HTMLElement, data: Data): HTMLElement[];
        }
    }
}
declare namespace PoopJs {
    namespace EntryFiltererExtension {
        class Sorter<Data, V extends number | string> extends FiltererItem<Data> implements ISorter<Data> {
            sorter: SorterFn<Data, V>;
            comparator: (a: V, b: V) => number;
            constructor(data: SorterSource<Data, V>);
            toggleMode(mode: Mode, force?: boolean): void;
            sort(list: [Data, HTMLElement][]): [Data, HTMLElement][];
            /** returns order of entry */
            apply(data: Data, el: HTMLElement): V;
            compare(a: V, b: V): number;
        }
    }
}
declare namespace PoopJs {
    namespace EntryFiltererExtension {
        type Wayness = false | true | 'dir';
        type Mode = 'off' | 'on' | 'opposite';
        type ParserFn<Data> = (el: HTMLElement, data: Partial<Data>) => Partial<Data> | void | PromiseLike<Partial<Data | void>>;
        type FilterFn<Data> = (data: Data, el: HTMLElement, mode: Mode) => boolean;
        type SorterFn<Data, V> = (data: Data, el: HTMLElement, mode: Mode) => V;
        type ModifierFn<Data> = (data: Data, el: HTMLElement, mode: Mode, oldMode: Mode | null) => void;
        type ValueFilterFn<Data, V> = (value: V, data: Data, el: HTMLElement) => boolean;
        type PrefixerFn<Data> = (data: Data, el: HTMLElement, mode: Mode) => string;
        interface IFilter<Data> extends FiltererItem<Data> {
            apply(data: Data, el: HTMLElement): boolean;
        }
        interface ISorter<Data> extends FiltererItem<Data> {
            sort(list: [Data, HTMLElement][]): [Data, HTMLElement][];
        }
        interface IModifier<Data> extends FiltererItem<Data> {
            apply(data: Data, el: HTMLElement): void;
        }
        interface FiltererItemSource {
            button?: selector;
            id: string;
            name?: string;
            description?: string;
            threeWay?: Wayness;
            mode?: Mode;
            parent: EntryFilterer;
            incompatible?: string[];
            hidden?: boolean;
        }
        interface FilterSource<Data> extends FiltererItemSource {
            filter: FilterFn<Data>;
        }
        interface ValueFilterSource<Data, V> extends FiltererItemSource {
            filter: ValueFilterFn<Data, V>;
            input: V;
        }
        interface SorterSource<Data, V> extends FiltererItemSource {
            sorter: SorterFn<Data, V>;
            comparator?: ((a: V, b: V) => number) | V;
        }
        interface ModifierSource<Data> extends FiltererItemSource {
            modifier: ModifierFn<Data>;
        }
        interface PrefixerSource<Data> extends FiltererItemSource {
            target?: selector | ((el: HTMLElement, data: Data, mode: Mode) => HTMLElement);
            prefix?: (data: Data, el: HTMLElement) => string;
            postfix?: (data: Data, el: HTMLElement) => string;
            prefixAttribute?: string;
            postfixAttribute?: string;
            all?: boolean;
        }
        interface FiltererItemPartial {
            button?: selector;
            id?: string;
            name?: string;
            description?: string;
            threeWay?: Wayness;
            mode?: Mode;
            incompatible?: string[];
            hidden?: boolean;
        }
        interface FilterPartial<Data> extends FiltererItemPartial {
        }
        interface ValueFilterPartial<Data, V> extends FiltererItemPartial {
            input: V;
        }
        interface SorterPartialSource<Data, V> extends FiltererItemPartial {
            comparator?: ((a: V, b: V) => number) | V;
        }
        interface ModifierPartial<Data> extends FiltererItemPartial {
        }
        interface PrefixerPartial<Data> extends FiltererItemPartial {
            target?: selector | ((el: HTMLElement, data: Data, mode: Mode) => HTMLElement);
            prefix?: (data: Data, el: HTMLElement) => string;
            postfix?: (data: Data, el: HTMLElement) => string;
            prefixAttribute?: string;
            postfixAttribute?: string;
            all?: boolean;
        }
    }
    let EF: typeof EntryFiltererExtension.EntryFilterer;
}
