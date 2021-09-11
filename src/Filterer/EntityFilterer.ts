namespace PoopJs {

	export namespace EntryFiltererExtension {

		/**
		 * can be either Map or WeakMap
		 * (WeakMap is likely to be useless if there are less then 10k old nodes in map)
		 */
		let MapType = Map;
		type MapType<K extends object, V> =// Map<K, V> | 
			WeakMap<K, V>;

		export class EntryFilterer<Data extends {} = {}> {
			on = true;
			container: HTMLElement;
			entrySelector: selector | (() => HTMLElement[]);
			constructor(entrySelector: selector | (() => HTMLElement[]), enabled = true) {
				this.entrySelector = entrySelector;
				this.container = elm('.ef-container');
				if (!entrySelector) {
					// disable if no selector provided (likely is a generic ef)
					this.disable();
				}
				if (!enabled) {
					this.disable();
				}
				if (enabled) {
					this.style();
				}
				this.update();
				document.addEventListener<PaginateExtension.PModifyEvent>('paginationmodify', () => this.requestUpdate());
				etc.onheightchange(() => this.requestUpdate());
			}

			entries: HTMLElement[] = [];
			entryDatas: MapType<HTMLElement, Data> = new MapType();
			getData(el: HTMLElement) {
				let data = this.entryDatas.get(el);
				if (!data) {
					data = this.parseEntry(el);
					this.entryDatas.set(el, data);
				}
				return data;
			}

			updatePending = false;
			reparsePending = false;
			requestUpdate(reparse = false) {
				if (this.updatePending) return;
				this.updatePending = true;
				if (reparse) this.reparsePending = true;
				setTimeout(() => this.update());
			}

			parsers: ParserFn<Data>[] = [];
			writeDataAttribute = false;
			addParser(parser: ParserFn<Data>) {
				this.parsers.push(parser);
				this.requestUpdate(true);
			}
			parseEntry(el: HTMLElement): Data {
				let data: Data = {} as Data;
				for (let parser of this.parsers) {
					let newData = parser(el, data);
					if (!newData || newData == data) continue;
					if (!IsPromise(newData)) {
						Object.assign(data, newData);
						continue;
					}
					newData.then(pNewData => {
						if (pNewData && pNewData != data) {
							Object.assign(data, pNewData);
						}
						this.requestUpdate();
					})
				}
				if (this.writeDataAttribute) {
					el.setAttribute('ef-data', JSON.stringify(data));
				}
				return data;
			}

			addItem<IT, T extends IT, IS extends FiltererItemPartial, S, TS extends S & IS & FiltererItemSource>(constructor: { new(data: TS): T }, list: IT[], data: IS, source: S): T {
				Object.assign(data, source, { parent: this });
				data.name ??= data.id;
				let item = new constructor(data as TS);
				list.push(item);
				return item;
			}

			filters: IFilter<Data>[] = [];
			sorters: ISorter<Data>[] = [];
			modifiers: IModifier<Data>[] = [];

			addFilter(id: string, filter: FilterFn<Data>, data: FilterPartial<Data> = {}): Filter<Data> {
				return this.addItem(Filter, this.filters, data, { id, filter });
			}
			addVFilter<V extends number | string>(id: string, filter: ValueFilterFn<Data, V>, data: ValueFilterPartial<Data, V>): ValueFilter<Data, V>;
			addVFilter<V extends number | string>(id: string, filter: ValueFilterFn<Data, V>, data: V);
			addVFilter<V extends number | string>(id: string, filter: ValueFilterFn<Data, V>, data: ValueFilterPartial<Data, V> | V) {
				if (typeof data != 'object' || !data) {
					data = { input: data as V };
				}
				return this.addItem(ValueFilter, this.filters, data, { id, filter });
			}
			addSorter<V extends number | string>(id: string, sorter: SorterFn<Data, V>, data: SorterPartialSource<Data, V> = {}): Sorter<Data, V> {
				return this.addItem(Sorter, this.sorters, data, { id, sorter });
			}
			addModifier(id: string, modifier: ModifierFn<Data>, data: ModifierPartial<Data> = {}): Modifier<Data> {
				return this.addItem(Modifier, this.modifiers, data, { id, modifier });
			}
			addPrefix(id: string, prefix: PrefixerFn<Data>, data: PrefixerPartial<Data> = {}): Prefixer<Data> {
				return this.addItem(Prefixer, this.modifiers, data, { id, prefix });
			}

			filterEntries() {
				for (let el of this.entries) {
					let data = this.getData(el);
					let value = true;
					for (let filter of this.filters) {
						value = value && filter.apply(data, el);
					}
					el.classList.toggle('ef-filtered-out', !value);
				}
			}

			orderedEntries: HTMLElement[] = [];
			sortEntries() {
				if (this.entries.length == 0) return;
				if (this.orderedEntries.length == 0) this.orderedEntries = this.entries;
				let entries = this.entries;
				let pairs: [Data, HTMLElement][] = entries.map(e => [this.getData(e), e]);
				for (let sorter of this.sorters) {
					if (sorter.mode != 'off') {
						pairs = sorter.sort(pairs);
					}
				}
				entries = pairs.map(e => e[1]);
				if (entries.every((e, i) => e == this.orderedEntries[i])) {
					return;
				}
				let br = elm(`${entries[0]?.tagName}.ef-before-sort[hidden]`);
				this.orderedEntries[0].before(br);
				br.after(...entries);
				br.remove();
				this.orderedEntries = entries;
			}

			modifyEntries() {
				let entries = this.entries;
				let pairs: [HTMLElement, Data][] = entries.map(e => [e, this.getData(e)]);
				for (let modifier of this.modifiers) {
					for (let [e, d] of pairs) {
						modifier.apply(d, e);
					}
				}
			}

			moveToTop(item: ISorter<Data> | IModifier<Data>) {
				if (this.sorters.includes(item as ISorter<Data>)) {
					this.sorters.splice(this.sorters.indexOf(item as ISorter<Data>), 1);
					this.sorters.push(item as ISorter<Data>);
				}
				if (this.modifiers.includes(item as IModifier<Data>)) {
					this.modifiers.splice(this.modifiers.indexOf(item as IModifier<Data>), 1);
					this.modifiers.push(item as IModifier<Data>);
				}
			}

			update(reparse = this.reparsePending) {
				this.updatePending = false;
				if (this.disabled) return;
				if (reparse) {
					this.entryDatas = new MapType();
					this.reparsePending = false;
				}
				if (!this.container.closest('body')) {
					this.container.appendTo('body');
				}
				this.entries = typeof this.entrySelector == 'function' ? this.entrySelector() : qq(this.entrySelector);
				this.filterEntries();
				this.sortEntries();
				this.modifyEntries();
			}

			offIncompatible(incompatible: string[]) {
				for (let filter of this.filters) {
					if (incompatible.includes(filter.id)) {
						filter.toggleMode('off');
					}
				}
				for (let sorter of this.sorters) {
					if (incompatible.includes(sorter.id)) {
						sorter.toggleMode('off');
					}
				}
				for (let modifier of this.modifiers) {
					if (incompatible.includes(modifier.id)) {
						modifier.toggleMode('off');
					}
				}
			}

			style(s = '') {
				EntryFilterer.style(s);
				return this;
			}
			static style(s = '') {
				let style = q('style.ef-style') || elm('style.ef-style').appendTo('head');
				style.innerHTML = `
					.ef-container {
						display: flex;
						flex-direction: column;
						position: fixed;
						top: 0;
						right: 0;
						z-index: 9999999999999999999;
						min-width: 100px;
					}
					.ef-entry {}

					.ef-filtered-out {
						display: none !important;
					}

					button.ef-item {}
					button.ef-item[ef-mode="off"] {
						background: lightgray;
					}
					button.ef-item[ef-mode="on"] {
						background: lightgreen;
					}
					button.ef-item[ef-mode="opposite"] {
						background: yellow;
					}

					button.ef-item.ef-filter > input {
						float: right;
					}

					[ef-prefix]::before {
						content: attr(ef-prefix);
					}
					[ef-postfix]::after {
						content: attr(ef-postfix);
					}
					
				` + s;
			}

			disabled = false;
			disable() {
				this.disabled = true;
				this.container.remove();
			}
			enable() {
				this.disabled = false;
				this.updatePending = false;
				this.requestUpdate();
			}

			clear() {
				this.entryDatas = new Map();
				this.parsers.splice(0, 999);
				this.filters.splice(0, 999).map(e => e.remove());
				this.sorters.splice(0, 999).map(e => e.remove());
				this.enable();
			}

			get _datas() {
				return this.entries.map(e => this.getData(e));
			}

		}

		function IsPromise<T>(p: PromiseLike<T> | T): p is PromiseLike<T> {
			if (!p) return false;
			return typeof (p as PromiseLike<T>).then == 'function';
		}
	}
}