var PoopJs;
(function (PoopJs) {
    let ArrayExtension;
    (function (ArrayExtension) {
        async function pmap(mapper, threads = 5) {
            if (!(threads > 0))
                throw new Error();
            let tasks = this.map((e, i, a) => [e, i, a]);
            let results = Array(tasks.length);
            let anyResolved = PoopJs.PromiseExtension.empty();
            let freeThreads = threads;
            async function runTask(task) {
                try {
                    return await mapper(...task);
                }
                catch (err) {
                    return err;
                }
            }
            async function run(task) {
                freeThreads--;
                results[task[1]] = await runTask(task);
                freeThreads++;
                let oldAnyResolved = anyResolved;
                anyResolved = PoopJs.PromiseExtension.empty();
                oldAnyResolved.r(undefined);
            }
            for (let task of tasks) {
                if (freeThreads == 0) {
                    await anyResolved;
                }
                run(task);
            }
            while (freeThreads < threads) {
                await anyResolved;
            }
            return results;
        }
        ArrayExtension.pmap = pmap;
        function map(length, mapper = i => i) {
            return this(length).fill(0).map((e, i, a) => mapper(i));
        }
        ArrayExtension.map = map;
        function vsort(mapper, sorter = (a, b) => a - b) {
            let theSorter = typeof sorter == 'function' ? sorter : (a, b) => b - a;
            return this
                .map((e, i, a) => ({ e, v: mapper(e, i, a) }))
                .sort((a, b) => theSorter(a.v, b.v, a.e, b.e))
                .map(e => e.e);
        }
        ArrayExtension.vsort = vsort;
    })(ArrayExtension = PoopJs.ArrayExtension || (PoopJs.ArrayExtension = {}));
})(PoopJs || (PoopJs = {}));
var PoopJs;
(function (PoopJs) {
    let DateNowHack;
    (function (DateNowHack_1) {
        function DateNowHack(n = 5) {
            Date._now ??= Date.now;
            let _start = Date._now();
            let start = Date.now();
            Date.now = function () {
                return (this._now() - _start) * n + start;
            };
            Date.prototype._getTime ??= Date.prototype.getTime;
            let _gt_start = new Date()._getTime();
            let gt_start = new Date().getTime();
            Date.prototype.getTime = function () {
                return (this._getTime() - _gt_start) * n + gt_start;
            };
            console.log(`DateNowHack:`, n);
        }
        DateNowHack_1.DateNowHack = DateNowHack;
    })(DateNowHack = PoopJs.DateNowHack || (PoopJs.DateNowHack = {}));
})(PoopJs || (PoopJs = {}));
var PoopJs;
(function (PoopJs) {
    let EntryFiltererExtension;
    (function (EntryFiltererExtension) {
        class FiltererItem {
            id;
            name;
            description;
            threeWay = false;
            mode = 'off';
            parent;
            button;
            incompatible;
            hidden = false;
            constructor(selector, data) {
                Object.assign(this, data);
                this.button = elm(selector, (click) => this.click(click), (contextmenu) => this.contextmenu(contextmenu));
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
            click(event) {
                if (this.mode == 'off') {
                    this.toggleMode('on');
                    return;
                }
                if (event.target != this.button)
                    return;
                if (this.mode == 'on') {
                    this.toggleMode(this.threeWay ? 'opposite' : 'off');
                }
                else {
                    this.toggleMode('off');
                }
            }
            contextmenu(event) {
                event.preventDefault();
                if (this.mode != 'opposite') {
                    this.toggleMode('opposite');
                }
                else {
                    this.toggleMode('off');
                }
            }
            toggleMode(mode, force = false) {
                if (this.mode == mode && !force)
                    return;
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
        EntryFiltererExtension.FiltererItem = FiltererItem;
        class Filter extends FiltererItem {
            filter;
            constructor(data = {}) {
                super('button.ef-item.ef-filter[ef-mode="off"]', data);
            }
            /** returns if item should be visible */
            apply(data, el) {
                if (this.mode == 'off')
                    return true;
                let value = this.filter(data, el);
                let result = typeof value == "number" ? value > 0 : value;
                if (this.mode == 'on')
                    return result;
                if (this.mode == 'opposite')
                    return !result;
            }
        }
        EntryFiltererExtension.Filter = Filter;
        class FilterWithInput extends Filter {
            input;
            constructor(data) {
                super(data);
                if (typeof this.input != 'object') {
                    if (typeof this.input == 'number') {
                        this.input = `input[type=number][value=${this.input}]`;
                    }
                    if (!this.input.startsWith('input')) {
                        if (!this.input.startsWith('['))
                            this.input = `[type=text][value="${this.input.replaceAll('"', '\\"')}"]`;
                        if (!this.input.startsWith('input'))
                            this.input = `input${this.input}`;
                    }
                    this.input = elm(this.input);
                }
                this.input.onchange = this.input.onkeyup = this.input.onkeydown = this.input.onkeypress = () => this.parent.requestUpdate();
                this.button.append(this.input);
            }
            convert = (e) => e.type == 'number' ? +e.value : e.value;
            /** returns if item should be visible */
            apply(data, el) {
                if (this.mode == 'off')
                    return true;
                let inputValue = this.convert(this.input);
                let value = this.filter(data, el, inputValue);
                let result = typeof value == "number" ? value > 0 : value;
                if (this.mode == 'on')
                    return result;
                if (this.mode == 'opposite')
                    return !result;
            }
        }
        EntryFiltererExtension.FilterWithInput = FilterWithInput;
        class Sorter extends FiltererItem {
            sorter;
            constructor(data) {
                super('button.ef-item.ef-sorter[ef-mode="off"]', data);
            }
            toggleMode(mode, force = false) {
                if (this.mode == mode && !force)
                    return;
                this.parent.moveToTop(this);
                super.toggleMode(mode, force);
            }
            /** returns order of entry */
            apply(data, el) {
                if (this.mode == 'on') {
                    return this.sorter(data, el);
                }
                if (this.mode == 'off') {
                    return -this.sorter(data, el);
                }
                return 0;
            }
        }
        EntryFiltererExtension.Sorter = Sorter;
        class Modifier extends FiltererItem {
            modifier;
            runOnNoChange = false;
            constructor(data) {
                super('button.ef-item.ef-modifier[ef-mode="off"]', data);
            }
            toggleMode(mode, force = false) {
                if (this.mode == mode && !force)
                    return;
                this.parent.moveToTop(this);
                super.toggleMode(mode, force);
            }
            apply(data, el) {
                // let oldMode: Mode | null = el.getAttribute(`ef-modifier-${this.id}-mode`) as (Mode | null);
                // if (oldMode == this.mode && !this.runOnNoChange) return;
                this.modifier(data, el, this.mode, null);
                // el.setAttribute(`ef-modifier-${this.id}-mode`, this.mode);
            }
        }
        EntryFiltererExtension.Modifier = Modifier;
        class EntryFilterer {
            on = true;
            container;
            entrySelector;
            constructor(entrySelector, enabled = true) {
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
                PoopJs.paginate.onchange(() => this.requestUpdate());
                PoopJs.etc.onheightchange(() => this.requestUpdate());
            }
            entries = [];
            entryDatas = new Map();
            getData(el) {
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
                if (this.updatePending)
                    return;
                this.updatePending = true;
                if (reparse)
                    this.reparsePending = true;
                setTimeout(() => this.update());
            }
            addItem(id, data, list, constructor) {
                data.parent = this;
                data.id = id;
                data.name ??= id;
                let item = constructor(data);
                list.push(item);
                return item;
            }
            parsers = [];
            writeDataAttribute = false;
            addParser(parser) {
                this.parsers.push(parser);
                this.requestUpdate(true);
            }
            parseEntry(el) {
                let data = {};
                for (let parser of this.parsers) {
                    let newData = parser(el, data);
                    if (!newData || newData == data)
                        continue;
                    if (!IsPromise(newData)) {
                        Object.assign(data, newData);
                        continue;
                    }
                    newData.then(pNewData => {
                        if (pNewData && pNewData != data) {
                            Object.assign(data, pNewData);
                        }
                        this.requestUpdate();
                    });
                }
                if (this.writeDataAttribute) {
                    el.setAttribute('ef-data', JSON.stringify(data));
                }
                return data;
            }
            filters = [];
            addFilter(id, filter, data = {}) {
                data.filter ??= filter;
                return this.addItem(id, data, this.filters, data => new Filter(data));
            }
            addFilterWithInput(id, filter, data = {}) {
                data.filter ??= filter;
                return this.addItem(id, data, this.filters, data => new FilterWithInput(data));
            }
            sorters = [];
            addSorter(id, sorter, data = {}) {
                data.sorter = sorter;
                return this.addItem(id, data, this.sorters, data => new Sorter(data));
            }
            modifiers = [];
            addModifier(id, modifier, data = {}) {
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
                let pairs = entries.map(e => [e, this.getData(e)]);
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
                let pairs = entries.map(e => [e, this.getData(e)]);
                for (let modifier of this.modifiers) {
                    for (let [e, d] of pairs) {
                        modifier.apply(d, e);
                    }
                }
            }
            moveToTop(item) {
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
                if (this.disabled)
                    return;
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
            offIncompatible(incompatible) {
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
        EntryFiltererExtension.EntryFilterer = EntryFilterer;
        function IsPromise(p) {
            if (!p)
                return false;
            return typeof p.then == 'function';
        }
    })(EntryFiltererExtension = PoopJs.EntryFiltererExtension || (PoopJs.EntryFiltererExtension = {}));
    PoopJs.EntryFilterer = EntryFiltererExtension.EntryFilterer;
})(PoopJs || (PoopJs = {}));
var PoopJs;
(function (PoopJs) {
    let EntryFiltererExtension2;
    (function (EntryFiltererExtension2) {
        class FiltererItem {
            id = "";
            name;
            description;
            threeWay = false;
            mode = 'off';
            parent;
            button;
            incompatible;
            hidden = false;
            constructor(selector, data) {
                Object.assign(this, data);
                this.button = elm(selector, (click) => this.click(click), (contextmenu) => this.contextmenu(contextmenu));
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
            click(event) {
                if (this.mode == 'off') {
                    this.toggleMode('on');
                    return;
                }
                if (event.target != this.button)
                    return;
                if (this.mode == 'on') {
                    this.toggleMode(this.threeWay ? 'opposite' : 'off');
                }
                else {
                    this.toggleMode('off');
                }
            }
            contextmenu(event) {
                event.preventDefault();
                if (this.mode != 'opposite') {
                    this.toggleMode('opposite');
                }
                else {
                    this.toggleMode('off');
                }
            }
            toggleMode(mode, force = false) {
                if (this.mode == mode && !force)
                    return;
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
        EntryFiltererExtension2.FiltererItem = FiltererItem;
        class Filter extends FiltererItem {
            filter;
            constructor(data = {}) {
                super('button.ef-item.ef-filter[ef-mode="off"]', data);
            }
            /** returns if item should be visible */
            apply(data, el) {
                if (this.mode == 'off')
                    return true;
                let value = this.filter(data, el);
                let result = typeof value == "number" ? value > 0 : value;
                if (this.mode == 'on')
                    return result;
                if (this.mode == 'opposite')
                    return !result;
            }
        }
        EntryFiltererExtension2.Filter = Filter;
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
        class Sorter extends FiltererItem {
            sorter;
            constructor(data) {
                super('button.ef-item.ef-sorter[ef-mode="off"]', data);
            }
            toggleMode(mode, force = false) {
                if (this.mode == mode && !force)
                    return;
                this.parent.moveToTop(this);
                super.toggleMode(mode, force);
            }
            /** returns order of entry */
            apply(data, el) {
                if (this.mode == 'on') {
                    return this.sorter(data, el);
                }
                if (this.mode == 'off') {
                    return -this.sorter(data, el);
                }
                return 0;
            }
        }
        EntryFiltererExtension2.Sorter = Sorter;
        class Modifier extends FiltererItem {
            modifier;
            runOnNoChange = false;
            constructor(data) {
                super('button.ef-item.ef-modifier[ef-mode="off"]', data);
            }
            toggleMode(mode, force = false) {
                if (this.mode == mode && !force)
                    return;
                this.parent.moveToTop(this);
                super.toggleMode(mode, force);
            }
            apply(data, el) {
                // let oldMode: Mode | null = el.getAttribute(`ef-modifier-${this.id}-mode`) as (Mode | null);
                // if (oldMode == this.mode && !this.runOnNoChange) return;
                this.modifier(data, el, this.mode, null);
                // el.setAttribute(`ef-modifier-${this.id}-mode`, this.mode);
            }
        }
        EntryFiltererExtension2.Modifier = Modifier;
        class EntryFilterer {
            on = true;
            container;
            entrySelector;
            constructor(entrySelector, enabled = true) {
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
                PoopJs.paginate.onchange(() => this.requestUpdate());
                PoopJs.etc.onheightchange(() => this.requestUpdate());
            }
            entries = [];
            entryDatas = new Map();
            getData(el) {
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
                if (this.updatePending)
                    return;
                this.updatePending = true;
                if (reparse)
                    this.reparsePending = true;
                setTimeout(() => this.update());
            }
            addItem(id, data, list, constructor) {
                data.parent = this;
                data.id = id;
                data.name ??= id;
                let item = constructor(data);
                list.push(item);
                return item;
            }
            parsers = [];
            writeDataAttribute = false;
            addParser(parser) {
                this.parsers.push(parser);
                this.requestUpdate(true);
            }
            parseEntry(el) {
                let data = {};
                for (let parser of this.parsers) {
                    let newData = parser(el, data);
                    if (!newData || newData == data)
                        continue;
                    if (!IsPromise(newData)) {
                        Object.assign(data, newData);
                        continue;
                    }
                    newData.then(pNewData => {
                        if (pNewData && pNewData != data) {
                            Object.assign(data, pNewData);
                        }
                        this.requestUpdate();
                    });
                }
                if (this.writeDataAttribute) {
                    el.setAttribute('ef-data', JSON.stringify(data));
                }
                return data;
            }
            filters = [];
            addFilter(id, filter, data = {}) {
                data.filter ??= filter;
                return this.addItem(id, data, this.filters, data => new Filter(data));
            }
            // addFilterWithInput<V extends string | number>(id: string, filter: FilterWIFn<Data, V>, data: Partial<FilterWithInput<Data, V>> & { input?: V } = {}) {
            // 	data.filter ??= filter;
            // 	return this.addItem(id, data, this.filters, data => new FilterWithInput(data));
            // }
            sorters = [];
            addSorter(id, sorter, data = {}) {
                data.sorter = sorter;
                return this.addItem(id, data, this.sorters, data => new Sorter(data));
            }
            modifiers = [];
            addModifier(id, modifier, data = {}) {
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
                let pairs = entries.map(e => [e, this.getData(e)]);
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
                let pairs = entries.map(e => [e, this.getData(e)]);
                for (let modifier of this.modifiers) {
                    for (let [e, d] of pairs) {
                        modifier.apply(d, e);
                    }
                }
            }
            moveToTop(item) {
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
                if (this.disabled)
                    return;
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
            offIncompatible(incompatible) {
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
        EntryFiltererExtension2.EntryFilterer = EntryFilterer;
        function IsPromise(p) {
            if (!p)
                return false;
            return typeof p.then == 'function';
        }
    })(EntryFiltererExtension2 = PoopJs.EntryFiltererExtension2 || (PoopJs.EntryFiltererExtension2 = {}));
    PoopJs.EF2 = EntryFiltererExtension2.EntryFilterer;
})(PoopJs || (PoopJs = {}));
var PoopJs;
(function (PoopJs) {
    let ObjectExtension;
    (function (ObjectExtension) {
        function defineValue(o, p, value) {
            if (typeof p == 'function') {
                [p, value] = [p.name, p];
            }
            Object.defineProperty(o, p, {
                value,
                configurable: true,
                enumerable: false,
                writable: true,
            });
            return o;
        }
        ObjectExtension.defineValue = defineValue;
        function defineGetter(o, p, get) {
            if (typeof p == 'function') {
                [p, get] = [p.name, p];
            }
            Object.defineProperty(o, p, {
                get,
                configurable: true,
                enumerable: false,
            });
            return o;
        }
        ObjectExtension.defineGetter = defineGetter;
        function map(o, mapper) {
            let entries = Object.entries(o);
            return Object.fromEntries(entries.map(([k, v]) => [k, mapper(v, k, o)]));
        }
        ObjectExtension.map = map;
    })(ObjectExtension = PoopJs.ObjectExtension || (PoopJs.ObjectExtension = {}));
})(PoopJs || (PoopJs = {}));
var PoopJs;
(function (PoopJs) {
    let PromiseExtension;
    (function (PromiseExtension) {
        /**
         * Creates unwrapped promise
         */
        function empty() {
            let resolve;
            let reject;
            let p = new Promise((r, j) => {
                resolve = r;
                reject = j;
            });
            p.resolve = p.r = resolve;
            p.reject = p.j = reject;
            return p;
        }
        PromiseExtension.empty = empty;
        async function frame(n = 1) {
            while (--n > 0) {
                await new Promise(requestAnimationFrame);
            }
            return new Promise(requestAnimationFrame);
        }
        PromiseExtension.frame = frame;
    })(PromiseExtension = PoopJs.PromiseExtension || (PoopJs.PromiseExtension = {}));
})(PoopJs || (PoopJs = {}));
var PoopJs;
(function (PoopJs) {
    let QuerySelector;
    (function (QuerySelector) {
        let WindowQ;
        (function (WindowQ) {
            function q(selector, parent = document) {
                return parent.querySelector(selector);
            }
            WindowQ.q = q;
            function qq(selector, parent = document) {
                return [...parent.querySelectorAll(selector)];
            }
            WindowQ.qq = qq;
        })(WindowQ = QuerySelector.WindowQ || (QuerySelector.WindowQ = {}));
        let DocumentQ;
        (function (DocumentQ) {
            function q(selector) {
                return this.documentElement.querySelector(selector);
            }
            DocumentQ.q = q;
            function qq(selector) {
                return [...this.documentElement.querySelectorAll(selector)];
            }
            DocumentQ.qq = qq;
        })(DocumentQ = QuerySelector.DocumentQ || (QuerySelector.DocumentQ = {}));
        let ElementQ;
        (function (ElementQ) {
            function q(selector) {
                return this.querySelector(selector);
            }
            ElementQ.q = q;
            function qq(selector) {
                return [...this.querySelectorAll(selector)];
            }
            ElementQ.qq = qq;
        })(ElementQ = QuerySelector.ElementQ || (QuerySelector.ElementQ = {}));
    })(QuerySelector = PoopJs.QuerySelector || (PoopJs.QuerySelector = {}));
    let ElementExtension;
    (function (ElementExtension) {
        function emit(type, detail) {
            let event = new CustomEvent(type, {
                bubbles: true,
                detail,
            });
            this.dispatchEvent(event);
        }
        ElementExtension.emit = emit;
        function appendTo(parent) {
            if (typeof parent == 'string') {
                parent = document.querySelector(parent);
            }
            parent.append(this);
            return this;
        }
        ElementExtension.appendTo = appendTo;
    })(ElementExtension = PoopJs.ElementExtension || (PoopJs.ElementExtension = {}));
})(PoopJs || (PoopJs = {}));
var PoopJs;
(function (PoopJs) {
    let Elm;
    (function (Elm) {
        const elmRegex = new RegExp([
            /^(?<tag>[\w-]+)/,
            /#(?<id>[\w-]+)/,
            /\.(?<class>[\w-]+)/,
            /\[(?<attr1>[\w-]+)\]/,
            /\[(?<attr2>[\w-]+)=(?!['"])(?<val2>[^\]]*)\]/,
            /\[(?<attr3>[\w-]+)="(?<val3>(?:[^"]|\\")*)"\]/,
            /\[(?<attr4>[\w-]+)="(?<val4>(?:[^']|\\')*)"\]/,
        ].map(e => e.source).join('|'), 'g');
        function elm(selector = '', ...children) {
            if (selector.replaceAll(elmRegex, '') != '') {
                throw new Error(`invalid selector: ${selector}`);
            }
            let element = document.createElement('div');
            for (let match of selector.matchAll(elmRegex)) {
                if (match.groups.tag) {
                    element = document.createElement(match.groups.tag);
                }
                else if (match.groups.id) {
                    element.id = match.groups.id;
                }
                else if (match.groups.class) {
                    element.classList.add(match.groups.class);
                }
                else if (match.groups.attr1) {
                    element.setAttribute(match.groups.attr1, "true");
                }
                else if (match.groups.attr2) {
                    element.setAttribute(match.groups.attr2, match.groups.val2);
                }
                else if (match.groups.attr3) {
                    element.setAttribute(match.groups.attr3, match.groups.val3.replace(/\\"/g, '"'));
                }
                else if (match.groups.attr4) {
                    element.setAttribute(match.groups.attr4, match.groups.val4.replace(/\\'/g, '\''));
                }
            }
            for (let listener of children.filter(e => typeof e == 'function')) {
                let name = listener.name;
                if (!name)
                    name = (listener + '').match(/\w+/)[0];
                if (name.startsWith('on'))
                    name = name.slice(2);
                if (element['on' + name] === null) {
                    element['on' + name] = listener;
                }
                else {
                    element.addEventListener(name, listener);
                }
            }
            element.append(...children.filter(e => typeof e != 'function'));
            return element;
        }
        Elm.elm = elm;
    })(Elm = PoopJs.Elm || (PoopJs.Elm = {}));
})(PoopJs || (PoopJs = {}));
var PoopJs;
(function (PoopJs) {
    let etc;
    (function (etc) {
        function keybind(key, fn) {
            let code = key.length == 1 ? 'Key' + key.toUpperCase() : key;
            function onkeydown(event) {
                if (event.code == code) {
                    fn(event);
                }
            }
            addEventListener('keydown', onkeydown);
            return () => removeEventListener('keydown', onkeydown);
        }
        etc.keybind = keybind;
        async function fullscreen(on) {
            let central = PoopJs.paginate.imageScrollingActive && PoopJs.paginate.getCentralImg();
            if (!document.fullscreenElement) {
                if (on == false)
                    return;
                await document.documentElement.requestFullscreen();
            }
            else {
                if (on == true)
                    return;
                await document.exitFullscreen();
            }
            if (central) {
                central.scrollIntoView();
            }
        }
        etc.fullscreen = fullscreen;
        function anybind(keyOrEvent, fn) {
            if (typeof keyOrEvent == "number")
                keyOrEvent = keyOrEvent + '';
            // detect if it is event
            let isEvent = window.hasOwnProperty('on' + keyOrEvent);
            if (isEvent) {
                addEventListener(keyOrEvent, fn);
                return;
            }
            // parse key code
            if (!isNaN(parseInt(keyOrEvent))) {
                keyOrEvent = `Digit${keyOrEvent}`;
            }
            else if (keyOrEvent.length == 1) {
                keyOrEvent = `Key${keyOrEvent.toUpperCase()}`;
            }
            addEventListener('keydown', ev => {
                if (ev.code != keyOrEvent)
                    return;
                fn(ev);
            });
        }
        etc.anybind = anybind;
        function fullscreenOn(key) {
            if (key == 'scroll') {
                addEventListener('scroll', () => fullscreen(true));
                return;
            }
            return keybind(key, () => fullscreen());
        }
        etc.fullscreenOn = fullscreenOn;
        function fIsForFullscreen() {
            keybind('F', () => fullscreen());
        }
        etc.fIsForFullscreen = fIsForFullscreen;
        function hashCode(value) {
            value ??= this;
            let hash = 0;
            for (let c of value) {
                hash = ((hash << 5) - hash) + c.charCodeAt(0);
                hash = hash & hash;
            }
            return hash;
        }
        etc.hashCode = hashCode;
        function init() {
            // String.prototype.hashCode = hashCode;
        }
        etc.init = init;
        function currentScriptHash() {
            return hashCode(document.currentScript.innerHTML);
        }
        etc.currentScriptHash = currentScriptHash;
        function reloadOnCurrentScriptChanged(scriptName = location.hostname + '.ujs') {
            let scriptId = `reloadOnCurrentScriptChanged_${scriptName}`;
            let scriptHash = currentScriptHash() + '';
            localStorage.setItem(scriptId, scriptHash);
            addEventListener('focus', () => {
                if (localStorage.getItem(scriptId) != scriptHash) {
                    location.reload();
                }
            });
        }
        etc.reloadOnCurrentScriptChanged = reloadOnCurrentScriptChanged;
        etc.fastScroll = function (speed = 0.25) {
            if (etc.fastScroll.active)
                etc.fastScroll.off();
            etc.fastScroll.active = true;
            etc.fastScroll.speed = speed;
            function onwheel(event) {
                if (event.defaultPrevented)
                    return;
                if (event.ctrlKey || event.shiftKey)
                    return;
                scrollBy(0, -Math.sign(event.wheelDeltaY) * innerHeight * etc.fastScroll.speed);
                event.preventDefault();
            }
            addEventListener('mousewheel', onwheel, { passive: false });
            etc.fastScroll.off = () => {
                etc.fastScroll.active = false;
                removeEventListener('mousewheel', onwheel);
            };
        };
        etc.fastScroll.active = false;
        etc.fastScroll.off = () => { };
        function onraf(f) {
            let loop = true;
            void async function () {
                while (loop) {
                    await Promise.frame();
                    f();
                }
            }();
            return () => { loop = false; };
        }
        etc.onraf = onraf;
        let resizeObserver;
        let resizeListeners = [];
        let previousBodyHeight = 0;
        function onheightchange(f) {
            if (!resizeObserver) {
                previousBodyHeight = document.body.clientHeight;
                resizeObserver = new ResizeObserver(entries => {
                    for (let e of entries) {
                        if (e.target != document.body)
                            continue;
                        let newBodyHeight = e.target.clientHeight;
                        for (let f of resizeListeners) {
                            f(newBodyHeight, previousBodyHeight);
                        }
                        previousBodyHeight = newBodyHeight;
                    }
                });
                resizeObserver.observe(document.body);
            }
            resizeListeners.push(f);
            return function removeListener() {
                resizeListeners.splice(resizeListeners.indexOf(f));
            };
        }
        etc.onheightchange = onheightchange;
    })(etc = PoopJs.etc || (PoopJs.etc = {}));
})(PoopJs || (PoopJs = {}));
// interface String {
// 	hashCode: () => number;
// }
var PoopJs;
(function (PoopJs) {
    let FetchExtension;
    (function (FetchExtension) {
        FetchExtension.defaults = { credentials: 'include' };
        async function cached(url, init = {}) {
            let cache = await caches.open('fetch');
            let response = await cache.match(url);
            if (response) {
                return response;
            }
            response = await fetch(url, { ...FetchExtension.defaults, ...init });
            if (response.ok) {
                cache.put(url, response.clone());
            }
            return response;
        }
        FetchExtension.cached = cached;
        // export async function cachedDoc(url: string): Promise<Document> {
        // 	let cache = await caches.open('fetch');
        // 	let response = await cache.match(url);
        // 	if (!response) {
        // 		response = await fetch(url, { credentials: 'include' });
        // 		await cache.put(url, response.clone());
        // 	}
        // 	return doc(url);
        // }
        async function cachedDoc(url, init = {}) {
            let response = await cached(url, init);
            let text = await response.text();
            let parser = new DOMParser();
            let doc = parser.parseFromString(text, 'text/html');
            let base = doc.createElement('base');
            base.href = url;
            doc.head.append(base);
            return doc;
        }
        FetchExtension.cachedDoc = cachedDoc;
        async function cachedJson(url, init = {}) {
            let response = await cached(url, init);
            return response.json();
        }
        FetchExtension.cachedJson = cachedJson;
        async function doc(url) {
            let p = Promise.empty();
            let oReq = new XMLHttpRequest();
            oReq.onload = p.r;
            oReq.responseType = 'document';
            oReq.open("get", url, true);
            oReq.send();
            await p;
            return oReq.responseXML;
        }
        FetchExtension.doc = doc;
        async function json(url, init = {}) {
            return fetch(url, { ...FetchExtension.defaults, ...init }).then(e => e.json());
        }
        FetchExtension.json = json;
        async function clearCache() {
            return caches.delete('fetch');
        }
        FetchExtension.clearCache = clearCache;
    })(FetchExtension = PoopJs.FetchExtension || (PoopJs.FetchExtension = {}));
})(PoopJs || (PoopJs = {}));
var PoopJs;
(function (PoopJs) {
    class Observer {
    }
    PoopJs.Observer = Observer;
})(PoopJs || (PoopJs = {}));
/*

function observeClassAdd(cls, cb) {
    let queued = false;
    async function run() {
        if (queued) return;
        queued = true;
        await Promise.frame();
        queued = false;
        cb();
    }
    new MutationObserver(list => {
        for (let mr of list) {
            if (mr.type == 'attributes' && mr.attributeName == 'class') {
                if (mr.target.classList.contains(cls)) {
                    run();
                }
            }
            if (mr.type == 'childList') {
                for (let ch of mr.addedNodes) {
                    if (ch.classList?.contains(cls)) {
                        run();
                    }
                }
            }
        }
    }).observe(document.body, {
        childList: true,
        attributes: true,
        subtree: true,
    });
}

*/ 
var PoopJs;
(function (PoopJs) {
    let paginate;
    (function (paginate) {
        paginate.active = false;
        paginate.queued = 0;
        paginate.wip = false;
        function init() {
            if (paginate.active)
                return;
            paginate.active = true;
            document.documentElement.addEventListener('mousedown', (event) => {
                if (event.button != 1)
                    return;
                let target = event.target;
                if (target.closest('a'))
                    return;
                target.emit('paginationrequest', event);
                paginationrequest(event);
            });
            document.documentElement.addEventListener('keydown', (event) => {
                if (event.code != 'AltRight')
                    return;
                event.preventDefault();
                let target = event.target;
                target.emit('paginationrequest', event);
                paginationrequest(event);
            });
            document.documentElement.addEventListener('paginationend', (event) => {
                paginate.wip = false;
                if (paginate.queued) {
                    paginate.queued--;
                    run();
                }
            });
        }
        paginate.init = init;
        function paginationrequest(event) {
            getSelection().removeAllRanges();
            if (event.shiftKey || event.detail?.shiftKey
                || event.buttons == 1) {
                paginate.queued += 9;
            }
            if (paginate.wip) {
                paginate.queued++;
                return;
            }
            run();
        }
        paginate.paginationrequest = paginationrequest;
        function run() {
            paginate.wip = true;
            document.documentElement.emit('paginationstart');
        }
        paginate.run = run;
        function onrun(condition, fn = condition) {
            init();
            if (!condition)
                return;
            console.log('paginate registered:', fn);
            document.addEventListener('paginationstart', fn);
        }
        paginate.onrun = onrun;
        function onRunO(condition, data = condition) {
            if (!condition)
                return;
            function makeArray(data) {
                return !data ? [] : Array.isArray(data) ? data : [data];
            }
            let fixedData = {
                prefetch: makeArray(data.prefetch),
                aDoc: data.aDoc,
                click: makeArray(data.click),
                afterLast: makeArray(data.afterLast),
                replace: makeArray(data.replace),
            };
            fixedData.prefetch.map(e => prefetch(e));
            onrun(async () => {
                fixedData.click.map(e => q(e)?.click());
                if (data.aDoc) {
                    await aDoc(data.aDoc);
                    fixedData.afterLast.map(e => afterLast(e));
                    fixedData.replace.map(e => replace(e));
                }
                end();
            });
            onend(() => {
                fixedData.prefetch.map(prefetch);
            });
        }
        paginate.onRunO = onRunO;
        function onchange(condition, fn = condition) {
            init();
            if (!condition)
                return;
            document.addEventListener('paginationchange', fn);
        }
        paginate.onchange = onchange;
        function end() {
            document.documentElement.emit('paginationend');
        }
        paginate.end = end;
        function onend(condition, fn = condition) {
            if (!condition)
                return;
            document.addEventListener('paginationend', fn);
        }
        paginate.onend = onend;
        function toHref(link) {
            if (typeof link == 'string') {
                if (link.startsWith('http')) {
                    return link;
                }
                link = q(link);
            }
            return link.href;
        }
        paginate.toHref = toHref;
        function toAnchor(link) {
            if (typeof link == 'string') {
                if (link.startsWith('http')) {
                    return elm(`a[href=${link}]`);
                }
                return q(link);
            }
            return link;
        }
        paginate.toAnchor = toAnchor;
        async function aDoc(link) {
            let a = toAnchor(link);
            if (!a)
                throw new Error('not a link');
            a.classList.add('paginate-spin');
            let doc = await fetch.doc(a.href);
            paginate.doc = doc;
            return doc;
        }
        paginate.aDoc = aDoc;
        async function aCachedDoc(link) {
            let a = toAnchor(link);
            if (!a)
                throw new Error('not a link');
            a.classList.add('paginate-spin');
            let doc = await fetch.cached.doc(a.href);
            a.classList.remove('paginate-spin');
            paginate.doc = doc;
            return doc;
        }
        paginate.aCachedDoc = aCachedDoc;
        function appendChildren(doc, source, target = source) {
            if (typeof doc == 'string')
                return appendChildren(paginate.doc, doc, source);
            let children = [...doc.q(source).children];
            q(target).append(...children);
            document.documentElement.emit('paginationchange', children);
            return paginate;
        }
        paginate.appendChildren = appendChildren;
        function afterLast(doc, source, target = source) {
            if (typeof doc == 'string')
                return afterLast(paginate.doc, doc, source);
            let children = doc.qq(source);
            let last = qq(target).pop();
            last.after(...children);
            document.documentElement.emit('paginationchange', children);
            return paginate;
        }
        paginate.afterLast = afterLast;
        function replace(doc, source, target = source) {
            if (typeof doc == 'string')
                return replace(paginate.doc, doc, source);
            return replaceEach(doc, source, target); // !!! should check if this one is actually useless
            // let child = doc.q(source)
            // q(target).replaceWith(child);
            // document.documentElement.emit('paginationchange', [child]);
            // return paginate;
        }
        paginate.replace = replace;
        function replaceEach(doc, source, target = source) {
            if (typeof doc == 'string')
                return replaceEach(paginate.doc, doc, source);
            let children = doc.qq(source);
            qq(target).map((e, i) => e.replaceWith(children[i]));
            document.documentElement.emit('paginationchange', children);
            return paginate;
        }
        paginate.replaceEach = replaceEach;
        function prefetch(enabled, link = enabled) {
            if (!enabled)
                return false;
            elm(`link[rel="prefetch"][href="${toHref(link)}"]`).appendTo('head');
            return true;
        }
        paginate.prefetch = prefetch;
        paginate.imageScrollingActive = false;
        paginate.imgSelector = 'img';
        function imageScrolling(selector) {
            if (paginate.imageScrollingActive)
                return;
            if (selector)
                paginate.imgSelector = selector;
            paginate.imageScrollingActive = true;
            function onwheel(event) {
                if (event.shiftKey || event.ctrlKey)
                    return;
                if (scrollWholeImage(-Math.sign(event.wheelDeltaY))) {
                    event.preventDefault();
                }
            }
            document.addEventListener('mousewheel', onwheel, { passive: false });
            return paginate.imageScrollingOff = () => {
                paginate.imageScrollingActive = false;
                document.removeEventListener('mousewheel', onwheel);
            };
        }
        paginate.imageScrolling = imageScrolling;
        paginate.imageScrollingOff = () => { };
        function imgToWindowCenter(img) {
            let rect = img.getBoundingClientRect();
            return (rect.top + rect.bottom) / 2 - innerHeight / 2;
        }
        paginate.imgToWindowCenter = imgToWindowCenter;
        function getAllImageInfo() {
            let images = qq(paginate.imgSelector);
            let datas = images.map((img, index) => {
                let rect = img.getBoundingClientRect();
                return {
                    img, rect, index,
                    inScreen: rect.top >= -1 && rect.bottom <= innerHeight,
                    crossScreen: rect.bottom >= 1 && rect.top <= innerHeight - 1,
                    yToScreenCenter: (rect.top + rect.bottom) / 2 - innerHeight / 2,
                    isInCenter: Math.abs((rect.top + rect.bottom) / 2 - innerHeight / 2) < 3,
                    isScreenHeight: Math.abs(rect.height - innerHeight) < 3,
                };
            });
            return datas;
        }
        paginate.getAllImageInfo = getAllImageInfo;
        paginate.scrollWholeImagePending = false;
        function getCentralImg() {
            return getAllImageInfo().vsort(e => Math.abs(e.yToScreenCenter))[0]?.img;
        }
        paginate.getCentralImg = getCentralImg;
        function scrollWholeImage(dir = 1) {
            if (paginate.scrollWholeImagePending)
                return true;
            dir = Math.sign(dir);
            let datas = getAllImageInfo();
            let central = datas.vsort(e => Math.abs(e.yToScreenCenter))[0];
            function scrollToImage(data) {
                if (!data)
                    return false;
                if (scrollY + data.yToScreenCenter <= 0 && scrollY <= 0) {
                    return false;
                }
                if (data.isScreenHeight) {
                    data.img.scrollIntoView();
                }
                else {
                    scrollTo(scrollX, scrollY + data.yToScreenCenter);
                }
                paginate.scrollWholeImagePending = true;
                Promise.raf(2).then(() => paginate.scrollWholeImagePending = false);
                return true;
            }
            // if no images, don't scroll;
            if (!central)
                return false;
            // if current image is outside view, don't scroll
            if (!central.crossScreen)
                return false;
            // if current image is in center, scroll to the next one
            if (central.isInCenter) {
                return scrollToImage(datas[datas.indexOf(central) + dir]);
            }
            // if to scroll to current image you have to scroll in opposide direction, scroll to next one
            if (Math.sign(central.yToScreenCenter) != dir) {
                return scrollToImage(datas[datas.indexOf(central) + dir]);
            }
            // if current image is first/last, don't scroll over 25vh to it
            if (dir == 1 && central.index == 0 && central.yToScreenCenter > innerHeight / 2) {
                return false;
            }
            if (dir == -1 && central.index == datas.length - 1 && central.yToScreenCenter < -innerHeight / 2) {
                return false;
            }
            return scrollToImage(central);
        }
        paginate.scrollWholeImage = scrollWholeImage;
    })(paginate = PoopJs.paginate || (PoopJs.paginate = {}));
})(PoopJs || (PoopJs = {}));
/// <reference path="./Array.ts" />
/// <reference path="./DateNowHack.ts" />
/// <reference path="./Element.ts" />
/// <reference path="./elm.ts" />
/// <reference path="./EntryFilter.ts" />
/// <reference path="./EntryFilter2.ts" />
/// <reference path="./etc.ts" />
/// <reference path="./fetch.ts" />
/// <reference path="./Object.ts" />
/// <reference path="./observer.ts" />
/// <reference path="./paginate.ts" />
/// <reference path="./Promise.ts" />
var PoopJs;
(function (PoopJs) {
    function __init__(window) {
        if (!window)
            window = globalThis.window;
        window.elm = PoopJs.Elm.elm;
        window.q = PoopJs.QuerySelector.WindowQ.q;
        window.qq = PoopJs.QuerySelector.WindowQ.qq;
        PoopJs.ObjectExtension.defineValue(Element.prototype, 'q', PoopJs.QuerySelector.ElementQ.q);
        PoopJs.ObjectExtension.defineValue(Element.prototype, 'qq', PoopJs.QuerySelector.ElementQ.qq);
        PoopJs.ObjectExtension.defineValue(Element.prototype, 'appendTo', PoopJs.ElementExtension.appendTo);
        PoopJs.ObjectExtension.defineValue(Element.prototype, 'emit', PoopJs.ElementExtension.emit);
        PoopJs.ObjectExtension.defineValue(Document.prototype, 'q', PoopJs.QuerySelector.DocumentQ.q);
        PoopJs.ObjectExtension.defineValue(Document.prototype, 'qq', PoopJs.QuerySelector.DocumentQ.qq);
        PoopJs.ObjectExtension.defineValue(Promise, 'empty', PoopJs.PromiseExtension.empty);
        PoopJs.ObjectExtension.defineValue(Promise, 'frame', PoopJs.PromiseExtension.frame);
        PoopJs.ObjectExtension.defineValue(Promise, 'raf', PoopJs.PromiseExtension.frame);
        window.fetch.cached = PoopJs.FetchExtension.cached;
        window.fetch.doc = PoopJs.FetchExtension.doc;
        window.fetch.json = PoopJs.FetchExtension.json;
        window.fetch.cached.doc = PoopJs.FetchExtension.cachedDoc;
        window.fetch.doc.cached = PoopJs.FetchExtension.cachedDoc;
        window.fetch.cachedDoc = PoopJs.FetchExtension.cachedDoc;
        window.fetch.json.cached = PoopJs.FetchExtension.cachedJson;
        window.fetch.cached.json = PoopJs.FetchExtension.cachedJson;
        PoopJs.ObjectExtension.defineValue(Object, 'defineValue', PoopJs.ObjectExtension.defineValue);
        PoopJs.ObjectExtension.defineValue(Object, 'defineGetter', PoopJs.ObjectExtension.defineGetter);
        PoopJs.ObjectExtension.defineValue(Object, 'map', PoopJs.ObjectExtension.map);
        PoopJs.ObjectExtension.defineValue(Array, 'map', PoopJs.ArrayExtension.map);
        PoopJs.ObjectExtension.defineValue(Array.prototype, 'pmap', PoopJs.ArrayExtension.pmap);
        PoopJs.ObjectExtension.defineValue(Array.prototype, 'vsort', PoopJs.ArrayExtension.vsort);
        window.paginate = PoopJs.paginate;
        window.DateNowHack = PoopJs.DateNowHack.DateNowHack;
        PoopJs.ObjectExtension.defineValue(window, '__init__', 'already inited');
        return 'inited';
    }
    PoopJs.__init__ = __init__;
    PoopJs.ObjectExtension.defineGetter(window, '__init__', () => __init__(window));
    if (window.localStorage.__init__) {
        window.__init__;
    }
})(PoopJs || (PoopJs = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9BcnJheS50cyIsIi4uL3NyYy9EYXRlTm93SGFjay50cyIsIi4uL3NyYy9FbnRyeUZpbHRlci50cyIsIi4uL3NyYy9FbnRyeUZpbHRlcjIudHMiLCIuLi9zcmMvT2JqZWN0LnRzIiwiLi4vc3JjL1Byb21pc2UudHMiLCIuLi9zcmMvZWxlbWVudC50cyIsIi4uL3NyYy9lbG0udHMiLCIuLi9zcmMvZXRjLnRzIiwiLi4vc3JjL2ZldGNoLnRzIiwiLi4vc3JjL29ic2VydmVyLnRzIiwiLi4vc3JjL3BhZ2luYXRlLnRzIiwiLi4vc3JjL2luaXQudHMiLCIuLi9zcmMvdHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBVSxNQUFNLENBb0RmO0FBcERELFdBQVUsTUFBTTtJQUVmLElBQWlCLGNBQWMsQ0FnRDlCO0lBaERELFdBQWlCLGNBQWM7UUFHdkIsS0FBSyxVQUFVLElBQUksQ0FBa0IsTUFBbUQsRUFBRSxPQUFPLEdBQUcsQ0FBQztZQUMzRyxJQUFJLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO2dCQUFFLE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUN0QyxJQUFJLEtBQUssR0FBdUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqRSxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3JDLElBQUksV0FBVyxHQUFHLE9BQUEsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDM0MsSUFBSSxXQUFXLEdBQUcsT0FBTyxDQUFDO1lBQzFCLEtBQUssVUFBVSxPQUFPLENBQUMsSUFBc0I7Z0JBQzVDLElBQUk7b0JBQ0gsT0FBTyxNQUFNLE1BQU0sQ0FB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QUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUNsQyxNQUFNLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDO1FBRXBELE9BQUEsZUFBZSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDbEUsT0FBTyxRQUFRLENBQUM7SUFDakIsQ0FBQztJQXZDZSxlQUFRLFdBdUN2QixDQUFBO0lBRUQsT0FBQSxlQUFlLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFFekUsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRTtRQUNqQyxNQUFNLENBQUMsUUFBUSxDQUFDO0tBQ2hCO0FBRUYsQ0FBQyxFQWpEUyxNQUFNLEtBQU4sTUFBTSxRQWlEZiIsInNvdXJjZXNDb250ZW50IjpbIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIEFycmF5RXh0ZW5zaW9uIHtcclxuXHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBtYXA8VCwgVj4odGhpczogVFtdLCBtYXBwZXI6IChlOiBULCBpOiBudW1iZXIsIGE6IFRbXSkgPT4gUHJvbWlzZTxWPiB8IFYsIHRocmVhZHMgPSA1KTogUHJvbWlzZTxWW10+IHtcclxuXHRcdFx0aWYgKCEodGhyZWFkcyA+IDApKSB0aHJvdyBuZXcgRXJyb3IoKTtcclxuXHRcdFx0bGV0IHRhc2tzOiBbVCwgbnVtYmVyLCBUW11dW10gPSB0aGlzLm1hcCgoZSwgaSwgYSkgPT4gW2UsIGksIGFdKTtcclxuXHRcdFx0bGV0IHJlc3VsdHMgPSBBcnJheTxWPih0YXNrcy5sZW5ndGgpO1xyXG5cdFx0XHRsZXQgYW55UmVzb2x2ZWQgPSBQcm9taXNlRXh0ZW5zaW9uLmVtcHR5KCk7XHJcblx0XHRcdGxldCBmcmVlVGhyZWFkcyA9IHRocmVhZHM7XHJcblx0XHRcdGFzeW5jIGZ1bmN0aW9uIHJ1blRhc2sodGFzazogW1QsIG51bWJlciwgVFtdXSk6IFByb21pc2U8Vj4ge1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gYXdhaXQgbWFwcGVyKC4uLnRhc2spO1xyXG5cdFx0XHRcdH0gY2F0Y2ggKGVycikge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGVycjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0YXN5bmMgZnVuY3Rpb24gcnVuKHRhc2spIHtcclxuXHRcdFx0XHRmcmVlVGhyZWFkcy0tO1xyXG5cdFx0XHRcdHJlc3VsdHNbdGFza1sxXV0gPSBhd2FpdCBydW5UYXNrKHRhc2spO1xyXG5cdFx0XHRcdGZyZWVUaHJlYWRzKys7XHJcblx0XHRcdFx0bGV0IG9sZEFueVJlc29sdmVkID0gYW55UmVzb2x2ZWQ7XHJcblx0XHRcdFx0YW55UmVzb2x2ZWQgPSBQcm9taXNlRXh0ZW5zaW9uLmVtcHR5KCk7XHJcblx0XHRcdFx0b2xkQW55UmVzb2x2ZWQucih1bmRlZmluZWQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGZvciAobGV0IHRhc2sgb2YgdGFza3MpIHtcclxuXHRcdFx0XHRpZiAoZnJlZVRocmVhZHMgPT0gMCkge1xyXG5cdFx0XHRcdFx0YXdhaXQgYW55UmVzb2x2ZWQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJ1bih0YXNrKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR3aGlsZSAoZnJlZVRocmVhZHMgPCB0aHJlYWRzKSB7XHJcblx0XHRcdFx0YXdhaXQgYW55UmVzb2x2ZWQ7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHJlc3VsdHM7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIG1hcDxUID0gbnVtYmVyPih0aGlzOiBBcnJheUNvbnN0cnVjdG9yLCBsZW5ndGg6IG51bWJlciwgbWFwcGVyOiAobnVtYmVyKSA9PiBUID0gaSA9PiBpKSB7XHJcblx0XHRcdHJldHVybiB0aGlzKGxlbmd0aCkuZmlsbCgwKS5tYXAoKGUsIGksIGEpID0+IG1hcHBlcihpKSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHZzb3J0PFQ+KHRoaXM6IFRbXSwgbWFwcGVyOiAoZTogVCwgaTogbnVtYmVyLCBhOiBUW10pID0+IG51bWJlciwgc29ydGVyOiAoKGE6IG51bWJlciwgYjogbnVtYmVyLCBhZTogVCwgYmU6IFQpID0+IG51bWJlcikgfCAtMSA9IChhLCBiKSA9PiBhIC0gYikge1xyXG5cdFx0XHRsZXQgdGhlU29ydGVyID0gdHlwZW9mIHNvcnRlciA9PSAnZnVuY3Rpb24nID8gc29ydGVyIDogKGEsIGIpID0+IGIgLSBhO1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0XHRcdC5tYXAoKGUsIGksIGEpID0+ICh7IGUsIHY6IG1hcHBlcihlLCBpLCBhKSB9KSlcclxuXHRcdFx0XHQuc29ydCgoYSwgYikgPT4gdGhlU29ydGVyKGEudiwgYi52LCBhLmUsIGIuZSkpXHJcblx0XHRcdFx0Lm1hcChlID0+IGUuZSk7XHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBEYXRlTm93SGFjayB7XHJcblx0XHRcclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gRGF0ZU5vd0hhY2sobiA9IDUpIHtcclxuXHRcdFx0RGF0ZS5fbm93ID8/PSBEYXRlLm5vdztcclxuXHRcdFx0bGV0IF9zdGFydCA9IERhdGUuX25vdygpO1xyXG5cdFx0XHRsZXQgc3RhcnQgPSBEYXRlLm5vdygpO1xyXG5cdFx0XHREYXRlLm5vdyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHJldHVybiAodGhpcy5fbm93KCkgLSBfc3RhcnQpICogbiArIHN0YXJ0O1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHREYXRlLnByb3RvdHlwZS5fZ2V0VGltZSA/Pz0gRGF0ZS5wcm90b3R5cGUuZ2V0VGltZTtcclxuXHRcdFx0bGV0IF9ndF9zdGFydCA9IG5ldyBEYXRlKCkuX2dldFRpbWUoKTtcclxuXHRcdFx0bGV0IGd0X3N0YXJ0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcblx0XHRcdERhdGUucHJvdG90eXBlLmdldFRpbWUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRyZXR1cm4gKHRoaXMuX2dldFRpbWUoKSAtIF9ndF9zdGFydCkgKiBuICsgZ3Rfc3RhcnQ7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNvbnNvbGUubG9nKGBEYXRlTm93SGFjazpgLCBuKTtcclxuXHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHJcblxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblxyXG5cdGV4cG9ydCBuYW1lc3BhY2UgRW50cnlGaWx0ZXJlckV4dGVuc2lvbiB7XHJcblx0XHR0eXBlIFdheW5lc3MgPSBmYWxzZSB8IHRydWUgfCAnZGlyJztcclxuXHRcdHR5cGUgTW9kZSA9ICdvZmYnIHwgJ29uJyB8ICdvcHBvc2l0ZSc7XHJcblxyXG5cdFx0dHlwZSBQYXJzZXJGbjxEYXRhPiA9IChlbDogSFRNTEVsZW1lbnQsIGRhdGE6IFBhcnRpYWw8RGF0YT4pID0+IFBhcnRpYWw8RGF0YT4gfCBQcm9taXNlTGlrZTxQYXJ0aWFsPERhdGE+PiB8IHZvaWQ7XHJcblx0XHR0eXBlIEZpbHRlckZuPERhdGE+ID0gKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCkgPT4gYm9vbGVhbiB8IG51bWJlcjtcclxuXHRcdHR5cGUgU29ydGVyRm48RGF0YT4gPSAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KSA9PiBudW1iZXI7XHJcblx0XHR0eXBlIE1vZGlmaWVyRm48RGF0YT4gPSAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50LCBtb2RlOiBNb2RlLCBvbGRNb2RlOiBNb2RlIHwgbnVsbCkgPT4gdm9pZDtcclxuXHRcdHR5cGUgRmlsdGVyV0lGbjxEYXRhLCBWPiA9ICgoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50LCAuLi52YWx1ZXM6IFZbXSkgPT4gYm9vbGVhbiB8IG51bWJlcik7XHJcblxyXG5cdFx0ZXhwb3J0IGNsYXNzIEZpbHRlcmVySXRlbTxEYXRhPiB7XHJcblx0XHRcdGlkOiBzdHJpbmc7XHJcblx0XHRcdG5hbWU/OiBzdHJpbmc7XHJcblx0XHRcdGRlc2NyaXB0aW9uPzogc3RyaW5nO1xyXG5cdFx0XHR0aHJlZVdheTogV2F5bmVzcyA9IGZhbHNlO1xyXG5cdFx0XHRtb2RlOiBNb2RlID0gJ29mZic7XHJcblx0XHRcdHBhcmVudDogRW50cnlGaWx0ZXJlcjtcclxuXHRcdFx0YnV0dG9uOiBIVE1MQnV0dG9uRWxlbWVudDtcclxuXHRcdFx0aW5jb21wYXRpYmxlPzogc3RyaW5nW107XHJcblx0XHRcdGhpZGRlbiA9IGZhbHNlO1xyXG5cclxuXHRcdFx0Y29uc3RydWN0b3Ioc2VsZWN0b3I6IHN0cmluZywgZGF0YTogUGFydGlhbDxGaWx0ZXJlckl0ZW08RGF0YT4+KSB7XHJcblx0XHRcdFx0T2JqZWN0LmFzc2lnbih0aGlzLCBkYXRhKTtcclxuXHRcdFx0XHR0aGlzLmJ1dHRvbiA9IGVsbShzZWxlY3RvcixcclxuXHRcdFx0XHRcdChjbGljazogTW91c2VFdmVudCkgPT4gdGhpcy5jbGljayhjbGljayksXHJcblx0XHRcdFx0XHQoY29udGV4dG1lbnU6IE1vdXNlRXZlbnQpID0+IHRoaXMuY29udGV4dG1lbnUoY29udGV4dG1lbnUpLFxyXG5cdFx0XHRcdCk7XHJcblx0XHRcdFx0dGhpcy5wYXJlbnQuY29udGFpbmVyLmFwcGVuZCh0aGlzLmJ1dHRvbik7XHJcblx0XHRcdFx0aWYgKHRoaXMubmFtZSkge1xyXG5cdFx0XHRcdFx0dGhpcy5idXR0b24uYXBwZW5kKHRoaXMubmFtZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0aGlzLmRlc2NyaXB0aW9uKSB7XHJcblx0XHRcdFx0XHR0aGlzLmJ1dHRvbi50aXRsZSA9IHRoaXMuZGVzY3JpcHRpb247XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgIT0gJ29mZicpIHtcclxuXHRcdFx0XHRcdHRoaXMudG9nZ2xlTW9kZShkYXRhLm1vZGUsIHRydWUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodGhpcy5oaWRkZW4pIHtcclxuXHRcdFx0XHRcdHRoaXMuaGlkZSgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2xpY2soZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvZmYnKSB7XHJcblx0XHRcdFx0XHR0aGlzLnRvZ2dsZU1vZGUoJ29uJyk7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChldmVudC50YXJnZXQgIT0gdGhpcy5idXR0b24pIHJldHVybjtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvbicpIHtcclxuXHRcdFx0XHRcdHRoaXMudG9nZ2xlTW9kZSh0aGlzLnRocmVlV2F5ID8gJ29wcG9zaXRlJyA6ICdvZmYnKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhpcy50b2dnbGVNb2RlKCdvZmYnKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y29udGV4dG1lbnUoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgIT0gJ29wcG9zaXRlJykge1xyXG5cdFx0XHRcdFx0dGhpcy50b2dnbGVNb2RlKCdvcHBvc2l0ZScpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR0aGlzLnRvZ2dsZU1vZGUoJ29mZicpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dG9nZ2xlTW9kZShtb2RlOiBNb2RlLCBmb3JjZSA9IGZhbHNlKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSBtb2RlICYmICFmb3JjZSkgcmV0dXJuO1xyXG5cdFx0XHRcdHRoaXMubW9kZSA9IG1vZGU7XHJcblx0XHRcdFx0dGhpcy5idXR0b24uc2V0QXR0cmlidXRlKCdlZi1tb2RlJywgbW9kZSk7XHJcblx0XHRcdFx0aWYgKG1vZGUgIT0gJ29mZicgJiYgdGhpcy5pbmNvbXBhdGlibGUpIHtcclxuXHRcdFx0XHRcdHRoaXMucGFyZW50Lm9mZkluY29tcGF0aWJsZSh0aGlzLmluY29tcGF0aWJsZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMucGFyZW50LnJlcXVlc3RVcGRhdGUoKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmVtb3ZlKCkge1xyXG5cdFx0XHRcdHRoaXMuYnV0dG9uLnJlbW92ZSgpO1xyXG5cdFx0XHRcdHRoaXMudG9nZ2xlTW9kZSgnb2ZmJyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHNob3coKSB7XHJcblx0XHRcdFx0dGhpcy5oaWRkZW4gPSBmYWxzZTtcclxuXHRcdFx0XHR0aGlzLmJ1dHRvbi5oaWRkZW4gPSBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRoaWRlKCkge1xyXG5cdFx0XHRcdHRoaXMuaGlkZGVuID0gdHJ1ZTtcclxuXHRcdFx0XHR0aGlzLmJ1dHRvbi5oaWRkZW4gPSB0cnVlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBGaWx0ZXI8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4ge1xyXG5cdFx0XHRmaWx0ZXI6IEZpbHRlckZuPERhdGE+O1xyXG5cclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogUGFydGlhbDxGaWx0ZXI8RGF0YT4+ID0ge30pIHtcclxuXHRcdFx0XHRzdXBlcignYnV0dG9uLmVmLWl0ZW0uZWYtZmlsdGVyW2VmLW1vZGU9XCJvZmZcIl0nLCBkYXRhKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0LyoqIHJldHVybnMgaWYgaXRlbSBzaG91bGQgYmUgdmlzaWJsZSAqL1xyXG5cdFx0XHRhcHBseShkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvZmYnKSByZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHRsZXQgdmFsdWUgPSB0aGlzLmZpbHRlcihkYXRhLCBlbCk7XHJcblx0XHRcdFx0bGV0IHJlc3VsdCA9IHR5cGVvZiB2YWx1ZSA9PSBcIm51bWJlclwiID8gdmFsdWUgPiAwIDogdmFsdWU7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb24nKSByZXR1cm4gcmVzdWx0O1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29wcG9zaXRlJykgcmV0dXJuICFyZXN1bHQ7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgY2xhc3MgRmlsdGVyV2l0aElucHV0PERhdGEsIFYgZXh0ZW5kcyBudW1iZXIgfCBzdHJpbmc+IGV4dGVuZHMgRmlsdGVyPERhdGE+IHtcclxuXHRcdFx0ZGVjbGFyZSBmaWx0ZXI6IEZpbHRlcldJRm48RGF0YSwgVj47XHJcblx0XHRcdGlucHV0OiBIVE1MSW5wdXRFbGVtZW50IHwgc3RyaW5nIHwgbnVtYmVyO1xyXG5cdFx0XHRjb25zdHJ1Y3RvcihkYXRhOiBQYXJ0aWFsPEZpbHRlcldpdGhJbnB1dDxEYXRhLCBWPj4pIHtcclxuXHRcdFx0XHRzdXBlcihkYXRhKTtcclxuXHRcdFx0XHRpZiAodHlwZW9mIHRoaXMuaW5wdXQgIT0gJ29iamVjdCcpIHtcclxuXHRcdFx0XHRcdGlmICh0eXBlb2YgdGhpcy5pbnB1dCA9PSAnbnVtYmVyJykge1xyXG5cdFx0XHRcdFx0XHR0aGlzLmlucHV0ID0gYGlucHV0W3R5cGU9bnVtYmVyXVt2YWx1ZT0ke3RoaXMuaW5wdXR9XWA7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpZiAoIXRoaXMuaW5wdXQuc3RhcnRzV2l0aCgnaW5wdXQnKSkge1xyXG5cdFx0XHRcdFx0XHRpZiAoIXRoaXMuaW5wdXQuc3RhcnRzV2l0aCgnWycpKSB0aGlzLmlucHV0ID0gYFt0eXBlPXRleHRdW3ZhbHVlPVwiJHt0aGlzLmlucHV0LnJlcGxhY2VBbGwoJ1wiJywgJ1xcXFxcIicpfVwiXWA7XHJcblx0XHRcdFx0XHRcdGlmICghdGhpcy5pbnB1dC5zdGFydHNXaXRoKCdpbnB1dCcpKSB0aGlzLmlucHV0ID0gYGlucHV0JHt0aGlzLmlucHV0fWA7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR0aGlzLmlucHV0ID0gZWxtPEhUTUxJbnB1dEVsZW1lbnQ+KHRoaXMuaW5wdXQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLmlucHV0Lm9uY2hhbmdlID0gdGhpcy5pbnB1dC5vbmtleXVwID0gdGhpcy5pbnB1dC5vbmtleWRvd24gPSB0aGlzLmlucHV0Lm9ua2V5cHJlc3MgPSAoKSA9PiB0aGlzLnBhcmVudC5yZXF1ZXN0VXBkYXRlKCk7XHJcblx0XHRcdFx0dGhpcy5idXR0b24uYXBwZW5kKHRoaXMuaW5wdXQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGNvbnZlcnQ6IChlOiBIVE1MSW5wdXRFbGVtZW50KSA9PiBWXHJcblx0XHRcdFx0PSAoZTogSFRNTElucHV0RWxlbWVudCkgPT4gZS50eXBlID09ICdudW1iZXInID8gK2UudmFsdWUgYXMgViA6IGUudmFsdWUgYXMgVjtcclxuXHJcblx0XHRcdC8qKiByZXR1cm5zIGlmIGl0ZW0gc2hvdWxkIGJlIHZpc2libGUgKi9cclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb2ZmJykgcmV0dXJuIHRydWU7XHJcblx0XHRcdFx0bGV0IGlucHV0VmFsdWUgPSB0aGlzLmNvbnZlcnQodGhpcy5pbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KTtcclxuXHRcdFx0XHRsZXQgdmFsdWUgPSB0aGlzLmZpbHRlcihkYXRhLCBlbCwgaW5wdXRWYWx1ZSk7XHJcblx0XHRcdFx0bGV0IHJlc3VsdCA9IHR5cGVvZiB2YWx1ZSA9PSBcIm51bWJlclwiID8gdmFsdWUgPiAwIDogdmFsdWU7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb24nKSByZXR1cm4gcmVzdWx0O1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29wcG9zaXRlJykgcmV0dXJuICFyZXN1bHQ7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgY2xhc3MgU29ydGVyPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtPERhdGE+IHtcclxuXHRcdFx0c29ydGVyOiBTb3J0ZXJGbjxEYXRhPjtcclxuXHJcblx0XHRcdGNvbnN0cnVjdG9yKGRhdGE6IFBhcnRpYWw8U29ydGVyPERhdGE+Pikge1xyXG5cdFx0XHRcdHN1cGVyKCdidXR0b24uZWYtaXRlbS5lZi1zb3J0ZXJbZWYtbW9kZT1cIm9mZlwiXScsIGRhdGEpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0b2dnbGVNb2RlKG1vZGU6IE1vZGUsIGZvcmNlID0gZmFsc2UpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09IG1vZGUgJiYgIWZvcmNlKSByZXR1cm47XHJcblx0XHRcdFx0dGhpcy5wYXJlbnQubW92ZVRvVG9wKHRoaXMpO1xyXG5cdFx0XHRcdHN1cGVyLnRvZ2dsZU1vZGUobW9kZSwgZm9yY2UpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvKiogcmV0dXJucyBvcmRlciBvZiBlbnRyeSAqL1xyXG5cdFx0XHRhcHBseShkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpOiBudW1iZXIge1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29uJykge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuc29ydGVyKGRhdGEsIGVsKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb2ZmJykge1xyXG5cdFx0XHRcdFx0cmV0dXJuIC10aGlzLnNvcnRlcihkYXRhLCBlbCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiAwO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGNsYXNzIE1vZGlmaWVyPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtPERhdGE+IHtcclxuXHRcdFx0bW9kaWZpZXI6IE1vZGlmaWVyRm48RGF0YT47XHJcblx0XHRcdHJ1bk9uTm9DaGFuZ2UgPSBmYWxzZTtcclxuXHJcblx0XHRcdGNvbnN0cnVjdG9yKGRhdGE6IFBhcnRpYWw8TW9kaWZpZXI8RGF0YT4+KSB7XHJcblx0XHRcdFx0c3VwZXIoJ2J1dHRvbi5lZi1pdGVtLmVmLW1vZGlmaWVyW2VmLW1vZGU9XCJvZmZcIl0nLCBkYXRhKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dG9nZ2xlTW9kZShtb2RlOiBNb2RlLCBmb3JjZSA9IGZhbHNlKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSBtb2RlICYmICFmb3JjZSkgcmV0dXJuO1xyXG5cdFx0XHRcdHRoaXMucGFyZW50Lm1vdmVUb1RvcCh0aGlzKTtcclxuXHRcdFx0XHRzdXBlci50b2dnbGVNb2RlKG1vZGUsIGZvcmNlKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KSB7XHJcblx0XHRcdFx0Ly8gbGV0IG9sZE1vZGU6IE1vZGUgfCBudWxsID0gZWwuZ2V0QXR0cmlidXRlKGBlZi1tb2RpZmllci0ke3RoaXMuaWR9LW1vZGVgKSBhcyAoTW9kZSB8IG51bGwpO1xyXG5cdFx0XHRcdC8vIGlmIChvbGRNb2RlID09IHRoaXMubW9kZSAmJiAhdGhpcy5ydW5Pbk5vQ2hhbmdlKSByZXR1cm47XHJcblx0XHRcdFx0dGhpcy5tb2RpZmllcihkYXRhLCBlbCwgdGhpcy5tb2RlLCBudWxsKTtcclxuXHRcdFx0XHQvLyBlbC5zZXRBdHRyaWJ1dGUoYGVmLW1vZGlmaWVyLSR7dGhpcy5pZH0tbW9kZWAsIHRoaXMubW9kZSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgY2xhc3MgRW50cnlGaWx0ZXJlcjxEYXRhIGV4dGVuZHMge30gPSB7fT4ge1xyXG5cdFx0XHRvbiA9IHRydWU7XHJcblx0XHRcdGNvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcblx0XHRcdGVudHJ5U2VsZWN0b3I6IHN0cmluZyB8ICgoKSA9PiBIVE1MRWxlbWVudFtdKTtcclxuXHRcdFx0Y29uc3RydWN0b3IoZW50cnlTZWxlY3Rvcjogc3RyaW5nIHwgKCgpID0+IEhUTUxFbGVtZW50W10pLCBlbmFibGVkID0gdHJ1ZSkge1xyXG5cdFx0XHRcdHRoaXMuZW50cnlTZWxlY3RvciA9IGVudHJ5U2VsZWN0b3I7XHJcblx0XHRcdFx0dGhpcy5jb250YWluZXIgPSBlbG0oJy5lZi1jb250YWluZXInKTtcclxuXHRcdFx0XHRpZiAoIWVudHJ5U2VsZWN0b3IpIHtcclxuXHRcdFx0XHRcdC8vIGRpc2FibGUgaWYgbm8gc2VsZWN0b3IgcHJvdmlkZWQgKGxpa2VseSBpcyBhIGdlbmVyaWMgZWYpXHJcblx0XHRcdFx0XHR0aGlzLmRpc2FibGUoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKCFlbmFibGVkKSB7XHJcblx0XHRcdFx0XHR0aGlzLmRpc2FibGUoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGVuYWJsZWQpIHtcclxuXHRcdFx0XHRcdHRoaXMuc3R5bGUoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy51cGRhdGUoKTtcclxuXHRcdFx0XHRwYWdpbmF0ZS5vbmNoYW5nZSgoKSA9PiB0aGlzLnJlcXVlc3RVcGRhdGUoKSk7XHJcblx0XHRcdFx0ZXRjLm9uaGVpZ2h0Y2hhbmdlKCgpID0+IHRoaXMucmVxdWVzdFVwZGF0ZSgpKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZW50cmllczogSFRNTEVsZW1lbnRbXSA9IFtdO1xyXG5cdFx0XHRlbnRyeURhdGFzOiBNYXA8SFRNTEVsZW1lbnQsIERhdGE+ID0gbmV3IE1hcCgpO1xyXG5cdFx0XHRnZXREYXRhKGVsOiBIVE1MRWxlbWVudCkge1xyXG5cdFx0XHRcdGxldCBkYXRhID0gdGhpcy5lbnRyeURhdGFzLmdldChlbCk7XHJcblx0XHRcdFx0aWYgKCFkYXRhKSB7XHJcblx0XHRcdFx0XHRkYXRhID0gdGhpcy5wYXJzZUVudHJ5KGVsKTtcclxuXHRcdFx0XHRcdHRoaXMuZW50cnlEYXRhcy5zZXQoZWwsIGRhdGEpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gZGF0YTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dXBkYXRlUGVuZGluZyA9IGZhbHNlO1xyXG5cdFx0XHRyZXBhcnNlUGVuZGluZyA9IGZhbHNlO1xyXG5cdFx0XHRyZXF1ZXN0VXBkYXRlKHJlcGFyc2UgPSBmYWxzZSkge1xyXG5cdFx0XHRcdGlmICh0aGlzLnVwZGF0ZVBlbmRpbmcpIHJldHVybjtcclxuXHRcdFx0XHR0aGlzLnVwZGF0ZVBlbmRpbmcgPSB0cnVlO1xyXG5cdFx0XHRcdGlmIChyZXBhcnNlKSB0aGlzLnJlcGFyc2VQZW5kaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHRzZXRUaW1lb3V0KCgpID0+IHRoaXMudXBkYXRlKCkpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRhZGRJdGVtPFQgZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4+KGlkOiBzdHJpbmcsIGRhdGE6IFBhcnRpYWw8VD4sIGxpc3Q6IFRbXSwgY29uc3RydWN0b3I6IChpdGVtOiBQYXJ0aWFsPFQ+KSA9PiBUKSB7XHJcblx0XHRcdFx0ZGF0YS5wYXJlbnQgPSB0aGlzO1xyXG5cdFx0XHRcdGRhdGEuaWQgPSBpZDtcclxuXHRcdFx0XHRkYXRhLm5hbWUgPz89IGlkO1xyXG5cdFx0XHRcdGxldCBpdGVtID0gY29uc3RydWN0b3IoZGF0YSk7XHJcblx0XHRcdFx0bGlzdC5wdXNoKGl0ZW0pO1xyXG5cdFx0XHRcdHJldHVybiBpdGVtO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRwYXJzZXJzOiBQYXJzZXJGbjxEYXRhPltdID0gW107XHJcblx0XHRcdHdyaXRlRGF0YUF0dHJpYnV0ZSA9IGZhbHNlO1xyXG5cdFx0XHRhZGRQYXJzZXIocGFyc2VyOiBQYXJzZXJGbjxEYXRhPikge1xyXG5cdFx0XHRcdHRoaXMucGFyc2Vycy5wdXNoKHBhcnNlcik7XHJcblx0XHRcdFx0dGhpcy5yZXF1ZXN0VXBkYXRlKHRydWUpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHBhcnNlRW50cnkoZWw6IEhUTUxFbGVtZW50KTogRGF0YSB7XHJcblx0XHRcdFx0bGV0IGRhdGE6IERhdGEgPSB7fSBhcyBEYXRhO1xyXG5cdFx0XHRcdGZvciAobGV0IHBhcnNlciBvZiB0aGlzLnBhcnNlcnMpIHtcclxuXHRcdFx0XHRcdGxldCBuZXdEYXRhID0gcGFyc2VyKGVsLCBkYXRhKTtcclxuXHRcdFx0XHRcdGlmICghbmV3RGF0YSB8fCBuZXdEYXRhID09IGRhdGEpIGNvbnRpbnVlO1xyXG5cdFx0XHRcdFx0aWYgKCFJc1Byb21pc2UobmV3RGF0YSkpIHtcclxuXHRcdFx0XHRcdFx0T2JqZWN0LmFzc2lnbihkYXRhLCBuZXdEYXRhKTtcclxuXHRcdFx0XHRcdFx0Y29udGludWU7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRuZXdEYXRhLnRoZW4ocE5ld0RhdGEgPT4ge1xyXG5cdFx0XHRcdFx0XHRpZiAocE5ld0RhdGEgJiYgcE5ld0RhdGEgIT0gZGF0YSkge1xyXG5cdFx0XHRcdFx0XHRcdE9iamVjdC5hc3NpZ24oZGF0YSwgcE5ld0RhdGEpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdHRoaXMucmVxdWVzdFVwZGF0ZSgpO1xyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMud3JpdGVEYXRhQXR0cmlidXRlKSB7XHJcblx0XHRcdFx0XHRlbC5zZXRBdHRyaWJ1dGUoJ2VmLWRhdGEnLCBKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBkYXRhO1xyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0ZmlsdGVyczogRmlsdGVyPERhdGE+W10gPSBbXTtcclxuXHRcdFx0YWRkRmlsdGVyKGlkOiBzdHJpbmcsIGZpbHRlcjogRmlsdGVyRm48RGF0YT4sIGRhdGE6IFBhcnRpYWw8RmlsdGVyPERhdGE+PiA9IHt9KSB7XHJcblx0XHRcdFx0ZGF0YS5maWx0ZXIgPz89IGZpbHRlcjtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hZGRJdGVtKGlkLCBkYXRhLCB0aGlzLmZpbHRlcnMsIGRhdGEgPT4gbmV3IEZpbHRlcihkYXRhKSk7XHJcblx0XHRcdH1cclxuXHRcdFx0YWRkRmlsdGVyV2l0aElucHV0PFYgZXh0ZW5kcyBzdHJpbmcgfCBudW1iZXI+KGlkOiBzdHJpbmcsIGZpbHRlcjogRmlsdGVyV0lGbjxEYXRhLCBWPiwgZGF0YTogUGFydGlhbDxGaWx0ZXJXaXRoSW5wdXQ8RGF0YSwgVj4+ICYgeyBpbnB1dD86IFYgfSA9IHt9KSB7XHJcblx0XHRcdFx0ZGF0YS5maWx0ZXIgPz89IGZpbHRlcjtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hZGRJdGVtKGlkLCBkYXRhLCB0aGlzLmZpbHRlcnMsIGRhdGEgPT4gbmV3IEZpbHRlcldpdGhJbnB1dChkYXRhKSk7XHJcblx0XHRcdH1cclxuXHRcdFx0c29ydGVyczogU29ydGVyPERhdGE+W10gPSBbXTtcclxuXHRcdFx0YWRkU29ydGVyKGlkOiBzdHJpbmcsIHNvcnRlcjogU29ydGVyRm48RGF0YT4sIGRhdGE6IFBhcnRpYWw8U29ydGVyPERhdGE+PiA9IHt9KSB7XHJcblx0XHRcdFx0ZGF0YS5zb3J0ZXIgPSBzb3J0ZXI7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuYWRkSXRlbShpZCwgZGF0YSwgdGhpcy5zb3J0ZXJzLCBkYXRhID0+IG5ldyBTb3J0ZXIoZGF0YSkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdG1vZGlmaWVyczogTW9kaWZpZXI8RGF0YT5bXSA9IFtdO1xyXG5cdFx0XHRhZGRNb2RpZmllcihpZDogc3RyaW5nLCBtb2RpZmllcjogTW9kaWZpZXJGbjxEYXRhPiwgZGF0YTogUGFydGlhbDxNb2RpZmllcjxEYXRhPj4gPSB7fSkge1xyXG5cdFx0XHRcdGRhdGEubW9kaWZpZXIgPSBtb2RpZmllcjtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hZGRJdGVtKGlkLCBkYXRhLCB0aGlzLm1vZGlmaWVycywgZGF0YSA9PiBuZXcgTW9kaWZpZXIoZGF0YSkpO1xyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0ZmlsdGVyRW50cmllcygpIHtcclxuXHRcdFx0XHRmb3IgKGxldCBlbCBvZiB0aGlzLmVudHJpZXMpIHtcclxuXHRcdFx0XHRcdGxldCBkYXRhID0gdGhpcy5nZXREYXRhKGVsKTtcclxuXHRcdFx0XHRcdGxldCB2YWx1ZSA9IHRydWU7XHJcblx0XHRcdFx0XHRmb3IgKGxldCBmaWx0ZXIgb2YgdGhpcy5maWx0ZXJzKSB7XHJcblx0XHRcdFx0XHRcdHZhbHVlID0gdmFsdWUgJiYgZmlsdGVyLmFwcGx5KGRhdGEsIGVsKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsLmNsYXNzTGlzdC50b2dnbGUoJ2VmLWZpbHRlcmVkLW91dCcsICF2YWx1ZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRzb3J0RW50cmllcygpIHtcclxuXHRcdFx0XHRsZXQgZW50cmllcyA9IHRoaXMuZW50cmllcztcclxuXHRcdFx0XHRsZXQgcGFpcnM6IFtIVE1MRWxlbWVudCwgRGF0YV1bXSA9IGVudHJpZXMubWFwKGUgPT4gW2UsIHRoaXMuZ2V0RGF0YShlKV0pO1xyXG5cdFx0XHRcdGZvciAobGV0IHNvcnRlciBvZiB0aGlzLnNvcnRlcnMpIHtcclxuXHRcdFx0XHRcdGlmIChzb3J0ZXIubW9kZSAhPSAnb2ZmJykge1xyXG5cdFx0XHRcdFx0XHRwYWlycyA9IHBhaXJzLnZzb3J0KChbZSwgZGF0YV0pID0+IHNvcnRlci5hcHBseShkYXRhLCBlKSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVudHJpZXMgPSBwYWlycy5tYXAoZSA9PiBlWzBdKTtcclxuXHRcdFx0XHRpZiAoZW50cmllcy5ldmVyeSgoZSwgaSkgPT4gZSA9PSB0aGlzLmVudHJpZXNbaV0pKSB7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGxldCBiciA9IGVsbSgnYnIuZWYtYmVmb3JlLXNvcnRbaGlkZGVuXScpO1xyXG5cdFx0XHRcdHRoaXMuZW50cmllc1swXS5iZWZvcmUoYnIpO1xyXG5cdFx0XHRcdGJyLmFmdGVyKC4uLmVudHJpZXMpO1xyXG5cdFx0XHRcdGJyLnJlbW92ZSgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRtb2RpZnlFbnRyaWVzKCkge1xyXG5cdFx0XHRcdGxldCBlbnRyaWVzID0gdGhpcy5lbnRyaWVzO1xyXG5cdFx0XHRcdGxldCBwYWlyczogW0hUTUxFbGVtZW50LCBEYXRhXVtdID0gZW50cmllcy5tYXAoZSA9PiBbZSwgdGhpcy5nZXREYXRhKGUpXSk7XHJcblx0XHRcdFx0Zm9yIChsZXQgbW9kaWZpZXIgb2YgdGhpcy5tb2RpZmllcnMpIHtcclxuXHRcdFx0XHRcdGZvciAobGV0IFtlLCBkXSBvZiBwYWlycykge1xyXG5cdFx0XHRcdFx0XHRtb2RpZmllci5hcHBseShkLCBlKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHRtb3ZlVG9Ub3AoaXRlbTogU29ydGVyPERhdGE+IHwgTW9kaWZpZXI8RGF0YT4pIHtcclxuXHRcdFx0XHRpZiAoaXRlbSBpbnN0YW5jZW9mIFNvcnRlcikge1xyXG5cdFx0XHRcdFx0dGhpcy5zb3J0ZXJzLnNwbGljZSh0aGlzLnNvcnRlcnMuaW5kZXhPZihpdGVtKSwgMSk7XHJcblx0XHRcdFx0XHR0aGlzLnNvcnRlcnMucHVzaChpdGVtKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGl0ZW0gaW5zdGFuY2VvZiBNb2RpZmllcikge1xyXG5cdFx0XHRcdFx0dGhpcy5tb2RpZmllcnMuc3BsaWNlKHRoaXMubW9kaWZpZXJzLmluZGV4T2YoaXRlbSksIDEpO1xyXG5cdFx0XHRcdFx0dGhpcy5tb2RpZmllcnMucHVzaChpdGVtKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHVwZGF0ZShyZXBhcnNlID0gdGhpcy5yZXBhcnNlUGVuZGluZykge1xyXG5cdFx0XHRcdHRoaXMudXBkYXRlUGVuZGluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdGlmICh0aGlzLmRpc2FibGVkKSByZXR1cm47XHJcblx0XHRcdFx0aWYgKHJlcGFyc2UpIHtcclxuXHRcdFx0XHRcdHRoaXMuZW50cnlEYXRhcyA9IG5ldyBNYXAoKTtcclxuXHRcdFx0XHRcdHRoaXMucmVwYXJzZVBlbmRpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKCF0aGlzLmNvbnRhaW5lci5jbG9zZXN0KCdib2R5JykpIHtcclxuXHRcdFx0XHRcdHRoaXMuY29udGFpbmVyLmFwcGVuZFRvKCdib2R5Jyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMuZW50cmllcyA9IHR5cGVvZiB0aGlzLmVudHJ5U2VsZWN0b3IgPT0gJ2Z1bmN0aW9uJyA/IHRoaXMuZW50cnlTZWxlY3RvcigpIDogcXEodGhpcy5lbnRyeVNlbGVjdG9yKTtcclxuXHRcdFx0XHR0aGlzLmZpbHRlckVudHJpZXMoKTtcclxuXHRcdFx0XHR0aGlzLnNvcnRFbnRyaWVzKCk7XHJcblx0XHRcdFx0dGhpcy5tb2RpZnlFbnRyaWVzKCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdG9mZkluY29tcGF0aWJsZShpbmNvbXBhdGlibGU6IHN0cmluZ1tdKSB7XHJcblx0XHRcdFx0Zm9yIChsZXQgZmlsdGVyIG9mIHRoaXMuZmlsdGVycykge1xyXG5cdFx0XHRcdFx0aWYgKGluY29tcGF0aWJsZS5pbmNsdWRlcyhmaWx0ZXIuaWQpKSB7XHJcblx0XHRcdFx0XHRcdGZpbHRlci50b2dnbGVNb2RlKCdvZmYnKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Zm9yIChsZXQgc29ydGVyIG9mIHRoaXMuc29ydGVycykge1xyXG5cdFx0XHRcdFx0aWYgKGluY29tcGF0aWJsZS5pbmNsdWRlcyhzb3J0ZXIuaWQpKSB7XHJcblx0XHRcdFx0XHRcdHNvcnRlci50b2dnbGVNb2RlKCdvZmYnKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Zm9yIChsZXQgbW9kaWZpZXIgb2YgdGhpcy5tb2RpZmllcnMpIHtcclxuXHRcdFx0XHRcdGlmIChpbmNvbXBhdGlibGUuaW5jbHVkZXMobW9kaWZpZXIuaWQpKSB7XHJcblx0XHRcdFx0XHRcdG1vZGlmaWVyLnRvZ2dsZU1vZGUoJ29mZicpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0c3R5bGUocyA9ICcnKSB7XHJcblx0XHRcdFx0RW50cnlGaWx0ZXJlci5zdHlsZShzKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdFx0fVxyXG5cdFx0XHRzdGF0aWMgc3R5bGUocyA9ICcnKSB7XHJcblx0XHRcdFx0bGV0IHN0eWxlID0gcSgnc3R5bGUuZWYtc3R5bGUnKSB8fCBlbG0oJ3N0eWxlLmVmLXN0eWxlJykuYXBwZW5kVG8oJ2hlYWQnKTtcclxuXHRcdFx0XHRzdHlsZS5pbm5lckhUTUwgPSBgXHJcblx0XHRcdFx0XHQuZWYtY29udGFpbmVyIHtcclxuXHRcdFx0XHRcdFx0ZGlzcGxheTogZmxleDtcclxuXHRcdFx0XHRcdFx0ZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcclxuXHRcdFx0XHRcdFx0cG9zaXRpb246IGZpeGVkO1xyXG5cdFx0XHRcdFx0XHR0b3A6IDA7XHJcblx0XHRcdFx0XHRcdHJpZ2h0OiAwO1xyXG5cdFx0XHRcdFx0XHR6LWluZGV4OiA5OTk5OTk5OTk5OTk5OTk5OTk5O1xyXG5cdFx0XHRcdFx0XHRtaW4td2lkdGg6IDEwMHB4O1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0LmVmLWVudHJ5IHt9XHJcblxyXG5cdFx0XHRcdFx0LmVmLWZpbHRlcmVkLW91dCB7XHJcblx0XHRcdFx0XHRcdGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRidXR0b24uZWYtaXRlbSB7fVxyXG5cdFx0XHRcdFx0YnV0dG9uLmVmLWl0ZW1bZWYtbW9kZT1cIm9mZlwiXSB7XHJcblx0XHRcdFx0XHRcdGJhY2tncm91bmQ6IGxpZ2h0Z3JheTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGJ1dHRvbi5lZi1pdGVtW2VmLW1vZGU9XCJvblwiXSB7XHJcblx0XHRcdFx0XHRcdGJhY2tncm91bmQ6IGxpZ2h0Z3JlZW47XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRidXR0b24uZWYtaXRlbVtlZi1tb2RlPVwib3Bwb3NpdGVcIl0ge1xyXG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kOiB5ZWxsb3c7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0W2VmLXByZWZpeF06OmJlZm9yZSB7XHJcblx0XHRcdFx0XHRcdGNvbnRlbnQ6IGF0dHIoZWYtcHJlZml4KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdGAgKyBzO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRkaXNhYmxlZCA9IGZhbHNlO1xyXG5cdFx0XHRkaXNhYmxlKCkge1xyXG5cdFx0XHRcdHRoaXMuZGlzYWJsZWQgPSB0cnVlO1xyXG5cdFx0XHRcdHRoaXMuY29udGFpbmVyLnJlbW92ZSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVuYWJsZSgpIHtcclxuXHRcdFx0XHR0aGlzLmRpc2FibGVkID0gZmFsc2U7XHJcblx0XHRcdFx0dGhpcy51cGRhdGVQZW5kaW5nID0gZmFsc2U7XHJcblx0XHRcdFx0dGhpcy5yZXF1ZXN0VXBkYXRlKCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNsZWFyKCkge1xyXG5cdFx0XHRcdHRoaXMuZW50cnlEYXRhcyA9IG5ldyBNYXAoKTtcclxuXHRcdFx0XHR0aGlzLnBhcnNlcnMuc3BsaWNlKDAsIDk5OSk7XHJcblx0XHRcdFx0dGhpcy5maWx0ZXJzLnNwbGljZSgwLCA5OTkpLm1hcChlID0+IGUucmVtb3ZlKCkpO1xyXG5cdFx0XHRcdHRoaXMuc29ydGVycy5zcGxpY2UoMCwgOTk5KS5tYXAoZSA9PiBlLnJlbW92ZSgpKTtcclxuXHRcdFx0XHR0aGlzLmVuYWJsZSgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRnZXQgX2RhdGFzKCkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmVudHJpZXMubWFwKGUgPT4gdGhpcy5nZXREYXRhKGUpKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBJc1Byb21pc2U8VD4ocDogUHJvbWlzZUxpa2U8VD4gfCBUKTogcCBpcyBQcm9taXNlTGlrZTxUPiB7XHJcblx0XHRcdGlmICghcCkgcmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRyZXR1cm4gdHlwZW9mIChwIGFzIFByb21pc2VMaWtlPFQ+KS50aGVuID09ICdmdW5jdGlvbic7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRleHBvcnQgbGV0IEVudHJ5RmlsdGVyZXIgPSBFbnRyeUZpbHRlcmVyRXh0ZW5zaW9uLkVudHJ5RmlsdGVyZXI7XHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFbnRyeUZpbHRlcmVyRXh0ZW5zaW9uMiB7XHJcblx0XHRleHBvcnQgdHlwZSBXYXluZXNzID0gZmFsc2UgfCB0cnVlIHwgJ2Rpcic7XHJcblx0XHRleHBvcnQgdHlwZSBNb2RlID0gJ29mZicgfCAnb24nIHwgJ29wcG9zaXRlJztcclxuXHJcblx0XHRleHBvcnQgdHlwZSBQYXJzZXJGbjxEYXRhPiA9IChlbDogSFRNTEVsZW1lbnQsIGRhdGE6IFBhcnRpYWw8RGF0YT4pID0+IFBhcnRpYWw8RGF0YT4gfCBQcm9taXNlTGlrZTxQYXJ0aWFsPERhdGE+PiB8IHZvaWQ7XHJcblx0XHRleHBvcnQgdHlwZSBGaWx0ZXJGbjxEYXRhPiA9IChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpID0+IGJvb2xlYW47XHJcblx0XHRleHBvcnQgdHlwZSBTb3J0ZXJGbjxEYXRhPiA9IChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpID0+IG51bWJlcjtcclxuXHRcdGV4cG9ydCB0eXBlIE1vZGlmaWVyRm48RGF0YT4gPSAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50LCBtb2RlOiBNb2RlLCBvbGRNb2RlOiBNb2RlIHwgbnVsbCkgPT4gdm9pZDtcclxuXHJcblx0XHRleHBvcnQgY2xhc3MgRmlsdGVyZXJJdGVtPERhdGE+IHtcclxuXHRcdFx0aWQ6IHN0cmluZyA9IFwiXCI7XHJcblx0XHRcdG5hbWU/OiBzdHJpbmc7XHJcblx0XHRcdGRlc2NyaXB0aW9uPzogc3RyaW5nO1xyXG5cdFx0XHR0aHJlZVdheTogV2F5bmVzcyA9IGZhbHNlO1xyXG5cdFx0XHRtb2RlOiBNb2RlID0gJ29mZic7XHJcblx0XHRcdHBhcmVudDogRW50cnlGaWx0ZXJlcjtcclxuXHRcdFx0YnV0dG9uOiBIVE1MQnV0dG9uRWxlbWVudDtcclxuXHRcdFx0aW5jb21wYXRpYmxlPzogc3RyaW5nW107XHJcblx0XHRcdGhpZGRlbiA9IGZhbHNlO1xyXG5cclxuXHRcdFx0Y29uc3RydWN0b3Ioc2VsZWN0b3I6IHN0cmluZywgZGF0YTogUGFydGlhbDxGaWx0ZXJlckl0ZW08RGF0YT4+KSB7XHJcblx0XHRcdFx0T2JqZWN0LmFzc2lnbih0aGlzLCBkYXRhKTtcclxuXHJcblx0XHRcdFx0dGhpcy5idXR0b24gPSBlbG0oc2VsZWN0b3IsXHJcblx0XHRcdFx0XHQoY2xpY2s6IE1vdXNlRXZlbnQpID0+IHRoaXMuY2xpY2soY2xpY2spLFxyXG5cdFx0XHRcdFx0KGNvbnRleHRtZW51OiBNb3VzZUV2ZW50KSA9PiB0aGlzLmNvbnRleHRtZW51KGNvbnRleHRtZW51KSxcclxuXHRcdFx0XHQpO1xyXG5cdFx0XHRcdHRoaXMucGFyZW50LmNvbnRhaW5lci5hcHBlbmQodGhpcy5idXR0b24pO1xyXG5cdFx0XHRcdGlmICh0aGlzLm5hbWUpIHtcclxuXHRcdFx0XHRcdHRoaXMuYnV0dG9uLmFwcGVuZCh0aGlzLm5hbWUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodGhpcy5kZXNjcmlwdGlvbikge1xyXG5cdFx0XHRcdFx0dGhpcy5idXR0b24udGl0bGUgPSB0aGlzLmRlc2NyaXB0aW9uO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlICE9ICdvZmYnKSB7XHJcblx0XHRcdFx0XHR0aGlzLnRvZ2dsZU1vZGUoZGF0YS5tb2RlLCB0cnVlKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMuaGlkZGVuKSB7XHJcblx0XHRcdFx0XHR0aGlzLmhpZGUoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNsaWNrKGV2ZW50OiBNb3VzZUV2ZW50KSB7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb2ZmJykge1xyXG5cdFx0XHRcdFx0dGhpcy50b2dnbGVNb2RlKCdvbicpO1xyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoZXZlbnQudGFyZ2V0ICE9IHRoaXMuYnV0dG9uKSByZXR1cm47XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb24nKSB7XHJcblx0XHRcdFx0XHR0aGlzLnRvZ2dsZU1vZGUodGhpcy50aHJlZVdheSA/ICdvcHBvc2l0ZScgOiAnb2ZmJyk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHRoaXMudG9nZ2xlTW9kZSgnb2ZmJylcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNvbnRleHRtZW51KGV2ZW50OiBNb3VzZUV2ZW50KSB7XHJcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlICE9ICdvcHBvc2l0ZScpIHtcclxuXHRcdFx0XHRcdHRoaXMudG9nZ2xlTW9kZSgnb3Bwb3NpdGUnKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhpcy50b2dnbGVNb2RlKCdvZmYnKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRvZ2dsZU1vZGUobW9kZTogTW9kZSwgZm9yY2UgPSBmYWxzZSkge1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gbW9kZSAmJiAhZm9yY2UpIHJldHVybjtcclxuXHRcdFx0XHR0aGlzLm1vZGUgPSBtb2RlO1xyXG5cdFx0XHRcdHRoaXMuYnV0dG9uLnNldEF0dHJpYnV0ZSgnZWYtbW9kZScsIG1vZGUpO1xyXG5cdFx0XHRcdGlmIChtb2RlICE9ICdvZmYnICYmIHRoaXMuaW5jb21wYXRpYmxlKSB7XHJcblx0XHRcdFx0XHR0aGlzLnBhcmVudC5vZmZJbmNvbXBhdGlibGUodGhpcy5pbmNvbXBhdGlibGUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLnBhcmVudC5yZXF1ZXN0VXBkYXRlKCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJlbW92ZSgpIHtcclxuXHRcdFx0XHR0aGlzLmJ1dHRvbi5yZW1vdmUoKTtcclxuXHRcdFx0XHR0aGlzLnRvZ2dsZU1vZGUoJ29mZicpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRzaG93KCkge1xyXG5cdFx0XHRcdHRoaXMuaGlkZGVuID0gZmFsc2U7XHJcblx0XHRcdFx0dGhpcy5idXR0b24uaGlkZGVuID0gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdFx0aGlkZSgpIHtcclxuXHRcdFx0XHR0aGlzLmhpZGRlbiA9IHRydWU7XHJcblx0XHRcdFx0dGhpcy5idXR0b24uaGlkZGVuID0gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgY2xhc3MgRmlsdGVyPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtPERhdGE+IHtcclxuXHRcdFx0ZmlsdGVyOiBGaWx0ZXJGbjxEYXRhPjtcclxuXHJcblx0XHRcdGNvbnN0cnVjdG9yKGRhdGE6IFBhcnRpYWw8RmlsdGVyPERhdGE+PiA9IHt9KSB7XHJcblx0XHRcdFx0c3VwZXIoJ2J1dHRvbi5lZi1pdGVtLmVmLWZpbHRlcltlZi1tb2RlPVwib2ZmXCJdJywgZGF0YSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKiByZXR1cm5zIGlmIGl0ZW0gc2hvdWxkIGJlIHZpc2libGUgKi9cclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb2ZmJykgcmV0dXJuIHRydWU7XHJcblx0XHRcdFx0bGV0IHZhbHVlID0gdGhpcy5maWx0ZXIoZGF0YSwgZWwpO1xyXG5cdFx0XHRcdGxldCByZXN1bHQgPSB0eXBlb2YgdmFsdWUgPT0gXCJudW1iZXJcIiA/IHZhbHVlID4gMCA6IHZhbHVlO1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29uJykgcmV0dXJuIHJlc3VsdDtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvcHBvc2l0ZScpIHJldHVybiAhcmVzdWx0O1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gZXhwb3J0IGNsYXNzIEZpbHRlcldpdGhJbnB1dDxEYXRhLCBWIGV4dGVuZHMgbnVtYmVyIHwgc3RyaW5nPiBleHRlbmRzIEZpbHRlcjxEYXRhPiB7XHJcblx0XHQvLyBcdGRlY2xhcmUgZmlsdGVyOiBGaWx0ZXJXSUZuPERhdGEsIFY+O1xyXG5cdFx0Ly8gXHRpbnB1dDogSFRNTElucHV0RWxlbWVudCB8IHN0cmluZyB8IG51bWJlcjtcclxuXHRcdC8vIFx0Y29uc3RydWN0b3IoZGF0YTogUGFydGlhbDxGaWx0ZXJXaXRoSW5wdXQ8RGF0YSwgVj4+KSB7XHJcblx0XHQvLyBcdFx0c3VwZXIoZGF0YSk7XHJcblx0XHQvLyBcdFx0aWYgKHR5cGVvZiB0aGlzLmlucHV0ICE9ICdvYmplY3QnKSB7XHJcblx0XHQvLyBcdFx0XHRpZiAodHlwZW9mIHRoaXMuaW5wdXQgPT0gJ251bWJlcicpIHtcclxuXHRcdC8vIFx0XHRcdFx0dGhpcy5pbnB1dCA9IGBpbnB1dFt0eXBlPW51bWJlcl1bdmFsdWU9JHt0aGlzLmlucHV0fV1gO1xyXG5cdFx0Ly8gXHRcdFx0fVxyXG5cdFx0Ly8gXHRcdFx0aWYgKCF0aGlzLmlucHV0LnN0YXJ0c1dpdGgoJ2lucHV0JykpIHtcclxuXHRcdC8vIFx0XHRcdFx0aWYgKCF0aGlzLmlucHV0LnN0YXJ0c1dpdGgoJ1snKSkgdGhpcy5pbnB1dCA9IGBbdHlwZT10ZXh0XVt2YWx1ZT1cIiR7dGhpcy5pbnB1dC5yZXBsYWNlQWxsKCdcIicsICdcXFxcXCInKX1cIl1gO1xyXG5cdFx0Ly8gXHRcdFx0XHRpZiAoIXRoaXMuaW5wdXQuc3RhcnRzV2l0aCgnaW5wdXQnKSkgdGhpcy5pbnB1dCA9IGBpbnB1dCR7dGhpcy5pbnB1dH1gO1xyXG5cdFx0Ly8gXHRcdFx0fVxyXG5cdFx0Ly8gXHRcdFx0dGhpcy5pbnB1dCA9IGVsbTxIVE1MSW5wdXRFbGVtZW50Pih0aGlzLmlucHV0KTtcclxuXHRcdC8vIFx0XHR9XHJcblx0XHQvLyBcdFx0dGhpcy5pbnB1dC5vbmNoYW5nZSA9IHRoaXMuaW5wdXQub25rZXl1cCA9IHRoaXMuaW5wdXQub25rZXlkb3duID0gdGhpcy5pbnB1dC5vbmtleXByZXNzID0gKCkgPT4gdGhpcy5wYXJlbnQucmVxdWVzdFVwZGF0ZSgpO1xyXG5cdFx0Ly8gXHRcdHRoaXMuYnV0dG9uLmFwcGVuZCh0aGlzLmlucHV0KTtcclxuXHRcdC8vIFx0fVxyXG5cdFx0Ly8gXHRjb252ZXJ0OiAoZTogSFRNTElucHV0RWxlbWVudCkgPT4gVlxyXG5cdFx0Ly8gXHRcdD0gKGU6IEhUTUxJbnB1dEVsZW1lbnQpID0+IGUudHlwZSA9PSAnbnVtYmVyJyA/ICtlLnZhbHVlIGFzIFYgOiBlLnZhbHVlIGFzIFY7XHJcblxyXG5cdFx0Ly8gXHQvKiogcmV0dXJucyBpZiBpdGVtIHNob3VsZCBiZSB2aXNpYmxlICovXHJcblx0XHQvLyBcdGFwcGx5KGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xyXG5cdFx0Ly8gXHRcdGlmICh0aGlzLm1vZGUgPT0gJ29mZicpIHJldHVybiB0cnVlO1xyXG5cdFx0Ly8gXHRcdGxldCBpbnB1dFZhbHVlID0gdGhpcy5jb252ZXJ0KHRoaXMuaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCk7XHJcblx0XHQvLyBcdFx0bGV0IHZhbHVlID0gdGhpcy5maWx0ZXIoZGF0YSwgZWwsIGlucHV0VmFsdWUpO1xyXG5cdFx0Ly8gXHRcdGxldCByZXN1bHQgPSB0eXBlb2YgdmFsdWUgPT0gXCJudW1iZXJcIiA/IHZhbHVlID4gMCA6IHZhbHVlO1xyXG5cdFx0Ly8gXHRcdGlmICh0aGlzLm1vZGUgPT0gJ29uJykgcmV0dXJuIHJlc3VsdDtcclxuXHRcdC8vIFx0XHRpZiAodGhpcy5tb2RlID09ICdvcHBvc2l0ZScpIHJldHVybiAhcmVzdWx0O1xyXG5cdFx0Ly8gXHR9XHJcblx0XHQvLyB9XHJcblxyXG5cdFx0ZXhwb3J0IGNsYXNzIFNvcnRlcjxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbTxEYXRhPiB7XHJcblx0XHRcdHNvcnRlcjogU29ydGVyRm48RGF0YT47XHJcblxyXG5cdFx0XHRjb25zdHJ1Y3RvcihkYXRhOiBQYXJ0aWFsPFNvcnRlcjxEYXRhPj4pIHtcclxuXHRcdFx0XHRzdXBlcignYnV0dG9uLmVmLWl0ZW0uZWYtc29ydGVyW2VmLW1vZGU9XCJvZmZcIl0nLCBkYXRhKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dG9nZ2xlTW9kZShtb2RlOiBNb2RlLCBmb3JjZSA9IGZhbHNlKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSBtb2RlICYmICFmb3JjZSkgcmV0dXJuO1xyXG5cdFx0XHRcdHRoaXMucGFyZW50Lm1vdmVUb1RvcCh0aGlzKTtcclxuXHRcdFx0XHRzdXBlci50b2dnbGVNb2RlKG1vZGUsIGZvcmNlKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0LyoqIHJldHVybnMgb3JkZXIgb2YgZW50cnkgKi9cclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogbnVtYmVyIHtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvbicpIHtcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLnNvcnRlcihkYXRhLCBlbCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29mZicpIHtcclxuXHRcdFx0XHRcdHJldHVybiAtdGhpcy5zb3J0ZXIoZGF0YSwgZWwpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gMDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBNb2RpZmllcjxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbTxEYXRhPiB7XHJcblx0XHRcdG1vZGlmaWVyOiBNb2RpZmllckZuPERhdGE+O1xyXG5cdFx0XHRydW5Pbk5vQ2hhbmdlID0gZmFsc2U7XHJcblxyXG5cdFx0XHRjb25zdHJ1Y3RvcihkYXRhOiBQYXJ0aWFsPE1vZGlmaWVyPERhdGE+Pikge1xyXG5cdFx0XHRcdHN1cGVyKCdidXR0b24uZWYtaXRlbS5lZi1tb2RpZmllcltlZi1tb2RlPVwib2ZmXCJdJywgZGF0YSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRvZ2dsZU1vZGUobW9kZTogTW9kZSwgZm9yY2UgPSBmYWxzZSkge1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gbW9kZSAmJiAhZm9yY2UpIHJldHVybjtcclxuXHRcdFx0XHR0aGlzLnBhcmVudC5tb3ZlVG9Ub3AodGhpcyk7XHJcblx0XHRcdFx0c3VwZXIudG9nZ2xlTW9kZShtb2RlLCBmb3JjZSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGFwcGx5KGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCkge1xyXG5cdFx0XHRcdC8vIGxldCBvbGRNb2RlOiBNb2RlIHwgbnVsbCA9IGVsLmdldEF0dHJpYnV0ZShgZWYtbW9kaWZpZXItJHt0aGlzLmlkfS1tb2RlYCkgYXMgKE1vZGUgfCBudWxsKTtcclxuXHRcdFx0XHQvLyBpZiAob2xkTW9kZSA9PSB0aGlzLm1vZGUgJiYgIXRoaXMucnVuT25Ob0NoYW5nZSkgcmV0dXJuO1xyXG5cdFx0XHRcdHRoaXMubW9kaWZpZXIoZGF0YSwgZWwsIHRoaXMubW9kZSwgbnVsbCk7XHJcblx0XHRcdFx0Ly8gZWwuc2V0QXR0cmlidXRlKGBlZi1tb2RpZmllci0ke3RoaXMuaWR9LW1vZGVgLCB0aGlzLm1vZGUpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGNsYXNzIEVudHJ5RmlsdGVyZXI8RGF0YSBleHRlbmRzIHt9ID0ge30+IHtcclxuXHRcdFx0b24gPSB0cnVlO1xyXG5cdFx0XHRjb250YWluZXI6IEhUTUxFbGVtZW50O1xyXG5cdFx0XHRlbnRyeVNlbGVjdG9yOiBzdHJpbmcgfCAoKCkgPT4gSFRNTEVsZW1lbnRbXSk7XHJcblx0XHRcdGNvbnN0cnVjdG9yKGVudHJ5U2VsZWN0b3I6IHN0cmluZyB8ICgoKSA9PiBIVE1MRWxlbWVudFtdKSwgZW5hYmxlZCA9IHRydWUpIHtcclxuXHRcdFx0XHR0aGlzLmVudHJ5U2VsZWN0b3IgPSBlbnRyeVNlbGVjdG9yO1xyXG5cdFx0XHRcdHRoaXMuY29udGFpbmVyID0gZWxtKCcuZWYtY29udGFpbmVyJyk7XHJcblx0XHRcdFx0aWYgKCFlbnRyeVNlbGVjdG9yKSB7XHJcblx0XHRcdFx0XHQvLyBkaXNhYmxlIGlmIG5vIHNlbGVjdG9yIHByb3ZpZGVkIChsaWtlbHkgaXMgYSBnZW5lcmljIGVmKVxyXG5cdFx0XHRcdFx0dGhpcy5kaXNhYmxlKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICghZW5hYmxlZCkge1xyXG5cdFx0XHRcdFx0dGhpcy5kaXNhYmxlKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChlbmFibGVkKSB7XHJcblx0XHRcdFx0XHR0aGlzLnN0eWxlKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMudXBkYXRlKCk7XHJcblx0XHRcdFx0cGFnaW5hdGUub25jaGFuZ2UoKCkgPT4gdGhpcy5yZXF1ZXN0VXBkYXRlKCkpO1xyXG5cdFx0XHRcdGV0Yy5vbmhlaWdodGNoYW5nZSgoKSA9PiB0aGlzLnJlcXVlc3RVcGRhdGUoKSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGVudHJpZXM6IEhUTUxFbGVtZW50W10gPSBbXTtcclxuXHRcdFx0ZW50cnlEYXRhczogTWFwPEhUTUxFbGVtZW50LCBEYXRhPiA9IG5ldyBNYXAoKTtcclxuXHRcdFx0Z2V0RGF0YShlbDogSFRNTEVsZW1lbnQpIHtcclxuXHRcdFx0XHRsZXQgZGF0YSA9IHRoaXMuZW50cnlEYXRhcy5nZXQoZWwpO1xyXG5cdFx0XHRcdGlmICghZGF0YSkge1xyXG5cdFx0XHRcdFx0ZGF0YSA9IHRoaXMucGFyc2VFbnRyeShlbCk7XHJcblx0XHRcdFx0XHR0aGlzLmVudHJ5RGF0YXMuc2V0KGVsLCBkYXRhKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIGRhdGE7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHVwZGF0ZVBlbmRpbmcgPSBmYWxzZTtcclxuXHRcdFx0cmVwYXJzZVBlbmRpbmcgPSBmYWxzZTtcclxuXHRcdFx0cmVxdWVzdFVwZGF0ZShyZXBhcnNlID0gZmFsc2UpIHtcclxuXHRcdFx0XHRpZiAodGhpcy51cGRhdGVQZW5kaW5nKSByZXR1cm47XHJcblx0XHRcdFx0dGhpcy51cGRhdGVQZW5kaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHRpZiAocmVwYXJzZSkgdGhpcy5yZXBhcnNlUGVuZGluZyA9IHRydWU7XHJcblx0XHRcdFx0c2V0VGltZW91dCgoKSA9PiB0aGlzLnVwZGF0ZSgpKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0YWRkSXRlbTxUIGV4dGVuZHMgRmlsdGVyZXJJdGVtPERhdGE+PihpZDogc3RyaW5nLCBkYXRhOiBQYXJ0aWFsPFQ+LCBsaXN0OiBUW10sIGNvbnN0cnVjdG9yOiAoaXRlbTogUGFydGlhbDxUPikgPT4gVCkge1xyXG5cdFx0XHRcdGRhdGEucGFyZW50ID0gdGhpcztcclxuXHRcdFx0XHRkYXRhLmlkID0gaWQ7XHJcblx0XHRcdFx0ZGF0YS5uYW1lID8/PSBpZDtcclxuXHRcdFx0XHRsZXQgaXRlbSA9IGNvbnN0cnVjdG9yKGRhdGEpO1xyXG5cdFx0XHRcdGxpc3QucHVzaChpdGVtKTtcclxuXHRcdFx0XHRyZXR1cm4gaXRlbTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cGFyc2VyczogUGFyc2VyRm48RGF0YT5bXSA9IFtdO1xyXG5cdFx0XHR3cml0ZURhdGFBdHRyaWJ1dGUgPSBmYWxzZTtcclxuXHRcdFx0YWRkUGFyc2VyKHBhcnNlcjogUGFyc2VyRm48RGF0YT4pIHtcclxuXHRcdFx0XHR0aGlzLnBhcnNlcnMucHVzaChwYXJzZXIpO1xyXG5cdFx0XHRcdHRoaXMucmVxdWVzdFVwZGF0ZSh0cnVlKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRwYXJzZUVudHJ5KGVsOiBIVE1MRWxlbWVudCk6IERhdGEge1xyXG5cdFx0XHRcdGxldCBkYXRhOiBEYXRhID0ge30gYXMgRGF0YTtcclxuXHRcdFx0XHRmb3IgKGxldCBwYXJzZXIgb2YgdGhpcy5wYXJzZXJzKSB7XHJcblx0XHRcdFx0XHRsZXQgbmV3RGF0YSA9IHBhcnNlcihlbCwgZGF0YSk7XHJcblx0XHRcdFx0XHRpZiAoIW5ld0RhdGEgfHwgbmV3RGF0YSA9PSBkYXRhKSBjb250aW51ZTtcclxuXHRcdFx0XHRcdGlmICghSXNQcm9taXNlKG5ld0RhdGEpKSB7XHJcblx0XHRcdFx0XHRcdE9iamVjdC5hc3NpZ24oZGF0YSwgbmV3RGF0YSk7XHJcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0bmV3RGF0YS50aGVuKHBOZXdEYXRhID0+IHtcclxuXHRcdFx0XHRcdFx0aWYgKHBOZXdEYXRhICYmIHBOZXdEYXRhICE9IGRhdGEpIHtcclxuXHRcdFx0XHRcdFx0XHRPYmplY3QuYXNzaWduKGRhdGEsIHBOZXdEYXRhKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR0aGlzLnJlcXVlc3RVcGRhdGUoKTtcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0aGlzLndyaXRlRGF0YUF0dHJpYnV0ZSkge1xyXG5cdFx0XHRcdFx0ZWwuc2V0QXR0cmlidXRlKCdlZi1kYXRhJywgSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gZGF0YTtcclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHRcdGZpbHRlcnM6IEZpbHRlcjxEYXRhPltdID0gW107XHJcblx0XHRcdGFkZEZpbHRlcihpZDogc3RyaW5nLCBmaWx0ZXI6IEZpbHRlckZuPERhdGE+LCBkYXRhOiBQYXJ0aWFsPEZpbHRlcjxEYXRhPj4gPSB7fSkge1xyXG5cdFx0XHRcdGRhdGEuZmlsdGVyID8/PSBmaWx0ZXI7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuYWRkSXRlbShpZCwgZGF0YSwgdGhpcy5maWx0ZXJzLCBkYXRhID0+IG5ldyBGaWx0ZXIoZGF0YSkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIGFkZEZpbHRlcldpdGhJbnB1dDxWIGV4dGVuZHMgc3RyaW5nIHwgbnVtYmVyPihpZDogc3RyaW5nLCBmaWx0ZXI6IEZpbHRlcldJRm48RGF0YSwgVj4sIGRhdGE6IFBhcnRpYWw8RmlsdGVyV2l0aElucHV0PERhdGEsIFY+PiAmIHsgaW5wdXQ/OiBWIH0gPSB7fSkge1xyXG5cdFx0XHQvLyBcdGRhdGEuZmlsdGVyID8/PSBmaWx0ZXI7XHJcblx0XHRcdC8vIFx0cmV0dXJuIHRoaXMuYWRkSXRlbShpZCwgZGF0YSwgdGhpcy5maWx0ZXJzLCBkYXRhID0+IG5ldyBGaWx0ZXJXaXRoSW5wdXQoZGF0YSkpO1xyXG5cdFx0XHQvLyB9XHJcblx0XHRcdHNvcnRlcnM6IFNvcnRlcjxEYXRhPltdID0gW107XHJcblx0XHRcdGFkZFNvcnRlcihpZDogc3RyaW5nLCBzb3J0ZXI6IFNvcnRlckZuPERhdGE+LCBkYXRhOiBQYXJ0aWFsPFNvcnRlcjxEYXRhPj4gPSB7fSkge1xyXG5cdFx0XHRcdGRhdGEuc29ydGVyID0gc29ydGVyO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmFkZEl0ZW0oaWQsIGRhdGEsIHRoaXMuc29ydGVycywgZGF0YSA9PiBuZXcgU29ydGVyKGRhdGEpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRtb2RpZmllcnM6IE1vZGlmaWVyPERhdGE+W10gPSBbXTtcclxuXHRcdFx0YWRkTW9kaWZpZXIoaWQ6IHN0cmluZywgbW9kaWZpZXI6IE1vZGlmaWVyRm48RGF0YT4sIGRhdGE6IFBhcnRpYWw8TW9kaWZpZXI8RGF0YT4+ID0ge30pIHtcclxuXHRcdFx0XHRkYXRhLm1vZGlmaWVyID0gbW9kaWZpZXI7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuYWRkSXRlbShpZCwgZGF0YSwgdGhpcy5tb2RpZmllcnMsIGRhdGEgPT4gbmV3IE1vZGlmaWVyKGRhdGEpKTtcclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHRcdGZpbHRlckVudHJpZXMoKSB7XHJcblx0XHRcdFx0Zm9yIChsZXQgZWwgb2YgdGhpcy5lbnRyaWVzKSB7XHJcblx0XHRcdFx0XHRsZXQgZGF0YSA9IHRoaXMuZ2V0RGF0YShlbCk7XHJcblx0XHRcdFx0XHRsZXQgdmFsdWUgPSB0cnVlO1xyXG5cdFx0XHRcdFx0Zm9yIChsZXQgZmlsdGVyIG9mIHRoaXMuZmlsdGVycykge1xyXG5cdFx0XHRcdFx0XHR2YWx1ZSA9IHZhbHVlICYmIGZpbHRlci5hcHBseShkYXRhLCBlbCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbC5jbGFzc0xpc3QudG9nZ2xlKCdlZi1maWx0ZXJlZC1vdXQnLCAhdmFsdWUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0c29ydEVudHJpZXMoKSB7XHJcblx0XHRcdFx0bGV0IGVudHJpZXMgPSB0aGlzLmVudHJpZXM7XHJcblx0XHRcdFx0bGV0IHBhaXJzOiBbSFRNTEVsZW1lbnQsIERhdGFdW10gPSBlbnRyaWVzLm1hcChlID0+IFtlLCB0aGlzLmdldERhdGEoZSldKTtcclxuXHRcdFx0XHRmb3IgKGxldCBzb3J0ZXIgb2YgdGhpcy5zb3J0ZXJzKSB7XHJcblx0XHRcdFx0XHRpZiAoc29ydGVyLm1vZGUgIT0gJ29mZicpIHtcclxuXHRcdFx0XHRcdFx0cGFpcnMgPSBwYWlycy52c29ydCgoW2UsIGRhdGFdKSA9PiBzb3J0ZXIuYXBwbHkoZGF0YSwgZSkpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbnRyaWVzID0gcGFpcnMubWFwKGUgPT4gZVswXSk7XHJcblx0XHRcdFx0aWYgKGVudHJpZXMuZXZlcnkoKGUsIGkpID0+IGUgPT0gdGhpcy5lbnRyaWVzW2ldKSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRsZXQgYnIgPSBlbG0oJ2JyLmVmLWJlZm9yZS1zb3J0W2hpZGRlbl0nKTtcclxuXHRcdFx0XHR0aGlzLmVudHJpZXNbMF0uYmVmb3JlKGJyKTtcclxuXHRcdFx0XHRici5hZnRlciguLi5lbnRyaWVzKTtcclxuXHRcdFx0XHRici5yZW1vdmUoKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0bW9kaWZ5RW50cmllcygpIHtcclxuXHRcdFx0XHRsZXQgZW50cmllcyA9IHRoaXMuZW50cmllcztcclxuXHRcdFx0XHRsZXQgcGFpcnM6IFtIVE1MRWxlbWVudCwgRGF0YV1bXSA9IGVudHJpZXMubWFwKGUgPT4gW2UsIHRoaXMuZ2V0RGF0YShlKV0pO1xyXG5cdFx0XHRcdGZvciAobGV0IG1vZGlmaWVyIG9mIHRoaXMubW9kaWZpZXJzKSB7XHJcblx0XHRcdFx0XHRmb3IgKGxldCBbZSwgZF0gb2YgcGFpcnMpIHtcclxuXHRcdFx0XHRcdFx0bW9kaWZpZXIuYXBwbHkoZCwgZSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0bW92ZVRvVG9wKGl0ZW06IFNvcnRlcjxEYXRhPiB8IE1vZGlmaWVyPERhdGE+KSB7XHJcblx0XHRcdFx0aWYgKGl0ZW0gaW5zdGFuY2VvZiBTb3J0ZXIpIHtcclxuXHRcdFx0XHRcdHRoaXMuc29ydGVycy5zcGxpY2UodGhpcy5zb3J0ZXJzLmluZGV4T2YoaXRlbSksIDEpO1xyXG5cdFx0XHRcdFx0dGhpcy5zb3J0ZXJzLnB1c2goaXRlbSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChpdGVtIGluc3RhbmNlb2YgTW9kaWZpZXIpIHtcclxuXHRcdFx0XHRcdHRoaXMubW9kaWZpZXJzLnNwbGljZSh0aGlzLm1vZGlmaWVycy5pbmRleE9mKGl0ZW0pLCAxKTtcclxuXHRcdFx0XHRcdHRoaXMubW9kaWZpZXJzLnB1c2goaXRlbSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR1cGRhdGUocmVwYXJzZSA9IHRoaXMucmVwYXJzZVBlbmRpbmcpIHtcclxuXHRcdFx0XHR0aGlzLnVwZGF0ZVBlbmRpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHRpZiAodGhpcy5kaXNhYmxlZCkgcmV0dXJuO1xyXG5cdFx0XHRcdGlmIChyZXBhcnNlKSB7XHJcblx0XHRcdFx0XHR0aGlzLmVudHJ5RGF0YXMgPSBuZXcgTWFwKCk7XHJcblx0XHRcdFx0XHR0aGlzLnJlcGFyc2VQZW5kaW5nID0gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICghdGhpcy5jb250YWluZXIuY2xvc2VzdCgnYm9keScpKSB7XHJcblx0XHRcdFx0XHR0aGlzLmNvbnRhaW5lci5hcHBlbmRUbygnYm9keScpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLmVudHJpZXMgPSB0eXBlb2YgdGhpcy5lbnRyeVNlbGVjdG9yID09ICdmdW5jdGlvbicgPyB0aGlzLmVudHJ5U2VsZWN0b3IoKSA6IHFxKHRoaXMuZW50cnlTZWxlY3Rvcik7XHJcblx0XHRcdFx0dGhpcy5maWx0ZXJFbnRyaWVzKCk7XHJcblx0XHRcdFx0dGhpcy5zb3J0RW50cmllcygpO1xyXG5cdFx0XHRcdHRoaXMubW9kaWZ5RW50cmllcygpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRvZmZJbmNvbXBhdGlibGUoaW5jb21wYXRpYmxlOiBzdHJpbmdbXSkge1xyXG5cdFx0XHRcdGZvciAobGV0IGZpbHRlciBvZiB0aGlzLmZpbHRlcnMpIHtcclxuXHRcdFx0XHRcdGlmIChpbmNvbXBhdGlibGUuaW5jbHVkZXMoZmlsdGVyLmlkKSkge1xyXG5cdFx0XHRcdFx0XHRmaWx0ZXIudG9nZ2xlTW9kZSgnb2ZmJyk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZvciAobGV0IHNvcnRlciBvZiB0aGlzLnNvcnRlcnMpIHtcclxuXHRcdFx0XHRcdGlmIChpbmNvbXBhdGlibGUuaW5jbHVkZXMoc29ydGVyLmlkKSkge1xyXG5cdFx0XHRcdFx0XHRzb3J0ZXIudG9nZ2xlTW9kZSgnb2ZmJyk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZvciAobGV0IG1vZGlmaWVyIG9mIHRoaXMubW9kaWZpZXJzKSB7XHJcblx0XHRcdFx0XHRpZiAoaW5jb21wYXRpYmxlLmluY2x1ZGVzKG1vZGlmaWVyLmlkKSkge1xyXG5cdFx0XHRcdFx0XHRtb2RpZmllci50b2dnbGVNb2RlKCdvZmYnKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHN0eWxlKHMgPSAnJykge1xyXG5cdFx0XHRcdEVudHJ5RmlsdGVyZXIuc3R5bGUocyk7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHRcdH1cclxuXHRcdFx0c3RhdGljIHN0eWxlKHMgPSAnJykge1xyXG5cdFx0XHRcdGxldCBzdHlsZSA9IHEoJ3N0eWxlLmVmLXN0eWxlJykgfHwgZWxtKCdzdHlsZS5lZi1zdHlsZScpLmFwcGVuZFRvKCdoZWFkJyk7XHJcblx0XHRcdFx0c3R5bGUuaW5uZXJIVE1MID0gYFxyXG5cdFx0XHRcdFx0LmVmLWNvbnRhaW5lciB7XHJcblx0XHRcdFx0XHRcdGRpc3BsYXk6IGZsZXg7XHJcblx0XHRcdFx0XHRcdGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XHJcblx0XHRcdFx0XHRcdHBvc2l0aW9uOiBmaXhlZDtcclxuXHRcdFx0XHRcdFx0dG9wOiAwO1xyXG5cdFx0XHRcdFx0XHRyaWdodDogMDtcclxuXHRcdFx0XHRcdFx0ei1pbmRleDogOTk5OTk5OTk5OTk5OTk5OTk5OTtcclxuXHRcdFx0XHRcdFx0bWluLXdpZHRoOiAxMDBweDtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC5lZi1lbnRyeSB7fVxyXG5cclxuXHRcdFx0XHRcdC5lZi1maWx0ZXJlZC1vdXQge1xyXG5cdFx0XHRcdFx0XHRkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0YnV0dG9uLmVmLWl0ZW0ge31cclxuXHRcdFx0XHRcdGJ1dHRvbi5lZi1pdGVtW2VmLW1vZGU9XCJvZmZcIl0ge1xyXG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kOiBsaWdodGdyYXk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRidXR0b24uZWYtaXRlbVtlZi1tb2RlPVwib25cIl0ge1xyXG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kOiBsaWdodGdyZWVuO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0YnV0dG9uLmVmLWl0ZW1bZWYtbW9kZT1cIm9wcG9zaXRlXCJdIHtcclxuXHRcdFx0XHRcdFx0YmFja2dyb3VuZDogeWVsbG93O1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFtlZi1wcmVmaXhdOjpiZWZvcmUge1xyXG5cdFx0XHRcdFx0XHRjb250ZW50OiBhdHRyKGVmLXByZWZpeCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRgICsgcztcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZGlzYWJsZWQgPSBmYWxzZTtcclxuXHRcdFx0ZGlzYWJsZSgpIHtcclxuXHRcdFx0XHR0aGlzLmRpc2FibGVkID0gdHJ1ZTtcclxuXHRcdFx0XHR0aGlzLmNvbnRhaW5lci5yZW1vdmUoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbmFibGUoKSB7XHJcblx0XHRcdFx0dGhpcy5kaXNhYmxlZCA9IGZhbHNlO1xyXG5cdFx0XHRcdHRoaXMudXBkYXRlUGVuZGluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdHRoaXMucmVxdWVzdFVwZGF0ZSgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjbGVhcigpIHtcclxuXHRcdFx0XHR0aGlzLmVudHJ5RGF0YXMgPSBuZXcgTWFwKCk7XHJcblx0XHRcdFx0dGhpcy5wYXJzZXJzLnNwbGljZSgwLCA5OTkpO1xyXG5cdFx0XHRcdHRoaXMuZmlsdGVycy5zcGxpY2UoMCwgOTk5KS5tYXAoZSA9PiBlLnJlbW92ZSgpKTtcclxuXHRcdFx0XHR0aGlzLnNvcnRlcnMuc3BsaWNlKDAsIDk5OSkubWFwKGUgPT4gZS5yZW1vdmUoKSk7XHJcblx0XHRcdFx0dGhpcy5lbmFibGUoKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Z2V0IF9kYXRhcygpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5lbnRyaWVzLm1hcChlID0+IHRoaXMuZ2V0RGF0YShlKSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gSXNQcm9taXNlPFQ+KHA6IFByb21pc2VMaWtlPFQ+IHwgVCk6IHAgaXMgUHJvbWlzZUxpa2U8VD4ge1xyXG5cdFx0XHRpZiAoIXApIHJldHVybiBmYWxzZTtcclxuXHRcdFx0cmV0dXJuIHR5cGVvZiAocCBhcyBQcm9taXNlTGlrZTxUPikudGhlbiA9PSAnZnVuY3Rpb24nO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGxldCBFRjIgPSBFbnRyeUZpbHRlcmVyRXh0ZW5zaW9uMi5FbnRyeUZpbHRlcmVyO1xyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblxyXG5cdGV4cG9ydCBuYW1lc3BhY2UgT2JqZWN0RXh0ZW5zaW9uIHtcclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZGVmaW5lVmFsdWU8VD4obzogVCwgcDoga2V5b2YgVCwgdmFsdWU6IGFueSk6IFQ7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZGVmaW5lVmFsdWU8VD4obzogVCwgZm46IEZ1bmN0aW9uKTogVDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBkZWZpbmVWYWx1ZTxUPihvOiBULCBwOiBrZXlvZiBUIHwgc3RyaW5nIHwgRnVuY3Rpb24sIHZhbHVlPzogYW55KTogVCB7XHJcblx0XHRcdGlmICh0eXBlb2YgcCA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0W3AsIHZhbHVlXSA9IFtwLm5hbWUsIHBdIGFzIFtzdHJpbmcsIEZ1bmN0aW9uXTtcclxuXHRcdFx0fVxyXG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobywgcCwge1xyXG5cdFx0XHRcdHZhbHVlLFxyXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdFx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcclxuXHRcdFx0XHR3cml0YWJsZTogdHJ1ZSxcclxuXHRcdFx0fSk7XHJcblx0XHRcdHJldHVybiBvO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBkZWZpbmVHZXR0ZXI8VD4obzogVCwgcDoga2V5b2YgVCwgZ2V0OiAoKSA9PiBWYWx1ZU9mPFQ+KTogVDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBkZWZpbmVHZXR0ZXI8VD4obzogVCwgZ2V0OiBGdW5jdGlvbik6IFQ7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZGVmaW5lR2V0dGVyPFQ+KG86IFQsIHA6IHN0cmluZyB8IGtleW9mIFQgfCBGdW5jdGlvbiwgZ2V0PzogYW55KTogVCB7XHJcblx0XHRcdGlmICh0eXBlb2YgcCA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0W3AsIGdldF0gPSBbcC5uYW1lLCBwXSBhcyBbc3RyaW5nLCBGdW5jdGlvbl07XHJcblx0XHRcdH1cclxuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIHAsIHtcclxuXHRcdFx0XHRnZXQsXHJcblx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdGVudW1lcmFibGU6IGZhbHNlLFxyXG5cdFx0XHR9KTtcclxuXHRcdFx0cmV0dXJuIG87XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIG1hcDxULCBWPihvOiBULCBtYXBwZXI6ICh2OiBWYWx1ZU9mPFQ+LCBrOiBrZXlvZiBULCBvOiBUKSA9PiBWKTogTWFwcGVkT2JqZWN0PFQsVj4ge1xyXG5cdFx0XHRsZXQgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKG8pIGFzIFtrZXlvZiBULCBWYWx1ZU9mPFQ+XVtdO1xyXG5cdFx0XHRyZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKGVudHJpZXMubWFwKChbayx2XSkgPT4gW2ssIG1hcHBlcih2LCBrLCBvKV0pKSBhcyBNYXBwZWRPYmplY3Q8VCxWPjtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblxyXG5cdGV4cG9ydCBuYW1lc3BhY2UgUHJvbWlzZUV4dGVuc2lvbiB7XHJcblx0XHR0eXBlIFVud3JhcHBlZFByb21pc2U8VD4gPSBQcm9taXNlPFQ+ICYge1xyXG5cdFx0XHRyZXNvbHZlOiAodmFsdWU6IFQgfCBQcm9taXNlTGlrZTxUPikgPT4gdm9pZDtcclxuXHRcdFx0cmVqZWN0OiAocmVhc29uPzogYW55KSA9PiB2b2lkO1xyXG5cdFx0XHRyOiAodmFsdWU6IFQgfCBQcm9taXNlTGlrZTxUPikgPT4gdm9pZDtcclxuXHRcdFx0ajogKHJlYXNvbj86IGFueSkgPT4gdm9pZDtcclxuXHRcdH1cclxuXHJcblx0XHQvKipcclxuXHRcdCAqIENyZWF0ZXMgdW53cmFwcGVkIHByb21pc2VcclxuXHRcdCAqL1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGVtcHR5PFQ+KCkge1xyXG5cdFx0XHRsZXQgcmVzb2x2ZTogKHZhbHVlOiBUKSA9PiB2b2lkO1xyXG5cdFx0XHRsZXQgcmVqZWN0OiAocmVhc29uPzogYW55KSA9PiB2b2lkO1xyXG5cdFx0XHRsZXQgcCA9IG5ldyBQcm9taXNlPFQ+KChyLCBqKSA9PiB7XHJcblx0XHRcdFx0cmVzb2x2ZSA9IHI7XHJcblx0XHRcdFx0cmVqZWN0ID0gajtcclxuXHRcdFx0fSkgYXMgVW53cmFwcGVkUHJvbWlzZTxUPjtcclxuXHRcdFx0cC5yZXNvbHZlID0gcC5yID0gcmVzb2x2ZTtcclxuXHRcdFx0cC5yZWplY3QgPSBwLmogPSByZWplY3Q7XHJcblx0XHRcdHJldHVybiBwO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBmcmFtZShuID0gMSk6IFByb21pc2U8bnVtYmVyPiB7XHJcblx0XHRcdHdoaWxlICgtLW4gPiAwKSB7XHJcblx0XHRcdFx0YXdhaXQgbmV3IFByb21pc2UocmVxdWVzdEFuaW1hdGlvbkZyYW1lKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UocmVxdWVzdEFuaW1hdGlvbkZyYW1lKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59XHJcbiIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIFF1ZXJ5U2VsZWN0b3Ige1xyXG5cclxuXHRcdGV4cG9ydCBuYW1lc3BhY2UgV2luZG93USB7XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHNlbGVjdG9yOiBLLCBwYXJlbnQ/OiBQYXJlbnROb2RlKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdIHwgbnVsbDtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHE8RSBleHRlbmRzIEVsZW1lbnQgPSBIVE1MRWxlbWVudD4oc2VsZWN0b3I6IHN0cmluZywgcGFyZW50PzogUGFyZW50Tm9kZSk6IEUgfCBudWxsO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcShzZWxlY3Rvcjogc3RyaW5nLCBwYXJlbnQ6IFBhcmVudE5vZGUgPSBkb2N1bWVudCkge1xyXG5cdFx0XHRcdHJldHVybiBwYXJlbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3RvcjogSywgcGFyZW50PzogUGFyZW50Tm9kZSk6IChIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10pW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxFIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50PihzZWxlY3Rvcjogc3RyaW5nLCBwYXJlbnQ/OiBQYXJlbnROb2RlKTogRVtdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXEoc2VsZWN0b3I6IHN0cmluZywgcGFyZW50OiBQYXJlbnROb2RlID0gZG9jdW1lbnQpIHtcclxuXHRcdFx0XHRyZXR1cm4gWy4uLnBhcmVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKV07XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgbmFtZXNwYWNlIERvY3VtZW50USB7XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IERvY3VtZW50LCBzZWxlY3RvcjogSyk6IEhUTUxFbGVtZW50VGFnTmFtZU1hcFtLXSB8IG51bGw7XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEUgZXh0ZW5kcyBFbGVtZW50ID0gSFRNTEVsZW1lbnQ+KHRoaXM6IERvY3VtZW50LCBzZWxlY3Rvcjogc3RyaW5nKTogRSB8IG51bGw7XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxKHRoaXM6IERvY3VtZW50LCBzZWxlY3Rvcjogc3RyaW5nKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuZG9jdW1lbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXE8SyBleHRlbmRzIGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcD4odGhpczogRG9jdW1lbnQsIHNlbGVjdG9yOiBLKTogKEhUTUxFbGVtZW50VGFnTmFtZU1hcFtLXSlbXTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEUgZXh0ZW5kcyBFbGVtZW50ID0gSFRNTEVsZW1lbnQ+KHRoaXM6IERvY3VtZW50LCBzZWxlY3Rvcjogc3RyaW5nKTogRVtdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXEodGhpczogRG9jdW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpIHtcclxuXHRcdFx0XHRyZXR1cm4gWy4uLnRoaXMuZG9jdW1lbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBuYW1lc3BhY2UgRWxlbWVudFEge1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPih0aGlzOiBFbGVtZW50LCBzZWxlY3RvcjogSyk6IEhUTUxFbGVtZW50VGFnTmFtZU1hcFtLXSB8IG51bGw7XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEUgZXh0ZW5kcyBFbGVtZW50ID0gSFRNTEVsZW1lbnQ+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpOiBFIHwgbnVsbDtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHEodGhpczogRWxlbWVudCwgc2VsZWN0b3I6IHN0cmluZykge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXE8SyBleHRlbmRzIGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcD4odGhpczogRWxlbWVudCwgc2VsZWN0b3I6IEspOiAoSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdKVtdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXE8RSBleHRlbmRzIEVsZW1lbnQgPSBIVE1MRWxlbWVudD4odGhpczogRWxlbWVudCwgc2VsZWN0b3I6IHN0cmluZyk6IEVbXTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxKHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpIHtcclxuXHRcdFx0XHRyZXR1cm4gWy4uLnRoaXMucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcildO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIEVsZW1lbnRFeHRlbnNpb24ge1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGVtaXQodGhpczogRWxlbWVudCwgdHlwZTogc3RyaW5nLCBkZXRhaWw/OiBhbnkpIHtcclxuXHRcdFx0bGV0IGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KHR5cGUsIHtcclxuXHRcdFx0XHRidWJibGVzOiB0cnVlLFxyXG5cdFx0XHRcdGRldGFpbCxcclxuXHRcdFx0fSk7XHJcblx0XHRcdHRoaXMuZGlzcGF0Y2hFdmVudChldmVudCk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFRvKHRoaXM6IEVsZW1lbnQsIHBhcmVudDogRWxlbWVudCk7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gYXBwZW5kVG8odGhpczogRWxlbWVudCwgc2VsZWN0b3I6IHN0cmluZyk7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gYXBwZW5kVG8odGhpczogRWxlbWVudCwgcGFyZW50OiBFbGVtZW50IHwgc3RyaW5nKSB7XHJcblx0XHRcdGlmICh0eXBlb2YgcGFyZW50ID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0cGFyZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihwYXJlbnQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHBhcmVudC5hcHBlbmQodGhpcyk7XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn1cclxuIiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblxyXG5cdGV4cG9ydCBuYW1lc3BhY2UgRWxtIHtcclxuXHRcdHR5cGUgQ2hpbGQgPSBOb2RlIHwgc3RyaW5nO1xyXG5cdFx0dHlwZSBMaXN0ZW5lciA9IChldmVudDogRXZlbnQgfCBNb3VzZUV2ZW50IHwgS2V5Ym9hcmRFdmVudCkgPT4gYW55O1xyXG5cclxuXHRcdGNvbnN0IGVsbVJlZ2V4ID0gbmV3IFJlZ0V4cChbXHJcblx0XHRcdC9eKD88dGFnPltcXHctXSspLyxcclxuXHRcdFx0LyMoPzxpZD5bXFx3LV0rKS8sXHJcblx0XHRcdC9cXC4oPzxjbGFzcz5bXFx3LV0rKS8sXHJcblx0XHRcdC9cXFsoPzxhdHRyMT5bXFx3LV0rKVxcXS8sXHJcblx0XHRcdC9cXFsoPzxhdHRyMj5bXFx3LV0rKT0oPyFbJ1wiXSkoPzx2YWwyPlteXFxdXSopXFxdLyxcclxuXHRcdFx0L1xcWyg/PGF0dHIzPltcXHctXSspPVwiKD88dmFsMz4oPzpbXlwiXXxcXFxcXCIpKilcIlxcXS8sXHJcblx0XHRcdC9cXFsoPzxhdHRyND5bXFx3LV0rKT1cIig/PHZhbDQ+KD86W14nXXxcXFxcJykqKVwiXFxdLyxcclxuXHRcdF0ubWFwKGUgPT4gZS5zb3VyY2UpLmpvaW4oJ3wnKSwgJ2cnKTtcclxuXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBDcmVhdGVzIGFuIGVsZW1lbnQgbWF0Y2hpbmcgcHJvdmlkZWQgc2VsZWN0b3IsIHdpdGggcHJvdmlkZWQgY2hpbGRyZW4gYW5kIGxpc3RlbmVyc1xyXG5cdFx0ICovXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtPFQgZXh0ZW5kcyBIVE1MRWxlbWVudD4oc2VsZWN0b3I/OiBzdHJpbmcsIC4uLmNoaWxkcmVuOiAoQ2hpbGQgfCBMaXN0ZW5lcilbXSk6IFQ7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtKHNlbGVjdG9yPzogc3RyaW5nLCAuLi5jaGlsZHJlbjogKENoaWxkIHwgTGlzdGVuZXIpW10pOiBIVE1MRWxlbWVudDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBlbG0oc2VsZWN0b3I6IGBpbnB1dCR7c3RyaW5nfWAsIC4uLmNoaWxkcmVuOiAoQ2hpbGQgfCBMaXN0ZW5lcilbXSk6IEhUTUxJbnB1dEVsZW1lbnQ7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtKHNlbGVjdG9yOiBgaW1nJHtzdHJpbmd9YCwgLi4uY2hpbGRyZW46IChDaGlsZCB8IExpc3RlbmVyKVtdKTogSFRNTEltYWdlRWxlbWVudDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBlbG0oc2VsZWN0b3I6IGBidXR0b24ke3N0cmluZ31gLCAuLi5jaGlsZHJlbjogKENoaWxkIHwgTGlzdGVuZXIpW10pOiBIVE1MQnV0dG9uRWxlbWVudDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBlbG0oc2VsZWN0b3I6IHN0cmluZyA9ICcnLCAuLi5jaGlsZHJlbjogKENoaWxkIHwgTGlzdGVuZXIpW10pOiBIVE1MRWxlbWVudCB7XHJcblx0XHRcdGlmIChzZWxlY3Rvci5yZXBsYWNlQWxsKGVsbVJlZ2V4LCAnJykgIT0gJycpIHtcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgc2VsZWN0b3I6ICR7c2VsZWN0b3J9YCk7XHJcblx0XHRcdH1cclxuXHRcdFx0bGV0IGVsZW1lbnQ6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0XHRcdGZvciAobGV0IG1hdGNoIG9mIHNlbGVjdG9yLm1hdGNoQWxsKGVsbVJlZ2V4KSkge1xyXG5cdFx0XHRcdGlmIChtYXRjaC5ncm91cHMudGFnKSB7XHJcblx0XHRcdFx0XHRlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChtYXRjaC5ncm91cHMudGFnKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5pZCkge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5pZCA9IG1hdGNoLmdyb3Vwcy5pZDtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5jbGFzcykge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKG1hdGNoLmdyb3Vwcy5jbGFzcyk7XHJcblx0XHRcdFx0fSBlbHNlIGlmIChtYXRjaC5ncm91cHMuYXR0cjEpIHtcclxuXHRcdFx0XHRcdGVsZW1lbnQuc2V0QXR0cmlidXRlKG1hdGNoLmdyb3Vwcy5hdHRyMSwgXCJ0cnVlXCIpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAobWF0Y2guZ3JvdXBzLmF0dHIyKSB7XHJcblx0XHRcdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZShtYXRjaC5ncm91cHMuYXR0cjIsIG1hdGNoLmdyb3Vwcy52YWwyKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5hdHRyMykge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5zZXRBdHRyaWJ1dGUobWF0Y2guZ3JvdXBzLmF0dHIzLCBtYXRjaC5ncm91cHMudmFsMy5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAobWF0Y2guZ3JvdXBzLmF0dHI0KSB7XHJcblx0XHRcdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZShtYXRjaC5ncm91cHMuYXR0cjQsIG1hdGNoLmdyb3Vwcy52YWw0LnJlcGxhY2UoL1xcXFwnL2csICdcXCcnKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGZvciAobGV0IGxpc3RlbmVyIG9mIGNoaWxkcmVuLmZpbHRlcihlID0+IHR5cGVvZiBlID09ICdmdW5jdGlvbicpIGFzIExpc3RlbmVyW10pIHtcclxuXHRcdFx0XHRsZXQgbmFtZSA9IGxpc3RlbmVyLm5hbWU7XHJcblx0XHRcdFx0aWYgKCFuYW1lKSBuYW1lID0gKGxpc3RlbmVyICsgJycpLm1hdGNoKC9cXHcrLylbMF07XHJcblx0XHRcdFx0aWYgKG5hbWUuc3RhcnRzV2l0aCgnb24nKSkgbmFtZSA9IG5hbWUuc2xpY2UoMik7XHJcblx0XHRcdFx0aWYgKGVsZW1lbnRbJ29uJyArIG5hbWVdID09PSBudWxsKSB7XHJcblx0XHRcdFx0XHRlbGVtZW50WydvbicgKyBuYW1lXSA9IGxpc3RlbmVyO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgbGlzdGVuZXIpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRlbGVtZW50LmFwcGVuZCguLi5jaGlsZHJlbi5maWx0ZXIoZSA9PiB0eXBlb2YgZSAhPSAnZnVuY3Rpb24nKSBhcyBDaGlsZFtdKTtcclxuXHRcdFx0cmV0dXJuIGVsZW1lbnQ7XHJcblx0XHR9XHJcblx0fVxyXG5cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cdGV4cG9ydCBuYW1lc3BhY2UgZXRjIHtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBrZXliaW5kKGtleTogc3RyaW5nLCBmbjogKGV2ZW50OiBLZXlib2FyZEV2ZW50KSA9PiB2b2lkKSB7XHJcblx0XHRcdGxldCBjb2RlID0ga2V5Lmxlbmd0aCA9PSAxID8gJ0tleScgKyBrZXkudG9VcHBlckNhc2UoKSA6IGtleTtcclxuXHRcdFx0ZnVuY3Rpb24gb25rZXlkb3duKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XHJcblx0XHRcdFx0aWYgKGV2ZW50LmNvZGUgPT0gY29kZSkge1xyXG5cdFx0XHRcdFx0Zm4oZXZlbnQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRhZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25rZXlkb3duKTtcclxuXHRcdFx0cmV0dXJuICgpID0+IHJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbmtleWRvd24pO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBmdWxsc2NyZWVuKG9uPzogYm9vbGVhbikge1xyXG5cdFx0XHRsZXQgY2VudHJhbCA9IHBhZ2luYXRlLmltYWdlU2Nyb2xsaW5nQWN0aXZlICYmIHBhZ2luYXRlLmdldENlbnRyYWxJbWcoKTtcclxuXHRcdFx0aWYgKCFkb2N1bWVudC5mdWxsc2NyZWVuRWxlbWVudCkge1xyXG5cdFx0XHRcdGlmIChvbiA9PSBmYWxzZSkgcmV0dXJuO1xyXG5cdFx0XHRcdGF3YWl0IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbigpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGlmIChvbiA9PSB0cnVlKSByZXR1cm47XHJcblx0XHRcdFx0YXdhaXQgZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4oKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoY2VudHJhbCkge1xyXG5cdFx0XHRcdGNlbnRyYWwuc2Nyb2xsSW50b1ZpZXcoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBhbnliaW5kKGtleU9yRXZlbnQ6IHN0cmluZyB8IG51bWJlciwgZm46IChldmVudDogRXZlbnQpID0+IHZvaWQpIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBrZXlPckV2ZW50ID09IFwibnVtYmVyXCIpIGtleU9yRXZlbnQgPSBrZXlPckV2ZW50ICsgJyc7XHJcblx0XHRcdC8vIGRldGVjdCBpZiBpdCBpcyBldmVudFxyXG5cdFx0XHRsZXQgaXNFdmVudCA9IHdpbmRvdy5oYXNPd25Qcm9wZXJ0eSgnb24nICsga2V5T3JFdmVudCk7XHJcblx0XHRcdGlmIChpc0V2ZW50KSB7XHJcblx0XHRcdFx0YWRkRXZlbnRMaXN0ZW5lcihrZXlPckV2ZW50LCBmbik7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIHBhcnNlIGtleSBjb2RlXHJcblx0XHRcdGlmICghaXNOYU4ocGFyc2VJbnQoa2V5T3JFdmVudCkpKSB7XHJcblx0XHRcdFx0a2V5T3JFdmVudCA9IGBEaWdpdCR7a2V5T3JFdmVudH1gO1xyXG5cdFx0XHR9IGVsc2UgaWYgKGtleU9yRXZlbnQubGVuZ3RoID09IDEpIHtcclxuXHRcdFx0XHRrZXlPckV2ZW50ID0gYEtleSR7a2V5T3JFdmVudC50b1VwcGVyQ2FzZSgpfWA7XHJcblx0XHRcdH1cclxuXHRcdFx0YWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGV2ID0+IHtcclxuXHRcdFx0XHRpZiAoZXYuY29kZSAhPSBrZXlPckV2ZW50KSByZXR1cm47XHJcblx0XHRcdFx0Zm4oZXYpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZnVsbHNjcmVlbk9uKGtleTogc3RyaW5nKSB7XHJcblx0XHRcdGlmIChrZXkgPT0gJ3Njcm9sbCcpIHtcclxuXHRcdFx0XHRhZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCAoKSA9PiBmdWxsc2NyZWVuKHRydWUpKTtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGtleWJpbmQoa2V5LCAoKSA9PiBmdWxsc2NyZWVuKCkpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBmSXNGb3JGdWxsc2NyZWVuKCkge1xyXG5cdFx0XHRrZXliaW5kKCdGJywgKCkgPT4gZnVsbHNjcmVlbigpKTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gaGFzaENvZGUodGhpczogc3RyaW5nKTtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBoYXNoQ29kZSh2YWx1ZTogc3RyaW5nKTtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBoYXNoQ29kZSh0aGlzOiBzdHJpbmcsIHZhbHVlPzogc3RyaW5nKSB7XHJcblx0XHRcdHZhbHVlID8/PSB0aGlzO1xyXG5cdFx0XHRsZXQgaGFzaCA9IDA7XHJcblx0XHRcdGZvciAobGV0IGMgb2YgdmFsdWUpIHtcclxuXHRcdFx0XHRoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgKyBjLmNoYXJDb2RlQXQoMCk7XHJcblx0XHRcdFx0aGFzaCA9IGhhc2ggJiBoYXNoO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBoYXNoO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBpbml0KCkge1xyXG5cdFx0XHQvLyBTdHJpbmcucHJvdG90eXBlLmhhc2hDb2RlID0gaGFzaENvZGU7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGN1cnJlbnRTY3JpcHRIYXNoKCkge1xyXG5cdFx0XHRyZXR1cm4gaGFzaENvZGUoZG9jdW1lbnQuY3VycmVudFNjcmlwdC5pbm5lckhUTUwpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiByZWxvYWRPbkN1cnJlbnRTY3JpcHRDaGFuZ2VkKHNjcmlwdE5hbWU6IHN0cmluZyA9IGxvY2F0aW9uLmhvc3RuYW1lICsgJy51anMnKSB7XHJcblx0XHRcdGxldCBzY3JpcHRJZCA9IGByZWxvYWRPbkN1cnJlbnRTY3JpcHRDaGFuZ2VkXyR7c2NyaXB0TmFtZX1gO1xyXG5cdFx0XHRsZXQgc2NyaXB0SGFzaCA9IGN1cnJlbnRTY3JpcHRIYXNoKCkgKyAnJztcclxuXHRcdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oc2NyaXB0SWQsIHNjcmlwdEhhc2gpO1xyXG5cdFx0XHRhZGRFdmVudExpc3RlbmVyKCdmb2N1cycsICgpID0+IHtcclxuXHRcdFx0XHRpZiAobG9jYWxTdG9yYWdlLmdldEl0ZW0oc2NyaXB0SWQpICE9IHNjcmlwdEhhc2gpIHtcclxuXHRcdFx0XHRcdGxvY2F0aW9uLnJlbG9hZCgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGxldCBmYXN0U2Nyb2xsOiB7XHJcblx0XHRcdChzcGVlZD86IG51bWJlcik6IHZvaWQ7XHJcblx0XHRcdHNwZWVkPzogbnVtYmVyO1xyXG5cdFx0XHRhY3RpdmU/OiBib29sZWFuO1xyXG5cdFx0XHRvZmY/OiAoKSA9PiB2b2lkO1xyXG5cdFx0fSA9IGZ1bmN0aW9uIChzcGVlZCA9IDAuMjUpIHtcclxuXHRcdFx0aWYgKGZhc3RTY3JvbGwuYWN0aXZlKSBmYXN0U2Nyb2xsLm9mZigpO1xyXG5cdFx0XHRmYXN0U2Nyb2xsLmFjdGl2ZSA9IHRydWU7XHJcblx0XHRcdGZhc3RTY3JvbGwuc3BlZWQgPSBzcGVlZDtcclxuXHRcdFx0ZnVuY3Rpb24gb253aGVlbChldmVudDogTW91c2VFdmVudCAmIHsgd2hlZWxEZWx0YVk6IG51bWJlciB9KSB7XHJcblx0XHRcdFx0aWYgKGV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHJldHVybjtcclxuXHRcdFx0XHRpZiAoZXZlbnQuY3RybEtleSB8fCBldmVudC5zaGlmdEtleSkgcmV0dXJuO1xyXG5cdFx0XHRcdHNjcm9sbEJ5KDAsIC1NYXRoLnNpZ24oZXZlbnQud2hlZWxEZWx0YVkpICogaW5uZXJIZWlnaHQgKiBmYXN0U2Nyb2xsLnNwZWVkKTtcclxuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFkZEV2ZW50TGlzdGVuZXIoJ21vdXNld2hlZWwnLCBvbndoZWVsLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHRmYXN0U2Nyb2xsLm9mZiA9ICgpID0+IHtcclxuXHRcdFx0XHRmYXN0U2Nyb2xsLmFjdGl2ZSA9IGZhbHNlO1xyXG5cdFx0XHRcdHJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNld2hlZWwnLCBvbndoZWVsKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZmFzdFNjcm9sbC5hY3RpdmUgPSBmYWxzZTtcclxuXHRcdGZhc3RTY3JvbGwub2ZmID0gKCkgPT4geyB9O1xyXG5cclxuXHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIG9ucmFmKGY6ICgpID0+IHZvaWQpIHtcclxuXHRcdFx0bGV0IGxvb3AgPSB0cnVlO1xyXG5cdFx0XHR2b2lkIGFzeW5jIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHR3aGlsZSAobG9vcCkge1xyXG5cdFx0XHRcdFx0YXdhaXQgUHJvbWlzZS5mcmFtZSgpO1xyXG5cdFx0XHRcdFx0ZigpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSgpO1xyXG5cdFx0XHRyZXR1cm4gKCkgPT4geyBsb29wID0gZmFsc2UgfTtcclxuXHRcdH1cclxuXHJcblx0XHRsZXQgcmVzaXplT2JzZXJ2ZXI6IFJlc2l6ZU9ic2VydmVyO1xyXG5cdFx0bGV0IHJlc2l6ZUxpc3RlbmVyczogKChuZXdIZWlnaHQ6IG51bWJlciwgb2xkSGVpZ2h0OiBudW1iZXIpID0+IHZvaWQpW10gPSBbXTtcclxuXHRcdGxldCBwcmV2aW91c0JvZHlIZWlnaHQgPSAwO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIG9uaGVpZ2h0Y2hhbmdlKGY6IChuZXdIZWlnaHQ6IG51bWJlciwgb2xkSGVpZ2h0OiBudW1iZXIpID0+IHZvaWQpIHtcclxuXHRcdFx0aWYgKCFyZXNpemVPYnNlcnZlcikge1xyXG5cdFx0XHRcdHByZXZpb3VzQm9keUhlaWdodCA9IGRvY3VtZW50LmJvZHkuY2xpZW50SGVpZ2h0O1xyXG5cdFx0XHRcdHJlc2l6ZU9ic2VydmVyID0gbmV3IFJlc2l6ZU9ic2VydmVyKGVudHJpZXMgPT4ge1xyXG5cdFx0XHRcdFx0Zm9yIChsZXQgZSBvZiBlbnRyaWVzKSB7XHJcblx0XHRcdFx0XHRcdGlmIChlLnRhcmdldCAhPSBkb2N1bWVudC5ib2R5KSBjb250aW51ZTtcclxuXHJcblx0XHRcdFx0XHRcdGxldCBuZXdCb2R5SGVpZ2h0ID0gZS50YXJnZXQuY2xpZW50SGVpZ2h0O1xyXG5cdFx0XHRcdFx0XHRmb3IgKGxldCBmIG9mIHJlc2l6ZUxpc3RlbmVycykge1xyXG5cdFx0XHRcdFx0XHRcdGYobmV3Qm9keUhlaWdodCwgcHJldmlvdXNCb2R5SGVpZ2h0KTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRwcmV2aW91c0JvZHlIZWlnaHQgPSBuZXdCb2R5SGVpZ2h0O1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHJlc2l6ZU9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmVzaXplTGlzdGVuZXJzLnB1c2goZik7XHJcblx0XHRcdHJldHVybiBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcigpIHtcclxuXHRcdFx0XHRyZXNpemVMaXN0ZW5lcnMuc3BsaWNlKHJlc2l6ZUxpc3RlbmVycy5pbmRleE9mKGYpKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxufVxyXG5cclxuLy8gaW50ZXJmYWNlIFN0cmluZyB7XHJcbi8vIFx0aGFzaENvZGU6ICgpID0+IG51bWJlcjtcclxuLy8gfVxyXG4iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBGZXRjaEV4dGVuc2lvbiB7XHJcblx0XHRleHBvcnQgbGV0IGRlZmF1bHRzOiBSZXF1ZXN0SW5pdCA9IHsgY3JlZGVudGlhbHM6ICdpbmNsdWRlJyB9O1xyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWNoZWQodXJsOiBzdHJpbmcsIGluaXQ6IFJlcXVlc3RJbml0ID0ge30pOiBQcm9taXNlPFJlc3BvbnNlPiB7XHJcblx0XHRcdGxldCBjYWNoZSA9IGF3YWl0IGNhY2hlcy5vcGVuKCdmZXRjaCcpO1xyXG5cdFx0XHRsZXQgcmVzcG9uc2UgPSBhd2FpdCBjYWNoZS5tYXRjaCh1cmwpO1xyXG5cdFx0XHRpZiAocmVzcG9uc2UpIHtcclxuXHRcdFx0XHRyZXR1cm4gcmVzcG9uc2U7XHJcblx0XHRcdH1cclxuXHRcdFx0cmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHsgLi4uZGVmYXVsdHMsIC4uLmluaXQgfSk7XHJcblx0XHRcdGlmIChyZXNwb25zZS5vaykge1xyXG5cdFx0XHRcdGNhY2hlLnB1dCh1cmwsIHJlc3BvbnNlLmNsb25lKCkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiByZXNwb25zZTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBleHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FjaGVkRG9jKHVybDogc3RyaW5nKTogUHJvbWlzZTxEb2N1bWVudD4ge1xyXG5cdFx0Ly8gXHRsZXQgY2FjaGUgPSBhd2FpdCBjYWNoZXMub3BlbignZmV0Y2gnKTtcclxuXHRcdC8vIFx0bGV0IHJlc3BvbnNlID0gYXdhaXQgY2FjaGUubWF0Y2godXJsKTtcclxuXHRcdC8vIFx0aWYgKCFyZXNwb25zZSkge1xyXG5cdFx0Ly8gXHRcdHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7IGNyZWRlbnRpYWxzOiAnaW5jbHVkZScgfSk7XHJcblx0XHQvLyBcdFx0YXdhaXQgY2FjaGUucHV0KHVybCwgcmVzcG9uc2UuY2xvbmUoKSk7XHJcblx0XHQvLyBcdH1cclxuXHRcdC8vIFx0cmV0dXJuIGRvYyh1cmwpO1xyXG5cdFx0Ly8gfVxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWNoZWREb2ModXJsOiBzdHJpbmcsIGluaXQ6IFJlcXVlc3RJbml0ID0ge30pOiBQcm9taXNlPERvY3VtZW50PiB7XHJcblx0XHRcdGxldCByZXNwb25zZSA9IGF3YWl0IGNhY2hlZCh1cmwsIGluaXQpO1xyXG5cdFx0XHRsZXQgdGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcclxuXHRcdFx0bGV0IHBhcnNlciA9IG5ldyBET01QYXJzZXIoKTtcclxuXHRcdFx0bGV0IGRvYyA9IHBhcnNlci5wYXJzZUZyb21TdHJpbmcodGV4dCwgJ3RleHQvaHRtbCcpO1xyXG5cdFx0XHRsZXQgYmFzZSA9IGRvYy5jcmVhdGVFbGVtZW50KCdiYXNlJyk7XHJcblx0XHRcdGJhc2UuaHJlZiA9IHVybDtcclxuXHRcdFx0ZG9jLmhlYWQuYXBwZW5kKGJhc2UpO1xyXG5cdFx0XHRyZXR1cm4gZG9jO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWNoZWRKc29uKHVybDogc3RyaW5nLCBpbml0OiBSZXF1ZXN0SW5pdCA9IHt9KTogUHJvbWlzZTx1bmtub3duPiB7XHJcblx0XHRcdGxldCByZXNwb25zZSA9IGF3YWl0IGNhY2hlZCh1cmwsIGluaXQpO1xyXG5cdFx0XHRyZXR1cm4gcmVzcG9uc2UuanNvbigpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBkb2ModXJsOiBzdHJpbmcpOiBQcm9taXNlPERvY3VtZW50PiB7XHJcblx0XHRcdGxldCBwID0gUHJvbWlzZS5lbXB0eSgpO1xyXG5cdFx0XHRsZXQgb1JlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG5cdFx0XHRvUmVxLm9ubG9hZCA9IHAucjtcclxuXHRcdFx0b1JlcS5yZXNwb25zZVR5cGUgPSAnZG9jdW1lbnQnO1xyXG5cdFx0XHRvUmVxLm9wZW4oXCJnZXRcIiwgdXJsLCB0cnVlKTtcclxuXHRcdFx0b1JlcS5zZW5kKCk7XHJcblx0XHRcdGF3YWl0IHA7XHJcblx0XHRcdHJldHVybiBvUmVxLnJlc3BvbnNlWE1MO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBqc29uKHVybDogc3RyaW5nLCBpbml0OiBSZXF1ZXN0SW5pdCA9IHt9KTogUHJvbWlzZTx1bmtub3duPiB7XHJcblx0XHRcdHJldHVybiBmZXRjaCh1cmwsIHsgLi4uZGVmYXVsdHMsIC4uLmluaXQgfSkudGhlbihlID0+IGUuanNvbigpKTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgYXN5bmMgZnVuY3Rpb24gY2xlYXJDYWNoZSgpIHtcclxuXHRcdFx0cmV0dXJuIGNhY2hlcy5kZWxldGUoJ2ZldGNoJyk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cdGV4cG9ydCBjbGFzcyBPYnNlcnZlciB7XHJcblx0XHRcclxuXHR9XHJcbn1cclxuXHJcbi8qXHJcblxyXG5mdW5jdGlvbiBvYnNlcnZlQ2xhc3NBZGQoY2xzLCBjYikge1xyXG5cdGxldCBxdWV1ZWQgPSBmYWxzZTtcclxuXHRhc3luYyBmdW5jdGlvbiBydW4oKSB7XHJcblx0XHRpZiAocXVldWVkKSByZXR1cm47XHJcblx0XHRxdWV1ZWQgPSB0cnVlO1xyXG5cdFx0YXdhaXQgUHJvbWlzZS5mcmFtZSgpO1xyXG5cdFx0cXVldWVkID0gZmFsc2U7XHJcblx0XHRjYigpO1xyXG5cdH1cclxuXHRuZXcgTXV0YXRpb25PYnNlcnZlcihsaXN0ID0+IHtcclxuXHRcdGZvciAobGV0IG1yIG9mIGxpc3QpIHtcclxuXHRcdFx0aWYgKG1yLnR5cGUgPT0gJ2F0dHJpYnV0ZXMnICYmIG1yLmF0dHJpYnV0ZU5hbWUgPT0gJ2NsYXNzJykge1xyXG5cdFx0XHRcdGlmIChtci50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKGNscykpIHtcclxuXHRcdFx0XHRcdHJ1bigpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAobXIudHlwZSA9PSAnY2hpbGRMaXN0Jykge1xyXG5cdFx0XHRcdGZvciAobGV0IGNoIG9mIG1yLmFkZGVkTm9kZXMpIHtcclxuXHRcdFx0XHRcdGlmIChjaC5jbGFzc0xpc3Q/LmNvbnRhaW5zKGNscykpIHtcclxuXHRcdFx0XHRcdFx0cnVuKCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSkub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7XHJcblx0XHRjaGlsZExpc3Q6IHRydWUsXHJcblx0XHRhdHRyaWJ1dGVzOiB0cnVlLFxyXG5cdFx0c3VidHJlZTogdHJ1ZSxcclxuXHR9KTtcclxufVxyXG5cclxuKi8iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0dHlwZSBMaW5rID0gRWxlbWVudCB8IHN0cmluZyB8IGBodHRwJHtzdHJpbmd9YDtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBwYWdpbmF0ZSB7XHJcblx0XHRleHBvcnQgbGV0IGFjdGl2ZSA9IGZhbHNlO1xyXG5cdFx0ZXhwb3J0IGxldCBxdWV1ZWQgPSAwO1xyXG5cdFx0ZXhwb3J0IGxldCB3aXAgPSBmYWxzZTtcclxuXHRcdGV4cG9ydCBsZXQgZG9jOiBEb2N1bWVudDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBpbml0KCkge1xyXG5cdFx0XHRpZiAoYWN0aXZlKVxyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0YWN0aXZlID0gdHJ1ZTtcclxuXHJcblx0XHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZXZlbnQpID0+IHtcclxuXHRcdFx0XHRpZiAoZXZlbnQuYnV0dG9uICE9IDEpXHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0bGV0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBFbGVtZW50O1xyXG5cdFx0XHRcdGlmICh0YXJnZXQuY2xvc2VzdCgnYScpKVxyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdHRhcmdldC5lbWl0KCdwYWdpbmF0aW9ucmVxdWVzdCcsIGV2ZW50KTtcclxuXHRcdFx0XHRwYWdpbmF0aW9ucmVxdWVzdChldmVudCk7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChldmVudCkgPT4ge1xyXG5cdFx0XHRcdGlmIChldmVudC5jb2RlICE9ICdBbHRSaWdodCcpXHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHRsZXQgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIEVsZW1lbnQ7XHJcblx0XHRcdFx0dGFyZ2V0LmVtaXQoJ3BhZ2luYXRpb25yZXF1ZXN0JywgZXZlbnQpO1xyXG5cdFx0XHRcdHBhZ2luYXRpb25yZXF1ZXN0KGV2ZW50KTtcclxuXHRcdFx0fSk7XHJcblx0XHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdwYWdpbmF0aW9uZW5kJywgKGV2ZW50KSA9PiB7XHJcblx0XHRcdFx0d2lwID0gZmFsc2U7XHJcblx0XHRcdFx0aWYgKHF1ZXVlZCkge1xyXG5cdFx0XHRcdFx0cXVldWVkLS07XHJcblx0XHRcdFx0XHRydW4oKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHBhZ2luYXRpb25yZXF1ZXN0KGV2ZW50KSB7XHJcblx0XHRcdGdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xyXG5cdFx0XHRpZiAoZXZlbnQuc2hpZnRLZXkgfHwgZXZlbnQuZGV0YWlsPy5zaGlmdEtleVxyXG5cdFx0XHRcdHx8IGV2ZW50LmJ1dHRvbnMgPT0gMSkge1xyXG5cdFx0XHRcdHF1ZXVlZCArPSA5O1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICh3aXApIHtcclxuXHRcdFx0XHRxdWV1ZWQrKztcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0cnVuKCk7XHJcblx0XHR9XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcnVuKCkge1xyXG5cdFx0XHR3aXAgPSB0cnVlO1xyXG5cdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZW1pdCgncGFnaW5hdGlvbnN0YXJ0Jyk7XHJcblx0XHR9XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gb25ydW4oY29uZGl0aW9uLCBmbiA9IGNvbmRpdGlvbikge1xyXG5cdFx0XHRpbml0KCk7XHJcblx0XHRcdGlmICghY29uZGl0aW9uKSByZXR1cm47XHJcblx0XHRcdGNvbnNvbGUubG9nKCdwYWdpbmF0ZSByZWdpc3RlcmVkOicsIGZuKTtcclxuXHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncGFnaW5hdGlvbnN0YXJ0JywgZm4pO1xyXG5cdFx0fVxyXG5cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gb25SdW5PKGRhdGE6IHsgcHJlZmV0Y2g/OiBzdHJpbmcgfCBzdHJpbmdbXSwgY2xpY2s/OiBzdHJpbmcsIGFEb2M/OiBzdHJpbmcsIGFmdGVyTGFzdD86IHN0cmluZyB8IHN0cmluZ1tdLCByZXBsYWNlPzogc3RyaW5nIHwgc3RyaW5nW10gfSk7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gb25SdW5PKGNvbmRpdGlvbjogYW55LCBkYXRhOiB7IHByZWZldGNoPzogc3RyaW5nIHwgc3RyaW5nW10sIGNsaWNrPzogc3RyaW5nLCBhRG9jPzogc3RyaW5nLCBhZnRlckxhc3Q/OiBzdHJpbmcgfCBzdHJpbmdbXSwgcmVwbGFjZT86IHN0cmluZyB8IHN0cmluZ1tdIH0pO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIG9uUnVuTyhjb25kaXRpb246IGFueSwgZGF0YTogeyBwcmVmZXRjaD86IHN0cmluZyB8IHN0cmluZ1tdLCBjbGljaz86IHN0cmluZywgYURvYz86IHN0cmluZywgYWZ0ZXJMYXN0Pzogc3RyaW5nIHwgc3RyaW5nW10sIHJlcGxhY2U/OiBzdHJpbmcgfCBzdHJpbmdbXSB9ID0gY29uZGl0aW9uKSB7XHJcblx0XHRcdGlmICghY29uZGl0aW9uKSByZXR1cm47XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBtYWtlQXJyYXkoZGF0YTogc3RyaW5nIHwgc3RyaW5nW10gfCB1bmRlZmluZWQpOiBzdHJpbmdbXSB7XHJcblx0XHRcdFx0cmV0dXJuICFkYXRhID8gW10gOiBBcnJheS5pc0FycmF5KGRhdGEpID8gZGF0YSA6IFtkYXRhXTtcclxuXHRcdFx0fVxyXG5cdFx0XHRsZXQgZml4ZWREYXRhID0ge1xyXG5cdFx0XHRcdHByZWZldGNoOiBtYWtlQXJyYXkoZGF0YS5wcmVmZXRjaCksXHJcblx0XHRcdFx0YURvYzogZGF0YS5hRG9jLFxyXG5cdFx0XHRcdGNsaWNrOiBtYWtlQXJyYXkoZGF0YS5jbGljayksXHJcblx0XHRcdFx0YWZ0ZXJMYXN0OiBtYWtlQXJyYXkoZGF0YS5hZnRlckxhc3QpLFxyXG5cdFx0XHRcdHJlcGxhY2U6IG1ha2VBcnJheShkYXRhLnJlcGxhY2UpLFxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0Zml4ZWREYXRhLnByZWZldGNoLm1hcChlID0+IHByZWZldGNoKGUpKTtcclxuXHJcblx0XHRcdG9ucnVuKGFzeW5jICgpID0+IHtcclxuXHRcdFx0XHRmaXhlZERhdGEuY2xpY2subWFwKGUgPT4gcShlKT8uY2xpY2soKSk7XHJcblx0XHRcdFx0aWYgKGRhdGEuYURvYykge1xyXG5cdFx0XHRcdFx0YXdhaXQgYURvYyhkYXRhLmFEb2MpO1xyXG5cdFx0XHRcdFx0Zml4ZWREYXRhLmFmdGVyTGFzdC5tYXAoZSA9PiBhZnRlckxhc3QoZSkpO1xyXG5cdFx0XHRcdFx0Zml4ZWREYXRhLnJlcGxhY2UubWFwKGUgPT4gcmVwbGFjZShlKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVuZCgpO1xyXG5cdFx0XHR9KTtcclxuXHRcdFx0b25lbmQoKCkgPT4ge1xyXG5cdFx0XHRcdGZpeGVkRGF0YS5wcmVmZXRjaC5tYXAocHJlZmV0Y2gpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBvbmNoYW5nZShjb25kaXRpb24sIGZuID0gY29uZGl0aW9uKSB7XHJcblx0XHRcdGluaXQoKTtcclxuXHRcdFx0aWYgKCFjb25kaXRpb24pIHJldHVybjtcclxuXHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncGFnaW5hdGlvbmNoYW5nZScsIGZuKTtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBlbmQoKSB7XHJcblx0XHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5lbWl0KCdwYWdpbmF0aW9uZW5kJyk7XHJcblx0XHR9XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gb25lbmQoY29uZGl0aW9uLCBmbiA9IGNvbmRpdGlvbikge1xyXG5cdFx0XHRpZiAoIWNvbmRpdGlvbikgcmV0dXJuO1xyXG5cdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdwYWdpbmF0aW9uZW5kJywgZm4pO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHRvSHJlZihsaW5rOiBMaW5rKSB7XHJcblx0XHRcdGlmICh0eXBlb2YgbGluayA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdGlmIChsaW5rLnN0YXJ0c1dpdGgoJ2h0dHAnKSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGxpbms7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGxpbmsgPSBxKGxpbmspO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiAobGluayBhcyBIVE1MQW5jaG9yRWxlbWVudCkuaHJlZjtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiB0b0FuY2hvcihsaW5rOiBMaW5rKTogSFRNTEFuY2hvckVsZW1lbnQge1xyXG5cdFx0XHRpZiAodHlwZW9mIGxpbmsgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRpZiAobGluay5zdGFydHNXaXRoKCdodHRwJykpIHtcclxuXHRcdFx0XHRcdHJldHVybiBlbG0oYGFbaHJlZj0ke2xpbmt9XWApIGFzIEhUTUxBbmNob3JFbGVtZW50O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gcShsaW5rKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gbGluayBhcyBIVE1MQW5jaG9yRWxlbWVudDtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBhRG9jKGxpbms6IExpbmspIHtcclxuXHRcdFx0bGV0IGEgPSB0b0FuY2hvcihsaW5rKTtcclxuXHRcdFx0aWYgKCFhKSB0aHJvdyBuZXcgRXJyb3IoJ25vdCBhIGxpbmsnKTtcclxuXHRcdFx0YS5jbGFzc0xpc3QuYWRkKCdwYWdpbmF0ZS1zcGluJyk7XHJcblx0XHRcdGxldCBkb2MgPSBhd2FpdCBmZXRjaC5kb2MoYS5ocmVmKTtcclxuXHRcdFx0cGFnaW5hdGUuZG9jID0gZG9jO1xyXG5cdFx0XHRyZXR1cm4gZG9jO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFDYWNoZWREb2MobGluazogTGluaykge1xyXG5cdFx0XHRsZXQgYSA9IHRvQW5jaG9yKGxpbmspO1xyXG5cdFx0XHRpZiAoIWEpIHRocm93IG5ldyBFcnJvcignbm90IGEgbGluaycpO1xyXG5cdFx0XHRhLmNsYXNzTGlzdC5hZGQoJ3BhZ2luYXRlLXNwaW4nKTtcclxuXHRcdFx0bGV0IGRvYyA9IGF3YWl0IGZldGNoLmNhY2hlZC5kb2MoYS5ocmVmKTtcclxuXHRcdFx0YS5jbGFzc0xpc3QucmVtb3ZlKCdwYWdpbmF0ZS1zcGluJyk7XHJcblx0XHRcdHBhZ2luYXRlLmRvYyA9IGRvYztcclxuXHRcdFx0cmV0dXJuIGRvYztcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBhcHBlbmRDaGlsZHJlbihkb2MsIHNvdXJjZSwgdGFyZ2V0ID0gc291cmNlKSB7XHJcblx0XHRcdGlmICh0eXBlb2YgZG9jID09ICdzdHJpbmcnKVxyXG5cdFx0XHRcdHJldHVybiBhcHBlbmRDaGlsZHJlbihwYWdpbmF0ZS5kb2MsIGRvYywgc291cmNlKTtcclxuXHRcdFx0bGV0IGNoaWxkcmVuID0gWy4uLmRvYy5xKHNvdXJjZSkuY2hpbGRyZW5dO1xyXG5cdFx0XHRxKHRhcmdldCkuYXBwZW5kKC4uLmNoaWxkcmVuKTtcclxuXHRcdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmVtaXQoJ3BhZ2luYXRpb25jaGFuZ2UnLCBjaGlsZHJlbik7XHJcblx0XHRcdHJldHVybiBwYWdpbmF0ZTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gYWZ0ZXJMYXN0KGRvYzogRG9jdW1lbnQsIHNvdXJjZTogc3RyaW5nLCB0YXJnZXQ/OiBzdHJpbmcpOiB0eXBlb2YgcGFnaW5hdGU7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gYWZ0ZXJMYXN0KHNvdXJjZTogc3RyaW5nLCB0YXJnZXQ/OiBzdHJpbmcpOiB0eXBlb2YgcGFnaW5hdGU7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gYWZ0ZXJMYXN0KGRvYzogRG9jdW1lbnQgfCBzdHJpbmcsIHNvdXJjZTogc3RyaW5nLCB0YXJnZXQgPSBzb3VyY2UpOiB0eXBlb2YgcGFnaW5hdGUge1xyXG5cdFx0XHRpZiAodHlwZW9mIGRvYyA9PSAnc3RyaW5nJylcclxuXHRcdFx0XHRyZXR1cm4gYWZ0ZXJMYXN0KHBhZ2luYXRlLmRvYywgZG9jLCBzb3VyY2UpO1xyXG5cdFx0XHRsZXQgY2hpbGRyZW4gPSBkb2MucXEoc291cmNlKTtcclxuXHRcdFx0bGV0IGxhc3QgPSBxcSh0YXJnZXQpLnBvcCgpO1xyXG5cdFx0XHRsYXN0LmFmdGVyKC4uLmNoaWxkcmVuKTtcclxuXHRcdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmVtaXQoJ3BhZ2luYXRpb25jaGFuZ2UnLCBjaGlsZHJlbik7XHJcblx0XHRcdHJldHVybiBwYWdpbmF0ZTtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiByZXBsYWNlKGRvYzogRG9jdW1lbnQsIHNvdXJjZTogc3RyaW5nLCB0YXJnZXQ/OiBzdHJpbmcpOiB0eXBlb2YgcGFnaW5hdGU7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcmVwbGFjZShzb3VyY2U6IHN0cmluZywgdGFyZ2V0Pzogc3RyaW5nKTogdHlwZW9mIHBhZ2luYXRlO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHJlcGxhY2UoZG9jOiBEb2N1bWVudCB8IHN0cmluZywgc291cmNlOiBzdHJpbmcsIHRhcmdldCA9IHNvdXJjZSk6IHR5cGVvZiBwYWdpbmF0ZSB7XHJcblx0XHRcdGlmICh0eXBlb2YgZG9jID09ICdzdHJpbmcnKVxyXG5cdFx0XHRcdHJldHVybiByZXBsYWNlKHBhZ2luYXRlLmRvYywgZG9jLCBzb3VyY2UpO1xyXG5cdFx0XHRyZXR1cm4gcmVwbGFjZUVhY2goZG9jLCBzb3VyY2UsIHRhcmdldCk7IC8vICEhISBzaG91bGQgY2hlY2sgaWYgdGhpcyBvbmUgaXMgYWN0dWFsbHkgdXNlbGVzc1xyXG5cdFx0XHQvLyBsZXQgY2hpbGQgPSBkb2MucShzb3VyY2UpXHJcblx0XHRcdC8vIHEodGFyZ2V0KS5yZXBsYWNlV2l0aChjaGlsZCk7XHJcblx0XHRcdC8vIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5lbWl0KCdwYWdpbmF0aW9uY2hhbmdlJywgW2NoaWxkXSk7XHJcblx0XHRcdC8vIHJldHVybiBwYWdpbmF0ZTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcmVwbGFjZUVhY2goZG9jOiBEb2N1bWVudCwgc291cmNlOiBzdHJpbmcsIHRhcmdldD86IHN0cmluZyk6IHR5cGVvZiBwYWdpbmF0ZTtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiByZXBsYWNlRWFjaChzb3VyY2U6IHN0cmluZywgdGFyZ2V0Pzogc3RyaW5nKTogdHlwZW9mIHBhZ2luYXRlO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHJlcGxhY2VFYWNoKGRvYzogRG9jdW1lbnQgfCBzdHJpbmcsIHNvdXJjZTogc3RyaW5nLCB0YXJnZXQgPSBzb3VyY2UpOiB0eXBlb2YgcGFnaW5hdGUge1xyXG5cdFx0XHRpZiAodHlwZW9mIGRvYyA9PSAnc3RyaW5nJylcclxuXHRcdFx0XHRyZXR1cm4gcmVwbGFjZUVhY2gocGFnaW5hdGUuZG9jLCBkb2MsIHNvdXJjZSk7XHJcblx0XHRcdGxldCBjaGlsZHJlbiA9IGRvYy5xcShzb3VyY2UpO1xyXG5cdFx0XHRxcSh0YXJnZXQpLm1hcCgoZSwgaSkgPT4gZS5yZXBsYWNlV2l0aChjaGlsZHJlbltpXSkpO1xyXG5cdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZW1pdCgncGFnaW5hdGlvbmNoYW5nZScsIGNoaWxkcmVuKTtcclxuXHRcdFx0cmV0dXJuIHBhZ2luYXRlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBwcmVmZXRjaChlbmFibGVkOiBhbnksIGxpbms6IExpbmspOiBib29sZWFuO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHByZWZldGNoKGxpbms6IExpbmspOiBib29sZWFuO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHByZWZldGNoKGVuYWJsZWQ6IGFueSwgbGluazogc3RyaW5nIHwgRWxlbWVudCA9IGVuYWJsZWQpIHtcclxuXHRcdFx0aWYgKCFlbmFibGVkKSByZXR1cm4gZmFsc2U7XHJcblxyXG5cdFx0XHRlbG0oYGxpbmtbcmVsPVwicHJlZmV0Y2hcIl1baHJlZj1cIiR7dG9IcmVmKGxpbmspfVwiXWApLmFwcGVuZFRvKCdoZWFkJyk7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBsZXQgaW1hZ2VTY3JvbGxpbmdBY3RpdmUgPSBmYWxzZTtcclxuXHRcdGV4cG9ydCBsZXQgaW1nU2VsZWN0b3IgPSAnaW1nJztcclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gaW1hZ2VTY3JvbGxpbmcoc2VsZWN0b3I/OiBzdHJpbmcpIHtcclxuXHRcdFx0aWYgKGltYWdlU2Nyb2xsaW5nQWN0aXZlKSByZXR1cm47XHJcblx0XHRcdGlmIChzZWxlY3RvcikgaW1nU2VsZWN0b3IgPSBzZWxlY3RvcjtcclxuXHRcdFx0aW1hZ2VTY3JvbGxpbmdBY3RpdmUgPSB0cnVlO1xyXG5cdFx0XHRmdW5jdGlvbiBvbndoZWVsKGV2ZW50OiBNb3VzZUV2ZW50ICYgeyB3aGVlbERlbHRhWTogbnVtYmVyIH0pIHtcclxuXHRcdFx0XHRpZiAoZXZlbnQuc2hpZnRLZXkgfHwgZXZlbnQuY3RybEtleSkgcmV0dXJuO1xyXG5cdFx0XHRcdGlmIChzY3JvbGxXaG9sZUltYWdlKC1NYXRoLnNpZ24oZXZlbnQud2hlZWxEZWx0YVkpKSkge1xyXG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIG9ud2hlZWwsIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdHJldHVybiBpbWFnZVNjcm9sbGluZ09mZiA9ICgpID0+IHtcclxuXHRcdFx0XHRpbWFnZVNjcm9sbGluZ0FjdGl2ZSA9IGZhbHNlO1xyXG5cdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNld2hlZWwnLCBvbndoZWVsKTtcclxuXHRcdFx0fTtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBsZXQgaW1hZ2VTY3JvbGxpbmdPZmYgPSAoKSA9PiB7IH07XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGltZ1RvV2luZG93Q2VudGVyKGltZzogRWxlbWVudCkge1xyXG5cdFx0XHRsZXQgcmVjdCA9IGltZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHRcdFx0cmV0dXJuIChyZWN0LnRvcCArIHJlY3QuYm90dG9tKSAvIDIgLSBpbm5lckhlaWdodCAvIDI7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGdldEFsbEltYWdlSW5mbygpIHtcclxuXHRcdFx0bGV0IGltYWdlcyA9IHFxKGltZ1NlbGVjdG9yKSBhcyBIVE1MSW1hZ2VFbGVtZW50W107XHJcblx0XHRcdGxldCBkYXRhcyA9IGltYWdlcy5tYXAoKGltZywgaW5kZXgpID0+IHtcclxuXHRcdFx0XHRsZXQgcmVjdCA9IGltZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0aW1nLCByZWN0LCBpbmRleCxcclxuXHRcdFx0XHRcdGluU2NyZWVuOiByZWN0LnRvcCA+PSAtMSAmJiByZWN0LmJvdHRvbSA8PSBpbm5lckhlaWdodCxcclxuXHRcdFx0XHRcdGNyb3NzU2NyZWVuOiByZWN0LmJvdHRvbSA+PSAxICYmIHJlY3QudG9wIDw9IGlubmVySGVpZ2h0IC0gMSxcclxuXHRcdFx0XHRcdHlUb1NjcmVlbkNlbnRlcjogKHJlY3QudG9wICsgcmVjdC5ib3R0b20pIC8gMiAtIGlubmVySGVpZ2h0IC8gMixcclxuXHRcdFx0XHRcdGlzSW5DZW50ZXI6IE1hdGguYWJzKChyZWN0LnRvcCArIHJlY3QuYm90dG9tKSAvIDIgLSBpbm5lckhlaWdodCAvIDIpIDwgMyxcclxuXHRcdFx0XHRcdGlzU2NyZWVuSGVpZ2h0OiBNYXRoLmFicyhyZWN0LmhlaWdodCAtIGlubmVySGVpZ2h0KSA8IDMsXHJcblx0XHRcdFx0fTtcclxuXHRcdFx0fSk7XHJcblx0XHRcdHJldHVybiBkYXRhcztcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgbGV0IHNjcm9sbFdob2xlSW1hZ2VQZW5kaW5nID0gZmFsc2U7XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGdldENlbnRyYWxJbWcoKSB7XHJcblx0XHRcdHJldHVybiBnZXRBbGxJbWFnZUluZm8oKS52c29ydChlID0+IE1hdGguYWJzKGUueVRvU2NyZWVuQ2VudGVyKSlbMF0/LmltZztcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBzY3JvbGxXaG9sZUltYWdlKGRpciA9IDEpIHtcclxuXHRcdFx0aWYgKHNjcm9sbFdob2xlSW1hZ2VQZW5kaW5nKSByZXR1cm4gdHJ1ZTtcclxuXHJcblx0XHRcdGRpciA9IE1hdGguc2lnbihkaXIpO1xyXG5cdFx0XHRsZXQgZGF0YXMgPSBnZXRBbGxJbWFnZUluZm8oKTtcclxuXHRcdFx0bGV0IGNlbnRyYWwgPSBkYXRhcy52c29ydChlID0+IE1hdGguYWJzKGUueVRvU2NyZWVuQ2VudGVyKSlbMF07XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBzY3JvbGxUb0ltYWdlKGRhdGE6IHR5cGVvZiBjZW50cmFsIHwgdW5kZWZpbmVkKTogYm9vbGVhbiB7XHJcblx0XHRcdFx0aWYgKCFkYXRhKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0aWYgKHNjcm9sbFkgKyBkYXRhLnlUb1NjcmVlbkNlbnRlciA8PSAwICYmIHNjcm9sbFkgPD0gMCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoZGF0YS5pc1NjcmVlbkhlaWdodCkge1xyXG5cdFx0XHRcdFx0ZGF0YS5pbWcuc2Nyb2xsSW50b1ZpZXcoKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0c2Nyb2xsVG8oc2Nyb2xsWCwgc2Nyb2xsWSArIGRhdGEueVRvU2NyZWVuQ2VudGVyKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0c2Nyb2xsV2hvbGVJbWFnZVBlbmRpbmcgPSB0cnVlO1xyXG5cdFx0XHRcdFByb21pc2UucmFmKDIpLnRoZW4oKCkgPT4gc2Nyb2xsV2hvbGVJbWFnZVBlbmRpbmcgPSBmYWxzZSk7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIGlmIG5vIGltYWdlcywgZG9uJ3Qgc2Nyb2xsO1xyXG5cdFx0XHRpZiAoIWNlbnRyYWwpIHJldHVybiBmYWxzZTtcclxuXHJcblx0XHRcdC8vIGlmIGN1cnJlbnQgaW1hZ2UgaXMgb3V0c2lkZSB2aWV3LCBkb24ndCBzY3JvbGxcclxuXHRcdFx0aWYgKCFjZW50cmFsLmNyb3NzU2NyZWVuKSByZXR1cm4gZmFsc2U7XHJcblxyXG5cdFx0XHQvLyBpZiBjdXJyZW50IGltYWdlIGlzIGluIGNlbnRlciwgc2Nyb2xsIHRvIHRoZSBuZXh0IG9uZVxyXG5cdFx0XHRpZiAoY2VudHJhbC5pc0luQ2VudGVyKSB7XHJcblx0XHRcdFx0cmV0dXJuIHNjcm9sbFRvSW1hZ2UoZGF0YXNbZGF0YXMuaW5kZXhPZihjZW50cmFsKSArIGRpcl0pO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBpZiB0byBzY3JvbGwgdG8gY3VycmVudCBpbWFnZSB5b3UgaGF2ZSB0byBzY3JvbGwgaW4gb3Bwb3NpZGUgZGlyZWN0aW9uLCBzY3JvbGwgdG8gbmV4dCBvbmVcclxuXHRcdFx0aWYgKE1hdGguc2lnbihjZW50cmFsLnlUb1NjcmVlbkNlbnRlcikgIT0gZGlyKSB7XHJcblx0XHRcdFx0cmV0dXJuIHNjcm9sbFRvSW1hZ2UoZGF0YXNbZGF0YXMuaW5kZXhPZihjZW50cmFsKSArIGRpcl0pO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBpZiBjdXJyZW50IGltYWdlIGlzIGZpcnN0L2xhc3QsIGRvbid0IHNjcm9sbCBvdmVyIDI1dmggdG8gaXRcclxuXHRcdFx0aWYgKGRpciA9PSAxICYmIGNlbnRyYWwuaW5kZXggPT0gMCAmJiBjZW50cmFsLnlUb1NjcmVlbkNlbnRlciA+IGlubmVySGVpZ2h0IC8gMikge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoZGlyID09IC0xICYmIGNlbnRyYWwuaW5kZXggPT0gZGF0YXMubGVuZ3RoIC0gMSAmJiBjZW50cmFsLnlUb1NjcmVlbkNlbnRlciA8IC1pbm5lckhlaWdodCAvIDIpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBzY3JvbGxUb0ltYWdlKGNlbnRyYWwpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vQXJyYXkudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9EYXRlTm93SGFjay50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL0VsZW1lbnQudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9lbG0udHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9FbnRyeUZpbHRlci50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL0VudHJ5RmlsdGVyMi50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2V0Yy50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2ZldGNoLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vT2JqZWN0LnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vb2JzZXJ2ZXIudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9wYWdpbmF0ZS50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL1Byb21pc2UudHNcIiAvPlxyXG5cclxuXHJcblxyXG5cclxuXHJcbm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gX19pbml0X18od2luZG93OiBXaW5kb3cpOiBcImluaXRlZFwiIHwgXCJhbHJlYWR5IGluaXRlZFwiIHtcclxuXHRcdGlmICghd2luZG93KSB3aW5kb3cgPSBnbG9iYWxUaGlzLndpbmRvdyBhcyBXaW5kb3c7XHJcblxyXG5cdFx0d2luZG93LmVsbSA9IEVsbS5lbG07XHJcblx0XHR3aW5kb3cucSA9IFF1ZXJ5U2VsZWN0b3IuV2luZG93US5xO1xyXG5cdFx0d2luZG93LnFxID0gUXVlcnlTZWxlY3Rvci5XaW5kb3dRLnFxO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKEVsZW1lbnQucHJvdG90eXBlLCAncScsIFF1ZXJ5U2VsZWN0b3IuRWxlbWVudFEucSk7XHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoRWxlbWVudC5wcm90b3R5cGUsICdxcScsIFF1ZXJ5U2VsZWN0b3IuRWxlbWVudFEucXEpO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKEVsZW1lbnQucHJvdG90eXBlLCAnYXBwZW5kVG8nLCBFbGVtZW50RXh0ZW5zaW9uLmFwcGVuZFRvKTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShFbGVtZW50LnByb3RvdHlwZSwgJ2VtaXQnLCBFbGVtZW50RXh0ZW5zaW9uLmVtaXQpO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKERvY3VtZW50LnByb3RvdHlwZSwgJ3EnLCBRdWVyeVNlbGVjdG9yLkRvY3VtZW50US5xKTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShEb2N1bWVudC5wcm90b3R5cGUsICdxcScsIFF1ZXJ5U2VsZWN0b3IuRG9jdW1lbnRRLnFxKTtcclxuXHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoUHJvbWlzZSwgJ2VtcHR5JywgUHJvbWlzZUV4dGVuc2lvbi5lbXB0eSk7XHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoUHJvbWlzZSwgJ2ZyYW1lJywgUHJvbWlzZUV4dGVuc2lvbi5mcmFtZSk7XHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoUHJvbWlzZSwgJ3JhZicsIFByb21pc2VFeHRlbnNpb24uZnJhbWUpO1xyXG5cclxuXHRcdHdpbmRvdy5mZXRjaC5jYWNoZWQgPSBGZXRjaEV4dGVuc2lvbi5jYWNoZWQgYXMgYW55O1xyXG5cdFx0d2luZG93LmZldGNoLmRvYyA9IEZldGNoRXh0ZW5zaW9uLmRvYyBhcyBhbnk7XHJcblx0XHR3aW5kb3cuZmV0Y2guanNvbiA9IEZldGNoRXh0ZW5zaW9uLmpzb24gYXMgYW55O1xyXG5cdFx0d2luZG93LmZldGNoLmNhY2hlZC5kb2MgPSBGZXRjaEV4dGVuc2lvbi5jYWNoZWREb2M7XHJcblx0XHR3aW5kb3cuZmV0Y2guZG9jLmNhY2hlZCA9IEZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYztcclxuXHRcdHdpbmRvdy5mZXRjaC5jYWNoZWREb2MgPSBGZXRjaEV4dGVuc2lvbi5jYWNoZWREb2M7XHJcblx0XHR3aW5kb3cuZmV0Y2guanNvbi5jYWNoZWQgPSBGZXRjaEV4dGVuc2lvbi5jYWNoZWRKc29uO1xyXG5cdFx0d2luZG93LmZldGNoLmNhY2hlZC5qc29uID0gRmV0Y2hFeHRlbnNpb24uY2FjaGVkSnNvbjtcclxuXHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoT2JqZWN0LCAnZGVmaW5lVmFsdWUnLCBPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUpO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKE9iamVjdCwgJ2RlZmluZUdldHRlcicsIE9iamVjdEV4dGVuc2lvbi5kZWZpbmVHZXR0ZXIpO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKE9iamVjdCwgJ21hcCcsIE9iamVjdEV4dGVuc2lvbi5tYXApO1xyXG5cclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShBcnJheSwgJ21hcCcsIEFycmF5RXh0ZW5zaW9uLm1hcCk7XHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoQXJyYXkucHJvdG90eXBlLCAncG1hcCcsIEFycmF5RXh0ZW5zaW9uLnBtYXApO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKEFycmF5LnByb3RvdHlwZSwgJ3Zzb3J0JywgQXJyYXlFeHRlbnNpb24udnNvcnQpO1xyXG5cclxuXHRcdHdpbmRvdy5wYWdpbmF0ZSA9IFBvb3BKcy5wYWdpbmF0ZTtcclxuXHRcdHdpbmRvdy5EYXRlTm93SGFjayA9IFBvb3BKcy5EYXRlTm93SGFjay5EYXRlTm93SGFjaztcclxuXHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUod2luZG93LCAnX19pbml0X18nLCAnYWxyZWFkeSBpbml0ZWQnKTtcclxuXHRcdHJldHVybiAnaW5pdGVkJztcclxuXHR9XHJcblxyXG5cdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVHZXR0ZXIod2luZG93LCAnX19pbml0X18nLCAoKSA9PiBfX2luaXRfXyh3aW5kb3cpKTtcclxuXHJcblx0aWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2UuX19pbml0X18pIHtcclxuXHRcdHdpbmRvdy5fX2luaXRfXztcclxuXHR9XHJcblxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblx0ZXhwb3J0IHR5cGUgVmFsdWVPZjxUPiA9IFRba2V5b2YgVF07XHJcblx0ZXhwb3J0IHR5cGUgTWFwcGVkT2JqZWN0PFQsIFY+ID0ge1tQIGluIGtleW9mIFRdOiBWfTtcclxufVxyXG5cclxuXHJcbmRlY2xhcmUgY29uc3QgX19pbml0X186IFwiaW5pdGVkXCIgfCBcImFscmVhZHkgaW5pdGVkXCI7XHJcbmRlY2xhcmUgY29uc3QgZWxtOiB0eXBlb2YgUG9vcEpzLkVsbS5lbG07XHJcbmRlY2xhcmUgY29uc3QgcTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLldpbmRvd1EucTtcclxuZGVjbGFyZSBjb25zdCBxcTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLldpbmRvd1EucXE7XHJcbmRlY2xhcmUgY29uc3QgcGFnaW5hdGU6IHR5cGVvZiBQb29wSnMucGFnaW5hdGU7XHJcbmRlY2xhcmUgY29uc3QgRGF0ZU5vd0hhY2s6IHR5cGVvZiBQb29wSnMuRGF0ZU5vd0hhY2suRGF0ZU5vd0hhY2s7XHJcbmRlY2xhcmUgbmFtZXNwYWNlIGZldGNoIHtcclxuXHRleHBvcnQgY29uc3QgY2FjaGVkOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZCAmIHsgZG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYywganNvbjogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5jYWNoZWRKc29uIH07XHJcblx0ZXhwb3J0IGNvbnN0IGRvYzogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5kb2MgJiB7IGNhY2hlZDogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5jYWNoZWREb2MgfTtcclxuXHRleHBvcnQgY29uc3QgY2FjaGVkRG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYztcclxuXHRleHBvcnQgY29uc3QganNvbjogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5qc29uICYge2NhY2hlZDp0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZEpzb24gfTtcclxufVxyXG5cclxuaW50ZXJmYWNlIFdpbmRvdyB7XHJcblx0cmVhZG9ubHkgX19pbml0X186IFwiaW5pdGVkXCIgfCBcImFscmVhZHkgaW5pdGVkXCI7XHJcblx0ZWxtOiB0eXBlb2YgUG9vcEpzLkVsbS5lbG07XHJcblx0cTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLldpbmRvd1EucTtcclxuXHRxcTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLldpbmRvd1EucXE7XHJcblx0cGFnaW5hdGU6IHR5cGVvZiBQb29wSnMucGFnaW5hdGU7XHJcblx0RGF0ZU5vd0hhY2s6IHR5cGVvZiBQb29wSnMuRGF0ZU5vd0hhY2suRGF0ZU5vd0hhY2s7XHJcblx0ZmV0Y2g6IHtcclxuXHRcdChpbnB1dDogUmVxdWVzdEluZm8sIGluaXQ/OiBSZXF1ZXN0SW5pdCk6IFByb21pc2U8UmVzcG9uc2U+O1xyXG5cdFx0Y2FjaGVkOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZCAmIHsgZG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYywganNvbjogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5jYWNoZWRKc29uIH07XHJcblx0XHRkb2M6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uZG9jICYgeyBjYWNoZWQ6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkRG9jIH07XHJcblx0XHRjYWNoZWREb2M6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkRG9jO1xyXG5cdFx0anNvbjogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5qc29uICYge2NhY2hlZDp0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZEpzb24gfTtcclxuXHR9XHJcbn1cclxuXHJcbmludGVyZmFjZSBFbGVtZW50IHtcclxuXHRxOiB0eXBlb2YgUG9vcEpzLlF1ZXJ5U2VsZWN0b3IuRWxlbWVudFEucTtcclxuXHRxcTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLkVsZW1lbnRRLnFxO1xyXG5cdGFwcGVuZFRvOiB0eXBlb2YgUG9vcEpzLkVsZW1lbnRFeHRlbnNpb24uYXBwZW5kVG87XHJcblx0ZW1pdDogdHlwZW9mIFBvb3BKcy5FbGVtZW50RXh0ZW5zaW9uLmVtaXQ7XHJcbn1cclxuXHJcbmludGVyZmFjZSBEb2N1bWVudCB7XHJcblx0cTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLkRvY3VtZW50US5xO1xyXG5cdHFxOiB0eXBlb2YgUG9vcEpzLlF1ZXJ5U2VsZWN0b3IuRG9jdW1lbnRRLnFxO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgT2JqZWN0Q29uc3RydWN0b3Ige1xyXG5cdGRlZmluZVZhbHVlOiB0eXBlb2YgUG9vcEpzLk9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZTtcclxuXHRkZWZpbmVHZXR0ZXI6IHR5cGVvZiBQb29wSnMuT2JqZWN0RXh0ZW5zaW9uLmRlZmluZUdldHRlcjtcclxuXHRtYXA6IHR5cGVvZiBQb29wSnMuT2JqZWN0RXh0ZW5zaW9uLm1hcDtcclxufVxyXG5pbnRlcmZhY2UgUHJvbWlzZUNvbnN0cnVjdG9yIHtcclxuXHRlbXB0eTogdHlwZW9mIFBvb3BKcy5Qcm9taXNlRXh0ZW5zaW9uLmVtcHR5O1xyXG5cdGZyYW1lOiB0eXBlb2YgUG9vcEpzLlByb21pc2VFeHRlbnNpb24uZnJhbWU7XHJcblx0cmFmOiB0eXBlb2YgUG9vcEpzLlByb21pc2VFeHRlbnNpb24uZnJhbWU7XHJcbn1cclxuXHJcbmludGVyZmFjZSBBcnJheTxUPiB7XHJcblx0dnNvcnQ6IHR5cGVvZiBQb29wSnMuQXJyYXlFeHRlbnNpb24udnNvcnQ7XHJcblx0cG1hcDogdHlwZW9mIFBvb3BKcy5BcnJheUV4dGVuc2lvbi5wbWFwO1xyXG59XHJcbmludGVyZmFjZSBBcnJheUNvbnN0cnVjdG9yIHtcclxuXHRtYXA6IHR5cGVvZiBQb29wSnMuQXJyYXlFeHRlbnNpb24ubWFwO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgRGF0ZUNvbnN0cnVjdG9yIHtcclxuXHRfbm93KCk6IG51bWJlcjtcclxufVxyXG5pbnRlcmZhY2UgRGF0ZSB7XHJcblx0X2dldFRpbWUoKTogbnVtYmVyO1xyXG59Il19