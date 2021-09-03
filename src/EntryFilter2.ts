namespace PoopJs {

	export namespace EntryFiltererExtension2 {
		export type Wayness = false | true | 'dir';
		export type Mode = 'off' | 'on' | 'opposite';

		export type ParserFn<Data> = (el: HTMLElement, data: Partial<Data>) => Partial<Data> | PromiseLike<Partial<Data>> | void;
		export type FilterFn<Data> = (data: Data, el: HTMLElement) => boolean;
		export type SorterFn<Data> = (data: Data, el: HTMLElement) => number;
		export type ModifierFn<Data> = (data: Data, el: HTMLElement, mode: Mode, oldMode: Mode | null) => void;

		export class FiltererItem<Data> {
			id: string = "";
			name?: string;
			description?: string;
			threeWay: Wayness = false;
			mode: Mode = 'off';
			parent: EntryFilterer;
			button: HTMLButtonElement;
			incompatible?: string[];
			hidden = false;

			constructor(selector: string, data: Partial<FiltererItem<Data>>) {
				Object.assign(this, data);

				this.button = elm(selector,
					(click: MouseEvent) => this.click(click),
					(contextmenu: MouseEvent) => this.contextmenu(contextmenu),
				);
				this.parent.container.append(this.button);
				if (this.name) {
					this.button.append(this.name);
				}
				if (this.description) {
					this.button.title = this.description;
				}
				if (this.mode != 'off') {
					this.toggleMode(data.mode, true);
				}
				if (this.hidden) {
					this.hide();
				}
			}

			click(event: MouseEvent) {
				if (this.mode == 'off') {
					this.toggleMode('on');
					return;
				}
				if (event.target != this.button) return;
				if (this.mode == 'on') {
					this.toggleMode(this.threeWay ? 'opposite' : 'off');
				} else {
					this.toggleMode('off')
				}
			}

			contextmenu(event: MouseEvent) {
				event.preventDefault();
				if (this.mode != 'opposite') {
					this.toggleMode('opposite');
				} else {
					this.toggleMode('off');
				}
			}

			toggleMode(mode: Mode, force = false) {
				if (this.mode == mode && !force) return;
				this.mode = mode;
				this.button.setAttribute('ef-mode', mode);
				if (mode != 'off' && this.incompatible) {
					this.parent.offIncompatible(this.incompatible);
				}
				this.parent.requestUpdate();
			}

			remove() {
				this.button.remove();
				this.toggleMode('off');
			}

			show() {
				this.hidden = false;
				this.button.hidden = false;
			}
			hide() {
				this.hidden = true;
				this.button.hidden = true;
			}

		}

		export class Filter<Data> extends FiltererItem<Data> {
			filter: FilterFn<Data>;

			constructor(data: Partial<Filter<Data>> = {}) {
				super('button.ef-item.ef-filter[ef-mode="off"]', data);
			}

			/** returns if item should be visible */
			apply(data: Data, el: HTMLElement): boolean {
				if (this.mode == 'off') return true;
				let value = this.filter(data, el);
				let result = typeof value == "number" ? value > 0 : value;
				if (this.mode == 'on') return result;
				if (this.mode == 'opposite') return !result;
			}
		}

		// export class FilterWithInput<Data, V extends number | string> extends Filter<Data> {
		// 	declare filter: FilterWIFn<Data, V>;
		// 	input: HTMLInputElement | string | number;
		// 	constructor(data: Partial<FilterWithInput<Data, V>>) {
		// 		super(data);
		// 		if (typeof this.input != 'object') {
		// 			if (typeof this.input == 'number') {
		// 				this.input = `input[type=number][value=${this.input}]`;
		// 			}
		// 			if (!this.input.startsWith('input')) {
		// 				if (!this.input.startsWith('[')) this.input = `[type=text][value="${this.input.replaceAll('"', '\\"')}"]`;
		// 				if (!this.input.startsWith('input')) this.input = `input${this.input}`;
		// 			}
		// 			this.input = elm<HTMLInputElement>(this.input);
		// 		}
		// 		this.input.onchange = this.input.onkeyup = this.input.onkeydown = this.input.onkeypress = () => this.parent.requestUpdate();
		// 		this.button.append(this.input);
		// 	}
		// 	convert: (e: HTMLInputElement) => V
		// 		= (e: HTMLInputElement) => e.type == 'number' ? +e.value as V : e.value as V;

		// 	/** returns if item should be visible */
		// 	apply(data: Data, el: HTMLElement): boolean {
		// 		if (this.mode == 'off') return true;
		// 		let inputValue = this.convert(this.input as HTMLInputElement);
		// 		let value = this.filter(data, el, inputValue);
		// 		let result = typeof value == "number" ? value > 0 : value;
		// 		if (this.mode == 'on') return result;
		// 		if (this.mode == 'opposite') return !result;
		// 	}
		// }

		export class Sorter<Data> extends FiltererItem<Data> {
			sorter: SorterFn<Data>;

			constructor(data: Partial<Sorter<Data>>) {
				super('button.ef-item.ef-sorter[ef-mode="off"]', data);
			}

			toggleMode(mode: Mode, force = false) {
				if (this.mode == mode && !force) return;
				this.parent.moveToTop(this);
				super.toggleMode(mode, force);
			}

			/** returns order of entry */
			apply(data: Data, el: HTMLElement): number {
				if (this.mode == 'on') {
					return this.sorter(data, el);
				}
				if (this.mode == 'off') {
					return -this.sorter(data, el);
				}
				return 0;
			}
		}

		export class Modifier<Data> extends FiltererItem<Data> {
			modifier: ModifierFn<Data>;
			runOnNoChange = false;

			constructor(data: Partial<Modifier<Data>>) {
				super('button.ef-item.ef-modifier[ef-mode="off"]', data);
			}

			toggleMode(mode: Mode, force = false) {
				if (this.mode == mode && !force) return;
				this.parent.moveToTop(this);
				super.toggleMode(mode, force);
			}

			apply(data: Data, el: HTMLElement) {
				// let oldMode: Mode | null = el.getAttribute(`ef-modifier-${this.id}-mode`) as (Mode | null);
				// if (oldMode == this.mode && !this.runOnNoChange) return;
				this.modifier(data, el, this.mode, null);
				// el.setAttribute(`ef-modifier-${this.id}-mode`, this.mode);
			}
		}

		export class EntryFilterer<Data extends {} = {}> {
			on = true;
			container: HTMLElement;
			entrySelector: string | (() => HTMLElement[]);
			constructor(entrySelector: string | (() => HTMLElement[]), enabled = true) {
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
				paginate.onchange(() => this.requestUpdate());
				etc.onheightchange(() => this.requestUpdate());
			}

			entries: HTMLElement[] = [];
			entryDatas: Map<HTMLElement, Data> = new Map();
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

			addItem<T extends FiltererItem<Data>>(id: string, data: Partial<T>, list: T[], constructor: (item: Partial<T>) => T) {
				data.parent = this;
				data.id = id;
				data.name ??= id;
				let item = constructor(data);
				list.push(item);
				return item;
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


			filters: Filter<Data>[] = [];
			addFilter(id: string, filter: FilterFn<Data>, data: Partial<Filter<Data>> = {}) {
				data.filter ??= filter;
				return this.addItem(id, data, this.filters, data => new Filter(data));
			}
			// addFilterWithInput<V extends string | number>(id: string, filter: FilterWIFn<Data, V>, data: Partial<FilterWithInput<Data, V>> & { input?: V } = {}) {
			// 	data.filter ??= filter;
			// 	return this.addItem(id, data, this.filters, data => new FilterWithInput(data));
			// }
			sorters: Sorter<Data>[] = [];
			addSorter(id: string, sorter: SorterFn<Data>, data: Partial<Sorter<Data>> = {}) {
				data.sorter = sorter;
				return this.addItem(id, data, this.sorters, data => new Sorter(data));
			}
			modifiers: Modifier<Data>[] = [];
			addModifier(id: string, modifier: ModifierFn<Data>, data: Partial<Modifier<Data>> = {}) {
				data.modifier = modifier;
				return this.addItem(id, data, this.modifiers, data => new Modifier(data));
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

			sortEntries() {
				let entries = this.entries;
				let pairs: [HTMLElement, Data][] = entries.map(e => [e, this.getData(e)]);
				for (let sorter of this.sorters) {
					if (sorter.mode != 'off') {
						pairs = pairs.vsort(([e, data]) => sorter.apply(data, e));
					}
				}
				entries = pairs.map(e => e[0]);
				if (entries.every((e, i) => e == this.entries[i])) {
					return;
				}
				let br = elm('br.ef-before-sort[hidden]');
				this.entries[0].before(br);
				br.after(...entries);
				br.remove();
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


			moveToTop(item: Sorter<Data> | Modifier<Data>) {
				if (item instanceof Sorter) {
					this.sorters.splice(this.sorters.indexOf(item), 1);
					this.sorters.push(item);
				}
				if (item instanceof Modifier) {
					this.modifiers.splice(this.modifiers.indexOf(item), 1);
					this.modifiers.push(item);
				}
			}

			update(reparse = this.reparsePending) {
				this.updatePending = false;
				if (this.disabled) return;
				if (reparse) {
					this.entryDatas = new Map();
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

					[ef-prefix]::before {
						content: attr(ef-prefix);
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

	export let EF2 = EntryFiltererExtension2.EntryFilterer;
}