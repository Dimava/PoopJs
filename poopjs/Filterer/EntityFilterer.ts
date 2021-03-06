namespace PoopJs {

	export namespace EntryFiltererExtension {

		/**
		 * can be either Map or WeakMap
		 * (WeakMap is likely to be useless if there are less then 10k old nodes in map)
		 */
		let MapType = Map;
		type MapType<K extends object, V> =// Map<K, V> | 
			WeakMap<K, V>;

		function toElArray(entrySelector: selector | (() => HTMLElement[])): HTMLElement[] {
			return typeof entrySelector == 'function' ? entrySelector() : qq(entrySelector);
		}

		export class EntryFilterer<Data extends {} = {}> {
			container: HTMLElement;
			entrySelector: selector | (() => HTMLElement[]);
			constructor(entrySelector: selector | (() => HTMLElement[]), enabled: boolean | 'soft' = 'soft') {
				this.entrySelector = entrySelector;
				this.container = elm('.ef-container');

				if (enabled == 'soft') {
					this.softDisable = true;
					this.disable('soft');
				} else if (enabled) {
					this.softDisable = false;
				} else {
					// enabled is falsy
					this.softDisable = false;
					this.disable();
				}
				this.style();

				this.update();
				document.addEventListener<PaginateExtension.PModifyEvent>('paginationmodify', () => this.requestUpdate());
				etc.onheightchange(() => this.requestUpdate());
			}

			entries: HTMLElement[] = [];
			entryDatas: MapType<HTMLElement, Data> = new MapType();

			getData(el: HTMLElement): Data;
			getData(): Data[];
			getData(el?: HTMLElement): Data | Data[] {
				if (!el) return this.entries.map(e => this.getData(e));
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
			// reparseEntries(entries = this.entries): Data[] {
			// 	// preparse
			// 	let parents = new Set(entries.map(e=>e.parentElement));
			// 	for (let parent of parents) {
			// 		parent.classList.add('ef-entry-container');
			// 	}
			// 	for (let e of entries) {
			// 		e.classList.add('ef-entry');
			// 	}

			// 	let datas =
			// 	for (let parser of this.parsers) {

			// 	}
			// 	return 0 as any;
			// }
			parseEntry(el: HTMLElement): Data {
				el.parentElement.classList.add('ef-entry-container');
				el.classList.add('ef-entry');

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

			get byName() {
				return Object.assign(
					Object.fromEntries(this.filters.map(e => [e.id, e])),
					Object.fromEntries(this.sorters.map(e => [e.id, e])),
					Object.fromEntries(this.modifiers.map(e => [e.id, e])),
					{
						filters: Object.fromEntries(this.filters.map(e => [e.id, e])),
						sorters: Object.fromEntries(this.sorters.map(e => [e.id, e])),
						modifiers: Object.fromEntries(this.modifiers.map(e => [e.id, e])),
					},
				);
			}


			addFilter(id: string, filter: FilterFn<Data>, data?: FilterPartial<Data>): Filter<Data>;
			addFilter(propName: string & keyof Data): Filter<Data>;
			addFilter(id: string, filter?: FilterFn<Data>, data: FilterPartial<Data> = {}): Filter<Data> {
				if (!filter) return this.addFilter(id, d => d[id]);
				return this.addItem(Filter, this.filters, data, { id, filter });
			}
			addVFilter<V extends number | string>(id: string, filter: ValueFilterFn<Data, V>, data: ValueFilterPartial<Data, V>): ValueFilter<Data, V>;
			addVFilter<V extends number | string>(id: string, filter: ValueFilterFn<Data, V>, data: V);
			addVFilter<V extends number>(propName: string & keyof Data, defaultMin: V);
			addVFilter<V extends number | string>(id: string, filter: ValueFilterFn<Data, V> | V, data?: ValueFilterPartial<Data, V> | V) {
				if (typeof filter != 'function') {
					return this.addVFilter(id, (v, d) => d[id] > v, filter);
				}
				if (typeof data != 'object' || !data) {
					data = { input: data as V };
				}
				return this.addItem(ValueFilter, this.filters, data, { id, filter });
			}
			addMFilter(id: string, value: (data: Data, el: HTMLElement) => string, data: MatchFilterSource<Data>) {
				return this.addItem(MatchFilter, this.filters, data, { id, value });
			}
			addTagFilter(id: string, data: TagFilterSource<Data>) {
				return this.addItem(TagFilter, this.filters, data, { id });
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
			addPaginationInfo(id: string = 'pginfo', data: Partial<FiltererItemSource> = {}) {
				return this.addItem(PaginationInfoFilter, this.filters, data, { id });
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

			_previousState = {
				allSortersOff: true,
				updateDuration: 0,
				finishedAt: 0,
			};

			orderedEntries: HTMLElement[] = [];
			orderMode: 'css' | 'swap' = 'css';
			sortEntries() {
				if (this.entries.length <= 1) return;
				if (this.orderedEntries.length == 0) this.orderedEntries = this.entries;
				if (this.sorters.length == 0) return;

				let entries = this.entries;
				let pairs: [Data, HTMLElement][] = entries.map(e => [this.getData(e), e]);
				let allOff = true;
				for (let sorter of this.sorters) {
					if (sorter.mode != 'off') {
						pairs = sorter.sort(pairs);
						allOff = false;
					}
				}
				entries = pairs.map(e => e[1]);
				if (this.orderMode == 'swap') {
					if (!entries.every((e, i) => e == this.orderedEntries[i])) {
						let br = elm(`${entries[0]?.tagName}.ef-before-sort[hidden]`);
						this.orderedEntries[0].before(br);
						br.after(...entries);
						br.remove();
					}
				} else {
					if (allOff != this._previousState.allSortersOff) {
						entries.map((e, i) => {
							if (allOff) {
								e.classList.remove('ef-reorder');
								e.parentElement.classList.remove('ef-reorder-container');
							} else {
								// use `flex` or `grid` container and `order:var(--ef-order)` for children 
								e.classList.add('ef-reorder');
								e.parentElement.classList.add('ef-reorder-container');
							}
						});
					}
					if (!allOff) {
						entries.map((e, i) => {
							e.style.setProperty('--ef-order', i + '');
						});
					}
				}
				this.orderedEntries = entries;
				this._previousState.allSortersOff = allOff;
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

			findEntries(): HTMLElement[] {
				return typeof this.entrySelector == 'function' ? this.entrySelector() : qq(this.entrySelector);
			}

			_earliestUpdate = 0;
			update(reparse = this.reparsePending) {
				if (this.disabled == true) return;
				if (this._previousState.updateDuration == 99_999) {
					PoopJs.debug && console.log(`EF: update in progress`);
					requestAnimationFrame(() => {
						setTimeout(() => {
							this.update(reparse)
						}, 100)
					});
					return;
				}
				let cooldown = Math.min(10000, 8 * this._previousState.updateDuration)
				let earliestUpdate = this._previousState.finishedAt + cooldown;
				if (performance.now() < earliestUpdate) {
					if (this._earliestUpdate != earliestUpdate) {
						this._earliestUpdate = earliestUpdate;
						if (PoopJs.debug) {
							console.log(`EF: update delayed by ${~~(earliestUpdate - performance.now())}ms ${''
								} (last update duration: ${this._previousState.updateDuration})`);
						}
					}
					this.updatePending = true;
					requestAnimationFrame(() => this.update());
					return;
				}
				this.updatePending = false;
				let now = performance.now();

				let entries = this.findEntries();

				if (this.disabled == 'soft') {
					if (!entries.length) return;
					PoopJs.debug && console.log(`Ef soft-enabled: x0=>x${entries.length}`, this.entrySelector, this);
					this.enable();
					return;
				}
				if (this.disabled != false) throw 0;

				if (!entries.length && this.softDisable) {
					PoopJs.debug && console.log(`Ef soft-disabled: x${this.enable.length}=>x0`, this.entrySelector, this);
					this.disable('soft');
					return;
				}

				if (reparse) {
					this.entryDatas = new MapType();
					this.reparsePending = false;
				}
				if (!this.container.closest('body')) {
					this.container.appendTo('body');
				}
				if (this.entries.length != entries.length) {
					PoopJs.debug && console.log(`Ef update: x${this.entries.length}=>x${entries.length}`, this.entrySelector, this);
					// || this.entries
					// TODO: sort entries in initial order
				}
				this.entries = entries;
				this.filterEntries();
				this.sortEntries();
				this.modifyEntries();
				let timeUsed = performance.now() - now;
				console.log(`EF: update took ${~~timeUsed}ms`);
				this._previousState.updateDuration = 99_999;
				this._previousState.finishedAt = performance.now() + 99_999;
				requestAnimationFrame(() => {
					let dt = this._previousState.updateDuration = performance.now() - now;
					this._previousState.finishedAt = performance.now();
				});
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

			softDisable = true;
			disabled: boolean | 'soft' = false;
			disable(soft?: 'soft') {
				this.disabled = true;
				if (soft == 'soft') this.disabled = 'soft';
				this.container.remove();
			}
			enable() {
				this.disabled = false;
				this.updatePending = false;
				this.requestUpdate();
			}

			clear() {
				this.entryDatas = new MapType();
				this.parsers.splice(0, 999);
				this.filters.splice(0, 999).map(e => e.remove());
				this.sorters.splice(0, 999).map(e => e.remove());
				this.modifiers.splice(0, 999).map(e => e.remove());
				this.enable();
			}

			get _datas() {
				return this.entries
					.filter(e => !e.classList.contains('ef-filtered-out'))
					.map(e => this.getData(e));
			}

		}

		function IsPromise<T>(p: PromiseLike<T> | T): p is PromiseLike<T> {
			if (!p) return false;
			return typeof (p as PromiseLike<T>).then == 'function';
		}
	}
}