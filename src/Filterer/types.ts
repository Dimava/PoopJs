namespace PoopJs {

	export namespace EntryFiltererExtension {
		export type Wayness = false | true | 'dir';
		export type Mode = 'off' | 'on' | 'opposite';

		export type ParserFn<Data> = (el: HTMLElement, data: Partial<Data>) => Partial<Data> | void | PromiseLike<Partial<Data | void>>;
		export type FilterFn<Data> = (data: Data, el: HTMLElement, mode: Mode) => boolean;
		export type SorterFn<Data, V> = (data: Data, el: HTMLElement, mode: Mode) => V;
		export type ModifierFn<Data> = (data: Data, el: HTMLElement, mode: Mode, oldMode: Mode | null) => void;
		export type ValueFilterFn<Data, V> = (value: V, data: Data, el: HTMLElement) => boolean;
		export type PrefixerFn<Data> = (data: Data, el: HTMLElement, mode: Mode) => string;

		export interface IFilter<Data> extends FiltererItem<Data> {
			apply(data: Data, el: HTMLElement): boolean;
		}
		export interface ISorter<Data> extends FiltererItem<Data> {
			sort(list: [Data, HTMLElement][]): [Data, HTMLElement][];
		}
		export interface IModifier<Data> extends FiltererItem<Data> {
			apply(data: Data, el: HTMLElement): void;
		}

		export interface FiltererItemSource {
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
		export interface FilterSource<Data> extends FiltererItemSource {
			filter: FilterFn<Data>;
		}
		export interface ValueFilterSource<Data, V> extends FiltererItemSource {
			filter: ValueFilterFn<Data, V>;
			input: V;
		}
		export interface SorterSource<Data, V> extends FiltererItemSource {
			sorter: SorterFn<Data, V>;
			comparator?: ((a: V, b: V) => number) | V;
		}
		export interface ModifierSource<Data> extends FiltererItemSource {
			modifier: ModifierFn<Data>;
		}
		export interface PrefixerSource<Data> extends FiltererItemSource {
			target?: selector | ((el: HTMLElement, data: Data, mode: Mode) => HTMLElement);
			prefix?: (data: Data, el: HTMLElement) => string;
			postfix?: (data: Data, el: HTMLElement) => string;
			prefixAttribute?: string;
			postfixAttribute?: string;
			all?: boolean;
		}

		
		export interface FiltererItemPartial {
			button?: selector;
			id?: string;
			name?: string;
			description?: string;
			threeWay?: Wayness;
			mode?: Mode;
			incompatible?: string[];
			hidden?: boolean;
		}
		export interface FilterPartial<Data> extends FiltererItemPartial { }
		export interface ValueFilterPartial<Data, V> extends FiltererItemPartial {
			input: V;
		}
		export interface SorterPartialSource<Data, V> extends FiltererItemPartial {
			comparator?: ((a: V, b: V) => number) | V;
		}
		export interface ModifierPartial<Data> extends FiltererItemPartial { }
		export interface PrefixerPartial<Data> extends FiltererItemPartial {
			target?: selector | ((el: HTMLElement, data: Data, mode: Mode) => HTMLElement);
			prefix?: (data: Data, el: HTMLElement) => string;
			postfix?: (data: Data, el: HTMLElement) => string;
			prefixAttribute?: string;
			postfixAttribute?: string;
			all?: boolean;
		}

		type Union<Source, Result> = {
			[P in keyof Source & keyof Result]: Source[P] | Result[P];
		} & Omit<Source, keyof Result> & Omit<Result, keyof Source>;

		type Override<T, O> = Omit<T, keyof O> & O;

		type EFSource<T extends { source: any }> = Override<Override<Partial<T>, T['source']>, { button?: selector }>;

		type Source<T extends { source: any }> = T['source'] & {
			id?: string; name?: string; description?: string;
			threeWay?: Wayness; mode?: Mode; incompatible?: string[]; hidden?: boolean;
		};


		/**
		 * can be either Map or WeakMap
		 * (WeakMap is likely to be useless if there are less then 10k old nodes in map)
		 */
		let MapType = Map;
		type MapType<K extends object, V> =// Map<K, V> | 
			WeakMap<K, V>;
	}

	export let EF = EntryFiltererExtension.EntryFilterer;
}