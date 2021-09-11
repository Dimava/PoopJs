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
            function q(selector) {
                return document.querySelector(selector);
            }
            WindowQ.q = q;
            function qq(selector) {
                return [...document.querySelectorAll(selector)];
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
        /** if `elm` should disallow listeners not existing as `on * ` property on the element */
        Elm.allowOnlyExistingListeners = true;
        /** if `elm` should allow overriding `on * ` listeners if multiple of them are provided */
        Elm.allowOverrideOnListeners = false;
        function elm(selector = '', ...children) {
            if (selector.replaceAll(elmRegex, '') != '') {
                throw new Error(`invalid selector: ${selector} `);
            }
            let element = document.createElement('div');
            // let tag = '';
            // let firstMatch = false;
            for (let match of selector.matchAll(elmRegex)) {
                if (match.groups.tag) {
                    // if (tag && match.groups.tag != tag) {
                    // 	throw new Error(`selector has two different tags at once : <${tag}> and <${match.groups.tag}>`);
                    // }
                    // tag = match.groups.tag;
                    // if (!firstMatch) return elm(tag + selector, ...children);
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
                // firstMatch = false;
            }
            for (let listener of children.filter(e => typeof e == 'function')) {
                let name = listener.name;
                if (!name)
                    name = (listener + '').match(/\b(?!function\b)\w+/)[0];
                if (!name)
                    throw new Error('trying to bind unnamed function');
                if (name.startsWith('bound '))
                    name = name.slice('bound '.length);
                if (name.startsWith('on')) {
                    if (!element.hasOwnProperty(name))
                        throw new Error(`< ${element.tagName.toLowerCase()}> does not have "${name}" listener`);
                    if (!Elm.allowOverrideOnListeners && element[name])
                        throw new Error('overriding `on * ` listeners is disabled');
                    element[name] = listener;
                }
                else {
                    if (Elm.allowOnlyExistingListeners && element['on' + name] === undefined)
                        throw new Error(`<${element.tagName.toLowerCase()}> does not have "on'${name}'" listener`);
                    element.addEventListener(name, listener);
                }
            }
            element.append(...children.filter(e => typeof e != 'function'));
            return element;
        }
        Elm.elm = elm;
        function qOrElm(selector, parent) {
            if (typeof parent == 'string') {
                parent = document.querySelector(parent);
                if (!parent)
                    throw new Error('failed to find parent element');
            }
            if (selector.includes('>')) {
                let parentSelector = selector.split('>').slice(0, -1).join('>');
                selector = selector.split('>').pop();
                parent = (parent || document).querySelector(parentSelector);
                if (!parent)
                    throw new Error('failed to find parent element');
            }
            let child = (parent || document).querySelector(selector);
            if (child)
                return child;
            child = elm(selector);
            parent?.append(child);
            return child;
        }
        Elm.qOrElm = qOrElm;
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
            let central = PoopJs.ImageScrollingExtension.imageScrollingActive && PoopJs.ImageScrollingExtension.getCentralImg();
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
                response.cachedAt = +response.headers.get('cached-at') || 0;
                return response;
            }
            response = await fetch(url, { ...FetchExtension.defaults, ...init });
            if (response.ok) {
                response.cachedAt = Date.now();
                let clone = response.clone();
                let init = {
                    status: clone.status, statusText: clone.statusText,
                    headers: [['cached-at', `${response.cachedAt}`], ...clone.headers.entries()]
                };
                let resultResponse = new Response(clone.body, init);
                cache.put(url, resultResponse);
            }
            return response;
        }
        FetchExtension.cached = cached;
        async function cachedDoc(url, init = {}) {
            let response = await cached(url, init);
            let text = await response.text();
            let parser = new DOMParser();
            let doc = parser.parseFromString(text, 'text/html');
            let base = doc.createElement('base');
            base.href = url;
            doc.head.append(base);
            doc.cachedAt = response.cachedAt;
            return doc;
        }
        FetchExtension.cachedDoc = cachedDoc;
        async function cachedJson(url, init = {}) {
            let response = await cached(url, init);
            let json = await response.json();
            if (!('cached' in json)) {
                PoopJs.ObjectExtension.defineValue(json, 'cached', response.cachedAt);
            }
            return json;
        }
        FetchExtension.cachedJson = cachedJson;
        async function doc(url) {
            let p = PoopJs.PromiseExtension.empty();
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
    let EntryFiltererExtension;
    (function (EntryFiltererExtension) {
        /**
         * can be either Map or WeakMap
         * (WeakMap is likely to be useless if there are less then 10k old nodes in map)
         */
        let MapType = Map;
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
                document.addEventListener('paginationmodify', () => this.requestUpdate());
                PoopJs.etc.onheightchange(() => this.requestUpdate());
            }
            entries = [];
            entryDatas = new MapType();
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
            addItem(constructor, list, data, source) {
                Object.assign(data, source, { parent: this });
                data.name ??= data.id;
                let item = new constructor(data);
                list.push(item);
                return item;
            }
            filters = [];
            sorters = [];
            modifiers = [];
            addFilter(id, filter, data = {}) {
                return this.addItem(EntryFiltererExtension.Filter, this.filters, data, { id, filter });
            }
            addVFilter(id, filter, data) {
                if (typeof data != 'object' || !data) {
                    data = { input: data };
                }
                return this.addItem(EntryFiltererExtension.ValueFilter, this.filters, data, { id, filter });
            }
            addSorter(id, sorter, data = {}) {
                return this.addItem(EntryFiltererExtension.Sorter, this.sorters, data, { id, sorter });
            }
            addModifier(id, modifier, data = {}) {
                return this.addItem(EntryFiltererExtension.Modifier, this.modifiers, data, { id, modifier });
            }
            addPrefix(id, prefix, data = {}) {
                return this.addItem(EntryFiltererExtension.Prefixer, this.modifiers, data, { id, prefix });
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
            orderedEntries = [];
            sortEntries() {
                if (this.entries.length == 0)
                    return;
                if (this.orderedEntries.length == 0)
                    this.orderedEntries = this.entries;
                let entries = this.entries;
                let pairs = entries.map(e => [this.getData(e), e]);
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
                let pairs = entries.map(e => [e, this.getData(e)]);
                for (let modifier of this.modifiers) {
                    for (let [e, d] of pairs) {
                        modifier.apply(d, e);
                    }
                }
            }
            moveToTop(item) {
                if (this.sorters.includes(item)) {
                    this.sorters.splice(this.sorters.indexOf(item), 1);
                    this.sorters.push(item);
                }
                if (this.modifiers.includes(item)) {
                    this.modifiers.splice(this.modifiers.indexOf(item), 1);
                    this.modifiers.push(item);
                }
            }
            update(reparse = this.reparsePending) {
                this.updatePending = false;
                if (this.disabled)
                    return;
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
        EntryFiltererExtension.EntryFilterer = EntryFilterer;
        function IsPromise(p) {
            if (!p)
                return false;
            return typeof p.then == 'function';
        }
    })(EntryFiltererExtension = PoopJs.EntryFiltererExtension || (PoopJs.EntryFiltererExtension = {}));
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
    let PaginateExtension;
    (function (PaginateExtension) {
        class Paginate {
            doc;
            enabled = true;
            condition;
            queued = 0;
            running = false;
            _inited = false;
            static shiftRequestCount = 10;
            static _inited = false;
            static removeDefaultRunBindings;
            static addDefaultRunBindings() {
                Paginate.removeDefaultRunBindings?.();
                function onmousedown(event) {
                    if (event.button != 1)
                        return;
                    let target = event.target;
                    if (target?.closest('a'))
                        return;
                    event.preventDefault();
                    let count = event.shiftKey ? Paginate.shiftRequestCount : 1;
                    Paginate.requestPagination(count, event, target);
                }
                function onkeydown(event) {
                    if (event.code != 'AltRight')
                        return;
                    event.preventDefault();
                    let count = event.shiftKey ? Paginate.shiftRequestCount : 1;
                    let target = event.target;
                    Paginate.requestPagination(count, event, target);
                }
                document.addEventListener('mousedown', onmousedown);
                document.addEventListener('keydown', onkeydown);
                Paginate.removeDefaultRunBindings = () => {
                    document.removeEventListener('mousedown', onmousedown);
                    document.removeEventListener('keydown', onkeydown);
                };
            }
            // listeners
            init() {
                if (!Paginate.removeDefaultRunBindings) {
                    Paginate.addDefaultRunBindings();
                }
                if (this._inited)
                    return;
                document.addEventListener('paginationrequest', this.onPaginationRequest.bind(this));
                document.addEventListener('paginationend', this.onPaginationEnd.bind(this));
            }
            onPaginationRequest(event) {
                if (this.canConsumeRequest()) {
                    event.detail.consumed++;
                    this.queued += event.detail.count;
                }
                if (!this.running && this.queued) {
                    this.consumeRequest();
                }
            }
            ;
            onPaginationEnd(event) {
                if (this.queued && this.canConsumeRequest()) {
                    requestAnimationFrame(() => {
                        if (!this.canConsumeRequest()) {
                            console.warn(`this paginate can not work anymore`);
                            this.queued = 0;
                        }
                        else {
                            this.consumeRequest();
                        }
                    });
                }
            }
            canConsumeRequest() {
                if (!this.enabled)
                    return false;
                if (this.running)
                    return true;
                if (this.condition) {
                    if (typeof this.condition == 'function') {
                        if (!this.condition())
                            return false;
                    }
                    else {
                        if (!document.q(this.condition))
                            return false;
                    }
                }
                return true;
            }
            async consumeRequest() {
                if (this.running)
                    return;
                this.queued--;
                this.running = true;
                this.emitStart();
                await this.onrun?.();
                this.running = false;
                this.emitEnd();
            }
            onrun;
            // emitters
            static requestPagination(count = 1, reason, target = document.body) {
                let detail = { count, reason, consumed: 0 };
                function fail(event) {
                    if (event.detail.consumed == 0) {
                        console.warn(`Pagination request failed: no listeners`);
                    }
                    removeEventListener('paginationrequest', fail);
                }
                addEventListener('paginationrequest', fail);
                target.emit('paginationrequest', { count, reason, consumed: 0 });
            }
            emitStart() {
                document.body.emit('paginationstart', { paginate: this });
            }
            emitModify(added, removed, selector) {
                document.body.emit('paginationmodify', { paginate: this, added, removed, selector });
            }
            emitEnd() {
                document.body.emit('paginationend', { paginate: this });
            }
            // fetching: 
            async fetchDocument(link, spinner = true) {
                this.doc = null;
                let a = spinner && Paginate.linkToAnchor(link);
                a?.classList.add('paginate-spin');
                link = Paginate.linkToUrl(link);
                this.doc = await fetch.doc(link);
                a?.classList.remove('paginate-spin');
                return this.doc;
            }
            async fetchCachedDocument(link, spinner = true) {
                this.doc = null;
                let a = spinner && Paginate.linkToAnchor(link);
                a?.classList.add('paginate-spin');
                link = Paginate.linkToUrl(link);
                this.doc = await fetch.cached.doc(link);
                a?.classList.remove('paginate-spin');
                return this.doc;
            }
            prefetch(source) {
                document.qq(source).map(e => {
                    if (e.href) {
                        elm(`link[rel="prefetch"][href="${e.href}"]`).appendTo('head');
                    }
                    // TODO: if e.src
                });
            }
            // modification: 
            after(source, target = source) {
                let added = this.doc.qq(source);
                if (!added.length)
                    return;
                let found = document.qq(target);
                if (found.length == 0)
                    throw new Error(`failed to find where to append`);
                found.pop().after(...added);
                this.emitModify(added, [], source);
            }
            replaceEach(source, target = source) {
                let added = this.doc.qq(source);
                let removed = document.qq(target);
                if (added.length != removed.length)
                    throw new Error(`added/removed count mismatch`);
                removed.map((e, i) => e.replaceWith(added[i]));
                this.emitModify(added, removed, source);
            }
            replace(source, target = source) {
                let added = this.doc.qq(source);
                let removed = document.qq(target);
                if (added.length != removed.length)
                    throw new Error(`not implemented`);
                return this.replaceEach(source, target);
            }
            // util
            static linkToUrl(link) {
                if (typeof link == 'string') {
                    if (link.startsWith('http'))
                        return link;
                    link = document.q(link);
                }
                return link.href;
            }
            static linkToAnchor(link) {
                if (typeof link == 'string') {
                    if (link.startsWith('http'))
                        return null;
                    return document.q(link);
                }
                return link;
            }
            static staticCall(data) {
                let p = new Paginate();
                p.staticCall(data);
                return p;
            }
            staticCall(data) {
                function toArray(v) {
                    if (Array.isArray(v))
                        return v;
                    if (v == null)
                        return [];
                    return [v];
                }
                function toCondition(s) {
                    if (!s)
                        return () => true;
                    if (typeof s == 'string')
                        return () => !!document.q(s);
                    return s;
                }
                function canFind(a) {
                    if (a.length == 0)
                        return true;
                    return a.some(s => !!document.q(s));
                }
                function findOne(a) {
                    return a.find(s => document.q(s));
                }
                let fixedData = {
                    condition: toCondition(data.condition),
                    prefetch: toArray(data.prefetch)
                        .flatMap(e => toArray(data[e] ?? e)),
                    doc: toArray(data.doc),
                    click: toArray(data.click),
                    after: toArray(data.after),
                    replace: toArray(data.replace),
                };
                this.condition = () => {
                    if (!fixedData.condition())
                        return false;
                    if (!canFind(fixedData.doc))
                        return false;
                    if (!canFind(fixedData.click))
                        return false;
                    return true;
                };
                this.init();
                if (fixedData.condition()) {
                    fixedData.prefetch.map(s => this.prefetch(s));
                }
                this.onrun = async () => {
                    // if (!fixedData.condition()) return;
                    await data.start?.();
                    fixedData.click.map(e => document.q(e)?.click());
                    let doc = findOne(fixedData.doc);
                    if (doc)
                        await this.fetchDocument(doc);
                    fixedData.after.map(s => this.after(s));
                    fixedData.replace.map(s => this.replace(s));
                    await data.end?.();
                };
            }
        }
        PaginateExtension.Paginate = Paginate;
        PaginateExtension.paginate = Object.setPrototypeOf(Paginate.staticCall.bind(Paginate), new Paginate());
    })(PaginateExtension = PoopJs.PaginateExtension || (PoopJs.PaginateExtension = {}));
    PoopJs.paginate = PaginateExtension.paginate;
})(PoopJs || (PoopJs = {}));
var PoopJs;
(function (PoopJs) {
    let ImageScrollingExtension;
    (function (ImageScrollingExtension) {
        ImageScrollingExtension.imageScrollingActive = false;
        ImageScrollingExtension.imgSelector = 'img';
        function imageScrolling(selector) {
            if (ImageScrollingExtension.imageScrollingActive)
                return;
            if (selector)
                ImageScrollingExtension.imgSelector = selector;
            ImageScrollingExtension.imageScrollingActive = true;
            function onwheel(event) {
                if (event.shiftKey || event.ctrlKey)
                    return;
                if (scrollWholeImage(-Math.sign(event.wheelDeltaY))) {
                    event.preventDefault();
                }
            }
            document.addEventListener('mousewheel', onwheel, { passive: false });
            return ImageScrollingExtension.imageScrollingOff = () => {
                ImageScrollingExtension.imageScrollingActive = false;
                document.removeEventListener('mousewheel', onwheel);
            };
        }
        ImageScrollingExtension.imageScrolling = imageScrolling;
        ImageScrollingExtension.imageScrollingOff = () => { };
        function imgToWindowCenter(img) {
            let rect = img.getBoundingClientRect();
            return (rect.top + rect.bottom) / 2 - innerHeight / 2;
        }
        ImageScrollingExtension.imgToWindowCenter = imgToWindowCenter;
        function getAllImageInfo() {
            let images = qq(ImageScrollingExtension.imgSelector);
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
        ImageScrollingExtension.getAllImageInfo = getAllImageInfo;
        ImageScrollingExtension.scrollWholeImagePending = false;
        function getCentralImg() {
            return getAllImageInfo().vsort(e => Math.abs(e.yToScreenCenter))[0]?.img;
        }
        ImageScrollingExtension.getCentralImg = getCentralImg;
        function scrollWholeImage(dir = 1) {
            if (ImageScrollingExtension.scrollWholeImagePending)
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
                ImageScrollingExtension.scrollWholeImagePending = true;
                Promise.raf(2).then(() => ImageScrollingExtension.scrollWholeImagePending = false);
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
        ImageScrollingExtension.scrollWholeImage = scrollWholeImage;
    })(ImageScrollingExtension = PoopJs.ImageScrollingExtension || (PoopJs.ImageScrollingExtension = {}));
})(PoopJs || (PoopJs = {}));
/// <reference path="./Array.ts" />
/// <reference path="./DateNowHack.ts" />
/// <reference path="./element.ts" />
/// <reference path="./elm.ts" />
/// <reference path="./Filterer/EntityFilterer.ts" />
/// <reference path="./etc.ts" />
/// <reference path="./fetch.ts" />
/// <reference path="./Object.ts" />
/// <reference path="./observer.ts" />
/// <reference path="./Paginate/Pagination.ts" />
/// <reference path="./Paginate/ImageScrolling.ts" />
/// <reference path="./Promise.ts" />
var PoopJs;
(function (PoopJs) {
    function __init__(window) {
        if (!window)
            window = globalThis.window;
        window.elm = PoopJs.Elm.elm;
        window.q = Object.assign(PoopJs.QuerySelector.WindowQ.q, { orElm: PoopJs.Elm.qOrElm });
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
        PoopJs.ObjectExtension.defineValue(Response.prototype, 'cachedAt', 0);
        PoopJs.ObjectExtension.defineValue(Document.prototype, 'cachedAt', 0);
        PoopJs.ObjectExtension.defineValue(Object, 'defineValue', PoopJs.ObjectExtension.defineValue);
        PoopJs.ObjectExtension.defineValue(Object, 'defineGetter', PoopJs.ObjectExtension.defineGetter);
        // ObjectExtension.defineValue(Object, 'map', ObjectExtension.map);
        PoopJs.ObjectExtension.defineValue(Array, 'map', PoopJs.ArrayExtension.map);
        PoopJs.ObjectExtension.defineValue(Array.prototype, 'pmap', PoopJs.ArrayExtension.pmap);
        PoopJs.ObjectExtension.defineValue(Array.prototype, 'vsort', PoopJs.ArrayExtension.vsort);
        window.paginate = PoopJs.paginate;
        window.imageScrolling = PoopJs.ImageScrollingExtension;
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
;
var PoopJs;
(function (PoopJs) {
    let EntryFiltererExtension;
    (function (EntryFiltererExtension) {
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
            constructor(data) {
                data.button ??= 'button.ef-item';
                Object.assign(this, data);
                this.button = elm(data.button, this.click.bind(this), this.contextmenu.bind(this));
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
    })(EntryFiltererExtension = PoopJs.EntryFiltererExtension || (PoopJs.EntryFiltererExtension = {}));
})(PoopJs || (PoopJs = {}));
/// <reference path="./FiltererItem.ts" />
var PoopJs;
(function (PoopJs) {
    let EntryFiltererExtension;
    (function (EntryFiltererExtension) {
        class Filter extends EntryFiltererExtension.FiltererItem {
            constructor(data) {
                data.button ??= 'button.ef-item.ef-filter[ef-mode="off"]';
                super(data);
            }
            /** returns if item should be visible */
            apply(data, el) {
                if (this.mode == 'off')
                    return true;
                let value = this.filter(data, el, this.mode);
                let result = typeof value == "number" ? value > 0 : value;
                if (this.mode == 'on')
                    return result;
                if (this.mode == 'opposite')
                    return !result;
            }
        }
        EntryFiltererExtension.Filter = Filter;
        class ValueFilter extends EntryFiltererExtension.FiltererItem {
            input;
            lastValue;
            constructor(data) {
                data.button ??= 'button.ef-item.ef-filter[ef-mode="off"]';
                super(data);
                let type = typeof data.input == 'number' ? 'number' : 'text';
                let value = JSON.stringify(data.input);
                let input = `input[type=${type}][value=${value}]`;
                this.input = elm(input, input => this.change()).appendTo(this.button);
            }
            change() {
                let value = this.getValue();
                if (this.lastValue != value) {
                    this.lastValue = value;
                    this.parent.requestUpdate();
                }
            }
            /** returns if item should be visible */
            apply(data, el) {
                if (this.mode == 'off')
                    return true;
                let value = this.filter(this.getValue(), data, el);
                let result = typeof value == "number" ? value > 0 : value;
                if (this.mode == 'on')
                    return result;
                if (this.mode == 'opposite')
                    return !result;
            }
            getValue() {
                let value = (this.input.type == 'text' ? this.input.value : this.input.valueAsNumber);
                return value;
            }
        }
        EntryFiltererExtension.ValueFilter = ValueFilter;
    })(EntryFiltererExtension = PoopJs.EntryFiltererExtension || (PoopJs.EntryFiltererExtension = {}));
})(PoopJs || (PoopJs = {}));
var PoopJs;
(function (PoopJs) {
    let EntryFiltererExtension;
    (function (EntryFiltererExtension) {
        class Modifier extends EntryFiltererExtension.FiltererItem {
            constructor(data) {
                data.button ??= 'button.ef-item.ef-modifier[ef-mode="off"]';
                super(data);
            }
            toggleMode(mode, force = false) {
                if (this.mode == mode && !force)
                    return;
                this.parent.moveToTop(this);
                super.toggleMode(mode, force);
            }
            apply(data, el) {
                let oldMode = el.getAttribute(`ef-modifier-${this.id}-mode`);
                if (oldMode == this.mode && !this.runOnNoChange)
                    return;
                this.modifier(data, el, this.mode, null);
                el.setAttribute(`ef-modifier-${this.id}-mode`, this.mode);
            }
        }
        EntryFiltererExtension.Modifier = Modifier;
        class Prefixer extends EntryFiltererExtension.FiltererItem {
            constructor(data) {
                data.button ??= 'button.ef-item.ef-modifier[ef-mode="off"]';
                data.target ??= e => e;
                data.prefixAttribute ??= 'ef-prefix';
                data.postfixAttribute ??= 'ef-postfix';
                data.all ??= false;
                super(data);
            }
            apply(data, el) {
                let targets = this.getTargets(el, data);
                if (this.prefix) {
                    if (this.mode == 'off') {
                        targets.map(e => e.removeAttribute(this.prefixAttribute));
                    }
                    else {
                        let value = this.prefix(data, el, this.mode);
                        targets.map(e => e.setAttribute(this.prefixAttribute, value));
                    }
                }
                if (this.postfix) {
                    if (this.mode == 'off') {
                        targets.map(e => e.removeAttribute(this.postfixAttribute));
                    }
                    else {
                        let value = this.postfix(data, el, this.mode);
                        targets.map(e => e.setAttribute(this.postfixAttribute, value));
                    }
                }
            }
            getTargets(el, data) {
                if (typeof this.target == 'string') {
                    if (this.all)
                        return el.qq(this.target);
                    return [el.q(this.target)];
                }
                else {
                    let targets = this.target(el, data, this.mode);
                    return Array.isArray(targets) ? targets : [targets];
                }
            }
        }
        EntryFiltererExtension.Prefixer = Prefixer;
    })(EntryFiltererExtension = PoopJs.EntryFiltererExtension || (PoopJs.EntryFiltererExtension = {}));
})(PoopJs || (PoopJs = {}));
var PoopJs;
(function (PoopJs) {
    let EntryFiltererExtension;
    (function (EntryFiltererExtension) {
        class Sorter extends EntryFiltererExtension.FiltererItem {
            constructor(data) {
                data.button ??= 'button.ef-item.ef-sorter[ef-mode="off"]';
                data.comparator ??= (a, b) => a > b ? 1 : a < b ? -1 : 0;
                super(data);
            }
            toggleMode(mode, force = false) {
                if (this.mode == mode && !force)
                    return;
                this.parent.moveToTop(this);
                super.toggleMode(mode, force);
            }
            sort(list) {
                if (this.mode == 'off')
                    return list;
                return list.vsort(([data, el]) => this.apply(data, el), (a, b) => this.compare(a, b));
            }
            /** returns order of entry */
            apply(data, el) {
                return this.sorter(data, el, this.mode);
            }
            compare(a, b) {
                if (this.mode == 'on') {
                    return this.comparator(a, b);
                }
                if (this.mode == 'opposite') {
                    return this.comparator(b, a);
                }
                return 0;
            }
        }
        EntryFiltererExtension.Sorter = Sorter;
    })(EntryFiltererExtension = PoopJs.EntryFiltererExtension || (PoopJs.EntryFiltererExtension = {}));
})(PoopJs || (PoopJs = {}));
var PoopJs;
(function (PoopJs) {
    let EntryFiltererExtension;
    (function (EntryFiltererExtension) {
        /**
         * can be either Map or WeakMap
         * (WeakMap is likely to be useless if there are less then 10k old nodes in map)
         */
        let MapType = Map;
    })(EntryFiltererExtension = PoopJs.EntryFiltererExtension || (PoopJs.EntryFiltererExtension = {}));
    PoopJs.EF = EntryFiltererExtension.EntryFilterer;
})(PoopJs || (PoopJs = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9BcnJheS50cyIsIi4uL3NyYy9EYXRlTm93SGFjay50cyIsIi4uL3NyYy9PYmplY3QudHMiLCIuLi9zcmMvUHJvbWlzZS50cyIsIi4uL3NyYy9lbGVtZW50LnRzIiwiLi4vc3JjL2VsbS50cyIsIi4uL3NyYy9ldGMudHMiLCIuLi9zcmMvZmV0Y2gudHMiLCIuLi9zcmMvRmlsdGVyZXIvRW50aXR5RmlsdGVyZXIudHMiLCIuLi9zcmMvb2JzZXJ2ZXIudHMiLCIuLi9zcmMvUGFnaW5hdGUvUGFnaW5hdGlvbi50cyIsIi4uL3NyYy9QYWdpbmF0ZS9JbWFnZVNjcm9sbGluZy50cyIsIi4uL3NyYy9pbml0LnRzIiwiLi4vc3JjL3R5cGVzLnRzIiwiLi4vc3JjL0ZpbHRlcmVyL0ZpbHRlcmVySXRlbS50cyIsIi4uL3NyYy9GaWx0ZXJlci9GaWx0ZXIudHMiLCIuLi9zcmMvRmlsdGVyZXIvTW9kaWZpZXIudHMiLCIuLi9zcmMvRmlsdGVyZXIvU29ydGVyLnRzIiwiLi4vc3JjL0ZpbHRlcmVyL3R5cGVzLnRzIiwiLi4vc3JjL1BhZ2luYXRlL21vZGlmaWNhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFVLE1BQU0sQ0FvRGY7QUFwREQsV0FBVSxNQUFNO0lBQ2YsSUFBaUIsY0FBYyxDQWlEOUI7SUFqREQsV0FBaUIsY0FBYztRQUV2QixLQUFLLFVBQVUsSUFBSSxDQUFrQixNQUFtRCxFQUFFLE9BQU8sR0FBRyxDQUFDO1lBQzNHLElBQUksQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7Z0JBQUUsTUFBTSxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ3RDLElBQUksS0FBSyxHQUF1QixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FB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Im5hbWVzcGFjZSBQb29wSnMge1xyXG5cdGV4cG9ydCBuYW1lc3BhY2UgQXJyYXlFeHRlbnNpb24ge1xyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBwbWFwPFQsIFY+KHRoaXM6IFRbXSwgbWFwcGVyOiAoZTogVCwgaTogbnVtYmVyLCBhOiBUW10pID0+IFByb21pc2U8Vj4gfCBWLCB0aHJlYWRzID0gNSk6IFByb21pc2U8VltdPiB7XHJcblx0XHRcdGlmICghKHRocmVhZHMgPiAwKSkgdGhyb3cgbmV3IEVycm9yKCk7XHJcblx0XHRcdGxldCB0YXNrczogW1QsIG51bWJlciwgVFtdXVtdID0gdGhpcy5tYXAoKGUsIGksIGEpID0+IFtlLCBpLCBhXSk7XHJcblx0XHRcdGxldCByZXN1bHRzID0gQXJyYXk8Vj4odGFza3MubGVuZ3RoKTtcclxuXHRcdFx0bGV0IGFueVJlc29sdmVkID0gUHJvbWlzZUV4dGVuc2lvbi5lbXB0eSgpO1xyXG5cdFx0XHRsZXQgZnJlZVRocmVhZHMgPSB0aHJlYWRzO1xyXG5cdFx0XHRhc3luYyBmdW5jdGlvbiBydW5UYXNrKHRhc2s6IFtULCBudW1iZXIsIFRbXV0pOiBQcm9taXNlPFY+IHtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGF3YWl0IG1hcHBlciguLi50YXNrKTtcclxuXHRcdFx0XHR9IGNhdGNoIChlcnIpIHtcclxuXHRcdFx0XHRcdHJldHVybiBlcnI7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGFzeW5jIGZ1bmN0aW9uIHJ1bih0YXNrKSB7XHJcblx0XHRcdFx0ZnJlZVRocmVhZHMtLTtcclxuXHRcdFx0XHRyZXN1bHRzW3Rhc2tbMV1dID0gYXdhaXQgcnVuVGFzayh0YXNrKTtcclxuXHRcdFx0XHRmcmVlVGhyZWFkcysrO1xyXG5cdFx0XHRcdGxldCBvbGRBbnlSZXNvbHZlZCA9IGFueVJlc29sdmVkO1xyXG5cdFx0XHRcdGFueVJlc29sdmVkID0gUHJvbWlzZUV4dGVuc2lvbi5lbXB0eSgpO1xyXG5cdFx0XHRcdG9sZEFueVJlc29sdmVkLnIodW5kZWZpbmVkKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRmb3IgKGxldCB0YXNrIG9mIHRhc2tzKSB7XHJcblx0XHRcdFx0aWYgKGZyZWVUaHJlYWRzID09IDApIHtcclxuXHRcdFx0XHRcdGF3YWl0IGFueVJlc29sdmVkO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRydW4odGFzayk7XHJcblx0XHRcdH1cclxuXHRcdFx0d2hpbGUgKGZyZWVUaHJlYWRzIDwgdGhyZWFkcykge1xyXG5cdFx0XHRcdGF3YWl0IGFueVJlc29sdmVkO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiByZXN1bHRzO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBtYXA8VCA9IG51bWJlcj4odGhpczogQXJyYXlDb25zdHJ1Y3RvciwgbGVuZ3RoOiBudW1iZXIsIG1hcHBlcjogKG51bWJlcikgPT4gVCA9IGkgPT4gaSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcyhsZW5ndGgpLmZpbGwoMCkubWFwKChlLCBpLCBhKSA9PiBtYXBwZXIoaSkpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiB2c29ydDxUPih0aGlzOiBUW10sIG1hcHBlcjogKGU6IFQsIGk6IG51bWJlciwgYTogVFtdKSA9PiBudW1iZXIsIHNvcnRlcj86ICgoYTogbnVtYmVyLCBiOiBudW1iZXIsIGFlOiBULCBiZTogVCkgPT4gbnVtYmVyKSB8IC0xKTtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiB2c29ydDxULCBWPih0aGlzOiBUW10sIG1hcHBlcjogKGU6IFQsIGk6IG51bWJlciwgYTogVFtdKSA9PiBWLCBzb3J0ZXI6ICgoYTogViwgYjogViwgYWU6IFQsIGJlOiBUKSA9PiBudW1iZXIpIHwgLTEpO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHZzb3J0PFQ+KHRoaXM6IFRbXSwgbWFwcGVyOiAoZTogVCwgaTogbnVtYmVyLCBhOiBUW10pID0+IG51bWJlciwgc29ydGVyOiAoKGE6IG51bWJlciwgYjogbnVtYmVyLCBhZTogVCwgYmU6IFQpID0+IG51bWJlcikgfCAtMSA9IChhLCBiKSA9PiBhIC0gYikge1xyXG5cdFx0XHRsZXQgdGhlU29ydGVyID0gdHlwZW9mIHNvcnRlciA9PSAnZnVuY3Rpb24nID8gc29ydGVyIDogKGEsIGIpID0+IGIgLSBhO1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0XHRcdC5tYXAoKGUsIGksIGEpID0+ICh7IGUsIHY6IG1hcHBlcihlLCBpLCBhKSB9KSlcclxuXHRcdFx0XHQuc29ydCgoYSwgYikgPT4gdGhlU29ydGVyKGEudiwgYi52LCBhLmUsIGIuZSkpXHJcblx0XHRcdFx0Lm1hcChlID0+IGUuZSk7XHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBEYXRlTm93SGFjayB7XHJcblx0XHRcclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gRGF0ZU5vd0hhY2sobiA9IDUpIHtcclxuXHRcdFx0RGF0ZS5fbm93ID8/PSBEYXRlLm5vdztcclxuXHRcdFx0bGV0IF9zdGFydCA9IERhdGUuX25vdygpO1xyXG5cdFx0XHRsZXQgc3RhcnQgPSBEYXRlLm5vdygpO1xyXG5cdFx0XHREYXRlLm5vdyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHJldHVybiAodGhpcy5fbm93KCkgLSBfc3RhcnQpICogbiArIHN0YXJ0O1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHREYXRlLnByb3RvdHlwZS5fZ2V0VGltZSA/Pz0gRGF0ZS5wcm90b3R5cGUuZ2V0VGltZTtcclxuXHRcdFx0bGV0IF9ndF9zdGFydCA9IG5ldyBEYXRlKCkuX2dldFRpbWUoKTtcclxuXHRcdFx0bGV0IGd0X3N0YXJ0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcblx0XHRcdERhdGUucHJvdG90eXBlLmdldFRpbWUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRyZXR1cm4gKHRoaXMuX2dldFRpbWUoKSAtIF9ndF9zdGFydCkgKiBuICsgZ3Rfc3RhcnQ7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNvbnNvbGUubG9nKGBEYXRlTm93SGFjazpgLCBuKTtcclxuXHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHJcblxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblxyXG5cdGV4cG9ydCBuYW1lc3BhY2UgT2JqZWN0RXh0ZW5zaW9uIHtcclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZGVmaW5lVmFsdWU8VCwgSyBleHRlbmRzIGtleW9mIFQ+KG86IFQsIHA6IEssIHZhbHVlOiBUW0tdKTogVDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBkZWZpbmVWYWx1ZTxUPihvOiBULCBmbjogRnVuY3Rpb24pOiBUO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGRlZmluZVZhbHVlPFQ+KG86IFQsIHA6IGtleW9mIFQgfCBzdHJpbmcgfCBGdW5jdGlvbiwgdmFsdWU/OiBhbnkpOiBUIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBwID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRbcCwgdmFsdWVdID0gW3AubmFtZSwgcF0gYXMgW3N0cmluZywgRnVuY3Rpb25dO1xyXG5cdFx0XHR9XHJcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBwLCB7XHJcblx0XHRcdFx0dmFsdWUsXHJcblx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdGVudW1lcmFibGU6IGZhbHNlLFxyXG5cdFx0XHRcdHdyaXRhYmxlOiB0cnVlLFxyXG5cdFx0XHR9KTtcclxuXHRcdFx0cmV0dXJuIG87XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUdldHRlcjxULCBLIGV4dGVuZHMga2V5b2YgVD4obzogVCwgcDogSywgZ2V0OiAoKSA9PiBUW0tdKTogVDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBkZWZpbmVHZXR0ZXI8VD4obzogVCwgZ2V0OiBGdW5jdGlvbik6IFQ7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZGVmaW5lR2V0dGVyPFQ+KG86IFQsIHA6IHN0cmluZyB8IGtleW9mIFQgfCBGdW5jdGlvbiwgZ2V0PzogYW55KTogVCB7XHJcblx0XHRcdGlmICh0eXBlb2YgcCA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0W3AsIGdldF0gPSBbcC5uYW1lLCBwXSBhcyBbc3RyaW5nLCBGdW5jdGlvbl07XHJcblx0XHRcdH1cclxuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIHAsIHtcclxuXHRcdFx0XHRnZXQsXHJcblx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdGVudW1lcmFibGU6IGZhbHNlLFxyXG5cdFx0XHR9KTtcclxuXHRcdFx0cmV0dXJuIG87XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIG1hcDxULCBWPihvOiBULCBtYXBwZXI6ICh2OiBWYWx1ZU9mPFQ+LCBrOiBrZXlvZiBULCBvOiBUKSA9PiBWKTogTWFwcGVkT2JqZWN0PFQsIFY+IHtcclxuXHRcdFx0bGV0IGVudHJpZXMgPSBPYmplY3QuZW50cmllcyhvKSBhcyBba2V5b2YgVCwgVmFsdWVPZjxUPl1bXTtcclxuXHRcdFx0cmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhlbnRyaWVzLm1hcCgoW2ssIHZdKSA9PiBbaywgbWFwcGVyKHYsIGssIG8pXSkpIGFzIE1hcHBlZE9iamVjdDxULCBWPjtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblxyXG5cdGV4cG9ydCBuYW1lc3BhY2UgUHJvbWlzZUV4dGVuc2lvbiB7XHJcblx0XHR0eXBlIFVud3JhcHBlZFByb21pc2U8VD4gPSBQcm9taXNlPFQ+ICYge1xyXG5cdFx0XHRyZXNvbHZlOiAodmFsdWU6IFQgfCBQcm9taXNlTGlrZTxUPikgPT4gdm9pZDtcclxuXHRcdFx0cmVqZWN0OiAocmVhc29uPzogYW55KSA9PiB2b2lkO1xyXG5cdFx0XHRyOiAodmFsdWU6IFQgfCBQcm9taXNlTGlrZTxUPikgPT4gdm9pZDtcclxuXHRcdFx0ajogKHJlYXNvbj86IGFueSkgPT4gdm9pZDtcclxuXHRcdH1cclxuXHJcblx0XHQvKipcclxuXHRcdCAqIENyZWF0ZXMgdW53cmFwcGVkIHByb21pc2VcclxuXHRcdCAqL1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGVtcHR5PFQ+KCkge1xyXG5cdFx0XHRsZXQgcmVzb2x2ZTogKHZhbHVlOiBUKSA9PiB2b2lkO1xyXG5cdFx0XHRsZXQgcmVqZWN0OiAocmVhc29uPzogYW55KSA9PiB2b2lkO1xyXG5cdFx0XHRsZXQgcCA9IG5ldyBQcm9taXNlPFQ+KChyLCBqKSA9PiB7XHJcblx0XHRcdFx0cmVzb2x2ZSA9IHI7XHJcblx0XHRcdFx0cmVqZWN0ID0gajtcclxuXHRcdFx0fSkgYXMgVW53cmFwcGVkUHJvbWlzZTxUPjtcclxuXHRcdFx0cC5yZXNvbHZlID0gcC5yID0gcmVzb2x2ZTtcclxuXHRcdFx0cC5yZWplY3QgPSBwLmogPSByZWplY3Q7XHJcblx0XHRcdHJldHVybiBwO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBmcmFtZShuID0gMSk6IFByb21pc2U8bnVtYmVyPiB7XHJcblx0XHRcdHdoaWxlICgtLW4gPiAwKSB7XHJcblx0XHRcdFx0YXdhaXQgbmV3IFByb21pc2UocmVxdWVzdEFuaW1hdGlvbkZyYW1lKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UocmVxdWVzdEFuaW1hdGlvbkZyYW1lKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59XHJcbiIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIFF1ZXJ5U2VsZWN0b3Ige1xyXG5cclxuXHRcdGV4cG9ydCBuYW1lc3BhY2UgV2luZG93USB7XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHNlbGVjdG9yOiBLKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxFIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50PihzZWxlY3Rvcjogc2VsZWN0b3IpOiBFO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3Rvcjogc2VsZWN0b3IpOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxKHNlbGVjdG9yOiBzdHJpbmcpIHtcclxuXHRcdFx0XHRyZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3RvcjogSyk6IChIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10pW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxFIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50PihzZWxlY3Rvcjogc2VsZWN0b3IpOiBFW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3Rvcjogc2VsZWN0b3IpOiAoSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdKVtdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXEoc2VsZWN0b3I6IHN0cmluZykge1xyXG5cdFx0XHRcdHJldHVybiBbLi4uZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcildO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IG5hbWVzcGFjZSBEb2N1bWVudFEge1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPih0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IEspOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEUgZXh0ZW5kcyBFbGVtZW50ID0gSFRNTEVsZW1lbnQ+KHRoaXM6IERvY3VtZW50LCBzZWxlY3Rvcjogc2VsZWN0b3IpOiBFO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPih0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IHNlbGVjdG9yKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcSh0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IHN0cmluZykge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmRvY3VtZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IERvY3VtZW50LCBzZWxlY3RvcjogSyk6IChIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10pW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxFIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50Pih0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IHNlbGVjdG9yKTogRVtdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXE8SyBleHRlbmRzIGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcD4odGhpczogRG9jdW1lbnQsIHNlbGVjdG9yOiBzZWxlY3Rvcik6IChIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10pW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcSh0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IHN0cmluZykge1xyXG5cdFx0XHRcdHJldHVybiBbLi4udGhpcy5kb2N1bWVudEVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcildO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IG5hbWVzcGFjZSBFbGVtZW50USB7XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBLKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxFIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50Pih0aGlzOiBFbGVtZW50LCBzZWxlY3Rvcjogc2VsZWN0b3IpOiBFO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPih0aGlzOiBFbGVtZW50LCBzZWxlY3Rvcjogc2VsZWN0b3IpOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxKHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBLKTogKEhUTUxFbGVtZW50VGFnTmFtZU1hcFtLXSlbXTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEUgZXh0ZW5kcyBFbGVtZW50ID0gSFRNTEVsZW1lbnQ+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBzZWxlY3Rvcik6IEVbXTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBzZWxlY3Rvcik6IChIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10pW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcSh0aGlzOiBFbGVtZW50LCBzZWxlY3Rvcjogc3RyaW5nKSB7XHJcblx0XHRcdFx0cmV0dXJuIFsuLi50aGlzLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFbGVtZW50RXh0ZW5zaW9uIHtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBlbWl0PFQgZXh0ZW5kcyBDdXN0b21FdmVudDx7IF9ldmVudD86IHN0cmluZyB9Pj4odGhpczogRWxlbWVudCwgdHlwZTogVFsnZGV0YWlsJ11bJ19ldmVudCddLCBkZXRhaWw/OiBUWydkZXRhaWwnXSk7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZW1pdDxUPih0aGlzOiBFbGVtZW50LCB0eXBlOiBzdHJpbmcsIGRldGFpbD86IFQpIHtcclxuXHRcdFx0bGV0IGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KHR5cGUsIHtcclxuXHRcdFx0XHRidWJibGVzOiB0cnVlLFxyXG5cdFx0XHRcdGRldGFpbCxcclxuXHRcdFx0fSk7XHJcblx0XHRcdHRoaXMuZGlzcGF0Y2hFdmVudChldmVudCk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFRvPEUgZXh0ZW5kcyBFbGVtZW50Pih0aGlzOiBFLCBwYXJlbnQ6IEVsZW1lbnQgfCBzZWxlY3Rvcik6IEUge1xyXG5cdFx0XHRpZiAodHlwZW9mIHBhcmVudCA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdHBhcmVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IocGFyZW50KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRwYXJlbnQuYXBwZW5kKHRoaXMpO1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH1cclxuXHR9XHJcblxyXG59XHJcbiIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIEVsbSB7XHJcblx0XHR0eXBlIENoaWxkID0gTm9kZSB8IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW47XHJcblx0XHR0eXBlIFNvbWVFdmVudCA9IEV2ZW50ICYgTW91c2VFdmVudCAmIEtleWJvYXJkRXZlbnQgJiB7IHRhcmdldDogSFRNTEVsZW1lbnQgfTtcclxuXHRcdHR5cGUgTGlzdGVuZXIgPSAoKGV2ZW50OiBTb21lRXZlbnQpID0+IGFueSlcclxuXHRcdFx0JiB7IG5hbWU/OiBgJHsnJyB8ICdib3VuZCAnfSR7J29uJyB8ICcnfSR7a2V5b2YgSFRNTEVsZW1lbnRFdmVudE1hcH1gIHwgJycgfSB8ICgoZXZlbnQ6IFNvbWVFdmVudCkgPT4gYW55KTtcclxuXHJcblx0XHRjb25zdCBlbG1SZWdleCA9IG5ldyBSZWdFeHAoW1xyXG5cdFx0XHQvXig/PHRhZz5bXFx3LV0rKS8sXHJcblx0XHRcdC8jKD88aWQ+W1xcdy1dKykvLFxyXG5cdFx0XHQvXFwuKD88Y2xhc3M+W1xcdy1dKykvLFxyXG5cdFx0XHQvXFxbKD88YXR0cjE+W1xcdy1dKylcXF0vLFxyXG5cdFx0XHQvXFxbKD88YXR0cjI+W1xcdy1dKyk9KD8hWydcIl0pKD88dmFsMj5bXlxcXV0qKVxcXS8sXHJcblx0XHRcdC9cXFsoPzxhdHRyMz5bXFx3LV0rKT1cIig/PHZhbDM+KD86W15cIl18XFxcXFwiKSopXCJcXF0vLFxyXG5cdFx0XHQvXFxbKD88YXR0cjQ+W1xcdy1dKyk9XCIoPzx2YWw0Pig/OlteJ118XFxcXCcpKilcIlxcXS8sXHJcblx0XHRdLm1hcChlID0+IGUuc291cmNlKS5qb2luKCd8JyksICdnJyk7XHJcblxyXG5cdFx0LyoqIGlmIGBlbG1gIHNob3VsZCBkaXNhbGxvdyBsaXN0ZW5lcnMgbm90IGV4aXN0aW5nIGFzIGBvbiAqIGAgcHJvcGVydHkgb24gdGhlIGVsZW1lbnQgKi9cclxuXHRcdGV4cG9ydCBsZXQgYWxsb3dPbmx5RXhpc3RpbmdMaXN0ZW5lcnMgPSB0cnVlO1xyXG5cclxuXHRcdC8qKiBpZiBgZWxtYCBzaG91bGQgYWxsb3cgb3ZlcnJpZGluZyBgb24gKiBgIGxpc3RlbmVycyBpZiBtdWx0aXBsZSBvZiB0aGVtIGFyZSBwcm92aWRlZCAqL1xyXG5cdFx0ZXhwb3J0IGxldCBhbGxvd092ZXJyaWRlT25MaXN0ZW5lcnMgPSBmYWxzZTtcclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHNlbGVjdG9yOiBLLCAuLi5jaGlsZHJlbjogKENoaWxkIHwgTGlzdGVuZXIpW10pOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtPEUgZXh0ZW5kcyBFbGVtZW50ID0gSFRNTEVsZW1lbnQ+KHNlbGVjdG9yOiBzZWxlY3RvciwgLi4uY2hpbGRyZW46IChDaGlsZCB8IExpc3RlbmVyKVtdKTogRTtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBlbG08SyBleHRlbmRzIGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcD4oc2VsZWN0b3I6IHNlbGVjdG9yLCAuLi5jaGlsZHJlbjogKENoaWxkIHwgTGlzdGVuZXIpW10pOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtKCk6IEhUTUxEaXZFbGVtZW50O1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGVsbShzZWxlY3Rvcjogc3RyaW5nID0gJycsIC4uLmNoaWxkcmVuOiAoQ2hpbGQgfCBMaXN0ZW5lcilbXSk6IEhUTUxFbGVtZW50IHtcclxuXHRcdFx0aWYgKHNlbGVjdG9yLnJlcGxhY2VBbGwoZWxtUmVnZXgsICcnKSAhPSAnJykge1xyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBzZWxlY3RvcjogJHtzZWxlY3Rvcn0gYCk7XHJcblx0XHRcdH1cclxuXHRcdFx0bGV0IGVsZW1lbnQ6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0XHRcdC8vIGxldCB0YWcgPSAnJztcclxuXHRcdFx0Ly8gbGV0IGZpcnN0TWF0Y2ggPSBmYWxzZTtcclxuXHRcdFx0Zm9yIChsZXQgbWF0Y2ggb2Ygc2VsZWN0b3IubWF0Y2hBbGwoZWxtUmVnZXgpKSB7XHJcblx0XHRcdFx0aWYgKG1hdGNoLmdyb3Vwcy50YWcpIHtcclxuXHRcdFx0XHRcdC8vIGlmICh0YWcgJiYgbWF0Y2guZ3JvdXBzLnRhZyAhPSB0YWcpIHtcclxuXHRcdFx0XHRcdC8vIFx0dGhyb3cgbmV3IEVycm9yKGBzZWxlY3RvciBoYXMgdHdvIGRpZmZlcmVudCB0YWdzIGF0IG9uY2UgOiA8JHt0YWd9PiBhbmQgPCR7bWF0Y2guZ3JvdXBzLnRhZ30+YCk7XHJcblx0XHRcdFx0XHQvLyB9XHJcblx0XHRcdFx0XHQvLyB0YWcgPSBtYXRjaC5ncm91cHMudGFnO1xyXG5cdFx0XHRcdFx0Ly8gaWYgKCFmaXJzdE1hdGNoKSByZXR1cm4gZWxtKHRhZyArIHNlbGVjdG9yLCAuLi5jaGlsZHJlbik7XHJcblx0XHRcdFx0XHRlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChtYXRjaC5ncm91cHMudGFnKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5pZCkge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5pZCA9IG1hdGNoLmdyb3Vwcy5pZDtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5jbGFzcykge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKG1hdGNoLmdyb3Vwcy5jbGFzcyk7XHJcblx0XHRcdFx0fSBlbHNlIGlmIChtYXRjaC5ncm91cHMuYXR0cjEpIHtcclxuXHRcdFx0XHRcdGVsZW1lbnQuc2V0QXR0cmlidXRlKG1hdGNoLmdyb3Vwcy5hdHRyMSwgXCJ0cnVlXCIpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAobWF0Y2guZ3JvdXBzLmF0dHIyKSB7XHJcblx0XHRcdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZShtYXRjaC5ncm91cHMuYXR0cjIsIG1hdGNoLmdyb3Vwcy52YWwyKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5hdHRyMykge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5zZXRBdHRyaWJ1dGUobWF0Y2guZ3JvdXBzLmF0dHIzLCBtYXRjaC5ncm91cHMudmFsMy5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAobWF0Y2guZ3JvdXBzLmF0dHI0KSB7XHJcblx0XHRcdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZShtYXRjaC5ncm91cHMuYXR0cjQsIG1hdGNoLmdyb3Vwcy52YWw0LnJlcGxhY2UoL1xcXFwnL2csICdcXCcnKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIGZpcnN0TWF0Y2ggPSBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRmb3IgKGxldCBsaXN0ZW5lciBvZiBjaGlsZHJlbi5maWx0ZXIoZSA9PiB0eXBlb2YgZSA9PSAnZnVuY3Rpb24nKSBhcyBMaXN0ZW5lcltdKSB7XHJcblx0XHRcdFx0bGV0IG5hbWU6IHN0cmluZyA9IGxpc3RlbmVyLm5hbWU7XHJcblx0XHRcdFx0aWYgKCFuYW1lKSBuYW1lID0gKGxpc3RlbmVyICsgJycpLm1hdGNoKC9cXGIoPyFmdW5jdGlvblxcYilcXHcrLylbMF07XHJcblx0XHRcdFx0aWYgKCFuYW1lKSB0aHJvdyBuZXcgRXJyb3IoJ3RyeWluZyB0byBiaW5kIHVubmFtZWQgZnVuY3Rpb24nKTtcclxuXHRcdFx0XHRpZiAobmFtZS5zdGFydHNXaXRoKCdib3VuZCAnKSkgbmFtZSA9IG5hbWUuc2xpY2UoJ2JvdW5kICcubGVuZ3RoKTtcclxuXHRcdFx0XHRpZiAobmFtZS5zdGFydHNXaXRoKCdvbicpKSB7XHJcblx0XHRcdFx0XHRpZiAoIWVsZW1lbnQuaGFzT3duUHJvcGVydHkobmFtZSkpIHRocm93IG5ldyBFcnJvcihgPCAke2VsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpfT4gZG9lcyBub3QgaGF2ZSBcIiR7bmFtZX1cIiBsaXN0ZW5lcmApO1xyXG5cdFx0XHRcdFx0aWYgKCFhbGxvd092ZXJyaWRlT25MaXN0ZW5lcnMgJiYgZWxlbWVudFtuYW1lXSkgdGhyb3cgbmV3IEVycm9yKCdvdmVycmlkaW5nIGBvbiAqIGAgbGlzdGVuZXJzIGlzIGRpc2FibGVkJyk7XHJcblx0XHRcdFx0XHRlbGVtZW50W25hbWVdID0gbGlzdGVuZXI7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGlmIChhbGxvd09ubHlFeGlzdGluZ0xpc3RlbmVycyAmJiBlbGVtZW50WydvbicgKyBuYW1lXSA9PT0gdW5kZWZpbmVkKVxyXG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYDwke2VsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpfT4gZG9lcyBub3QgaGF2ZSBcIm9uJyR7bmFtZX0nXCIgbGlzdGVuZXJgKTtcclxuXHRcdFx0XHRcdGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBsaXN0ZW5lcik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsZW1lbnQuYXBwZW5kKC4uLmNoaWxkcmVuLmZpbHRlcihlID0+IHR5cGVvZiBlICE9ICdmdW5jdGlvbicpIGFzIChOb2RlIHwgc3RyaW5nKVtdKTtcclxuXHRcdFx0cmV0dXJuIGVsZW1lbnQ7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFPckVsbTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3RvcjogSywgcGFyZW50PzogUGFyZW50Tm9kZSB8IHNlbGVjdG9yKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFPckVsbTxFIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50PihzZWxlY3Rvcjogc3RyaW5nLCBwYXJlbnQ/OiBQYXJlbnROb2RlIHwgc2VsZWN0b3IpOiBFO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFPckVsbTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3Rvcjogc3RyaW5nLCBwYXJlbnQ/OiBQYXJlbnROb2RlIHwgc2VsZWN0b3IpOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcU9yRWxtKHNlbGVjdG9yOiBzdHJpbmcsIHBhcmVudD86IFBhcmVudE5vZGUgfCBzdHJpbmcpIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBwYXJlbnQgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRwYXJlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHBhcmVudCkgYXMgUGFyZW50Tm9kZTtcclxuXHRcdFx0XHRpZiAoIXBhcmVudCkgdGhyb3cgbmV3IEVycm9yKCdmYWlsZWQgdG8gZmluZCBwYXJlbnQgZWxlbWVudCcpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChzZWxlY3Rvci5pbmNsdWRlcygnPicpKSB7XHJcblx0XHRcdFx0bGV0IHBhcmVudFNlbGVjdG9yID0gc2VsZWN0b3Iuc3BsaXQoJz4nKS5zbGljZSgwLCAtMSkuam9pbignPicpO1xyXG5cdFx0XHRcdHNlbGVjdG9yID0gc2VsZWN0b3Iuc3BsaXQoJz4nKS5wb3AoKTtcclxuXHRcdFx0XHRwYXJlbnQgPSAocGFyZW50IHx8IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yKHBhcmVudFNlbGVjdG9yKSBhcyBQYXJlbnROb2RlO1xyXG5cdFx0XHRcdGlmICghcGFyZW50KSB0aHJvdyBuZXcgRXJyb3IoJ2ZhaWxlZCB0byBmaW5kIHBhcmVudCBlbGVtZW50Jyk7XHJcblx0XHRcdH1cclxuXHRcdFx0bGV0IGNoaWxkID0gKHBhcmVudCB8fCBkb2N1bWVudCkucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XHJcblx0XHRcdGlmIChjaGlsZCkgcmV0dXJuIGNoaWxkO1xyXG5cclxuXHRcdFx0Y2hpbGQgPSBlbG0oc2VsZWN0b3IpO1xyXG5cdFx0XHRwYXJlbnQ/LmFwcGVuZChjaGlsZCk7XHJcblx0XHRcdHJldHVybiBjaGlsZDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBldGMge1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGtleWJpbmQoa2V5OiBzdHJpbmcsIGZuOiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHZvaWQpIHtcclxuXHRcdFx0bGV0IGNvZGUgPSBrZXkubGVuZ3RoID09IDEgPyAnS2V5JyArIGtleS50b1VwcGVyQ2FzZSgpIDoga2V5O1xyXG5cdFx0XHRmdW5jdGlvbiBvbmtleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcclxuXHRcdFx0XHRpZiAoZXZlbnQuY29kZSA9PSBjb2RlKSB7XHJcblx0XHRcdFx0XHRmbihldmVudCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbmtleWRvd24pO1xyXG5cdFx0XHRyZXR1cm4gKCkgPT4gcmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9ua2V5ZG93bik7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZ1bGxzY3JlZW4ob24/OiBib29sZWFuKSB7XHJcblx0XHRcdGxldCBjZW50cmFsID0gSW1hZ2VTY3JvbGxpbmdFeHRlbnNpb24uaW1hZ2VTY3JvbGxpbmdBY3RpdmUgJiYgSW1hZ2VTY3JvbGxpbmdFeHRlbnNpb24uZ2V0Q2VudHJhbEltZygpO1xyXG5cdFx0XHRpZiAoIWRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50KSB7XHJcblx0XHRcdFx0aWYgKG9uID09IGZhbHNlKSByZXR1cm47XHJcblx0XHRcdFx0YXdhaXQgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuKCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0aWYgKG9uID09IHRydWUpIHJldHVybjtcclxuXHRcdFx0XHRhd2FpdCBkb2N1bWVudC5leGl0RnVsbHNjcmVlbigpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChjZW50cmFsKSB7XHJcblx0XHRcdFx0Y2VudHJhbC5zY3JvbGxJbnRvVmlldygpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGFueWJpbmQoa2V5T3JFdmVudDogc3RyaW5nIHwgbnVtYmVyLCBmbjogKGV2ZW50OiBFdmVudCkgPT4gdm9pZCkge1xyXG5cdFx0XHRpZiAodHlwZW9mIGtleU9yRXZlbnQgPT0gXCJudW1iZXJcIikga2V5T3JFdmVudCA9IGtleU9yRXZlbnQgKyAnJztcclxuXHRcdFx0Ly8gZGV0ZWN0IGlmIGl0IGlzIGV2ZW50XHJcblx0XHRcdGxldCBpc0V2ZW50ID0gd2luZG93Lmhhc093blByb3BlcnR5KCdvbicgKyBrZXlPckV2ZW50KTtcclxuXHRcdFx0aWYgKGlzRXZlbnQpIHtcclxuXHRcdFx0XHRhZGRFdmVudExpc3RlbmVyKGtleU9yRXZlbnQsIGZuKTtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gcGFyc2Uga2V5IGNvZGVcclxuXHRcdFx0aWYgKCFpc05hTihwYXJzZUludChrZXlPckV2ZW50KSkpIHtcclxuXHRcdFx0XHRrZXlPckV2ZW50ID0gYERpZ2l0JHtrZXlPckV2ZW50fWA7XHJcblx0XHRcdH0gZWxzZSBpZiAoa2V5T3JFdmVudC5sZW5ndGggPT0gMSkge1xyXG5cdFx0XHRcdGtleU9yRXZlbnQgPSBgS2V5JHtrZXlPckV2ZW50LnRvVXBwZXJDYXNlKCl9YDtcclxuXHRcdFx0fVxyXG5cdFx0XHRhZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZXYgPT4ge1xyXG5cdFx0XHRcdGlmIChldi5jb2RlICE9IGtleU9yRXZlbnQpIHJldHVybjtcclxuXHRcdFx0XHRmbihldik7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBmdWxsc2NyZWVuT24oa2V5OiBzdHJpbmcpIHtcclxuXHRcdFx0aWYgKGtleSA9PSAnc2Nyb2xsJykge1xyXG5cdFx0XHRcdGFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsICgpID0+IGZ1bGxzY3JlZW4odHJ1ZSkpO1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4ga2V5YmluZChrZXksICgpID0+IGZ1bGxzY3JlZW4oKSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGZJc0ZvckZ1bGxzY3JlZW4oKSB7XHJcblx0XHRcdGtleWJpbmQoJ0YnLCAoKSA9PiBmdWxsc2NyZWVuKCkpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBoYXNoQ29kZSh0aGlzOiBzdHJpbmcpO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGhhc2hDb2RlKHZhbHVlOiBzdHJpbmcpO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGhhc2hDb2RlKHRoaXM6IHN0cmluZywgdmFsdWU/OiBzdHJpbmcpIHtcclxuXHRcdFx0dmFsdWUgPz89IHRoaXM7XHJcblx0XHRcdGxldCBoYXNoID0gMDtcclxuXHRcdFx0Zm9yIChsZXQgYyBvZiB2YWx1ZSkge1xyXG5cdFx0XHRcdGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSArIGMuY2hhckNvZGVBdCgwKTtcclxuXHRcdFx0XHRoYXNoID0gaGFzaCAmIGhhc2g7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGhhc2g7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGluaXQoKSB7XHJcblx0XHRcdC8vIFN0cmluZy5wcm90b3R5cGUuaGFzaENvZGUgPSBoYXNoQ29kZTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gY3VycmVudFNjcmlwdEhhc2goKSB7XHJcblx0XHRcdHJldHVybiBoYXNoQ29kZShkb2N1bWVudC5jdXJyZW50U2NyaXB0LmlubmVySFRNTCk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHJlbG9hZE9uQ3VycmVudFNjcmlwdENoYW5nZWQoc2NyaXB0TmFtZTogc3RyaW5nID0gbG9jYXRpb24uaG9zdG5hbWUgKyAnLnVqcycpIHtcclxuXHRcdFx0bGV0IHNjcmlwdElkID0gYHJlbG9hZE9uQ3VycmVudFNjcmlwdENoYW5nZWRfJHtzY3JpcHROYW1lfWA7XHJcblx0XHRcdGxldCBzY3JpcHRIYXNoID0gY3VycmVudFNjcmlwdEhhc2goKSArICcnO1xyXG5cdFx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShzY3JpcHRJZCwgc2NyaXB0SGFzaCk7XHJcblx0XHRcdGFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgKCkgPT4ge1xyXG5cdFx0XHRcdGlmIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShzY3JpcHRJZCkgIT0gc2NyaXB0SGFzaCkge1xyXG5cdFx0XHRcdFx0bG9jYXRpb24ucmVsb2FkKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgbGV0IGZhc3RTY3JvbGw6IHtcclxuXHRcdFx0KHNwZWVkPzogbnVtYmVyKTogdm9pZDtcclxuXHRcdFx0c3BlZWQ/OiBudW1iZXI7XHJcblx0XHRcdGFjdGl2ZT86IGJvb2xlYW47XHJcblx0XHRcdG9mZj86ICgpID0+IHZvaWQ7XHJcblx0XHR9ID0gZnVuY3Rpb24gKHNwZWVkID0gMC4yNSkge1xyXG5cdFx0XHRpZiAoZmFzdFNjcm9sbC5hY3RpdmUpIGZhc3RTY3JvbGwub2ZmKCk7XHJcblx0XHRcdGZhc3RTY3JvbGwuYWN0aXZlID0gdHJ1ZTtcclxuXHRcdFx0ZmFzdFNjcm9sbC5zcGVlZCA9IHNwZWVkO1xyXG5cdFx0XHRmdW5jdGlvbiBvbndoZWVsKGV2ZW50OiBNb3VzZUV2ZW50ICYgeyB3aGVlbERlbHRhWTogbnVtYmVyIH0pIHtcclxuXHRcdFx0XHRpZiAoZXZlbnQuZGVmYXVsdFByZXZlbnRlZCkgcmV0dXJuO1xyXG5cdFx0XHRcdGlmIChldmVudC5jdHJsS2V5IHx8IGV2ZW50LnNoaWZ0S2V5KSByZXR1cm47XHJcblx0XHRcdFx0c2Nyb2xsQnkoMCwgLU1hdGguc2lnbihldmVudC53aGVlbERlbHRhWSkgKiBpbm5lckhlaWdodCAqIGZhc3RTY3JvbGwuc3BlZWQpO1xyXG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdH1cclxuXHRcdFx0YWRkRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIG9ud2hlZWwsIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdGZhc3RTY3JvbGwub2ZmID0gKCkgPT4ge1xyXG5cdFx0XHRcdGZhc3RTY3JvbGwuYWN0aXZlID0gZmFsc2U7XHJcblx0XHRcdFx0cmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIG9ud2hlZWwpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRmYXN0U2Nyb2xsLmFjdGl2ZSA9IGZhbHNlO1xyXG5cdFx0ZmFzdFNjcm9sbC5vZmYgPSAoKSA9PiB7IH07XHJcblxyXG5cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gb25yYWYoZjogKCkgPT4gdm9pZCkge1xyXG5cdFx0XHRsZXQgbG9vcCA9IHRydWU7XHJcblx0XHRcdHZvaWQgYXN5bmMgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdHdoaWxlIChsb29wKSB7XHJcblx0XHRcdFx0XHRhd2FpdCBQcm9taXNlLmZyYW1lKCk7XHJcblx0XHRcdFx0XHRmKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KCk7XHJcblx0XHRcdHJldHVybiAoKSA9PiB7IGxvb3AgPSBmYWxzZSB9O1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCByZXNpemVPYnNlcnZlcjogUmVzaXplT2JzZXJ2ZXI7XHJcblx0XHRsZXQgcmVzaXplTGlzdGVuZXJzOiAoKG5ld0hlaWdodDogbnVtYmVyLCBvbGRIZWlnaHQ6IG51bWJlcikgPT4gdm9pZClbXSA9IFtdO1xyXG5cdFx0bGV0IHByZXZpb3VzQm9keUhlaWdodCA9IDA7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gb25oZWlnaHRjaGFuZ2UoZjogKG5ld0hlaWdodDogbnVtYmVyLCBvbGRIZWlnaHQ6IG51bWJlcikgPT4gdm9pZCkge1xyXG5cdFx0XHRpZiAoIXJlc2l6ZU9ic2VydmVyKSB7XHJcblx0XHRcdFx0cHJldmlvdXNCb2R5SGVpZ2h0ID0gZG9jdW1lbnQuYm9keS5jbGllbnRIZWlnaHQ7XHJcblx0XHRcdFx0cmVzaXplT2JzZXJ2ZXIgPSBuZXcgUmVzaXplT2JzZXJ2ZXIoZW50cmllcyA9PiB7XHJcblx0XHRcdFx0XHRmb3IgKGxldCBlIG9mIGVudHJpZXMpIHtcclxuXHRcdFx0XHRcdFx0aWYgKGUudGFyZ2V0ICE9IGRvY3VtZW50LmJvZHkpIGNvbnRpbnVlO1xyXG5cclxuXHRcdFx0XHRcdFx0bGV0IG5ld0JvZHlIZWlnaHQgPSBlLnRhcmdldC5jbGllbnRIZWlnaHQ7XHJcblx0XHRcdFx0XHRcdGZvciAobGV0IGYgb2YgcmVzaXplTGlzdGVuZXJzKSB7XHJcblx0XHRcdFx0XHRcdFx0ZihuZXdCb2R5SGVpZ2h0LCBwcmV2aW91c0JvZHlIZWlnaHQpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdHByZXZpb3VzQm9keUhlaWdodCA9IG5ld0JvZHlIZWlnaHQ7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0cmVzaXplT2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXNpemVMaXN0ZW5lcnMucHVzaChmKTtcclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKCkge1xyXG5cdFx0XHRcdHJlc2l6ZUxpc3RlbmVycy5zcGxpY2UocmVzaXplTGlzdGVuZXJzLmluZGV4T2YoZikpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG59XHJcblxyXG4vLyBpbnRlcmZhY2UgU3RyaW5nIHtcclxuLy8gXHRoYXNoQ29kZTogKCkgPT4gbnVtYmVyO1xyXG4vLyB9XHJcbiIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIEZldGNoRXh0ZW5zaW9uIHtcclxuXHRcdGV4cG9ydCBsZXQgZGVmYXVsdHM6IFJlcXVlc3RJbml0ID0geyBjcmVkZW50aWFsczogJ2luY2x1ZGUnIH07XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhY2hlZCh1cmw6IHN0cmluZywgaW5pdDogUmVxdWVzdEluaXQgPSB7fSk6IFByb21pc2U8UmVzcG9uc2U+IHtcclxuXHRcdFx0bGV0IGNhY2hlID0gYXdhaXQgY2FjaGVzLm9wZW4oJ2ZldGNoJyk7XHJcblx0XHRcdGxldCByZXNwb25zZSA9IGF3YWl0IGNhY2hlLm1hdGNoKHVybCk7XHJcblx0XHRcdGlmIChyZXNwb25zZSkge1xyXG5cdFx0XHRcdHJlc3BvbnNlLmNhY2hlZEF0ID0gK3Jlc3BvbnNlLmhlYWRlcnMuZ2V0KCdjYWNoZWQtYXQnKSB8fCAwO1xyXG5cdFx0XHRcdHJldHVybiByZXNwb25zZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwgeyAuLi5kZWZhdWx0cywgLi4uaW5pdCB9KTtcclxuXHRcdFx0aWYgKHJlc3BvbnNlLm9rKSB7XHJcblx0XHRcdFx0cmVzcG9uc2UuY2FjaGVkQXQgPSBEYXRlLm5vdygpO1xyXG5cdFx0XHRcdGxldCBjbG9uZSA9IHJlc3BvbnNlLmNsb25lKCk7XHJcblx0XHRcdFx0bGV0IGluaXQ6IFJlc3BvbnNlSW5pdCA9IHtcclxuXHRcdFx0XHRcdHN0YXR1czogY2xvbmUuc3RhdHVzLCBzdGF0dXNUZXh0OiBjbG9uZS5zdGF0dXNUZXh0LFxyXG5cdFx0XHRcdFx0aGVhZGVyczogW1snY2FjaGVkLWF0JywgYCR7cmVzcG9uc2UuY2FjaGVkQXR9YF0sIC4uLmNsb25lLmhlYWRlcnMuZW50cmllcygpXVxyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0bGV0IHJlc3VsdFJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKGNsb25lLmJvZHksIGluaXQpO1xyXG5cdFx0XHRcdGNhY2hlLnB1dCh1cmwsIHJlc3VsdFJlc3BvbnNlKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gcmVzcG9uc2U7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhY2hlZERvYyh1cmw6IHN0cmluZywgaW5pdDogUmVxdWVzdEluaXQgPSB7fSk6IFByb21pc2U8RG9jdW1lbnQ+IHtcclxuXHRcdFx0bGV0IHJlc3BvbnNlID0gYXdhaXQgY2FjaGVkKHVybCwgaW5pdCk7XHJcblx0XHRcdGxldCB0ZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xyXG5cdFx0XHRsZXQgcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xyXG5cdFx0XHRsZXQgZG9jID0gcGFyc2VyLnBhcnNlRnJvbVN0cmluZyh0ZXh0LCAndGV4dC9odG1sJyk7XHJcblx0XHRcdGxldCBiYXNlID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2Jhc2UnKTtcclxuXHRcdFx0YmFzZS5ocmVmID0gdXJsO1xyXG5cdFx0XHRkb2MuaGVhZC5hcHBlbmQoYmFzZSk7XHJcblx0XHRcdGRvYy5jYWNoZWRBdCA9IHJlc3BvbnNlLmNhY2hlZEF0O1xyXG5cdFx0XHRyZXR1cm4gZG9jO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWNoZWRKc29uKHVybDogc3RyaW5nLCBpbml0OiBSZXF1ZXN0SW5pdCA9IHt9KTogUHJvbWlzZTx1bmtub3duPiB7XHJcblx0XHRcdGxldCByZXNwb25zZSA9IGF3YWl0IGNhY2hlZCh1cmwsIGluaXQpO1xyXG5cdFx0XHRsZXQganNvbiA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuXHRcdFx0aWYgKCEoJ2NhY2hlZCcgaW4ganNvbikpIHtcclxuXHRcdFx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoanNvbiwgJ2NhY2hlZCcsIHJlc3BvbnNlLmNhY2hlZEF0KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4ganNvbjtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgYXN5bmMgZnVuY3Rpb24gZG9jKHVybDogc3RyaW5nKTogUHJvbWlzZTxEb2N1bWVudD4ge1xyXG5cdFx0XHRsZXQgcCA9IFByb21pc2VFeHRlbnNpb24uZW1wdHkoKTtcclxuXHRcdFx0bGV0IG9SZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuXHRcdFx0b1JlcS5vbmxvYWQgPSBwLnI7XHJcblx0XHRcdG9SZXEucmVzcG9uc2VUeXBlID0gJ2RvY3VtZW50JztcclxuXHRcdFx0b1JlcS5vcGVuKFwiZ2V0XCIsIHVybCwgdHJ1ZSk7XHJcblx0XHRcdG9SZXEuc2VuZCgpO1xyXG5cdFx0XHRhd2FpdCBwO1xyXG5cdFx0XHRyZXR1cm4gb1JlcS5yZXNwb25zZVhNTDtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgYXN5bmMgZnVuY3Rpb24ganNvbih1cmw6IHN0cmluZywgaW5pdDogUmVxdWVzdEluaXQgPSB7fSk6IFByb21pc2U8dW5rbm93bj4ge1xyXG5cdFx0XHRyZXR1cm4gZmV0Y2godXJsLCB7IC4uLmRlZmF1bHRzLCAuLi5pbml0IH0pLnRoZW4oZSA9PiBlLmpzb24oKSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsZWFyQ2FjaGUoKSB7XHJcblx0XHRcdHJldHVybiBjYWNoZXMuZGVsZXRlKCdmZXRjaCcpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFbnRyeUZpbHRlcmVyRXh0ZW5zaW9uIHtcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIGNhbiBiZSBlaXRoZXIgTWFwIG9yIFdlYWtNYXBcclxuXHRcdCAqIChXZWFrTWFwIGlzIGxpa2VseSB0byBiZSB1c2VsZXNzIGlmIHRoZXJlIGFyZSBsZXNzIHRoZW4gMTBrIG9sZCBub2RlcyBpbiBtYXApXHJcblx0XHQgKi9cclxuXHRcdGxldCBNYXBUeXBlID0gTWFwO1xyXG5cdFx0dHlwZSBNYXBUeXBlPEsgZXh0ZW5kcyBvYmplY3QsIFY+ID0vLyBNYXA8SywgVj4gfCBcclxuXHRcdFx0V2Vha01hcDxLLCBWPjtcclxuXHJcblx0XHRleHBvcnQgY2xhc3MgRW50cnlGaWx0ZXJlcjxEYXRhIGV4dGVuZHMge30gPSB7fT4ge1xyXG5cdFx0XHRvbiA9IHRydWU7XHJcblx0XHRcdGNvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcblx0XHRcdGVudHJ5U2VsZWN0b3I6IHNlbGVjdG9yIHwgKCgpID0+IEhUTUxFbGVtZW50W10pO1xyXG5cdFx0XHRjb25zdHJ1Y3RvcihlbnRyeVNlbGVjdG9yOiBzZWxlY3RvciB8ICgoKSA9PiBIVE1MRWxlbWVudFtdKSwgZW5hYmxlZCA9IHRydWUpIHtcclxuXHRcdFx0XHR0aGlzLmVudHJ5U2VsZWN0b3IgPSBlbnRyeVNlbGVjdG9yO1xyXG5cdFx0XHRcdHRoaXMuY29udGFpbmVyID0gZWxtKCcuZWYtY29udGFpbmVyJyk7XHJcblx0XHRcdFx0aWYgKCFlbnRyeVNlbGVjdG9yKSB7XHJcblx0XHRcdFx0XHQvLyBkaXNhYmxlIGlmIG5vIHNlbGVjdG9yIHByb3ZpZGVkIChsaWtlbHkgaXMgYSBnZW5lcmljIGVmKVxyXG5cdFx0XHRcdFx0dGhpcy5kaXNhYmxlKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICghZW5hYmxlZCkge1xyXG5cdFx0XHRcdFx0dGhpcy5kaXNhYmxlKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChlbmFibGVkKSB7XHJcblx0XHRcdFx0XHR0aGlzLnN0eWxlKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMudXBkYXRlKCk7XHJcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcjxQYWdpbmF0ZUV4dGVuc2lvbi5QTW9kaWZ5RXZlbnQ+KCdwYWdpbmF0aW9ubW9kaWZ5JywgKCkgPT4gdGhpcy5yZXF1ZXN0VXBkYXRlKCkpO1xyXG5cdFx0XHRcdGV0Yy5vbmhlaWdodGNoYW5nZSgoKSA9PiB0aGlzLnJlcXVlc3RVcGRhdGUoKSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGVudHJpZXM6IEhUTUxFbGVtZW50W10gPSBbXTtcclxuXHRcdFx0ZW50cnlEYXRhczogTWFwVHlwZTxIVE1MRWxlbWVudCwgRGF0YT4gPSBuZXcgTWFwVHlwZSgpO1xyXG5cdFx0XHRnZXREYXRhKGVsOiBIVE1MRWxlbWVudCkge1xyXG5cdFx0XHRcdGxldCBkYXRhID0gdGhpcy5lbnRyeURhdGFzLmdldChlbCk7XHJcblx0XHRcdFx0aWYgKCFkYXRhKSB7XHJcblx0XHRcdFx0XHRkYXRhID0gdGhpcy5wYXJzZUVudHJ5KGVsKTtcclxuXHRcdFx0XHRcdHRoaXMuZW50cnlEYXRhcy5zZXQoZWwsIGRhdGEpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gZGF0YTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dXBkYXRlUGVuZGluZyA9IGZhbHNlO1xyXG5cdFx0XHRyZXBhcnNlUGVuZGluZyA9IGZhbHNlO1xyXG5cdFx0XHRyZXF1ZXN0VXBkYXRlKHJlcGFyc2UgPSBmYWxzZSkge1xyXG5cdFx0XHRcdGlmICh0aGlzLnVwZGF0ZVBlbmRpbmcpIHJldHVybjtcclxuXHRcdFx0XHR0aGlzLnVwZGF0ZVBlbmRpbmcgPSB0cnVlO1xyXG5cdFx0XHRcdGlmIChyZXBhcnNlKSB0aGlzLnJlcGFyc2VQZW5kaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHRzZXRUaW1lb3V0KCgpID0+IHRoaXMudXBkYXRlKCkpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRwYXJzZXJzOiBQYXJzZXJGbjxEYXRhPltdID0gW107XHJcblx0XHRcdHdyaXRlRGF0YUF0dHJpYnV0ZSA9IGZhbHNlO1xyXG5cdFx0XHRhZGRQYXJzZXIocGFyc2VyOiBQYXJzZXJGbjxEYXRhPikge1xyXG5cdFx0XHRcdHRoaXMucGFyc2Vycy5wdXNoKHBhcnNlcik7XHJcblx0XHRcdFx0dGhpcy5yZXF1ZXN0VXBkYXRlKHRydWUpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHBhcnNlRW50cnkoZWw6IEhUTUxFbGVtZW50KTogRGF0YSB7XHJcblx0XHRcdFx0bGV0IGRhdGE6IERhdGEgPSB7fSBhcyBEYXRhO1xyXG5cdFx0XHRcdGZvciAobGV0IHBhcnNlciBvZiB0aGlzLnBhcnNlcnMpIHtcclxuXHRcdFx0XHRcdGxldCBuZXdEYXRhID0gcGFyc2VyKGVsLCBkYXRhKTtcclxuXHRcdFx0XHRcdGlmICghbmV3RGF0YSB8fCBuZXdEYXRhID09IGRhdGEpIGNvbnRpbnVlO1xyXG5cdFx0XHRcdFx0aWYgKCFJc1Byb21pc2UobmV3RGF0YSkpIHtcclxuXHRcdFx0XHRcdFx0T2JqZWN0LmFzc2lnbihkYXRhLCBuZXdEYXRhKTtcclxuXHRcdFx0XHRcdFx0Y29udGludWU7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRuZXdEYXRhLnRoZW4ocE5ld0RhdGEgPT4ge1xyXG5cdFx0XHRcdFx0XHRpZiAocE5ld0RhdGEgJiYgcE5ld0RhdGEgIT0gZGF0YSkge1xyXG5cdFx0XHRcdFx0XHRcdE9iamVjdC5hc3NpZ24oZGF0YSwgcE5ld0RhdGEpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdHRoaXMucmVxdWVzdFVwZGF0ZSgpO1xyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMud3JpdGVEYXRhQXR0cmlidXRlKSB7XHJcblx0XHRcdFx0XHRlbC5zZXRBdHRyaWJ1dGUoJ2VmLWRhdGEnLCBKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBkYXRhO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRhZGRJdGVtPElULCBUIGV4dGVuZHMgSVQsIElTIGV4dGVuZHMgRmlsdGVyZXJJdGVtUGFydGlhbCwgUywgVFMgZXh0ZW5kcyBTICYgSVMgJiBGaWx0ZXJlckl0ZW1Tb3VyY2U+KGNvbnN0cnVjdG9yOiB7IG5ldyhkYXRhOiBUUyk6IFQgfSwgbGlzdDogSVRbXSwgZGF0YTogSVMsIHNvdXJjZTogUyk6IFQge1xyXG5cdFx0XHRcdE9iamVjdC5hc3NpZ24oZGF0YSwgc291cmNlLCB7IHBhcmVudDogdGhpcyB9KTtcclxuXHRcdFx0XHRkYXRhLm5hbWUgPz89IGRhdGEuaWQ7XHJcblx0XHRcdFx0bGV0IGl0ZW0gPSBuZXcgY29uc3RydWN0b3IoZGF0YSBhcyBUUyk7XHJcblx0XHRcdFx0bGlzdC5wdXNoKGl0ZW0pO1xyXG5cdFx0XHRcdHJldHVybiBpdGVtO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmaWx0ZXJzOiBJRmlsdGVyPERhdGE+W10gPSBbXTtcclxuXHRcdFx0c29ydGVyczogSVNvcnRlcjxEYXRhPltdID0gW107XHJcblx0XHRcdG1vZGlmaWVyczogSU1vZGlmaWVyPERhdGE+W10gPSBbXTtcclxuXHJcblx0XHRcdGFkZEZpbHRlcihpZDogc3RyaW5nLCBmaWx0ZXI6IEZpbHRlckZuPERhdGE+LCBkYXRhOiBGaWx0ZXJQYXJ0aWFsPERhdGE+ID0ge30pOiBGaWx0ZXI8RGF0YT4ge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmFkZEl0ZW0oRmlsdGVyLCB0aGlzLmZpbHRlcnMsIGRhdGEsIHsgaWQsIGZpbHRlciB9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRhZGRWRmlsdGVyPFYgZXh0ZW5kcyBudW1iZXIgfCBzdHJpbmc+KGlkOiBzdHJpbmcsIGZpbHRlcjogVmFsdWVGaWx0ZXJGbjxEYXRhLCBWPiwgZGF0YTogVmFsdWVGaWx0ZXJQYXJ0aWFsPERhdGEsIFY+KTogVmFsdWVGaWx0ZXI8RGF0YSwgVj47XHJcblx0XHRcdGFkZFZGaWx0ZXI8ViBleHRlbmRzIG51bWJlciB8IHN0cmluZz4oaWQ6IHN0cmluZywgZmlsdGVyOiBWYWx1ZUZpbHRlckZuPERhdGEsIFY+LCBkYXRhOiBWKTtcclxuXHRcdFx0YWRkVkZpbHRlcjxWIGV4dGVuZHMgbnVtYmVyIHwgc3RyaW5nPihpZDogc3RyaW5nLCBmaWx0ZXI6IFZhbHVlRmlsdGVyRm48RGF0YSwgVj4sIGRhdGE6IFZhbHVlRmlsdGVyUGFydGlhbDxEYXRhLCBWPiB8IFYpIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIGRhdGEgIT0gJ29iamVjdCcgfHwgIWRhdGEpIHtcclxuXHRcdFx0XHRcdGRhdGEgPSB7IGlucHV0OiBkYXRhIGFzIFYgfTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuYWRkSXRlbShWYWx1ZUZpbHRlciwgdGhpcy5maWx0ZXJzLCBkYXRhLCB7IGlkLCBmaWx0ZXIgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0YWRkU29ydGVyPFYgZXh0ZW5kcyBudW1iZXIgfCBzdHJpbmc+KGlkOiBzdHJpbmcsIHNvcnRlcjogU29ydGVyRm48RGF0YSwgVj4sIGRhdGE6IFNvcnRlclBhcnRpYWxTb3VyY2U8RGF0YSwgVj4gPSB7fSk6IFNvcnRlcjxEYXRhLCBWPiB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuYWRkSXRlbShTb3J0ZXIsIHRoaXMuc29ydGVycywgZGF0YSwgeyBpZCwgc29ydGVyIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFkZE1vZGlmaWVyKGlkOiBzdHJpbmcsIG1vZGlmaWVyOiBNb2RpZmllckZuPERhdGE+LCBkYXRhOiBNb2RpZmllclBhcnRpYWw8RGF0YT4gPSB7fSk6IE1vZGlmaWVyPERhdGE+IHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hZGRJdGVtKE1vZGlmaWVyLCB0aGlzLm1vZGlmaWVycywgZGF0YSwgeyBpZCwgbW9kaWZpZXIgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0YWRkUHJlZml4KGlkOiBzdHJpbmcsIHByZWZpeDogUHJlZml4ZXJGbjxEYXRhPiwgZGF0YTogUHJlZml4ZXJQYXJ0aWFsPERhdGE+ID0ge30pOiBQcmVmaXhlcjxEYXRhPiB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuYWRkSXRlbShQcmVmaXhlciwgdGhpcy5tb2RpZmllcnMsIGRhdGEsIHsgaWQsIHByZWZpeCB9KTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZmlsdGVyRW50cmllcygpIHtcclxuXHRcdFx0XHRmb3IgKGxldCBlbCBvZiB0aGlzLmVudHJpZXMpIHtcclxuXHRcdFx0XHRcdGxldCBkYXRhID0gdGhpcy5nZXREYXRhKGVsKTtcclxuXHRcdFx0XHRcdGxldCB2YWx1ZSA9IHRydWU7XHJcblx0XHRcdFx0XHRmb3IgKGxldCBmaWx0ZXIgb2YgdGhpcy5maWx0ZXJzKSB7XHJcblx0XHRcdFx0XHRcdHZhbHVlID0gdmFsdWUgJiYgZmlsdGVyLmFwcGx5KGRhdGEsIGVsKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsLmNsYXNzTGlzdC50b2dnbGUoJ2VmLWZpbHRlcmVkLW91dCcsICF2YWx1ZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRvcmRlcmVkRW50cmllczogSFRNTEVsZW1lbnRbXSA9IFtdO1xyXG5cdFx0XHRzb3J0RW50cmllcygpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5lbnRyaWVzLmxlbmd0aCA9PSAwKSByZXR1cm47XHJcblx0XHRcdFx0aWYgKHRoaXMub3JkZXJlZEVudHJpZXMubGVuZ3RoID09IDApIHRoaXMub3JkZXJlZEVudHJpZXMgPSB0aGlzLmVudHJpZXM7XHJcblx0XHRcdFx0bGV0IGVudHJpZXMgPSB0aGlzLmVudHJpZXM7XHJcblx0XHRcdFx0bGV0IHBhaXJzOiBbRGF0YSwgSFRNTEVsZW1lbnRdW10gPSBlbnRyaWVzLm1hcChlID0+IFt0aGlzLmdldERhdGEoZSksIGVdKTtcclxuXHRcdFx0XHRmb3IgKGxldCBzb3J0ZXIgb2YgdGhpcy5zb3J0ZXJzKSB7XHJcblx0XHRcdFx0XHRpZiAoc29ydGVyLm1vZGUgIT0gJ29mZicpIHtcclxuXHRcdFx0XHRcdFx0cGFpcnMgPSBzb3J0ZXIuc29ydChwYWlycyk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVudHJpZXMgPSBwYWlycy5tYXAoZSA9PiBlWzFdKTtcclxuXHRcdFx0XHRpZiAoZW50cmllcy5ldmVyeSgoZSwgaSkgPT4gZSA9PSB0aGlzLm9yZGVyZWRFbnRyaWVzW2ldKSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRsZXQgYnIgPSBlbG0oYCR7ZW50cmllc1swXT8udGFnTmFtZX0uZWYtYmVmb3JlLXNvcnRbaGlkZGVuXWApO1xyXG5cdFx0XHRcdHRoaXMub3JkZXJlZEVudHJpZXNbMF0uYmVmb3JlKGJyKTtcclxuXHRcdFx0XHRici5hZnRlciguLi5lbnRyaWVzKTtcclxuXHRcdFx0XHRici5yZW1vdmUoKTtcclxuXHRcdFx0XHR0aGlzLm9yZGVyZWRFbnRyaWVzID0gZW50cmllcztcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0bW9kaWZ5RW50cmllcygpIHtcclxuXHRcdFx0XHRsZXQgZW50cmllcyA9IHRoaXMuZW50cmllcztcclxuXHRcdFx0XHRsZXQgcGFpcnM6IFtIVE1MRWxlbWVudCwgRGF0YV1bXSA9IGVudHJpZXMubWFwKGUgPT4gW2UsIHRoaXMuZ2V0RGF0YShlKV0pO1xyXG5cdFx0XHRcdGZvciAobGV0IG1vZGlmaWVyIG9mIHRoaXMubW9kaWZpZXJzKSB7XHJcblx0XHRcdFx0XHRmb3IgKGxldCBbZSwgZF0gb2YgcGFpcnMpIHtcclxuXHRcdFx0XHRcdFx0bW9kaWZpZXIuYXBwbHkoZCwgZSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRtb3ZlVG9Ub3AoaXRlbTogSVNvcnRlcjxEYXRhPiB8IElNb2RpZmllcjxEYXRhPikge1xyXG5cdFx0XHRcdGlmICh0aGlzLnNvcnRlcnMuaW5jbHVkZXMoaXRlbSBhcyBJU29ydGVyPERhdGE+KSkge1xyXG5cdFx0XHRcdFx0dGhpcy5zb3J0ZXJzLnNwbGljZSh0aGlzLnNvcnRlcnMuaW5kZXhPZihpdGVtIGFzIElTb3J0ZXI8RGF0YT4pLCAxKTtcclxuXHRcdFx0XHRcdHRoaXMuc29ydGVycy5wdXNoKGl0ZW0gYXMgSVNvcnRlcjxEYXRhPik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGlmaWVycy5pbmNsdWRlcyhpdGVtIGFzIElNb2RpZmllcjxEYXRhPikpIHtcclxuXHRcdFx0XHRcdHRoaXMubW9kaWZpZXJzLnNwbGljZSh0aGlzLm1vZGlmaWVycy5pbmRleE9mKGl0ZW0gYXMgSU1vZGlmaWVyPERhdGE+KSwgMSk7XHJcblx0XHRcdFx0XHR0aGlzLm1vZGlmaWVycy5wdXNoKGl0ZW0gYXMgSU1vZGlmaWVyPERhdGE+KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHVwZGF0ZShyZXBhcnNlID0gdGhpcy5yZXBhcnNlUGVuZGluZykge1xyXG5cdFx0XHRcdHRoaXMudXBkYXRlUGVuZGluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdGlmICh0aGlzLmRpc2FibGVkKSByZXR1cm47XHJcblx0XHRcdFx0aWYgKHJlcGFyc2UpIHtcclxuXHRcdFx0XHRcdHRoaXMuZW50cnlEYXRhcyA9IG5ldyBNYXBUeXBlKCk7XHJcblx0XHRcdFx0XHR0aGlzLnJlcGFyc2VQZW5kaW5nID0gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICghdGhpcy5jb250YWluZXIuY2xvc2VzdCgnYm9keScpKSB7XHJcblx0XHRcdFx0XHR0aGlzLmNvbnRhaW5lci5hcHBlbmRUbygnYm9keScpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLmVudHJpZXMgPSB0eXBlb2YgdGhpcy5lbnRyeVNlbGVjdG9yID09ICdmdW5jdGlvbicgPyB0aGlzLmVudHJ5U2VsZWN0b3IoKSA6IHFxKHRoaXMuZW50cnlTZWxlY3Rvcik7XHJcblx0XHRcdFx0dGhpcy5maWx0ZXJFbnRyaWVzKCk7XHJcblx0XHRcdFx0dGhpcy5zb3J0RW50cmllcygpO1xyXG5cdFx0XHRcdHRoaXMubW9kaWZ5RW50cmllcygpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRvZmZJbmNvbXBhdGlibGUoaW5jb21wYXRpYmxlOiBzdHJpbmdbXSkge1xyXG5cdFx0XHRcdGZvciAobGV0IGZpbHRlciBvZiB0aGlzLmZpbHRlcnMpIHtcclxuXHRcdFx0XHRcdGlmIChpbmNvbXBhdGlibGUuaW5jbHVkZXMoZmlsdGVyLmlkKSkge1xyXG5cdFx0XHRcdFx0XHRmaWx0ZXIudG9nZ2xlTW9kZSgnb2ZmJyk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZvciAobGV0IHNvcnRlciBvZiB0aGlzLnNvcnRlcnMpIHtcclxuXHRcdFx0XHRcdGlmIChpbmNvbXBhdGlibGUuaW5jbHVkZXMoc29ydGVyLmlkKSkge1xyXG5cdFx0XHRcdFx0XHRzb3J0ZXIudG9nZ2xlTW9kZSgnb2ZmJyk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZvciAobGV0IG1vZGlmaWVyIG9mIHRoaXMubW9kaWZpZXJzKSB7XHJcblx0XHRcdFx0XHRpZiAoaW5jb21wYXRpYmxlLmluY2x1ZGVzKG1vZGlmaWVyLmlkKSkge1xyXG5cdFx0XHRcdFx0XHRtb2RpZmllci50b2dnbGVNb2RlKCdvZmYnKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHN0eWxlKHMgPSAnJykge1xyXG5cdFx0XHRcdEVudHJ5RmlsdGVyZXIuc3R5bGUocyk7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHRcdH1cclxuXHRcdFx0c3RhdGljIHN0eWxlKHMgPSAnJykge1xyXG5cdFx0XHRcdGxldCBzdHlsZSA9IHEoJ3N0eWxlLmVmLXN0eWxlJykgfHwgZWxtKCdzdHlsZS5lZi1zdHlsZScpLmFwcGVuZFRvKCdoZWFkJyk7XHJcblx0XHRcdFx0c3R5bGUuaW5uZXJIVE1MID0gYFxyXG5cdFx0XHRcdFx0LmVmLWNvbnRhaW5lciB7XHJcblx0XHRcdFx0XHRcdGRpc3BsYXk6IGZsZXg7XHJcblx0XHRcdFx0XHRcdGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XHJcblx0XHRcdFx0XHRcdHBvc2l0aW9uOiBmaXhlZDtcclxuXHRcdFx0XHRcdFx0dG9wOiAwO1xyXG5cdFx0XHRcdFx0XHRyaWdodDogMDtcclxuXHRcdFx0XHRcdFx0ei1pbmRleDogOTk5OTk5OTk5OTk5OTk5OTk5OTtcclxuXHRcdFx0XHRcdFx0bWluLXdpZHRoOiAxMDBweDtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC5lZi1lbnRyeSB7fVxyXG5cclxuXHRcdFx0XHRcdC5lZi1maWx0ZXJlZC1vdXQge1xyXG5cdFx0XHRcdFx0XHRkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0YnV0dG9uLmVmLWl0ZW0ge31cclxuXHRcdFx0XHRcdGJ1dHRvbi5lZi1pdGVtW2VmLW1vZGU9XCJvZmZcIl0ge1xyXG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kOiBsaWdodGdyYXk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRidXR0b24uZWYtaXRlbVtlZi1tb2RlPVwib25cIl0ge1xyXG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kOiBsaWdodGdyZWVuO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0YnV0dG9uLmVmLWl0ZW1bZWYtbW9kZT1cIm9wcG9zaXRlXCJdIHtcclxuXHRcdFx0XHRcdFx0YmFja2dyb3VuZDogeWVsbG93O1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGJ1dHRvbi5lZi1pdGVtLmVmLWZpbHRlciA+IGlucHV0IHtcclxuXHRcdFx0XHRcdFx0ZmxvYXQ6IHJpZ2h0O1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFtlZi1wcmVmaXhdOjpiZWZvcmUge1xyXG5cdFx0XHRcdFx0XHRjb250ZW50OiBhdHRyKGVmLXByZWZpeCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRbZWYtcG9zdGZpeF06OmFmdGVyIHtcclxuXHRcdFx0XHRcdFx0Y29udGVudDogYXR0cihlZi1wb3N0Zml4KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdGAgKyBzO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRkaXNhYmxlZCA9IGZhbHNlO1xyXG5cdFx0XHRkaXNhYmxlKCkge1xyXG5cdFx0XHRcdHRoaXMuZGlzYWJsZWQgPSB0cnVlO1xyXG5cdFx0XHRcdHRoaXMuY29udGFpbmVyLnJlbW92ZSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVuYWJsZSgpIHtcclxuXHRcdFx0XHR0aGlzLmRpc2FibGVkID0gZmFsc2U7XHJcblx0XHRcdFx0dGhpcy51cGRhdGVQZW5kaW5nID0gZmFsc2U7XHJcblx0XHRcdFx0dGhpcy5yZXF1ZXN0VXBkYXRlKCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNsZWFyKCkge1xyXG5cdFx0XHRcdHRoaXMuZW50cnlEYXRhcyA9IG5ldyBNYXAoKTtcclxuXHRcdFx0XHR0aGlzLnBhcnNlcnMuc3BsaWNlKDAsIDk5OSk7XHJcblx0XHRcdFx0dGhpcy5maWx0ZXJzLnNwbGljZSgwLCA5OTkpLm1hcChlID0+IGUucmVtb3ZlKCkpO1xyXG5cdFx0XHRcdHRoaXMuc29ydGVycy5zcGxpY2UoMCwgOTk5KS5tYXAoZSA9PiBlLnJlbW92ZSgpKTtcclxuXHRcdFx0XHR0aGlzLmVuYWJsZSgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRnZXQgX2RhdGFzKCkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmVudHJpZXMubWFwKGUgPT4gdGhpcy5nZXREYXRhKGUpKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBJc1Byb21pc2U8VD4ocDogUHJvbWlzZUxpa2U8VD4gfCBUKTogcCBpcyBQcm9taXNlTGlrZTxUPiB7XHJcblx0XHRcdGlmICghcCkgcmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRyZXR1cm4gdHlwZW9mIChwIGFzIFByb21pc2VMaWtlPFQ+KS50aGVuID09ICdmdW5jdGlvbic7XHJcblx0XHR9XHJcblx0fVxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblx0ZXhwb3J0IGNsYXNzIE9ic2VydmVyIHtcclxuXHRcdFxyXG5cdH1cclxufVxyXG5cclxuLypcclxuXHJcbmZ1bmN0aW9uIG9ic2VydmVDbGFzc0FkZChjbHMsIGNiKSB7XHJcblx0bGV0IHF1ZXVlZCA9IGZhbHNlO1xyXG5cdGFzeW5jIGZ1bmN0aW9uIHJ1bigpIHtcclxuXHRcdGlmIChxdWV1ZWQpIHJldHVybjtcclxuXHRcdHF1ZXVlZCA9IHRydWU7XHJcblx0XHRhd2FpdCBQcm9taXNlLmZyYW1lKCk7XHJcblx0XHRxdWV1ZWQgPSBmYWxzZTtcclxuXHRcdGNiKCk7XHJcblx0fVxyXG5cdG5ldyBNdXRhdGlvbk9ic2VydmVyKGxpc3QgPT4ge1xyXG5cdFx0Zm9yIChsZXQgbXIgb2YgbGlzdCkge1xyXG5cdFx0XHRpZiAobXIudHlwZSA9PSAnYXR0cmlidXRlcycgJiYgbXIuYXR0cmlidXRlTmFtZSA9PSAnY2xhc3MnKSB7XHJcblx0XHRcdFx0aWYgKG1yLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoY2xzKSkge1xyXG5cdFx0XHRcdFx0cnVuKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChtci50eXBlID09ICdjaGlsZExpc3QnKSB7XHJcblx0XHRcdFx0Zm9yIChsZXQgY2ggb2YgbXIuYWRkZWROb2Rlcykge1xyXG5cdFx0XHRcdFx0aWYgKGNoLmNsYXNzTGlzdD8uY29udGFpbnMoY2xzKSkge1xyXG5cdFx0XHRcdFx0XHRydW4oKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9KS5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHtcclxuXHRcdGNoaWxkTGlzdDogdHJ1ZSxcclxuXHRcdGF0dHJpYnV0ZXM6IHRydWUsXHJcblx0XHRzdWJ0cmVlOiB0cnVlLFxyXG5cdH0pO1xyXG59XHJcblxyXG4qLyIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIFBhZ2luYXRlRXh0ZW5zaW9uIHtcclxuXHJcblx0XHRleHBvcnQgdHlwZSBQUmVxdWVzdEV2ZW50ID0gQ3VzdG9tRXZlbnQ8e1xyXG5cdFx0XHRyZWFzb24/OiBFdmVudCxcclxuXHRcdFx0Y291bnQ6IG51bWJlcixcclxuXHRcdFx0Y29uc3VtZWQ6IG51bWJlcjtcclxuXHRcdFx0X2V2ZW50PzogJ3BhZ2luYXRpb25yZXF1ZXN0JyxcclxuXHRcdH0+O1xyXG5cdFx0ZXhwb3J0IHR5cGUgUFN0YXJ0RXZlbnQgPSBDdXN0b21FdmVudDx7XHJcblx0XHRcdHBhZ2luYXRlOiBQYWdpbmF0ZSxcclxuXHRcdFx0X2V2ZW50PzogJ3BhZ2luYXRpb25zdGFydCcsXHJcblx0XHR9PjtcclxuXHRcdGV4cG9ydCB0eXBlIFBFbmRFdmVudCA9IEN1c3RvbUV2ZW50PHtcclxuXHRcdFx0cGFnaW5hdGU6IFBhZ2luYXRlLFxyXG5cdFx0XHRfZXZlbnQ/OiAncGFnaW5hdGlvbmVuZCcsXHJcblx0XHR9PjtcclxuXHRcdGV4cG9ydCB0eXBlIFBNb2RpZnlFdmVudCA9IEN1c3RvbUV2ZW50PHtcclxuXHRcdFx0cGFnaW5hdGU6IFBhZ2luYXRlLFxyXG5cdFx0XHRhZGRlZDogSFRNTEVsZW1lbnRbXSxcclxuXHRcdFx0cmVtb3ZlZDogSFRNTEVsZW1lbnRbXSxcclxuXHRcdFx0c2VsZWN0b3I6IHNlbGVjdG9yLFxyXG5cdFx0XHRfZXZlbnQ/OiAncGFnaW5hdGlvbm1vZGlmeScsXHJcblx0XHR9PjtcclxuXHJcblx0XHRleHBvcnQgY2xhc3MgUGFnaW5hdGUge1xyXG5cdFx0XHRkb2M6IERvY3VtZW50O1xyXG5cclxuXHRcdFx0ZW5hYmxlZCA9IHRydWU7XHJcblx0XHRcdGNvbmRpdGlvbjogc2VsZWN0b3IgfCAoKCkgPT4gYm9vbGVhbik7XHJcblx0XHRcdHF1ZXVlZCA9IDA7XHJcblx0XHRcdHJ1bm5pbmcgPSBmYWxzZTtcclxuXHRcdFx0X2luaXRlZCA9IGZhbHNlO1xyXG5cclxuXHRcdFx0c3RhdGljIHNoaWZ0UmVxdWVzdENvdW50ID0gMTA7XHJcblx0XHRcdHN0YXRpYyBfaW5pdGVkID0gZmFsc2U7XHJcblx0XHRcdHN0YXRpYyByZW1vdmVEZWZhdWx0UnVuQmluZGluZ3M6ICgpID0+IHZvaWQ7XHJcblx0XHRcdHN0YXRpYyBhZGREZWZhdWx0UnVuQmluZGluZ3MoKSB7XHJcblx0XHRcdFx0UGFnaW5hdGUucmVtb3ZlRGVmYXVsdFJ1bkJpbmRpbmdzPy4oKTtcclxuXHRcdFx0XHRmdW5jdGlvbiBvbm1vdXNlZG93bihldmVudDogTW91c2VFdmVudCkge1xyXG5cdFx0XHRcdFx0aWYgKGV2ZW50LmJ1dHRvbiAhPSAxKSByZXR1cm47XHJcblx0XHRcdFx0XHRsZXQgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIEVsZW1lbnQ7XHJcblx0XHRcdFx0XHRpZiAodGFyZ2V0Py5jbG9zZXN0KCdhJykpIHJldHVybjtcclxuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFx0XHRsZXQgY291bnQgPSBldmVudC5zaGlmdEtleSA/IFBhZ2luYXRlLnNoaWZ0UmVxdWVzdENvdW50IDogMTtcclxuXHRcdFx0XHRcdFBhZ2luYXRlLnJlcXVlc3RQYWdpbmF0aW9uKGNvdW50LCBldmVudCwgdGFyZ2V0KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZnVuY3Rpb24gb25rZXlkb3duKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XHJcblx0XHRcdFx0XHRpZiAoZXZlbnQuY29kZSAhPSAnQWx0UmlnaHQnKSByZXR1cm47XHJcblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdFx0bGV0IGNvdW50ID0gZXZlbnQuc2hpZnRLZXkgPyBQYWdpbmF0ZS5zaGlmdFJlcXVlc3RDb3VudCA6IDE7XHJcblx0XHRcdFx0XHRsZXQgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIEVsZW1lbnQ7XHJcblx0XHRcdFx0XHRQYWdpbmF0ZS5yZXF1ZXN0UGFnaW5hdGlvbihjb3VudCwgZXZlbnQsIHRhcmdldCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIG9ubW91c2Vkb3duKTtcclxuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25rZXlkb3duKTtcclxuXHRcdFx0XHRQYWdpbmF0ZS5yZW1vdmVEZWZhdWx0UnVuQmluZGluZ3MgPSAoKSA9PiB7XHJcblx0XHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBvbm1vdXNlZG93bik7XHJcblx0XHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25rZXlkb3duKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHQvLyBsaXN0ZW5lcnNcclxuXHRcdFx0aW5pdCgpIHtcclxuXHRcdFx0XHRpZiAoIVBhZ2luYXRlLnJlbW92ZURlZmF1bHRSdW5CaW5kaW5ncykge1xyXG5cdFx0XHRcdFx0UGFnaW5hdGUuYWRkRGVmYXVsdFJ1bkJpbmRpbmdzKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0aGlzLl9pbml0ZWQpIHJldHVybjtcclxuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyPFBSZXF1ZXN0RXZlbnQ+KCdwYWdpbmF0aW9ucmVxdWVzdCcsIHRoaXMub25QYWdpbmF0aW9uUmVxdWVzdC5iaW5kKHRoaXMpKTtcclxuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyPFBFbmRFdmVudD4oJ3BhZ2luYXRpb25lbmQnLCB0aGlzLm9uUGFnaW5hdGlvbkVuZC5iaW5kKHRoaXMpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRvblBhZ2luYXRpb25SZXF1ZXN0KGV2ZW50OiBQUmVxdWVzdEV2ZW50KSB7XHJcblx0XHRcdFx0aWYgKHRoaXMuY2FuQ29uc3VtZVJlcXVlc3QoKSkge1xyXG5cdFx0XHRcdFx0ZXZlbnQuZGV0YWlsLmNvbnN1bWVkKys7XHJcblx0XHRcdFx0XHR0aGlzLnF1ZXVlZCArPSBldmVudC5kZXRhaWwuY291bnQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICghdGhpcy5ydW5uaW5nICYmIHRoaXMucXVldWVkKSB7XHJcblx0XHRcdFx0XHR0aGlzLmNvbnN1bWVSZXF1ZXN0KCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9O1xyXG5cdFx0XHRvblBhZ2luYXRpb25FbmQoZXZlbnQ6IFBFbmRFdmVudCkge1xyXG5cdFx0XHRcdGlmICh0aGlzLnF1ZXVlZCAmJiB0aGlzLmNhbkNvbnN1bWVSZXF1ZXN0KCkpIHtcclxuXHRcdFx0XHRcdHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XHJcblx0XHRcdFx0XHRcdGlmICghdGhpcy5jYW5Db25zdW1lUmVxdWVzdCgpKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKGB0aGlzIHBhZ2luYXRlIGNhbiBub3Qgd29yayBhbnltb3JlYCk7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5xdWV1ZWQgPSAwO1xyXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuY29uc3VtZVJlcXVlc3QoKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGNhbkNvbnN1bWVSZXF1ZXN0KCkge1xyXG5cdFx0XHRcdGlmICghdGhpcy5lbmFibGVkKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0aWYgKHRoaXMucnVubmluZykgcmV0dXJuIHRydWU7XHJcblx0XHRcdFx0aWYgKHRoaXMuY29uZGl0aW9uKSB7XHJcblx0XHRcdFx0XHRpZiAodHlwZW9mIHRoaXMuY29uZGl0aW9uID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdFx0aWYgKCF0aGlzLmNvbmRpdGlvbigpKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRpZiAoIWRvY3VtZW50LnEodGhpcy5jb25kaXRpb24pKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFzeW5jIGNvbnN1bWVSZXF1ZXN0KCkge1xyXG5cdFx0XHRcdGlmICh0aGlzLnJ1bm5pbmcpIHJldHVybjtcclxuXHRcdFx0XHR0aGlzLnF1ZXVlZC0tO1xyXG5cdFx0XHRcdHRoaXMucnVubmluZyA9IHRydWU7XHJcblx0XHRcdFx0dGhpcy5lbWl0U3RhcnQoKTtcclxuXHRcdFx0XHRhd2FpdCB0aGlzLm9ucnVuPy4oKTtcclxuXHRcdFx0XHR0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcclxuXHRcdFx0XHR0aGlzLmVtaXRFbmQoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRvbnJ1bjogKCkgPT4gUHJvbWlzZTx2b2lkPjtcclxuXHJcblxyXG5cdFx0XHQvLyBlbWl0dGVyc1xyXG5cdFx0XHRzdGF0aWMgcmVxdWVzdFBhZ2luYXRpb24oY291bnQgPSAxLCByZWFzb24/OiBFdmVudCwgdGFyZ2V0OiBFbGVtZW50ID0gZG9jdW1lbnQuYm9keSkge1xyXG5cdFx0XHRcdGxldCBkZXRhaWw6IFBSZXF1ZXN0RXZlbnRbJ2RldGFpbCddID0geyBjb3VudCwgcmVhc29uLCBjb25zdW1lZDogMCB9O1xyXG5cdFx0XHRcdGZ1bmN0aW9uIGZhaWwoZXZlbnQ6IFBSZXF1ZXN0RXZlbnQpIHtcclxuXHRcdFx0XHRcdGlmIChldmVudC5kZXRhaWwuY29uc3VtZWQgPT0gMCkge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFBhZ2luYXRpb24gcmVxdWVzdCBmYWlsZWQ6IG5vIGxpc3RlbmVyc2ApO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cmVtb3ZlRXZlbnRMaXN0ZW5lcigncGFnaW5hdGlvbnJlcXVlc3QnLCBmYWlsKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0YWRkRXZlbnRMaXN0ZW5lcigncGFnaW5hdGlvbnJlcXVlc3QnLCBmYWlsKTtcclxuXHRcdFx0XHR0YXJnZXQuZW1pdDxQUmVxdWVzdEV2ZW50PigncGFnaW5hdGlvbnJlcXVlc3QnLCB7IGNvdW50LCByZWFzb24sIGNvbnN1bWVkOiAwIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVtaXRTdGFydCgpIHtcclxuXHRcdFx0XHRkb2N1bWVudC5ib2R5LmVtaXQ8UFN0YXJ0RXZlbnQ+KCdwYWdpbmF0aW9uc3RhcnQnLCB7IHBhZ2luYXRlOiB0aGlzIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVtaXRNb2RpZnkoYWRkZWQsIHJlbW92ZWQsIHNlbGVjdG9yKSB7XHJcblx0XHRcdFx0ZG9jdW1lbnQuYm9keS5lbWl0PFBNb2RpZnlFdmVudD4oJ3BhZ2luYXRpb25tb2RpZnknLCB7IHBhZ2luYXRlOiB0aGlzLCBhZGRlZCwgcmVtb3ZlZCwgc2VsZWN0b3IgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZW1pdEVuZCgpIHtcclxuXHRcdFx0XHRkb2N1bWVudC5ib2R5LmVtaXQ8UEVuZEV2ZW50PigncGFnaW5hdGlvbmVuZCcsIHsgcGFnaW5hdGU6IHRoaXMgfSk7XHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHQvLyBmZXRjaGluZzogXHJcblx0XHRcdGFzeW5jIGZldGNoRG9jdW1lbnQobGluazogTGluaywgc3Bpbm5lciA9IHRydWUpOiBQcm9taXNlPERvY3VtZW50PiB7XHJcblx0XHRcdFx0dGhpcy5kb2MgPSBudWxsO1xyXG5cdFx0XHRcdGxldCBhID0gc3Bpbm5lciAmJiBQYWdpbmF0ZS5saW5rVG9BbmNob3IobGluayk7XHJcblx0XHRcdFx0YT8uY2xhc3NMaXN0LmFkZCgncGFnaW5hdGUtc3BpbicpO1xyXG5cdFx0XHRcdGxpbmsgPSBQYWdpbmF0ZS5saW5rVG9VcmwobGluayk7XHJcblx0XHRcdFx0dGhpcy5kb2MgPSBhd2FpdCBmZXRjaC5kb2MobGluayk7XHJcblx0XHRcdFx0YT8uY2xhc3NMaXN0LnJlbW92ZSgncGFnaW5hdGUtc3BpbicpO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmRvYztcclxuXHRcdFx0fVxyXG5cdFx0XHRhc3luYyBmZXRjaENhY2hlZERvY3VtZW50KGxpbms6IExpbmssIHNwaW5uZXIgPSB0cnVlKTogUHJvbWlzZTxEb2N1bWVudD4ge1xyXG5cdFx0XHRcdHRoaXMuZG9jID0gbnVsbDtcclxuXHRcdFx0XHRsZXQgYSA9IHNwaW5uZXIgJiYgUGFnaW5hdGUubGlua1RvQW5jaG9yKGxpbmspO1xyXG5cdFx0XHRcdGE/LmNsYXNzTGlzdC5hZGQoJ3BhZ2luYXRlLXNwaW4nKTtcclxuXHRcdFx0XHRsaW5rID0gUGFnaW5hdGUubGlua1RvVXJsKGxpbmspO1xyXG5cdFx0XHRcdHRoaXMuZG9jID0gYXdhaXQgZmV0Y2guY2FjaGVkLmRvYyhsaW5rKTtcclxuXHRcdFx0XHRhPy5jbGFzc0xpc3QucmVtb3ZlKCdwYWdpbmF0ZS1zcGluJyk7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuZG9jO1xyXG5cdFx0XHR9XHJcblx0XHRcdHByZWZldGNoKHNvdXJjZTogc2VsZWN0b3IpIHtcclxuXHRcdFx0XHRkb2N1bWVudC5xcTwnYSc+KHNvdXJjZSkubWFwKGUgPT4ge1xyXG5cdFx0XHRcdFx0aWYgKGUuaHJlZikge1xyXG5cdFx0XHRcdFx0XHRlbG0oYGxpbmtbcmVsPVwicHJlZmV0Y2hcIl1baHJlZj1cIiR7ZS5ocmVmfVwiXWApLmFwcGVuZFRvKCdoZWFkJyk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvLyBUT0RPOiBpZiBlLnNyY1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0Ly8gbW9kaWZpY2F0aW9uOiBcclxuXHRcdFx0YWZ0ZXIoc291cmNlOiBzZWxlY3RvciwgdGFyZ2V0OiBzZWxlY3RvciA9IHNvdXJjZSkge1xyXG5cdFx0XHRcdGxldCBhZGRlZCA9IHRoaXMuZG9jLnFxKHNvdXJjZSk7XHJcblx0XHRcdFx0aWYgKCFhZGRlZC5sZW5ndGgpIHJldHVybjtcclxuXHRcdFx0XHRsZXQgZm91bmQgPSBkb2N1bWVudC5xcSh0YXJnZXQpO1xyXG5cdFx0XHRcdGlmIChmb3VuZC5sZW5ndGggPT0gMCkgdGhyb3cgbmV3IEVycm9yKGBmYWlsZWQgdG8gZmluZCB3aGVyZSB0byBhcHBlbmRgKTtcclxuXHRcdFx0XHRmb3VuZC5wb3AoKS5hZnRlciguLi5hZGRlZCk7XHJcblx0XHRcdFx0dGhpcy5lbWl0TW9kaWZ5KGFkZGVkLCBbXSwgc291cmNlKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXBsYWNlRWFjaChzb3VyY2U6IHNlbGVjdG9yLCB0YXJnZXQ6IHNlbGVjdG9yID0gc291cmNlKSB7XHJcblx0XHRcdFx0bGV0IGFkZGVkID0gdGhpcy5kb2MucXEoc291cmNlKTtcclxuXHRcdFx0XHRsZXQgcmVtb3ZlZCA9IGRvY3VtZW50LnFxKHRhcmdldCk7XHJcblx0XHRcdFx0aWYgKGFkZGVkLmxlbmd0aCAhPSByZW1vdmVkLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKGBhZGRlZC9yZW1vdmVkIGNvdW50IG1pc21hdGNoYCk7XHJcblx0XHRcdFx0cmVtb3ZlZC5tYXAoKGUsIGkpID0+IGUucmVwbGFjZVdpdGgoYWRkZWRbaV0pKTtcclxuXHRcdFx0XHR0aGlzLmVtaXRNb2RpZnkoYWRkZWQsIHJlbW92ZWQsIHNvdXJjZSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmVwbGFjZShzb3VyY2U6IHNlbGVjdG9yLCB0YXJnZXQ6IHNlbGVjdG9yID0gc291cmNlKSB7XHJcblx0XHRcdFx0bGV0IGFkZGVkID0gdGhpcy5kb2MucXEoc291cmNlKTtcclxuXHRcdFx0XHRsZXQgcmVtb3ZlZCA9IGRvY3VtZW50LnFxKHRhcmdldCk7XHJcblx0XHRcdFx0aWYgKGFkZGVkLmxlbmd0aCAhPSByZW1vdmVkLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKGBub3QgaW1wbGVtZW50ZWRgKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5yZXBsYWNlRWFjaChzb3VyY2UsIHRhcmdldCk7XHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHQvLyB1dGlsXHJcblx0XHRcdHN0YXRpYyBsaW5rVG9VcmwobGluazogTGluayk6IHVybCB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiBsaW5rID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRpZiAobGluay5zdGFydHNXaXRoKCdodHRwJykpIHJldHVybiBsaW5rIGFzIHVybDtcclxuXHRcdFx0XHRcdGxpbmsgPSBkb2N1bWVudC5xPCdhJz4obGluayk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiAobGluayBhcyBIVE1MQW5jaG9yRWxlbWVudCkuaHJlZiBhcyB1cmw7XHJcblx0XHRcdH1cclxuXHRcdFx0c3RhdGljIGxpbmtUb0FuY2hvcihsaW5rOiBMaW5rKTogSFRNTEFuY2hvckVsZW1lbnQge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgbGluayA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0aWYgKGxpbmsuc3RhcnRzV2l0aCgnaHR0cCcpKSByZXR1cm4gbnVsbDtcclxuXHRcdFx0XHRcdHJldHVybiBkb2N1bWVudC5xPCdhJz4obGluayk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBsaW5rO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRzdGF0aWMgc3RhdGljQ2FsbDxUPihkYXRhOiB7XHJcblx0XHRcdFx0Y29uZGl0aW9uPzogc2VsZWN0b3IgfCAoKCkgPT4gYm9vbGVhbiksXHJcblx0XHRcdFx0cHJlZmV0Y2g/OiBzZWxlY3RvciB8IHNlbGVjdG9yW10sXHJcblx0XHRcdFx0Y2xpY2s/OiBzZWxlY3RvciB8IHNlbGVjdG9yW10sXHJcblx0XHRcdFx0ZG9jPzogc2VsZWN0b3IgfCBzZWxlY3RvcltdLFxyXG5cdFx0XHRcdGFmdGVyPzogc2VsZWN0b3IgfCBzZWxlY3RvcltdLFxyXG5cdFx0XHRcdHJlcGxhY2U/OiBzZWxlY3RvciB8IHNlbGVjdG9yW10sXHJcblx0XHRcdFx0c3RhcnQ/OiAoKSA9PiB2b2lkO1xyXG5cdFx0XHRcdGVuZD86ICgpID0+IHZvaWQ7XHJcblx0XHRcdH0pIHtcclxuXHRcdFx0XHRsZXQgcCA9IG5ldyBQYWdpbmF0ZSgpO1xyXG5cdFx0XHRcdHAuc3RhdGljQ2FsbChkYXRhKTtcclxuXHRcdFx0XHRyZXR1cm4gcDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0c3RhdGljQ2FsbChkYXRhOiB7XHJcblx0XHRcdFx0Y29uZGl0aW9uPzogc2VsZWN0b3IgfCAoKCkgPT4gYm9vbGVhbiksXHJcblx0XHRcdFx0cHJlZmV0Y2g/OiBzZWxlY3RvciB8IHNlbGVjdG9yW10sXHJcblx0XHRcdFx0Y2xpY2s/OiBzZWxlY3RvciB8IHNlbGVjdG9yW10sXHJcblx0XHRcdFx0ZG9jPzogc2VsZWN0b3IgfCBzZWxlY3RvcltdLFxyXG5cdFx0XHRcdGFmdGVyPzogc2VsZWN0b3IgfCBzZWxlY3RvcltdLFxyXG5cdFx0XHRcdHJlcGxhY2U/OiBzZWxlY3RvciB8IHNlbGVjdG9yW10sXHJcblx0XHRcdFx0c3RhcnQ/OiAoKSA9PiB2b2lkO1xyXG5cdFx0XHRcdGVuZD86ICgpID0+IHZvaWQ7XHJcblx0XHRcdH0pIHtcclxuXHRcdFx0XHRmdW5jdGlvbiB0b0FycmF5PFQ+KHY/OiBUIHwgVFtdIHwgdW5kZWZpbmVkKTogVFtdIHtcclxuXHRcdFx0XHRcdGlmIChBcnJheS5pc0FycmF5KHYpKSByZXR1cm4gdjtcclxuXHRcdFx0XHRcdGlmICh2ID09IG51bGwpIHJldHVybiBbXTtcclxuXHRcdFx0XHRcdHJldHVybiBbdl07XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZ1bmN0aW9uIHRvQ29uZGl0aW9uKHM/OiBzZWxlY3RvciB8ICgoKSA9PiBib29sZWFuKSB8IHVuZGVmaW5lZCk6ICgpID0+IGJvb2xlYW4ge1xyXG5cdFx0XHRcdFx0aWYgKCFzKSByZXR1cm4gKCkgPT4gdHJ1ZTtcclxuXHRcdFx0XHRcdGlmICh0eXBlb2YgcyA9PSAnc3RyaW5nJykgcmV0dXJuICgpID0+ICEhZG9jdW1lbnQucShzKTtcclxuXHRcdFx0XHRcdHJldHVybiBzO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRmdW5jdGlvbiBjYW5GaW5kKGE6IHNlbGVjdG9yW10pIHtcclxuXHRcdFx0XHRcdGlmIChhLmxlbmd0aCA9PSAwKSByZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHRcdHJldHVybiBhLnNvbWUocyA9PiAhIWRvY3VtZW50LnEocykpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRmdW5jdGlvbiBmaW5kT25lKGE6IHNlbGVjdG9yW10pIHtcclxuXHRcdFx0XHRcdHJldHVybiBhLmZpbmQocyA9PiBkb2N1bWVudC5xKHMpKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0bGV0IGZpeGVkRGF0YSA9IHtcclxuXHRcdFx0XHRcdGNvbmRpdGlvbjogdG9Db25kaXRpb24oZGF0YS5jb25kaXRpb24pLFxyXG5cdFx0XHRcdFx0cHJlZmV0Y2g6IHRvQXJyYXkoZGF0YS5wcmVmZXRjaClcclxuXHRcdFx0XHRcdFx0LmZsYXRNYXAoZSA9PiB0b0FycmF5KGRhdGFbZV0gPz8gZSkpLFxyXG5cdFx0XHRcdFx0ZG9jOiB0b0FycmF5KGRhdGEuZG9jKSxcclxuXHRcdFx0XHRcdGNsaWNrOiB0b0FycmF5KGRhdGEuY2xpY2spLFxyXG5cdFx0XHRcdFx0YWZ0ZXI6IHRvQXJyYXkoZGF0YS5hZnRlciksXHJcblx0XHRcdFx0XHRyZXBsYWNlOiB0b0FycmF5KGRhdGEucmVwbGFjZSksXHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHR0aGlzLmNvbmRpdGlvbiA9ICgpID0+IHtcclxuXHRcdFx0XHRcdGlmICghZml4ZWREYXRhLmNvbmRpdGlvbigpKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0XHRpZiAoIWNhbkZpbmQoZml4ZWREYXRhLmRvYykpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHRcdGlmICghY2FuRmluZChmaXhlZERhdGEuY2xpY2spKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHR9O1xyXG5cdFx0XHRcdHRoaXMuaW5pdCgpO1xyXG5cdFx0XHRcdGlmIChmaXhlZERhdGEuY29uZGl0aW9uKCkpIHtcclxuXHRcdFx0XHRcdGZpeGVkRGF0YS5wcmVmZXRjaC5tYXAocyA9PiB0aGlzLnByZWZldGNoKHMpKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5vbnJ1biA9IGFzeW5jICgpID0+IHtcclxuXHRcdFx0XHRcdC8vIGlmICghZml4ZWREYXRhLmNvbmRpdGlvbigpKSByZXR1cm47XHJcblx0XHRcdFx0XHRhd2FpdCBkYXRhLnN0YXJ0Py4oKTtcclxuXHRcdFx0XHRcdGZpeGVkRGF0YS5jbGljay5tYXAoZSA9PiBkb2N1bWVudC5xKGUpPy5jbGljaygpKTtcclxuXHRcdFx0XHRcdGxldCBkb2MgPSBmaW5kT25lKGZpeGVkRGF0YS5kb2MpO1xyXG5cdFx0XHRcdFx0aWYgKGRvYykgYXdhaXQgdGhpcy5mZXRjaERvY3VtZW50KGRvYyk7XHJcblx0XHRcdFx0XHRmaXhlZERhdGEuYWZ0ZXIubWFwKHMgPT4gdGhpcy5hZnRlcihzKSk7XHJcblx0XHRcdFx0XHRmaXhlZERhdGEucmVwbGFjZS5tYXAocyA9PiB0aGlzLnJlcGxhY2UocykpO1xyXG5cdFx0XHRcdFx0YXdhaXQgZGF0YS5lbmQ/LigpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHR9XHJcblx0XHR0eXBlIFNlbE9yRWwgPSBzZWxlY3RvciB8IEhUTUxFbGVtZW50O1xyXG5cdFx0dHlwZSBTb21laG93PFQ+ID0gbnVsbCB8IFQgfCBUW10gfCAoKCkgPT4gKG51bGwgfCBUIHwgVFtdKSk7XHJcblx0XHR0eXBlIFNvbWVob3dBc3luYzxUPiA9IG51bGwgfCBUIHwgVFtdIHwgKCgpID0+IChudWxsIHwgVCB8IFRbXSB8IFByb21pc2U8bnVsbCB8IFQgfCBUW10+KSk7XHJcblxyXG5cdFx0ZXhwb3J0IGNvbnN0IHBhZ2luYXRlID0gT2JqZWN0LnNldFByb3RvdHlwZU9mKFBhZ2luYXRlLnN0YXRpY0NhbGwuYmluZChQYWdpbmF0ZSksIG5ldyBQYWdpbmF0ZSgpKTtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBjb25zdCBwYWdpbmF0ZSA9IFBhZ2luYXRlRXh0ZW5zaW9uLnBhZ2luYXRlO1xyXG5cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cdGV4cG9ydCBuYW1lc3BhY2UgSW1hZ2VTY3JvbGxpbmdFeHRlbnNpb24ge1xyXG5cclxuXHRcdGV4cG9ydCBsZXQgaW1hZ2VTY3JvbGxpbmdBY3RpdmUgPSBmYWxzZTtcclxuXHRcdGV4cG9ydCBsZXQgaW1nU2VsZWN0b3IgPSAnaW1nJztcclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gaW1hZ2VTY3JvbGxpbmcoc2VsZWN0b3I/OiBzdHJpbmcpIHtcclxuXHRcdFx0aWYgKGltYWdlU2Nyb2xsaW5nQWN0aXZlKSByZXR1cm47XHJcblx0XHRcdGlmIChzZWxlY3RvcikgaW1nU2VsZWN0b3IgPSBzZWxlY3RvcjtcclxuXHRcdFx0aW1hZ2VTY3JvbGxpbmdBY3RpdmUgPSB0cnVlO1xyXG5cdFx0XHRmdW5jdGlvbiBvbndoZWVsKGV2ZW50OiBNb3VzZUV2ZW50ICYgeyB3aGVlbERlbHRhWTogbnVtYmVyIH0pIHtcclxuXHRcdFx0XHRpZiAoZXZlbnQuc2hpZnRLZXkgfHwgZXZlbnQuY3RybEtleSkgcmV0dXJuO1xyXG5cdFx0XHRcdGlmIChzY3JvbGxXaG9sZUltYWdlKC1NYXRoLnNpZ24oZXZlbnQud2hlZWxEZWx0YVkpKSkge1xyXG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIG9ud2hlZWwsIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdHJldHVybiBpbWFnZVNjcm9sbGluZ09mZiA9ICgpID0+IHtcclxuXHRcdFx0XHRpbWFnZVNjcm9sbGluZ0FjdGl2ZSA9IGZhbHNlO1xyXG5cdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNld2hlZWwnLCBvbndoZWVsKTtcclxuXHRcdFx0fTtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBsZXQgaW1hZ2VTY3JvbGxpbmdPZmYgPSAoKSA9PiB7IH07XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGltZ1RvV2luZG93Q2VudGVyKGltZzogRWxlbWVudCkge1xyXG5cdFx0XHRsZXQgcmVjdCA9IGltZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHRcdFx0cmV0dXJuIChyZWN0LnRvcCArIHJlY3QuYm90dG9tKSAvIDIgLSBpbm5lckhlaWdodCAvIDI7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGdldEFsbEltYWdlSW5mbygpIHtcclxuXHRcdFx0bGV0IGltYWdlcyA9IHFxKGltZ1NlbGVjdG9yKSBhcyBIVE1MSW1hZ2VFbGVtZW50W107XHJcblx0XHRcdGxldCBkYXRhcyA9IGltYWdlcy5tYXAoKGltZywgaW5kZXgpID0+IHtcclxuXHRcdFx0XHRsZXQgcmVjdCA9IGltZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0aW1nLCByZWN0LCBpbmRleCxcclxuXHRcdFx0XHRcdGluU2NyZWVuOiByZWN0LnRvcCA+PSAtMSAmJiByZWN0LmJvdHRvbSA8PSBpbm5lckhlaWdodCxcclxuXHRcdFx0XHRcdGNyb3NzU2NyZWVuOiByZWN0LmJvdHRvbSA+PSAxICYmIHJlY3QudG9wIDw9IGlubmVySGVpZ2h0IC0gMSxcclxuXHRcdFx0XHRcdHlUb1NjcmVlbkNlbnRlcjogKHJlY3QudG9wICsgcmVjdC5ib3R0b20pIC8gMiAtIGlubmVySGVpZ2h0IC8gMixcclxuXHRcdFx0XHRcdGlzSW5DZW50ZXI6IE1hdGguYWJzKChyZWN0LnRvcCArIHJlY3QuYm90dG9tKSAvIDIgLSBpbm5lckhlaWdodCAvIDIpIDwgMyxcclxuXHRcdFx0XHRcdGlzU2NyZWVuSGVpZ2h0OiBNYXRoLmFicyhyZWN0LmhlaWdodCAtIGlubmVySGVpZ2h0KSA8IDMsXHJcblx0XHRcdFx0fTtcclxuXHRcdFx0fSk7XHJcblx0XHRcdHJldHVybiBkYXRhcztcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgbGV0IHNjcm9sbFdob2xlSW1hZ2VQZW5kaW5nID0gZmFsc2U7XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGdldENlbnRyYWxJbWcoKSB7XHJcblx0XHRcdHJldHVybiBnZXRBbGxJbWFnZUluZm8oKS52c29ydChlID0+IE1hdGguYWJzKGUueVRvU2NyZWVuQ2VudGVyKSlbMF0/LmltZztcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBzY3JvbGxXaG9sZUltYWdlKGRpciA9IDEpIHtcclxuXHRcdFx0aWYgKHNjcm9sbFdob2xlSW1hZ2VQZW5kaW5nKSByZXR1cm4gdHJ1ZTtcclxuXHJcblx0XHRcdGRpciA9IE1hdGguc2lnbihkaXIpO1xyXG5cdFx0XHRsZXQgZGF0YXMgPSBnZXRBbGxJbWFnZUluZm8oKTtcclxuXHRcdFx0bGV0IGNlbnRyYWwgPSBkYXRhcy52c29ydChlID0+IE1hdGguYWJzKGUueVRvU2NyZWVuQ2VudGVyKSlbMF07XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBzY3JvbGxUb0ltYWdlKGRhdGE6IHR5cGVvZiBjZW50cmFsIHwgdW5kZWZpbmVkKTogYm9vbGVhbiB7XHJcblx0XHRcdFx0aWYgKCFkYXRhKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0aWYgKHNjcm9sbFkgKyBkYXRhLnlUb1NjcmVlbkNlbnRlciA8PSAwICYmIHNjcm9sbFkgPD0gMCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoZGF0YS5pc1NjcmVlbkhlaWdodCkge1xyXG5cdFx0XHRcdFx0ZGF0YS5pbWcuc2Nyb2xsSW50b1ZpZXcoKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0c2Nyb2xsVG8oc2Nyb2xsWCwgc2Nyb2xsWSArIGRhdGEueVRvU2NyZWVuQ2VudGVyKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0c2Nyb2xsV2hvbGVJbWFnZVBlbmRpbmcgPSB0cnVlO1xyXG5cdFx0XHRcdFByb21pc2UucmFmKDIpLnRoZW4oKCkgPT4gc2Nyb2xsV2hvbGVJbWFnZVBlbmRpbmcgPSBmYWxzZSk7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIGlmIG5vIGltYWdlcywgZG9uJ3Qgc2Nyb2xsO1xyXG5cdFx0XHRpZiAoIWNlbnRyYWwpIHJldHVybiBmYWxzZTtcclxuXHJcblx0XHRcdC8vIGlmIGN1cnJlbnQgaW1hZ2UgaXMgb3V0c2lkZSB2aWV3LCBkb24ndCBzY3JvbGxcclxuXHRcdFx0aWYgKCFjZW50cmFsLmNyb3NzU2NyZWVuKSByZXR1cm4gZmFsc2U7XHJcblxyXG5cdFx0XHQvLyBpZiBjdXJyZW50IGltYWdlIGlzIGluIGNlbnRlciwgc2Nyb2xsIHRvIHRoZSBuZXh0IG9uZVxyXG5cdFx0XHRpZiAoY2VudHJhbC5pc0luQ2VudGVyKSB7XHJcblx0XHRcdFx0cmV0dXJuIHNjcm9sbFRvSW1hZ2UoZGF0YXNbZGF0YXMuaW5kZXhPZihjZW50cmFsKSArIGRpcl0pO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBpZiB0byBzY3JvbGwgdG8gY3VycmVudCBpbWFnZSB5b3UgaGF2ZSB0byBzY3JvbGwgaW4gb3Bwb3NpZGUgZGlyZWN0aW9uLCBzY3JvbGwgdG8gbmV4dCBvbmVcclxuXHRcdFx0aWYgKE1hdGguc2lnbihjZW50cmFsLnlUb1NjcmVlbkNlbnRlcikgIT0gZGlyKSB7XHJcblx0XHRcdFx0cmV0dXJuIHNjcm9sbFRvSW1hZ2UoZGF0YXNbZGF0YXMuaW5kZXhPZihjZW50cmFsKSArIGRpcl0pO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBpZiBjdXJyZW50IGltYWdlIGlzIGZpcnN0L2xhc3QsIGRvbid0IHNjcm9sbCBvdmVyIDI1dmggdG8gaXRcclxuXHRcdFx0aWYgKGRpciA9PSAxICYmIGNlbnRyYWwuaW5kZXggPT0gMCAmJiBjZW50cmFsLnlUb1NjcmVlbkNlbnRlciA+IGlubmVySGVpZ2h0IC8gMikge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoZGlyID09IC0xICYmIGNlbnRyYWwuaW5kZXggPT0gZGF0YXMubGVuZ3RoIC0gMSAmJiBjZW50cmFsLnlUb1NjcmVlbkNlbnRlciA8IC1pbm5lckhlaWdodCAvIDIpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBzY3JvbGxUb0ltYWdlKGNlbnRyYWwpO1xyXG5cdFx0fVxyXG5cdH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL0FycmF5LnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vRGF0ZU5vd0hhY2sudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9lbGVtZW50LnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZWxtLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vRmlsdGVyZXIvRW50aXR5RmlsdGVyZXIudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9ldGMudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9mZXRjaC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL09iamVjdC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL29ic2VydmVyLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vUGFnaW5hdGUvUGFnaW5hdGlvbi50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL1BhZ2luYXRlL0ltYWdlU2Nyb2xsaW5nLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vUHJvbWlzZS50c1wiIC8+XHJcblxyXG5cclxuXHJcblxyXG5cclxubmFtZXNwYWNlIFBvb3BKcyB7XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBfX2luaXRfXyh3aW5kb3c6IFdpbmRvdyk6IFwiaW5pdGVkXCIgfCBcImFscmVhZHkgaW5pdGVkXCIge1xyXG5cdFx0aWYgKCF3aW5kb3cpIHdpbmRvdyA9IGdsb2JhbFRoaXMud2luZG93IGFzIFdpbmRvdztcclxuXHJcblx0XHR3aW5kb3cuZWxtID0gRWxtLmVsbTtcclxuXHRcdHdpbmRvdy5xID0gT2JqZWN0LmFzc2lnbihRdWVyeVNlbGVjdG9yLldpbmRvd1EucSwgeyBvckVsbTogUG9vcEpzLkVsbS5xT3JFbG0gfSk7XHJcblx0XHR3aW5kb3cucXEgPSBRdWVyeVNlbGVjdG9yLldpbmRvd1EucXE7XHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoRWxlbWVudC5wcm90b3R5cGUsICdxJywgUXVlcnlTZWxlY3Rvci5FbGVtZW50US5xKTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShFbGVtZW50LnByb3RvdHlwZSwgJ3FxJywgUXVlcnlTZWxlY3Rvci5FbGVtZW50US5xcSk7XHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoRWxlbWVudC5wcm90b3R5cGUsICdhcHBlbmRUbycsIEVsZW1lbnRFeHRlbnNpb24uYXBwZW5kVG8pO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKEVsZW1lbnQucHJvdG90eXBlLCAnZW1pdCcsIEVsZW1lbnRFeHRlbnNpb24uZW1pdCk7XHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoRG9jdW1lbnQucHJvdG90eXBlLCAncScsIFF1ZXJ5U2VsZWN0b3IuRG9jdW1lbnRRLnEpO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKERvY3VtZW50LnByb3RvdHlwZSwgJ3FxJywgUXVlcnlTZWxlY3Rvci5Eb2N1bWVudFEucXEpO1xyXG5cclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShQcm9taXNlLCAnZW1wdHknLCBQcm9taXNlRXh0ZW5zaW9uLmVtcHR5KTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShQcm9taXNlLCAnZnJhbWUnLCBQcm9taXNlRXh0ZW5zaW9uLmZyYW1lKTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShQcm9taXNlLCAncmFmJywgUHJvbWlzZUV4dGVuc2lvbi5mcmFtZSk7XHJcblxyXG5cdFx0d2luZG93LmZldGNoLmNhY2hlZCA9IEZldGNoRXh0ZW5zaW9uLmNhY2hlZCBhcyBhbnk7XHJcblx0XHR3aW5kb3cuZmV0Y2guZG9jID0gRmV0Y2hFeHRlbnNpb24uZG9jIGFzIGFueTtcclxuXHRcdHdpbmRvdy5mZXRjaC5qc29uID0gRmV0Y2hFeHRlbnNpb24uanNvbiBhcyBhbnk7XHJcblx0XHR3aW5kb3cuZmV0Y2guY2FjaGVkLmRvYyA9IEZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYztcclxuXHRcdHdpbmRvdy5mZXRjaC5kb2MuY2FjaGVkID0gRmV0Y2hFeHRlbnNpb24uY2FjaGVkRG9jO1xyXG5cdFx0d2luZG93LmZldGNoLmNhY2hlZERvYyA9IEZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYztcclxuXHRcdHdpbmRvdy5mZXRjaC5qc29uLmNhY2hlZCA9IEZldGNoRXh0ZW5zaW9uLmNhY2hlZEpzb247XHJcblx0XHR3aW5kb3cuZmV0Y2guY2FjaGVkLmpzb24gPSBGZXRjaEV4dGVuc2lvbi5jYWNoZWRKc29uO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKFJlc3BvbnNlLnByb3RvdHlwZSwgJ2NhY2hlZEF0JywgMCk7XHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoRG9jdW1lbnQucHJvdG90eXBlLCAnY2FjaGVkQXQnLCAwKTtcclxuXHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoT2JqZWN0LCAnZGVmaW5lVmFsdWUnLCBPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUpO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKE9iamVjdCwgJ2RlZmluZUdldHRlcicsIE9iamVjdEV4dGVuc2lvbi5kZWZpbmVHZXR0ZXIpO1xyXG5cdFx0Ly8gT2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKE9iamVjdCwgJ21hcCcsIE9iamVjdEV4dGVuc2lvbi5tYXApO1xyXG5cclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShBcnJheSwgJ21hcCcsIEFycmF5RXh0ZW5zaW9uLm1hcCk7XHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoQXJyYXkucHJvdG90eXBlLCAncG1hcCcsIEFycmF5RXh0ZW5zaW9uLnBtYXApO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKEFycmF5LnByb3RvdHlwZSwgJ3Zzb3J0JywgQXJyYXlFeHRlbnNpb24udnNvcnQpO1xyXG5cclxuXHRcdHdpbmRvdy5wYWdpbmF0ZSA9IFBvb3BKcy5wYWdpbmF0ZSBhcyBhbnk7XHJcblx0XHR3aW5kb3cuaW1hZ2VTY3JvbGxpbmcgPSBQb29wSnMuSW1hZ2VTY3JvbGxpbmdFeHRlbnNpb247XHJcblx0XHR3aW5kb3cuRGF0ZU5vd0hhY2sgPSBQb29wSnMuRGF0ZU5vd0hhY2suRGF0ZU5vd0hhY2s7XHJcblxyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKHdpbmRvdywgJ19faW5pdF9fJywgJ2FscmVhZHkgaW5pdGVkJyk7XHJcblx0XHRyZXR1cm4gJ2luaXRlZCc7XHJcblx0fVxyXG5cclxuXHRPYmplY3RFeHRlbnNpb24uZGVmaW5lR2V0dGVyKHdpbmRvdywgJ19faW5pdF9fJywgKCkgPT4gX19pbml0X18od2luZG93KSk7XHJcblxyXG5cdGlmICh3aW5kb3cubG9jYWxTdG9yYWdlLl9faW5pdF9fKSB7XHJcblx0XHR3aW5kb3cuX19pbml0X187XHJcblx0fVxyXG5cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cdGV4cG9ydCB0eXBlIFZhbHVlT2Y8VD4gPSBUW2tleW9mIFRdO1xyXG5cdGV4cG9ydCB0eXBlIE1hcHBlZE9iamVjdDxULCBWPiA9IHsgW1AgaW4ga2V5b2YgVF06IFYgfTtcclxuXHJcblx0ZXhwb3J0IHR5cGUgc2VsZWN0b3IgPSBzdHJpbmcgfCAoc3RyaW5nICYgeyBfOiAnc2VsZWN0b3InIH0pXHJcblx0ZXhwb3J0IHR5cGUgdXJsID0gYGh0dHAke3N0cmluZ31gICYgeyBfOiAndXJsJyB9O1xyXG5cdGV4cG9ydCB0eXBlIExpbmsgPSBIVE1MQW5jaG9yRWxlbWVudCB8IHNlbGVjdG9yIHwgdXJsO1xyXG59XHJcblxyXG5cclxuZGVjbGFyZSBjb25zdCBfX2luaXRfXzogXCJpbml0ZWRcIiB8IFwiYWxyZWFkeSBpbml0ZWRcIjtcclxuZGVjbGFyZSBjb25zdCBlbG06IHR5cGVvZiBQb29wSnMuRWxtLmVsbTtcclxuZGVjbGFyZSBjb25zdCBxOiB0eXBlb2YgUG9vcEpzLlF1ZXJ5U2VsZWN0b3IuV2luZG93US5xICYgeyBvckVsbTogdHlwZW9mIFBvb3BKcy5FbG0ucU9yRWxtIH07O1xyXG5kZWNsYXJlIGNvbnN0IHFxOiB0eXBlb2YgUG9vcEpzLlF1ZXJ5U2VsZWN0b3IuV2luZG93US5xcTtcclxuZGVjbGFyZSBjb25zdCBwYWdpbmF0ZTogdHlwZW9mIFBvb3BKcy5wYWdpbmF0ZTtcclxuZGVjbGFyZSBjb25zdCBpbWFnZVNjcm9sbGluZzogdHlwZW9mIFBvb3BKcy5JbWFnZVNjcm9sbGluZ0V4dGVuc2lvbjtcclxuZGVjbGFyZSBjb25zdCBEYXRlTm93SGFjazogdHlwZW9mIFBvb3BKcy5EYXRlTm93SGFjay5EYXRlTm93SGFjaztcclxuZGVjbGFyZSBuYW1lc3BhY2UgZmV0Y2gge1xyXG5cdGV4cG9ydCBjb25zdCBjYWNoZWQ6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkICYgeyBkb2M6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkRG9jLCBqc29uOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZEpzb24gfTtcclxuXHRleHBvcnQgY29uc3QgZG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmRvYyAmIHsgY2FjaGVkOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYyB9O1xyXG5cdGV4cG9ydCBjb25zdCBjYWNoZWREb2M6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkRG9jO1xyXG5cdGV4cG9ydCBjb25zdCBqc29uOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmpzb24gJiB7IGNhY2hlZDogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5jYWNoZWRKc29uIH07XHJcbn1cclxuXHJcbmludGVyZmFjZSBXaW5kb3cge1xyXG5cdHJlYWRvbmx5IF9faW5pdF9fOiBcImluaXRlZFwiIHwgXCJhbHJlYWR5IGluaXRlZFwiO1xyXG5cdGVsbTogdHlwZW9mIFBvb3BKcy5FbG0uZWxtO1xyXG5cdHE6IHR5cGVvZiBQb29wSnMuUXVlcnlTZWxlY3Rvci5XaW5kb3dRLnEgJiB7IG9yRWxtOiB0eXBlb2YgUG9vcEpzLkVsbS5xT3JFbG0gfTtcclxuXHRxcTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLldpbmRvd1EucXE7XHJcblx0cGFnaW5hdGU6IHR5cGVvZiBQb29wSnMucGFnaW5hdGU7XHJcblx0aW1hZ2VTY3JvbGxpbmc6IHR5cGVvZiBQb29wSnMuSW1hZ2VTY3JvbGxpbmdFeHRlbnNpb247XHJcblx0RGF0ZU5vd0hhY2s6IHR5cGVvZiBQb29wSnMuRGF0ZU5vd0hhY2suRGF0ZU5vd0hhY2s7XHJcblx0ZmV0Y2g6IHtcclxuXHRcdChpbnB1dDogUmVxdWVzdEluZm8sIGluaXQ/OiBSZXF1ZXN0SW5pdCk6IFByb21pc2U8UmVzcG9uc2U+O1xyXG5cdFx0Y2FjaGVkOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZCAmIHsgZG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYywganNvbjogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5jYWNoZWRKc29uIH07XHJcblx0XHRkb2M6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uZG9jICYgeyBjYWNoZWQ6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkRG9jIH07XHJcblx0XHRjYWNoZWREb2M6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkRG9jO1xyXG5cdFx0anNvbjogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5qc29uICYgeyBjYWNoZWQ6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkSnNvbiB9O1xyXG5cdH1cclxufVxyXG5cclxuaW50ZXJmYWNlIEVsZW1lbnQge1xyXG5cdHE6IHR5cGVvZiBQb29wSnMuUXVlcnlTZWxlY3Rvci5FbGVtZW50US5xO1xyXG5cdHFxOiB0eXBlb2YgUG9vcEpzLlF1ZXJ5U2VsZWN0b3IuRWxlbWVudFEucXE7XHJcblx0YXBwZW5kVG86IHR5cGVvZiBQb29wSnMuRWxlbWVudEV4dGVuc2lvbi5hcHBlbmRUbztcclxuXHRlbWl0OiB0eXBlb2YgUG9vcEpzLkVsZW1lbnRFeHRlbnNpb24uZW1pdDtcclxuXHRhZGRFdmVudExpc3RlbmVyPFQgZXh0ZW5kcyBDdXN0b21FdmVudDx7IF9ldmVudD86IHN0cmluZyB9Pj4odHlwZTogVFsnZGV0YWlsJ11bJ19ldmVudCddLCBsaXN0ZW5lcjogKHRoaXM6IERvY3VtZW50LCBldjogVCkgPT4gYW55LCBvcHRpb25zPzogYm9vbGVhbiB8IEFkZEV2ZW50TGlzdGVuZXJPcHRpb25zKTogdm9pZDtcclxufVxyXG5pbnRlcmZhY2UgRG9jdW1lbnQge1xyXG5cdHE6IHR5cGVvZiBQb29wSnMuUXVlcnlTZWxlY3Rvci5Eb2N1bWVudFEucTtcclxuXHRxcTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLkRvY3VtZW50US5xcTtcclxuXHRjYWNoZWRBdDogbnVtYmVyO1xyXG5cdGFkZEV2ZW50TGlzdGVuZXI8VCBleHRlbmRzIEN1c3RvbUV2ZW50PHsgX2V2ZW50Pzogc3RyaW5nIH0+Pih0eXBlOiBUWydkZXRhaWwnXVsnX2V2ZW50J10sIGxpc3RlbmVyOiAodGhpczogRG9jdW1lbnQsIGV2OiBUKSA9PiBhbnksIG9wdGlvbnM/OiBib29sZWFuIHwgQWRkRXZlbnRMaXN0ZW5lck9wdGlvbnMpOiB2b2lkO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgT2JqZWN0Q29uc3RydWN0b3Ige1xyXG5cdGRlZmluZVZhbHVlOiB0eXBlb2YgUG9vcEpzLk9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZTtcclxuXHRkZWZpbmVHZXR0ZXI6IHR5cGVvZiBQb29wSnMuT2JqZWN0RXh0ZW5zaW9uLmRlZmluZUdldHRlcjtcclxuXHQvLyBtYXA6IHR5cGVvZiBQb29wSnMuT2JqZWN0RXh0ZW5zaW9uLm1hcDtcclxuXHRzZXRQcm90b3R5cGVPZjxULCBQPihvOiBULCBwcm90bzogUCk6IFQgJiBQO1xyXG59XHJcbmludGVyZmFjZSBQcm9taXNlQ29uc3RydWN0b3Ige1xyXG5cdGVtcHR5OiB0eXBlb2YgUG9vcEpzLlByb21pc2VFeHRlbnNpb24uZW1wdHk7XHJcblx0ZnJhbWU6IHR5cGVvZiBQb29wSnMuUHJvbWlzZUV4dGVuc2lvbi5mcmFtZTtcclxuXHRyYWY6IHR5cGVvZiBQb29wSnMuUHJvbWlzZUV4dGVuc2lvbi5mcmFtZTtcclxufVxyXG5cclxuaW50ZXJmYWNlIEFycmF5PFQ+IHtcclxuXHR2c29ydDogdHlwZW9mIFBvb3BKcy5BcnJheUV4dGVuc2lvbi52c29ydDtcclxuXHRwbWFwOiB0eXBlb2YgUG9vcEpzLkFycmF5RXh0ZW5zaW9uLnBtYXA7XHJcbn1cclxuaW50ZXJmYWNlIEFycmF5Q29uc3RydWN0b3Ige1xyXG5cdG1hcDogdHlwZW9mIFBvb3BKcy5BcnJheUV4dGVuc2lvbi5tYXA7XHJcbn1cclxuXHJcbmludGVyZmFjZSBEYXRlQ29uc3RydWN0b3Ige1xyXG5cdF9ub3coKTogbnVtYmVyO1xyXG59XHJcbmludGVyZmFjZSBEYXRlIHtcclxuXHRfZ2V0VGltZSgpOiBudW1iZXI7XHJcbn1cclxuXHJcbmludGVyZmFjZSBSZXNwb25zZSB7XHJcblx0Y2FjaGVkQXQ6IG51bWJlcjtcclxufVxyXG5cclxuLy8gaW50ZXJmYWNlIEN1c3RvbUV2ZW50PFQ+IHtcclxuLy8gXHRkZXRhaWw/OiBUO1xyXG4vLyB9XHJcblxyXG5pbnRlcmZhY2UgRnVuY3Rpb24ge1xyXG5cdGJpbmQ8VCwgUiwgQVJHUyBleHRlbmRzIGFueVtdPih0aGlzOiAodGhpczogVCwgLi4uYXJnczogQVJHUykgPT4gUiwgdGhpc0FyZzogVCk6ICgoLi4uYXJnczogQVJHUykgPT4gUilcclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cdGV4cG9ydCBuYW1lc3BhY2UgRW50cnlGaWx0ZXJlckV4dGVuc2lvbiB7XHJcblxyXG5cdFx0ZXhwb3J0IGNsYXNzIEZpbHRlcmVySXRlbTxEYXRhPiB7XHJcblx0XHRcdGlkOiBzdHJpbmcgPSBcIlwiO1xyXG5cdFx0XHRuYW1lPzogc3RyaW5nO1xyXG5cdFx0XHRkZXNjcmlwdGlvbj86IHN0cmluZztcclxuXHRcdFx0dGhyZWVXYXk6IFdheW5lc3MgPSBmYWxzZTtcclxuXHRcdFx0bW9kZTogTW9kZSA9ICdvZmYnO1xyXG5cdFx0XHRwYXJlbnQ6IEVudHJ5RmlsdGVyZXI7XHJcblx0XHRcdGJ1dHRvbjogSFRNTEJ1dHRvbkVsZW1lbnQ7XHJcblx0XHRcdGluY29tcGF0aWJsZT86IHN0cmluZ1tdO1xyXG5cdFx0XHRoaWRkZW4gPSBmYWxzZTtcclxuXHJcblx0XHRcdGNvbnN0cnVjdG9yKGRhdGE6IEZpbHRlcmVySXRlbVNvdXJjZSkge1xyXG5cdFx0XHRcdGRhdGEuYnV0dG9uID8/PSAnYnV0dG9uLmVmLWl0ZW0nO1xyXG5cdFx0XHRcdE9iamVjdC5hc3NpZ24odGhpcywgZGF0YSk7XHJcblxyXG5cdFx0XHRcdHRoaXMuYnV0dG9uID0gZWxtKGRhdGEuYnV0dG9uLFxyXG5cdFx0XHRcdFx0dGhpcy5jbGljay5iaW5kKHRoaXMpLFxyXG5cdFx0XHRcdFx0dGhpcy5jb250ZXh0bWVudS5iaW5kKHRoaXMpLFxyXG5cdFx0XHRcdCk7XHJcblx0XHRcdFx0dGhpcy5wYXJlbnQuY29udGFpbmVyLmFwcGVuZCh0aGlzLmJ1dHRvbik7XHJcblx0XHRcdFx0aWYgKHRoaXMubmFtZSkge1xyXG5cdFx0XHRcdFx0dGhpcy5idXR0b24uYXBwZW5kKHRoaXMubmFtZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0aGlzLmRlc2NyaXB0aW9uKSB7XHJcblx0XHRcdFx0XHR0aGlzLmJ1dHRvbi50aXRsZSA9IHRoaXMuZGVzY3JpcHRpb247XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgIT0gJ29mZicpIHtcclxuXHRcdFx0XHRcdHRoaXMudG9nZ2xlTW9kZShkYXRhLm1vZGUsIHRydWUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodGhpcy5oaWRkZW4pIHtcclxuXHRcdFx0XHRcdHRoaXMuaGlkZSgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2xpY2soZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvZmYnKSB7XHJcblx0XHRcdFx0XHR0aGlzLnRvZ2dsZU1vZGUoJ29uJyk7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChldmVudC50YXJnZXQgIT0gdGhpcy5idXR0b24pIHJldHVybjtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvbicpIHtcclxuXHRcdFx0XHRcdHRoaXMudG9nZ2xlTW9kZSh0aGlzLnRocmVlV2F5ID8gJ29wcG9zaXRlJyA6ICdvZmYnKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhpcy50b2dnbGVNb2RlKCdvZmYnKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y29udGV4dG1lbnUoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgIT0gJ29wcG9zaXRlJykge1xyXG5cdFx0XHRcdFx0dGhpcy50b2dnbGVNb2RlKCdvcHBvc2l0ZScpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR0aGlzLnRvZ2dsZU1vZGUoJ29mZicpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dG9nZ2xlTW9kZShtb2RlOiBNb2RlLCBmb3JjZSA9IGZhbHNlKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSBtb2RlICYmICFmb3JjZSkgcmV0dXJuO1xyXG5cdFx0XHRcdHRoaXMubW9kZSA9IG1vZGU7XHJcblx0XHRcdFx0dGhpcy5idXR0b24uc2V0QXR0cmlidXRlKCdlZi1tb2RlJywgbW9kZSk7XHJcblx0XHRcdFx0aWYgKG1vZGUgIT0gJ29mZicgJiYgdGhpcy5pbmNvbXBhdGlibGUpIHtcclxuXHRcdFx0XHRcdHRoaXMucGFyZW50Lm9mZkluY29tcGF0aWJsZSh0aGlzLmluY29tcGF0aWJsZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMucGFyZW50LnJlcXVlc3RVcGRhdGUoKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmVtb3ZlKCkge1xyXG5cdFx0XHRcdHRoaXMuYnV0dG9uLnJlbW92ZSgpO1xyXG5cdFx0XHRcdHRoaXMudG9nZ2xlTW9kZSgnb2ZmJyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHNob3coKSB7XHJcblx0XHRcdFx0dGhpcy5oaWRkZW4gPSBmYWxzZTtcclxuXHRcdFx0XHR0aGlzLmJ1dHRvbi5oaWRkZW4gPSBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRoaWRlKCkge1xyXG5cdFx0XHRcdHRoaXMuaGlkZGVuID0gdHJ1ZTtcclxuXHRcdFx0XHR0aGlzLmJ1dHRvbi5oaWRkZW4gPSB0cnVlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHR9XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9GaWx0ZXJlckl0ZW0udHNcIiAvPlxyXG5cclxubmFtZXNwYWNlIFBvb3BKcyB7XHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFbnRyeUZpbHRlcmVyRXh0ZW5zaW9uIHtcclxuXHJcblx0XHRleHBvcnQgY2xhc3MgRmlsdGVyPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtPERhdGE+IGltcGxlbWVudHMgSUZpbHRlcjxEYXRhPiB7XHJcblx0XHRcdGRlY2xhcmUgZmlsdGVyOiBGaWx0ZXJGbjxEYXRhPjtcclxuXHJcblx0XHRcdGNvbnN0cnVjdG9yKGRhdGE6IEZpbHRlclNvdXJjZTxEYXRhPikge1xyXG5cdFx0XHRcdGRhdGEuYnV0dG9uID8/PSAnYnV0dG9uLmVmLWl0ZW0uZWYtZmlsdGVyW2VmLW1vZGU9XCJvZmZcIl0nO1xyXG5cdFx0XHRcdHN1cGVyKGRhdGEpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvKiogcmV0dXJucyBpZiBpdGVtIHNob3VsZCBiZSB2aXNpYmxlICovXHJcblx0XHRcdGFwcGx5KGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29mZicpIHJldHVybiB0cnVlO1xyXG5cdFx0XHRcdGxldCB2YWx1ZSA9IHRoaXMuZmlsdGVyKGRhdGEsIGVsLCB0aGlzLm1vZGUpO1xyXG5cdFx0XHRcdGxldCByZXN1bHQgPSB0eXBlb2YgdmFsdWUgPT0gXCJudW1iZXJcIiA/IHZhbHVlID4gMCA6IHZhbHVlO1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29uJykgcmV0dXJuIHJlc3VsdDtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvcHBvc2l0ZScpIHJldHVybiAhcmVzdWx0O1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGNsYXNzIFZhbHVlRmlsdGVyPERhdGEsIFYgZXh0ZW5kcyBzdHJpbmcgfCBudW1iZXI+IGV4dGVuZHMgRmlsdGVyZXJJdGVtPERhdGE+IGltcGxlbWVudHMgSUZpbHRlcjxEYXRhPiB7XHJcblx0XHRcdGRlY2xhcmUgZmlsdGVyOiBWYWx1ZUZpbHRlckZuPERhdGEsIFY+O1xyXG5cdFx0XHRpbnB1dDogSFRNTElucHV0RWxlbWVudDtcclxuXHRcdFx0bGFzdFZhbHVlOiBWO1xyXG5cclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogVmFsdWVGaWx0ZXJTb3VyY2U8RGF0YSwgVj4pIHtcclxuXHRcdFx0XHRkYXRhLmJ1dHRvbiA/Pz0gJ2J1dHRvbi5lZi1pdGVtLmVmLWZpbHRlcltlZi1tb2RlPVwib2ZmXCJdJztcclxuXHRcdFx0XHRzdXBlcihkYXRhKTtcclxuXHRcdFx0XHRsZXQgdHlwZSA9IHR5cGVvZiBkYXRhLmlucHV0ID09ICdudW1iZXInID8gJ251bWJlcicgOiAndGV4dCc7XHJcblx0XHRcdFx0bGV0IHZhbHVlID0gSlNPTi5zdHJpbmdpZnkoZGF0YS5pbnB1dCk7XHJcblx0XHRcdFx0bGV0IGlucHV0ID0gYGlucHV0W3R5cGU9JHt0eXBlfV1bdmFsdWU9JHt2YWx1ZX1dYDtcclxuXHRcdFx0XHR0aGlzLmlucHV0ID0gZWxtPCdpbnB1dCc+KGlucHV0LFxyXG5cdFx0XHRcdFx0aW5wdXQgPT4gdGhpcy5jaGFuZ2UoKSxcclxuXHRcdFx0XHQpLmFwcGVuZFRvKHRoaXMuYnV0dG9uKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2hhbmdlKCkge1xyXG5cdFx0XHRcdGxldCB2YWx1ZSA9IHRoaXMuZ2V0VmFsdWUoKTtcclxuXHRcdFx0XHRpZiAodGhpcy5sYXN0VmFsdWUgIT0gdmFsdWUpIHtcclxuXHRcdFx0XHRcdHRoaXMubGFzdFZhbHVlID0gdmFsdWU7XHJcblx0XHRcdFx0XHR0aGlzLnBhcmVudC5yZXF1ZXN0VXBkYXRlKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvKiogcmV0dXJucyBpZiBpdGVtIHNob3VsZCBiZSB2aXNpYmxlICovXHJcblx0XHRcdGFwcGx5KGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29mZicpIHJldHVybiB0cnVlO1xyXG5cdFx0XHRcdGxldCB2YWx1ZSA9IHRoaXMuZmlsdGVyKHRoaXMuZ2V0VmFsdWUoKSwgZGF0YSwgZWwpO1xyXG5cdFx0XHRcdGxldCByZXN1bHQgPSB0eXBlb2YgdmFsdWUgPT0gXCJudW1iZXJcIiA/IHZhbHVlID4gMCA6IHZhbHVlO1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29uJykgcmV0dXJuIHJlc3VsdDtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvcHBvc2l0ZScpIHJldHVybiAhcmVzdWx0O1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRnZXRWYWx1ZSgpOiBWIHtcclxuXHRcdFx0XHRsZXQgdmFsdWU6IFYgPSAodGhpcy5pbnB1dC50eXBlID09ICd0ZXh0JyA/IHRoaXMuaW5wdXQudmFsdWUgOiB0aGlzLmlucHV0LnZhbHVlQXNOdW1iZXIpIGFzIFY7XHJcblx0XHRcdFx0cmV0dXJuIHZhbHVlO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdH1cclxufVxyXG4iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHRleHBvcnQgbmFtZXNwYWNlIEVudHJ5RmlsdGVyZXJFeHRlbnNpb24ge1xyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBNb2RpZmllcjxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbTxEYXRhPiBpbXBsZW1lbnRzIElNb2RpZmllcjxEYXRhPiB7XHJcblx0XHRcdGRlY2xhcmUgbW9kaWZpZXI6IE1vZGlmaWVyRm48RGF0YT47XHJcblx0XHRcdGRlY2xhcmUgcnVuT25Ob0NoYW5nZT86IGJvb2xlYW47XHJcblxyXG5cdFx0XHRjb25zdHJ1Y3RvcihkYXRhOiBNb2RpZmllclNvdXJjZTxEYXRhPikge1xyXG5cdFx0XHRcdGRhdGEuYnV0dG9uID8/PSAnYnV0dG9uLmVmLWl0ZW0uZWYtbW9kaWZpZXJbZWYtbW9kZT1cIm9mZlwiXSc7XHJcblx0XHRcdFx0c3VwZXIoZGF0YSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRvZ2dsZU1vZGUobW9kZTogTW9kZSwgZm9yY2UgPSBmYWxzZSkge1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gbW9kZSAmJiAhZm9yY2UpIHJldHVybjtcclxuXHRcdFx0XHR0aGlzLnBhcmVudC5tb3ZlVG9Ub3AodGhpcyk7XHJcblx0XHRcdFx0c3VwZXIudG9nZ2xlTW9kZShtb2RlLCBmb3JjZSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGFwcGx5KGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCkge1xyXG5cdFx0XHRcdGxldCBvbGRNb2RlOiBNb2RlIHwgbnVsbCA9IGVsLmdldEF0dHJpYnV0ZShgZWYtbW9kaWZpZXItJHt0aGlzLmlkfS1tb2RlYCkgYXMgKE1vZGUgfCBudWxsKTtcclxuXHRcdFx0XHRpZiAob2xkTW9kZSA9PSB0aGlzLm1vZGUgJiYgIXRoaXMucnVuT25Ob0NoYW5nZSkgcmV0dXJuO1xyXG5cdFx0XHRcdHRoaXMubW9kaWZpZXIoZGF0YSwgZWwsIHRoaXMubW9kZSwgbnVsbCk7XHJcblx0XHRcdFx0ZWwuc2V0QXR0cmlidXRlKGBlZi1tb2RpZmllci0ke3RoaXMuaWR9LW1vZGVgLCB0aGlzLm1vZGUpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGNsYXNzIFByZWZpeGVyPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtPERhdGE+IGltcGxlbWVudHMgSU1vZGlmaWVyPERhdGE+IHtcclxuXHRcdFx0ZGVjbGFyZSB0YXJnZXQ6IHNlbGVjdG9yIHwgKChlOiBIVE1MRWxlbWVudCwgZGF0YTogRGF0YSwgbW9kZTogTW9kZSkgPT4gKEhUTUxFbGVtZW50IHwgSFRNTEVsZW1lbnRbXSkpO1xyXG5cdFx0XHRkZWNsYXJlIHByZWZpeD86IChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQsIG1vZGU6IE1vZGUpID0+IHN0cmluZztcclxuXHRcdFx0ZGVjbGFyZSBwb3N0Zml4PzogKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCwgbW9kZTogTW9kZSkgPT4gc3RyaW5nO1xyXG5cdFx0XHRkZWNsYXJlIHByZWZpeEF0dHJpYnV0ZTogc3RyaW5nO1xyXG5cdFx0XHRkZWNsYXJlIHBvc3RmaXhBdHRyaWJ1dGU6IHN0cmluZztcclxuXHRcdFx0ZGVjbGFyZSBhbGw6IGJvb2xlYW47XHJcblxyXG5cdFx0XHRjb25zdHJ1Y3RvcihkYXRhOiBQcmVmaXhlclNvdXJjZTxEYXRhPikge1xyXG5cdFx0XHRcdGRhdGEuYnV0dG9uID8/PSAnYnV0dG9uLmVmLWl0ZW0uZWYtbW9kaWZpZXJbZWYtbW9kZT1cIm9mZlwiXSc7XHJcblx0XHRcdFx0ZGF0YS50YXJnZXQgPz89IGUgPT4gZTtcclxuXHRcdFx0XHRkYXRhLnByZWZpeEF0dHJpYnV0ZSA/Pz0gJ2VmLXByZWZpeCc7XHJcblx0XHRcdFx0ZGF0YS5wb3N0Zml4QXR0cmlidXRlID8/PSAnZWYtcG9zdGZpeCc7XHJcblx0XHRcdFx0ZGF0YS5hbGwgPz89IGZhbHNlO1xyXG5cdFx0XHRcdHN1cGVyKGRhdGEpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRhcHBseShkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpIHtcclxuXHRcdFx0XHRsZXQgdGFyZ2V0cyA9IHRoaXMuZ2V0VGFyZ2V0cyhlbCwgZGF0YSk7XHJcblx0XHRcdFx0aWYgKHRoaXMucHJlZml4KSB7XHJcblx0XHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvZmYnKSB7XHJcblx0XHRcdFx0XHRcdHRhcmdldHMubWFwKGUgPT4gZS5yZW1vdmVBdHRyaWJ1dGUodGhpcy5wcmVmaXhBdHRyaWJ1dGUpKTtcclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdGxldCB2YWx1ZSA9IHRoaXMucHJlZml4KGRhdGEsIGVsLCB0aGlzLm1vZGUpO1xyXG5cdFx0XHRcdFx0XHR0YXJnZXRzLm1hcChlID0+IGUuc2V0QXR0cmlidXRlKHRoaXMucHJlZml4QXR0cmlidXRlLCB2YWx1ZSkpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodGhpcy5wb3N0Zml4KSB7XHJcblx0XHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvZmYnKSB7XHJcblx0XHRcdFx0XHRcdHRhcmdldHMubWFwKGUgPT4gZS5yZW1vdmVBdHRyaWJ1dGUodGhpcy5wb3N0Zml4QXR0cmlidXRlKSk7XHJcblx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRsZXQgdmFsdWUgPSB0aGlzLnBvc3RmaXgoZGF0YSwgZWwsIHRoaXMubW9kZSk7XHJcblx0XHRcdFx0XHRcdHRhcmdldHMubWFwKGUgPT4gZS5zZXRBdHRyaWJ1dGUodGhpcy5wb3N0Zml4QXR0cmlidXRlLCB2YWx1ZSkpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Z2V0VGFyZ2V0cyhlbDogSFRNTEVsZW1lbnQsIGRhdGE6IERhdGEpOiBIVE1MRWxlbWVudFtdIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIHRoaXMudGFyZ2V0ID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRpZiAodGhpcy5hbGwpIHJldHVybiBlbC5xcSh0aGlzLnRhcmdldCk7XHJcblx0XHRcdFx0XHRyZXR1cm4gW2VsLnEodGhpcy50YXJnZXQpXTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0bGV0IHRhcmdldHMgPSB0aGlzLnRhcmdldChlbCwgZGF0YSwgdGhpcy5tb2RlKTtcclxuXHRcdFx0XHRcdHJldHVybiBBcnJheS5pc0FycmF5KHRhcmdldHMpID8gdGFyZ2V0cyA6IFt0YXJnZXRzXTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0fVxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFbnRyeUZpbHRlcmVyRXh0ZW5zaW9uIHtcclxuXHJcblx0XHRleHBvcnQgY2xhc3MgU29ydGVyPERhdGEsIFYgZXh0ZW5kcyBudW1iZXIgfCBzdHJpbmc+IGV4dGVuZHMgRmlsdGVyZXJJdGVtPERhdGE+IGltcGxlbWVudHMgSVNvcnRlcjxEYXRhPiB7XHJcblx0XHRcdGRlY2xhcmUgc29ydGVyOiBTb3J0ZXJGbjxEYXRhLCBWPjtcclxuXHRcdFx0ZGVjbGFyZSBjb21wYXJhdG9yOiAoYTogViwgYjogVikgPT4gbnVtYmVyO1xyXG5cclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogU29ydGVyU291cmNlPERhdGEsIFY+KSB7XHJcblx0XHRcdFx0ZGF0YS5idXR0b24gPz89ICdidXR0b24uZWYtaXRlbS5lZi1zb3J0ZXJbZWYtbW9kZT1cIm9mZlwiXSc7XHJcblx0XHRcdFx0ZGF0YS5jb21wYXJhdG9yID8/PSAoYTogViwgYjogVikgPT4gYSA+IGIgPyAxIDogYSA8IGIgPyAtMSA6IDA7XHJcblx0XHRcdFx0c3VwZXIoZGF0YSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRvZ2dsZU1vZGUobW9kZTogTW9kZSwgZm9yY2UgPSBmYWxzZSkge1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gbW9kZSAmJiAhZm9yY2UpIHJldHVybjtcclxuXHRcdFx0XHR0aGlzLnBhcmVudC5tb3ZlVG9Ub3AodGhpcyk7XHJcblx0XHRcdFx0c3VwZXIudG9nZ2xlTW9kZShtb2RlLCBmb3JjZSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHNvcnQobGlzdDogW0RhdGEsIEhUTUxFbGVtZW50XVtdKTogW0RhdGEsIEhUTUxFbGVtZW50XVtdIHtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvZmYnKSByZXR1cm4gbGlzdDtcclxuXHRcdFx0XHRyZXR1cm4gbGlzdC52c29ydCgoW2RhdGEsIGVsXTogW0RhdGEsIEhUTUxFbGVtZW50XSkgPT4gdGhpcy5hcHBseShkYXRhLCBlbCksIChhOiBWLCBiOiBWKSA9PiB0aGlzLmNvbXBhcmUoYSwgYikpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvKiogcmV0dXJucyBvcmRlciBvZiBlbnRyeSAqL1xyXG5cdFx0XHRhcHBseShkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpOiBWIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5zb3J0ZXIoZGF0YSwgZWwsIHRoaXMubW9kZSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNvbXBhcmUoYTogViwgYjogVik6IG51bWJlciB7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb24nKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5jb21wYXJhdG9yKGEsIGIpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvcHBvc2l0ZScpIHtcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmNvbXBhcmF0b3IoYiwgYSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiAwO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdH1cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIEVudHJ5RmlsdGVyZXJFeHRlbnNpb24ge1xyXG5cdFx0ZXhwb3J0IHR5cGUgV2F5bmVzcyA9IGZhbHNlIHwgdHJ1ZSB8ICdkaXInO1xyXG5cdFx0ZXhwb3J0IHR5cGUgTW9kZSA9ICdvZmYnIHwgJ29uJyB8ICdvcHBvc2l0ZSc7XHJcblxyXG5cdFx0ZXhwb3J0IHR5cGUgUGFyc2VyRm48RGF0YT4gPSAoZWw6IEhUTUxFbGVtZW50LCBkYXRhOiBQYXJ0aWFsPERhdGE+KSA9PiBQYXJ0aWFsPERhdGE+IHwgdm9pZCB8IFByb21pc2VMaWtlPFBhcnRpYWw8RGF0YSB8IHZvaWQ+PjtcclxuXHRcdGV4cG9ydCB0eXBlIEZpbHRlckZuPERhdGE+ID0gKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCwgbW9kZTogTW9kZSkgPT4gYm9vbGVhbjtcclxuXHRcdGV4cG9ydCB0eXBlIFNvcnRlckZuPERhdGEsIFY+ID0gKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCwgbW9kZTogTW9kZSkgPT4gVjtcclxuXHRcdGV4cG9ydCB0eXBlIE1vZGlmaWVyRm48RGF0YT4gPSAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50LCBtb2RlOiBNb2RlLCBvbGRNb2RlOiBNb2RlIHwgbnVsbCkgPT4gdm9pZDtcclxuXHRcdGV4cG9ydCB0eXBlIFZhbHVlRmlsdGVyRm48RGF0YSwgVj4gPSAodmFsdWU6IFYsIGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCkgPT4gYm9vbGVhbjtcclxuXHRcdGV4cG9ydCB0eXBlIFByZWZpeGVyRm48RGF0YT4gPSAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50LCBtb2RlOiBNb2RlKSA9PiBzdHJpbmc7XHJcblxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBJRmlsdGVyPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtPERhdGE+IHtcclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogYm9vbGVhbjtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgSVNvcnRlcjxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbTxEYXRhPiB7XHJcblx0XHRcdHNvcnQobGlzdDogW0RhdGEsIEhUTUxFbGVtZW50XVtdKTogW0RhdGEsIEhUTUxFbGVtZW50XVtdO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBJTW9kaWZpZXI8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4ge1xyXG5cdFx0XHRhcHBseShkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpOiB2b2lkO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgRmlsdGVyZXJJdGVtU291cmNlIHtcclxuXHRcdFx0YnV0dG9uPzogc2VsZWN0b3I7XHJcblx0XHRcdGlkOiBzdHJpbmc7XHJcblx0XHRcdG5hbWU/OiBzdHJpbmc7XHJcblx0XHRcdGRlc2NyaXB0aW9uPzogc3RyaW5nO1xyXG5cdFx0XHR0aHJlZVdheT86IFdheW5lc3M7XHJcblx0XHRcdG1vZGU/OiBNb2RlO1xyXG5cdFx0XHRwYXJlbnQ6IEVudHJ5RmlsdGVyZXI7XHJcblx0XHRcdGluY29tcGF0aWJsZT86IHN0cmluZ1tdO1xyXG5cdFx0XHRoaWRkZW4/OiBib29sZWFuO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBGaWx0ZXJTb3VyY2U8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW1Tb3VyY2Uge1xyXG5cdFx0XHRmaWx0ZXI6IEZpbHRlckZuPERhdGE+O1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBWYWx1ZUZpbHRlclNvdXJjZTxEYXRhLCBWPiBleHRlbmRzIEZpbHRlcmVySXRlbVNvdXJjZSB7XHJcblx0XHRcdGZpbHRlcjogVmFsdWVGaWx0ZXJGbjxEYXRhLCBWPjtcclxuXHRcdFx0aW5wdXQ6IFY7XHJcblx0XHR9XHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIFNvcnRlclNvdXJjZTxEYXRhLCBWPiBleHRlbmRzIEZpbHRlcmVySXRlbVNvdXJjZSB7XHJcblx0XHRcdHNvcnRlcjogU29ydGVyRm48RGF0YSwgVj47XHJcblx0XHRcdGNvbXBhcmF0b3I/OiAoKGE6IFYsIGI6IFYpID0+IG51bWJlcikgfCBWO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBNb2RpZmllclNvdXJjZTxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbVNvdXJjZSB7XHJcblx0XHRcdG1vZGlmaWVyOiBNb2RpZmllckZuPERhdGE+O1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBQcmVmaXhlclNvdXJjZTxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbVNvdXJjZSB7XHJcblx0XHRcdHRhcmdldD86IHNlbGVjdG9yIHwgKChlbDogSFRNTEVsZW1lbnQsIGRhdGE6IERhdGEsIG1vZGU6IE1vZGUpID0+IEhUTUxFbGVtZW50KTtcclxuXHRcdFx0cHJlZml4PzogKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCkgPT4gc3RyaW5nO1xyXG5cdFx0XHRwb3N0Zml4PzogKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCkgPT4gc3RyaW5nO1xyXG5cdFx0XHRwcmVmaXhBdHRyaWJ1dGU/OiBzdHJpbmc7XHJcblx0XHRcdHBvc3RmaXhBdHRyaWJ1dGU/OiBzdHJpbmc7XHJcblx0XHRcdGFsbD86IGJvb2xlYW47XHJcblx0XHR9XHJcblxyXG5cdFx0XHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIEZpbHRlcmVySXRlbVBhcnRpYWwge1xyXG5cdFx0XHRidXR0b24/OiBzZWxlY3RvcjtcclxuXHRcdFx0aWQ/OiBzdHJpbmc7XHJcblx0XHRcdG5hbWU/OiBzdHJpbmc7XHJcblx0XHRcdGRlc2NyaXB0aW9uPzogc3RyaW5nO1xyXG5cdFx0XHR0aHJlZVdheT86IFdheW5lc3M7XHJcblx0XHRcdG1vZGU/OiBNb2RlO1xyXG5cdFx0XHRpbmNvbXBhdGlibGU/OiBzdHJpbmdbXTtcclxuXHRcdFx0aGlkZGVuPzogYm9vbGVhbjtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgRmlsdGVyUGFydGlhbDxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbVBhcnRpYWwgeyB9XHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIFZhbHVlRmlsdGVyUGFydGlhbDxEYXRhLCBWPiBleHRlbmRzIEZpbHRlcmVySXRlbVBhcnRpYWwge1xyXG5cdFx0XHRpbnB1dDogVjtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgU29ydGVyUGFydGlhbFNvdXJjZTxEYXRhLCBWPiBleHRlbmRzIEZpbHRlcmVySXRlbVBhcnRpYWwge1xyXG5cdFx0XHRjb21wYXJhdG9yPzogKChhOiBWLCBiOiBWKSA9PiBudW1iZXIpIHwgVjtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgTW9kaWZpZXJQYXJ0aWFsPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtUGFydGlhbCB7IH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgUHJlZml4ZXJQYXJ0aWFsPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtUGFydGlhbCB7XHJcblx0XHRcdHRhcmdldD86IHNlbGVjdG9yIHwgKChlbDogSFRNTEVsZW1lbnQsIGRhdGE6IERhdGEsIG1vZGU6IE1vZGUpID0+IEhUTUxFbGVtZW50KTtcclxuXHRcdFx0cHJlZml4PzogKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCkgPT4gc3RyaW5nO1xyXG5cdFx0XHRwb3N0Zml4PzogKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCkgPT4gc3RyaW5nO1xyXG5cdFx0XHRwcmVmaXhBdHRyaWJ1dGU/OiBzdHJpbmc7XHJcblx0XHRcdHBvc3RmaXhBdHRyaWJ1dGU/OiBzdHJpbmc7XHJcblx0XHRcdGFsbD86IGJvb2xlYW47XHJcblx0XHR9XHJcblxyXG5cdFx0dHlwZSBVbmlvbjxTb3VyY2UsIFJlc3VsdD4gPSB7XHJcblx0XHRcdFtQIGluIGtleW9mIFNvdXJjZSAmIGtleW9mIFJlc3VsdF06IFNvdXJjZVtQXSB8IFJlc3VsdFtQXTtcclxuXHRcdH0gJiBPbWl0PFNvdXJjZSwga2V5b2YgUmVzdWx0PiAmIE9taXQ8UmVzdWx0LCBrZXlvZiBTb3VyY2U+O1xyXG5cclxuXHRcdHR5cGUgT3ZlcnJpZGU8VCwgTz4gPSBPbWl0PFQsIGtleW9mIE8+ICYgTztcclxuXHJcblx0XHR0eXBlIEVGU291cmNlPFQgZXh0ZW5kcyB7IHNvdXJjZTogYW55IH0+ID0gT3ZlcnJpZGU8T3ZlcnJpZGU8UGFydGlhbDxUPiwgVFsnc291cmNlJ10+LCB7IGJ1dHRvbj86IHNlbGVjdG9yIH0+O1xyXG5cclxuXHRcdHR5cGUgU291cmNlPFQgZXh0ZW5kcyB7IHNvdXJjZTogYW55IH0+ID0gVFsnc291cmNlJ10gJiB7XHJcblx0XHRcdGlkPzogc3RyaW5nOyBuYW1lPzogc3RyaW5nOyBkZXNjcmlwdGlvbj86IHN0cmluZztcclxuXHRcdFx0dGhyZWVXYXk/OiBXYXluZXNzOyBtb2RlPzogTW9kZTsgaW5jb21wYXRpYmxlPzogc3RyaW5nW107IGhpZGRlbj86IGJvb2xlYW47XHJcblx0XHR9O1xyXG5cclxuXHJcblx0XHQvKipcclxuXHRcdCAqIGNhbiBiZSBlaXRoZXIgTWFwIG9yIFdlYWtNYXBcclxuXHRcdCAqIChXZWFrTWFwIGlzIGxpa2VseSB0byBiZSB1c2VsZXNzIGlmIHRoZXJlIGFyZSBsZXNzIHRoZW4gMTBrIG9sZCBub2RlcyBpbiBtYXApXHJcblx0XHQgKi9cclxuXHRcdGxldCBNYXBUeXBlID0gTWFwO1xyXG5cdFx0dHlwZSBNYXBUeXBlPEsgZXh0ZW5kcyBvYmplY3QsIFY+ID0vLyBNYXA8SywgVj4gfCBcclxuXHRcdFx0V2Vha01hcDxLLCBWPjtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBsZXQgRUYgPSBFbnRyeUZpbHRlcmVyRXh0ZW5zaW9uLkVudHJ5RmlsdGVyZXI7XHJcbn0iLCIiXX0=