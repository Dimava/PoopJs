// namespace PoopJs {

// 	export namespace EntryFiltererExtension3 {
// 		export type Wayness = false | true | 'dir';
// 		export type Mode = 'off' | 'on' | 'opposite';

// 		export type ParserFn<Data> = (el: HTMLElement, data: Partial<Data>) => Partial<Data> | void | PromiseLike<Partial<Data | void>>;
// 		export type FilterFn<Data> = (data: Data, el: HTMLElement, mode: Mode) => boolean;
// 		export type SorterFn<Data, V> = (data: Data, el: HTMLElement, mode: Mode) => V;
// 		export type ModifierFn<Data> = (data: Data, el: HTMLElement, mode: Mode, oldMode: Mode | null) => void;
// 		export type ValueFilterFn<Data, V> = (value: V, data: Data, el: HTMLElement) => boolean;
// 		export type PrefixerFn<Data> = (data: Data, el: HTMLElement, mode: Mode) => string;

// 		export interface IFilter<Data> extends FiltererItem<Data> {
// 			apply(data: Data, el: HTMLElement): boolean;
// 			applyAll(list: [Data, HTMLElement][]): boolean[];
// 		}
// 		export interface ISorter<Data> extends FiltererItem<Data> {
// 			apply(data: Data, el: HTMLElement): string | number;
// 			applyAll(list: [Data, HTMLElement][]): string[] | number[];
// 		}
// 		export interface IModifier<Data> extends FiltererItem<Data> {
// 			apply(data: Data, el: HTMLElement): void;
// 			applyAll(list: [Data, HTMLElement][]): void;
// 		}

// 		export interface FiltererItemSource {
// 			button?: selector;
// 			id: string;
// 			name?: string;
// 			description?: string;
// 			threeWay?: Wayness;
// 			mode?: Mode;
// 			parent: EntryFilterer;
// 			incompatible?: string[];
// 			hidden?: boolean;
// 		}

// 		export interface FilterSource<Data> extends FiltererItemSource {
// 			filter: (data: Data, el: HTMLElement, mode: Mode) => boolean;
// 		}
// 		export interface ValueFilterSource<Data, V> extends FiltererItemSource {
// 			filter: (value: V, data: Data, el: HTMLElement, mode: Mode) => boolean;
// 			default?: V;
// 		}
// 		export interface TagFilterSource<Data> extends FiltererItemSource {
// 			getTags: (data: Data, el: HTMLElement, mode: Mode) => (HTMLElement | string)[];
			
// 		}


// 		export interface MatchFilterSource<Data> extends FiltererItemSource {
// 			value?: (data: Data, el: HTMLElement) => string;
// 			input?: string;
// 		}
// 		export interface SorterSource<Data, V> extends FiltererItemSource {
// 			sorter: SorterFn<Data, V>;
// 			comparator?: ((a: V, b: V) => number) | V;
// 		}
// 		export interface ModifierSource<Data> extends FiltererItemSource {
// 			modifier: ModifierFn<Data>;
// 		}
// 		export interface PrefixerSource<Data> extends FiltererItemSource {
// 			target?: selector | ((el: HTMLElement, data: Data, mode: Mode) => HTMLElement);
// 			prefix?: (data: Data, el: HTMLElement) => string;
// 			postfix?: (data: Data, el: HTMLElement) => string;
// 			prefixAttribute?: string;
// 			postfixAttribute?: string;
// 			all?: boolean;
// 		}


// 		/**
// 		 * can be either Map or WeakMap
// 		 * (WeakMap is likely to be useless if there are less then 10k old nodes in map)
// 		 */
// 		let MapType = Map;
// 		type MapType<K extends object, V> =// Map<K, V> | 
// 			WeakMap<K, V>;
// 	}

// 	export let EF3 = EntryFiltererExtension3.EntryFilterer;
// }