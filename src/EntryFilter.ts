namespace PoopJs {

	export class EntryFilterer<Data> {
		active = false;
		parsers: ((el: HTMLElement, data: Data) => Data | void)[] = [];
		filters: ({ name: string, on: boolean, filter: (data: Data) => boolean })[] = [];
		sorters: ({ name: string, sortValue: (data: Data) => number, on?: boolean })[] = [];
		activeSorters: ((data: Data) => number)[] = [];

		container: HTMLElement;

		selector = '';
		entryGetter: () => HTMLElement[] = () => qq(this.selector);

		constructor(selector: string);
		constructor(entryGetter: () => HTMLElement[]);
		constructor(sel: string | (() => HTMLElement[])) {
			if (typeof sel == 'string') {
				this.selector = sel;
			} else {
				this.entryGetter = sel;
			}
			this.container = elm('.ef-container');
		}

		show(on = true) {
			if (!on) return this;
			this.container.appendTo('body');
			paginate.onchange(() => this.onPaginateChange());
			this.active = true;
			this.update();
			return this;
		}

		getEntries(update = false): HTMLElement[] {
			return this.entryGetter();
		}
		parse() {
			for (let el of this.getEntries()) {
				let data: Data = JSON.parse(el.dataset.ef || '{}');
				for (let parser of this.parsers) {
					data = parser(el, data) || data;
				}
				el.dataset.ef = JSON.stringify(data);
			}
		}

		getEntriesWithData(): { el: HTMLElement, data: Data }[] {
			return this.getEntries().map(el => ({ el, data: JSON.parse(el.dataset.ef || '{}') }));
		}

		onPaginateChange() {
			this.update();
		}

		addParser(parser: (el: HTMLElement, data: Data) => void | Data) {
			this.parsers.push(parser);
			this.parse();
		}

		addFilter(name: string, filter: (data: Data) => boolean, on?: boolean) {
			let entry = { name, filter, on: false, button: undefined as HTMLElement };
			this.filters.push(entry);
			entry.button = elm(
				'button.ef-filter',
				name,
				(click: MouseEvent & { target: HTMLElement }) => {
					entry.on = !entry.on;
					click.target.classList.toggle('ef-filter-on', entry.on);
					this.update();
				},
			).appendTo(this.container);
			if (on) {
				requestAnimationFrame(() => entry.button.click());
			}
		}

		addSorter(name: string, sortValue: (data: Data) => number, on?: boolean) {
			let entry = { name, sortValue, on: !!on };
			this.sorters.push(entry);
			elm(
				'button.ef-sorter',
				name,
				(click: MouseEvent & { target: HTMLElement }) => {
					entry.on = !entry.on;
					click.target.classList.toggle('ef-sorter-on', entry.on);
					if (entry.on) this.activeSorters.push(sortValue);
					else this.activeSorters.splice(this.activeSorters.indexOf(sortValue), 1);
					this.update();
				},
			).appendTo(this.container);
		}

		update() {
			if (!this.active) return;
			this.parse();
			let ens = this.getEntriesWithData();
			for (let en of ens) {
				let on = true;
				for (let f of this.filters) {
					if (f.on) on = on && f.filter(en.data);
				}
				en.el.classList.toggle('ef-hidden', !on);
			}
			if (!this.activeSorters.length) return;
			let br = elm('br');
			ens[0].el.before(br);
			for (let sorter of this.activeSorters) {
				ens = ens.vsort(({ data }) => sorter(data));
			}
			br.after(...ens.map(e => e.el));
			br.remove();
		}

	}
}