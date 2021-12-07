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
    (function (DateNowHack) {
        DateNowHack.speedMultiplier = 1;
        DateNowHack.deltaOffset = 0;
        DateNowHack.startRealtime = 0;
        DateNowHack.startTime = 0;
        function toFakeTime(time) {
            return Math.floor((time - DateNowHack.startRealtime) * DateNowHack.speedMultiplier + DateNowHack.startTime + DateNowHack.deltaOffset);
        }
        DateNowHack.toFakeTime = toFakeTime;
        DateNowHack.bracketSpeeds = [0.05, 0.25, 1, 2, 5, 10, 20, 60, 120];
        function speedhack(speed) {
            activate();
            DateNowHack.speedMultiplier = speed;
            location.hash = speed + '';
        }
        DateNowHack.speedhack = speedhack;
        function timejump(seconds) {
            activate();
            DateNowHack.deltaOffset += seconds * 1000;
        }
        DateNowHack.timejump = timejump;
        function switchSpeedhack(dir) {
            let currentIndex = DateNowHack.bracketSpeeds.indexOf(DateNowHack.speedMultiplier);
            if (currentIndex == -1)
                currentIndex = DateNowHack.bracketSpeeds.indexOf(1);
            let newSpeed = DateNowHack.bracketSpeeds[currentIndex + dir];
            if (newSpeed == undefined)
                return false;
            speedhack(newSpeed);
        }
        DateNowHack.switchSpeedhack = switchSpeedhack;
        function onkeydown(event) {
            if (event.code == 'BracketLeft') {
                switchSpeedhack(-1);
            }
            if (event.code == 'BracketRight') {
                switchSpeedhack(1);
            }
        }
        function bindBrackets(mode = 'on') {
            removeEventListener('keydown', onkeydown);
            if (mode == 'on') {
                addEventListener('keydown', onkeydown);
            }
        }
        DateNowHack.bindBrackets = bindBrackets;
        DateNowHack.activated = false;
        function activate() {
            Date._now ??= Date.now;
            Date.prototype._getTime ??= Date.prototype.getTime;
            DateNowHack.startTime = Date.now();
            DateNowHack.startRealtime = Date._now();
            DateNowHack.deltaOffset = 0;
            // console.log(Date.now(), )
            // debugger;
            Date.now = () => toFakeTime(Date._now());
            Date.prototype.getTime = function () {
                return this._t ??= toFakeTime(this._getTime());
            };
            Date.prototype.valueOf = function () {
                return this.getTime();
            };
            DateNowHack.activated = true;
        }
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
        FetchExtension.cache = null;
        async function openCache() {
            if (FetchExtension.cache)
                return FetchExtension.cache;
            FetchExtension.cache = await caches.open('fetch');
            return FetchExtension.cache;
        }
        async function cached(url, init = {}) {
            let cache = await openCache();
            let response = await cache.match(url);
            if (response) {
                response.cachedAt = +response.headers.get('cached-at') || 0;
                if (init.maxAge == null || Date.now() - response.cachedAt < init.maxAge)
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
            FetchExtension.cache = null;
            return caches.delete('fetch');
        }
        FetchExtension.clearCache = clearCache;
        async function uncache(url) {
            let cache = await openCache();
            return cache.delete(url);
        }
        FetchExtension.uncache = uncache;
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
                if (!el)
                    return this.entries.map(e => this.getData(e));
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
                el.parentElement.classList.add('ef-entry-container');
                el.classList.add('ef-entry');
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
            addMFilter(id, value, data) {
                return this.addItem(EntryFiltererExtension.MatchFilter, this.filters, data, { id, value });
            }
            addTagFilter(id, data) {
                return this.addItem(EntryFiltererExtension.TagFilter, this.filters, data, { id });
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
            orderMode = 'css';
            sortEntries() {
                if (this.entries.length <= 1)
                    return;
                if (this.orderedEntries.length == 0)
                    this.orderedEntries = this.entries;
                if (this.sorters.length == 0)
                    return;
                let entries = this.entries;
                let pairs = entries.map(e => [this.getData(e), e]);
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
                }
                else {
                    entries.map((e, i) => {
                        if (allOff) {
                            e.classList.remove('ef-reorder');
                            e.parentElement.classList.remove('ef-reorder-container');
                        }
                        else {
                            // use `display:flex` container and `order:var(--ef-order)` for children 
                            e.classList.add('ef-reorder');
                            e.style.setProperty('--ef-order', i + '');
                            e.parentElement.classList.remove('ef-reorder-container');
                        }
                    });
                }
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
                let entries = typeof this.entrySelector == 'function' ? this.entrySelector() : qq(this.entrySelector);
                if (this.entries.length != entries.length || this.entries) {
                    // TODO: sort entries in initial order
                }
                this.entries = entries;
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
                this.modifiers.splice(0, 999).map(e => e.remove());
                this.enable();
            }
            get _datas() {
                return this.entries
                    .filter(e => !e.classList.contains('ef-filtered-out'))
                    .map(e => this.getData(e));
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
            static instances = [];
            // listeners
            init() {
                if (!Paginate.removeDefaultRunBindings) {
                    Paginate.addDefaultRunBindings();
                }
                if (this._inited)
                    return;
                document.addEventListener('paginationrequest', this.onPaginationRequest.bind(this));
                document.addEventListener('paginationend', this.onPaginationEnd.bind(this));
                Paginate.instances.push(this);
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
            rawData;
            data;
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
                this.rawData = data;
                this.data = {
                    condition: toCondition(data.condition),
                    prefetch: toArray(data.prefetch)
                        .flatMap(e => toArray(data[e] ?? e)),
                    doc: toArray(data.doc),
                    click: toArray(data.click),
                    after: toArray(data.after),
                    replace: toArray(data.replace),
                };
                this.condition = () => {
                    if (!this.data.condition())
                        return false;
                    if (!canFind(this.data.doc))
                        return false;
                    if (!canFind(this.data.click))
                        return false;
                    return true;
                };
                this.init();
                if (this.data.condition()) {
                    this.data.prefetch.map(s => this.prefetch(s));
                }
                this.onrun = async () => {
                    // if (!fixedData.condition()) return;
                    await data.start?.();
                    this.data.click.map(e => document.q(e)?.click());
                    let doc = findOne(this.data.doc);
                    if (doc)
                        await this.fetchDocument(doc);
                    this.data.after.map(s => this.after(s));
                    this.data.replace.map(s => this.replace(s));
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
        function bindArrows() {
            addEventListener('keydown', event => {
                if (event.code == 'ArrowLeft') {
                    scrollWholeImage(-1);
                }
                if (event.code == 'ArrowRight') {
                    scrollWholeImage(1);
                }
            });
        }
        ImageScrollingExtension.bindArrows = bindArrows;
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
            }).filter(e => e.rect?.width || e.rect?.width);
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
            // if (dir == 0) throw new Error('scrolling in no direction!');
            if (!dir)
                return false;
            dir = Math.sign(dir);
            let datas = getAllImageInfo().vsort(e => e.yToScreenCenter);
            let central = datas.vsort(e => Math.abs(e.yToScreenCenter))[0];
            let nextCentralIndex = datas.indexOf(central);
            while (datas[nextCentralIndex + dir] &&
                Math.abs(datas[nextCentralIndex + dir].yToScreenCenter - central.yToScreenCenter) < 10)
                nextCentralIndex += dir;
            central = datas[nextCentralIndex];
            let next = datas[nextCentralIndex + dir];
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
                return scrollToImage(next);
            }
            // if to scroll to current image you have to scroll in opposide direction, scroll to next one
            if (Math.sign(central.yToScreenCenter) != dir) {
                return scrollToImage(next);
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
                this.button = elm(data.button, click => this.click(click), contextmenu => this.contextmenu(contextmenu));
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
        class MatchFilter extends EntryFiltererExtension.FiltererItem {
            input;
            lastValue;
            matcher;
            constructor(data) {
                data.button ??= 'button.ef-item.ef-filter[ef-mode="off"]';
                data.value ??= data => JSON.stringify(data);
                super(data);
                let value = !data.input ? '' : JSON.stringify(data.input);
                let input = `input[type=text}][value=${value}]`;
                this.input = elm(input, input => this.change()).appendTo(this.button);
            }
            change() {
                if (this.lastValue != this.input.value) {
                    this.lastValue = this.input.value;
                    this.matcher = this.generateMatcher(this.lastValue);
                }
            }
            apply(data, el) {
                if (this.mode == 'off')
                    return true;
                let result = this.matcher(this.value(data, el));
                return this.mode == 'on' ? result : !result;
            }
            // matcherCache: Map<string, ((input: string) => boolean)> = new Map();
            // getMatcher(source: string): (input: string) => boolean {
            // 	if (this.matcherCache.has(source)) {
            // 		return this.matcherCache.get(source);
            // 	}
            // 	let matcher = this.generateMatcher(source);
            // 	this.matcherCache.set(source, matcher);
            // 	return matcher;
            // }
            generateMatcher(source) {
                source = source.trim();
                if (source.length == 0)
                    return () => true;
                if (source.includes(' ')) {
                    let parts = source.split(' ').map(e => this.generateMatcher(e));
                    return (input) => parts.every(m => m(input));
                }
                if (source.startsWith('-')) {
                    if (source.length < 3)
                        return () => true;
                    let base = this.generateMatcher(source.slice(1));
                    return (input) => !base(input);
                }
                try {
                    let flags = source.toLowerCase() == source ? 'i' : '';
                    let regex = new RegExp(source, flags);
                    return (input) => !!input.match(regex);
                }
                catch (e) { }
                ;
                return (input) => input.includes(source);
            }
        }
        EntryFiltererExtension.MatchFilter = MatchFilter;
        class TagFilter extends EntryFiltererExtension.FiltererItem {
            tags;
            input;
            highightClass;
            lastValue = '';
            cachedMatcher;
            constructor(data) {
                data.button ??= 'button.ef-item.ef-filter[ef-mode="off"]';
                super(data);
                this.input = elm(`input[type=text}]`, input => this.change()).appendTo(this.button);
                this.input.value = data.input || '';
                this.tags = data.tags;
                this.cachedMatcher = [];
                this.highightClass = data.highightClass ?? 'ef-tag-highlisht';
            }
            apply(data, el) {
                let tags = this.getTags(data, el);
                tags.map(tag => this.resetHighlight(tag));
                let results = this.cachedMatcher.map(m => {
                    let r = { positive: m.positive, count: 0 };
                    for (let tag of tags) {
                        let str = typeof tag == 'string' ? tag : tag.innerText;
                        let val = m.matches(str);
                        if (val) {
                            r.count++;
                            this.highlightTag(tag, m.positive);
                        }
                    }
                    return r;
                });
                return results.every(r => r.positive ? r.count > 0 : r.count == 0);
            }
            resetHighlight(tag) {
                if (typeof tag == 'string')
                    return;
                tag.classList.remove(this.highightClass);
            }
            highlightTag(tag, positive) {
                if (typeof tag == 'string')
                    return;
                // FIXME
                tag.classList.add(this.highightClass);
            }
            getTags(data, el) {
                if (typeof this.tags == 'string')
                    return el.qq(this.tags);
                return this.tags(data, el, this.mode);
            }
            getTagStrings(data, el) {
                let tags = this.getTags(data, el);
                if (typeof tags[0] == 'string')
                    return tags;
                return tags.map((e) => e.innerText);
            }
            change() {
                if (this.lastValue == this.input.value)
                    return;
                this.lastValue = this.input.value;
                this.cachedMatcher = this.parseMatcher(this.lastValue);
                this.parent.requestUpdate();
            }
            parseMatcher(matcher) {
                matcher.trim();
                if (!matcher)
                    return [];
                if (matcher.includes(' ')) {
                    let parts = matcher.match(/"[^"]*"|\S+/g) || [];
                    return parts.flatMap(e => this.parseMatcher(e));
                }
                if (matcher.startsWith('-')) {
                    let parts = this.parseMatcher(matcher.slice(1));
                    return parts.map(e => ({ positive: !e.positive, matches: e.matches }));
                }
                if (matcher.match(/"^[^"]*"$/)) {
                    matcher = matcher.slice(1, -1);
                    return [{ positive: true, matches: tag => tag == matcher }];
                }
                if (matcher.length < 3)
                    return [];
                if (matcher.match(/"/)?.length == 1)
                    return [];
                try {
                    let g = new RegExp(matcher, 'i');
                    return [{ positive: true, matches: tag => !!tag.match(g) }];
                }
                catch (e) { }
                return [{ positive: true, matches: tag => tag.includes(matcher) }];
            }
        }
        EntryFiltererExtension.TagFilter = TagFilter;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9BcnJheS50cyIsIi4uL3NyYy9EYXRlTm93SGFjay50cyIsIi4uL3NyYy9PYmplY3QudHMiLCIuLi9zcmMvUHJvbWlzZS50cyIsIi4uL3NyYy9lbGVtZW50LnRzIiwiLi4vc3JjL2VsbS50cyIsIi4uL3NyYy9ldGMudHMiLCIuLi9zcmMvZmV0Y2gudHMiLCIuLi9zcmMvRmlsdGVyZXIvRW50aXR5RmlsdGVyZXIudHMiLCIuLi9zcmMvb2JzZXJ2ZXIudHMiLCIuLi9zcmMvUGFnaW5hdGUvUGFnaW5hdGlvbi50cyIsIi4uL3NyYy9QYWdpbmF0ZS9JbWFnZVNjcm9sbGluZy50cyIsIi4uL3NyYy9pbml0LnRzIiwiLi4vc3JjL3R5cGVzLnRzIiwiLi4vc3JjL0ZpbHRlcmVyL0ZpbHRlcmVySXRlbS50cyIsIi4uL3NyYy9GaWx0ZXJlci9GaWx0ZXIudHMiLCIuLi9zcmMvRmlsdGVyZXIvTW9kaWZpZXIudHMiLCIuLi9zcmMvRmlsdGVyZXIvU29ydGVyLnRzIiwiLi4vc3JjL0ZpbHRlcmVyL3R5cGVzLnRzIiwiLi4vc3JjL1BhZ2luYXRlL21vZGlmaWNhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFVLE1BQU0sQ0FvRGY7QUFwREQsV0FBVSxNQUFNO0lBQ2YsSUFBaUIsY0FBYyxDQWlEOUI7SUFqREQsV0FBaUIsY0FBYztRQUV2QixLQUFLLFVBQVUsSUFBSSxDQUFrQixNQUFtRCxFQUFFLE9BQU8sR0FBRyxDQUFDO1lBQzNHLElBQUksQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7Z0JBQUUsTUFBTSxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ3RDLElBQUksS0FBSyxHQUF1QixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FB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QUFFLENBQUMsQ0FBQyxDQUFDO2lCQUM3QjtnQkFDRCxPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7U0FDRDtRQW5DWSw2QkFBTSxTQW1DbEIsQ0FBQTtJQUVGLENBQUMsRUF2Q2dCLHNCQUFzQixHQUF0Qiw2QkFBc0IsS0FBdEIsNkJBQXNCLFFBdUN0QztBQUNGLENBQUMsRUF6Q1MsTUFBTSxLQUFOLE1BQU0sUUF5Q2Y7QUN6Q0QsSUFBVSxNQUFNLENBaUhmO0FBakhELFdBQVUsTUFBTTtJQUVmLElBQWlCLHNCQUFzQixDQTRHdEM7SUE1R0QsV0FBaUIsc0JBQXNCO1FBcUd0Qzs7O1dBR0c7UUFDSCxJQUFJLE9BQU8sR0FBRyxHQUFHLENBQUM7SUFHbkIsQ0FBQyxFQTVHZ0Isc0JBQXNCLEdBQXRCLDZCQUFzQixLQUF0Qiw2QkFBc0IsUUE0R3RDO0lBRVUsU0FBRSxHQUFHLHNCQUFzQixDQUFDLGFBQWEsQ0FBQztBQUN0RCxDQUFDLEVBakhTLE1BQU0sS0FBTixNQUFNLFFBaUhmIiwic291cmNlc0NvbnRlbnQiOlsibmFtZXNwYWNlIFBvb3BKcyB7XHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBBcnJheUV4dGVuc2lvbiB7XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBtYXA8VCwgVj4odGhpczogVFtdLCBtYXBwZXI6IChlOiBULCBpOiBudW1iZXIsIGE6IFRbXSkgPT4gUHJvbWlzZTxWPiB8IFYsIHRocmVhZHMgPSA1KTogUHJvbWlzZTxWW10+IHtcclxuXHRcdFx0aWYgKCEodGhyZWFkcyA+IDApKSB0aHJvdyBuZXcgRXJyb3IoKTtcclxuXHRcdFx0bGV0IHRhc2tzOiBbVCwgbnVtYmVyLCBUW11dW10gPSB0aGlzLm1hcCgoZSwgaSwgYSkgPT4gW2UsIGksIGFdKTtcclxuXHRcdFx0bGV0IHJlc3VsdHMgPSBBcnJheTxWPih0YXNrcy5sZW5ndGgpO1xyXG5cdFx0XHRsZXQgYW55UmVzb2x2ZWQgPSBQcm9taXNlRXh0ZW5zaW9uLmVtcHR5KCk7XHJcblx0XHRcdGxldCBmcmVlVGhyZWFkcyA9IHRocmVhZHM7XHJcblx0XHRcdGFzeW5jIGZ1bmN0aW9uIHJ1blRhc2sodGFzazogW1QsIG51bWJlciwgVFtdXSk6IFByb21pc2U8Vj4ge1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gYXdhaXQgbWFwcGVyKC4uLnRhc2spO1xyXG5cdFx0XHRcdH0gY2F0Y2ggKGVycikge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGVycjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0YXN5bmMgZnVuY3Rpb24gcnVuKHRhc2spIHtcclxuXHRcdFx0XHRmcmVlVGhyZWFkcy0tO1xyXG5cdFx0XHRcdHJlc3VsdHNbdGFza1sxXV0gPSBhd2FpdCBydW5UYXNrKHRhc2spO1xyXG5cdFx0XHRcdGZyZWVUaHJlYWRzKys7XHJcblx0XHRcdFx0bGV0IG9sZEFueVJlc29sdmVkID0gYW55UmVzb2x2ZWQ7XHJcblx0XHRcdFx0YW55UmVzb2x2ZWQgPSBQcm9taXNlRXh0ZW5zaW9uLmVtcHR5KCk7XHJcblx0XHRcdFx0b2xkQW55UmVzb2x2ZWQucih1bmRlZmluZWQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGZvciAobGV0IHRhc2sgb2YgdGFza3MpIHtcclxuXHRcdFx0XHRpZiAoZnJlZVRocmVhZHMgPT0gMCkge1xyXG5cdFx0XHRcdFx0YXdhaXQgYW55UmVzb2x2ZWQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJ1bih0YXNrKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR3aGlsZSAoZnJlZVRocmVhZHMgPCB0aHJlYWRzKSB7XHJcblx0XHRcdFx0YXdhaXQgYW55UmVzb2x2ZWQ7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHJlc3VsdHM7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIG1hcDxUID0gbnVtYmVyPih0aGlzOiBBcnJheUNvbnN0cnVjdG9yLCBsZW5ndGg6IG51bWJlciwgbWFwcGVyOiAobnVtYmVyKSA9PiBUID0gaSA9PiBpKSB7XHJcblx0XHRcdHJldHVybiB0aGlzKGxlbmd0aCkuZmlsbCgwKS5tYXAoKGUsIGksIGEpID0+IG1hcHBlcihpKSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHZzb3J0PFQ+KHRoaXM6IFRbXSwgbWFwcGVyOiAoZTogVCwgaTogbnVtYmVyLCBhOiBUW10pID0+IG51bWJlciwgc29ydGVyPzogKChhOiBudW1iZXIsIGI6IG51bWJlciwgYWU6IFQsIGJlOiBUKSA9PiBudW1iZXIpIHwgLTEpOiBUW107XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gdnNvcnQ8VCwgVj4odGhpczogVFtdLCBtYXBwZXI6IChlOiBULCBpOiBudW1iZXIsIGE6IFRbXSkgPT4gViwgc29ydGVyOiAoKGE6IFYsIGI6IFYsIGFlOiBULCBiZTogVCkgPT4gbnVtYmVyKSB8IC0xKTogVFtdO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHZzb3J0PFQ+KHRoaXM6IFRbXSwgbWFwcGVyOiAoZTogVCwgaTogbnVtYmVyLCBhOiBUW10pID0+IG51bWJlciwgc29ydGVyOiAoKGE6IG51bWJlciwgYjogbnVtYmVyLCBhZTogVCwgYmU6IFQpID0+IG51bWJlcikgfCAtMSA9IChhLCBiKSA9PiBhIC0gYik6IFRbXSB7XHJcblx0XHRcdGxldCB0aGVTb3J0ZXIgPSB0eXBlb2Ygc29ydGVyID09ICdmdW5jdGlvbicgPyBzb3J0ZXIgOiAoYSwgYikgPT4gYiAtIGE7XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHRcdFx0Lm1hcCgoZSwgaSwgYSkgPT4gKHsgZSwgdjogbWFwcGVyKGUsIGksIGEpIH0pKVxyXG5cdFx0XHRcdC5zb3J0KChhLCBiKSA9PiB0aGVTb3J0ZXIoYS52LCBiLnYsIGEuZSwgYi5lKSlcclxuXHRcdFx0XHQubWFwKGUgPT4gZS5lKTtcclxuXHRcdH1cclxuXHJcblx0fVxyXG5cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIERhdGVOb3dIYWNrIHtcclxuXHJcblx0XHRleHBvcnQgbGV0IHNwZWVkTXVsdGlwbGllciA9IDE7XHJcblx0XHRleHBvcnQgbGV0IGRlbHRhT2Zmc2V0ID0gMDtcclxuXHRcdGV4cG9ydCBsZXQgc3RhcnRSZWFsdGltZSA9IDA7XHJcblx0XHRleHBvcnQgbGV0IHN0YXJ0VGltZSA9IDA7XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHRvRmFrZVRpbWUodGltZTogbnVtYmVyKSB7XHJcblx0XHRcdHJldHVybiBNYXRoLmZsb29yKFxyXG5cdFx0XHRcdCh0aW1lIC0gc3RhcnRSZWFsdGltZSkgKiBzcGVlZE11bHRpcGxpZXIgKyBzdGFydFRpbWUgKyBkZWx0YU9mZnNldFxyXG5cdFx0XHQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBsZXQgYnJhY2tldFNwZWVkcyA9IFswLjA1LCAwLjI1LCAxLCAyLCA1LCAxMCwgMjAsIDYwLCAxMjBdO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHNwZWVkaGFjayhzcGVlZDogbnVtYmVyKSB7XHJcblx0XHRcdGFjdGl2YXRlKCk7XHJcblx0XHRcdHNwZWVkTXVsdGlwbGllciA9IHNwZWVkO1xyXG5cdFx0XHRsb2NhdGlvbi5oYXNoID0gc3BlZWQgKyAnJztcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiB0aW1lanVtcChzZWNvbmRzOiBudW1iZXIpIHtcclxuXHRcdFx0YWN0aXZhdGUoKTtcclxuXHRcdFx0ZGVsdGFPZmZzZXQgKz0gc2Vjb25kcyAqIDEwMDA7XHJcblx0XHR9XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gc3dpdGNoU3BlZWRoYWNrKGRpcjogbnVtYmVyKSB7XHJcblx0XHRcdGxldCBjdXJyZW50SW5kZXggPSBicmFja2V0U3BlZWRzLmluZGV4T2Yoc3BlZWRNdWx0aXBsaWVyKTtcclxuXHRcdFx0aWYgKGN1cnJlbnRJbmRleCA9PSAtMSkgY3VycmVudEluZGV4ID0gYnJhY2tldFNwZWVkcy5pbmRleE9mKDEpO1xyXG5cdFx0XHRsZXQgbmV3U3BlZWQgPSBicmFja2V0U3BlZWRzW2N1cnJlbnRJbmRleCArIGRpcl07XHJcblx0XHRcdGlmIChuZXdTcGVlZCA9PSB1bmRlZmluZWQpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0c3BlZWRoYWNrKG5ld1NwZWVkKTtcclxuXHRcdH1cclxuXHRcdGZ1bmN0aW9uIG9ua2V5ZG93bihldmVudDogS2V5Ym9hcmRFdmVudCkge1xyXG5cdFx0XHRpZiAoZXZlbnQuY29kZSA9PSAnQnJhY2tldExlZnQnKSB7XHJcblx0XHRcdFx0c3dpdGNoU3BlZWRoYWNrKC0xKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoZXZlbnQuY29kZSA9PSAnQnJhY2tldFJpZ2h0Jykge1xyXG5cdFx0XHRcdHN3aXRjaFNwZWVkaGFjaygxKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGJpbmRCcmFja2V0cyhtb2RlID0gJ29uJykge1xyXG5cdFx0XHRyZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25rZXlkb3duKTtcclxuXHRcdFx0aWYgKG1vZGUgPT0gJ29uJykge1xyXG5cdFx0XHRcdGFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbmtleWRvd24pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGxldCBhY3RpdmF0ZWQgPSBmYWxzZTtcclxuXHRcdGZ1bmN0aW9uIGFjdGl2YXRlKCkge1xyXG5cdFx0XHREYXRlLl9ub3cgPz89IERhdGUubm93O1xyXG5cdFx0XHREYXRlLnByb3RvdHlwZS5fZ2V0VGltZSA/Pz0gRGF0ZS5wcm90b3R5cGUuZ2V0VGltZTtcclxuXHRcdFx0c3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcclxuXHRcdFx0c3RhcnRSZWFsdGltZSA9IERhdGUuX25vdygpO1xyXG5cdFx0XHRkZWx0YU9mZnNldCA9IDA7XHJcblx0XHRcdC8vIGNvbnNvbGUubG9nKERhdGUubm93KCksIClcclxuXHRcdFx0Ly8gZGVidWdnZXI7XHJcblx0XHRcdERhdGUubm93ID0gKCkgPT4gdG9GYWtlVGltZShEYXRlLl9ub3coKSk7XHJcblx0XHRcdERhdGUucHJvdG90eXBlLmdldFRpbWUgPSBmdW5jdGlvbiAodGhpczogRGF0ZSAmIHsgX3Q/OiBudW1iZXIgfSkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLl90ID8/PSB0b0Zha2VUaW1lKHRoaXMuX2dldFRpbWUoKSk7XHJcblx0XHRcdH1cclxuXHRcdFx0RGF0ZS5wcm90b3R5cGUudmFsdWVPZiA9IGZ1bmN0aW9uICh0aGlzOiBEYXRlKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuZ2V0VGltZSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFjdGl2YXRlZCA9IHRydWU7XHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHJcblxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblxyXG5cdGV4cG9ydCBuYW1lc3BhY2UgT2JqZWN0RXh0ZW5zaW9uIHtcclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZGVmaW5lVmFsdWU8VCwgSyBleHRlbmRzIGtleW9mIFQ+KG86IFQsIHA6IEssIHZhbHVlOiBUW0tdKTogVDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBkZWZpbmVWYWx1ZTxUPihvOiBULCBmbjogRnVuY3Rpb24pOiBUO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGRlZmluZVZhbHVlPFQ+KG86IFQsIHA6IGtleW9mIFQgfCBzdHJpbmcgfCBGdW5jdGlvbiwgdmFsdWU/OiBhbnkpOiBUIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBwID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRbcCwgdmFsdWVdID0gW3AubmFtZSwgcF0gYXMgW3N0cmluZywgRnVuY3Rpb25dO1xyXG5cdFx0XHR9XHJcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBwLCB7XHJcblx0XHRcdFx0dmFsdWUsXHJcblx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdGVudW1lcmFibGU6IGZhbHNlLFxyXG5cdFx0XHRcdHdyaXRhYmxlOiB0cnVlLFxyXG5cdFx0XHR9KTtcclxuXHRcdFx0cmV0dXJuIG87XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUdldHRlcjxULCBLIGV4dGVuZHMga2V5b2YgVD4obzogVCwgcDogSywgZ2V0OiAoKSA9PiBUW0tdKTogVDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBkZWZpbmVHZXR0ZXI8VD4obzogVCwgZ2V0OiBGdW5jdGlvbik6IFQ7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZGVmaW5lR2V0dGVyPFQ+KG86IFQsIHA6IHN0cmluZyB8IGtleW9mIFQgfCBGdW5jdGlvbiwgZ2V0PzogYW55KTogVCB7XHJcblx0XHRcdGlmICh0eXBlb2YgcCA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0W3AsIGdldF0gPSBbcC5uYW1lLCBwXSBhcyBbc3RyaW5nLCBGdW5jdGlvbl07XHJcblx0XHRcdH1cclxuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIHAsIHtcclxuXHRcdFx0XHRnZXQsXHJcblx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdGVudW1lcmFibGU6IGZhbHNlLFxyXG5cdFx0XHR9KTtcclxuXHRcdFx0cmV0dXJuIG87XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIG1hcDxULCBWPihvOiBULCBtYXBwZXI6ICh2OiBWYWx1ZU9mPFQ+LCBrOiBrZXlvZiBULCBvOiBUKSA9PiBWKTogTWFwcGVkT2JqZWN0PFQsIFY+IHtcclxuXHRcdFx0bGV0IGVudHJpZXMgPSBPYmplY3QuZW50cmllcyhvKSBhcyBba2V5b2YgVCwgVmFsdWVPZjxUPl1bXTtcclxuXHRcdFx0cmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhlbnRyaWVzLm1hcCgoW2ssIHZdKSA9PiBbaywgbWFwcGVyKHYsIGssIG8pXSkpIGFzIE1hcHBlZE9iamVjdDxULCBWPjtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblxyXG5cdGV4cG9ydCBuYW1lc3BhY2UgUHJvbWlzZUV4dGVuc2lvbiB7XHJcblx0XHR0eXBlIFVud3JhcHBlZFByb21pc2U8VD4gPSBQcm9taXNlPFQ+ICYge1xyXG5cdFx0XHRyZXNvbHZlOiAodmFsdWU6IFQgfCBQcm9taXNlTGlrZTxUPikgPT4gdm9pZDtcclxuXHRcdFx0cmVqZWN0OiAocmVhc29uPzogYW55KSA9PiB2b2lkO1xyXG5cdFx0XHRyOiAodmFsdWU6IFQgfCBQcm9taXNlTGlrZTxUPikgPT4gdm9pZDtcclxuXHRcdFx0ajogKHJlYXNvbj86IGFueSkgPT4gdm9pZDtcclxuXHRcdH1cclxuXHJcblx0XHQvKipcclxuXHRcdCAqIENyZWF0ZXMgdW53cmFwcGVkIHByb21pc2VcclxuXHRcdCAqL1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGVtcHR5PFQ+KCkge1xyXG5cdFx0XHRsZXQgcmVzb2x2ZTogKHZhbHVlOiBUKSA9PiB2b2lkO1xyXG5cdFx0XHRsZXQgcmVqZWN0OiAocmVhc29uPzogYW55KSA9PiB2b2lkO1xyXG5cdFx0XHRsZXQgcCA9IG5ldyBQcm9taXNlPFQ+KChyLCBqKSA9PiB7XHJcblx0XHRcdFx0cmVzb2x2ZSA9IHI7XHJcblx0XHRcdFx0cmVqZWN0ID0gajtcclxuXHRcdFx0fSkgYXMgVW53cmFwcGVkUHJvbWlzZTxUPjtcclxuXHRcdFx0cC5yZXNvbHZlID0gcC5yID0gcmVzb2x2ZTtcclxuXHRcdFx0cC5yZWplY3QgPSBwLmogPSByZWplY3Q7XHJcblx0XHRcdHJldHVybiBwO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBmcmFtZShuID0gMSk6IFByb21pc2U8bnVtYmVyPiB7XHJcblx0XHRcdHdoaWxlICgtLW4gPiAwKSB7XHJcblx0XHRcdFx0YXdhaXQgbmV3IFByb21pc2UocmVxdWVzdEFuaW1hdGlvbkZyYW1lKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UocmVxdWVzdEFuaW1hdGlvbkZyYW1lKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59XHJcbiIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIFF1ZXJ5U2VsZWN0b3Ige1xyXG5cclxuXHRcdGV4cG9ydCBuYW1lc3BhY2UgV2luZG93USB7XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHNlbGVjdG9yOiBLKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxFIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50PihzZWxlY3Rvcjogc2VsZWN0b3IpOiBFO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3Rvcjogc2VsZWN0b3IpOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxKHNlbGVjdG9yOiBzdHJpbmcpIHtcclxuXHRcdFx0XHRyZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3RvcjogSyk6IChIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10pW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxFIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50PihzZWxlY3Rvcjogc2VsZWN0b3IpOiBFW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3Rvcjogc2VsZWN0b3IpOiAoSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdKVtdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXEoc2VsZWN0b3I6IHN0cmluZykge1xyXG5cdFx0XHRcdHJldHVybiBbLi4uZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcildO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IG5hbWVzcGFjZSBEb2N1bWVudFEge1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPih0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IEspOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEUgZXh0ZW5kcyBFbGVtZW50ID0gSFRNTEVsZW1lbnQ+KHRoaXM6IERvY3VtZW50LCBzZWxlY3Rvcjogc2VsZWN0b3IpOiBFO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPih0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IHNlbGVjdG9yKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcSh0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IHN0cmluZykge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmRvY3VtZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IERvY3VtZW50LCBzZWxlY3RvcjogSyk6IChIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10pW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxFIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50Pih0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IHNlbGVjdG9yKTogRVtdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXE8SyBleHRlbmRzIGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcD4odGhpczogRG9jdW1lbnQsIHNlbGVjdG9yOiBzZWxlY3Rvcik6IChIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10pW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcSh0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IHN0cmluZykge1xyXG5cdFx0XHRcdHJldHVybiBbLi4udGhpcy5kb2N1bWVudEVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcildO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IG5hbWVzcGFjZSBFbGVtZW50USB7XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBLKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxFIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50Pih0aGlzOiBFbGVtZW50LCBzZWxlY3Rvcjogc2VsZWN0b3IpOiBFO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPih0aGlzOiBFbGVtZW50LCBzZWxlY3Rvcjogc2VsZWN0b3IpOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxKHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBLKTogKEhUTUxFbGVtZW50VGFnTmFtZU1hcFtLXSlbXTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEUgZXh0ZW5kcyBFbGVtZW50ID0gSFRNTEVsZW1lbnQ+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBzZWxlY3Rvcik6IEVbXTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBzZWxlY3Rvcik6IChIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10pW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcSh0aGlzOiBFbGVtZW50LCBzZWxlY3Rvcjogc3RyaW5nKSB7XHJcblx0XHRcdFx0cmV0dXJuIFsuLi50aGlzLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFbGVtZW50RXh0ZW5zaW9uIHtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBlbWl0PFQgZXh0ZW5kcyBDdXN0b21FdmVudDx7IF9ldmVudD86IHN0cmluZyB9Pj4odGhpczogRWxlbWVudCwgdHlwZTogVFsnZGV0YWlsJ11bJ19ldmVudCddLCBkZXRhaWw/OiBUWydkZXRhaWwnXSk7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZW1pdDxUPih0aGlzOiBFbGVtZW50LCB0eXBlOiBzdHJpbmcsIGRldGFpbD86IFQpIHtcclxuXHRcdFx0bGV0IGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KHR5cGUsIHtcclxuXHRcdFx0XHRidWJibGVzOiB0cnVlLFxyXG5cdFx0XHRcdGRldGFpbCxcclxuXHRcdFx0fSk7XHJcblx0XHRcdHRoaXMuZGlzcGF0Y2hFdmVudChldmVudCk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFRvPEUgZXh0ZW5kcyBFbGVtZW50Pih0aGlzOiBFLCBwYXJlbnQ6IEVsZW1lbnQgfCBzZWxlY3Rvcik6IEUge1xyXG5cdFx0XHRpZiAodHlwZW9mIHBhcmVudCA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdHBhcmVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IocGFyZW50KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRwYXJlbnQuYXBwZW5kKHRoaXMpO1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH1cclxuXHR9XHJcblxyXG59XHJcbiIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIEVsbSB7XHJcblx0XHR0eXBlIENoaWxkID0gTm9kZSB8IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW47XHJcblx0XHR0eXBlIFNvbWVFdmVudCA9IEV2ZW50ICYgTW91c2VFdmVudCAmIEtleWJvYXJkRXZlbnQgJiB7IHRhcmdldDogSFRNTEVsZW1lbnQgfTtcclxuXHRcdHR5cGUgTGlzdGVuZXIgPSAoKGV2ZW50OiBTb21lRXZlbnQpID0+IGFueSlcclxuXHRcdFx0JiB7IG5hbWU/OiBgJHsnJyB8ICdib3VuZCAnfSR7J29uJyB8ICcnfSR7a2V5b2YgSFRNTEVsZW1lbnRFdmVudE1hcH1gIHwgJycgfSB8ICgoZXZlbnQ6IFNvbWVFdmVudCkgPT4gYW55KTtcclxuXHJcblx0XHRjb25zdCBlbG1SZWdleCA9IG5ldyBSZWdFeHAoW1xyXG5cdFx0XHQvXig/PHRhZz5bXFx3LV0rKS8sXHJcblx0XHRcdC8jKD88aWQ+W1xcdy1dKykvLFxyXG5cdFx0XHQvXFwuKD88Y2xhc3M+W1xcdy1dKykvLFxyXG5cdFx0XHQvXFxbKD88YXR0cjE+W1xcdy1dKylcXF0vLFxyXG5cdFx0XHQvXFxbKD88YXR0cjI+W1xcdy1dKyk9KD8hWydcIl0pKD88dmFsMj5bXlxcXV0qKVxcXS8sXHJcblx0XHRcdC9cXFsoPzxhdHRyMz5bXFx3LV0rKT1cIig/PHZhbDM+KD86W15cIl18XFxcXFwiKSopXCJcXF0vLFxyXG5cdFx0XHQvXFxbKD88YXR0cjQ+W1xcdy1dKyk9XCIoPzx2YWw0Pig/OlteJ118XFxcXCcpKilcIlxcXS8sXHJcblx0XHRdLm1hcChlID0+IGUuc291cmNlKS5qb2luKCd8JyksICdnJyk7XHJcblxyXG5cdFx0LyoqIGlmIGBlbG1gIHNob3VsZCBkaXNhbGxvdyBsaXN0ZW5lcnMgbm90IGV4aXN0aW5nIGFzIGBvbiAqIGAgcHJvcGVydHkgb24gdGhlIGVsZW1lbnQgKi9cclxuXHRcdGV4cG9ydCBsZXQgYWxsb3dPbmx5RXhpc3RpbmdMaXN0ZW5lcnMgPSB0cnVlO1xyXG5cclxuXHRcdC8qKiBpZiBgZWxtYCBzaG91bGQgYWxsb3cgb3ZlcnJpZGluZyBgb24gKiBgIGxpc3RlbmVycyBpZiBtdWx0aXBsZSBvZiB0aGVtIGFyZSBwcm92aWRlZCAqL1xyXG5cdFx0ZXhwb3J0IGxldCBhbGxvd092ZXJyaWRlT25MaXN0ZW5lcnMgPSBmYWxzZTtcclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHNlbGVjdG9yOiBLLCAuLi5jaGlsZHJlbjogKENoaWxkIHwgTGlzdGVuZXIpW10pOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtPEUgZXh0ZW5kcyBFbGVtZW50ID0gSFRNTEVsZW1lbnQ+KHNlbGVjdG9yOiBzZWxlY3RvciwgLi4uY2hpbGRyZW46IChDaGlsZCB8IExpc3RlbmVyKVtdKTogRTtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBlbG08SyBleHRlbmRzIGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcD4oc2VsZWN0b3I6IHNlbGVjdG9yLCAuLi5jaGlsZHJlbjogKENoaWxkIHwgTGlzdGVuZXIpW10pOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtKCk6IEhUTUxEaXZFbGVtZW50O1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGVsbShzZWxlY3Rvcjogc3RyaW5nID0gJycsIC4uLmNoaWxkcmVuOiAoQ2hpbGQgfCBMaXN0ZW5lcilbXSk6IEhUTUxFbGVtZW50IHtcclxuXHRcdFx0aWYgKHNlbGVjdG9yLnJlcGxhY2VBbGwoZWxtUmVnZXgsICcnKSAhPSAnJykge1xyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBzZWxlY3RvcjogJHtzZWxlY3Rvcn0gYCk7XHJcblx0XHRcdH1cclxuXHRcdFx0bGV0IGVsZW1lbnQ6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0XHRcdC8vIGxldCB0YWcgPSAnJztcclxuXHRcdFx0Ly8gbGV0IGZpcnN0TWF0Y2ggPSBmYWxzZTtcclxuXHRcdFx0Zm9yIChsZXQgbWF0Y2ggb2Ygc2VsZWN0b3IubWF0Y2hBbGwoZWxtUmVnZXgpKSB7XHJcblx0XHRcdFx0aWYgKG1hdGNoLmdyb3Vwcy50YWcpIHtcclxuXHRcdFx0XHRcdC8vIGlmICh0YWcgJiYgbWF0Y2guZ3JvdXBzLnRhZyAhPSB0YWcpIHtcclxuXHRcdFx0XHRcdC8vIFx0dGhyb3cgbmV3IEVycm9yKGBzZWxlY3RvciBoYXMgdHdvIGRpZmZlcmVudCB0YWdzIGF0IG9uY2UgOiA8JHt0YWd9PiBhbmQgPCR7bWF0Y2guZ3JvdXBzLnRhZ30+YCk7XHJcblx0XHRcdFx0XHQvLyB9XHJcblx0XHRcdFx0XHQvLyB0YWcgPSBtYXRjaC5ncm91cHMudGFnO1xyXG5cdFx0XHRcdFx0Ly8gaWYgKCFmaXJzdE1hdGNoKSByZXR1cm4gZWxtKHRhZyArIHNlbGVjdG9yLCAuLi5jaGlsZHJlbik7XHJcblx0XHRcdFx0XHRlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChtYXRjaC5ncm91cHMudGFnKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5pZCkge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5pZCA9IG1hdGNoLmdyb3Vwcy5pZDtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5jbGFzcykge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKG1hdGNoLmdyb3Vwcy5jbGFzcyk7XHJcblx0XHRcdFx0fSBlbHNlIGlmIChtYXRjaC5ncm91cHMuYXR0cjEpIHtcclxuXHRcdFx0XHRcdGVsZW1lbnQuc2V0QXR0cmlidXRlKG1hdGNoLmdyb3Vwcy5hdHRyMSwgXCJ0cnVlXCIpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAobWF0Y2guZ3JvdXBzLmF0dHIyKSB7XHJcblx0XHRcdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZShtYXRjaC5ncm91cHMuYXR0cjIsIG1hdGNoLmdyb3Vwcy52YWwyKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5hdHRyMykge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5zZXRBdHRyaWJ1dGUobWF0Y2guZ3JvdXBzLmF0dHIzLCBtYXRjaC5ncm91cHMudmFsMy5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAobWF0Y2guZ3JvdXBzLmF0dHI0KSB7XHJcblx0XHRcdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZShtYXRjaC5ncm91cHMuYXR0cjQsIG1hdGNoLmdyb3Vwcy52YWw0LnJlcGxhY2UoL1xcXFwnL2csICdcXCcnKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIGZpcnN0TWF0Y2ggPSBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRmb3IgKGxldCBsaXN0ZW5lciBvZiBjaGlsZHJlbi5maWx0ZXIoZSA9PiB0eXBlb2YgZSA9PSAnZnVuY3Rpb24nKSBhcyBMaXN0ZW5lcltdKSB7XHJcblx0XHRcdFx0bGV0IG5hbWU6IHN0cmluZyA9IGxpc3RlbmVyLm5hbWU7XHJcblx0XHRcdFx0aWYgKCFuYW1lKSBuYW1lID0gKGxpc3RlbmVyICsgJycpLm1hdGNoKC9cXGIoPyFmdW5jdGlvblxcYilcXHcrLylbMF07XHJcblx0XHRcdFx0aWYgKCFuYW1lKSB0aHJvdyBuZXcgRXJyb3IoJ3RyeWluZyB0byBiaW5kIHVubmFtZWQgZnVuY3Rpb24nKTtcclxuXHRcdFx0XHRpZiAobmFtZS5zdGFydHNXaXRoKCdib3VuZCAnKSkgbmFtZSA9IG5hbWUuc2xpY2UoJ2JvdW5kICcubGVuZ3RoKTtcclxuXHRcdFx0XHRpZiAobmFtZS5zdGFydHNXaXRoKCdvbicpKSB7XHJcblx0XHRcdFx0XHRpZiAoIWVsZW1lbnQuaGFzT3duUHJvcGVydHkobmFtZSkpIHRocm93IG5ldyBFcnJvcihgPCAke2VsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpfT4gZG9lcyBub3QgaGF2ZSBcIiR7bmFtZX1cIiBsaXN0ZW5lcmApO1xyXG5cdFx0XHRcdFx0aWYgKCFhbGxvd092ZXJyaWRlT25MaXN0ZW5lcnMgJiYgZWxlbWVudFtuYW1lXSkgdGhyb3cgbmV3IEVycm9yKCdvdmVycmlkaW5nIGBvbiAqIGAgbGlzdGVuZXJzIGlzIGRpc2FibGVkJyk7XHJcblx0XHRcdFx0XHRlbGVtZW50W25hbWVdID0gbGlzdGVuZXI7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGlmIChhbGxvd09ubHlFeGlzdGluZ0xpc3RlbmVycyAmJiBlbGVtZW50WydvbicgKyBuYW1lXSA9PT0gdW5kZWZpbmVkKVxyXG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYDwke2VsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpfT4gZG9lcyBub3QgaGF2ZSBcIm9uJyR7bmFtZX0nXCIgbGlzdGVuZXJgKTtcclxuXHRcdFx0XHRcdGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBsaXN0ZW5lcik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsZW1lbnQuYXBwZW5kKC4uLmNoaWxkcmVuLmZpbHRlcihlID0+IHR5cGVvZiBlICE9ICdmdW5jdGlvbicpIGFzIChOb2RlIHwgc3RyaW5nKVtdKTtcclxuXHRcdFx0cmV0dXJuIGVsZW1lbnQ7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFPckVsbTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3RvcjogSywgcGFyZW50PzogUGFyZW50Tm9kZSB8IHNlbGVjdG9yKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFPckVsbTxFIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50PihzZWxlY3Rvcjogc3RyaW5nLCBwYXJlbnQ/OiBQYXJlbnROb2RlIHwgc2VsZWN0b3IpOiBFO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFPckVsbTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3Rvcjogc3RyaW5nLCBwYXJlbnQ/OiBQYXJlbnROb2RlIHwgc2VsZWN0b3IpOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcU9yRWxtKHNlbGVjdG9yOiBzdHJpbmcsIHBhcmVudD86IFBhcmVudE5vZGUgfCBzdHJpbmcpIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBwYXJlbnQgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRwYXJlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHBhcmVudCkgYXMgUGFyZW50Tm9kZTtcclxuXHRcdFx0XHRpZiAoIXBhcmVudCkgdGhyb3cgbmV3IEVycm9yKCdmYWlsZWQgdG8gZmluZCBwYXJlbnQgZWxlbWVudCcpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChzZWxlY3Rvci5pbmNsdWRlcygnPicpKSB7XHJcblx0XHRcdFx0bGV0IHBhcmVudFNlbGVjdG9yID0gc2VsZWN0b3Iuc3BsaXQoJz4nKS5zbGljZSgwLCAtMSkuam9pbignPicpO1xyXG5cdFx0XHRcdHNlbGVjdG9yID0gc2VsZWN0b3Iuc3BsaXQoJz4nKS5wb3AoKTtcclxuXHRcdFx0XHRwYXJlbnQgPSAocGFyZW50IHx8IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yKHBhcmVudFNlbGVjdG9yKSBhcyBQYXJlbnROb2RlO1xyXG5cdFx0XHRcdGlmICghcGFyZW50KSB0aHJvdyBuZXcgRXJyb3IoJ2ZhaWxlZCB0byBmaW5kIHBhcmVudCBlbGVtZW50Jyk7XHJcblx0XHRcdH1cclxuXHRcdFx0bGV0IGNoaWxkID0gKHBhcmVudCB8fCBkb2N1bWVudCkucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XHJcblx0XHRcdGlmIChjaGlsZCkgcmV0dXJuIGNoaWxkO1xyXG5cclxuXHRcdFx0Y2hpbGQgPSBlbG0oc2VsZWN0b3IpO1xyXG5cdFx0XHRwYXJlbnQ/LmFwcGVuZChjaGlsZCk7XHJcblx0XHRcdHJldHVybiBjaGlsZDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBldGMge1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGtleWJpbmQoa2V5OiBzdHJpbmcsIGZuOiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHZvaWQpIHtcclxuXHRcdFx0bGV0IGNvZGUgPSBrZXkubGVuZ3RoID09IDEgPyAnS2V5JyArIGtleS50b1VwcGVyQ2FzZSgpIDoga2V5O1xyXG5cdFx0XHRmdW5jdGlvbiBvbmtleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcclxuXHRcdFx0XHRpZiAoZXZlbnQuY29kZSA9PSBjb2RlKSB7XHJcblx0XHRcdFx0XHRmbihldmVudCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbmtleWRvd24pO1xyXG5cdFx0XHRyZXR1cm4gKCkgPT4gcmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9ua2V5ZG93bik7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZ1bGxzY3JlZW4ob24/OiBib29sZWFuKSB7XHJcblx0XHRcdGxldCBjZW50cmFsID0gSW1hZ2VTY3JvbGxpbmdFeHRlbnNpb24uaW1hZ2VTY3JvbGxpbmdBY3RpdmUgJiYgSW1hZ2VTY3JvbGxpbmdFeHRlbnNpb24uZ2V0Q2VudHJhbEltZygpO1xyXG5cdFx0XHRpZiAoIWRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50KSB7XHJcblx0XHRcdFx0aWYgKG9uID09IGZhbHNlKSByZXR1cm47XHJcblx0XHRcdFx0YXdhaXQgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuKCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0aWYgKG9uID09IHRydWUpIHJldHVybjtcclxuXHRcdFx0XHRhd2FpdCBkb2N1bWVudC5leGl0RnVsbHNjcmVlbigpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChjZW50cmFsKSB7XHJcblx0XHRcdFx0Y2VudHJhbC5zY3JvbGxJbnRvVmlldygpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGFueWJpbmQoa2V5T3JFdmVudDogc3RyaW5nIHwgbnVtYmVyLCBmbjogKGV2ZW50OiBFdmVudCkgPT4gdm9pZCkge1xyXG5cdFx0XHRpZiAodHlwZW9mIGtleU9yRXZlbnQgPT0gXCJudW1iZXJcIikga2V5T3JFdmVudCA9IGtleU9yRXZlbnQgKyAnJztcclxuXHRcdFx0Ly8gZGV0ZWN0IGlmIGl0IGlzIGV2ZW50XHJcblx0XHRcdGxldCBpc0V2ZW50ID0gd2luZG93Lmhhc093blByb3BlcnR5KCdvbicgKyBrZXlPckV2ZW50KTtcclxuXHRcdFx0aWYgKGlzRXZlbnQpIHtcclxuXHRcdFx0XHRhZGRFdmVudExpc3RlbmVyKGtleU9yRXZlbnQsIGZuKTtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gcGFyc2Uga2V5IGNvZGVcclxuXHRcdFx0aWYgKCFpc05hTihwYXJzZUludChrZXlPckV2ZW50KSkpIHtcclxuXHRcdFx0XHRrZXlPckV2ZW50ID0gYERpZ2l0JHtrZXlPckV2ZW50fWA7XHJcblx0XHRcdH0gZWxzZSBpZiAoa2V5T3JFdmVudC5sZW5ndGggPT0gMSkge1xyXG5cdFx0XHRcdGtleU9yRXZlbnQgPSBgS2V5JHtrZXlPckV2ZW50LnRvVXBwZXJDYXNlKCl9YDtcclxuXHRcdFx0fVxyXG5cdFx0XHRhZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZXYgPT4ge1xyXG5cdFx0XHRcdGlmIChldi5jb2RlICE9IGtleU9yRXZlbnQpIHJldHVybjtcclxuXHRcdFx0XHRmbihldik7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBmdWxsc2NyZWVuT24oa2V5OiBzdHJpbmcpIHtcclxuXHRcdFx0aWYgKGtleSA9PSAnc2Nyb2xsJykge1xyXG5cdFx0XHRcdGFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsICgpID0+IGZ1bGxzY3JlZW4odHJ1ZSkpO1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4ga2V5YmluZChrZXksICgpID0+IGZ1bGxzY3JlZW4oKSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGZJc0ZvckZ1bGxzY3JlZW4oKSB7XHJcblx0XHRcdGtleWJpbmQoJ0YnLCAoKSA9PiBmdWxsc2NyZWVuKCkpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBoYXNoQ29kZSh0aGlzOiBzdHJpbmcpO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGhhc2hDb2RlKHZhbHVlOiBzdHJpbmcpO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGhhc2hDb2RlKHRoaXM6IHN0cmluZywgdmFsdWU/OiBzdHJpbmcpIHtcclxuXHRcdFx0dmFsdWUgPz89IHRoaXM7XHJcblx0XHRcdGxldCBoYXNoID0gMDtcclxuXHRcdFx0Zm9yIChsZXQgYyBvZiB2YWx1ZSkge1xyXG5cdFx0XHRcdGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSArIGMuY2hhckNvZGVBdCgwKTtcclxuXHRcdFx0XHRoYXNoID0gaGFzaCAmIGhhc2g7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGhhc2g7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGluaXQoKSB7XHJcblx0XHRcdC8vIFN0cmluZy5wcm90b3R5cGUuaGFzaENvZGUgPSBoYXNoQ29kZTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gY3VycmVudFNjcmlwdEhhc2goKSB7XHJcblx0XHRcdHJldHVybiBoYXNoQ29kZShkb2N1bWVudC5jdXJyZW50U2NyaXB0LmlubmVySFRNTCk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHJlbG9hZE9uQ3VycmVudFNjcmlwdENoYW5nZWQoc2NyaXB0TmFtZTogc3RyaW5nID0gbG9jYXRpb24uaG9zdG5hbWUgKyAnLnVqcycpIHtcclxuXHRcdFx0bGV0IHNjcmlwdElkID0gYHJlbG9hZE9uQ3VycmVudFNjcmlwdENoYW5nZWRfJHtzY3JpcHROYW1lfWA7XHJcblx0XHRcdGxldCBzY3JpcHRIYXNoID0gY3VycmVudFNjcmlwdEhhc2goKSArICcnO1xyXG5cdFx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShzY3JpcHRJZCwgc2NyaXB0SGFzaCk7XHJcblx0XHRcdGFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgKCkgPT4ge1xyXG5cdFx0XHRcdGlmIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShzY3JpcHRJZCkgIT0gc2NyaXB0SGFzaCkge1xyXG5cdFx0XHRcdFx0bG9jYXRpb24ucmVsb2FkKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgbGV0IGZhc3RTY3JvbGw6IHtcclxuXHRcdFx0KHNwZWVkPzogbnVtYmVyKTogdm9pZDtcclxuXHRcdFx0c3BlZWQ/OiBudW1iZXI7XHJcblx0XHRcdGFjdGl2ZT86IGJvb2xlYW47XHJcblx0XHRcdG9mZj86ICgpID0+IHZvaWQ7XHJcblx0XHR9ID0gZnVuY3Rpb24gKHNwZWVkID0gMC4yNSkge1xyXG5cdFx0XHRpZiAoZmFzdFNjcm9sbC5hY3RpdmUpIGZhc3RTY3JvbGwub2ZmKCk7XHJcblx0XHRcdGZhc3RTY3JvbGwuYWN0aXZlID0gdHJ1ZTtcclxuXHRcdFx0ZmFzdFNjcm9sbC5zcGVlZCA9IHNwZWVkO1xyXG5cdFx0XHRmdW5jdGlvbiBvbndoZWVsKGV2ZW50OiBNb3VzZUV2ZW50ICYgeyB3aGVlbERlbHRhWTogbnVtYmVyIH0pIHtcclxuXHRcdFx0XHRpZiAoZXZlbnQuZGVmYXVsdFByZXZlbnRlZCkgcmV0dXJuO1xyXG5cdFx0XHRcdGlmIChldmVudC5jdHJsS2V5IHx8IGV2ZW50LnNoaWZ0S2V5KSByZXR1cm47XHJcblx0XHRcdFx0c2Nyb2xsQnkoMCwgLU1hdGguc2lnbihldmVudC53aGVlbERlbHRhWSkgKiBpbm5lckhlaWdodCAqIGZhc3RTY3JvbGwuc3BlZWQpO1xyXG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdH1cclxuXHRcdFx0YWRkRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIG9ud2hlZWwsIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdGZhc3RTY3JvbGwub2ZmID0gKCkgPT4ge1xyXG5cdFx0XHRcdGZhc3RTY3JvbGwuYWN0aXZlID0gZmFsc2U7XHJcblx0XHRcdFx0cmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIG9ud2hlZWwpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRmYXN0U2Nyb2xsLmFjdGl2ZSA9IGZhbHNlO1xyXG5cdFx0ZmFzdFNjcm9sbC5vZmYgPSAoKSA9PiB7IH07XHJcblxyXG5cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gb25yYWYoZjogKCkgPT4gdm9pZCkge1xyXG5cdFx0XHRsZXQgbG9vcCA9IHRydWU7XHJcblx0XHRcdHZvaWQgYXN5bmMgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdHdoaWxlIChsb29wKSB7XHJcblx0XHRcdFx0XHRhd2FpdCBQcm9taXNlLmZyYW1lKCk7XHJcblx0XHRcdFx0XHRmKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KCk7XHJcblx0XHRcdHJldHVybiAoKSA9PiB7IGxvb3AgPSBmYWxzZSB9O1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCByZXNpemVPYnNlcnZlcjogUmVzaXplT2JzZXJ2ZXI7XHJcblx0XHRsZXQgcmVzaXplTGlzdGVuZXJzOiAoKG5ld0hlaWdodDogbnVtYmVyLCBvbGRIZWlnaHQ6IG51bWJlcikgPT4gdm9pZClbXSA9IFtdO1xyXG5cdFx0bGV0IHByZXZpb3VzQm9keUhlaWdodCA9IDA7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gb25oZWlnaHRjaGFuZ2UoZjogKG5ld0hlaWdodDogbnVtYmVyLCBvbGRIZWlnaHQ6IG51bWJlcikgPT4gdm9pZCkge1xyXG5cdFx0XHRpZiAoIXJlc2l6ZU9ic2VydmVyKSB7XHJcblx0XHRcdFx0cHJldmlvdXNCb2R5SGVpZ2h0ID0gZG9jdW1lbnQuYm9keS5jbGllbnRIZWlnaHQ7XHJcblx0XHRcdFx0cmVzaXplT2JzZXJ2ZXIgPSBuZXcgUmVzaXplT2JzZXJ2ZXIoZW50cmllcyA9PiB7XHJcblx0XHRcdFx0XHRmb3IgKGxldCBlIG9mIGVudHJpZXMpIHtcclxuXHRcdFx0XHRcdFx0aWYgKGUudGFyZ2V0ICE9IGRvY3VtZW50LmJvZHkpIGNvbnRpbnVlO1xyXG5cclxuXHRcdFx0XHRcdFx0bGV0IG5ld0JvZHlIZWlnaHQgPSBlLnRhcmdldC5jbGllbnRIZWlnaHQ7XHJcblx0XHRcdFx0XHRcdGZvciAobGV0IGYgb2YgcmVzaXplTGlzdGVuZXJzKSB7XHJcblx0XHRcdFx0XHRcdFx0ZihuZXdCb2R5SGVpZ2h0LCBwcmV2aW91c0JvZHlIZWlnaHQpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdHByZXZpb3VzQm9keUhlaWdodCA9IG5ld0JvZHlIZWlnaHQ7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0cmVzaXplT2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXNpemVMaXN0ZW5lcnMucHVzaChmKTtcclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKCkge1xyXG5cdFx0XHRcdHJlc2l6ZUxpc3RlbmVycy5zcGxpY2UocmVzaXplTGlzdGVuZXJzLmluZGV4T2YoZikpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG59XHJcblxyXG4vLyBpbnRlcmZhY2UgU3RyaW5nIHtcclxuLy8gXHRoYXNoQ29kZTogKCkgPT4gbnVtYmVyO1xyXG4vLyB9XHJcbiIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIEZldGNoRXh0ZW5zaW9uIHtcclxuXHRcdGV4cG9ydCB0eXBlIFJlcXVlc3RJbml0RXggPSBSZXF1ZXN0SW5pdCAmIHsgbWF4QWdlPzogbnVtYmVyIH07XHJcblx0XHRleHBvcnQgbGV0IGRlZmF1bHRzOiBSZXF1ZXN0SW5pdCA9IHsgY3JlZGVudGlhbHM6ICdpbmNsdWRlJyB9O1xyXG5cclxuXHRcdGV4cG9ydCBsZXQgY2FjaGU6IENhY2hlID0gbnVsbDtcclxuXHRcdGFzeW5jIGZ1bmN0aW9uIG9wZW5DYWNoZSgpIHtcclxuXHRcdFx0aWYgKGNhY2hlKSByZXR1cm4gY2FjaGU7XHJcblx0XHRcdGNhY2hlID0gYXdhaXQgY2FjaGVzLm9wZW4oJ2ZldGNoJyk7XHJcblx0XHRcdHJldHVybiBjYWNoZTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FjaGVkKHVybDogc3RyaW5nLCBpbml0OiBSZXF1ZXN0SW5pdEV4ID0ge30pOiBQcm9taXNlPFJlc3BvbnNlPiB7XHJcblx0XHRcdGxldCBjYWNoZSA9IGF3YWl0IG9wZW5DYWNoZSgpO1xyXG5cdFx0XHRsZXQgcmVzcG9uc2UgPSBhd2FpdCBjYWNoZS5tYXRjaCh1cmwpO1xyXG5cdFx0XHRpZiAocmVzcG9uc2UpIHtcclxuXHRcdFx0XHRyZXNwb25zZS5jYWNoZWRBdCA9ICtyZXNwb25zZS5oZWFkZXJzLmdldCgnY2FjaGVkLWF0JykgfHwgMDtcclxuXHRcdFx0XHRpZiAoaW5pdC5tYXhBZ2UgPT0gbnVsbCB8fCBEYXRlLm5vdygpIC0gcmVzcG9uc2UuY2FjaGVkQXQgPCBpbml0Lm1heEFnZSlcclxuXHRcdFx0XHRcdHJldHVybiByZXNwb25zZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwgeyAuLi5kZWZhdWx0cywgLi4uaW5pdCB9KTtcclxuXHRcdFx0aWYgKHJlc3BvbnNlLm9rKSB7XHJcblx0XHRcdFx0cmVzcG9uc2UuY2FjaGVkQXQgPSBEYXRlLm5vdygpO1xyXG5cdFx0XHRcdGxldCBjbG9uZSA9IHJlc3BvbnNlLmNsb25lKCk7XHJcblx0XHRcdFx0bGV0IGluaXQ6IFJlc3BvbnNlSW5pdCA9IHtcclxuXHRcdFx0XHRcdHN0YXR1czogY2xvbmUuc3RhdHVzLCBzdGF0dXNUZXh0OiBjbG9uZS5zdGF0dXNUZXh0LFxyXG5cdFx0XHRcdFx0aGVhZGVyczogW1snY2FjaGVkLWF0JywgYCR7cmVzcG9uc2UuY2FjaGVkQXR9YF0sIC4uLmNsb25lLmhlYWRlcnMuZW50cmllcygpXVxyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0bGV0IHJlc3VsdFJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKGNsb25lLmJvZHksIGluaXQpO1xyXG5cdFx0XHRcdGNhY2hlLnB1dCh1cmwsIHJlc3VsdFJlc3BvbnNlKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gcmVzcG9uc2U7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhY2hlZERvYyh1cmw6IHN0cmluZywgaW5pdDogUmVxdWVzdEluaXRFeCA9IHt9KTogUHJvbWlzZTxEb2N1bWVudD4ge1xyXG5cdFx0XHRsZXQgcmVzcG9uc2UgPSBhd2FpdCBjYWNoZWQodXJsLCBpbml0KTtcclxuXHRcdFx0bGV0IHRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XHJcblx0XHRcdGxldCBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKCk7XHJcblx0XHRcdGxldCBkb2MgPSBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKHRleHQsICd0ZXh0L2h0bWwnKTtcclxuXHRcdFx0bGV0IGJhc2UgPSBkb2MuY3JlYXRlRWxlbWVudCgnYmFzZScpO1xyXG5cdFx0XHRiYXNlLmhyZWYgPSB1cmw7XHJcblx0XHRcdGRvYy5oZWFkLmFwcGVuZChiYXNlKTtcclxuXHRcdFx0ZG9jLmNhY2hlZEF0ID0gcmVzcG9uc2UuY2FjaGVkQXQ7XHJcblx0XHRcdHJldHVybiBkb2M7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhY2hlZEpzb24odXJsOiBzdHJpbmcsIGluaXQ6IFJlcXVlc3RJbml0RXggPSB7fSk6IFByb21pc2U8dW5rbm93bj4ge1xyXG5cdFx0XHRsZXQgcmVzcG9uc2UgPSBhd2FpdCBjYWNoZWQodXJsLCBpbml0KTtcclxuXHRcdFx0bGV0IGpzb24gPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XHJcblx0XHRcdGlmICghKCdjYWNoZWQnIGluIGpzb24pKSB7XHJcblx0XHRcdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKGpzb24sICdjYWNoZWQnLCByZXNwb25zZS5jYWNoZWRBdCk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGpzb247XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRvYyh1cmw6IHN0cmluZyk6IFByb21pc2U8RG9jdW1lbnQ+IHtcclxuXHRcdFx0bGV0IHAgPSBQcm9taXNlRXh0ZW5zaW9uLmVtcHR5KCk7XHJcblx0XHRcdGxldCBvUmVxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcblx0XHRcdG9SZXEub25sb2FkID0gcC5yO1xyXG5cdFx0XHRvUmVxLnJlc3BvbnNlVHlwZSA9ICdkb2N1bWVudCc7XHJcblx0XHRcdG9SZXEub3BlbihcImdldFwiLCB1cmwsIHRydWUpO1xyXG5cdFx0XHRvUmVxLnNlbmQoKTtcclxuXHRcdFx0YXdhaXQgcDtcclxuXHRcdFx0cmV0dXJuIG9SZXEucmVzcG9uc2VYTUw7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGpzb24odXJsOiBzdHJpbmcsIGluaXQ6IFJlcXVlc3RJbml0ID0ge30pOiBQcm9taXNlPHVua25vd24+IHtcclxuXHRcdFx0cmV0dXJuIGZldGNoKHVybCwgeyAuLi5kZWZhdWx0cywgLi4uaW5pdCB9KS50aGVuKGUgPT4gZS5qc29uKCkpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbGVhckNhY2hlKCkge1xyXG5cdFx0XHRjYWNoZSA9IG51bGw7XHJcblx0XHRcdHJldHVybiBjYWNoZXMuZGVsZXRlKCdmZXRjaCcpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiB1bmNhY2hlKHVybDogc3RyaW5nKSB7XHJcblx0XHRcdGxldCBjYWNoZSA9IGF3YWl0IG9wZW5DYWNoZSgpO1xyXG5cdFx0XHRyZXR1cm4gY2FjaGUuZGVsZXRlKHVybCk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIEVudHJ5RmlsdGVyZXJFeHRlbnNpb24ge1xyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogY2FuIGJlIGVpdGhlciBNYXAgb3IgV2Vha01hcFxyXG5cdFx0ICogKFdlYWtNYXAgaXMgbGlrZWx5IHRvIGJlIHVzZWxlc3MgaWYgdGhlcmUgYXJlIGxlc3MgdGhlbiAxMGsgb2xkIG5vZGVzIGluIG1hcClcclxuXHRcdCAqL1xyXG5cdFx0bGV0IE1hcFR5cGUgPSBNYXA7XHJcblx0XHR0eXBlIE1hcFR5cGU8SyBleHRlbmRzIG9iamVjdCwgVj4gPS8vIE1hcDxLLCBWPiB8IFxyXG5cdFx0XHRXZWFrTWFwPEssIFY+O1xyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBFbnRyeUZpbHRlcmVyPERhdGEgZXh0ZW5kcyB7fSA9IHt9PiB7XHJcblx0XHRcdG9uID0gdHJ1ZTtcclxuXHRcdFx0Y29udGFpbmVyOiBIVE1MRWxlbWVudDtcclxuXHRcdFx0ZW50cnlTZWxlY3Rvcjogc2VsZWN0b3IgfCAoKCkgPT4gSFRNTEVsZW1lbnRbXSk7XHJcblx0XHRcdGNvbnN0cnVjdG9yKGVudHJ5U2VsZWN0b3I6IHNlbGVjdG9yIHwgKCgpID0+IEhUTUxFbGVtZW50W10pLCBlbmFibGVkID0gdHJ1ZSkge1xyXG5cdFx0XHRcdHRoaXMuZW50cnlTZWxlY3RvciA9IGVudHJ5U2VsZWN0b3I7XHJcblx0XHRcdFx0dGhpcy5jb250YWluZXIgPSBlbG0oJy5lZi1jb250YWluZXInKTtcclxuXHRcdFx0XHRpZiAoIWVudHJ5U2VsZWN0b3IpIHtcclxuXHRcdFx0XHRcdC8vIGRpc2FibGUgaWYgbm8gc2VsZWN0b3IgcHJvdmlkZWQgKGxpa2VseSBpcyBhIGdlbmVyaWMgZWYpXHJcblx0XHRcdFx0XHR0aGlzLmRpc2FibGUoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKCFlbmFibGVkKSB7XHJcblx0XHRcdFx0XHR0aGlzLmRpc2FibGUoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGVuYWJsZWQpIHtcclxuXHRcdFx0XHRcdHRoaXMuc3R5bGUoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy51cGRhdGUoKTtcclxuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyPFBhZ2luYXRlRXh0ZW5zaW9uLlBNb2RpZnlFdmVudD4oJ3BhZ2luYXRpb25tb2RpZnknLCAoKSA9PiB0aGlzLnJlcXVlc3RVcGRhdGUoKSk7XHJcblx0XHRcdFx0ZXRjLm9uaGVpZ2h0Y2hhbmdlKCgpID0+IHRoaXMucmVxdWVzdFVwZGF0ZSgpKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZW50cmllczogSFRNTEVsZW1lbnRbXSA9IFtdO1xyXG5cdFx0XHRlbnRyeURhdGFzOiBNYXBUeXBlPEhUTUxFbGVtZW50LCBEYXRhPiA9IG5ldyBNYXBUeXBlKCk7XHJcblxyXG5cdFx0XHRnZXREYXRhKGVsOiBIVE1MRWxlbWVudCk6IERhdGE7XHJcblx0XHRcdGdldERhdGEoKTogRGF0YVtdO1xyXG5cdFx0XHRnZXREYXRhKGVsPzogSFRNTEVsZW1lbnQpOiBEYXRhIHwgRGF0YVtdIHtcclxuXHRcdFx0XHRpZiAoIWVsKSByZXR1cm4gdGhpcy5lbnRyaWVzLm1hcChlID0+IHRoaXMuZ2V0RGF0YShlKSk7XHJcblx0XHRcdFx0bGV0IGRhdGEgPSB0aGlzLmVudHJ5RGF0YXMuZ2V0KGVsKTtcclxuXHRcdFx0XHRpZiAoIWRhdGEpIHtcclxuXHRcdFx0XHRcdGRhdGEgPSB0aGlzLnBhcnNlRW50cnkoZWwpO1xyXG5cdFx0XHRcdFx0dGhpcy5lbnRyeURhdGFzLnNldChlbCwgZGF0YSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBkYXRhO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR1cGRhdGVQZW5kaW5nID0gZmFsc2U7XHJcblx0XHRcdHJlcGFyc2VQZW5kaW5nID0gZmFsc2U7XHJcblx0XHRcdHJlcXVlc3RVcGRhdGUocmVwYXJzZSA9IGZhbHNlKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMudXBkYXRlUGVuZGluZykgcmV0dXJuO1xyXG5cdFx0XHRcdHRoaXMudXBkYXRlUGVuZGluZyA9IHRydWU7XHJcblx0XHRcdFx0aWYgKHJlcGFyc2UpIHRoaXMucmVwYXJzZVBlbmRpbmcgPSB0cnVlO1xyXG5cdFx0XHRcdHNldFRpbWVvdXQoKCkgPT4gdGhpcy51cGRhdGUoKSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHBhcnNlcnM6IFBhcnNlckZuPERhdGE+W10gPSBbXTtcclxuXHRcdFx0d3JpdGVEYXRhQXR0cmlidXRlID0gZmFsc2U7XHJcblx0XHRcdGFkZFBhcnNlcihwYXJzZXI6IFBhcnNlckZuPERhdGE+KSB7XHJcblx0XHRcdFx0dGhpcy5wYXJzZXJzLnB1c2gocGFyc2VyKTtcclxuXHRcdFx0XHR0aGlzLnJlcXVlc3RVcGRhdGUodHJ1ZSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cGFyc2VFbnRyeShlbDogSFRNTEVsZW1lbnQpOiBEYXRhIHtcclxuXHRcdFx0XHRlbC5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2VmLWVudHJ5LWNvbnRhaW5lcicpO1xyXG5cdFx0XHRcdGVsLmNsYXNzTGlzdC5hZGQoJ2VmLWVudHJ5Jyk7XHJcblxyXG5cdFx0XHRcdGxldCBkYXRhOiBEYXRhID0ge30gYXMgRGF0YTtcclxuXHRcdFx0XHRmb3IgKGxldCBwYXJzZXIgb2YgdGhpcy5wYXJzZXJzKSB7XHJcblx0XHRcdFx0XHRsZXQgbmV3RGF0YSA9IHBhcnNlcihlbCwgZGF0YSk7XHJcblx0XHRcdFx0XHRpZiAoIW5ld0RhdGEgfHwgbmV3RGF0YSA9PSBkYXRhKSBjb250aW51ZTtcclxuXHRcdFx0XHRcdGlmICghSXNQcm9taXNlKG5ld0RhdGEpKSB7XHJcblx0XHRcdFx0XHRcdE9iamVjdC5hc3NpZ24oZGF0YSwgbmV3RGF0YSk7XHJcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0bmV3RGF0YS50aGVuKHBOZXdEYXRhID0+IHtcclxuXHRcdFx0XHRcdFx0aWYgKHBOZXdEYXRhICYmIHBOZXdEYXRhICE9IGRhdGEpIHtcclxuXHRcdFx0XHRcdFx0XHRPYmplY3QuYXNzaWduKGRhdGEsIHBOZXdEYXRhKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR0aGlzLnJlcXVlc3RVcGRhdGUoKTtcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0aGlzLndyaXRlRGF0YUF0dHJpYnV0ZSkge1xyXG5cdFx0XHRcdFx0ZWwuc2V0QXR0cmlidXRlKCdlZi1kYXRhJywgSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gZGF0YTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0YWRkSXRlbTxJVCwgVCBleHRlbmRzIElULCBJUyBleHRlbmRzIEZpbHRlcmVySXRlbVBhcnRpYWwsIFMsIFRTIGV4dGVuZHMgUyAmIElTICYgRmlsdGVyZXJJdGVtU291cmNlPihjb25zdHJ1Y3RvcjogeyBuZXcoZGF0YTogVFMpOiBUIH0sIGxpc3Q6IElUW10sIGRhdGE6IElTLCBzb3VyY2U6IFMpOiBUIHtcclxuXHRcdFx0XHRPYmplY3QuYXNzaWduKGRhdGEsIHNvdXJjZSwgeyBwYXJlbnQ6IHRoaXMgfSk7XHJcblx0XHRcdFx0ZGF0YS5uYW1lID8/PSBkYXRhLmlkO1xyXG5cdFx0XHRcdGxldCBpdGVtID0gbmV3IGNvbnN0cnVjdG9yKGRhdGEgYXMgVFMpO1xyXG5cdFx0XHRcdGxpc3QucHVzaChpdGVtKTtcclxuXHRcdFx0XHRyZXR1cm4gaXRlbTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZmlsdGVyczogSUZpbHRlcjxEYXRhPltdID0gW107XHJcblx0XHRcdHNvcnRlcnM6IElTb3J0ZXI8RGF0YT5bXSA9IFtdO1xyXG5cdFx0XHRtb2RpZmllcnM6IElNb2RpZmllcjxEYXRhPltdID0gW107XHJcblxyXG5cdFx0XHRhZGRGaWx0ZXIoaWQ6IHN0cmluZywgZmlsdGVyOiBGaWx0ZXJGbjxEYXRhPiwgZGF0YTogRmlsdGVyUGFydGlhbDxEYXRhPiA9IHt9KTogRmlsdGVyPERhdGE+IHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hZGRJdGVtKEZpbHRlciwgdGhpcy5maWx0ZXJzLCBkYXRhLCB7IGlkLCBmaWx0ZXIgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0YWRkVkZpbHRlcjxWIGV4dGVuZHMgbnVtYmVyIHwgc3RyaW5nPihpZDogc3RyaW5nLCBmaWx0ZXI6IFZhbHVlRmlsdGVyRm48RGF0YSwgVj4sIGRhdGE6IFZhbHVlRmlsdGVyUGFydGlhbDxEYXRhLCBWPik6IFZhbHVlRmlsdGVyPERhdGEsIFY+O1xyXG5cdFx0XHRhZGRWRmlsdGVyPFYgZXh0ZW5kcyBudW1iZXIgfCBzdHJpbmc+KGlkOiBzdHJpbmcsIGZpbHRlcjogVmFsdWVGaWx0ZXJGbjxEYXRhLCBWPiwgZGF0YTogVik7XHJcblx0XHRcdGFkZFZGaWx0ZXI8ViBleHRlbmRzIG51bWJlciB8IHN0cmluZz4oaWQ6IHN0cmluZywgZmlsdGVyOiBWYWx1ZUZpbHRlckZuPERhdGEsIFY+LCBkYXRhOiBWYWx1ZUZpbHRlclBhcnRpYWw8RGF0YSwgVj4gfCBWKSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiBkYXRhICE9ICdvYmplY3QnIHx8ICFkYXRhKSB7XHJcblx0XHRcdFx0XHRkYXRhID0geyBpbnB1dDogZGF0YSBhcyBWIH07XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiB0aGlzLmFkZEl0ZW0oVmFsdWVGaWx0ZXIsIHRoaXMuZmlsdGVycywgZGF0YSwgeyBpZCwgZmlsdGVyIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFkZE1GaWx0ZXIoaWQ6IHN0cmluZywgdmFsdWU6IChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpID0+IHN0cmluZywgZGF0YTogTWF0Y2hGaWx0ZXJTb3VyY2U8RGF0YT4pIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hZGRJdGVtKE1hdGNoRmlsdGVyLCB0aGlzLmZpbHRlcnMsIGRhdGEsIHsgaWQsIHZhbHVlIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFkZFRhZ0ZpbHRlcihpZDogc3RyaW5nLCBkYXRhOiBUYWdGaWx0ZXJTb3VyY2U8RGF0YT4pIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hZGRJdGVtKFRhZ0ZpbHRlciwgdGhpcy5maWx0ZXJzLCBkYXRhLCB7IGlkIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFkZFNvcnRlcjxWIGV4dGVuZHMgbnVtYmVyIHwgc3RyaW5nPihpZDogc3RyaW5nLCBzb3J0ZXI6IFNvcnRlckZuPERhdGEsIFY+LCBkYXRhOiBTb3J0ZXJQYXJ0aWFsU291cmNlPERhdGEsIFY+ID0ge30pOiBTb3J0ZXI8RGF0YSwgVj4ge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmFkZEl0ZW0oU29ydGVyLCB0aGlzLnNvcnRlcnMsIGRhdGEsIHsgaWQsIHNvcnRlciB9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRhZGRNb2RpZmllcihpZDogc3RyaW5nLCBtb2RpZmllcjogTW9kaWZpZXJGbjxEYXRhPiwgZGF0YTogTW9kaWZpZXJQYXJ0aWFsPERhdGE+ID0ge30pOiBNb2RpZmllcjxEYXRhPiB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuYWRkSXRlbShNb2RpZmllciwgdGhpcy5tb2RpZmllcnMsIGRhdGEsIHsgaWQsIG1vZGlmaWVyIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFkZFByZWZpeChpZDogc3RyaW5nLCBwcmVmaXg6IFByZWZpeGVyRm48RGF0YT4sIGRhdGE6IFByZWZpeGVyUGFydGlhbDxEYXRhPiA9IHt9KTogUHJlZml4ZXI8RGF0YT4ge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmFkZEl0ZW0oUHJlZml4ZXIsIHRoaXMubW9kaWZpZXJzLCBkYXRhLCB7IGlkLCBwcmVmaXggfSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZpbHRlckVudHJpZXMoKSB7XHJcblx0XHRcdFx0Zm9yIChsZXQgZWwgb2YgdGhpcy5lbnRyaWVzKSB7XHJcblx0XHRcdFx0XHRsZXQgZGF0YSA9IHRoaXMuZ2V0RGF0YShlbCk7XHJcblx0XHRcdFx0XHRsZXQgdmFsdWUgPSB0cnVlO1xyXG5cdFx0XHRcdFx0Zm9yIChsZXQgZmlsdGVyIG9mIHRoaXMuZmlsdGVycykge1xyXG5cdFx0XHRcdFx0XHR2YWx1ZSA9IHZhbHVlICYmIGZpbHRlci5hcHBseShkYXRhLCBlbCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbC5jbGFzc0xpc3QudG9nZ2xlKCdlZi1maWx0ZXJlZC1vdXQnLCAhdmFsdWUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0b3JkZXJlZEVudHJpZXM6IEhUTUxFbGVtZW50W10gPSBbXTtcclxuXHRcdFx0b3JkZXJNb2RlOiAnY3NzJyB8ICdzd2FwJyA9ICdjc3MnO1xyXG5cdFx0XHRzb3J0RW50cmllcygpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5lbnRyaWVzLmxlbmd0aCA8PSAxKSByZXR1cm47XHJcblx0XHRcdFx0aWYgKHRoaXMub3JkZXJlZEVudHJpZXMubGVuZ3RoID09IDApIHRoaXMub3JkZXJlZEVudHJpZXMgPSB0aGlzLmVudHJpZXM7XHJcblx0XHRcdFx0aWYgKHRoaXMuc29ydGVycy5sZW5ndGggPT0gMCkgcmV0dXJuO1xyXG5cclxuXHRcdFx0XHRsZXQgZW50cmllcyA9IHRoaXMuZW50cmllcztcclxuXHRcdFx0XHRsZXQgcGFpcnM6IFtEYXRhLCBIVE1MRWxlbWVudF1bXSA9IGVudHJpZXMubWFwKGUgPT4gW3RoaXMuZ2V0RGF0YShlKSwgZV0pO1xyXG5cdFx0XHRcdGxldCBhbGxPZmYgPSB0cnVlO1xyXG5cdFx0XHRcdGZvciAobGV0IHNvcnRlciBvZiB0aGlzLnNvcnRlcnMpIHtcclxuXHRcdFx0XHRcdGlmIChzb3J0ZXIubW9kZSAhPSAnb2ZmJykge1xyXG5cdFx0XHRcdFx0XHRwYWlycyA9IHNvcnRlci5zb3J0KHBhaXJzKTtcclxuXHRcdFx0XHRcdFx0YWxsT2ZmID0gZmFsc2U7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVudHJpZXMgPSBwYWlycy5tYXAoZSA9PiBlWzFdKTtcclxuXHRcdFx0XHRpZiAodGhpcy5vcmRlck1vZGUgPT0gJ3N3YXAnKSB7XHJcblx0XHRcdFx0XHRpZiAoIWVudHJpZXMuZXZlcnkoKGUsIGkpID0+IGUgPT0gdGhpcy5vcmRlcmVkRW50cmllc1tpXSkpIHtcclxuXHRcdFx0XHRcdFx0bGV0IGJyID0gZWxtKGAke2VudHJpZXNbMF0/LnRhZ05hbWV9LmVmLWJlZm9yZS1zb3J0W2hpZGRlbl1gKTtcclxuXHRcdFx0XHRcdFx0dGhpcy5vcmRlcmVkRW50cmllc1swXS5iZWZvcmUoYnIpO1xyXG5cdFx0XHRcdFx0XHRici5hZnRlciguLi5lbnRyaWVzKTtcclxuXHRcdFx0XHRcdFx0YnIucmVtb3ZlKCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGVudHJpZXMubWFwKChlLCBpKSA9PiB7XHJcblx0XHRcdFx0XHRcdGlmIChhbGxPZmYpIHtcclxuXHRcdFx0XHRcdFx0XHRlLmNsYXNzTGlzdC5yZW1vdmUoJ2VmLXJlb3JkZXInKTtcclxuXHRcdFx0XHRcdFx0XHRlLnBhcmVudEVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnZWYtcmVvcmRlci1jb250YWluZXInKTtcclxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHQvLyB1c2UgYGRpc3BsYXk6ZmxleGAgY29udGFpbmVyIGFuZCBgb3JkZXI6dmFyKC0tZWYtb3JkZXIpYCBmb3IgY2hpbGRyZW4gXHJcblx0XHRcdFx0XHRcdFx0ZS5jbGFzc0xpc3QuYWRkKCdlZi1yZW9yZGVyJyk7XHJcblx0XHRcdFx0XHRcdFx0ZS5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1lZi1vcmRlcicsIGkgKyAnJyk7XHJcblx0XHRcdFx0XHRcdFx0ZS5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2VmLXJlb3JkZXItY29udGFpbmVyJyk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLm9yZGVyZWRFbnRyaWVzID0gZW50cmllcztcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0bW9kaWZ5RW50cmllcygpIHtcclxuXHRcdFx0XHRsZXQgZW50cmllcyA9IHRoaXMuZW50cmllcztcclxuXHRcdFx0XHRsZXQgcGFpcnM6IFtIVE1MRWxlbWVudCwgRGF0YV1bXSA9IGVudHJpZXMubWFwKGUgPT4gW2UsIHRoaXMuZ2V0RGF0YShlKV0pO1xyXG5cdFx0XHRcdGZvciAobGV0IG1vZGlmaWVyIG9mIHRoaXMubW9kaWZpZXJzKSB7XHJcblx0XHRcdFx0XHRmb3IgKGxldCBbZSwgZF0gb2YgcGFpcnMpIHtcclxuXHRcdFx0XHRcdFx0bW9kaWZpZXIuYXBwbHkoZCwgZSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRtb3ZlVG9Ub3AoaXRlbTogSVNvcnRlcjxEYXRhPiB8IElNb2RpZmllcjxEYXRhPikge1xyXG5cdFx0XHRcdGlmICh0aGlzLnNvcnRlcnMuaW5jbHVkZXMoaXRlbSBhcyBJU29ydGVyPERhdGE+KSkge1xyXG5cdFx0XHRcdFx0dGhpcy5zb3J0ZXJzLnNwbGljZSh0aGlzLnNvcnRlcnMuaW5kZXhPZihpdGVtIGFzIElTb3J0ZXI8RGF0YT4pLCAxKTtcclxuXHRcdFx0XHRcdHRoaXMuc29ydGVycy5wdXNoKGl0ZW0gYXMgSVNvcnRlcjxEYXRhPik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGlmaWVycy5pbmNsdWRlcyhpdGVtIGFzIElNb2RpZmllcjxEYXRhPikpIHtcclxuXHRcdFx0XHRcdHRoaXMubW9kaWZpZXJzLnNwbGljZSh0aGlzLm1vZGlmaWVycy5pbmRleE9mKGl0ZW0gYXMgSU1vZGlmaWVyPERhdGE+KSwgMSk7XHJcblx0XHRcdFx0XHR0aGlzLm1vZGlmaWVycy5wdXNoKGl0ZW0gYXMgSU1vZGlmaWVyPERhdGE+KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHVwZGF0ZShyZXBhcnNlID0gdGhpcy5yZXBhcnNlUGVuZGluZykge1xyXG5cdFx0XHRcdHRoaXMudXBkYXRlUGVuZGluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdGlmICh0aGlzLmRpc2FibGVkKSByZXR1cm47XHJcblx0XHRcdFx0aWYgKHJlcGFyc2UpIHtcclxuXHRcdFx0XHRcdHRoaXMuZW50cnlEYXRhcyA9IG5ldyBNYXBUeXBlKCk7XHJcblx0XHRcdFx0XHR0aGlzLnJlcGFyc2VQZW5kaW5nID0gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICghdGhpcy5jb250YWluZXIuY2xvc2VzdCgnYm9keScpKSB7XHJcblx0XHRcdFx0XHR0aGlzLmNvbnRhaW5lci5hcHBlbmRUbygnYm9keScpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRsZXQgZW50cmllcyA9IHR5cGVvZiB0aGlzLmVudHJ5U2VsZWN0b3IgPT0gJ2Z1bmN0aW9uJyA/IHRoaXMuZW50cnlTZWxlY3RvcigpIDogcXEodGhpcy5lbnRyeVNlbGVjdG9yKTtcclxuXHRcdFx0XHRpZiAodGhpcy5lbnRyaWVzLmxlbmd0aCAhPSBlbnRyaWVzLmxlbmd0aCB8fCB0aGlzLmVudHJpZXMpIHtcclxuXHRcdFx0XHRcdC8vIFRPRE86IHNvcnQgZW50cmllcyBpbiBpbml0aWFsIG9yZGVyXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMuZW50cmllcyA9IGVudHJpZXM7XHJcblx0XHRcdFx0dGhpcy5maWx0ZXJFbnRyaWVzKCk7XHJcblx0XHRcdFx0dGhpcy5zb3J0RW50cmllcygpO1xyXG5cdFx0XHRcdHRoaXMubW9kaWZ5RW50cmllcygpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRvZmZJbmNvbXBhdGlibGUoaW5jb21wYXRpYmxlOiBzdHJpbmdbXSkge1xyXG5cdFx0XHRcdGZvciAobGV0IGZpbHRlciBvZiB0aGlzLmZpbHRlcnMpIHtcclxuXHRcdFx0XHRcdGlmIChpbmNvbXBhdGlibGUuaW5jbHVkZXMoZmlsdGVyLmlkKSkge1xyXG5cdFx0XHRcdFx0XHRmaWx0ZXIudG9nZ2xlTW9kZSgnb2ZmJyk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZvciAobGV0IHNvcnRlciBvZiB0aGlzLnNvcnRlcnMpIHtcclxuXHRcdFx0XHRcdGlmIChpbmNvbXBhdGlibGUuaW5jbHVkZXMoc29ydGVyLmlkKSkge1xyXG5cdFx0XHRcdFx0XHRzb3J0ZXIudG9nZ2xlTW9kZSgnb2ZmJyk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZvciAobGV0IG1vZGlmaWVyIG9mIHRoaXMubW9kaWZpZXJzKSB7XHJcblx0XHRcdFx0XHRpZiAoaW5jb21wYXRpYmxlLmluY2x1ZGVzKG1vZGlmaWVyLmlkKSkge1xyXG5cdFx0XHRcdFx0XHRtb2RpZmllci50b2dnbGVNb2RlKCdvZmYnKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHN0eWxlKHMgPSAnJykge1xyXG5cdFx0XHRcdEVudHJ5RmlsdGVyZXIuc3R5bGUocyk7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHRcdH1cclxuXHRcdFx0c3RhdGljIHN0eWxlKHMgPSAnJykge1xyXG5cdFx0XHRcdGxldCBzdHlsZSA9IHEoJ3N0eWxlLmVmLXN0eWxlJykgfHwgZWxtKCdzdHlsZS5lZi1zdHlsZScpLmFwcGVuZFRvKCdoZWFkJyk7XHJcblx0XHRcdFx0c3R5bGUuaW5uZXJIVE1MID0gYFxyXG5cdFx0XHRcdFx0LmVmLWNvbnRhaW5lciB7XHJcblx0XHRcdFx0XHRcdGRpc3BsYXk6IGZsZXg7XHJcblx0XHRcdFx0XHRcdGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XHJcblx0XHRcdFx0XHRcdHBvc2l0aW9uOiBmaXhlZDtcclxuXHRcdFx0XHRcdFx0dG9wOiAwO1xyXG5cdFx0XHRcdFx0XHRyaWdodDogMDtcclxuXHRcdFx0XHRcdFx0ei1pbmRleDogOTk5OTk5OTk5OTk5OTk5OTk5OTtcclxuXHRcdFx0XHRcdFx0bWluLXdpZHRoOiAxMDBweDtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC5lZi1lbnRyeSB7fVxyXG5cclxuXHRcdFx0XHRcdC5lZi1maWx0ZXJlZC1vdXQge1xyXG5cdFx0XHRcdFx0XHRkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0YnV0dG9uLmVmLWl0ZW0ge31cclxuXHRcdFx0XHRcdGJ1dHRvbi5lZi1pdGVtW2VmLW1vZGU9XCJvZmZcIl0ge1xyXG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kOiBsaWdodGdyYXk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRidXR0b24uZWYtaXRlbVtlZi1tb2RlPVwib25cIl0ge1xyXG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kOiBsaWdodGdyZWVuO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0YnV0dG9uLmVmLWl0ZW1bZWYtbW9kZT1cIm9wcG9zaXRlXCJdIHtcclxuXHRcdFx0XHRcdFx0YmFja2dyb3VuZDogeWVsbG93O1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGJ1dHRvbi5lZi1pdGVtLmVmLWZpbHRlciA+IGlucHV0IHtcclxuXHRcdFx0XHRcdFx0ZmxvYXQ6IHJpZ2h0O1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFtlZi1wcmVmaXhdOjpiZWZvcmUge1xyXG5cdFx0XHRcdFx0XHRjb250ZW50OiBhdHRyKGVmLXByZWZpeCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRbZWYtcG9zdGZpeF06OmFmdGVyIHtcclxuXHRcdFx0XHRcdFx0Y29udGVudDogYXR0cihlZi1wb3N0Zml4KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdGAgKyBzO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRkaXNhYmxlZCA9IGZhbHNlO1xyXG5cdFx0XHRkaXNhYmxlKCkge1xyXG5cdFx0XHRcdHRoaXMuZGlzYWJsZWQgPSB0cnVlO1xyXG5cdFx0XHRcdHRoaXMuY29udGFpbmVyLnJlbW92ZSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVuYWJsZSgpIHtcclxuXHRcdFx0XHR0aGlzLmRpc2FibGVkID0gZmFsc2U7XHJcblx0XHRcdFx0dGhpcy51cGRhdGVQZW5kaW5nID0gZmFsc2U7XHJcblx0XHRcdFx0dGhpcy5yZXF1ZXN0VXBkYXRlKCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNsZWFyKCkge1xyXG5cdFx0XHRcdHRoaXMuZW50cnlEYXRhcyA9IG5ldyBNYXAoKTtcclxuXHRcdFx0XHR0aGlzLnBhcnNlcnMuc3BsaWNlKDAsIDk5OSk7XHJcblx0XHRcdFx0dGhpcy5maWx0ZXJzLnNwbGljZSgwLCA5OTkpLm1hcChlID0+IGUucmVtb3ZlKCkpO1xyXG5cdFx0XHRcdHRoaXMuc29ydGVycy5zcGxpY2UoMCwgOTk5KS5tYXAoZSA9PiBlLnJlbW92ZSgpKTtcclxuXHRcdFx0XHR0aGlzLm1vZGlmaWVycy5zcGxpY2UoMCwgOTk5KS5tYXAoZSA9PiBlLnJlbW92ZSgpKTtcclxuXHRcdFx0XHR0aGlzLmVuYWJsZSgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRnZXQgX2RhdGFzKCkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmVudHJpZXNcclxuXHRcdFx0XHRcdC5maWx0ZXIoZSA9PiAhZS5jbGFzc0xpc3QuY29udGFpbnMoJ2VmLWZpbHRlcmVkLW91dCcpKVxyXG5cdFx0XHRcdFx0Lm1hcChlID0+IHRoaXMuZ2V0RGF0YShlKSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gSXNQcm9taXNlPFQ+KHA6IFByb21pc2VMaWtlPFQ+IHwgVCk6IHAgaXMgUHJvbWlzZUxpa2U8VD4ge1xyXG5cdFx0XHRpZiAoIXApIHJldHVybiBmYWxzZTtcclxuXHRcdFx0cmV0dXJuIHR5cGVvZiAocCBhcyBQcm9taXNlTGlrZTxUPikudGhlbiA9PSAnZnVuY3Rpb24nO1xyXG5cdFx0fVxyXG5cdH1cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cdGV4cG9ydCBjbGFzcyBPYnNlcnZlciB7XHJcblx0XHRcclxuXHR9XHJcbn1cclxuXHJcbi8qXHJcblxyXG5mdW5jdGlvbiBvYnNlcnZlQ2xhc3NBZGQoY2xzLCBjYikge1xyXG5cdGxldCBxdWV1ZWQgPSBmYWxzZTtcclxuXHRhc3luYyBmdW5jdGlvbiBydW4oKSB7XHJcblx0XHRpZiAocXVldWVkKSByZXR1cm47XHJcblx0XHRxdWV1ZWQgPSB0cnVlO1xyXG5cdFx0YXdhaXQgUHJvbWlzZS5mcmFtZSgpO1xyXG5cdFx0cXVldWVkID0gZmFsc2U7XHJcblx0XHRjYigpO1xyXG5cdH1cclxuXHRuZXcgTXV0YXRpb25PYnNlcnZlcihsaXN0ID0+IHtcclxuXHRcdGZvciAobGV0IG1yIG9mIGxpc3QpIHtcclxuXHRcdFx0aWYgKG1yLnR5cGUgPT0gJ2F0dHJpYnV0ZXMnICYmIG1yLmF0dHJpYnV0ZU5hbWUgPT0gJ2NsYXNzJykge1xyXG5cdFx0XHRcdGlmIChtci50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKGNscykpIHtcclxuXHRcdFx0XHRcdHJ1bigpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAobXIudHlwZSA9PSAnY2hpbGRMaXN0Jykge1xyXG5cdFx0XHRcdGZvciAobGV0IGNoIG9mIG1yLmFkZGVkTm9kZXMpIHtcclxuXHRcdFx0XHRcdGlmIChjaC5jbGFzc0xpc3Q/LmNvbnRhaW5zKGNscykpIHtcclxuXHRcdFx0XHRcdFx0cnVuKCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSkub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7XHJcblx0XHRjaGlsZExpc3Q6IHRydWUsXHJcblx0XHRhdHRyaWJ1dGVzOiB0cnVlLFxyXG5cdFx0c3VidHJlZTogdHJ1ZSxcclxuXHR9KTtcclxufVxyXG5cclxuKi8iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBQYWdpbmF0ZUV4dGVuc2lvbiB7XHJcblxyXG5cdFx0ZXhwb3J0IHR5cGUgUFJlcXVlc3RFdmVudCA9IEN1c3RvbUV2ZW50PHtcclxuXHRcdFx0cmVhc29uPzogRXZlbnQsXHJcblx0XHRcdGNvdW50OiBudW1iZXIsXHJcblx0XHRcdGNvbnN1bWVkOiBudW1iZXI7XHJcblx0XHRcdF9ldmVudD86ICdwYWdpbmF0aW9ucmVxdWVzdCcsXHJcblx0XHR9PjtcclxuXHRcdGV4cG9ydCB0eXBlIFBTdGFydEV2ZW50ID0gQ3VzdG9tRXZlbnQ8e1xyXG5cdFx0XHRwYWdpbmF0ZTogUGFnaW5hdGUsXHJcblx0XHRcdF9ldmVudD86ICdwYWdpbmF0aW9uc3RhcnQnLFxyXG5cdFx0fT47XHJcblx0XHRleHBvcnQgdHlwZSBQRW5kRXZlbnQgPSBDdXN0b21FdmVudDx7XHJcblx0XHRcdHBhZ2luYXRlOiBQYWdpbmF0ZSxcclxuXHRcdFx0X2V2ZW50PzogJ3BhZ2luYXRpb25lbmQnLFxyXG5cdFx0fT47XHJcblx0XHRleHBvcnQgdHlwZSBQTW9kaWZ5RXZlbnQgPSBDdXN0b21FdmVudDx7XHJcblx0XHRcdHBhZ2luYXRlOiBQYWdpbmF0ZSxcclxuXHRcdFx0YWRkZWQ6IEhUTUxFbGVtZW50W10sXHJcblx0XHRcdHJlbW92ZWQ6IEhUTUxFbGVtZW50W10sXHJcblx0XHRcdHNlbGVjdG9yOiBzZWxlY3RvcixcclxuXHRcdFx0X2V2ZW50PzogJ3BhZ2luYXRpb25tb2RpZnknLFxyXG5cdFx0fT47XHJcblxyXG5cdFx0ZXhwb3J0IGNsYXNzIFBhZ2luYXRlIHtcclxuXHRcdFx0ZG9jOiBEb2N1bWVudDtcclxuXHJcblx0XHRcdGVuYWJsZWQgPSB0cnVlO1xyXG5cdFx0XHRjb25kaXRpb246IHNlbGVjdG9yIHwgKCgpID0+IGJvb2xlYW4pO1xyXG5cdFx0XHRxdWV1ZWQgPSAwO1xyXG5cdFx0XHRydW5uaW5nID0gZmFsc2U7XHJcblx0XHRcdF9pbml0ZWQgPSBmYWxzZTtcclxuXHJcblx0XHRcdHN0YXRpYyBzaGlmdFJlcXVlc3RDb3VudCA9IDEwO1xyXG5cdFx0XHRzdGF0aWMgX2luaXRlZCA9IGZhbHNlO1xyXG5cdFx0XHRzdGF0aWMgcmVtb3ZlRGVmYXVsdFJ1bkJpbmRpbmdzOiAoKSA9PiB2b2lkO1xyXG5cdFx0XHRzdGF0aWMgYWRkRGVmYXVsdFJ1bkJpbmRpbmdzKCkge1xyXG5cdFx0XHRcdFBhZ2luYXRlLnJlbW92ZURlZmF1bHRSdW5CaW5kaW5ncz8uKCk7XHJcblx0XHRcdFx0ZnVuY3Rpb24gb25tb3VzZWRvd24oZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuXHRcdFx0XHRcdGlmIChldmVudC5idXR0b24gIT0gMSkgcmV0dXJuO1xyXG5cdFx0XHRcdFx0bGV0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBFbGVtZW50O1xyXG5cdFx0XHRcdFx0aWYgKHRhcmdldD8uY2xvc2VzdCgnYScpKSByZXR1cm47XHJcblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdFx0bGV0IGNvdW50ID0gZXZlbnQuc2hpZnRLZXkgPyBQYWdpbmF0ZS5zaGlmdFJlcXVlc3RDb3VudCA6IDE7XHJcblx0XHRcdFx0XHRQYWdpbmF0ZS5yZXF1ZXN0UGFnaW5hdGlvbihjb3VudCwgZXZlbnQsIHRhcmdldCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZ1bmN0aW9uIG9ua2V5ZG93bihldmVudDogS2V5Ym9hcmRFdmVudCkge1xyXG5cdFx0XHRcdFx0aWYgKGV2ZW50LmNvZGUgIT0gJ0FsdFJpZ2h0JykgcmV0dXJuO1xyXG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHRcdGxldCBjb3VudCA9IGV2ZW50LnNoaWZ0S2V5ID8gUGFnaW5hdGUuc2hpZnRSZXF1ZXN0Q291bnQgOiAxO1xyXG5cdFx0XHRcdFx0bGV0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBFbGVtZW50O1xyXG5cdFx0XHRcdFx0UGFnaW5hdGUucmVxdWVzdFBhZ2luYXRpb24oY291bnQsIGV2ZW50LCB0YXJnZXQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBvbm1vdXNlZG93bik7XHJcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9ua2V5ZG93bik7XHJcblx0XHRcdFx0UGFnaW5hdGUucmVtb3ZlRGVmYXVsdFJ1bkJpbmRpbmdzID0gKCkgPT4ge1xyXG5cdFx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgb25tb3VzZWRvd24pO1xyXG5cdFx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9ua2V5ZG93bik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdHN0YXRpYyBpbnN0YW5jZXM6IFBhZ2luYXRlW10gPSBbXTtcclxuXHJcblx0XHRcdC8vIGxpc3RlbmVyc1xyXG5cdFx0XHRpbml0KCkge1xyXG5cdFx0XHRcdGlmICghUGFnaW5hdGUucmVtb3ZlRGVmYXVsdFJ1bkJpbmRpbmdzKSB7XHJcblx0XHRcdFx0XHRQYWdpbmF0ZS5hZGREZWZhdWx0UnVuQmluZGluZ3MoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMuX2luaXRlZCkgcmV0dXJuO1xyXG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXI8UFJlcXVlc3RFdmVudD4oJ3BhZ2luYXRpb25yZXF1ZXN0JywgdGhpcy5vblBhZ2luYXRpb25SZXF1ZXN0LmJpbmQodGhpcykpO1xyXG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXI8UEVuZEV2ZW50PigncGFnaW5hdGlvbmVuZCcsIHRoaXMub25QYWdpbmF0aW9uRW5kLmJpbmQodGhpcykpO1xyXG5cdFx0XHRcdFBhZ2luYXRlLmluc3RhbmNlcy5wdXNoKHRoaXMpO1xyXG5cdFx0XHR9XHJcblx0XHRcdG9uUGFnaW5hdGlvblJlcXVlc3QoZXZlbnQ6IFBSZXF1ZXN0RXZlbnQpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5jYW5Db25zdW1lUmVxdWVzdCgpKSB7XHJcblx0XHRcdFx0XHRldmVudC5kZXRhaWwuY29uc3VtZWQrKztcclxuXHRcdFx0XHRcdHRoaXMucXVldWVkICs9IGV2ZW50LmRldGFpbC5jb3VudDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKCF0aGlzLnJ1bm5pbmcgJiYgdGhpcy5xdWV1ZWQpIHtcclxuXHRcdFx0XHRcdHRoaXMuY29uc3VtZVJlcXVlc3QoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH07XHJcblx0XHRcdG9uUGFnaW5hdGlvbkVuZChldmVudDogUEVuZEV2ZW50KSB7XHJcblx0XHRcdFx0aWYgKHRoaXMucXVldWVkICYmIHRoaXMuY2FuQ29uc3VtZVJlcXVlc3QoKSkge1xyXG5cdFx0XHRcdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcclxuXHRcdFx0XHRcdFx0aWYgKCF0aGlzLmNhbkNvbnN1bWVSZXF1ZXN0KCkpIHtcclxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oYHRoaXMgcGFnaW5hdGUgY2FuIG5vdCB3b3JrIGFueW1vcmVgKTtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLnF1ZXVlZCA9IDA7XHJcblx0XHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5jb25zdW1lUmVxdWVzdCgpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0Y2FuQ29uc3VtZVJlcXVlc3QoKSB7XHJcblx0XHRcdFx0aWYgKCF0aGlzLmVuYWJsZWQpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHRpZiAodGhpcy5ydW5uaW5nKSByZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHRpZiAodGhpcy5jb25kaXRpb24pIHtcclxuXHRcdFx0XHRcdGlmICh0eXBlb2YgdGhpcy5jb25kaXRpb24gPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0XHRpZiAoIXRoaXMuY29uZGl0aW9uKCkpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdGlmICghZG9jdW1lbnQucSh0aGlzLmNvbmRpdGlvbikpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH1cclxuXHRcdFx0YXN5bmMgY29uc3VtZVJlcXVlc3QoKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMucnVubmluZykgcmV0dXJuO1xyXG5cdFx0XHRcdHRoaXMucXVldWVkLS07XHJcblx0XHRcdFx0dGhpcy5ydW5uaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHR0aGlzLmVtaXRTdGFydCgpO1xyXG5cdFx0XHRcdGF3YWl0IHRoaXMub25ydW4/LigpO1xyXG5cdFx0XHRcdHRoaXMucnVubmluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdHRoaXMuZW1pdEVuZCgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdG9ucnVuOiAoKSA9PiBQcm9taXNlPHZvaWQ+O1xyXG5cclxuXHJcblx0XHRcdC8vIGVtaXR0ZXJzXHJcblx0XHRcdHN0YXRpYyByZXF1ZXN0UGFnaW5hdGlvbihjb3VudCA9IDEsIHJlYXNvbj86IEV2ZW50LCB0YXJnZXQ6IEVsZW1lbnQgPSBkb2N1bWVudC5ib2R5KSB7XHJcblx0XHRcdFx0bGV0IGRldGFpbDogUFJlcXVlc3RFdmVudFsnZGV0YWlsJ10gPSB7IGNvdW50LCByZWFzb24sIGNvbnN1bWVkOiAwIH07XHJcblx0XHRcdFx0ZnVuY3Rpb24gZmFpbChldmVudDogUFJlcXVlc3RFdmVudCkge1xyXG5cdFx0XHRcdFx0aWYgKGV2ZW50LmRldGFpbC5jb25zdW1lZCA9PSAwKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUud2FybihgUGFnaW5hdGlvbiByZXF1ZXN0IGZhaWxlZDogbm8gbGlzdGVuZXJzYCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRyZW1vdmVFdmVudExpc3RlbmVyKCdwYWdpbmF0aW9ucmVxdWVzdCcsIGZhaWwpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRhZGRFdmVudExpc3RlbmVyKCdwYWdpbmF0aW9ucmVxdWVzdCcsIGZhaWwpO1xyXG5cdFx0XHRcdHRhcmdldC5lbWl0PFBSZXF1ZXN0RXZlbnQ+KCdwYWdpbmF0aW9ucmVxdWVzdCcsIHsgY291bnQsIHJlYXNvbiwgY29uc3VtZWQ6IDAgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZW1pdFN0YXJ0KCkge1xyXG5cdFx0XHRcdGRvY3VtZW50LmJvZHkuZW1pdDxQU3RhcnRFdmVudD4oJ3BhZ2luYXRpb25zdGFydCcsIHsgcGFnaW5hdGU6IHRoaXMgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZW1pdE1vZGlmeShhZGRlZCwgcmVtb3ZlZCwgc2VsZWN0b3IpIHtcclxuXHRcdFx0XHRkb2N1bWVudC5ib2R5LmVtaXQ8UE1vZGlmeUV2ZW50PigncGFnaW5hdGlvbm1vZGlmeScsIHsgcGFnaW5hdGU6IHRoaXMsIGFkZGVkLCByZW1vdmVkLCBzZWxlY3RvciB9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbWl0RW5kKCkge1xyXG5cdFx0XHRcdGRvY3VtZW50LmJvZHkuZW1pdDxQRW5kRXZlbnQ+KCdwYWdpbmF0aW9uZW5kJywgeyBwYWdpbmF0ZTogdGhpcyB9KTtcclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHRcdC8vIGZldGNoaW5nOiBcclxuXHRcdFx0YXN5bmMgZmV0Y2hEb2N1bWVudChsaW5rOiBMaW5rLCBzcGlubmVyID0gdHJ1ZSk6IFByb21pc2U8RG9jdW1lbnQ+IHtcclxuXHRcdFx0XHR0aGlzLmRvYyA9IG51bGw7XHJcblx0XHRcdFx0bGV0IGEgPSBzcGlubmVyICYmIFBhZ2luYXRlLmxpbmtUb0FuY2hvcihsaW5rKTtcclxuXHRcdFx0XHRhPy5jbGFzc0xpc3QuYWRkKCdwYWdpbmF0ZS1zcGluJyk7XHJcblx0XHRcdFx0bGluayA9IFBhZ2luYXRlLmxpbmtUb1VybChsaW5rKTtcclxuXHRcdFx0XHR0aGlzLmRvYyA9IGF3YWl0IGZldGNoLmRvYyhsaW5rKTtcclxuXHRcdFx0XHRhPy5jbGFzc0xpc3QucmVtb3ZlKCdwYWdpbmF0ZS1zcGluJyk7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuZG9jO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFzeW5jIGZldGNoQ2FjaGVkRG9jdW1lbnQobGluazogTGluaywgc3Bpbm5lciA9IHRydWUpOiBQcm9taXNlPERvY3VtZW50PiB7XHJcblx0XHRcdFx0dGhpcy5kb2MgPSBudWxsO1xyXG5cdFx0XHRcdGxldCBhID0gc3Bpbm5lciAmJiBQYWdpbmF0ZS5saW5rVG9BbmNob3IobGluayk7XHJcblx0XHRcdFx0YT8uY2xhc3NMaXN0LmFkZCgncGFnaW5hdGUtc3BpbicpO1xyXG5cdFx0XHRcdGxpbmsgPSBQYWdpbmF0ZS5saW5rVG9VcmwobGluayk7XHJcblx0XHRcdFx0dGhpcy5kb2MgPSBhd2FpdCBmZXRjaC5jYWNoZWQuZG9jKGxpbmspO1xyXG5cdFx0XHRcdGE/LmNsYXNzTGlzdC5yZW1vdmUoJ3BhZ2luYXRlLXNwaW4nKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5kb2M7XHJcblx0XHRcdH1cclxuXHRcdFx0cHJlZmV0Y2goc291cmNlOiBzZWxlY3Rvcikge1xyXG5cdFx0XHRcdGRvY3VtZW50LnFxPCdhJz4oc291cmNlKS5tYXAoZSA9PiB7XHJcblx0XHRcdFx0XHRpZiAoZS5ocmVmKSB7XHJcblx0XHRcdFx0XHRcdGVsbShgbGlua1tyZWw9XCJwcmVmZXRjaFwiXVtocmVmPVwiJHtlLmhyZWZ9XCJdYCkuYXBwZW5kVG8oJ2hlYWQnKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vIFRPRE86IGlmIGUuc3JjXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHQvLyBtb2RpZmljYXRpb246IFxyXG5cdFx0XHRhZnRlcihzb3VyY2U6IHNlbGVjdG9yLCB0YXJnZXQ6IHNlbGVjdG9yID0gc291cmNlKSB7XHJcblx0XHRcdFx0bGV0IGFkZGVkID0gdGhpcy5kb2MucXEoc291cmNlKTtcclxuXHRcdFx0XHRpZiAoIWFkZGVkLmxlbmd0aCkgcmV0dXJuO1xyXG5cdFx0XHRcdGxldCBmb3VuZCA9IGRvY3VtZW50LnFxKHRhcmdldCk7XHJcblx0XHRcdFx0aWYgKGZvdW5kLmxlbmd0aCA9PSAwKSB0aHJvdyBuZXcgRXJyb3IoYGZhaWxlZCB0byBmaW5kIHdoZXJlIHRvIGFwcGVuZGApO1xyXG5cdFx0XHRcdGZvdW5kLnBvcCgpLmFmdGVyKC4uLmFkZGVkKTtcclxuXHRcdFx0XHR0aGlzLmVtaXRNb2RpZnkoYWRkZWQsIFtdLCBzb3VyY2UpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJlcGxhY2VFYWNoKHNvdXJjZTogc2VsZWN0b3IsIHRhcmdldDogc2VsZWN0b3IgPSBzb3VyY2UpIHtcclxuXHRcdFx0XHRsZXQgYWRkZWQgPSB0aGlzLmRvYy5xcShzb3VyY2UpO1xyXG5cdFx0XHRcdGxldCByZW1vdmVkID0gZG9jdW1lbnQucXEodGFyZ2V0KTtcclxuXHRcdFx0XHRpZiAoYWRkZWQubGVuZ3RoICE9IHJlbW92ZWQubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoYGFkZGVkL3JlbW92ZWQgY291bnQgbWlzbWF0Y2hgKTtcclxuXHRcdFx0XHRyZW1vdmVkLm1hcCgoZSwgaSkgPT4gZS5yZXBsYWNlV2l0aChhZGRlZFtpXSkpO1xyXG5cdFx0XHRcdHRoaXMuZW1pdE1vZGlmeShhZGRlZCwgcmVtb3ZlZCwgc291cmNlKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXBsYWNlKHNvdXJjZTogc2VsZWN0b3IsIHRhcmdldDogc2VsZWN0b3IgPSBzb3VyY2UpIHtcclxuXHRcdFx0XHRsZXQgYWRkZWQgPSB0aGlzLmRvYy5xcShzb3VyY2UpO1xyXG5cdFx0XHRcdGxldCByZW1vdmVkID0gZG9jdW1lbnQucXEodGFyZ2V0KTtcclxuXHRcdFx0XHRpZiAoYWRkZWQubGVuZ3RoICE9IHJlbW92ZWQubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoYG5vdCBpbXBsZW1lbnRlZGApO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnJlcGxhY2VFYWNoKHNvdXJjZSwgdGFyZ2V0KTtcclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHRcdC8vIHV0aWxcclxuXHRcdFx0c3RhdGljIGxpbmtUb1VybChsaW5rOiBMaW5rKTogdXJsIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIGxpbmsgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdGlmIChsaW5rLnN0YXJ0c1dpdGgoJ2h0dHAnKSkgcmV0dXJuIGxpbmsgYXMgdXJsO1xyXG5cdFx0XHRcdFx0bGluayA9IGRvY3VtZW50LnE8J2EnPihsaW5rKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIChsaW5rIGFzIEhUTUxBbmNob3JFbGVtZW50KS5ocmVmIGFzIHVybDtcclxuXHRcdFx0fVxyXG5cdFx0XHRzdGF0aWMgbGlua1RvQW5jaG9yKGxpbms6IExpbmspOiBIVE1MQW5jaG9yRWxlbWVudCB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiBsaW5rID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRpZiAobGluay5zdGFydHNXaXRoKCdodHRwJykpIHJldHVybiBudWxsO1xyXG5cdFx0XHRcdFx0cmV0dXJuIGRvY3VtZW50LnE8J2EnPihsaW5rKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIGxpbms7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHN0YXRpYyBzdGF0aWNDYWxsPFQ+KGRhdGE6IHtcclxuXHRcdFx0XHRjb25kaXRpb24/OiBzZWxlY3RvciB8ICgoKSA9PiBib29sZWFuKSxcclxuXHRcdFx0XHRwcmVmZXRjaD86IHNlbGVjdG9yIHwgc2VsZWN0b3JbXSxcclxuXHRcdFx0XHRjbGljaz86IHNlbGVjdG9yIHwgc2VsZWN0b3JbXSxcclxuXHRcdFx0XHRkb2M/OiBzZWxlY3RvciB8IHNlbGVjdG9yW10sXHJcblx0XHRcdFx0YWZ0ZXI/OiBzZWxlY3RvciB8IHNlbGVjdG9yW10sXHJcblx0XHRcdFx0cmVwbGFjZT86IHNlbGVjdG9yIHwgc2VsZWN0b3JbXSxcclxuXHRcdFx0XHRzdGFydD86ICgpID0+IHZvaWQ7XHJcblx0XHRcdFx0ZW5kPzogKCkgPT4gdm9pZDtcclxuXHRcdFx0fSkge1xyXG5cdFx0XHRcdGxldCBwID0gbmV3IFBhZ2luYXRlKCk7XHJcblx0XHRcdFx0cC5zdGF0aWNDYWxsKGRhdGEpO1xyXG5cdFx0XHRcdHJldHVybiBwO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyYXdEYXRhOiBhbnk7XHJcblx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHRjb25kaXRpb246ICgpID0+IGJvb2xlYW47XHJcblx0XHRcdFx0cHJlZmV0Y2g6IGFueVtdO1xyXG5cdFx0XHRcdGRvYzogc2VsZWN0b3JbXTtcclxuXHRcdFx0XHRjbGljazogc2VsZWN0b3JbXTtcclxuXHRcdFx0XHRhZnRlcjogc2VsZWN0b3JbXTtcclxuXHRcdFx0XHRyZXBsYWNlOiBzZWxlY3RvcltdO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHRzdGF0aWNDYWxsKGRhdGE6IHtcclxuXHRcdFx0XHRjb25kaXRpb24/OiBzZWxlY3RvciB8ICgoKSA9PiBib29sZWFuKSxcclxuXHRcdFx0XHRwcmVmZXRjaD86IHNlbGVjdG9yIHwgc2VsZWN0b3JbXSxcclxuXHRcdFx0XHRjbGljaz86IHNlbGVjdG9yIHwgc2VsZWN0b3JbXSxcclxuXHRcdFx0XHRkb2M/OiBzZWxlY3RvciB8IHNlbGVjdG9yW10sXHJcblx0XHRcdFx0YWZ0ZXI/OiBzZWxlY3RvciB8IHNlbGVjdG9yW10sXHJcblx0XHRcdFx0cmVwbGFjZT86IHNlbGVjdG9yIHwgc2VsZWN0b3JbXSxcclxuXHRcdFx0XHRzdGFydD86ICgpID0+IHZvaWQ7XHJcblx0XHRcdFx0ZW5kPzogKCkgPT4gdm9pZDtcclxuXHRcdFx0fSkge1xyXG5cdFx0XHRcdGZ1bmN0aW9uIHRvQXJyYXk8VD4odj86IFQgfCBUW10gfCB1bmRlZmluZWQpOiBUW10ge1xyXG5cdFx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkodikpIHJldHVybiB2O1xyXG5cdFx0XHRcdFx0aWYgKHYgPT0gbnVsbCkgcmV0dXJuIFtdO1xyXG5cdFx0XHRcdFx0cmV0dXJuIFt2XTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZnVuY3Rpb24gdG9Db25kaXRpb24ocz86IHNlbGVjdG9yIHwgKCgpID0+IGJvb2xlYW4pIHwgdW5kZWZpbmVkKTogKCkgPT4gYm9vbGVhbiB7XHJcblx0XHRcdFx0XHRpZiAoIXMpIHJldHVybiAoKSA9PiB0cnVlO1xyXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBzID09ICdzdHJpbmcnKSByZXR1cm4gKCkgPT4gISFkb2N1bWVudC5xKHMpO1xyXG5cdFx0XHRcdFx0cmV0dXJuIHM7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZ1bmN0aW9uIGNhbkZpbmQoYTogc2VsZWN0b3JbXSkge1xyXG5cdFx0XHRcdFx0aWYgKGEubGVuZ3RoID09IDApIHJldHVybiB0cnVlO1xyXG5cdFx0XHRcdFx0cmV0dXJuIGEuc29tZShzID0+ICEhZG9jdW1lbnQucShzKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZ1bmN0aW9uIGZpbmRPbmUoYTogc2VsZWN0b3JbXSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGEuZmluZChzID0+IGRvY3VtZW50LnEocykpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLnJhd0RhdGEgPSBkYXRhO1xyXG5cdFx0XHRcdHRoaXMuZGF0YSA9IHtcclxuXHRcdFx0XHRcdGNvbmRpdGlvbjogdG9Db25kaXRpb24oZGF0YS5jb25kaXRpb24pLFxyXG5cdFx0XHRcdFx0cHJlZmV0Y2g6IHRvQXJyYXk8c2VsZWN0b3I+KGRhdGEucHJlZmV0Y2gpXHJcblx0XHRcdFx0XHRcdC5mbGF0TWFwKGUgPT4gdG9BcnJheShkYXRhW2VdID8/IGUpKSxcclxuXHRcdFx0XHRcdGRvYzogdG9BcnJheTxzZWxlY3Rvcj4oZGF0YS5kb2MpLFxyXG5cdFx0XHRcdFx0Y2xpY2s6IHRvQXJyYXk8c2VsZWN0b3I+KGRhdGEuY2xpY2spLFxyXG5cdFx0XHRcdFx0YWZ0ZXI6IHRvQXJyYXk8c2VsZWN0b3I+KGRhdGEuYWZ0ZXIpLFxyXG5cdFx0XHRcdFx0cmVwbGFjZTogdG9BcnJheTxzZWxlY3Rvcj4oZGF0YS5yZXBsYWNlKSxcclxuXHRcdFx0XHR9O1xyXG5cdFx0XHRcdHRoaXMuY29uZGl0aW9uID0gKCkgPT4ge1xyXG5cdFx0XHRcdFx0aWYgKCF0aGlzLmRhdGEuY29uZGl0aW9uKCkpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHRcdGlmICghY2FuRmluZCh0aGlzLmRhdGEuZG9jKSkgcmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdFx0aWYgKCFjYW5GaW5kKHRoaXMuZGF0YS5jbGljaykpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0dGhpcy5pbml0KCk7XHJcblx0XHRcdFx0aWYgKHRoaXMuZGF0YS5jb25kaXRpb24oKSkge1xyXG5cdFx0XHRcdFx0dGhpcy5kYXRhLnByZWZldGNoLm1hcChzID0+IHRoaXMucHJlZmV0Y2gocykpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLm9ucnVuID0gYXN5bmMgKCkgPT4ge1xyXG5cdFx0XHRcdFx0Ly8gaWYgKCFmaXhlZERhdGEuY29uZGl0aW9uKCkpIHJldHVybjtcclxuXHRcdFx0XHRcdGF3YWl0IGRhdGEuc3RhcnQ/LigpO1xyXG5cdFx0XHRcdFx0dGhpcy5kYXRhLmNsaWNrLm1hcChlID0+IGRvY3VtZW50LnEoZSk/LmNsaWNrKCkpO1xyXG5cdFx0XHRcdFx0bGV0IGRvYyA9IGZpbmRPbmUodGhpcy5kYXRhLmRvYyk7XHJcblx0XHRcdFx0XHRpZiAoZG9jKSBhd2FpdCB0aGlzLmZldGNoRG9jdW1lbnQoZG9jKTtcclxuXHRcdFx0XHRcdHRoaXMuZGF0YS5hZnRlci5tYXAocyA9PiB0aGlzLmFmdGVyKHMpKTtcclxuXHRcdFx0XHRcdHRoaXMuZGF0YS5yZXBsYWNlLm1hcChzID0+IHRoaXMucmVwbGFjZShzKSk7XHJcblx0XHRcdFx0XHRhd2FpdCBkYXRhLmVuZD8uKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdH1cclxuXHRcdHR5cGUgU2VsT3JFbCA9IHNlbGVjdG9yIHwgSFRNTEVsZW1lbnQ7XHJcblx0XHR0eXBlIFNvbWVob3c8VD4gPSBudWxsIHwgVCB8IFRbXSB8ICgoKSA9PiAobnVsbCB8IFQgfCBUW10pKTtcclxuXHRcdHR5cGUgU29tZWhvd0FzeW5jPFQ+ID0gbnVsbCB8IFQgfCBUW10gfCAoKCkgPT4gKG51bGwgfCBUIHwgVFtdIHwgUHJvbWlzZTxudWxsIHwgVCB8IFRbXT4pKTtcclxuXHJcblx0XHRleHBvcnQgY29uc3QgcGFnaW5hdGUgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YoUGFnaW5hdGUuc3RhdGljQ2FsbC5iaW5kKFBhZ2luYXRlKSwgbmV3IFBhZ2luYXRlKCkpO1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGNvbnN0IHBhZ2luYXRlID0gUGFnaW5hdGVFeHRlbnNpb24ucGFnaW5hdGU7XHJcblxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBJbWFnZVNjcm9sbGluZ0V4dGVuc2lvbiB7XHJcblxyXG5cdFx0ZXhwb3J0IGxldCBpbWFnZVNjcm9sbGluZ0FjdGl2ZSA9IGZhbHNlO1xyXG5cdFx0ZXhwb3J0IGxldCBpbWdTZWxlY3RvciA9ICdpbWcnO1xyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBpbWFnZVNjcm9sbGluZyhzZWxlY3Rvcj86IHN0cmluZykge1xyXG5cdFx0XHRpZiAoaW1hZ2VTY3JvbGxpbmdBY3RpdmUpIHJldHVybjtcclxuXHRcdFx0aWYgKHNlbGVjdG9yKSBpbWdTZWxlY3RvciA9IHNlbGVjdG9yO1xyXG5cdFx0XHRpbWFnZVNjcm9sbGluZ0FjdGl2ZSA9IHRydWU7XHJcblx0XHRcdGZ1bmN0aW9uIG9ud2hlZWwoZXZlbnQ6IE1vdXNlRXZlbnQgJiB7IHdoZWVsRGVsdGFZOiBudW1iZXIgfSkge1xyXG5cdFx0XHRcdGlmIChldmVudC5zaGlmdEtleSB8fCBldmVudC5jdHJsS2V5KSByZXR1cm47XHJcblx0XHRcdFx0aWYgKHNjcm9sbFdob2xlSW1hZ2UoLU1hdGguc2lnbihldmVudC53aGVlbERlbHRhWSkpKSB7XHJcblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXdoZWVsJywgb253aGVlbCwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcclxuXHRcdFx0cmV0dXJuIGltYWdlU2Nyb2xsaW5nT2ZmID0gKCkgPT4ge1xyXG5cdFx0XHRcdGltYWdlU2Nyb2xsaW5nQWN0aXZlID0gZmFsc2U7XHJcblx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIG9ud2hlZWwpO1xyXG5cdFx0XHR9O1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGJpbmRBcnJvd3MoKSB7XHJcblx0XHRcdGFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBldmVudCA9PiB7XHJcblx0XHRcdFx0aWYgKGV2ZW50LmNvZGUgPT0gJ0Fycm93TGVmdCcpIHtcclxuXHRcdFx0XHRcdHNjcm9sbFdob2xlSW1hZ2UoLTEpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoZXZlbnQuY29kZSA9PSAnQXJyb3dSaWdodCcpIHtcclxuXHRcdFx0XHRcdHNjcm9sbFdob2xlSW1hZ2UoMSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGxldCBpbWFnZVNjcm9sbGluZ09mZiA9ICgpID0+IHsgfTtcclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gaW1nVG9XaW5kb3dDZW50ZXIoaW1nOiBFbGVtZW50KSB7XHJcblx0XHRcdGxldCByZWN0ID0gaW1nLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG5cdFx0XHRyZXR1cm4gKHJlY3QudG9wICsgcmVjdC5ib3R0b20pIC8gMiAtIGlubmVySGVpZ2h0IC8gMjtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZ2V0QWxsSW1hZ2VJbmZvKCkge1xyXG5cdFx0XHRsZXQgaW1hZ2VzID0gcXEoaW1nU2VsZWN0b3IpIGFzIEhUTUxJbWFnZUVsZW1lbnRbXTtcclxuXHRcdFx0bGV0IGRhdGFzID0gaW1hZ2VzLm1hcCgoaW1nLCBpbmRleCkgPT4ge1xyXG5cdFx0XHRcdGxldCByZWN0ID0gaW1nLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG5cdFx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0XHRpbWcsIHJlY3QsIGluZGV4LFxyXG5cdFx0XHRcdFx0aW5TY3JlZW46IHJlY3QudG9wID49IC0xICYmIHJlY3QuYm90dG9tIDw9IGlubmVySGVpZ2h0LFxyXG5cdFx0XHRcdFx0Y3Jvc3NTY3JlZW46IHJlY3QuYm90dG9tID49IDEgJiYgcmVjdC50b3AgPD0gaW5uZXJIZWlnaHQgLSAxLFxyXG5cdFx0XHRcdFx0eVRvU2NyZWVuQ2VudGVyOiAocmVjdC50b3AgKyByZWN0LmJvdHRvbSkgLyAyIC0gaW5uZXJIZWlnaHQgLyAyLFxyXG5cdFx0XHRcdFx0aXNJbkNlbnRlcjogTWF0aC5hYnMoKHJlY3QudG9wICsgcmVjdC5ib3R0b20pIC8gMiAtIGlubmVySGVpZ2h0IC8gMikgPCAzLFxyXG5cdFx0XHRcdFx0aXNTY3JlZW5IZWlnaHQ6IE1hdGguYWJzKHJlY3QuaGVpZ2h0IC0gaW5uZXJIZWlnaHQpIDwgMyxcclxuXHRcdFx0XHR9O1xyXG5cdFx0XHR9KS5maWx0ZXIoZSA9PiBlLnJlY3Q/LndpZHRoIHx8IGUucmVjdD8ud2lkdGgpO1xyXG5cdFx0XHRyZXR1cm4gZGF0YXM7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGxldCBzY3JvbGxXaG9sZUltYWdlUGVuZGluZyA9IGZhbHNlO1xyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBnZXRDZW50cmFsSW1nKCkge1xyXG5cdFx0XHRyZXR1cm4gZ2V0QWxsSW1hZ2VJbmZvKCkudnNvcnQoZSA9PiBNYXRoLmFicyhlLnlUb1NjcmVlbkNlbnRlcikpWzBdPy5pbWc7XHJcblx0XHR9XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gc2Nyb2xsV2hvbGVJbWFnZShkaXIgPSAxKTogYm9vbGVhbiB7XHJcblx0XHRcdGlmIChzY3JvbGxXaG9sZUltYWdlUGVuZGluZykgcmV0dXJuIHRydWU7XHJcblx0XHRcdC8vIGlmIChkaXIgPT0gMCkgdGhyb3cgbmV3IEVycm9yKCdzY3JvbGxpbmcgaW4gbm8gZGlyZWN0aW9uIScpO1xyXG5cdFx0XHRpZiAoIWRpcikgcmV0dXJuIGZhbHNlO1xyXG5cclxuXHRcdFx0ZGlyID0gTWF0aC5zaWduKGRpcik7XHJcblx0XHRcdGxldCBkYXRhcyA9IGdldEFsbEltYWdlSW5mbygpLnZzb3J0KGUgPT4gZS55VG9TY3JlZW5DZW50ZXIpO1xyXG5cdFx0XHRsZXQgY2VudHJhbCA9IGRhdGFzLnZzb3J0KGUgPT4gTWF0aC5hYnMoZS55VG9TY3JlZW5DZW50ZXIpKVswXTtcclxuXHRcdFx0bGV0IG5leHRDZW50cmFsSW5kZXggPSBkYXRhcy5pbmRleE9mKGNlbnRyYWwpO1xyXG5cdFx0XHR3aGlsZSAoXHJcblx0XHRcdFx0ZGF0YXNbbmV4dENlbnRyYWxJbmRleCArIGRpcl0gJiZcclxuXHRcdFx0XHRNYXRoLmFicyhkYXRhc1tuZXh0Q2VudHJhbEluZGV4ICsgZGlyXS55VG9TY3JlZW5DZW50ZXIgLSBjZW50cmFsLnlUb1NjcmVlbkNlbnRlcikgPCAxMFxyXG5cdFx0XHQpIG5leHRDZW50cmFsSW5kZXggKz0gZGlyO1xyXG5cdFx0XHRjZW50cmFsID0gZGF0YXNbbmV4dENlbnRyYWxJbmRleF07XHJcblx0XHRcdGxldCBuZXh0ID0gZGF0YXNbbmV4dENlbnRyYWxJbmRleCArIGRpcl07XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBzY3JvbGxUb0ltYWdlKGRhdGE6IHR5cGVvZiBjZW50cmFsIHwgdW5kZWZpbmVkKTogYm9vbGVhbiB7XHJcblx0XHRcdFx0aWYgKCFkYXRhKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0aWYgKHNjcm9sbFkgKyBkYXRhLnlUb1NjcmVlbkNlbnRlciA8PSAwICYmIHNjcm9sbFkgPD0gMCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoZGF0YS5pc1NjcmVlbkhlaWdodCkge1xyXG5cdFx0XHRcdFx0ZGF0YS5pbWcuc2Nyb2xsSW50b1ZpZXcoKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0c2Nyb2xsVG8oc2Nyb2xsWCwgc2Nyb2xsWSArIGRhdGEueVRvU2NyZWVuQ2VudGVyKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0c2Nyb2xsV2hvbGVJbWFnZVBlbmRpbmcgPSB0cnVlO1xyXG5cdFx0XHRcdFByb21pc2UucmFmKDIpLnRoZW4oKCkgPT4gc2Nyb2xsV2hvbGVJbWFnZVBlbmRpbmcgPSBmYWxzZSk7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIGlmIG5vIGltYWdlcywgZG9uJ3Qgc2Nyb2xsO1xyXG5cdFx0XHRpZiAoIWNlbnRyYWwpIHJldHVybiBmYWxzZTtcclxuXHJcblx0XHRcdC8vIGlmIGN1cnJlbnQgaW1hZ2UgaXMgb3V0c2lkZSB2aWV3LCBkb24ndCBzY3JvbGxcclxuXHRcdFx0aWYgKCFjZW50cmFsLmNyb3NzU2NyZWVuKSByZXR1cm4gZmFsc2U7XHJcblxyXG5cdFx0XHQvLyBpZiBjdXJyZW50IGltYWdlIGlzIGluIGNlbnRlciwgc2Nyb2xsIHRvIHRoZSBuZXh0IG9uZVxyXG5cdFx0XHRpZiAoY2VudHJhbC5pc0luQ2VudGVyKSB7XHJcblx0XHRcdFx0cmV0dXJuIHNjcm9sbFRvSW1hZ2UobmV4dCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIGlmIHRvIHNjcm9sbCB0byBjdXJyZW50IGltYWdlIHlvdSBoYXZlIHRvIHNjcm9sbCBpbiBvcHBvc2lkZSBkaXJlY3Rpb24sIHNjcm9sbCB0byBuZXh0IG9uZVxyXG5cdFx0XHRpZiAoTWF0aC5zaWduKGNlbnRyYWwueVRvU2NyZWVuQ2VudGVyKSAhPSBkaXIpIHtcclxuXHRcdFx0XHRyZXR1cm4gc2Nyb2xsVG9JbWFnZShuZXh0KTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gaWYgY3VycmVudCBpbWFnZSBpcyBmaXJzdC9sYXN0LCBkb24ndCBzY3JvbGwgb3ZlciAyNXZoIHRvIGl0XHJcblx0XHRcdGlmIChkaXIgPT0gMSAmJiBjZW50cmFsLmluZGV4ID09IDAgJiYgY2VudHJhbC55VG9TY3JlZW5DZW50ZXIgPiBpbm5lckhlaWdodCAvIDIpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGRpciA9PSAtMSAmJiBjZW50cmFsLmluZGV4ID09IGRhdGFzLmxlbmd0aCAtIDEgJiYgY2VudHJhbC55VG9TY3JlZW5DZW50ZXIgPCAtaW5uZXJIZWlnaHQgLyAyKSB7XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gc2Nyb2xsVG9JbWFnZShjZW50cmFsKTtcclxuXHRcdH1cclxuXHR9XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9BcnJheS50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL0RhdGVOb3dIYWNrLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZWxlbWVudC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2VsbS50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL0ZpbHRlcmVyL0VudGl0eUZpbHRlcmVyLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZXRjLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZmV0Y2gudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9PYmplY3QudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9vYnNlcnZlci50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL1BhZ2luYXRlL1BhZ2luYXRpb24udHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9QYWdpbmF0ZS9JbWFnZVNjcm9sbGluZy50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL1Byb21pc2UudHNcIiAvPlxyXG5cclxuXHJcblxyXG5cclxuXHJcbm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gX19pbml0X18od2luZG93OiBXaW5kb3cpOiBcImluaXRlZFwiIHwgXCJhbHJlYWR5IGluaXRlZFwiIHtcclxuXHRcdGlmICghd2luZG93KSB3aW5kb3cgPSBnbG9iYWxUaGlzLndpbmRvdyBhcyBXaW5kb3c7XHJcblxyXG5cdFx0d2luZG93LmVsbSA9IEVsbS5lbG07XHJcblx0XHR3aW5kb3cucSA9IE9iamVjdC5hc3NpZ24oUXVlcnlTZWxlY3Rvci5XaW5kb3dRLnEsIHsgb3JFbG06IFBvb3BKcy5FbG0ucU9yRWxtIH0pO1xyXG5cdFx0d2luZG93LnFxID0gUXVlcnlTZWxlY3Rvci5XaW5kb3dRLnFxO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKEVsZW1lbnQucHJvdG90eXBlLCAncScsIFF1ZXJ5U2VsZWN0b3IuRWxlbWVudFEucSk7XHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoRWxlbWVudC5wcm90b3R5cGUsICdxcScsIFF1ZXJ5U2VsZWN0b3IuRWxlbWVudFEucXEpO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKEVsZW1lbnQucHJvdG90eXBlLCAnYXBwZW5kVG8nLCBFbGVtZW50RXh0ZW5zaW9uLmFwcGVuZFRvKTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShFbGVtZW50LnByb3RvdHlwZSwgJ2VtaXQnLCBFbGVtZW50RXh0ZW5zaW9uLmVtaXQpO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKERvY3VtZW50LnByb3RvdHlwZSwgJ3EnLCBRdWVyeVNlbGVjdG9yLkRvY3VtZW50US5xKTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShEb2N1bWVudC5wcm90b3R5cGUsICdxcScsIFF1ZXJ5U2VsZWN0b3IuRG9jdW1lbnRRLnFxKTtcclxuXHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoUHJvbWlzZSwgJ2VtcHR5JywgUHJvbWlzZUV4dGVuc2lvbi5lbXB0eSk7XHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoUHJvbWlzZSwgJ2ZyYW1lJywgUHJvbWlzZUV4dGVuc2lvbi5mcmFtZSk7XHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoUHJvbWlzZSwgJ3JhZicsIFByb21pc2VFeHRlbnNpb24uZnJhbWUpO1xyXG5cclxuXHRcdHdpbmRvdy5mZXRjaC5jYWNoZWQgPSBGZXRjaEV4dGVuc2lvbi5jYWNoZWQgYXMgYW55O1xyXG5cdFx0d2luZG93LmZldGNoLmRvYyA9IEZldGNoRXh0ZW5zaW9uLmRvYyBhcyBhbnk7XHJcblx0XHR3aW5kb3cuZmV0Y2guanNvbiA9IEZldGNoRXh0ZW5zaW9uLmpzb24gYXMgYW55O1xyXG5cdFx0d2luZG93LmZldGNoLmNhY2hlZC5kb2MgPSBGZXRjaEV4dGVuc2lvbi5jYWNoZWREb2M7XHJcblx0XHR3aW5kb3cuZmV0Y2guZG9jLmNhY2hlZCA9IEZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYztcclxuXHRcdHdpbmRvdy5mZXRjaC5jYWNoZWREb2MgPSBGZXRjaEV4dGVuc2lvbi5jYWNoZWREb2M7XHJcblx0XHR3aW5kb3cuZmV0Y2guanNvbi5jYWNoZWQgPSBGZXRjaEV4dGVuc2lvbi5jYWNoZWRKc29uO1xyXG5cdFx0d2luZG93LmZldGNoLmNhY2hlZC5qc29uID0gRmV0Y2hFeHRlbnNpb24uY2FjaGVkSnNvbjtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShSZXNwb25zZS5wcm90b3R5cGUsICdjYWNoZWRBdCcsIDApO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKERvY3VtZW50LnByb3RvdHlwZSwgJ2NhY2hlZEF0JywgMCk7XHJcblxyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKE9iamVjdCwgJ2RlZmluZVZhbHVlJywgT2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShPYmplY3QsICdkZWZpbmVHZXR0ZXInLCBPYmplY3RFeHRlbnNpb24uZGVmaW5lR2V0dGVyKTtcclxuXHRcdC8vIE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShPYmplY3QsICdtYXAnLCBPYmplY3RFeHRlbnNpb24ubWFwKTtcclxuXHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoQXJyYXksICdtYXAnLCBBcnJheUV4dGVuc2lvbi5tYXApO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKEFycmF5LnByb3RvdHlwZSwgJ3BtYXAnLCBBcnJheUV4dGVuc2lvbi5wbWFwKTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShBcnJheS5wcm90b3R5cGUsICd2c29ydCcsIEFycmF5RXh0ZW5zaW9uLnZzb3J0KTtcclxuXHJcblx0XHR3aW5kb3cucGFnaW5hdGUgPSBQb29wSnMucGFnaW5hdGUgYXMgYW55O1xyXG5cdFx0d2luZG93LmltYWdlU2Nyb2xsaW5nID0gUG9vcEpzLkltYWdlU2Nyb2xsaW5nRXh0ZW5zaW9uO1xyXG5cclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZSh3aW5kb3csICdfX2luaXRfXycsICdhbHJlYWR5IGluaXRlZCcpO1xyXG5cdFx0cmV0dXJuICdpbml0ZWQnO1xyXG5cdH1cclxuXHJcblx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZUdldHRlcih3aW5kb3csICdfX2luaXRfXycsICgpID0+IF9faW5pdF9fKHdpbmRvdykpO1xyXG5cclxuXHRpZiAod2luZG93LmxvY2FsU3RvcmFnZS5fX2luaXRfXykge1xyXG5cdFx0d2luZG93Ll9faW5pdF9fO1xyXG5cdH1cclxuXHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHRleHBvcnQgdHlwZSBWYWx1ZU9mPFQ+ID0gVFtrZXlvZiBUXTtcclxuXHRleHBvcnQgdHlwZSBNYXBwZWRPYmplY3Q8VCwgVj4gPSB7IFtQIGluIGtleW9mIFRdOiBWIH07XHJcblxyXG5cdGV4cG9ydCB0eXBlIHNlbGVjdG9yID0gc3RyaW5nIHwgKHN0cmluZyAmIHsgXzogJ3NlbGVjdG9yJyB9KVxyXG5cdGV4cG9ydCB0eXBlIHVybCA9IGBodHRwJHtzdHJpbmd9YCAmIHsgXzogJ3VybCcgfTtcclxuXHRleHBvcnQgdHlwZSBMaW5rID0gSFRNTEFuY2hvckVsZW1lbnQgfCBzZWxlY3RvciB8IHVybDtcclxufVxyXG5cclxuXHJcbmRlY2xhcmUgY29uc3QgX19pbml0X186IFwiaW5pdGVkXCIgfCBcImFscmVhZHkgaW5pdGVkXCI7XHJcbmRlY2xhcmUgY29uc3QgZWxtOiB0eXBlb2YgUG9vcEpzLkVsbS5lbG07XHJcbmRlY2xhcmUgY29uc3QgcTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLldpbmRvd1EucSAmIHsgb3JFbG06IHR5cGVvZiBQb29wSnMuRWxtLnFPckVsbSB9OztcclxuZGVjbGFyZSBjb25zdCBxcTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLldpbmRvd1EucXE7XHJcbmRlY2xhcmUgY29uc3QgcGFnaW5hdGU6IHR5cGVvZiBQb29wSnMucGFnaW5hdGU7XHJcbmRlY2xhcmUgY29uc3QgaW1hZ2VTY3JvbGxpbmc6IHR5cGVvZiBQb29wSnMuSW1hZ2VTY3JvbGxpbmdFeHRlbnNpb247XHJcbmRlY2xhcmUgbmFtZXNwYWNlIGZldGNoIHtcclxuXHRleHBvcnQgY29uc3QgY2FjaGVkOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZCAmIHsgZG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYywganNvbjogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5jYWNoZWRKc29uIH07XHJcblx0ZXhwb3J0IGNvbnN0IGRvYzogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5kb2MgJiB7IGNhY2hlZDogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5jYWNoZWREb2MgfTtcclxuXHRleHBvcnQgY29uc3QgY2FjaGVkRG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYztcclxuXHRleHBvcnQgY29uc3QganNvbjogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5qc29uICYgeyBjYWNoZWQ6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkSnNvbiB9O1xyXG59XHJcblxyXG5pbnRlcmZhY2UgV2luZG93IHtcclxuXHRyZWFkb25seSBfX2luaXRfXzogXCJpbml0ZWRcIiB8IFwiYWxyZWFkeSBpbml0ZWRcIjtcclxuXHRlbG06IHR5cGVvZiBQb29wSnMuRWxtLmVsbTtcclxuXHRxOiB0eXBlb2YgUG9vcEpzLlF1ZXJ5U2VsZWN0b3IuV2luZG93US5xICYgeyBvckVsbTogdHlwZW9mIFBvb3BKcy5FbG0ucU9yRWxtIH07XHJcblx0cXE6IHR5cGVvZiBQb29wSnMuUXVlcnlTZWxlY3Rvci5XaW5kb3dRLnFxO1xyXG5cdHBhZ2luYXRlOiB0eXBlb2YgUG9vcEpzLnBhZ2luYXRlO1xyXG5cdGltYWdlU2Nyb2xsaW5nOiB0eXBlb2YgUG9vcEpzLkltYWdlU2Nyb2xsaW5nRXh0ZW5zaW9uO1xyXG5cdGZldGNoOiB7XHJcblx0XHQoaW5wdXQ6IFJlcXVlc3RJbmZvLCBpbml0PzogUmVxdWVzdEluaXQpOiBQcm9taXNlPFJlc3BvbnNlPjtcclxuXHRcdGNhY2hlZDogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5jYWNoZWQgJiB7IGRvYzogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5jYWNoZWREb2MsIGpzb246IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkSnNvbiB9O1xyXG5cdFx0ZG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmRvYyAmIHsgY2FjaGVkOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYyB9O1xyXG5cdFx0Y2FjaGVkRG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYztcclxuXHRcdGpzb246IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uanNvbiAmIHsgY2FjaGVkOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZEpzb24gfTtcclxuXHR9XHJcbn1cclxuXHJcbmludGVyZmFjZSBFbGVtZW50IHtcclxuXHRxOiB0eXBlb2YgUG9vcEpzLlF1ZXJ5U2VsZWN0b3IuRWxlbWVudFEucTtcclxuXHRxcTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLkVsZW1lbnRRLnFxO1xyXG5cdGFwcGVuZFRvOiB0eXBlb2YgUG9vcEpzLkVsZW1lbnRFeHRlbnNpb24uYXBwZW5kVG87XHJcblx0ZW1pdDogdHlwZW9mIFBvb3BKcy5FbGVtZW50RXh0ZW5zaW9uLmVtaXQ7XHJcblx0YWRkRXZlbnRMaXN0ZW5lcjxUIGV4dGVuZHMgQ3VzdG9tRXZlbnQ8eyBfZXZlbnQ/OiBzdHJpbmcgfT4+KHR5cGU6IFRbJ2RldGFpbCddWydfZXZlbnQnXSwgbGlzdGVuZXI6ICh0aGlzOiBEb2N1bWVudCwgZXY6IFQpID0+IGFueSwgb3B0aW9ucz86IGJvb2xlYW4gfCBBZGRFdmVudExpc3RlbmVyT3B0aW9ucyk6IHZvaWQ7XHJcbn1cclxuaW50ZXJmYWNlIERvY3VtZW50IHtcclxuXHRxOiB0eXBlb2YgUG9vcEpzLlF1ZXJ5U2VsZWN0b3IuRG9jdW1lbnRRLnE7XHJcblx0cXE6IHR5cGVvZiBQb29wSnMuUXVlcnlTZWxlY3Rvci5Eb2N1bWVudFEucXE7XHJcblx0Y2FjaGVkQXQ6IG51bWJlcjtcclxuXHRhZGRFdmVudExpc3RlbmVyPFQgZXh0ZW5kcyBDdXN0b21FdmVudDx7IF9ldmVudD86IHN0cmluZyB9Pj4odHlwZTogVFsnZGV0YWlsJ11bJ19ldmVudCddLCBsaXN0ZW5lcjogKHRoaXM6IERvY3VtZW50LCBldjogVCkgPT4gYW55LCBvcHRpb25zPzogYm9vbGVhbiB8IEFkZEV2ZW50TGlzdGVuZXJPcHRpb25zKTogdm9pZDtcclxufVxyXG5cclxuaW50ZXJmYWNlIE9iamVjdENvbnN0cnVjdG9yIHtcclxuXHRkZWZpbmVWYWx1ZTogdHlwZW9mIFBvb3BKcy5PYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWU7XHJcblx0ZGVmaW5lR2V0dGVyOiB0eXBlb2YgUG9vcEpzLk9iamVjdEV4dGVuc2lvbi5kZWZpbmVHZXR0ZXI7XHJcblx0Ly8gbWFwOiB0eXBlb2YgUG9vcEpzLk9iamVjdEV4dGVuc2lvbi5tYXA7XHJcblx0c2V0UHJvdG90eXBlT2Y8VCwgUD4obzogVCwgcHJvdG86IFApOiBUICYgUDtcclxufVxyXG5pbnRlcmZhY2UgUHJvbWlzZUNvbnN0cnVjdG9yIHtcclxuXHRlbXB0eTogdHlwZW9mIFBvb3BKcy5Qcm9taXNlRXh0ZW5zaW9uLmVtcHR5O1xyXG5cdGZyYW1lOiB0eXBlb2YgUG9vcEpzLlByb21pc2VFeHRlbnNpb24uZnJhbWU7XHJcblx0cmFmOiB0eXBlb2YgUG9vcEpzLlByb21pc2VFeHRlbnNpb24uZnJhbWU7XHJcbn1cclxuXHJcbmludGVyZmFjZSBBcnJheTxUPiB7XHJcblx0dnNvcnQ6IHR5cGVvZiBQb29wSnMuQXJyYXlFeHRlbnNpb24udnNvcnQ7XHJcblx0cG1hcDogdHlwZW9mIFBvb3BKcy5BcnJheUV4dGVuc2lvbi5wbWFwO1xyXG59XHJcbmludGVyZmFjZSBBcnJheUNvbnN0cnVjdG9yIHtcclxuXHRtYXA6IHR5cGVvZiBQb29wSnMuQXJyYXlFeHRlbnNpb24ubWFwO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgRGF0ZUNvbnN0cnVjdG9yIHtcclxuXHRfbm93KCk6IG51bWJlcjtcclxufVxyXG5pbnRlcmZhY2UgRGF0ZSB7XHJcblx0X2dldFRpbWUoKTogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgUmVzcG9uc2Uge1xyXG5cdGNhY2hlZEF0OiBudW1iZXI7XHJcbn1cclxuXHJcbi8vIGludGVyZmFjZSBDdXN0b21FdmVudDxUPiB7XHJcbi8vIFx0ZGV0YWlsPzogVDtcclxuLy8gfVxyXG5cclxuaW50ZXJmYWNlIEZ1bmN0aW9uIHtcclxuXHRiaW5kPFQsIFIsIEFSR1MgZXh0ZW5kcyBhbnlbXT4odGhpczogKHRoaXM6IFQsIC4uLmFyZ3M6IEFSR1MpID0+IFIsIHRoaXNBcmc6IFQpOiAoKC4uLmFyZ3M6IEFSR1MpID0+IFIpXHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHRleHBvcnQgbmFtZXNwYWNlIEVudHJ5RmlsdGVyZXJFeHRlbnNpb24ge1xyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBGaWx0ZXJlckl0ZW08RGF0YT4ge1xyXG5cdFx0XHRpZDogc3RyaW5nID0gXCJcIjtcclxuXHRcdFx0bmFtZT86IHN0cmluZztcclxuXHRcdFx0ZGVzY3JpcHRpb24/OiBzdHJpbmc7XHJcblx0XHRcdHRocmVlV2F5OiBXYXluZXNzID0gZmFsc2U7XHJcblx0XHRcdG1vZGU6IE1vZGUgPSAnb2ZmJztcclxuXHRcdFx0cGFyZW50OiBFbnRyeUZpbHRlcmVyO1xyXG5cdFx0XHRidXR0b246IEhUTUxCdXR0b25FbGVtZW50O1xyXG5cdFx0XHRpbmNvbXBhdGlibGU/OiBzdHJpbmdbXTtcclxuXHRcdFx0aGlkZGVuID0gZmFsc2U7XHJcblxyXG5cdFx0XHRjb25zdHJ1Y3RvcihkYXRhOiBGaWx0ZXJlckl0ZW1Tb3VyY2UpIHtcclxuXHRcdFx0XHRkYXRhLmJ1dHRvbiA/Pz0gJ2J1dHRvbi5lZi1pdGVtJztcclxuXHRcdFx0XHRPYmplY3QuYXNzaWduKHRoaXMsIGRhdGEpO1xyXG5cclxuXHRcdFx0XHR0aGlzLmJ1dHRvbiA9IGVsbShkYXRhLmJ1dHRvbixcclxuXHRcdFx0XHRcdGNsaWNrID0+IHRoaXMuY2xpY2soY2xpY2spLFxyXG5cdFx0XHRcdFx0Y29udGV4dG1lbnUgPT4gdGhpcy5jb250ZXh0bWVudShjb250ZXh0bWVudSksXHJcblx0XHRcdFx0KTtcclxuXHRcdFx0XHR0aGlzLnBhcmVudC5jb250YWluZXIuYXBwZW5kKHRoaXMuYnV0dG9uKTtcclxuXHRcdFx0XHRpZiAodGhpcy5uYW1lKSB7XHJcblx0XHRcdFx0XHR0aGlzLmJ1dHRvbi5hcHBlbmQodGhpcy5uYW1lKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMuZGVzY3JpcHRpb24pIHtcclxuXHRcdFx0XHRcdHRoaXMuYnV0dG9uLnRpdGxlID0gdGhpcy5kZXNjcmlwdGlvbjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSAhPSAnb2ZmJykge1xyXG5cdFx0XHRcdFx0dGhpcy50b2dnbGVNb2RlKGRhdGEubW9kZSwgdHJ1ZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0aGlzLmhpZGRlbikge1xyXG5cdFx0XHRcdFx0dGhpcy5oaWRlKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjbGljayhldmVudDogTW91c2VFdmVudCkge1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29mZicpIHtcclxuXHRcdFx0XHRcdHRoaXMudG9nZ2xlTW9kZSgnb24nKTtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGV2ZW50LnRhcmdldCAhPSB0aGlzLmJ1dHRvbikgcmV0dXJuO1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29uJykge1xyXG5cdFx0XHRcdFx0dGhpcy50b2dnbGVNb2RlKHRoaXMudGhyZWVXYXkgPyAnb3Bwb3NpdGUnIDogJ29mZicpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR0aGlzLnRvZ2dsZU1vZGUoJ29mZicpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjb250ZXh0bWVudShldmVudDogTW91c2VFdmVudCkge1xyXG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSAhPSAnb3Bwb3NpdGUnKSB7XHJcblx0XHRcdFx0XHR0aGlzLnRvZ2dsZU1vZGUoJ29wcG9zaXRlJyk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHRoaXMudG9nZ2xlTW9kZSgnb2ZmJyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0b2dnbGVNb2RlKG1vZGU6IE1vZGUsIGZvcmNlID0gZmFsc2UpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09IG1vZGUgJiYgIWZvcmNlKSByZXR1cm47XHJcblx0XHRcdFx0dGhpcy5tb2RlID0gbW9kZTtcclxuXHRcdFx0XHR0aGlzLmJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2VmLW1vZGUnLCBtb2RlKTtcclxuXHRcdFx0XHRpZiAobW9kZSAhPSAnb2ZmJyAmJiB0aGlzLmluY29tcGF0aWJsZSkge1xyXG5cdFx0XHRcdFx0dGhpcy5wYXJlbnQub2ZmSW5jb21wYXRpYmxlKHRoaXMuaW5jb21wYXRpYmxlKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5wYXJlbnQucmVxdWVzdFVwZGF0ZSgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZW1vdmUoKSB7XHJcblx0XHRcdFx0dGhpcy5idXR0b24ucmVtb3ZlKCk7XHJcblx0XHRcdFx0dGhpcy50b2dnbGVNb2RlKCdvZmYnKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0c2hvdygpIHtcclxuXHRcdFx0XHR0aGlzLmhpZGRlbiA9IGZhbHNlO1xyXG5cdFx0XHRcdHRoaXMuYnV0dG9uLmhpZGRlbiA9IGZhbHNlO1xyXG5cdFx0XHR9XHJcblx0XHRcdGhpZGUoKSB7XHJcblx0XHRcdFx0dGhpcy5oaWRkZW4gPSB0cnVlO1xyXG5cdFx0XHRcdHRoaXMuYnV0dG9uLmhpZGRlbiA9IHRydWU7XHJcblx0XHRcdH1cclxuXHJcblx0XHR9XHJcblxyXG5cdH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL0ZpbHRlcmVySXRlbS50c1wiIC8+XHJcblxyXG5uYW1lc3BhY2UgUG9vcEpzIHtcclxuXHRleHBvcnQgbmFtZXNwYWNlIEVudHJ5RmlsdGVyZXJFeHRlbnNpb24ge1xyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBGaWx0ZXI8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4gaW1wbGVtZW50cyBJRmlsdGVyPERhdGE+IHtcclxuXHRcdFx0ZGVjbGFyZSBmaWx0ZXI6IEZpbHRlckZuPERhdGE+O1xyXG5cclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogRmlsdGVyU291cmNlPERhdGE+KSB7XHJcblx0XHRcdFx0ZGF0YS5idXR0b24gPz89ICdidXR0b24uZWYtaXRlbS5lZi1maWx0ZXJbZWYtbW9kZT1cIm9mZlwiXSc7XHJcblx0XHRcdFx0c3VwZXIoZGF0YSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKiByZXR1cm5zIGlmIGl0ZW0gc2hvdWxkIGJlIHZpc2libGUgKi9cclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb2ZmJykgcmV0dXJuIHRydWU7XHJcblx0XHRcdFx0bGV0IHZhbHVlID0gdGhpcy5maWx0ZXIoZGF0YSwgZWwsIHRoaXMubW9kZSk7XHJcblx0XHRcdFx0bGV0IHJlc3VsdCA9IHR5cGVvZiB2YWx1ZSA9PSBcIm51bWJlclwiID8gdmFsdWUgPiAwIDogdmFsdWU7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb24nKSByZXR1cm4gcmVzdWx0O1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29wcG9zaXRlJykgcmV0dXJuICFyZXN1bHQ7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgY2xhc3MgVmFsdWVGaWx0ZXI8RGF0YSwgViBleHRlbmRzIHN0cmluZyB8IG51bWJlcj4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4gaW1wbGVtZW50cyBJRmlsdGVyPERhdGE+IHtcclxuXHRcdFx0ZGVjbGFyZSBmaWx0ZXI6IFZhbHVlRmlsdGVyRm48RGF0YSwgVj47XHJcblx0XHRcdGlucHV0OiBIVE1MSW5wdXRFbGVtZW50O1xyXG5cdFx0XHRsYXN0VmFsdWU6IFY7XHJcblxyXG5cdFx0XHRjb25zdHJ1Y3RvcihkYXRhOiBWYWx1ZUZpbHRlclNvdXJjZTxEYXRhLCBWPikge1xyXG5cdFx0XHRcdGRhdGEuYnV0dG9uID8/PSAnYnV0dG9uLmVmLWl0ZW0uZWYtZmlsdGVyW2VmLW1vZGU9XCJvZmZcIl0nO1xyXG5cdFx0XHRcdHN1cGVyKGRhdGEpO1xyXG5cdFx0XHRcdGxldCB0eXBlID0gdHlwZW9mIGRhdGEuaW5wdXQgPT0gJ251bWJlcicgPyAnbnVtYmVyJyA6ICd0ZXh0JztcclxuXHRcdFx0XHRsZXQgdmFsdWUgPSBKU09OLnN0cmluZ2lmeShkYXRhLmlucHV0KTtcclxuXHRcdFx0XHRsZXQgaW5wdXQgPSBgaW5wdXRbdHlwZT0ke3R5cGV9XVt2YWx1ZT0ke3ZhbHVlfV1gO1xyXG5cdFx0XHRcdHRoaXMuaW5wdXQgPSBlbG08J2lucHV0Jz4oaW5wdXQsXHJcblx0XHRcdFx0XHRpbnB1dCA9PiB0aGlzLmNoYW5nZSgpLFxyXG5cdFx0XHRcdCkuYXBwZW5kVG8odGhpcy5idXR0b24pO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjaGFuZ2UoKSB7XHJcblx0XHRcdFx0bGV0IHZhbHVlID0gdGhpcy5nZXRWYWx1ZSgpO1xyXG5cdFx0XHRcdGlmICh0aGlzLmxhc3RWYWx1ZSAhPSB2YWx1ZSkge1xyXG5cdFx0XHRcdFx0dGhpcy5sYXN0VmFsdWUgPSB2YWx1ZTtcclxuXHRcdFx0XHRcdHRoaXMucGFyZW50LnJlcXVlc3RVcGRhdGUoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKiByZXR1cm5zIGlmIGl0ZW0gc2hvdWxkIGJlIHZpc2libGUgKi9cclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb2ZmJykgcmV0dXJuIHRydWU7XHJcblx0XHRcdFx0bGV0IHZhbHVlID0gdGhpcy5maWx0ZXIodGhpcy5nZXRWYWx1ZSgpLCBkYXRhLCBlbCk7XHJcblx0XHRcdFx0bGV0IHJlc3VsdCA9IHR5cGVvZiB2YWx1ZSA9PSBcIm51bWJlclwiID8gdmFsdWUgPiAwIDogdmFsdWU7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb24nKSByZXR1cm4gcmVzdWx0O1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29wcG9zaXRlJykgcmV0dXJuICFyZXN1bHQ7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGdldFZhbHVlKCk6IFYge1xyXG5cdFx0XHRcdGxldCB2YWx1ZTogViA9ICh0aGlzLmlucHV0LnR5cGUgPT0gJ3RleHQnID8gdGhpcy5pbnB1dC52YWx1ZSA6IHRoaXMuaW5wdXQudmFsdWVBc051bWJlcikgYXMgVjtcclxuXHRcdFx0XHRyZXR1cm4gdmFsdWU7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgY2xhc3MgTWF0Y2hGaWx0ZXI8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4gaW1wbGVtZW50cyBJRmlsdGVyPERhdGE+IHtcclxuXHRcdFx0ZGVjbGFyZSB2YWx1ZTogKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCkgPT4gc3RyaW5nO1xyXG5cdFx0XHRpbnB1dDogSFRNTElucHV0RWxlbWVudDtcclxuXHRcdFx0bGFzdFZhbHVlOiBzdHJpbmc7XHJcblx0XHRcdG1hdGNoZXI6IChpbnB1dDogc3RyaW5nKSA9PiBib29sZWFuO1xyXG5cclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogTWF0Y2hGaWx0ZXJTb3VyY2U8RGF0YT4pIHtcclxuXHRcdFx0XHRkYXRhLmJ1dHRvbiA/Pz0gJ2J1dHRvbi5lZi1pdGVtLmVmLWZpbHRlcltlZi1tb2RlPVwib2ZmXCJdJztcclxuXHRcdFx0XHRkYXRhLnZhbHVlID8/PSBkYXRhID0+IEpTT04uc3RyaW5naWZ5KGRhdGEpO1xyXG5cdFx0XHRcdHN1cGVyKGRhdGEpO1xyXG5cdFx0XHRcdGxldCB2YWx1ZSA9ICFkYXRhLmlucHV0ID8gJycgOiBKU09OLnN0cmluZ2lmeShkYXRhLmlucHV0KTtcclxuXHRcdFx0XHRsZXQgaW5wdXQgPSBgaW5wdXRbdHlwZT10ZXh0fV1bdmFsdWU9JHt2YWx1ZX1dYDtcclxuXHRcdFx0XHR0aGlzLmlucHV0ID0gZWxtPCdpbnB1dCc+KGlucHV0LFxyXG5cdFx0XHRcdFx0aW5wdXQgPT4gdGhpcy5jaGFuZ2UoKSxcclxuXHRcdFx0XHQpLmFwcGVuZFRvKHRoaXMuYnV0dG9uKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2hhbmdlKCkge1xyXG5cdFx0XHRcdGlmICh0aGlzLmxhc3RWYWx1ZSAhPSB0aGlzLmlucHV0LnZhbHVlKSB7XHJcblx0XHRcdFx0XHR0aGlzLmxhc3RWYWx1ZSA9IHRoaXMuaW5wdXQudmFsdWU7XHJcblx0XHRcdFx0XHR0aGlzLm1hdGNoZXIgPSB0aGlzLmdlbmVyYXRlTWF0Y2hlcih0aGlzLmxhc3RWYWx1ZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRhcHBseShkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvZmYnKSByZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHRsZXQgcmVzdWx0ID0gdGhpcy5tYXRjaGVyKHRoaXMudmFsdWUoZGF0YSwgZWwpKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5tb2RlID09ICdvbicgPyByZXN1bHQgOiAhcmVzdWx0O1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBtYXRjaGVyQ2FjaGU6IE1hcDxzdHJpbmcsICgoaW5wdXQ6IHN0cmluZykgPT4gYm9vbGVhbik+ID0gbmV3IE1hcCgpO1xyXG5cdFx0XHQvLyBnZXRNYXRjaGVyKHNvdXJjZTogc3RyaW5nKTogKGlucHV0OiBzdHJpbmcpID0+IGJvb2xlYW4ge1xyXG5cdFx0XHQvLyBcdGlmICh0aGlzLm1hdGNoZXJDYWNoZS5oYXMoc291cmNlKSkge1xyXG5cdFx0XHQvLyBcdFx0cmV0dXJuIHRoaXMubWF0Y2hlckNhY2hlLmdldChzb3VyY2UpO1xyXG5cdFx0XHQvLyBcdH1cclxuXHRcdFx0Ly8gXHRsZXQgbWF0Y2hlciA9IHRoaXMuZ2VuZXJhdGVNYXRjaGVyKHNvdXJjZSk7XHJcblx0XHRcdC8vIFx0dGhpcy5tYXRjaGVyQ2FjaGUuc2V0KHNvdXJjZSwgbWF0Y2hlcik7XHJcblx0XHRcdC8vIFx0cmV0dXJuIG1hdGNoZXI7XHJcblx0XHRcdC8vIH1cclxuXHRcdFx0Z2VuZXJhdGVNYXRjaGVyKHNvdXJjZTogc3RyaW5nKTogKChpbnB1dDogc3RyaW5nKSA9PiBib29sZWFuKSB7XHJcblx0XHRcdFx0c291cmNlID0gc291cmNlLnRyaW0oKTtcclxuXHRcdFx0XHRpZiAoc291cmNlLmxlbmd0aCA9PSAwKSByZXR1cm4gKCkgPT4gdHJ1ZTtcclxuXHRcdFx0XHRpZiAoc291cmNlLmluY2x1ZGVzKCcgJykpIHtcclxuXHRcdFx0XHRcdGxldCBwYXJ0cyA9IHNvdXJjZS5zcGxpdCgnICcpLm1hcChlID0+IHRoaXMuZ2VuZXJhdGVNYXRjaGVyKGUpKTtcclxuXHRcdFx0XHRcdHJldHVybiAoaW5wdXQpID0+IHBhcnRzLmV2ZXJ5KG0gPT4gbShpbnB1dCkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoc291cmNlLnN0YXJ0c1dpdGgoJy0nKSkge1xyXG5cdFx0XHRcdFx0aWYgKHNvdXJjZS5sZW5ndGggPCAzKSByZXR1cm4gKCkgPT4gdHJ1ZTtcclxuXHRcdFx0XHRcdGxldCBiYXNlID0gdGhpcy5nZW5lcmF0ZU1hdGNoZXIoc291cmNlLnNsaWNlKDEpKTtcclxuXHRcdFx0XHRcdHJldHVybiAoaW5wdXQpID0+ICFiYXNlKGlucHV0KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdGxldCBmbGFncyA9IHNvdXJjZS50b0xvd2VyQ2FzZSgpID09IHNvdXJjZSA/ICdpJyA6ICcnO1xyXG5cdFx0XHRcdFx0bGV0IHJlZ2V4ID0gbmV3IFJlZ0V4cChzb3VyY2UsIGZsYWdzKTtcclxuXHRcdFx0XHRcdHJldHVybiAoaW5wdXQpID0+ICEhaW5wdXQubWF0Y2gocmVnZXgpO1xyXG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHsgfTtcclxuXHRcdFx0XHRyZXR1cm4gKGlucHV0KSA9PiBpbnB1dC5pbmNsdWRlcyhzb3VyY2UpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dHlwZSBUYWdHZXR0ZXJGbjxEYXRhPiA9IHNlbGVjdG9yIHwgKChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQsIG1vZGU6IE1vZGUpID0+IChIVE1MRWxlbWVudFtdIHwgc3RyaW5nW10pKTtcclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgVGFnRmlsdGVyU291cmNlPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtU291cmNlIHtcclxuXHRcdFx0dGFnczogVGFnR2V0dGVyRm48RGF0YT47XHJcblx0XHRcdGlucHV0Pzogc3RyaW5nO1xyXG5cdFx0XHRoaWdoaWdodENsYXNzPzogc3RyaW5nO1xyXG5cdFx0fVxyXG5cdFx0dHlwZSBUYWdNYXRjaGVyID0geyBwb3NpdGl2ZTogYm9vbGVhbiwgbWF0Y2hlczogKHM6IHN0cmluZykgPT4gYm9vbGVhbiB9O1xyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBUYWdGaWx0ZXI8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4gaW1wbGVtZW50cyBJRmlsdGVyPERhdGE+IHtcclxuXHRcdFx0dGFnczogVGFnR2V0dGVyRm48RGF0YT47XHJcblx0XHRcdGlucHV0OiBIVE1MSW5wdXRFbGVtZW50O1xyXG5cdFx0XHRoaWdoaWdodENsYXNzOiBzdHJpbmc7XHJcblxyXG5cdFx0XHRsYXN0VmFsdWU6IHN0cmluZyA9ICcnO1xyXG5cdFx0XHRjYWNoZWRNYXRjaGVyOiBUYWdNYXRjaGVyW107XHJcblxyXG5cclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogVGFnRmlsdGVyU291cmNlPERhdGE+KSB7XHJcblx0XHRcdFx0ZGF0YS5idXR0b24gPz89ICdidXR0b24uZWYtaXRlbS5lZi1maWx0ZXJbZWYtbW9kZT1cIm9mZlwiXSc7XHJcblx0XHRcdFx0c3VwZXIoZGF0YSk7XHJcblx0XHRcdFx0dGhpcy5pbnB1dCA9IGVsbTwnaW5wdXQnPihgaW5wdXRbdHlwZT10ZXh0fV1gLFxyXG5cdFx0XHRcdFx0aW5wdXQgPT4gdGhpcy5jaGFuZ2UoKSxcclxuXHRcdFx0XHQpLmFwcGVuZFRvKHRoaXMuYnV0dG9uKTtcclxuXHRcdFx0XHR0aGlzLmlucHV0LnZhbHVlID0gZGF0YS5pbnB1dCB8fCAnJztcclxuXHRcdFx0XHR0aGlzLnRhZ3MgPSBkYXRhLnRhZ3M7XHJcblx0XHRcdFx0dGhpcy5jYWNoZWRNYXRjaGVyID0gW107XHJcblxyXG5cdFx0XHRcdHRoaXMuaGlnaGlnaHRDbGFzcyA9IGRhdGEuaGlnaGlnaHRDbGFzcyA/PyAnZWYtdGFnLWhpZ2hsaXNodCc7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGFwcGx5KGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xyXG5cdFx0XHRcdGxldCB0YWdzID0gdGhpcy5nZXRUYWdzKGRhdGEsIGVsKTtcclxuXHRcdFx0XHR0YWdzLm1hcCh0YWcgPT4gdGhpcy5yZXNldEhpZ2hsaWdodCh0YWcpKTtcclxuXHJcblx0XHRcdFx0bGV0IHJlc3VsdHMgPSB0aGlzLmNhY2hlZE1hdGNoZXIubWFwKG0gPT4ge1xyXG5cdFx0XHRcdFx0bGV0IHIgPSB7IHBvc2l0aXZlOiBtLnBvc2l0aXZlLCBjb3VudDogMCB9O1xyXG5cdFx0XHRcdFx0Zm9yIChsZXQgdGFnIG9mIHRhZ3MpIHtcclxuXHRcdFx0XHRcdFx0bGV0IHN0ciA9IHR5cGVvZiB0YWcgPT0gJ3N0cmluZycgPyB0YWcgOiB0YWcuaW5uZXJUZXh0O1xyXG5cdFx0XHRcdFx0XHRsZXQgdmFsID0gbS5tYXRjaGVzKHN0cik7XHJcblx0XHRcdFx0XHRcdGlmICh2YWwpIHtcclxuXHRcdFx0XHRcdFx0XHRyLmNvdW50Kys7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5oaWdobGlnaHRUYWcodGFnLCBtLnBvc2l0aXZlKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cmV0dXJuIHI7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0cmV0dXJuIHJlc3VsdHMuZXZlcnkociA9PiByLnBvc2l0aXZlID8gci5jb3VudCA+IDAgOiByLmNvdW50ID09IDApO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJlc2V0SGlnaGxpZ2h0KHRhZzogc3RyaW5nIHwgSFRNTEVsZW1lbnQpIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIHRhZyA9PSAnc3RyaW5nJykgcmV0dXJuO1xyXG5cdFx0XHRcdHRhZy5jbGFzc0xpc3QucmVtb3ZlKHRoaXMuaGlnaGlnaHRDbGFzcyk7XHJcblx0XHRcdH1cclxuXHRcdFx0aGlnaGxpZ2h0VGFnKHRhZzogc3RyaW5nIHwgSFRNTEVsZW1lbnQsIHBvc2l0aXZlOiBib29sZWFuKSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiB0YWcgPT0gJ3N0cmluZycpIHJldHVybjtcclxuXHRcdFx0XHQvLyBGSVhNRVxyXG5cdFx0XHRcdHRhZy5jbGFzc0xpc3QuYWRkKHRoaXMuaGlnaGlnaHRDbGFzcyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGdldFRhZ3MoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnRbXSB8IHN0cmluZ1tdIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIHRoaXMudGFncyA9PSAnc3RyaW5nJykgcmV0dXJuIGVsLnFxPEhUTUxFbGVtZW50Pih0aGlzLnRhZ3MpO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnRhZ3MoZGF0YSwgZWwsIHRoaXMubW9kZSk7XHJcblx0XHRcdH1cclxuXHRcdFx0Z2V0VGFnU3RyaW5ncyhkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpOiBzdHJpbmdbXSB7XHJcblx0XHRcdFx0bGV0IHRhZ3MgPSB0aGlzLmdldFRhZ3MoZGF0YSwgZWwpO1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgdGFnc1swXSA9PSAnc3RyaW5nJykgcmV0dXJuIHRhZ3MgYXMgc3RyaW5nW107XHJcblx0XHRcdFx0cmV0dXJuIHRhZ3MubWFwKChlKSA9PiBlLmlubmVyVGV4dCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNoYW5nZSgpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5sYXN0VmFsdWUgPT0gdGhpcy5pbnB1dC52YWx1ZSkgcmV0dXJuO1xyXG5cdFx0XHRcdHRoaXMubGFzdFZhbHVlID0gdGhpcy5pbnB1dC52YWx1ZTtcclxuXHRcdFx0XHR0aGlzLmNhY2hlZE1hdGNoZXIgPSB0aGlzLnBhcnNlTWF0Y2hlcih0aGlzLmxhc3RWYWx1ZSk7XHJcblx0XHRcdFx0dGhpcy5wYXJlbnQucmVxdWVzdFVwZGF0ZSgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRwYXJzZU1hdGNoZXIobWF0Y2hlcjogc3RyaW5nKTogVGFnTWF0Y2hlcltdIHtcclxuXHRcdFx0XHRtYXRjaGVyLnRyaW0oKTtcclxuXHRcdFx0XHRpZiAoIW1hdGNoZXIpIHJldHVybiBbXTtcclxuXHJcblx0XHRcdFx0aWYgKG1hdGNoZXIuaW5jbHVkZXMoJyAnKSkge1xyXG5cdFx0XHRcdFx0bGV0IHBhcnRzID0gbWF0Y2hlci5tYXRjaCgvXCJbXlwiXSpcInxcXFMrL2cpIHx8IFtdO1xyXG5cdFx0XHRcdFx0cmV0dXJuIHBhcnRzLmZsYXRNYXAoZSA9PiB0aGlzLnBhcnNlTWF0Y2hlcihlKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChtYXRjaGVyLnN0YXJ0c1dpdGgoJy0nKSkge1xyXG5cdFx0XHRcdFx0bGV0IHBhcnRzID0gdGhpcy5wYXJzZU1hdGNoZXIobWF0Y2hlci5zbGljZSgxKSk7XHJcblx0XHRcdFx0XHRyZXR1cm4gcGFydHMubWFwKGUgPT4gKHsgcG9zaXRpdmU6ICFlLnBvc2l0aXZlLCBtYXRjaGVzOiBlLm1hdGNoZXMgfSkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAobWF0Y2hlci5tYXRjaCgvXCJeW15cIl0qXCIkLykpIHtcclxuXHRcdFx0XHRcdG1hdGNoZXIgPSBtYXRjaGVyLnNsaWNlKDEsIC0xKTtcclxuXHRcdFx0XHRcdHJldHVybiBbeyBwb3NpdGl2ZTogdHJ1ZSwgbWF0Y2hlczogdGFnID0+IHRhZyA9PSBtYXRjaGVyIH1dO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAobWF0Y2hlci5sZW5ndGggPCAzKSByZXR1cm4gW107XHJcblx0XHRcdFx0aWYgKG1hdGNoZXIubWF0Y2goL1wiLyk/Lmxlbmd0aCA9PSAxKSByZXR1cm4gW107XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdGxldCBnID0gbmV3IFJlZ0V4cChtYXRjaGVyLCAnaScpO1xyXG5cdFx0XHRcdFx0cmV0dXJuIFt7IHBvc2l0aXZlOiB0cnVlLCBtYXRjaGVzOiB0YWcgPT4gISF0YWcubWF0Y2goZykgfV07XHJcblx0XHRcdFx0fSBjYXRjaCAoZSkgeyB9XHJcblx0XHRcdFx0cmV0dXJuIFt7IHBvc2l0aXZlOiB0cnVlLCBtYXRjaGVzOiB0YWcgPT4gdGFnLmluY2x1ZGVzKG1hdGNoZXIpIH1dO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHR9XHJcbn1cclxuIiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFbnRyeUZpbHRlcmVyRXh0ZW5zaW9uIHtcclxuXHJcblx0XHRleHBvcnQgY2xhc3MgTW9kaWZpZXI8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4gaW1wbGVtZW50cyBJTW9kaWZpZXI8RGF0YT4ge1xyXG5cdFx0XHRkZWNsYXJlIG1vZGlmaWVyOiBNb2RpZmllckZuPERhdGE+O1xyXG5cdFx0XHRkZWNsYXJlIHJ1bk9uTm9DaGFuZ2U/OiBib29sZWFuO1xyXG5cclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogTW9kaWZpZXJTb3VyY2U8RGF0YT4pIHtcclxuXHRcdFx0XHRkYXRhLmJ1dHRvbiA/Pz0gJ2J1dHRvbi5lZi1pdGVtLmVmLW1vZGlmaWVyW2VmLW1vZGU9XCJvZmZcIl0nO1xyXG5cdFx0XHRcdHN1cGVyKGRhdGEpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0b2dnbGVNb2RlKG1vZGU6IE1vZGUsIGZvcmNlID0gZmFsc2UpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09IG1vZGUgJiYgIWZvcmNlKSByZXR1cm47XHJcblx0XHRcdFx0dGhpcy5wYXJlbnQubW92ZVRvVG9wKHRoaXMpO1xyXG5cdFx0XHRcdHN1cGVyLnRvZ2dsZU1vZGUobW9kZSwgZm9yY2UpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRhcHBseShkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpIHtcclxuXHRcdFx0XHRsZXQgb2xkTW9kZTogTW9kZSB8IG51bGwgPSBlbC5nZXRBdHRyaWJ1dGUoYGVmLW1vZGlmaWVyLSR7dGhpcy5pZH0tbW9kZWApIGFzIChNb2RlIHwgbnVsbCk7XHJcblx0XHRcdFx0aWYgKG9sZE1vZGUgPT0gdGhpcy5tb2RlICYmICF0aGlzLnJ1bk9uTm9DaGFuZ2UpIHJldHVybjtcclxuXHRcdFx0XHR0aGlzLm1vZGlmaWVyKGRhdGEsIGVsLCB0aGlzLm1vZGUsIG51bGwpO1xyXG5cdFx0XHRcdGVsLnNldEF0dHJpYnV0ZShgZWYtbW9kaWZpZXItJHt0aGlzLmlkfS1tb2RlYCwgdGhpcy5tb2RlKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBQcmVmaXhlcjxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbTxEYXRhPiBpbXBsZW1lbnRzIElNb2RpZmllcjxEYXRhPiB7XHJcblx0XHRcdGRlY2xhcmUgdGFyZ2V0OiBzZWxlY3RvciB8ICgoZTogSFRNTEVsZW1lbnQsIGRhdGE6IERhdGEsIG1vZGU6IE1vZGUpID0+IChIVE1MRWxlbWVudCB8IEhUTUxFbGVtZW50W10pKTtcclxuXHRcdFx0ZGVjbGFyZSBwcmVmaXg/OiAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50LCBtb2RlOiBNb2RlKSA9PiBzdHJpbmc7XHJcblx0XHRcdGRlY2xhcmUgcG9zdGZpeD86IChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQsIG1vZGU6IE1vZGUpID0+IHN0cmluZztcclxuXHRcdFx0ZGVjbGFyZSBwcmVmaXhBdHRyaWJ1dGU6IHN0cmluZztcclxuXHRcdFx0ZGVjbGFyZSBwb3N0Zml4QXR0cmlidXRlOiBzdHJpbmc7XHJcblx0XHRcdGRlY2xhcmUgYWxsOiBib29sZWFuO1xyXG5cclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogUHJlZml4ZXJTb3VyY2U8RGF0YT4pIHtcclxuXHRcdFx0XHRkYXRhLmJ1dHRvbiA/Pz0gJ2J1dHRvbi5lZi1pdGVtLmVmLW1vZGlmaWVyW2VmLW1vZGU9XCJvZmZcIl0nO1xyXG5cdFx0XHRcdGRhdGEudGFyZ2V0ID8/PSBlID0+IGU7XHJcblx0XHRcdFx0ZGF0YS5wcmVmaXhBdHRyaWJ1dGUgPz89ICdlZi1wcmVmaXgnO1xyXG5cdFx0XHRcdGRhdGEucG9zdGZpeEF0dHJpYnV0ZSA/Pz0gJ2VmLXBvc3RmaXgnO1xyXG5cdFx0XHRcdGRhdGEuYWxsID8/PSBmYWxzZTtcclxuXHRcdFx0XHRzdXBlcihkYXRhKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KSB7XHJcblx0XHRcdFx0bGV0IHRhcmdldHMgPSB0aGlzLmdldFRhcmdldHMoZWwsIGRhdGEpO1xyXG5cdFx0XHRcdGlmICh0aGlzLnByZWZpeCkge1xyXG5cdFx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb2ZmJykge1xyXG5cdFx0XHRcdFx0XHR0YXJnZXRzLm1hcChlID0+IGUucmVtb3ZlQXR0cmlidXRlKHRoaXMucHJlZml4QXR0cmlidXRlKSk7XHJcblx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRsZXQgdmFsdWUgPSB0aGlzLnByZWZpeChkYXRhLCBlbCwgdGhpcy5tb2RlKTtcclxuXHRcdFx0XHRcdFx0dGFyZ2V0cy5tYXAoZSA9PiBlLnNldEF0dHJpYnV0ZSh0aGlzLnByZWZpeEF0dHJpYnV0ZSwgdmFsdWUpKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMucG9zdGZpeCkge1xyXG5cdFx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb2ZmJykge1xyXG5cdFx0XHRcdFx0XHR0YXJnZXRzLm1hcChlID0+IGUucmVtb3ZlQXR0cmlidXRlKHRoaXMucG9zdGZpeEF0dHJpYnV0ZSkpO1xyXG5cdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0bGV0IHZhbHVlID0gdGhpcy5wb3N0Zml4KGRhdGEsIGVsLCB0aGlzLm1vZGUpO1xyXG5cdFx0XHRcdFx0XHR0YXJnZXRzLm1hcChlID0+IGUuc2V0QXR0cmlidXRlKHRoaXMucG9zdGZpeEF0dHJpYnV0ZSwgdmFsdWUpKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGdldFRhcmdldHMoZWw6IEhUTUxFbGVtZW50LCBkYXRhOiBEYXRhKTogSFRNTEVsZW1lbnRbXSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiB0aGlzLnRhcmdldCA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0aWYgKHRoaXMuYWxsKSByZXR1cm4gZWwucXEodGhpcy50YXJnZXQpO1xyXG5cdFx0XHRcdFx0cmV0dXJuIFtlbC5xKHRoaXMudGFyZ2V0KV07XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGxldCB0YXJnZXRzID0gdGhpcy50YXJnZXQoZWwsIGRhdGEsIHRoaXMubW9kZSk7XHJcblx0XHRcdFx0XHRyZXR1cm4gQXJyYXkuaXNBcnJheSh0YXJnZXRzKSA/IHRhcmdldHMgOiBbdGFyZ2V0c107XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdH1cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cdGV4cG9ydCBuYW1lc3BhY2UgRW50cnlGaWx0ZXJlckV4dGVuc2lvbiB7XHJcblxyXG5cdFx0ZXhwb3J0IGNsYXNzIFNvcnRlcjxEYXRhLCBWIGV4dGVuZHMgbnVtYmVyIHwgc3RyaW5nPiBleHRlbmRzIEZpbHRlcmVySXRlbTxEYXRhPiBpbXBsZW1lbnRzIElTb3J0ZXI8RGF0YT4ge1xyXG5cdFx0XHRkZWNsYXJlIHNvcnRlcjogU29ydGVyRm48RGF0YSwgVj47XHJcblx0XHRcdGRlY2xhcmUgY29tcGFyYXRvcjogKGE6IFYsIGI6IFYpID0+IG51bWJlcjtcclxuXHJcblx0XHRcdGNvbnN0cnVjdG9yKGRhdGE6IFNvcnRlclNvdXJjZTxEYXRhLCBWPikge1xyXG5cdFx0XHRcdGRhdGEuYnV0dG9uID8/PSAnYnV0dG9uLmVmLWl0ZW0uZWYtc29ydGVyW2VmLW1vZGU9XCJvZmZcIl0nO1xyXG5cdFx0XHRcdGRhdGEuY29tcGFyYXRvciA/Pz0gKGE6IFYsIGI6IFYpID0+IGEgPiBiID8gMSA6IGEgPCBiID8gLTEgOiAwO1xyXG5cdFx0XHRcdHN1cGVyKGRhdGEpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0b2dnbGVNb2RlKG1vZGU6IE1vZGUsIGZvcmNlID0gZmFsc2UpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09IG1vZGUgJiYgIWZvcmNlKSByZXR1cm47XHJcblx0XHRcdFx0dGhpcy5wYXJlbnQubW92ZVRvVG9wKHRoaXMpO1xyXG5cdFx0XHRcdHN1cGVyLnRvZ2dsZU1vZGUobW9kZSwgZm9yY2UpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRzb3J0KGxpc3Q6IFtEYXRhLCBIVE1MRWxlbWVudF1bXSk6IFtEYXRhLCBIVE1MRWxlbWVudF1bXSB7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb2ZmJykgcmV0dXJuIGxpc3Q7XHJcblx0XHRcdFx0cmV0dXJuIGxpc3QudnNvcnQoKFtkYXRhLCBlbF06IFtEYXRhLCBIVE1MRWxlbWVudF0pID0+IHRoaXMuYXBwbHkoZGF0YSwgZWwpLCAoYTogViwgYjogVikgPT4gdGhpcy5jb21wYXJlKGEsIGIpKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0LyoqIHJldHVybnMgb3JkZXIgb2YgZW50cnkgKi9cclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogViB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuc29ydGVyKGRhdGEsIGVsLCB0aGlzLm1vZGUpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjb21wYXJlKGE6IFYsIGI6IFYpOiBudW1iZXIge1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29uJykge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuY29tcGFyYXRvcihhLCBiKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb3Bwb3NpdGUnKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5jb21wYXJhdG9yKGIsIGEpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gMDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHR9XHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFbnRyeUZpbHRlcmVyRXh0ZW5zaW9uIHtcclxuXHRcdGV4cG9ydCB0eXBlIFdheW5lc3MgPSBmYWxzZSB8IHRydWUgfCAnZGlyJztcclxuXHRcdGV4cG9ydCB0eXBlIE1vZGUgPSAnb2ZmJyB8ICdvbicgfCAnb3Bwb3NpdGUnO1xyXG5cclxuXHRcdGV4cG9ydCB0eXBlIFBhcnNlckZuPERhdGE+ID0gKGVsOiBIVE1MRWxlbWVudCwgZGF0YTogUGFydGlhbDxEYXRhPikgPT4gUGFydGlhbDxEYXRhPiB8IHZvaWQgfCBQcm9taXNlTGlrZTxQYXJ0aWFsPERhdGEgfCB2b2lkPj47XHJcblx0XHRleHBvcnQgdHlwZSBGaWx0ZXJGbjxEYXRhPiA9IChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQsIG1vZGU6IE1vZGUpID0+IGJvb2xlYW47XHJcblx0XHRleHBvcnQgdHlwZSBTb3J0ZXJGbjxEYXRhLCBWPiA9IChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQsIG1vZGU6IE1vZGUpID0+IFY7XHJcblx0XHRleHBvcnQgdHlwZSBNb2RpZmllckZuPERhdGE+ID0gKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCwgbW9kZTogTW9kZSwgb2xkTW9kZTogTW9kZSB8IG51bGwpID0+IHZvaWQ7XHJcblx0XHRleHBvcnQgdHlwZSBWYWx1ZUZpbHRlckZuPERhdGEsIFY+ID0gKHZhbHVlOiBWLCBkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpID0+IGJvb2xlYW47XHJcblx0XHRleHBvcnQgdHlwZSBQcmVmaXhlckZuPERhdGE+ID0gKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCwgbW9kZTogTW9kZSkgPT4gc3RyaW5nO1xyXG5cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgSUZpbHRlcjxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbTxEYXRhPiB7XHJcblx0XHRcdGFwcGx5KGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCk6IGJvb2xlYW47XHJcblx0XHR9XHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIElTb3J0ZXI8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4ge1xyXG5cdFx0XHRzb3J0KGxpc3Q6IFtEYXRhLCBIVE1MRWxlbWVudF1bXSk6IFtEYXRhLCBIVE1MRWxlbWVudF1bXTtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgSU1vZGlmaWVyPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtPERhdGE+IHtcclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogdm9pZDtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIEZpbHRlcmVySXRlbVNvdXJjZSB7XHJcblx0XHRcdGJ1dHRvbj86IHNlbGVjdG9yO1xyXG5cdFx0XHRpZDogc3RyaW5nO1xyXG5cdFx0XHRuYW1lPzogc3RyaW5nO1xyXG5cdFx0XHRkZXNjcmlwdGlvbj86IHN0cmluZztcclxuXHRcdFx0dGhyZWVXYXk/OiBXYXluZXNzO1xyXG5cdFx0XHRtb2RlPzogTW9kZTtcclxuXHRcdFx0cGFyZW50OiBFbnRyeUZpbHRlcmVyO1xyXG5cdFx0XHRpbmNvbXBhdGlibGU/OiBzdHJpbmdbXTtcclxuXHRcdFx0aGlkZGVuPzogYm9vbGVhbjtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgRmlsdGVyU291cmNlPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtU291cmNlIHtcclxuXHRcdFx0ZmlsdGVyOiBGaWx0ZXJGbjxEYXRhPjtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgVmFsdWVGaWx0ZXJTb3VyY2U8RGF0YSwgVj4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW1Tb3VyY2Uge1xyXG5cdFx0XHRmaWx0ZXI6IFZhbHVlRmlsdGVyRm48RGF0YSwgVj47XHJcblx0XHRcdGlucHV0OiBWO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBNYXRjaEZpbHRlclNvdXJjZTxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbVNvdXJjZSB7XHJcblx0XHRcdHZhbHVlPzogKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCkgPT4gc3RyaW5nO1xyXG5cdFx0XHRpbnB1dD86IHN0cmluZztcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgU29ydGVyU291cmNlPERhdGEsIFY+IGV4dGVuZHMgRmlsdGVyZXJJdGVtU291cmNlIHtcclxuXHRcdFx0c29ydGVyOiBTb3J0ZXJGbjxEYXRhLCBWPjtcclxuXHRcdFx0Y29tcGFyYXRvcj86ICgoYTogViwgYjogVikgPT4gbnVtYmVyKSB8IFY7XHJcblx0XHR9XHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIE1vZGlmaWVyU291cmNlPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtU291cmNlIHtcclxuXHRcdFx0bW9kaWZpZXI6IE1vZGlmaWVyRm48RGF0YT47XHJcblx0XHR9XHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIFByZWZpeGVyU291cmNlPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtU291cmNlIHtcclxuXHRcdFx0dGFyZ2V0Pzogc2VsZWN0b3IgfCAoKGVsOiBIVE1MRWxlbWVudCwgZGF0YTogRGF0YSwgbW9kZTogTW9kZSkgPT4gSFRNTEVsZW1lbnQpO1xyXG5cdFx0XHRwcmVmaXg/OiAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KSA9PiBzdHJpbmc7XHJcblx0XHRcdHBvc3RmaXg/OiAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KSA9PiBzdHJpbmc7XHJcblx0XHRcdHByZWZpeEF0dHJpYnV0ZT86IHN0cmluZztcclxuXHRcdFx0cG9zdGZpeEF0dHJpYnV0ZT86IHN0cmluZztcclxuXHRcdFx0YWxsPzogYm9vbGVhbjtcclxuXHRcdH1cclxuXHJcblx0XHRcclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgRmlsdGVyZXJJdGVtUGFydGlhbCB7XHJcblx0XHRcdGJ1dHRvbj86IHNlbGVjdG9yO1xyXG5cdFx0XHRpZD86IHN0cmluZztcclxuXHRcdFx0bmFtZT86IHN0cmluZztcclxuXHRcdFx0ZGVzY3JpcHRpb24/OiBzdHJpbmc7XHJcblx0XHRcdHRocmVlV2F5PzogV2F5bmVzcztcclxuXHRcdFx0bW9kZT86IE1vZGU7XHJcblx0XHRcdGluY29tcGF0aWJsZT86IHN0cmluZ1tdO1xyXG5cdFx0XHRoaWRkZW4/OiBib29sZWFuO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBGaWx0ZXJQYXJ0aWFsPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtUGFydGlhbCB7IH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgVmFsdWVGaWx0ZXJQYXJ0aWFsPERhdGEsIFY+IGV4dGVuZHMgRmlsdGVyZXJJdGVtUGFydGlhbCB7XHJcblx0XHRcdGlucHV0OiBWO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBTb3J0ZXJQYXJ0aWFsU291cmNlPERhdGEsIFY+IGV4dGVuZHMgRmlsdGVyZXJJdGVtUGFydGlhbCB7XHJcblx0XHRcdGNvbXBhcmF0b3I/OiAoKGE6IFYsIGI6IFYpID0+IG51bWJlcikgfCBWO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBNb2RpZmllclBhcnRpYWw8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW1QYXJ0aWFsIHsgfVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBQcmVmaXhlclBhcnRpYWw8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW1QYXJ0aWFsIHtcclxuXHRcdFx0dGFyZ2V0Pzogc2VsZWN0b3IgfCAoKGVsOiBIVE1MRWxlbWVudCwgZGF0YTogRGF0YSwgbW9kZTogTW9kZSkgPT4gSFRNTEVsZW1lbnQpO1xyXG5cdFx0XHRwcmVmaXg/OiAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KSA9PiBzdHJpbmc7XHJcblx0XHRcdHBvc3RmaXg/OiAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KSA9PiBzdHJpbmc7XHJcblx0XHRcdHByZWZpeEF0dHJpYnV0ZT86IHN0cmluZztcclxuXHRcdFx0cG9zdGZpeEF0dHJpYnV0ZT86IHN0cmluZztcclxuXHRcdFx0YWxsPzogYm9vbGVhbjtcclxuXHRcdH1cclxuXHJcblx0XHR0eXBlIFVuaW9uPFNvdXJjZSwgUmVzdWx0PiA9IHtcclxuXHRcdFx0W1AgaW4ga2V5b2YgU291cmNlICYga2V5b2YgUmVzdWx0XTogU291cmNlW1BdIHwgUmVzdWx0W1BdO1xyXG5cdFx0fSAmIE9taXQ8U291cmNlLCBrZXlvZiBSZXN1bHQ+ICYgT21pdDxSZXN1bHQsIGtleW9mIFNvdXJjZT47XHJcblxyXG5cdFx0dHlwZSBPdmVycmlkZTxULCBPPiA9IE9taXQ8VCwga2V5b2YgTz4gJiBPO1xyXG5cclxuXHRcdHR5cGUgRUZTb3VyY2U8VCBleHRlbmRzIHsgc291cmNlOiBhbnkgfT4gPSBPdmVycmlkZTxPdmVycmlkZTxQYXJ0aWFsPFQ+LCBUWydzb3VyY2UnXT4sIHsgYnV0dG9uPzogc2VsZWN0b3IgfT47XHJcblxyXG5cdFx0dHlwZSBTb3VyY2U8VCBleHRlbmRzIHsgc291cmNlOiBhbnkgfT4gPSBUWydzb3VyY2UnXSAmIHtcclxuXHRcdFx0aWQ/OiBzdHJpbmc7IG5hbWU/OiBzdHJpbmc7IGRlc2NyaXB0aW9uPzogc3RyaW5nO1xyXG5cdFx0XHR0aHJlZVdheT86IFdheW5lc3M7IG1vZGU/OiBNb2RlOyBpbmNvbXBhdGlibGU/OiBzdHJpbmdbXTsgaGlkZGVuPzogYm9vbGVhbjtcclxuXHRcdH07XHJcblxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogY2FuIGJlIGVpdGhlciBNYXAgb3IgV2Vha01hcFxyXG5cdFx0ICogKFdlYWtNYXAgaXMgbGlrZWx5IHRvIGJlIHVzZWxlc3MgaWYgdGhlcmUgYXJlIGxlc3MgdGhlbiAxMGsgb2xkIG5vZGVzIGluIG1hcClcclxuXHRcdCAqL1xyXG5cdFx0bGV0IE1hcFR5cGUgPSBNYXA7XHJcblx0XHR0eXBlIE1hcFR5cGU8SyBleHRlbmRzIG9iamVjdCwgVj4gPS8vIE1hcDxLLCBWPiB8IFxyXG5cdFx0XHRXZWFrTWFwPEssIFY+O1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGxldCBFRiA9IEVudHJ5RmlsdGVyZXJFeHRlbnNpb24uRW50cnlGaWx0ZXJlcjtcclxufSIsIiJdfQ==