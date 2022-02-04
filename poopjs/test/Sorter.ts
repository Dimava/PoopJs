// namespace PoopJs {
// 	export namespace EntryFiltererExtension3 {

// 		export class Sorter<Data, V extends number | string> extends FiltererItem<Data> implements ISorter<Data> {
// 			declare sorter: SorterFn<Data, V>;
// 			declare comparator: (a: V, b: V) => number;

// 			constructor(data: SorterSource<Data, V>) {
// 				data.button ??= 'button.ef-item.ef-sorter[ef-mode="off"]';
// 				data.comparator ??= (a: V, b: V) => a > b ? 1 : a < b ? -1 : 0;
// 				super(data);
// 			}

// 			toggleMode(mode: Mode, force = false) {
// 				if (this.mode == mode && !force) return;
// 				this.parent.moveToTop(this);
// 				super.toggleMode(mode, force);
// 			}

// 			sort(list: [Data, HTMLElement][]): [Data, HTMLElement][] {
// 				if (this.mode == 'off') return list;
// 				return list.vsort(([data, el]: [Data, HTMLElement]) => this.apply(data, el), (a: V, b: V) => this.compare(a, b));
// 			}

// 			/** returns order of entry */
// 			apply(data: Data, el: HTMLElement): V {
// 				return this.sorter(data, el, this.mode);
// 			}

// 			compare(a: V, b: V): number {
// 				if (this.mode == 'on') {
// 					return this.comparator(a, b);
// 				}
// 				if (this.mode == 'opposite') {
// 					return this.comparator(b, a);
// 				}
// 				return 0;
// 			}
// 		}

// 	}
// }