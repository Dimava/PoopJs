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
/// <reference path="./Promise.ts" />
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
        const empty = PoopJs.PromiseExtension.empty;
        function pmap2raw(data) {
            data.result ??= Array(data.source.length);
            data.requests = data.result.map(() => empty());
            data.threads ??= 5;
            data.window ??= Infinity;
            data.completed = 0;
            data.length = data.source.length;
            data.activeThreads = 0;
            data.lastStarted = 0;
            if (data.threads <= 0)
                throw new Error();
            let allDone = empty();
            data.then = allDone.then.bind(allDone);
            let anyResolved = empty();
            async function runOne(i) {
                data.activeThreads++;
                data.beforeStart?.(data.source[i], i, data.source, data);
                data.lastStarted = i;
                let v = await data.mapper(data.source[i], i, data.source, data).catch(e => e);
                data.afterComplete?.(data.source[i], i, data.source, data);
                data.activeThreads--;
                anyResolved.resolve(null);
            }
            async function run() {
                for (let i = 0; i < data.length; i++) {
                    while (data.activeThreads < data.threads)
                        await anyResolved;
                    anyResolved = empty();
                    runOne(i);
                }
            }
            return data;
        }
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
        function isStale(cachedAt, maxAge) {
            if (maxAge == null)
                return false;
            return Date.now() - cachedAt >= maxAge;
        }
        async function cached(url, init = {}) {
            let cache = await openCache();
            let response = await cache.match(url);
            if (response) {
                response.cachedAt = +response.headers.get('cached-at') || 0;
                if (!isStale(response.cachedAt, init.maxAge))
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
        async function doc(url, init = {}) {
            let response = await fetch(url, { ...FetchExtension.defaults, ...init });
            let text = await response.text();
            let parser = new DOMParser();
            let doc = parser.parseFromString(text, 'text/html');
            let base = doc.createElement('base');
            base.href = url;
            doc.head.append(base);
            doc.cachedAt = response.cachedAt;
            return doc;
        }
        FetchExtension.doc = doc;
        async function xmlDoc(url) {
            let p = PoopJs.PromiseExtension.empty();
            let oReq = new XMLHttpRequest();
            oReq.onload = p.r;
            oReq.responseType = 'document';
            oReq.open("get", url, true);
            oReq.send();
            await p;
            return oReq.responseXML;
        }
        FetchExtension.xmlDoc = xmlDoc;
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
        async function isCached(url, options = {}) {
            if (options.indexedDb) {
                let dbJson = await idbGet(url);
                if (dbJson) {
                    return isStale(dbJson.cachedAt, options.maxAge) ? false : 'idb';
                }
                if (options.indexedDb == 'only')
                    return false;
            }
            let cache = await openCache();
            let response = await cache.match(url);
            if (!response)
                return false;
            if (typeof options?.maxAge == 'number') {
                let cachedAt = +response.headers.get('cached-at') || 0;
                if (isStale(response.cachedAt, options.maxAge)) {
                    return false;
                }
            }
            return true;
        }
        FetchExtension.isCached = isCached;
        async function cachedJson(url, init = {}) {
            if (init.indexedDb) {
                let dbJson = await idbGet(url);
                if (dbJson) {
                    if (!isStale(dbJson.cachedAt, init.maxAge)) {
                        PoopJs.ObjectExtension.defineValue(dbJson.data, 'cached', dbJson.cachedAt);
                        return dbJson.data;
                    }
                }
            }
            let response = await cached(url, init);
            let json = await response.json();
            if (!('cached' in json)) {
                PoopJs.ObjectExtension.defineValue(json, 'cached', response.cachedAt);
            }
            if (init.indexedDb) {
                idbPut(url, json, response.cachedAt);
            }
            return json;
        }
        FetchExtension.cachedJson = cachedJson;
        let _idbInstancePromise = null;
        let idbInstance = null;
        async function openIdb() {
            if (idbInstance)
                return idbInstance;
            if (await _idbInstancePromise) {
                return idbInstance;
            }
            let irq = indexedDB.open('fetch');
            irq.onupgradeneeded = event => {
                let db = irq.result;
                let store = db.createObjectStore('fetch', { keyPath: 'url' });
            };
            _idbInstancePromise = new Promise((r, j) => {
                irq.onsuccess = r;
                irq.onerror = j;
            }).then(() => irq.result, () => null);
            idbInstance = _idbInstancePromise = await _idbInstancePromise;
            if (!idbInstance)
                throw new Error('Failed to open indexedDB');
            return idbInstance;
        }
        async function idbClear() {
            throw new Error('TODO');
        }
        FetchExtension.idbClear = idbClear;
        async function idbGet(url) {
            let db = await openIdb();
            let t = db.transaction(['fetch'], 'readonly');
            let rq = t.objectStore('fetch').get(url);
            return new Promise(r => {
                rq.onsuccess = () => r(rq.result);
                rq.onerror = () => r(undefined);
            });
        }
        async function idbPut(url, data, cachedAt) {
            let db = await openIdb();
            let t = db.transaction(['fetch'], 'readwrite');
            let rq = t.objectStore('fetch').put({ url, data, cachedAt: cachedAt ?? +new Date() });
            return new Promise(r => {
                rq.onsuccess = () => r(rq.result);
                rq.onerror = () => r(undefined);
            });
        }
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
        function toElArray(entrySelector) {
            return typeof entrySelector == 'function' ? entrySelector() : qq(entrySelector);
        }
        class EntryFilterer {
            container;
            entrySelector;
            constructor(entrySelector, enabled = 'soft') {
                this.entrySelector = entrySelector;
                this.container = elm('.ef-container');
                if (!entrySelector) {
                    // disable if no selector provided (likely is a generic ef)
                    this.disable();
                }
                else if (enabled == 'soft') {
                    this.softDisable = true;
                    this.disable('soft');
                }
                if (enabled != false) {
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
            addPaginationInfo(id = 'pginfo', data = {}) {
                return this.addItem(EntryFiltererExtension.PaginationInfoFilter, this.filters, data, { id });
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
                if (this.disabled == true)
                    return;
                let entries = typeof this.entrySelector == 'function' ? this.entrySelector() : qq(this.entrySelector);
                if (this.disabled == 'soft') {
                    if (!entries.length)
                        return;
                    this.enable();
                    return;
                }
                if (this.disabled != false)
                    throw 0;
                if (!entries.length && this.softDisable) {
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
            softDisable = true;
            disabled = false;
            disable(soft) {
                this.disabled = true;
                if (soft == 'soft')
                    this.disabled = 'soft';
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
            async fetchDocument(link, spinner = true, maxAge = 0) {
                this.doc = null;
                let a = spinner && Paginate.linkToAnchor(link);
                a?.classList.add('paginate-spin');
                link = Paginate.linkToUrl(link);
                this.doc = !maxAge ? await fetch.doc(link) : await fetch.cached.doc(link, { maxAge });
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
                if (link.tagName != 'A')
                    throw new Error('link should be <a> element!');
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
                    maxAge: data.maxAge ?? (data.cache ? 365 * 24 * 2600e3 : 0),
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
                        await this.fetchDocument(doc, true, this.data.maxAge);
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
        window.fetch.isCached = PoopJs.FetchExtension.isCached;
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
        class PaginationInfoFilter extends EntryFiltererExtension.FiltererItem {
            constructor(data) {
                super(data);
                this.init();
            }
            apply() {
                return true;
            }
            Paginate = PoopJs.PaginateExtension.Paginate;
            countPaginate() {
                let data = { running: 0, queued: 0, };
                for (let p of this.Paginate.instances) {
                    data.running += +p.running;
                    data.queued += p.queued;
                }
                return data;
            }
            updateInfo() {
                let data = this.countPaginate();
                if (!data.running && !data.queued) {
                    this.hide();
                }
                else {
                    this.show();
                    this.button.innerText = `... +${data.running + data.queued}`;
                }
            }
            async init() {
                while (true) {
                    await Promise.frame();
                    this.updateInfo();
                }
            }
        }
        EntryFiltererExtension.PaginationInfoFilter = PaginationInfoFilter;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9Qcm9taXNlLnRzIiwiLi4vc3JjL0FycmF5LnRzIiwiLi4vc3JjL0RhdGVOb3dIYWNrLnRzIiwiLi4vc3JjL09iamVjdC50cyIsIi4uL3NyYy9lbGVtZW50LnRzIiwiLi4vc3JjL2VsbS50cyIsIi4uL3NyYy9ldGMudHMiLCIuLi9zcmMvZmV0Y2gudHMiLCIuLi9zcmMvRmlsdGVyZXIvRW50aXR5RmlsdGVyZXIudHMiLCIuLi9zcmMvb2JzZXJ2ZXIudHMiLCIuLi9zcmMvUGFnaW5hdGUvUGFnaW5hdGlvbi50cyIsIi4uL3NyYy9QYWdpbmF0ZS9JbWFnZVNjcm9sbGluZy50cyIsIi4uL3NyYy9pbml0LnRzIiwiLi4vc3JjL3R5cGVzLnRzIiwiLi4vc3JjL0ZpbHRlcmVyL0ZpbHRlcmVySXRlbS50cyIsIi4uL3NyYy9GaWx0ZXJlci9GaWx0ZXIudHMiLCIuLi9zcmMvRmlsdGVyZXIvTW9kaWZpZXIudHMiLCIuLi9zcmMvRmlsdGVyZXIvU29ydGVyLnRzIiwiLi4vc3JjL0ZpbHRlcmVyL3R5cGVzLnRzIiwiLi4vc3JjL1BhZ2luYXRlL21vZGlmaWNhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFVLE1BQU0sQ0F1Q2Y7QUF2Q0QsV0FBVSxNQUFNO0lBRWYsSUFBaUIsZ0JBQWdCLENBbUNoQztJQW5DRCxXQUFpQixnQkFBZ0I7UUFjaEM7O1dBRUc7UUFDSCxTQUFnQixLQUFLO1lBQ3BCLElBQUksT0FBMkIsQ0FBQztZQUNoQyxJQUFJLE1BQThCLENBQUM7WUFDbkMsSUFBSSxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQy9CLE9BQU8sR0FBRyxDQUFDLENBQUM7Z0JBQ1osTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNaLENBQUMsQ0FBd0IsQ0FBQztZQUMxQixDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDO1lBQzFCLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUM7WUFDeEIsT0FBTyxDQUFDLENBQUM7UUFDVixDQUFDO1FBVmUsc0JBQUssUUFVcEIsQ0FBQTtRQUVNLEtBQUssVUFBVSxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUM7WUFDaEMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ2YsTUFBTSxJQUFJLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2FBQ3pDO1lBQ0QsT0FBTyxJQUFJLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFMcUIsc0JBQUssUUFLMUIsQ0FBQTtJQUNGLENBQUMsRUFuQ2dCLGdCQUFnQixHQUFoQix1QkFBZ0IsS0FBaEIsdUJBQWdCLFFBbUNoQztBQUVGLENBQUMsRUF2Q1MsTUFBTSxLQUFOLE1BQU0sUUF1Q2Y7QUN2Q0QscUNBQXFDO0FBQ3JDLElBQVUsTUFBTSxDQXNLZjtBQXRLRCxXQUFVLE1BQU07SUFDZixJQUFpQixjQUFjLENBbUs5QjtJQW5LRCxXQUFpQixjQUFjO1FBRXZCLEtBQUssVUFBVSxJQUFJLENBQWtCLE1BQW1ELEVBQUUsT0FBTyxHQUFHLENBQUM7WUFDM0csSUFBSSxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztnQkFBRSxNQUFNLElBQUksS0FBSyxFQUFFLENBQUM7WUFDdEMsSUFBSSxLQUFLLEdBQXVCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakUsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNyQyxJQUFJLFdBQVcsR0FBRyxPQUFBLGdCQUFnQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzNDLElBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQztZQUMxQixLQUFLLFVBQVUsT0FBTyxDQUFDLElBQXNCO2dCQUM1QyxJQUFJO29CQUNILE9BQU8sTUFBTSxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztpQkFDN0I7Z0JBQUMsT0FBTyxHQUFHLEVBQUU7b0JBQ2IsT0FBTyxHQUFHLENBQUM7aUJBQ1g7WUFDRixDQUFDO1lBQ0QsS0FBSyxVQUFVLEdBQUcsQ0FBQyxJQUFJO2dCQUN0QixXQUFXLEVBQUUsQ0FBQztnQkFDZCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3ZDLFdBQVcsRUFBRSxDQUFDO2dCQUNkLElBQUksY0FBYyxHQUFHLFdBQVcsQ0FBQztnQkFDakMsV0FBVyxHQUFHLE9BQUEsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3ZDLGNBQWMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDN0IsQ0FBQztZQUNELEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxFQUFFO2dCQUN2QixJQUFJLFdBQVcsSUFBSSxDQUFDLEVBQUU7b0JBQ3JCLE1BQU0sV0FBVyxDQUFDO2lCQUNsQjtnQkFDRCxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDVjtZQUNELE9BQU8sV0FBVyxHQUFHLE9BQU8sRUFBRTtnQkFDN0IsTUFBTSxXQUFXLENBQUM7YUFDbEI7WUFDRCxPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDO1FBL0JxQixtQkFBSSxPQStCekIsQ0FBQTtRQUVELFNBQWdCLEdBQUcsQ0FBcUMsTUFBYyxFQUFFLFNBQXdCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNyRyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pELENBQUM7UUFGZSxrQkFBRyxNQUVsQixDQUFBO1FBSUQsU0FBZ0IsS0FBSyxDQUFlLE1BQTJDLEVBQUUsU0FBZ0UsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQztZQUMvSixJQUFJLFNBQVMsR0FBRyxPQUFPLE1BQU0sSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZFLE9BQU8sSUFBSTtpQkFDVCxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2lCQUM3QyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUM3QyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakIsQ0FBQztRQU5lLG9CQUFLLFFBTXBCLENBQUE7UUF5REQsTUFBTSxLQUFLLEdBQUcsT0FBQSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7UUFvQnJDLFNBQVMsUUFBUSxDQUFrQixJQUF1QjtZQUN6RCxJQUFJLENBQUMsTUFBTSxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMsT0FBTyxLQUFLLENBQUMsQ0FBQztZQUNuQixJQUFJLENBQUMsTUFBTSxLQUFLLFFBQVEsQ0FBQztZQUV6QixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztZQUNuQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO1lBRXJCLElBQUksSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDO2dCQUFFLE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUV6QyxJQUFJLE9BQU8sR0FBRyxLQUFLLEVBQUUsQ0FBQztZQUN0QixJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBUSxDQUFDO1lBRTlDLElBQUksV0FBVyxHQUFHLEtBQUssRUFBRSxDQUFDO1lBQzFCLEtBQUssVUFBVSxNQUFNLENBQUMsQ0FBUztnQkFDOUIsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDekQsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxHQUFVLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyRixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDM0QsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNyQixXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNCLENBQUM7WUFFRCxLQUFLLFVBQVUsR0FBRztnQkFDakIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ3JDLE9BQU8sSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsT0FBTzt3QkFBRSxNQUFNLFdBQVcsQ0FBQztvQkFDNUQsV0FBVyxHQUFHLEtBQUssRUFBRSxDQUFDO29CQUN0QixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ1Y7WUFDRixDQUFDO1lBR0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO0lBRUYsQ0FBQyxFQW5LZ0IsY0FBYyxHQUFkLHFCQUFjLEtBQWQscUJBQWMsUUFtSzlCO0FBRUYsQ0FBQyxFQXRLUyxNQUFNLEtBQU4sTUFBTSxRQXNLZjtBQ3ZLRCxJQUFVLE1BQU0sQ0FxRWY7QUFyRUQsV0FBVSxNQUFNO0lBRWYsSUFBaUIsV0FBVyxDQWdFM0I7SUFoRUQsV0FBaUIsV0FBVztRQUVoQiwyQkFBZSxHQUFHLENBQUMsQ0FBQztRQUNwQix1QkFBVyxHQUFHLENBQUMsQ0FBQztRQUNoQix5QkFBYSxHQUFHLENBQUMsQ0FBQztRQUNsQixxQkFBUyxHQUFHLENBQUMsQ0FBQztRQUV6QixTQUFnQixVQUFVLENBQUMsSUFBWTtZQUN0QyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQ2hCLENBQUMsSUFBSSxHQUFHLFlBQUEsYUFBYSxDQUFDLEdBQUcsWUFBQSxlQUFlLEdBQUcsWUFBQSxTQUFTLEdBQUcsWUFBQSxXQUFXLENBQ2xFLENBQUM7UUFDSCxDQUFDO1FBSmUsc0JBQVUsYUFJekIsQ0FBQTtRQUVVLHlCQUFhLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2xFLFNBQWdCLFNBQVMsQ0FBQyxLQUFhO1lBQ3RDLFFBQVEsRUFBRSxDQUFDO1lBQ1gsWUFBQSxlQUFlLEdBQUcsS0FBSyxDQUFDO1lBQ3hCLFFBQVEsQ0FBQyxJQUFJLEdBQUcsS0FBSyxHQUFHLEVBQUUsQ0FBQztRQUM1QixDQUFDO1FBSmUscUJBQVMsWUFJeEIsQ0FBQTtRQUNELFNBQWdCLFFBQVEsQ0FBQyxPQUFlO1lBQ3ZDLFFBQVEsRUFBRSxDQUFDO1lBQ1gsWUFBQSxXQUFXLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQztRQUMvQixDQUFDO1FBSGUsb0JBQVEsV0FHdkIsQ0FBQTtRQUNELFNBQWdCLGVBQWUsQ0FBQyxHQUFXO1lBQzFDLElBQUksWUFBWSxHQUFHLFlBQUEsYUFBYSxDQUFDLE9BQU8sQ0FBQyxZQUFBLGVBQWUsQ0FBQyxDQUFDO1lBQzFELElBQUksWUFBWSxJQUFJLENBQUMsQ0FBQztnQkFBRSxZQUFZLEdBQUcsWUFBQSxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLElBQUksUUFBUSxHQUFHLFlBQUEsYUFBYSxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUMsQ0FBQztZQUNqRCxJQUFJLFFBQVEsSUFBSSxTQUFTO2dCQUFFLE9BQU8sS0FBSyxDQUFDO1lBQ3hDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyQixDQUFDO1FBTmUsMkJBQWUsa0JBTTlCLENBQUE7UUFDRCxTQUFTLFNBQVMsQ0FBQyxLQUFvQjtZQUN0QyxJQUFJLEtBQUssQ0FBQyxJQUFJLElBQUksYUFBYSxFQUFFO2dCQUNoQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNwQjtZQUNELElBQUksS0FBSyxDQUFDLElBQUksSUFBSSxjQUFjLEVBQUU7Z0JBQ2pDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNuQjtRQUNGLENBQUM7UUFDRCxTQUFnQixZQUFZLENBQUMsSUFBSSxHQUFHLElBQUk7WUFDdkMsbUJBQW1CLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFDLElBQUksSUFBSSxJQUFJLElBQUksRUFBRTtnQkFDakIsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2FBQ3ZDO1FBQ0YsQ0FBQztRQUxlLHdCQUFZLGVBSzNCLENBQUE7UUFFVSxxQkFBUyxHQUFHLEtBQUssQ0FBQztRQUM3QixTQUFTLFFBQVE7WUFDaEIsSUFBSSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDO1lBQ25ELFlBQUEsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUN2QixZQUFBLGFBQWEsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDNUIsWUFBQSxXQUFXLEdBQUcsQ0FBQyxDQUFDO1lBQ2hCLDRCQUE0QjtZQUM1QixZQUFZO1lBQ1osSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUc7Z0JBQ3hCLE9BQU8sSUFBSSxDQUFDLEVBQUUsS0FBSyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDaEQsQ0FBQyxDQUFBO1lBQ0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUc7Z0JBQ3hCLE9BQU8sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3ZCLENBQUMsQ0FBQTtZQUNELFlBQUEsU0FBUyxHQUFHLElBQUksQ0FBQztRQUNsQixDQUFDO0lBRUYsQ0FBQyxFQWhFZ0IsV0FBVyxHQUFYLGtCQUFXLEtBQVgsa0JBQVcsUUFnRTNCO0FBR0YsQ0FBQyxFQXJFUyxNQUFNLEtBQU4sTUFBTSxRQXFFZjtBQ3JFRCxJQUFVLE1BQU0sQ0F1Q2Y7QUF2Q0QsV0FBVSxNQUFNO0lBRWYsSUFBaUIsZUFBZSxDQW1DL0I7SUFuQ0QsV0FBaUIsZUFBZTtRQUkvQixTQUFnQixXQUFXLENBQUksQ0FBSSxFQUFFLENBQThCLEVBQUUsS0FBVztZQUMvRSxJQUFJLE9BQU8sQ0FBQyxJQUFJLFVBQVUsRUFBRTtnQkFDM0IsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBdUIsQ0FBQzthQUMvQztZQUNELE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtnQkFDM0IsS0FBSztnQkFDTCxZQUFZLEVBQUUsSUFBSTtnQkFDbEIsVUFBVSxFQUFFLEtBQUs7Z0JBQ2pCLFFBQVEsRUFBRSxJQUFJO2FBQ2QsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxDQUFDLENBQUM7UUFDVixDQUFDO1FBWGUsMkJBQVcsY0FXMUIsQ0FBQTtRQUlELFNBQWdCLFlBQVksQ0FBSSxDQUFJLEVBQUUsQ0FBOEIsRUFBRSxHQUFTO1lBQzlFLElBQUksT0FBTyxDQUFDLElBQUksVUFBVSxFQUFFO2dCQUMzQixDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUF1QixDQUFDO2FBQzdDO1lBQ0QsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO2dCQUMzQixHQUFHO2dCQUNILFlBQVksRUFBRSxJQUFJO2dCQUNsQixVQUFVLEVBQUUsS0FBSzthQUNqQixDQUFDLENBQUM7WUFDSCxPQUFPLENBQUMsQ0FBQztRQUNWLENBQUM7UUFWZSw0QkFBWSxlQVUzQixDQUFBO1FBRUQsU0FBZ0IsR0FBRyxDQUFPLENBQUksRUFBRSxNQUE4QztZQUM3RSxJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBNEIsQ0FBQztZQUMzRCxPQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQXVCLENBQUM7UUFDaEcsQ0FBQztRQUhlLG1CQUFHLE1BR2xCLENBQUE7SUFDRixDQUFDLEVBbkNnQixlQUFlLEdBQWYsc0JBQWUsS0FBZixzQkFBZSxRQW1DL0I7QUFFRixDQUFDLEVBdkNTLE1BQU0sS0FBTixNQUFNLFFBdUNmO0FDdkNELElBQVUsTUFBTSxDQXdFZjtBQXhFRCxXQUFVLE1BQU07SUFFZixJQUFpQixhQUFhLENBaUQ3QjtJQWpERCxXQUFpQixhQUFhO1FBRTdCLElBQWlCLE9BQU8sQ0FjdkI7UUFkRCxXQUFpQixPQUFPO1lBSXZCLFNBQWdCLENBQUMsQ0FBQyxRQUFnQjtnQkFDakMsT0FBTyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pDLENBQUM7WUFGZSxTQUFDLElBRWhCLENBQUE7WUFLRCxTQUFnQixFQUFFLENBQUMsUUFBZ0I7Z0JBQ2xDLE9BQU8sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ2pELENBQUM7WUFGZSxVQUFFLEtBRWpCLENBQUE7UUFDRixDQUFDLEVBZGdCLE9BQU8sR0FBUCxxQkFBTyxLQUFQLHFCQUFPLFFBY3ZCO1FBRUQsSUFBaUIsU0FBUyxDQWN6QjtRQWRELFdBQWlCLFNBQVM7WUFJekIsU0FBZ0IsQ0FBQyxDQUFpQixRQUFnQjtnQkFDakQsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNyRCxDQUFDO1lBRmUsV0FBQyxJQUVoQixDQUFBO1lBS0QsU0FBZ0IsRUFBRSxDQUFpQixRQUFnQjtnQkFDbEQsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzdELENBQUM7WUFGZSxZQUFFLEtBRWpCLENBQUE7UUFDRixDQUFDLEVBZGdCLFNBQVMsR0FBVCx1QkFBUyxLQUFULHVCQUFTLFFBY3pCO1FBRUQsSUFBaUIsUUFBUSxDQWN4QjtRQWRELFdBQWlCLFFBQVE7WUFJeEIsU0FBZ0IsQ0FBQyxDQUFnQixRQUFnQjtnQkFDaEQsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3JDLENBQUM7WUFGZSxVQUFDLElBRWhCLENBQUE7WUFLRCxTQUFnQixFQUFFLENBQWdCLFFBQWdCO2dCQUNqRCxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBRmUsV0FBRSxLQUVqQixDQUFBO1FBQ0YsQ0FBQyxFQWRnQixRQUFRLEdBQVIsc0JBQVEsS0FBUixzQkFBUSxRQWN4QjtJQUNGLENBQUMsRUFqRGdCLGFBQWEsR0FBYixvQkFBYSxLQUFiLG9CQUFhLFFBaUQ3QjtJQUVELElBQWlCLGdCQUFnQixDQWlCaEM7SUFqQkQsV0FBaUIsZ0JBQWdCO1FBRWhDLFNBQWdCLElBQUksQ0FBbUIsSUFBWSxFQUFFLE1BQVU7WUFDOUQsSUFBSSxLQUFLLEdBQUcsSUFBSSxXQUFXLENBQUMsSUFBSSxFQUFFO2dCQUNqQyxPQUFPLEVBQUUsSUFBSTtnQkFDYixNQUFNO2FBQ04sQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBTmUscUJBQUksT0FNbkIsQ0FBQTtRQUVELFNBQWdCLFFBQVEsQ0FBNkIsTUFBMEI7WUFDOUUsSUFBSSxPQUFPLE1BQU0sSUFBSSxRQUFRLEVBQUU7Z0JBQzlCLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ3hDO1lBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwQixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFOZSx5QkFBUSxXQU12QixDQUFBO0lBQ0YsQ0FBQyxFQWpCZ0IsZ0JBQWdCLEdBQWhCLHVCQUFnQixLQUFoQix1QkFBZ0IsUUFpQmhDO0FBRUYsQ0FBQyxFQXhFUyxNQUFNLEtBQU4sTUFBTSxRQXdFZjtBQ3hFRCxJQUFVLE1BQU0sQ0FvR2Y7QUFwR0QsV0FBVSxNQUFNO0lBRWYsSUFBaUIsR0FBRyxDQWdHbkI7SUFoR0QsV0FBaUIsR0FBRztRQU1uQixNQUFNLFFBQVEsR0FBRyxJQUFJLE1BQU0sQ0FBQztZQUMzQixpQkFBaUI7WUFDakIsZ0JBQWdCO1lBQ2hCLG9CQUFvQjtZQUNwQixzQkFBc0I7WUFDdEIsOENBQThDO1lBQzlDLCtDQUErQztZQUMvQywrQ0FBK0M7U0FDL0MsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBRXJDLHlGQUF5RjtRQUM5RSw4QkFBMEIsR0FBRyxJQUFJLENBQUM7UUFFN0MsMEZBQTBGO1FBQy9FLDRCQUF3QixHQUFHLEtBQUssQ0FBQztRQU01QyxTQUFnQixHQUFHLENBQUMsV0FBbUIsRUFBRSxFQUFFLEdBQUcsUUFBOEI7WUFDM0UsSUFBSSxRQUFRLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7Z0JBQzVDLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLFFBQVEsR0FBRyxDQUFDLENBQUM7YUFDbEQ7WUFDRCxJQUFJLE9BQU8sR0FBZ0IsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN6RCxnQkFBZ0I7WUFDaEIsMEJBQTBCO1lBQzFCLEtBQUssSUFBSSxLQUFLLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDOUMsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRTtvQkFDckIsd0NBQXdDO29CQUN4QyxvR0FBb0c7b0JBQ3BHLElBQUk7b0JBQ0osMEJBQTBCO29CQUMxQiw0REFBNEQ7b0JBQzVELE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQ25EO3FCQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUU7b0JBQzNCLE9BQU8sQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7aUJBQzdCO3FCQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7b0JBQzlCLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQzFDO3FCQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7b0JBQzlCLE9BQU8sQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7aUJBQ2pEO3FCQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7b0JBQzlCLE9BQU8sQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDNUQ7cUJBQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtvQkFDOUIsT0FBTyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7aUJBQ2pGO3FCQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7b0JBQzlCLE9BQU8sQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2lCQUNsRjtnQkFDRCxzQkFBc0I7YUFDdEI7WUFDRCxLQUFLLElBQUksUUFBUSxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxVQUFVLENBQWUsRUFBRTtnQkFDaEYsSUFBSSxJQUFJLEdBQVcsUUFBUSxDQUFDLElBQUksQ0FBQztnQkFDakMsSUFBSSxDQUFDLElBQUk7b0JBQUUsSUFBSSxHQUFHLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNsRSxJQUFJLENBQUMsSUFBSTtvQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7Z0JBQzlELElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7b0JBQUUsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNsRSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQzFCLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQzt3QkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLEtBQUssT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsb0JBQW9CLElBQUksWUFBWSxDQUFDLENBQUM7b0JBQzNILElBQUksQ0FBQyxJQUFBLHdCQUF3QixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUM7d0JBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDO29CQUM1RyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDO2lCQUN6QjtxQkFBTTtvQkFDTixJQUFJLElBQUEsMEJBQTBCLElBQUksT0FBTyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxTQUFTO3dCQUNuRSxNQUFNLElBQUksS0FBSyxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsdUJBQXVCLElBQUksYUFBYSxDQUFDLENBQUM7b0JBQzVGLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7aUJBQ3pDO2FBQ0Q7WUFDRCxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLFVBQVUsQ0FBc0IsQ0FBQyxDQUFDO1lBQ3JGLE9BQU8sT0FBTyxDQUFDO1FBQ2hCLENBQUM7UUEvQ2UsT0FBRyxNQStDbEIsQ0FBQTtRQUtELFNBQWdCLE1BQU0sQ0FBQyxRQUFnQixFQUFFLE1BQTRCO1lBQ3BFLElBQUksT0FBTyxNQUFNLElBQUksUUFBUSxFQUFFO2dCQUM5QixNQUFNLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQWUsQ0FBQztnQkFDdEQsSUFBSSxDQUFDLE1BQU07b0JBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO2FBQzlEO1lBQ0QsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUMzQixJQUFJLGNBQWMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2hFLFFBQVEsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUNyQyxNQUFNLEdBQUcsQ0FBQyxNQUFNLElBQUksUUFBUSxDQUFDLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBZSxDQUFDO2dCQUMxRSxJQUFJLENBQUMsTUFBTTtvQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUM7YUFDOUQ7WUFDRCxJQUFJLEtBQUssR0FBRyxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUMsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDekQsSUFBSSxLQUFLO2dCQUFFLE9BQU8sS0FBSyxDQUFDO1lBRXhCLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDdEIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0QixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFqQmUsVUFBTSxTQWlCckIsQ0FBQTtJQUNGLENBQUMsRUFoR2dCLEdBQUcsR0FBSCxVQUFHLEtBQUgsVUFBRyxRQWdHbkI7QUFFRixDQUFDLEVBcEdTLE1BQU0sS0FBTixNQUFNLFFBb0dmO0FDcEdELElBQVUsTUFBTSxDQXdKZjtBQXhKRCxXQUFVLE1BQU07SUFDZixJQUFpQixHQUFHLENBc0puQjtJQXRKRCxXQUFpQixHQUFHO1FBQ25CLFNBQWdCLE9BQU8sQ0FBQyxHQUFXLEVBQUUsRUFBa0M7WUFDdEUsSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztZQUM3RCxTQUFTLFNBQVMsQ0FBQyxLQUFvQjtnQkFDdEMsSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLElBQUksRUFBRTtvQkFDdkIsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO2lCQUNWO1lBQ0YsQ0FBQztZQUNELGdCQUFnQixDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN2QyxPQUFPLEdBQUcsRUFBRSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBVGUsV0FBTyxVQVN0QixDQUFBO1FBRU0sS0FBSyxVQUFVLFVBQVUsQ0FBQyxFQUFZO1lBQzVDLElBQUksT0FBTyxHQUFHLE9BQUEsdUJBQXVCLENBQUMsb0JBQW9CLElBQUksT0FBQSx1QkFBdUIsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN0RyxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFO2dCQUNoQyxJQUFJLEVBQUUsSUFBSSxLQUFLO29CQUFFLE9BQU87Z0JBQ3hCLE1BQU0sUUFBUSxDQUFDLGVBQWUsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2FBQ25EO2lCQUFNO2dCQUNOLElBQUksRUFBRSxJQUFJLElBQUk7b0JBQUUsT0FBTztnQkFDdkIsTUFBTSxRQUFRLENBQUMsY0FBYyxFQUFFLENBQUM7YUFDaEM7WUFDRCxJQUFJLE9BQU8sRUFBRTtnQkFDWixPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7YUFDekI7UUFDRixDQUFDO1FBWnFCLGNBQVUsYUFZL0IsQ0FBQTtRQUVELFNBQWdCLE9BQU8sQ0FBQyxVQUEyQixFQUFFLEVBQTBCO1lBQzlFLElBQUksT0FBTyxVQUFVLElBQUksUUFBUTtnQkFBRSxVQUFVLEdBQUcsVUFBVSxHQUFHLEVBQUUsQ0FBQztZQUNoRSx3QkFBd0I7WUFDeEIsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDLENBQUM7WUFDdkQsSUFBSSxPQUFPLEVBQUU7Z0JBQ1osZ0JBQWdCLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNqQyxPQUFPO2FBQ1A7WUFDRCxpQkFBaUI7WUFDakIsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRTtnQkFDakMsVUFBVSxHQUFHLFFBQVEsVUFBVSxFQUFFLENBQUM7YUFDbEM7aUJBQU0sSUFBSSxVQUFVLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtnQkFDbEMsVUFBVSxHQUFHLE1BQU0sVUFBVSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7YUFDOUM7WUFDRCxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLEVBQUU7Z0JBQ2hDLElBQUksRUFBRSxDQUFDLElBQUksSUFBSSxVQUFVO29CQUFFLE9BQU87Z0JBQ2xDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNSLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQWxCZSxXQUFPLFVBa0J0QixDQUFBO1FBRUQsU0FBZ0IsWUFBWSxDQUFDLEdBQVc7WUFDdkMsSUFBSSxHQUFHLElBQUksUUFBUSxFQUFFO2dCQUNwQixnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELE9BQU87YUFDUDtZQUNELE9BQU8sT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFOZSxnQkFBWSxlQU0zQixDQUFBO1FBRUQsU0FBZ0IsZ0JBQWdCO1lBQy9CLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRmUsb0JBQWdCLG1CQUUvQixDQUFBO1FBSUQsU0FBZ0IsUUFBUSxDQUFlLEtBQWM7WUFDcEQsS0FBSyxLQUFLLElBQUksQ0FBQztZQUNmLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztZQUNiLEtBQUssSUFBSSxDQUFDLElBQUksS0FBSyxFQUFFO2dCQUNwQixJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5QyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQzthQUNuQjtZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQVJlLFlBQVEsV0FRdkIsQ0FBQTtRQUVELFNBQWdCLElBQUk7WUFDbkIsd0NBQXdDO1FBQ3pDLENBQUM7UUFGZSxRQUFJLE9BRW5CLENBQUE7UUFFRCxTQUFnQixpQkFBaUI7WUFDaEMsT0FBTyxRQUFRLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuRCxDQUFDO1FBRmUscUJBQWlCLG9CQUVoQyxDQUFBO1FBRUQsU0FBZ0IsNEJBQTRCLENBQUMsYUFBcUIsUUFBUSxDQUFDLFFBQVEsR0FBRyxNQUFNO1lBQzNGLElBQUksUUFBUSxHQUFHLGdDQUFnQyxVQUFVLEVBQUUsQ0FBQztZQUM1RCxJQUFJLFVBQVUsR0FBRyxpQkFBaUIsRUFBRSxHQUFHLEVBQUUsQ0FBQztZQUMxQyxZQUFZLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUMzQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO2dCQUM5QixJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksVUFBVSxFQUFFO29CQUNqRCxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7aUJBQ2xCO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBVGUsZ0NBQTRCLCtCQVMzQyxDQUFBO1FBRVUsY0FBVSxHQUtqQixVQUFVLEtBQUssR0FBRyxJQUFJO1lBQ3pCLElBQUksSUFBQSxVQUFVLENBQUMsTUFBTTtnQkFBRSxJQUFBLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUN4QyxJQUFBLFVBQVUsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1lBQ3pCLElBQUEsVUFBVSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDekIsU0FBUyxPQUFPLENBQUMsS0FBMkM7Z0JBQzNELElBQUksS0FBSyxDQUFDLGdCQUFnQjtvQkFBRSxPQUFPO2dCQUNuQyxJQUFJLEtBQUssQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDLFFBQVE7b0JBQUUsT0FBTztnQkFDNUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLFdBQVcsR0FBRyxJQUFBLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDNUUsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3hCLENBQUM7WUFDRCxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDNUQsSUFBQSxVQUFVLENBQUMsR0FBRyxHQUFHLEdBQUcsRUFBRTtnQkFDckIsSUFBQSxVQUFVLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztnQkFDMUIsbUJBQW1CLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzVDLENBQUMsQ0FBQTtRQUNGLENBQUMsQ0FBQTtRQUNELElBQUEsVUFBVSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFDMUIsSUFBQSxVQUFVLENBQUMsR0FBRyxHQUFHLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUkzQixTQUFnQixLQUFLLENBQUMsQ0FBYTtZQUNsQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7WUFDaEIsS0FBSyxLQUFLO2dCQUNULE9BQU8sSUFBSSxFQUFFO29CQUNaLE1BQU0sT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUN0QixDQUFDLEVBQUUsQ0FBQztpQkFDSjtZQUNGLENBQUMsRUFBRSxDQUFDO1lBQ0osT0FBTyxHQUFHLEVBQUUsR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFUZSxTQUFLLFFBU3BCLENBQUE7UUFFRCxJQUFJLGNBQThCLENBQUM7UUFDbkMsSUFBSSxlQUFlLEdBQXVELEVBQUUsQ0FBQztRQUM3RSxJQUFJLGtCQUFrQixHQUFHLENBQUMsQ0FBQztRQUMzQixTQUFnQixjQUFjLENBQUMsQ0FBaUQ7WUFDL0UsSUFBSSxDQUFDLGNBQWMsRUFBRTtnQkFDcEIsa0JBQWtCLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7Z0JBQ2hELGNBQWMsR0FBRyxJQUFJLGNBQWMsQ0FBQyxPQUFPLENBQUMsRUFBRTtvQkFDN0MsS0FBSyxJQUFJLENBQUMsSUFBSSxPQUFPLEVBQUU7d0JBQ3RCLElBQUksQ0FBQyxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUMsSUFBSTs0QkFBRSxTQUFTO3dCQUV4QyxJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQzt3QkFDMUMsS0FBSyxJQUFJLENBQUMsSUFBSSxlQUFlLEVBQUU7NEJBQzlCLENBQUMsQ0FBQyxhQUFhLEVBQUUsa0JBQWtCLENBQUMsQ0FBQzt5QkFDckM7d0JBQ0Qsa0JBQWtCLEdBQUcsYUFBYSxDQUFDO3FCQUNuQztnQkFDRixDQUFDLENBQUMsQ0FBQztnQkFDSCxjQUFjLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUN0QztZQUNELGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEIsT0FBTyxTQUFTLGNBQWM7Z0JBQzdCLGVBQWUsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BELENBQUMsQ0FBQTtRQUNGLENBQUM7UUFwQmUsa0JBQWMsaUJBb0I3QixDQUFBO0lBQ0YsQ0FBQyxFQXRKZ0IsR0FBRyxHQUFILFVBQUcsS0FBSCxVQUFHLFFBc0puQjtBQUNGLENBQUMsRUF4SlMsTUFBTSxLQUFOLE1BQU0sUUF3SmY7QUFFRCxxQkFBcUI7QUFDckIsMkJBQTJCO0FBQzNCLElBQUk7QUM1SkosSUFBVSxNQUFNLENBd0xmO0FBeExELFdBQVUsTUFBTTtJQUVmLElBQWlCLGNBQWMsQ0FvTDlCO0lBcExELFdBQWlCLGNBQWM7UUFHbkIsdUJBQVEsR0FBZ0IsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLENBQUM7UUFFbkQsb0JBQUssR0FBVSxJQUFJLENBQUM7UUFDL0IsS0FBSyxVQUFVLFNBQVM7WUFDdkIsSUFBSSxlQUFBLEtBQUs7Z0JBQUUsT0FBTyxlQUFBLEtBQUssQ0FBQztZQUN4QixlQUFBLEtBQUssR0FBRyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbkMsT0FBTyxlQUFBLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxTQUFTLE9BQU8sQ0FBQyxRQUFnQixFQUFFLE1BQWU7WUFDakQsSUFBSSxNQUFNLElBQUksSUFBSTtnQkFBRSxPQUFPLEtBQUssQ0FBQztZQUNqQyxPQUFPLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxRQUFRLElBQUksTUFBTSxDQUFDO1FBQ3hDLENBQUM7UUFFTSxLQUFLLFVBQVUsTUFBTSxDQUFDLEdBQVcsRUFBRSxPQUFzQixFQUFFO1lBQ2pFLElBQUksS0FBSyxHQUFHLE1BQU0sU0FBUyxFQUFFLENBQUM7WUFDOUIsSUFBSSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RDLElBQUksUUFBUSxFQUFFO2dCQUNiLFFBQVEsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzVELElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDO29CQUMzQyxPQUFPLFFBQVEsQ0FBQzthQUNqQjtZQUNELFFBQVEsR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxHQUFHLGVBQUEsUUFBUSxFQUFFLEdBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN0RCxJQUFJLFFBQVEsQ0FBQyxFQUFFLEVBQUU7Z0JBQ2hCLFFBQVEsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUMvQixJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzdCLElBQUksSUFBSSxHQUFpQjtvQkFDeEIsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVO29CQUNsRCxPQUFPLEVBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxHQUFHLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztpQkFDNUUsQ0FBQztnQkFDRixJQUFJLGNBQWMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNwRCxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxjQUFjLENBQUMsQ0FBQzthQUMvQjtZQUNELE9BQU8sUUFBUSxDQUFDO1FBQ2pCLENBQUM7UUFwQnFCLHFCQUFNLFNBb0IzQixDQUFBO1FBRU0sS0FBSyxVQUFVLFNBQVMsQ0FBQyxHQUFXLEVBQUUsT0FBc0IsRUFBRTtZQUNwRSxJQUFJLFFBQVEsR0FBRyxNQUFNLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdkMsSUFBSSxJQUFJLEdBQUcsTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDakMsSUFBSSxNQUFNLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUM3QixJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNwRCxJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1lBQ2hCLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3RCLEdBQUcsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQztZQUNqQyxPQUFPLEdBQUcsQ0FBQztRQUNaLENBQUM7UUFWcUIsd0JBQVMsWUFVOUIsQ0FBQTtRQUdNLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBVyxFQUFFLE9BQXNCLEVBQUU7WUFDOUQsSUFBSSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsR0FBRyxlQUFBLFFBQVEsRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDLENBQUM7WUFDMUQsSUFBSSxJQUFJLEdBQUcsTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDakMsSUFBSSxNQUFNLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUM3QixJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNwRCxJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1lBQ2hCLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3RCLEdBQUcsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQztZQUNqQyxPQUFPLEdBQUcsQ0FBQztRQUNaLENBQUM7UUFWcUIsa0JBQUcsTUFVeEIsQ0FBQTtRQUVNLEtBQUssVUFBVSxNQUFNLENBQUMsR0FBVztZQUN2QyxJQUFJLENBQUMsR0FBRyxPQUFBLGdCQUFnQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2pDLElBQUksSUFBSSxHQUFHLElBQUksY0FBYyxFQUFFLENBQUM7WUFDaEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLElBQUksQ0FBQyxZQUFZLEdBQUcsVUFBVSxDQUFDO1lBQy9CLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDWixNQUFNLENBQUMsQ0FBQztZQUNSLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUN6QixDQUFDO1FBVHFCLHFCQUFNLFNBUzNCLENBQUE7UUFFTSxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQVcsRUFBRSxPQUFvQixFQUFFO1lBQzdELE9BQU8sS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFFLEdBQUcsZUFBQSxRQUFRLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFGcUIsbUJBQUksT0FFekIsQ0FBQTtRQUVNLEtBQUssVUFBVSxVQUFVO1lBQy9CLGVBQUEsS0FBSyxHQUFHLElBQUksQ0FBQztZQUNiLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBSHFCLHlCQUFVLGFBRy9CLENBQUE7UUFFTSxLQUFLLFVBQVUsT0FBTyxDQUFDLEdBQVc7WUFDeEMsSUFBSSxLQUFLLEdBQUcsTUFBTSxTQUFTLEVBQUUsQ0FBQztZQUM5QixPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUIsQ0FBQztRQUhxQixzQkFBTyxVQUc1QixDQUFBO1FBRU0sS0FBSyxVQUFVLFFBQVEsQ0FBQyxHQUFXLEVBQUUsVUFBNkQsRUFBRTtZQUMxRyxJQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUU7Z0JBQ3RCLElBQUksTUFBTSxHQUFHLE1BQU0sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMvQixJQUFJLE1BQU0sRUFBRTtvQkFDWCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7aUJBQ2hFO2dCQUNELElBQUksT0FBTyxDQUFDLFNBQVMsSUFBSSxNQUFNO29CQUFFLE9BQU8sS0FBSyxDQUFDO2FBQzlDO1lBQ0QsSUFBSSxLQUFLLEdBQUcsTUFBTSxTQUFTLEVBQUUsQ0FBQztZQUM5QixJQUFJLFFBQVEsR0FBRyxNQUFNLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLFFBQVE7Z0JBQUUsT0FBTyxLQUFLLENBQUM7WUFDNUIsSUFBSSxPQUFPLE9BQU8sRUFBRSxNQUFNLElBQUksUUFBUSxFQUFFO2dCQUN2QyxJQUFJLFFBQVEsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdkQsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQy9DLE9BQU8sS0FBSyxDQUFDO2lCQUNiO2FBQ0Q7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFsQnFCLHVCQUFRLFdBa0I3QixDQUFBO1FBSU0sS0FBSyxVQUFVLFVBQVUsQ0FBQyxHQUFXLEVBQUUsT0FBMEIsRUFBRTtZQUN6RSxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7Z0JBQ25CLElBQUksTUFBTSxHQUFHLE1BQU0sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMvQixJQUFJLE1BQU0sRUFBRTtvQkFDWCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO3dCQUMzQyxPQUFBLGVBQWUsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQVcsRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO3dCQUMzRSxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUM7cUJBQ25CO2lCQUNEO2FBQ0Q7WUFDRCxJQUFJLFFBQVEsR0FBRyxNQUFNLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdkMsSUFBSSxJQUFJLEdBQUcsTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDakMsSUFBSSxDQUFDLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxFQUFFO2dCQUN4QixPQUFBLGVBQWUsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDL0Q7WUFDRCxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7Z0JBQ25CLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUNyQztZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQW5CcUIseUJBQVUsYUFtQi9CLENBQUE7UUFHRCxJQUFJLG1CQUFtQixHQUF1QyxJQUFJLENBQUM7UUFDbkUsSUFBSSxXQUFXLEdBQWdCLElBQUksQ0FBQztRQUVwQyxLQUFLLFVBQVUsT0FBTztZQUNyQixJQUFJLFdBQVc7Z0JBQUUsT0FBTyxXQUFXLENBQUM7WUFDcEMsSUFBSSxNQUFNLG1CQUFtQixFQUFFO2dCQUM5QixPQUFPLFdBQVcsQ0FBQzthQUNuQjtZQUNELElBQUksR0FBRyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbEMsR0FBRyxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUMsRUFBRTtnQkFDN0IsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztnQkFDcEIsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQy9ELENBQUMsQ0FBQTtZQUNELG1CQUFtQixHQUFHLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUMxQyxHQUFHLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztnQkFDbEIsR0FBRyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7WUFDakIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEMsV0FBVyxHQUFHLG1CQUFtQixHQUFHLE1BQU0sbUJBQW1CLENBQUM7WUFDOUQsSUFBSSxDQUFDLFdBQVc7Z0JBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1lBQzlELE9BQU8sV0FBVyxDQUFDO1FBQ3BCLENBQUM7UUFFTSxLQUFLLFVBQVUsUUFBUTtZQUM3QixNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3hCLENBQUM7UUFGcUIsdUJBQVEsV0FFN0IsQ0FBQTtRQUdELEtBQUssVUFBVSxNQUFNLENBQUMsR0FBVztZQUNoQyxJQUFJLEVBQUUsR0FBRyxNQUFNLE9BQU8sRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUM5QyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN6QyxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN0QixFQUFFLENBQUMsU0FBUyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2xDLEVBQUUsQ0FBQyxPQUFPLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2pDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssVUFBVSxNQUFNLENBQUMsR0FBVyxFQUFFLElBQWEsRUFBRSxRQUFpQjtZQUNsRSxJQUFJLEVBQUUsR0FBRyxNQUFNLE9BQU8sRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUMvQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RGLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3RCLEVBQUUsQ0FBQyxTQUFTLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDbEMsRUFBRSxDQUFDLE9BQU8sR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDakMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0lBRUYsQ0FBQyxFQXBMZ0IsY0FBYyxHQUFkLHFCQUFjLEtBQWQscUJBQWMsUUFvTDlCO0FBRUYsQ0FBQyxFQXhMUyxNQUFNLEtBQU4sTUFBTSxRQXdMZjtBQ3hMRCxJQUFVLE1BQU0sQ0FtVmY7QUFuVkQsV0FBVSxNQUFNO0lBRWYsSUFBaUIsc0JBQXNCLENBZ1Z0QztJQWhWRCxXQUFpQixzQkFBc0I7UUFFdEM7OztXQUdHO1FBQ0gsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDO1FBSWxCLFNBQVMsU0FBUyxDQUFDLGFBQStDO1lBQ2pFLE9BQU8sT0FBTyxhQUFhLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ2pGLENBQUM7UUFFRCxNQUFhLGFBQWE7WUFDekIsU0FBUyxDQUFjO1lBQ3ZCLGFBQWEsQ0FBbUM7WUFDaEQsWUFBWSxhQUErQyxFQUFFLFVBQTRCLE1BQU07Z0JBQzlGLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO2dCQUNuQyxJQUFJLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLGFBQWEsRUFBRTtvQkFDbkIsMkRBQTJEO29CQUMzRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7aUJBQ2Y7cUJBQU0sSUFBSSxPQUFPLElBQUksTUFBTSxFQUFFO29CQUM3QixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztvQkFDeEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztpQkFDckI7Z0JBQ0QsSUFBSSxPQUFPLElBQUksS0FBSyxFQUFFO29CQUNyQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7aUJBQ2I7Z0JBQ0QsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNkLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBaUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7Z0JBQzFHLE9BQUEsR0FBRyxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztZQUNoRCxDQUFDO1lBRUQsT0FBTyxHQUFrQixFQUFFLENBQUM7WUFDNUIsVUFBVSxHQUErQixJQUFJLE9BQU8sRUFBRSxDQUFDO1lBSXZELE9BQU8sQ0FBQyxFQUFnQjtnQkFDdkIsSUFBSSxDQUFDLEVBQUU7b0JBQUUsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdkQsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxJQUFJLEVBQUU7b0JBQ1YsSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQzNCLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztpQkFDOUI7Z0JBQ0QsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsYUFBYSxHQUFHLEtBQUssQ0FBQztZQUN0QixjQUFjLEdBQUcsS0FBSyxDQUFDO1lBQ3ZCLGFBQWEsQ0FBQyxPQUFPLEdBQUcsS0FBSztnQkFDNUIsSUFBSSxJQUFJLENBQUMsYUFBYTtvQkFBRSxPQUFPO2dCQUMvQixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztnQkFDMUIsSUFBSSxPQUFPO29CQUFFLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO2dCQUN4QyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDakMsQ0FBQztZQUVELE9BQU8sR0FBcUIsRUFBRSxDQUFDO1lBQy9CLGtCQUFrQixHQUFHLEtBQUssQ0FBQztZQUMzQixTQUFTLENBQUMsTUFBc0I7Z0JBQy9CLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMxQixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFCLENBQUM7WUFDRCxVQUFVLENBQUMsRUFBZTtnQkFDekIsRUFBRSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7Z0JBQ3JELEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUU3QixJQUFJLElBQUksR0FBUyxFQUFVLENBQUM7Z0JBQzVCLEtBQUssSUFBSSxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtvQkFDaEMsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDL0IsSUFBSSxDQUFDLE9BQU8sSUFBSSxPQUFPLElBQUksSUFBSTt3QkFBRSxTQUFTO29CQUMxQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFO3dCQUN4QixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQzt3QkFDN0IsU0FBUztxQkFDVDtvQkFDRCxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO3dCQUN2QixJQUFJLFFBQVEsSUFBSSxRQUFRLElBQUksSUFBSSxFQUFFOzRCQUNqQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQzt5QkFDOUI7d0JBQ0QsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUN0QixDQUFDLENBQUMsQ0FBQTtpQkFDRjtnQkFDRCxJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtvQkFDNUIsRUFBRSxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2lCQUNqRDtnQkFDRCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxPQUFPLENBQThGLFdBQWlDLEVBQUUsSUFBVSxFQUFFLElBQVEsRUFBRSxNQUFTO2dCQUN0SyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUN0QixJQUFJLElBQUksR0FBRyxJQUFJLFdBQVcsQ0FBQyxJQUFVLENBQUMsQ0FBQztnQkFDdkMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDaEIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsT0FBTyxHQUFvQixFQUFFLENBQUM7WUFDOUIsT0FBTyxHQUFvQixFQUFFLENBQUM7WUFDOUIsU0FBUyxHQUFzQixFQUFFLENBQUM7WUFFbEMsU0FBUyxDQUFDLEVBQVUsRUFBRSxNQUFzQixFQUFFLE9BQTRCLEVBQUU7Z0JBQzNFLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyx1QkFBQSxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUNqRSxDQUFDO1lBR0QsVUFBVSxDQUE0QixFQUFVLEVBQUUsTUFBOEIsRUFBRSxJQUFxQztnQkFDdEgsSUFBSSxPQUFPLElBQUksSUFBSSxRQUFRLElBQUksQ0FBQyxJQUFJLEVBQUU7b0JBQ3JDLElBQUksR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFTLEVBQUUsQ0FBQztpQkFDNUI7Z0JBQ0QsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLHVCQUFBLFdBQVcsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLENBQUM7WUFDRCxVQUFVLENBQUMsRUFBVSxFQUFFLEtBQThDLEVBQUUsSUFBNkI7Z0JBQ25HLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyx1QkFBQSxXQUFXLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNyRSxDQUFDO1lBQ0QsWUFBWSxDQUFDLEVBQVUsRUFBRSxJQUEyQjtnQkFDbkQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLHVCQUFBLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDNUQsQ0FBQztZQUNELFNBQVMsQ0FBNEIsRUFBVSxFQUFFLE1BQXlCLEVBQUUsT0FBcUMsRUFBRTtnQkFDbEgsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLHVCQUFBLE1BQU0sRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLENBQUM7WUFDRCxXQUFXLENBQUMsRUFBVSxFQUFFLFFBQTBCLEVBQUUsT0FBOEIsRUFBRTtnQkFDbkYsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLHVCQUFBLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZFLENBQUM7WUFDRCxTQUFTLENBQUMsRUFBVSxFQUFFLE1BQXdCLEVBQUUsT0FBOEIsRUFBRTtnQkFDL0UsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLHVCQUFBLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQ3JFLENBQUM7WUFDRCxpQkFBaUIsQ0FBQyxLQUFhLFFBQVEsRUFBRSxPQUFvQyxFQUFFO2dCQUM5RSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsdUJBQUEsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZFLENBQUM7WUFFRCxhQUFhO2dCQUNaLEtBQUssSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtvQkFDNUIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDNUIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO29CQUNqQixLQUFLLElBQUksTUFBTSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7d0JBQ2hDLEtBQUssR0FBRyxLQUFLLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7cUJBQ3hDO29CQUNELEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQy9DO1lBQ0YsQ0FBQztZQUVELGNBQWMsR0FBa0IsRUFBRSxDQUFDO1lBQ25DLFNBQVMsR0FBbUIsS0FBSyxDQUFDO1lBQ2xDLFdBQVc7Z0JBQ1YsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDO29CQUFFLE9BQU87Z0JBQ3JDLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLElBQUksQ0FBQztvQkFBRSxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7Z0JBQ3hFLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQztvQkFBRSxPQUFPO2dCQUVyQyxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO2dCQUMzQixJQUFJLEtBQUssR0FBMEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxRSxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUM7Z0JBQ2xCLEtBQUssSUFBSSxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtvQkFDaEMsSUFBSSxNQUFNLENBQUMsSUFBSSxJQUFJLEtBQUssRUFBRTt3QkFDekIsS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQzNCLE1BQU0sR0FBRyxLQUFLLENBQUM7cUJBQ2Y7aUJBQ0Q7Z0JBQ0QsT0FBTyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDL0IsSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLE1BQU0sRUFBRTtvQkFDN0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO3dCQUMxRCxJQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyx5QkFBeUIsQ0FBQyxDQUFDO3dCQUM5RCxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDbEMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDO3dCQUNyQixFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7cUJBQ1o7aUJBQ0Q7cUJBQU07b0JBQ04sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTt3QkFDcEIsSUFBSSxNQUFNLEVBQUU7NEJBQ1gsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7NEJBQ2pDLENBQUMsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO3lCQUN6RDs2QkFBTTs0QkFDTix5RUFBeUU7NEJBQ3pFLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDOzRCQUM5QixDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDOzRCQUMxQyxDQUFDLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsc0JBQXNCLENBQUMsQ0FBQzt5QkFDekQ7b0JBQ0YsQ0FBQyxDQUFDLENBQUM7aUJBQ0g7Z0JBQ0QsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUM7WUFDL0IsQ0FBQztZQUVELGFBQWE7Z0JBQ1osSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztnQkFDM0IsSUFBSSxLQUFLLEdBQTBCLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUUsS0FBSyxJQUFJLFFBQVEsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO29CQUNwQyxLQUFLLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxFQUFFO3dCQUN6QixRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztxQkFDckI7aUJBQ0Q7WUFDRixDQUFDO1lBRUQsU0FBUyxDQUFDLElBQXFDO2dCQUM5QyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQXFCLENBQUMsRUFBRTtvQkFDakQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBcUIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNwRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFxQixDQUFDLENBQUM7aUJBQ3pDO2dCQUNELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBdUIsQ0FBQyxFQUFFO29CQUNyRCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUF1QixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQXVCLENBQUMsQ0FBQztpQkFDN0M7WUFDRixDQUFDO1lBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsY0FBYztnQkFDbkMsSUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7Z0JBQzNCLElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJO29CQUFFLE9BQU87Z0JBRWxDLElBQUksT0FBTyxHQUFHLE9BQU8sSUFBSSxDQUFDLGFBQWEsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFFdEcsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLE1BQU0sRUFBRTtvQkFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNO3dCQUFFLE9BQU87b0JBQzVCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDZCxPQUFPO2lCQUNQO2dCQUNELElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxLQUFLO29CQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUVwQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO29CQUN4QyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUFDLE9BQU87aUJBQzdCO2dCQUVELElBQUksT0FBTyxFQUFFO29CQUNaLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztvQkFDaEMsSUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7aUJBQzVCO2dCQUNELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtvQkFDcEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7aUJBQ2hDO2dCQUNELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO29CQUMxRCxzQ0FBc0M7aUJBQ3RDO2dCQUNELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO2dCQUN2QixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDbkIsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3RCLENBQUM7WUFFRCxlQUFlLENBQUMsWUFBc0I7Z0JBQ3JDLEtBQUssSUFBSSxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtvQkFDaEMsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRTt3QkFDckMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztxQkFDekI7aUJBQ0Q7Z0JBQ0QsS0FBSyxJQUFJLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO29CQUNoQyxJQUFJLFlBQVksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFO3dCQUNyQyxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO3FCQUN6QjtpQkFDRDtnQkFDRCxLQUFLLElBQUksUUFBUSxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7b0JBQ3BDLElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEVBQUU7d0JBQ3ZDLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7cUJBQzNCO2lCQUNEO1lBQ0YsQ0FBQztZQUVELEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRTtnQkFDWCxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN2QixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFO2dCQUNsQixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzFFLEtBQUssQ0FBQyxTQUFTLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBc0NqQixHQUFHLENBQUMsQ0FBQztZQUNQLENBQUM7WUFFRCxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQ25CLFFBQVEsR0FBcUIsS0FBSyxDQUFDO1lBQ25DLE9BQU8sQ0FBQyxJQUFhO2dCQUNwQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztnQkFDckIsSUFBSSxJQUFJLElBQUksTUFBTTtvQkFBRSxJQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQztnQkFDM0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN6QixDQUFDO1lBQ0QsTUFBTTtnQkFDTCxJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztnQkFDdEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN0QixDQUFDO1lBRUQsS0FBSztnQkFDSixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO2dCQUNqRCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBQ2pELElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDbkQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2YsQ0FBQztZQUVELElBQUksTUFBTTtnQkFDVCxPQUFPLElBQUksQ0FBQyxPQUFPO3FCQUNqQixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUM7cUJBQ3JELEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QixDQUFDO1NBRUQ7UUE1VFksb0NBQWEsZ0JBNFR6QixDQUFBO1FBRUQsU0FBUyxTQUFTLENBQUksQ0FBcUI7WUFDMUMsSUFBSSxDQUFDLENBQUM7Z0JBQUUsT0FBTyxLQUFLLENBQUM7WUFDckIsT0FBTyxPQUFRLENBQW9CLENBQUMsSUFBSSxJQUFJLFVBQVUsQ0FBQztRQUN4RCxDQUFDO0lBQ0YsQ0FBQyxFQWhWZ0Isc0JBQXNCLEdBQXRCLDZCQUFzQixLQUF0Qiw2QkFBc0IsUUFnVnRDO0FBQ0YsQ0FBQyxFQW5WUyxNQUFNLEtBQU4sTUFBTSxRQW1WZjtBQ25WRCxJQUFVLE1BQU0sQ0FJZjtBQUpELFdBQVUsTUFBTTtJQUNmLE1BQWEsUUFBUTtLQUVwQjtJQUZZLGVBQVEsV0FFcEIsQ0FBQTtBQUNGLENBQUMsRUFKUyxNQUFNLEtBQU4sTUFBTSxRQUlmO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQWlDRTtBQ3ZDRixJQUFVLE1BQU0sQ0FzVGY7QUF0VEQsV0FBVSxNQUFNO0lBRWYsSUFBaUIsaUJBQWlCLENBZ1RqQztJQWhURCxXQUFpQixpQkFBaUI7UUF3QmpDLE1BQWEsUUFBUTtZQUNwQixHQUFHLENBQVc7WUFFZCxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ2YsU0FBUyxDQUE2QjtZQUN0QyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ1gsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUNoQixPQUFPLEdBQUcsS0FBSyxDQUFDO1lBRWhCLE1BQU0sQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLENBQUM7WUFDOUIsTUFBTSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDdkIsTUFBTSxDQUFDLHdCQUF3QixDQUFhO1lBQzVDLE1BQU0sQ0FBQyxxQkFBcUI7Z0JBQzNCLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSxFQUFFLENBQUM7Z0JBQ3RDLFNBQVMsV0FBVyxDQUFDLEtBQWlCO29CQUNyQyxJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQzt3QkFBRSxPQUFPO29CQUM5QixJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBaUIsQ0FBQztvQkFDckMsSUFBSSxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQzt3QkFBRSxPQUFPO29CQUNqQyxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ3ZCLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM1RCxRQUFRLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDbEQsQ0FBQztnQkFDRCxTQUFTLFNBQVMsQ0FBQyxLQUFvQjtvQkFDdEMsSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLFVBQVU7d0JBQUUsT0FBTztvQkFDckMsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUN2QixJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDNUQsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQWlCLENBQUM7b0JBQ3JDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNsRCxDQUFDO2dCQUNELFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBQ3BELFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ2hELFFBQVEsQ0FBQyx3QkFBd0IsR0FBRyxHQUFHLEVBQUU7b0JBQ3hDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7b0JBQ3ZELFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3BELENBQUMsQ0FBQTtZQUNGLENBQUM7WUFDRCxNQUFNLENBQUMsU0FBUyxHQUFlLEVBQUUsQ0FBQztZQUVsQyxZQUFZO1lBQ1osSUFBSTtnQkFDSCxJQUFJLENBQUMsUUFBUSxDQUFDLHdCQUF3QixFQUFFO29CQUN2QyxRQUFRLENBQUMscUJBQXFCLEVBQUUsQ0FBQztpQkFDakM7Z0JBQ0QsSUFBSSxJQUFJLENBQUMsT0FBTztvQkFBRSxPQUFPO2dCQUN6QixRQUFRLENBQUMsZ0JBQWdCLENBQWdCLG1CQUFtQixFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDbkcsUUFBUSxDQUFDLGdCQUFnQixDQUFZLGVBQWUsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN2RixRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQixDQUFDO1lBQ0QsbUJBQW1CLENBQUMsS0FBb0I7Z0JBQ3ZDLElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQUU7b0JBQzdCLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ3hCLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7aUJBQ2xDO2dCQUNELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7b0JBQ2pDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztpQkFDdEI7WUFDRixDQUFDO1lBQUEsQ0FBQztZQUNGLGVBQWUsQ0FBQyxLQUFnQjtnQkFDL0IsSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxFQUFFO29CQUM1QyxxQkFBcUIsQ0FBQyxHQUFHLEVBQUU7d0JBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFBRTs0QkFDOUIsT0FBTyxDQUFDLElBQUksQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDOzRCQUNuRCxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQzt5QkFDaEI7NkJBQU07NEJBQ04sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO3lCQUN0QjtvQkFDRixDQUFDLENBQUMsQ0FBQztpQkFDSDtZQUNGLENBQUM7WUFDRCxpQkFBaUI7Z0JBQ2hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTztvQkFBRSxPQUFPLEtBQUssQ0FBQztnQkFDaEMsSUFBSSxJQUFJLENBQUMsT0FBTztvQkFBRSxPQUFPLElBQUksQ0FBQztnQkFDOUIsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO29CQUNuQixJQUFJLE9BQU8sSUFBSSxDQUFDLFNBQVMsSUFBSSxVQUFVLEVBQUU7d0JBQ3hDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFOzRCQUFFLE9BQU8sS0FBSyxDQUFDO3FCQUNwQzt5QkFBTTt3QkFDTixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDOzRCQUFFLE9BQU8sS0FBSyxDQUFDO3FCQUM5QztpQkFDRDtnQkFDRCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxLQUFLLENBQUMsY0FBYztnQkFDbkIsSUFBSSxJQUFJLENBQUMsT0FBTztvQkFBRSxPQUFPO2dCQUN6QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2QsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7Z0JBQ3BCLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDakIsTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQztnQkFDckIsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQixDQUFDO1lBQ0QsS0FBSyxDQUFzQjtZQUczQixXQUFXO1lBQ1gsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUUsTUFBYyxFQUFFLFNBQWtCLFFBQVEsQ0FBQyxJQUFJO2dCQUNsRixJQUFJLE1BQU0sR0FBNEIsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDckUsU0FBUyxJQUFJLENBQUMsS0FBb0I7b0JBQ2pDLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLElBQUksQ0FBQyxFQUFFO3dCQUMvQixPQUFPLENBQUMsSUFBSSxDQUFDLHlDQUF5QyxDQUFDLENBQUM7cUJBQ3hEO29CQUNELG1CQUFtQixDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNoRCxDQUFDO2dCQUNELGdCQUFnQixDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM1QyxNQUFNLENBQUMsSUFBSSxDQUFnQixtQkFBbUIsRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDakYsQ0FBQztZQUNELFNBQVM7Z0JBQ1IsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQWMsaUJBQWlCLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN4RSxDQUFDO1lBQ0QsVUFBVSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsUUFBUTtnQkFDbEMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQWUsa0JBQWtCLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNwRyxDQUFDO1lBQ0QsT0FBTztnQkFDTixRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBWSxlQUFlLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNwRSxDQUFDO1lBR0QsYUFBYTtZQUNiLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBVSxFQUFFLE9BQU8sR0FBRyxJQUFJLEVBQUUsTUFBTSxHQUFHLENBQUM7Z0JBQ3pELElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO2dCQUNoQixJQUFJLENBQUMsR0FBRyxPQUFPLElBQUksUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDL0MsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQ2xDLElBQUksR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNoQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDdEYsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQ3JDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUNqQixDQUFDO1lBQ0QsS0FBSyxDQUFDLG1CQUFtQixDQUFDLElBQVUsRUFBRSxPQUFPLEdBQUcsSUFBSTtnQkFDbkQsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxHQUFHLE9BQU8sSUFBSSxRQUFRLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMvQyxDQUFDLEVBQUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztnQkFDbEMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxHQUFHLEdBQUcsTUFBTSxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDeEMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQ3JDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUNqQixDQUFDO1lBQ0QsUUFBUSxDQUFDLE1BQWdCO2dCQUN4QixRQUFRLENBQUMsRUFBRSxDQUFNLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDaEMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFO3dCQUNYLEdBQUcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3FCQUMvRDtvQkFDRCxpQkFBaUI7Z0JBQ2xCLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUdELGlCQUFpQjtZQUNqQixLQUFLLENBQUMsTUFBZ0IsRUFBRSxTQUFtQixNQUFNO2dCQUNoRCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDaEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNO29CQUFFLE9BQU87Z0JBQzFCLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2hDLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDO29CQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztnQkFDekUsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDO2dCQUM1QixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDcEMsQ0FBQztZQUNELFdBQVcsQ0FBQyxNQUFnQixFQUFFLFNBQW1CLE1BQU07Z0JBQ3RELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNoQyxJQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNsQyxJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLE1BQU07b0JBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO2dCQUNwRixPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMvQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDekMsQ0FBQztZQUNELE9BQU8sQ0FBQyxNQUFnQixFQUFFLFNBQW1CLE1BQU07Z0JBQ2xELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNoQyxJQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNsQyxJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLE1BQU07b0JBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUN2RSxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3pDLENBQUM7WUFHRCxPQUFPO1lBQ1AsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFVO2dCQUMxQixJQUFJLE9BQU8sSUFBSSxJQUFJLFFBQVEsRUFBRTtvQkFDNUIsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQzt3QkFBRSxPQUFPLElBQVcsQ0FBQztvQkFDaEQsSUFBSSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQU0sSUFBSSxDQUFDLENBQUM7aUJBQzdCO2dCQUNELElBQUksSUFBSSxDQUFDLE9BQU8sSUFBSSxHQUFHO29CQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQztnQkFDeEUsT0FBUSxJQUEwQixDQUFDLElBQVcsQ0FBQztZQUNoRCxDQUFDO1lBQ0QsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFVO2dCQUM3QixJQUFJLE9BQU8sSUFBSSxJQUFJLFFBQVEsRUFBRTtvQkFDNUIsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQzt3QkFBRSxPQUFPLElBQUksQ0FBQztvQkFDekMsT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFNLElBQUksQ0FBQyxDQUFDO2lCQUM3QjtnQkFDRCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxNQUFNLENBQUMsVUFBVSxDQUFJLElBU3BCO2dCQUNBLElBQUksQ0FBQyxHQUFHLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ3ZCLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ25CLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsQ0FBQztZQUVELE9BQU8sQ0FBTTtZQUNiLElBQUksQ0FRRjtZQUNGLFVBQVUsQ0FBQyxJQVdWO2dCQUNBLFNBQVMsT0FBTyxDQUFJLENBQXVCO29CQUMxQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO3dCQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUMvQixJQUFJLENBQUMsSUFBSSxJQUFJO3dCQUFFLE9BQU8sRUFBRSxDQUFDO29CQUN6QixPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1osQ0FBQztnQkFDRCxTQUFTLFdBQVcsQ0FBQyxDQUEwQztvQkFDOUQsSUFBSSxDQUFDLENBQUM7d0JBQUUsT0FBTyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUM7b0JBQzFCLElBQUksT0FBTyxDQUFDLElBQUksUUFBUTt3QkFBRSxPQUFPLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN2RCxPQUFPLENBQUMsQ0FBQztnQkFDVixDQUFDO2dCQUNELFNBQVMsT0FBTyxDQUFDLENBQWE7b0JBQzdCLElBQUksQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDO3dCQUFFLE9BQU8sSUFBSSxDQUFDO29CQUMvQixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyQyxDQUFDO2dCQUNELFNBQVMsT0FBTyxDQUFDLENBQWE7b0JBQzdCLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztnQkFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztnQkFDcEIsSUFBSSxDQUFDLElBQUksR0FBRztvQkFDWCxTQUFTLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7b0JBQ3RDLFFBQVEsRUFBRSxPQUFPLENBQVcsSUFBSSxDQUFDLFFBQVEsQ0FBQzt5QkFDeEMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDckMsR0FBRyxFQUFFLE9BQU8sQ0FBVyxJQUFJLENBQUMsR0FBRyxDQUFDO29CQUNoQyxLQUFLLEVBQUUsT0FBTyxDQUFXLElBQUksQ0FBQyxLQUFLLENBQUM7b0JBQ3BDLEtBQUssRUFBRSxPQUFPLENBQVcsSUFBSSxDQUFDLEtBQUssQ0FBQztvQkFDcEMsT0FBTyxFQUFFLE9BQU8sQ0FBVyxJQUFJLENBQUMsT0FBTyxDQUFDO29CQUN4QyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQzNELENBQUM7Z0JBQ0YsSUFBSSxDQUFDLFNBQVMsR0FBRyxHQUFHLEVBQUU7b0JBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTt3QkFBRSxPQUFPLEtBQUssQ0FBQztvQkFDekMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQzt3QkFBRSxPQUFPLEtBQUssQ0FBQztvQkFDMUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQzt3QkFBRSxPQUFPLEtBQUssQ0FBQztvQkFDNUMsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQyxDQUFDO2dCQUNGLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUU7b0JBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDOUM7Z0JBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLElBQUksRUFBRTtvQkFDdkIsc0NBQXNDO29CQUN0QyxNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDO29CQUNyQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7b0JBQ2pELElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNqQyxJQUFJLEdBQUc7d0JBQUUsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDL0QsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN4QyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzVDLE1BQU0sSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUM7Z0JBQ3BCLENBQUMsQ0FBQTtZQUNGLENBQUM7O1FBL1FXLDBCQUFRLFdBa1JwQixDQUFBO1FBS1ksMEJBQVEsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUksUUFBUSxFQUFFLENBQUMsQ0FBQztJQUNuRyxDQUFDLEVBaFRnQixpQkFBaUIsR0FBakIsd0JBQWlCLEtBQWpCLHdCQUFpQixRQWdUakM7SUFFWSxlQUFRLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxDQUFDO0FBRXBELENBQUMsRUF0VFMsTUFBTSxLQUFOLE1BQU0sUUFzVGY7QUN0VEQsSUFBVSxNQUFNLENBc0hmO0FBdEhELFdBQVUsTUFBTTtJQUNmLElBQWlCLHVCQUF1QixDQW9IdkM7SUFwSEQsV0FBaUIsdUJBQXVCO1FBRTVCLDRDQUFvQixHQUFHLEtBQUssQ0FBQztRQUM3QixtQ0FBVyxHQUFHLEtBQUssQ0FBQztRQUUvQixTQUFnQixjQUFjLENBQUMsUUFBaUI7WUFDL0MsSUFBSSx3QkFBQSxvQkFBb0I7Z0JBQUUsT0FBTztZQUNqQyxJQUFJLFFBQVE7Z0JBQUUsd0JBQUEsV0FBVyxHQUFHLFFBQVEsQ0FBQztZQUNyQyx3QkFBQSxvQkFBb0IsR0FBRyxJQUFJLENBQUM7WUFDNUIsU0FBUyxPQUFPLENBQUMsS0FBMkM7Z0JBQzNELElBQUksS0FBSyxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsT0FBTztvQkFBRSxPQUFPO2dCQUM1QyxJQUFJLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRTtvQkFDcEQsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO2lCQUN2QjtZQUNGLENBQUM7WUFDRCxRQUFRLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ3JFLE9BQU8sd0JBQUEsaUJBQWlCLEdBQUcsR0FBRyxFQUFFO2dCQUMvQix3QkFBQSxvQkFBb0IsR0FBRyxLQUFLLENBQUM7Z0JBQzdCLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDckQsQ0FBQyxDQUFDO1FBQ0gsQ0FBQztRQWZlLHNDQUFjLGlCQWU3QixDQUFBO1FBQ0QsU0FBZ0IsVUFBVTtZQUN6QixnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEVBQUU7Z0JBQ25DLElBQUksS0FBSyxDQUFDLElBQUksSUFBSSxXQUFXLEVBQUU7b0JBQzlCLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ3JCO2dCQUNELElBQUksS0FBSyxDQUFDLElBQUksSUFBSSxZQUFZLEVBQUU7b0JBQy9CLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNwQjtZQUNGLENBQUMsQ0FBQyxDQUFBO1FBQ0gsQ0FBQztRQVRlLGtDQUFVLGFBU3pCLENBQUE7UUFDVSx5Q0FBaUIsR0FBRyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFFekMsU0FBZ0IsaUJBQWlCLENBQUMsR0FBWTtZQUM3QyxJQUFJLElBQUksR0FBRyxHQUFHLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUN2QyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFdBQVcsR0FBRyxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUhlLHlDQUFpQixvQkFHaEMsQ0FBQTtRQUVELFNBQWdCLGVBQWU7WUFDOUIsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLHdCQUFBLFdBQVcsQ0FBdUIsQ0FBQztZQUNuRCxJQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUNyQyxJQUFJLElBQUksR0FBRyxHQUFHLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDdkMsT0FBTztvQkFDTixHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUs7b0JBQ2hCLFFBQVEsRUFBRSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksV0FBVztvQkFDdEQsV0FBVyxFQUFFLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksV0FBVyxHQUFHLENBQUM7b0JBQzVELGVBQWUsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxXQUFXLEdBQUcsQ0FBQztvQkFDL0QsVUFBVSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsV0FBVyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUM7b0JBQ3hFLGNBQWMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQztpQkFDdkQsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDL0MsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBZGUsdUNBQWUsa0JBYzlCLENBQUE7UUFFVSwrQ0FBdUIsR0FBRyxLQUFLLENBQUM7UUFFM0MsU0FBZ0IsYUFBYTtZQUM1QixPQUFPLGVBQWUsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDO1FBQzFFLENBQUM7UUFGZSxxQ0FBYSxnQkFFNUIsQ0FBQTtRQUNELFNBQWdCLGdCQUFnQixDQUFDLEdBQUcsR0FBRyxDQUFDO1lBQ3ZDLElBQUksd0JBQUEsdUJBQXVCO2dCQUFFLE9BQU8sSUFBSSxDQUFDO1lBQ3pDLCtEQUErRDtZQUMvRCxJQUFJLENBQUMsR0FBRztnQkFBRSxPQUFPLEtBQUssQ0FBQztZQUV2QixHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNyQixJQUFJLEtBQUssR0FBRyxlQUFlLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDNUQsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0QsSUFBSSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzlDLE9BQ0MsS0FBSyxDQUFDLGdCQUFnQixHQUFHLEdBQUcsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEdBQUcsR0FBRyxDQUFDLENBQUMsZUFBZSxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFO2dCQUNyRixnQkFBZ0IsSUFBSSxHQUFHLENBQUM7WUFDMUIsT0FBTyxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ2xDLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUV6QyxTQUFTLGFBQWEsQ0FBQyxJQUFnQztnQkFDdEQsSUFBSSxDQUFDLElBQUk7b0JBQUUsT0FBTyxLQUFLLENBQUM7Z0JBQ3hCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxlQUFlLElBQUksQ0FBQyxJQUFJLE9BQU8sSUFBSSxDQUFDLEVBQUU7b0JBQ3hELE9BQU8sS0FBSyxDQUFDO2lCQUNiO2dCQUNELElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRTtvQkFDeEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsQ0FBQztpQkFDMUI7cUJBQU07b0JBQ04sUUFBUSxDQUFDLE9BQU8sRUFBRSxPQUFPLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2lCQUNsRDtnQkFDRCx3QkFBQSx1QkFBdUIsR0FBRyxJQUFJLENBQUM7Z0JBQy9CLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLHdCQUFBLHVCQUF1QixHQUFHLEtBQUssQ0FBQyxDQUFDO2dCQUMzRCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCw4QkFBOEI7WUFDOUIsSUFBSSxDQUFDLE9BQU87Z0JBQUUsT0FBTyxLQUFLLENBQUM7WUFFM0IsaURBQWlEO1lBQ2pELElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVztnQkFBRSxPQUFPLEtBQUssQ0FBQztZQUV2Qyx3REFBd0Q7WUFDeEQsSUFBSSxPQUFPLENBQUMsVUFBVSxFQUFFO2dCQUN2QixPQUFPLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUMzQjtZQUVELDZGQUE2RjtZQUM3RixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEdBQUcsRUFBRTtnQkFDOUMsT0FBTyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDM0I7WUFFRCwrREFBK0Q7WUFDL0QsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLE9BQU8sQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLE9BQU8sQ0FBQyxlQUFlLEdBQUcsV0FBVyxHQUFHLENBQUMsRUFBRTtnQkFDaEYsT0FBTyxLQUFLLENBQUM7YUFDYjtZQUNELElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksT0FBTyxDQUFDLGVBQWUsR0FBRyxDQUFDLFdBQVcsR0FBRyxDQUFDLEVBQUU7Z0JBQ2pHLE9BQU8sS0FBSyxDQUFDO2FBQ2I7WUFFRCxPQUFPLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBeERlLHdDQUFnQixtQkF3RC9CLENBQUE7SUFDRixDQUFDLEVBcEhnQix1QkFBdUIsR0FBdkIsOEJBQXVCLEtBQXZCLDhCQUF1QixRQW9IdkM7QUFDRixDQUFDLEVBdEhTLE1BQU0sS0FBTixNQUFNLFFBc0hmO0FDdEhELG1DQUFtQztBQUNuQyx5Q0FBeUM7QUFDekMscUNBQXFDO0FBQ3JDLGlDQUFpQztBQUNqQyxxREFBcUQ7QUFDckQsaUNBQWlDO0FBQ2pDLG1DQUFtQztBQUNuQyxvQ0FBb0M7QUFDcEMsc0NBQXNDO0FBQ3RDLGlEQUFpRDtBQUNqRCxxREFBcUQ7QUFDckQscUNBQXFDO0FBTXJDLElBQVUsTUFBTSxDQW9EZjtBQXBERCxXQUFVLE1BQU07SUFFZixTQUFnQixRQUFRLENBQUMsTUFBYztRQUN0QyxJQUFJLENBQUMsTUFBTTtZQUFFLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBZ0IsQ0FBQztRQUVsRCxNQUFNLENBQUMsR0FBRyxHQUFHLE9BQUEsR0FBRyxDQUFDLEdBQUcsQ0FBQztRQUNyQixNQUFNLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBQSxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDaEYsTUFBTSxDQUFDLEVBQUUsR0FBRyxPQUFBLGFBQWEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ3JDLE9BQUEsZUFBZSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxPQUFBLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUUsT0FBQSxlQUFlLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLE9BQUEsYUFBYSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNoRixPQUFBLGVBQWUsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsT0FBQSxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN0RixPQUFBLGVBQWUsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsT0FBQSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5RSxPQUFBLGVBQWUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsT0FBQSxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hGLE9BQUEsZUFBZSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxPQUFBLGFBQWEsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFbEYsT0FBQSxlQUFlLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBQSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0RSxPQUFBLGVBQWUsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFBLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RFLE9BQUEsZUFBZSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQUEsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFcEUsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsT0FBQSxjQUFjLENBQUMsTUFBYSxDQUFDO1FBQ25ELE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLE9BQUEsY0FBYyxDQUFDLEdBQVUsQ0FBQztRQUM3QyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxPQUFBLGNBQWMsQ0FBQyxJQUFXLENBQUM7UUFDL0MsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLE9BQUEsY0FBYyxDQUFDLFNBQVMsQ0FBQztRQUNuRCxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsT0FBQSxjQUFjLENBQUMsU0FBUyxDQUFDO1FBQ25ELE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLE9BQUEsY0FBYyxDQUFDLFNBQVMsQ0FBQztRQUNsRCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBQSxjQUFjLENBQUMsVUFBVSxDQUFDO1FBQ3JELE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxPQUFBLGNBQWMsQ0FBQyxVQUFVLENBQUM7UUFDckQsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsT0FBQSxjQUFjLENBQUMsUUFBUSxDQUFDO1FBQ2hELE9BQUEsZUFBZSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMvRCxPQUFBLGVBQWUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFL0QsT0FBQSxlQUFlLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxhQUFhLEVBQUUsT0FBQSxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDaEYsT0FBQSxlQUFlLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxjQUFjLEVBQUUsT0FBQSxlQUFlLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDbEYsbUVBQW1FO1FBRW5FLE9BQUEsZUFBZSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLE9BQUEsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlELE9BQUEsZUFBZSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxPQUFBLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxRSxPQUFBLGVBQWUsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsT0FBQSxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFNUUsTUFBTSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBZSxDQUFDO1FBQ3pDLE1BQU0sQ0FBQyxjQUFjLEdBQUcsTUFBTSxDQUFDLHVCQUF1QixDQUFDO1FBRXZELE9BQUEsZUFBZSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDbEUsT0FBTyxRQUFRLENBQUM7SUFDakIsQ0FBQztJQTFDZSxlQUFRLFdBMEN2QixDQUFBO0lBRUQsT0FBQSxlQUFlLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFFekUsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRTtRQUNqQyxNQUFNLENBQUMsUUFBUSxDQUFDO0tBQ2hCO0FBRUYsQ0FBQyxFQXBEUyxNQUFNLEtBQU4sTUFBTSxRQW9EZjtBQ3pENEYsQ0FBQztBQ1o5RixJQUFVLE1BQU0sQ0FzRmY7QUF0RkQsV0FBVSxNQUFNO0lBQ2YsSUFBaUIsc0JBQXNCLENBb0Z0QztJQXBGRCxXQUFpQixzQkFBc0I7UUFFdEMsTUFBYSxZQUFZO1lBQ3hCLEVBQUUsR0FBVyxFQUFFLENBQUM7WUFDaEIsSUFBSSxDQUFVO1lBQ2QsV0FBVyxDQUFVO1lBQ3JCLFFBQVEsR0FBWSxLQUFLLENBQUM7WUFDMUIsSUFBSSxHQUFTLEtBQUssQ0FBQztZQUNuQixNQUFNLENBQWdCO1lBQ3RCLE1BQU0sQ0FBb0I7WUFDMUIsWUFBWSxDQUFZO1lBQ3hCLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFFZixZQUFZLElBQXdCO2dCQUNuQyxJQUFJLENBQUMsTUFBTSxLQUFLLGdCQUFnQixDQUFDO2dCQUNqQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFMUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFDNUIsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUMxQixXQUFXLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQzVDLENBQUM7Z0JBQ0YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDMUMsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO29CQUNkLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDOUI7Z0JBQ0QsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO29CQUNyQixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO2lCQUNyQztnQkFDRCxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSyxFQUFFO29CQUN2QixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQ2pDO2dCQUNELElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtvQkFDaEIsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2lCQUNaO1lBQ0YsQ0FBQztZQUVELEtBQUssQ0FBQyxLQUFpQjtnQkFDdEIsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLEtBQUssRUFBRTtvQkFDdkIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDdEIsT0FBTztpQkFDUDtnQkFDRCxJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU07b0JBQUUsT0FBTztnQkFDeEMsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksRUFBRTtvQkFDdEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO2lCQUNwRDtxQkFBTTtvQkFDTixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFBO2lCQUN0QjtZQUNGLENBQUM7WUFFRCxXQUFXLENBQUMsS0FBaUI7Z0JBQzVCLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDdkIsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLFVBQVUsRUFBRTtvQkFDNUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztpQkFDNUI7cUJBQU07b0JBQ04sSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztpQkFDdkI7WUFDRixDQUFDO1lBRUQsVUFBVSxDQUFDLElBQVUsRUFBRSxLQUFLLEdBQUcsS0FBSztnQkFDbkMsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUs7b0JBQUUsT0FBTztnQkFDeEMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDMUMsSUFBSSxJQUFJLElBQUksS0FBSyxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUU7b0JBQ3ZDLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztpQkFDL0M7Z0JBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUM3QixDQUFDO1lBRUQsTUFBTTtnQkFDTCxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3hCLENBQUM7WUFFRCxJQUFJO2dCQUNILElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO2dCQUNwQixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDNUIsQ0FBQztZQUNELElBQUk7Z0JBQ0gsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7Z0JBQ25CLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztZQUMzQixDQUFDO1NBRUQ7UUFoRlksbUNBQVksZUFnRnhCLENBQUE7SUFFRixDQUFDLEVBcEZnQixzQkFBc0IsR0FBdEIsNkJBQXNCLEtBQXRCLDZCQUFzQixRQW9GdEM7QUFDRixDQUFDLEVBdEZTLE1BQU0sS0FBTixNQUFNLFFBc0ZmO0FDdEZELDBDQUEwQztBQUUxQyxJQUFVLE1BQU0sQ0FtUWY7QUFuUUQsV0FBVSxNQUFNO0lBQ2YsSUFBaUIsc0JBQXNCLENBaVF0QztJQWpRRCxXQUFpQixzQkFBc0I7UUFFdEMsTUFBYSxNQUFhLFNBQVEsdUJBQUEsWUFBa0I7WUFHbkQsWUFBWSxJQUF3QjtnQkFDbkMsSUFBSSxDQUFDLE1BQU0sS0FBSyx5Q0FBeUMsQ0FBQztnQkFDMUQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2IsQ0FBQztZQUVELHdDQUF3QztZQUN4QyxLQUFLLENBQUMsSUFBVSxFQUFFLEVBQWU7Z0JBQ2hDLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLO29CQUFFLE9BQU8sSUFBSSxDQUFDO2dCQUNwQyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM3QyxJQUFJLE1BQU0sR0FBRyxPQUFPLEtBQUssSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDMUQsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUk7b0JBQUUsT0FBTyxNQUFNLENBQUM7Z0JBQ3JDLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxVQUFVO29CQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDN0MsQ0FBQztTQUNEO1FBaEJZLDZCQUFNLFNBZ0JsQixDQUFBO1FBRUQsTUFBYSxXQUE2QyxTQUFRLHVCQUFBLFlBQWtCO1lBRW5GLEtBQUssQ0FBbUI7WUFDeEIsU0FBUyxDQUFJO1lBRWIsWUFBWSxJQUFnQztnQkFDM0MsSUFBSSxDQUFDLE1BQU0sS0FBSyx5Q0FBeUMsQ0FBQztnQkFDMUQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNaLElBQUksSUFBSSxHQUFHLE9BQU8sSUFBSSxDQUFDLEtBQUssSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO2dCQUM3RCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDdkMsSUFBSSxLQUFLLEdBQUcsY0FBYyxJQUFJLFdBQVcsS0FBSyxHQUFHLENBQUM7Z0JBQ2xELElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFVLEtBQUssRUFDOUIsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQ3RCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6QixDQUFDO1lBRUQsTUFBTTtnQkFDTCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzVCLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxLQUFLLEVBQUU7b0JBQzVCLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO29CQUN2QixJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO2lCQUM1QjtZQUNGLENBQUM7WUFFRCx3Q0FBd0M7WUFDeEMsS0FBSyxDQUFDLElBQVUsRUFBRSxFQUFlO2dCQUNoQyxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSztvQkFBRSxPQUFPLElBQUksQ0FBQztnQkFDcEMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNuRCxJQUFJLE1BQU0sR0FBRyxPQUFPLEtBQUssSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDMUQsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUk7b0JBQUUsT0FBTyxNQUFNLENBQUM7Z0JBQ3JDLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxVQUFVO29CQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDN0MsQ0FBQztZQUVELFFBQVE7Z0JBQ1AsSUFBSSxLQUFLLEdBQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBTSxDQUFDO2dCQUM5RixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7U0FDRDtRQXJDWSxrQ0FBVyxjQXFDdkIsQ0FBQTtRQUVELE1BQWEsV0FBa0IsU0FBUSx1QkFBQSxZQUFrQjtZQUV4RCxLQUFLLENBQW1CO1lBQ3hCLFNBQVMsQ0FBUztZQUNsQixPQUFPLENBQTZCO1lBRXBDLFlBQVksSUFBNkI7Z0JBQ3hDLElBQUksQ0FBQyxNQUFNLEtBQUsseUNBQXlDLENBQUM7Z0JBQzFELElBQUksQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM1QyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ1osSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUMxRCxJQUFJLEtBQUssR0FBRywyQkFBMkIsS0FBSyxHQUFHLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFVLEtBQUssRUFDOUIsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQ3RCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6QixDQUFDO1lBRUQsTUFBTTtnQkFDTCxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUU7b0JBQ3ZDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7b0JBQ2xDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7aUJBQ3BEO1lBQ0YsQ0FBQztZQUVELEtBQUssQ0FBQyxJQUFVLEVBQUUsRUFBZTtnQkFDaEMsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLEtBQUs7b0JBQUUsT0FBTyxJQUFJLENBQUM7Z0JBQ3BDLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDaEQsT0FBTyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUM3QyxDQUFDO1lBRUQsdUVBQXVFO1lBQ3ZFLDJEQUEyRDtZQUMzRCx3Q0FBd0M7WUFDeEMsMENBQTBDO1lBQzFDLEtBQUs7WUFDTCwrQ0FBK0M7WUFDL0MsMkNBQTJDO1lBQzNDLG1CQUFtQjtZQUNuQixJQUFJO1lBQ0osZUFBZSxDQUFDLE1BQWM7Z0JBQzdCLE1BQU0sR0FBRyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3ZCLElBQUksTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDO29CQUFFLE9BQU8sR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO2dCQUMxQyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQ3pCLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNoRSxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7aUJBQzdDO2dCQUNELElBQUksTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtvQkFDM0IsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUM7d0JBQUUsT0FBTyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUM7b0JBQ3pDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNqRCxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztpQkFDL0I7Z0JBQ0QsSUFBSTtvQkFDSCxJQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsV0FBVyxFQUFFLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDdEQsSUFBSSxLQUFLLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUN0QyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztpQkFDdkM7Z0JBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRztnQkFBQSxDQUFDO2dCQUNoQixPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFDLENBQUM7U0FDRDtRQTFEWSxrQ0FBVyxjQTBEdkIsQ0FBQTtRQVVELE1BQWEsU0FBZ0IsU0FBUSx1QkFBQSxZQUFrQjtZQUN0RCxJQUFJLENBQW9CO1lBQ3hCLEtBQUssQ0FBbUI7WUFDeEIsYUFBYSxDQUFTO1lBRXRCLFNBQVMsR0FBVyxFQUFFLENBQUM7WUFDdkIsYUFBYSxDQUFlO1lBRzVCLFlBQVksSUFBMkI7Z0JBQ3RDLElBQUksQ0FBQyxNQUFNLEtBQUsseUNBQXlDLENBQUM7Z0JBQzFELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDWixJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBVSxtQkFBbUIsRUFDNUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQ3RCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDdEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7Z0JBRXhCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsSUFBSSxrQkFBa0IsQ0FBQztZQUMvRCxDQUFDO1lBRUQsS0FBSyxDQUFDLElBQVUsRUFBRSxFQUFlO2dCQUNoQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFFMUMsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQ3hDLElBQUksQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUMzQyxLQUFLLElBQUksR0FBRyxJQUFJLElBQUksRUFBRTt3QkFDckIsSUFBSSxHQUFHLEdBQUcsT0FBTyxHQUFHLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUM7d0JBQ3ZELElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ3pCLElBQUksR0FBRyxFQUFFOzRCQUNSLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQzs0QkFDVixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7eUJBQ25DO3FCQUNEO29CQUNELE9BQU8sQ0FBQyxDQUFDO2dCQUNWLENBQUMsQ0FBQyxDQUFDO2dCQUNILE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3BFLENBQUM7WUFDRCxjQUFjLENBQUMsR0FBeUI7Z0JBQ3ZDLElBQUksT0FBTyxHQUFHLElBQUksUUFBUTtvQkFBRSxPQUFPO2dCQUNuQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUNELFlBQVksQ0FBQyxHQUF5QixFQUFFLFFBQWlCO2dCQUN4RCxJQUFJLE9BQU8sR0FBRyxJQUFJLFFBQVE7b0JBQUUsT0FBTztnQkFDbkMsUUFBUTtnQkFDUixHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDdkMsQ0FBQztZQUVELE9BQU8sQ0FBQyxJQUFVLEVBQUUsRUFBZTtnQkFDbEMsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLElBQUksUUFBUTtvQkFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQWMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN2RSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkMsQ0FBQztZQUNELGFBQWEsQ0FBQyxJQUFVLEVBQUUsRUFBZTtnQkFDeEMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2xDLElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksUUFBUTtvQkFBRSxPQUFPLElBQWdCLENBQUM7Z0JBQ3hELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3JDLENBQUM7WUFFRCxNQUFNO2dCQUNMLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUs7b0JBQUUsT0FBTztnQkFDL0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztnQkFDbEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDdkQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUM3QixDQUFDO1lBRUQsWUFBWSxDQUFDLE9BQWU7Z0JBQzNCLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDZixJQUFJLENBQUMsT0FBTztvQkFBRSxPQUFPLEVBQUUsQ0FBQztnQkFFeEIsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUMxQixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDaEQsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNoRDtnQkFDRCxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQzVCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNoRCxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztpQkFDdkU7Z0JBQ0QsSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxFQUFFO29CQUMvQixPQUFPLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDL0IsT0FBTyxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUMsQ0FBQztpQkFDNUQ7Z0JBQ0QsSUFBSSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUM7b0JBQUUsT0FBTyxFQUFFLENBQUM7Z0JBQ2xDLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLElBQUksQ0FBQztvQkFBRSxPQUFPLEVBQUUsQ0FBQztnQkFDL0MsSUFBSTtvQkFDSCxJQUFJLENBQUMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBQ2pDLE9BQU8sQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2lCQUM1RDtnQkFBQyxPQUFPLENBQUMsRUFBRSxHQUFHO2dCQUNmLE9BQU8sQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDcEUsQ0FBQztTQUVEO1FBNUZZLGdDQUFTLFlBNEZyQixDQUFBO1FBRUQsTUFBYSxvQkFBMkIsU0FBUSx1QkFBQSxZQUFrQjtZQUNqRSxZQUFZLElBQXdCO2dCQUNuQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ1osSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2IsQ0FBQztZQUNELEtBQUs7Z0JBQ0osT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsUUFBUSxHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUM7WUFDN0MsYUFBYTtnQkFDWixJQUFJLElBQUksR0FBRyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDO2dCQUN0QyxLQUFLLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFO29CQUN0QyxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztvQkFDM0IsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDO2lCQUN4QjtnQkFDRCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxVQUFVO2dCQUNULElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO29CQUNsQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7aUJBQ1o7cUJBQU07b0JBQ04sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNaLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLFFBQVEsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7aUJBQzdEO1lBQ0YsQ0FBQztZQUVELEtBQUssQ0FBQyxJQUFJO2dCQUNULE9BQU0sSUFBSSxFQUFFO29CQUNYLE1BQU0sT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUN0QixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7aUJBQ2xCO1lBQ0YsQ0FBQztTQUNEO1FBbENZLDJDQUFvQix1QkFrQ2hDLENBQUE7SUFFRixDQUFDLEVBalFnQixzQkFBc0IsR0FBdEIsNkJBQXNCLEtBQXRCLDZCQUFzQixRQWlRdEM7QUFDRixDQUFDLEVBblFTLE1BQU0sS0FBTixNQUFNLFFBbVFmO0FDclFELElBQVUsTUFBTSxDQTJFZjtBQTNFRCxXQUFVLE1BQU07SUFDZixJQUFpQixzQkFBc0IsQ0F5RXRDO0lBekVELFdBQWlCLHNCQUFzQjtRQUV0QyxNQUFhLFFBQWUsU0FBUSx1QkFBQSxZQUFrQjtZQUlyRCxZQUFZLElBQTBCO2dCQUNyQyxJQUFJLENBQUMsTUFBTSxLQUFLLDJDQUEyQyxDQUFDO2dCQUM1RCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDYixDQUFDO1lBRUQsVUFBVSxDQUFDLElBQVUsRUFBRSxLQUFLLEdBQUcsS0FBSztnQkFDbkMsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUs7b0JBQUUsT0FBTztnQkFDeEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzVCLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQy9CLENBQUM7WUFFRCxLQUFLLENBQUMsSUFBVSxFQUFFLEVBQWU7Z0JBQ2hDLElBQUksT0FBTyxHQUFnQixFQUFFLENBQUMsWUFBWSxDQUFDLGVBQWUsSUFBSSxDQUFDLEVBQUUsT0FBTyxDQUFrQixDQUFDO2dCQUMzRixJQUFJLE9BQU8sSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWE7b0JBQUUsT0FBTztnQkFDeEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3pDLEVBQUUsQ0FBQyxZQUFZLENBQUMsZUFBZSxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNELENBQUM7U0FDRDtRQXJCWSwrQkFBUSxXQXFCcEIsQ0FBQTtRQUVELE1BQWEsUUFBZSxTQUFRLHVCQUFBLFlBQWtCO1lBUXJELFlBQVksSUFBMEI7Z0JBQ3JDLElBQUksQ0FBQyxNQUFNLEtBQUssMkNBQTJDLENBQUM7Z0JBQzVELElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZCLElBQUksQ0FBQyxlQUFlLEtBQUssV0FBVyxDQUFDO2dCQUNyQyxJQUFJLENBQUMsZ0JBQWdCLEtBQUssWUFBWSxDQUFDO2dCQUN2QyxJQUFJLENBQUMsR0FBRyxLQUFLLEtBQUssQ0FBQztnQkFDbkIsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2IsQ0FBQztZQUVELEtBQUssQ0FBQyxJQUFVLEVBQUUsRUFBZTtnQkFDaEMsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3hDLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtvQkFDaEIsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLEtBQUssRUFBRTt3QkFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7cUJBQzFEO3lCQUFNO3dCQUNOLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQzdDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztxQkFDOUQ7aUJBQ0Q7Z0JBQ0QsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO29CQUNqQixJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSyxFQUFFO3dCQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO3FCQUMzRDt5QkFBTTt3QkFDTixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUM5QyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztxQkFDL0Q7aUJBQ0Q7WUFDRixDQUFDO1lBRUQsVUFBVSxDQUFDLEVBQWUsRUFBRSxJQUFVO2dCQUNyQyxJQUFJLE9BQU8sSUFBSSxDQUFDLE1BQU0sSUFBSSxRQUFRLEVBQUU7b0JBQ25DLElBQUksSUFBSSxDQUFDLEdBQUc7d0JBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDeEMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7aUJBQzNCO3FCQUFNO29CQUNOLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQy9DLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2lCQUNwRDtZQUNGLENBQUM7U0FDRDtRQTlDWSwrQkFBUSxXQThDcEIsQ0FBQTtJQUVGLENBQUMsRUF6RWdCLHNCQUFzQixHQUF0Qiw2QkFBc0IsS0FBdEIsNkJBQXNCLFFBeUV0QztBQUNGLENBQUMsRUEzRVMsTUFBTSxLQUFOLE1BQU0sUUEyRWY7QUMzRUQsSUFBVSxNQUFNLENBeUNmO0FBekNELFdBQVUsTUFBTTtJQUNmLElBQWlCLHNCQUFzQixDQXVDdEM7SUF2Q0QsV0FBaUIsc0JBQXNCO1FBRXRDLE1BQWEsTUFBd0MsU0FBUSx1QkFBQSxZQUFrQjtZQUk5RSxZQUFZLElBQTJCO2dCQUN0QyxJQUFJLENBQUMsTUFBTSxLQUFLLHlDQUF5QyxDQUFDO2dCQUMxRCxJQUFJLENBQUMsVUFBVSxLQUFLLENBQUMsQ0FBSSxFQUFFLENBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMvRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDYixDQUFDO1lBRUQsVUFBVSxDQUFDLElBQVUsRUFBRSxLQUFLLEdBQUcsS0FBSztnQkFDbkMsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUs7b0JBQUUsT0FBTztnQkFDeEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzVCLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQy9CLENBQUM7WUFFRCxJQUFJLENBQUMsSUFBMkI7Z0JBQy9CLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLO29CQUFFLE9BQU8sSUFBSSxDQUFDO2dCQUNwQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQXNCLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBSSxFQUFFLENBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsSCxDQUFDO1lBRUQsNkJBQTZCO1lBQzdCLEtBQUssQ0FBQyxJQUFVLEVBQUUsRUFBZTtnQkFDaEMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pDLENBQUM7WUFFRCxPQUFPLENBQUMsQ0FBSSxFQUFFLENBQUk7Z0JBQ2pCLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLEVBQUU7b0JBQ3RCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7aUJBQzdCO2dCQUNELElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxVQUFVLEVBQUU7b0JBQzVCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7aUJBQzdCO2dCQUNELE9BQU8sQ0FBQyxDQUFDO1lBQ1YsQ0FBQztTQUNEO1FBbkNZLDZCQUFNLFNBbUNsQixDQUFBO0lBRUYsQ0FBQyxFQXZDZ0Isc0JBQXNCLEdBQXRCLDZCQUFzQixLQUF0Qiw2QkFBc0IsUUF1Q3RDO0FBQ0YsQ0FBQyxFQXpDUyxNQUFNLEtBQU4sTUFBTSxRQXlDZjtBQ3pDRCxJQUFVLE1BQU0sQ0FpSGY7QUFqSEQsV0FBVSxNQUFNO0lBRWYsSUFBaUIsc0JBQXNCLENBNEd0QztJQTVHRCxXQUFpQixzQkFBc0I7UUFxR3RDOzs7V0FHRztRQUNILElBQUksT0FBTyxHQUFHLEdBQUcsQ0FBQztJQUduQixDQUFDLEVBNUdnQixzQkFBc0IsR0FBdEIsNkJBQXNCLEtBQXRCLDZCQUFzQixRQTRHdEM7SUFFVSxTQUFFLEdBQUcsc0JBQXNCLENBQUMsYUFBYSxDQUFDO0FBQ3RELENBQUMsRUFqSFMsTUFBTSxLQUFOLE1BQU0sUUFpSGYiLCJzb3VyY2VzQ29udGVudCI6WyJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBQcm9taXNlRXh0ZW5zaW9uIHtcclxuXHRcdC8vIHR5cGUgVW53cmFwcGVkUHJvbWlzZTxUPiA9IFByb21pc2U8VD4gJiB7XHJcblx0XHQvLyBcdHJlc29sdmU6ICh2YWx1ZTogVCB8IFByb21pc2VMaWtlPFQ+KSA9PiB2b2lkO1xyXG5cdFx0Ly8gXHRyZWplY3Q6IChyZWFzb24/OiBhbnkpID0+IHZvaWQ7XHJcblx0XHQvLyBcdHI6ICh2YWx1ZTogVCB8IFByb21pc2VMaWtlPFQ+KSA9PiB2b2lkO1xyXG5cdFx0Ly8gXHRqOiAocmVhc29uPzogYW55KSA9PiB2b2lkO1xyXG5cdFx0Ly8gfVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBVbndyYXBwZWRQcm9taXNlPFQ+IGV4dGVuZHMgUHJvbWlzZTxUPiB7XHJcblx0XHRcdHJlc29sdmU6ICh2YWx1ZTogVCB8IFByb21pc2VMaWtlPFQ+KSA9PiB2b2lkO1xyXG5cdFx0XHRyZWplY3Q6IChyZWFzb24/OiBhbnkpID0+IHZvaWQ7XHJcblx0XHRcdHI6ICh2YWx1ZTogVCB8IFByb21pc2VMaWtlPFQ+KSA9PiB2b2lkO1xyXG5cdFx0XHRqOiAocmVhc29uPzogYW55KSA9PiB2b2lkO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogQ3JlYXRlcyB1bndyYXBwZWQgcHJvbWlzZVxyXG5cdFx0ICovXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZW1wdHk8VD4oKSB7XHJcblx0XHRcdGxldCByZXNvbHZlOiAodmFsdWU6IFQpID0+IHZvaWQ7XHJcblx0XHRcdGxldCByZWplY3Q6IChyZWFzb24/OiBhbnkpID0+IHZvaWQ7XHJcblx0XHRcdGxldCBwID0gbmV3IFByb21pc2U8VD4oKHIsIGopID0+IHtcclxuXHRcdFx0XHRyZXNvbHZlID0gcjtcclxuXHRcdFx0XHRyZWplY3QgPSBqO1xyXG5cdFx0XHR9KSBhcyBVbndyYXBwZWRQcm9taXNlPFQ+O1xyXG5cdFx0XHRwLnJlc29sdmUgPSBwLnIgPSByZXNvbHZlO1xyXG5cdFx0XHRwLnJlamVjdCA9IHAuaiA9IHJlamVjdDtcclxuXHRcdFx0cmV0dXJuIHA7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZyYW1lKG4gPSAxKTogUHJvbWlzZTxudW1iZXI+IHtcclxuXHRcdFx0d2hpbGUgKC0tbiA+IDApIHtcclxuXHRcdFx0XHRhd2FpdCBuZXcgUHJvbWlzZShyZXF1ZXN0QW5pbWF0aW9uRnJhbWUpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZShyZXF1ZXN0QW5pbWF0aW9uRnJhbWUpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn1cclxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vUHJvbWlzZS50c1wiIC8+XHJcbm5hbWVzcGFjZSBQb29wSnMge1xyXG5cdGV4cG9ydCBuYW1lc3BhY2UgQXJyYXlFeHRlbnNpb24ge1xyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBwbWFwPFQsIFY+KHRoaXM6IFRbXSwgbWFwcGVyOiAoZTogVCwgaTogbnVtYmVyLCBhOiBUW10pID0+IFByb21pc2U8Vj4gfCBWLCB0aHJlYWRzID0gNSk6IFByb21pc2U8VltdPiB7XHJcblx0XHRcdGlmICghKHRocmVhZHMgPiAwKSkgdGhyb3cgbmV3IEVycm9yKCk7XHJcblx0XHRcdGxldCB0YXNrczogW1QsIG51bWJlciwgVFtdXVtdID0gdGhpcy5tYXAoKGUsIGksIGEpID0+IFtlLCBpLCBhXSk7XHJcblx0XHRcdGxldCByZXN1bHRzID0gQXJyYXk8Vj4odGFza3MubGVuZ3RoKTtcclxuXHRcdFx0bGV0IGFueVJlc29sdmVkID0gUHJvbWlzZUV4dGVuc2lvbi5lbXB0eSgpO1xyXG5cdFx0XHRsZXQgZnJlZVRocmVhZHMgPSB0aHJlYWRzO1xyXG5cdFx0XHRhc3luYyBmdW5jdGlvbiBydW5UYXNrKHRhc2s6IFtULCBudW1iZXIsIFRbXV0pOiBQcm9taXNlPFY+IHtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGF3YWl0IG1hcHBlciguLi50YXNrKTtcclxuXHRcdFx0XHR9IGNhdGNoIChlcnIpIHtcclxuXHRcdFx0XHRcdHJldHVybiBlcnI7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGFzeW5jIGZ1bmN0aW9uIHJ1bih0YXNrKSB7XHJcblx0XHRcdFx0ZnJlZVRocmVhZHMtLTtcclxuXHRcdFx0XHRyZXN1bHRzW3Rhc2tbMV1dID0gYXdhaXQgcnVuVGFzayh0YXNrKTtcclxuXHRcdFx0XHRmcmVlVGhyZWFkcysrO1xyXG5cdFx0XHRcdGxldCBvbGRBbnlSZXNvbHZlZCA9IGFueVJlc29sdmVkO1xyXG5cdFx0XHRcdGFueVJlc29sdmVkID0gUHJvbWlzZUV4dGVuc2lvbi5lbXB0eSgpO1xyXG5cdFx0XHRcdG9sZEFueVJlc29sdmVkLnIodW5kZWZpbmVkKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRmb3IgKGxldCB0YXNrIG9mIHRhc2tzKSB7XHJcblx0XHRcdFx0aWYgKGZyZWVUaHJlYWRzID09IDApIHtcclxuXHRcdFx0XHRcdGF3YWl0IGFueVJlc29sdmVkO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRydW4odGFzayk7XHJcblx0XHRcdH1cclxuXHRcdFx0d2hpbGUgKGZyZWVUaHJlYWRzIDwgdGhyZWFkcykge1xyXG5cdFx0XHRcdGF3YWl0IGFueVJlc29sdmVkO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiByZXN1bHRzO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBtYXA8VCA9IG51bWJlcj4odGhpczogQXJyYXlDb25zdHJ1Y3RvciwgbGVuZ3RoOiBudW1iZXIsIG1hcHBlcjogKG51bWJlcikgPT4gVCA9IGkgPT4gaSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcyhsZW5ndGgpLmZpbGwoMCkubWFwKChlLCBpLCBhKSA9PiBtYXBwZXIoaSkpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiB2c29ydDxUPih0aGlzOiBUW10sIG1hcHBlcjogKGU6IFQsIGk6IG51bWJlciwgYTogVFtdKSA9PiBudW1iZXIsIHNvcnRlcj86ICgoYTogbnVtYmVyLCBiOiBudW1iZXIsIGFlOiBULCBiZTogVCkgPT4gbnVtYmVyKSB8IC0xKTogVFtdO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHZzb3J0PFQsIFY+KHRoaXM6IFRbXSwgbWFwcGVyOiAoZTogVCwgaTogbnVtYmVyLCBhOiBUW10pID0+IFYsIHNvcnRlcjogKChhOiBWLCBiOiBWLCBhZTogVCwgYmU6IFQpID0+IG51bWJlcikgfCAtMSk6IFRbXTtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiB2c29ydDxUPih0aGlzOiBUW10sIG1hcHBlcjogKGU6IFQsIGk6IG51bWJlciwgYTogVFtdKSA9PiBudW1iZXIsIHNvcnRlcjogKChhOiBudW1iZXIsIGI6IG51bWJlciwgYWU6IFQsIGJlOiBUKSA9PiBudW1iZXIpIHwgLTEgPSAoYSwgYikgPT4gYSAtIGIpOiBUW10ge1xyXG5cdFx0XHRsZXQgdGhlU29ydGVyID0gdHlwZW9mIHNvcnRlciA9PSAnZnVuY3Rpb24nID8gc29ydGVyIDogKGEsIGIpID0+IGIgLSBhO1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0XHRcdC5tYXAoKGUsIGksIGEpID0+ICh7IGUsIHY6IG1hcHBlcihlLCBpLCBhKSB9KSlcclxuXHRcdFx0XHQuc29ydCgoYSwgYikgPT4gdGhlU29ydGVyKGEudiwgYi52LCBhLmUsIGIuZSkpXHJcblx0XHRcdFx0Lm1hcChlID0+IGUuZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gZXhwb3J0IGludGVyZmFjZSBQTWFwRGF0YTxULCBWPiB7XHJcblx0XHQvLyBcdHNvdXJjZTogVFtdLFxyXG5cdFx0Ly8gXHRyZXN1bHQ6IChWIHwgdW5kZWZpbmVkKVtdLFxyXG5cdFx0Ly8gXHR0aHJlYWRzOiBudW1iZXIsXHJcblx0XHQvLyBcdHdpbmRvdzogbnVtYmVyLFxyXG5cdFx0Ly8gXHRjb21wbGV0ZWQ6IG51bWJlcixcclxuXHRcdC8vIFx0bGVuZ3RoOiBudW1iZXIsXHJcblx0XHQvLyB9XHJcblxyXG5cdFx0Ly8gZXhwb3J0IGZ1bmN0aW9uIHBtYXBfdjI8VCwgVj4odGhpczogVFtdLCBtYXBwZXI6IChlOiBULCBpOiBudW1iZXIsIHNvdXJjZTogVFtdLCBkYXRhOiBQTWFwRGF0YTxULCBWPikgPT4gViwgZGF0YTogUGFydGlhbDxQTWFwRGF0YTxULCBWPj4pOiBQcm9taXNlPFZbXT4ge1xyXG5cdFx0Ly8gXHRkYXRhID0gZGF0YSBhcyBQTWFwRGF0YTxULCBWPjtcclxuXHRcdC8vIFx0bGV0IHNvdXJjZTogVFtdID0gdGhpcztcclxuXHRcdC8vIFx0bGV0IHJlc3VsdDogKFYgfCB1bmRlZmluZWQpW10gPSBzb3VyY2UubWFwKGUgPT4gKTtcclxuXHRcdC8vIFx0bGV0IHRocmVhZHM6IG51bWJlciA9IGRhdGEudGhyZWFkcztcclxuXHRcdC8vIFx0bGV0IHdpbmRvdzogbnVtYmVyO1xyXG5cdFx0Ly8gXHRsZXQgY29tcGxldGVkOiBudW1iZXIgPSAwO1xyXG5cdFx0Ly8gXHRsZXQgbGVuZ3RoOiBudW1iZXIgPSB0aGlzLmxlbmd0aDtcclxuXHJcblx0XHQvLyBcdGRhdGEuXHJcblx0XHQvLyB9XHJcblxyXG5cdFx0dHlwZSBSZXNvbHZlYWJsZVByb21pc2U8VD4gPSBQcm9taXNlTGlrZTxUPiAmIHtcclxuXHRcdFx0cmVzb2x2ZSh2YWx1ZTogVCk6IHZvaWQ7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBQTWFwRGF0YTxULCBWLCBFID0gbmV2ZXI+IGV4dGVuZHMgUHJvbWlzZUxpa2U8KFYgfCBFKVtdPiB7XHJcblx0XHRcdC8qKiBPcmlnaW5hbCBhcnJheSAqL1xyXG5cdFx0XHRzb3VyY2U6IFRbXSxcclxuXHRcdFx0LyoqIEFzeW5jIGVsZW1lbnQgY29udmVydGVyIGZ1bmN0aW9uICovXHJcblx0XHRcdG1hcHBlcjogKGU6IFQsIGk6IG51bWJlciwgYTogVFtdLCBkYXRhOiBQTWFwRGF0YTxULCBWLCBFPikgPT4gUHJvbWlzZTxWIHwgRT4sXHJcblx0XHRcdC8qKiBNYXggbnVtYmVyIG9mIHJlcXVlc3RzIGF0IG9uY2UuICAgXHJcblx0XHRcdCAqICAqTWF5KiBiZSBjaGFuZ2VkIGluIHJ1bnRpbWUgKi9cclxuXHRcdFx0dGhyZWFkczogbnVtYmVyLFxyXG5cdFx0XHQvKiogTWF4IGRpc3RhbmNlIGJldHdlZW4gdGhlIG9sZGVycyBpbmNvbXBsZXRlIGFuZCBuZXdlc3QgYWN0aXZlIGVsZW1lbnRzLiAgIFxyXG5cdFx0XHQgKiAgKk1heSogYmUgY2hhbmdlZCBpbiBydW50aW1lICovXHJcblx0XHRcdHdpbmRvdzogbnVtYmVyLFxyXG5cclxuXHRcdFx0LyoqIFVuZmluaXNoZWQgcmVzdWx0IGFycmF5ICovXHJcblx0XHRcdHJlc3VsdDogKFYgfCBFcnJvciB8IHVuZGVmaW5lZClbXSxcclxuXHRcdFx0LyoqIFByb21pc2VzIGZvciBldmVyeSBlbGVtZW50ICovXHJcblx0XHRcdHJlcXVlc3RzOiBVbndyYXBwZWRQcm9taXNlPFYgfCBFPltdLFxyXG5cclxuXHRcdFx0YmVmb3JlU3RhcnQoZTogVCwgaTogbnVtYmVyLCBhOiBUW10sIGRhdGE6IFBNYXBEYXRhPFQsIFYsIEU+KTogdm9pZDtcclxuXHRcdFx0YWZ0ZXJDb21wbGV0ZShlOiBULCBpOiBudW1iZXIsIGE6IFRbXSwgZGF0YTogUE1hcERhdGE8VCwgViwgRT4pOiB2b2lkO1xyXG5cclxuXHRcdFx0LyoqIExlbmd0aCBvZiB0aGUgYXJyYXkgKi9cclxuXHRcdFx0bGVuZ3RoOiBudW1iZXIsXHJcblx0XHRcdC8qKiBUaGUgbnVtYmVyIG9mIGVsZW1lbnRzIGZpbmlzaGVkIGNvbnZlcnRpbmcgKi9cclxuXHRcdFx0Y29tcGxldGVkOiBudW1iZXIsXHJcblx0XHRcdC8qKiBUaHJlYWRzIGN1cnJlbnRseSB3b3JraW5nICAgXHJcblx0XHRcdCAqICBpbiB0aGUgbWFwcGVyIGZ1bmN0aW9uOiBpbmNsdWRpbmcgdGhlIGN1cnJlbnQgb25lICovXHJcblx0XHRcdGFjdGl2ZVRocmVhZHM6IG51bWJlcixcclxuXHRcdFx0bGFzdFN0YXJ0ZWQ6IG51bWJlcjtcclxuXHRcdH1cclxuXHJcblx0XHRjb25zdCBlbXB0eSA9IFByb21pc2VFeHRlbnNpb24uZW1wdHk7XHJcblx0XHR0eXBlIFVud3JhcHBlZFByb21pc2U8VD4gPSBQcm9taXNlRXh0ZW5zaW9uLlVud3JhcHBlZFByb21pc2U8VD47XHJcblxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBQTWFwU291cmNlPFQsIFYsIEUgPSBuZXZlcj4gZXh0ZW5kcyBQcm9taXNlTGlrZTxWW10+IHtcclxuXHRcdFx0LyoqIE9yaWdpbmFsIGFycmF5ICovXHJcblx0XHRcdHNvdXJjZTogVFtdLFxyXG5cdFx0XHQvKiogQXN5bmMgZWxlbWVudCBjb252ZXJ0ZXIgZnVuY3Rpb24gKi9cclxuXHRcdFx0bWFwcGVyOiAoZTogVCwgaTogbnVtYmVyLCBhOiBUW10sIGRhdGE6IFBNYXBEYXRhPFQsIFYsIEU+KSA9PiBQcm9taXNlPFYgfCBFPixcclxuXHRcdFx0LyoqIEFycmF5IHRvIHdyaXRlIHRvICovXHJcblx0XHRcdHJlc3VsdD86IChWIHwgRXJyb3IgfCB1bmRlZmluZWQpW10sXHJcblx0XHRcdC8qKiBNYXggbnVtYmVyIG9mIHJlcXVlc3RzIGF0IG9uY2UuICBcclxuXHRcdFx0ICogIERlZmF1bHQ6IDVcclxuXHRcdFx0ICogICpNYXkqIGJlIGNoYW5nZWQgaW4gcnVudGltZSAqL1xyXG5cdFx0XHR0aHJlYWRzOiBudW1iZXIsXHJcblx0XHRcdC8qKiBNYXggZGlzdGFuY2UgYmV0d2VlbiB0aGUgb2xkZXJzIGluY29tcGxldGUgYW5kIG5ld2VzdCBhY3RpdmUgZWxlbWVudHMuICAgXHJcblx0XHRcdCAqICBEZWZhdWx0OiB1bmxpbWl0ZWQgICBcclxuXHRcdFx0ICogICpNYXkqIGJlIGNoYW5nZWQgaW4gcnVudGltZSAqL1xyXG5cdFx0XHR3aW5kb3c/OiBudW1iZXIsXHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gcG1hcDJyYXc8VCwgViwgRSA9IG5ldmVyPihkYXRhOiBQTWFwRGF0YTxULCBWLCBFPik6IFBNYXBEYXRhPFQsIFYsIEU+IHtcclxuXHRcdFx0ZGF0YS5yZXN1bHQgPz89IEFycmF5KGRhdGEuc291cmNlLmxlbmd0aCk7XHJcblx0XHRcdGRhdGEucmVxdWVzdHMgPSBkYXRhLnJlc3VsdC5tYXAoKCkgPT4gZW1wdHkoKSk7XHJcblx0XHRcdGRhdGEudGhyZWFkcyA/Pz0gNTtcclxuXHRcdFx0ZGF0YS53aW5kb3cgPz89IEluZmluaXR5O1xyXG5cclxuXHRcdFx0ZGF0YS5jb21wbGV0ZWQgPSAwO1xyXG5cdFx0XHRkYXRhLmxlbmd0aCA9IGRhdGEuc291cmNlLmxlbmd0aDtcclxuXHRcdFx0ZGF0YS5hY3RpdmVUaHJlYWRzID0gMDtcclxuXHRcdFx0ZGF0YS5sYXN0U3RhcnRlZCA9IDA7XHJcblxyXG5cdFx0XHRpZiAoZGF0YS50aHJlYWRzIDw9IDApIHRocm93IG5ldyBFcnJvcigpO1xyXG5cclxuXHRcdFx0bGV0IGFsbERvbmUgPSBlbXB0eSgpO1xyXG5cdFx0XHRkYXRhLnRoZW4gPSBhbGxEb25lLnRoZW4uYmluZChhbGxEb25lKSBhcyBhbnk7XHJcblxyXG5cdFx0XHRsZXQgYW55UmVzb2x2ZWQgPSBlbXB0eSgpO1xyXG5cdFx0XHRhc3luYyBmdW5jdGlvbiBydW5PbmUoaTogbnVtYmVyKSB7XHJcblx0XHRcdFx0ZGF0YS5hY3RpdmVUaHJlYWRzKys7XHJcblx0XHRcdFx0ZGF0YS5iZWZvcmVTdGFydD8uKGRhdGEuc291cmNlW2ldLCBpLCBkYXRhLnNvdXJjZSwgZGF0YSk7XHJcblx0XHRcdFx0ZGF0YS5sYXN0U3RhcnRlZCA9IGk7XHJcblx0XHRcdFx0bGV0IHY6IFYgfCBFID0gYXdhaXQgZGF0YS5tYXBwZXIoZGF0YS5zb3VyY2VbaV0sIGksIGRhdGEuc291cmNlLCBkYXRhKS5jYXRjaChlID0+IGUpO1xyXG5cdFx0XHRcdGRhdGEuYWZ0ZXJDb21wbGV0ZT8uKGRhdGEuc291cmNlW2ldLCBpLCBkYXRhLnNvdXJjZSwgZGF0YSk7XHJcblx0XHRcdFx0ZGF0YS5hY3RpdmVUaHJlYWRzLS07XHJcblx0XHRcdFx0YW55UmVzb2x2ZWQucmVzb2x2ZShudWxsKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0YXN5bmMgZnVuY3Rpb24gcnVuKCkge1xyXG5cdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdFx0d2hpbGUgKGRhdGEuYWN0aXZlVGhyZWFkcyA8IGRhdGEudGhyZWFkcykgYXdhaXQgYW55UmVzb2x2ZWQ7XHJcblx0XHRcdFx0XHRhbnlSZXNvbHZlZCA9IGVtcHR5KCk7XHJcblx0XHRcdFx0XHRydW5PbmUoaSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0cmV0dXJuIGRhdGE7XHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBEYXRlTm93SGFjayB7XHJcblxyXG5cdFx0ZXhwb3J0IGxldCBzcGVlZE11bHRpcGxpZXIgPSAxO1xyXG5cdFx0ZXhwb3J0IGxldCBkZWx0YU9mZnNldCA9IDA7XHJcblx0XHRleHBvcnQgbGV0IHN0YXJ0UmVhbHRpbWUgPSAwO1xyXG5cdFx0ZXhwb3J0IGxldCBzdGFydFRpbWUgPSAwO1xyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiB0b0Zha2VUaW1lKHRpbWU6IG51bWJlcikge1xyXG5cdFx0XHRyZXR1cm4gTWF0aC5mbG9vcihcclxuXHRcdFx0XHQodGltZSAtIHN0YXJ0UmVhbHRpbWUpICogc3BlZWRNdWx0aXBsaWVyICsgc3RhcnRUaW1lICsgZGVsdGFPZmZzZXRcclxuXHRcdFx0KTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgbGV0IGJyYWNrZXRTcGVlZHMgPSBbMC4wNSwgMC4yNSwgMSwgMiwgNSwgMTAsIDIwLCA2MCwgMTIwXTtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBzcGVlZGhhY2soc3BlZWQ6IG51bWJlcikge1xyXG5cdFx0XHRhY3RpdmF0ZSgpO1xyXG5cdFx0XHRzcGVlZE11bHRpcGxpZXIgPSBzcGVlZDtcclxuXHRcdFx0bG9jYXRpb24uaGFzaCA9IHNwZWVkICsgJyc7XHJcblx0XHR9XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gdGltZWp1bXAoc2Vjb25kczogbnVtYmVyKSB7XHJcblx0XHRcdGFjdGl2YXRlKCk7XHJcblx0XHRcdGRlbHRhT2Zmc2V0ICs9IHNlY29uZHMgKiAxMDAwO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHN3aXRjaFNwZWVkaGFjayhkaXI6IG51bWJlcikge1xyXG5cdFx0XHRsZXQgY3VycmVudEluZGV4ID0gYnJhY2tldFNwZWVkcy5pbmRleE9mKHNwZWVkTXVsdGlwbGllcik7XHJcblx0XHRcdGlmIChjdXJyZW50SW5kZXggPT0gLTEpIGN1cnJlbnRJbmRleCA9IGJyYWNrZXRTcGVlZHMuaW5kZXhPZigxKTtcclxuXHRcdFx0bGV0IG5ld1NwZWVkID0gYnJhY2tldFNwZWVkc1tjdXJyZW50SW5kZXggKyBkaXJdO1xyXG5cdFx0XHRpZiAobmV3U3BlZWQgPT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdHNwZWVkaGFjayhuZXdTcGVlZCk7XHJcblx0XHR9XHJcblx0XHRmdW5jdGlvbiBvbmtleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcclxuXHRcdFx0aWYgKGV2ZW50LmNvZGUgPT0gJ0JyYWNrZXRMZWZ0Jykge1xyXG5cdFx0XHRcdHN3aXRjaFNwZWVkaGFjaygtMSk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGV2ZW50LmNvZGUgPT0gJ0JyYWNrZXRSaWdodCcpIHtcclxuXHRcdFx0XHRzd2l0Y2hTcGVlZGhhY2soMSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBiaW5kQnJhY2tldHMobW9kZSA9ICdvbicpIHtcclxuXHRcdFx0cmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9ua2V5ZG93bik7XHJcblx0XHRcdGlmIChtb2RlID09ICdvbicpIHtcclxuXHRcdFx0XHRhZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25rZXlkb3duKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBsZXQgYWN0aXZhdGVkID0gZmFsc2U7XHJcblx0XHRmdW5jdGlvbiBhY3RpdmF0ZSgpIHtcclxuXHRcdFx0RGF0ZS5fbm93ID8/PSBEYXRlLm5vdztcclxuXHRcdFx0RGF0ZS5wcm90b3R5cGUuX2dldFRpbWUgPz89IERhdGUucHJvdG90eXBlLmdldFRpbWU7XHJcblx0XHRcdHN0YXJ0VGltZSA9IERhdGUubm93KCk7XHJcblx0XHRcdHN0YXJ0UmVhbHRpbWUgPSBEYXRlLl9ub3coKTtcclxuXHRcdFx0ZGVsdGFPZmZzZXQgPSAwO1xyXG5cdFx0XHQvLyBjb25zb2xlLmxvZyhEYXRlLm5vdygpLCApXHJcblx0XHRcdC8vIGRlYnVnZ2VyO1xyXG5cdFx0XHREYXRlLm5vdyA9ICgpID0+IHRvRmFrZVRpbWUoRGF0ZS5fbm93KCkpO1xyXG5cdFx0XHREYXRlLnByb3RvdHlwZS5nZXRUaW1lID0gZnVuY3Rpb24gKHRoaXM6IERhdGUgJiB7IF90PzogbnVtYmVyIH0pIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fdCA/Pz0gdG9GYWtlVGltZSh0aGlzLl9nZXRUaW1lKCkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdERhdGUucHJvdG90eXBlLnZhbHVlT2YgPSBmdW5jdGlvbiAodGhpczogRGF0ZSkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmdldFRpbWUoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRhY3RpdmF0ZWQgPSB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHR9XHJcblxyXG5cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIE9iamVjdEV4dGVuc2lvbiB7XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGRlZmluZVZhbHVlPFQsIEsgZXh0ZW5kcyBrZXlvZiBUPihvOiBULCBwOiBLLCB2YWx1ZTogVFtLXSk6IFQ7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZGVmaW5lVmFsdWU8VD4obzogVCwgZm46IEZ1bmN0aW9uKTogVDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBkZWZpbmVWYWx1ZTxUPihvOiBULCBwOiBrZXlvZiBUIHwgc3RyaW5nIHwgRnVuY3Rpb24sIHZhbHVlPzogYW55KTogVCB7XHJcblx0XHRcdGlmICh0eXBlb2YgcCA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0W3AsIHZhbHVlXSA9IFtwLm5hbWUsIHBdIGFzIFtzdHJpbmcsIEZ1bmN0aW9uXTtcclxuXHRcdFx0fVxyXG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobywgcCwge1xyXG5cdFx0XHRcdHZhbHVlLFxyXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdFx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcclxuXHRcdFx0XHR3cml0YWJsZTogdHJ1ZSxcclxuXHRcdFx0fSk7XHJcblx0XHRcdHJldHVybiBvO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBkZWZpbmVHZXR0ZXI8VCwgSyBleHRlbmRzIGtleW9mIFQ+KG86IFQsIHA6IEssIGdldDogKCkgPT4gVFtLXSk6IFQ7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZGVmaW5lR2V0dGVyPFQ+KG86IFQsIGdldDogRnVuY3Rpb24pOiBUO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUdldHRlcjxUPihvOiBULCBwOiBzdHJpbmcgfCBrZXlvZiBUIHwgRnVuY3Rpb24sIGdldD86IGFueSk6IFQge1xyXG5cdFx0XHRpZiAodHlwZW9mIHAgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFtwLCBnZXRdID0gW3AubmFtZSwgcF0gYXMgW3N0cmluZywgRnVuY3Rpb25dO1xyXG5cdFx0XHR9XHJcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBwLCB7XHJcblx0XHRcdFx0Z2V0LFxyXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdFx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcclxuXHRcdFx0fSk7XHJcblx0XHRcdHJldHVybiBvO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBtYXA8VCwgVj4obzogVCwgbWFwcGVyOiAodjogVmFsdWVPZjxUPiwgazoga2V5b2YgVCwgbzogVCkgPT4gVik6IE1hcHBlZE9iamVjdDxULCBWPiB7XHJcblx0XHRcdGxldCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXMobykgYXMgW2tleW9mIFQsIFZhbHVlT2Y8VD5dW107XHJcblx0XHRcdHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoZW50cmllcy5tYXAoKFtrLCB2XSkgPT4gW2ssIG1hcHBlcih2LCBrLCBvKV0pKSBhcyBNYXBwZWRPYmplY3Q8VCwgVj47XHJcblx0XHR9XHJcblx0fVxyXG5cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIFF1ZXJ5U2VsZWN0b3Ige1xyXG5cclxuXHRcdGV4cG9ydCBuYW1lc3BhY2UgV2luZG93USB7XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHNlbGVjdG9yOiBLKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxFIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50PihzZWxlY3Rvcjogc2VsZWN0b3IpOiBFO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3Rvcjogc2VsZWN0b3IpOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxKHNlbGVjdG9yOiBzdHJpbmcpIHtcclxuXHRcdFx0XHRyZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3RvcjogSyk6IChIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10pW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxFIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50PihzZWxlY3Rvcjogc2VsZWN0b3IpOiBFW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3Rvcjogc2VsZWN0b3IpOiAoSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdKVtdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXEoc2VsZWN0b3I6IHN0cmluZykge1xyXG5cdFx0XHRcdHJldHVybiBbLi4uZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcildO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IG5hbWVzcGFjZSBEb2N1bWVudFEge1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPih0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IEspOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEUgZXh0ZW5kcyBFbGVtZW50ID0gSFRNTEVsZW1lbnQ+KHRoaXM6IERvY3VtZW50LCBzZWxlY3Rvcjogc2VsZWN0b3IpOiBFO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPih0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IHNlbGVjdG9yKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcSh0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IHN0cmluZykge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmRvY3VtZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IERvY3VtZW50LCBzZWxlY3RvcjogSyk6IChIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10pW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxFIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50Pih0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IHNlbGVjdG9yKTogRVtdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXE8SyBleHRlbmRzIGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcD4odGhpczogRG9jdW1lbnQsIHNlbGVjdG9yOiBzZWxlY3Rvcik6IChIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10pW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcSh0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IHN0cmluZykge1xyXG5cdFx0XHRcdHJldHVybiBbLi4udGhpcy5kb2N1bWVudEVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcildO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IG5hbWVzcGFjZSBFbGVtZW50USB7XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBLKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxFIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50Pih0aGlzOiBFbGVtZW50LCBzZWxlY3Rvcjogc2VsZWN0b3IpOiBFO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPih0aGlzOiBFbGVtZW50LCBzZWxlY3Rvcjogc2VsZWN0b3IpOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxKHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBLKTogKEhUTUxFbGVtZW50VGFnTmFtZU1hcFtLXSlbXTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEUgZXh0ZW5kcyBFbGVtZW50ID0gSFRNTEVsZW1lbnQ+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBzZWxlY3Rvcik6IEVbXTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBzZWxlY3Rvcik6IChIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10pW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcSh0aGlzOiBFbGVtZW50LCBzZWxlY3Rvcjogc3RyaW5nKSB7XHJcblx0XHRcdFx0cmV0dXJuIFsuLi50aGlzLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFbGVtZW50RXh0ZW5zaW9uIHtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBlbWl0PFQgZXh0ZW5kcyBDdXN0b21FdmVudDx7IF9ldmVudD86IHN0cmluZyB9Pj4odGhpczogRWxlbWVudCwgdHlwZTogVFsnZGV0YWlsJ11bJ19ldmVudCddLCBkZXRhaWw/OiBUWydkZXRhaWwnXSk7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZW1pdDxUPih0aGlzOiBFbGVtZW50LCB0eXBlOiBzdHJpbmcsIGRldGFpbD86IFQpIHtcclxuXHRcdFx0bGV0IGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KHR5cGUsIHtcclxuXHRcdFx0XHRidWJibGVzOiB0cnVlLFxyXG5cdFx0XHRcdGRldGFpbCxcclxuXHRcdFx0fSk7XHJcblx0XHRcdHRoaXMuZGlzcGF0Y2hFdmVudChldmVudCk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFRvPEUgZXh0ZW5kcyBFbGVtZW50Pih0aGlzOiBFLCBwYXJlbnQ6IEVsZW1lbnQgfCBzZWxlY3Rvcik6IEUge1xyXG5cdFx0XHRpZiAodHlwZW9mIHBhcmVudCA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdHBhcmVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IocGFyZW50KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRwYXJlbnQuYXBwZW5kKHRoaXMpO1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH1cclxuXHR9XHJcblxyXG59XHJcbiIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIEVsbSB7XHJcblx0XHR0eXBlIENoaWxkID0gTm9kZSB8IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW47XHJcblx0XHR0eXBlIFNvbWVFdmVudCA9IEV2ZW50ICYgTW91c2VFdmVudCAmIEtleWJvYXJkRXZlbnQgJiB7IHRhcmdldDogSFRNTEVsZW1lbnQgfTtcclxuXHRcdHR5cGUgTGlzdGVuZXIgPSAoKGV2ZW50OiBTb21lRXZlbnQpID0+IGFueSlcclxuXHRcdFx0JiB7IG5hbWU/OiBgJHsnJyB8ICdib3VuZCAnfSR7J29uJyB8ICcnfSR7a2V5b2YgSFRNTEVsZW1lbnRFdmVudE1hcH1gIHwgJycgfSB8ICgoZXZlbnQ6IFNvbWVFdmVudCkgPT4gYW55KTtcclxuXHJcblx0XHRjb25zdCBlbG1SZWdleCA9IG5ldyBSZWdFeHAoW1xyXG5cdFx0XHQvXig/PHRhZz5bXFx3LV0rKS8sXHJcblx0XHRcdC8jKD88aWQ+W1xcdy1dKykvLFxyXG5cdFx0XHQvXFwuKD88Y2xhc3M+W1xcdy1dKykvLFxyXG5cdFx0XHQvXFxbKD88YXR0cjE+W1xcdy1dKylcXF0vLFxyXG5cdFx0XHQvXFxbKD88YXR0cjI+W1xcdy1dKyk9KD8hWydcIl0pKD88dmFsMj5bXlxcXV0qKVxcXS8sXHJcblx0XHRcdC9cXFsoPzxhdHRyMz5bXFx3LV0rKT1cIig/PHZhbDM+KD86W15cIl18XFxcXFwiKSopXCJcXF0vLFxyXG5cdFx0XHQvXFxbKD88YXR0cjQ+W1xcdy1dKyk9XCIoPzx2YWw0Pig/OlteJ118XFxcXCcpKilcIlxcXS8sXHJcblx0XHRdLm1hcChlID0+IGUuc291cmNlKS5qb2luKCd8JyksICdnJyk7XHJcblxyXG5cdFx0LyoqIGlmIGBlbG1gIHNob3VsZCBkaXNhbGxvdyBsaXN0ZW5lcnMgbm90IGV4aXN0aW5nIGFzIGBvbiAqIGAgcHJvcGVydHkgb24gdGhlIGVsZW1lbnQgKi9cclxuXHRcdGV4cG9ydCBsZXQgYWxsb3dPbmx5RXhpc3RpbmdMaXN0ZW5lcnMgPSB0cnVlO1xyXG5cclxuXHRcdC8qKiBpZiBgZWxtYCBzaG91bGQgYWxsb3cgb3ZlcnJpZGluZyBgb24gKiBgIGxpc3RlbmVycyBpZiBtdWx0aXBsZSBvZiB0aGVtIGFyZSBwcm92aWRlZCAqL1xyXG5cdFx0ZXhwb3J0IGxldCBhbGxvd092ZXJyaWRlT25MaXN0ZW5lcnMgPSBmYWxzZTtcclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHNlbGVjdG9yOiBLLCAuLi5jaGlsZHJlbjogKENoaWxkIHwgTGlzdGVuZXIpW10pOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtPEUgZXh0ZW5kcyBFbGVtZW50ID0gSFRNTEVsZW1lbnQ+KHNlbGVjdG9yOiBzZWxlY3RvciwgLi4uY2hpbGRyZW46IChDaGlsZCB8IExpc3RlbmVyKVtdKTogRTtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBlbG08SyBleHRlbmRzIGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcD4oc2VsZWN0b3I6IHNlbGVjdG9yLCAuLi5jaGlsZHJlbjogKENoaWxkIHwgTGlzdGVuZXIpW10pOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtKCk6IEhUTUxEaXZFbGVtZW50O1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGVsbShzZWxlY3Rvcjogc3RyaW5nID0gJycsIC4uLmNoaWxkcmVuOiAoQ2hpbGQgfCBMaXN0ZW5lcilbXSk6IEhUTUxFbGVtZW50IHtcclxuXHRcdFx0aWYgKHNlbGVjdG9yLnJlcGxhY2VBbGwoZWxtUmVnZXgsICcnKSAhPSAnJykge1xyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBzZWxlY3RvcjogJHtzZWxlY3Rvcn0gYCk7XHJcblx0XHRcdH1cclxuXHRcdFx0bGV0IGVsZW1lbnQ6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0XHRcdC8vIGxldCB0YWcgPSAnJztcclxuXHRcdFx0Ly8gbGV0IGZpcnN0TWF0Y2ggPSBmYWxzZTtcclxuXHRcdFx0Zm9yIChsZXQgbWF0Y2ggb2Ygc2VsZWN0b3IubWF0Y2hBbGwoZWxtUmVnZXgpKSB7XHJcblx0XHRcdFx0aWYgKG1hdGNoLmdyb3Vwcy50YWcpIHtcclxuXHRcdFx0XHRcdC8vIGlmICh0YWcgJiYgbWF0Y2guZ3JvdXBzLnRhZyAhPSB0YWcpIHtcclxuXHRcdFx0XHRcdC8vIFx0dGhyb3cgbmV3IEVycm9yKGBzZWxlY3RvciBoYXMgdHdvIGRpZmZlcmVudCB0YWdzIGF0IG9uY2UgOiA8JHt0YWd9PiBhbmQgPCR7bWF0Y2guZ3JvdXBzLnRhZ30+YCk7XHJcblx0XHRcdFx0XHQvLyB9XHJcblx0XHRcdFx0XHQvLyB0YWcgPSBtYXRjaC5ncm91cHMudGFnO1xyXG5cdFx0XHRcdFx0Ly8gaWYgKCFmaXJzdE1hdGNoKSByZXR1cm4gZWxtKHRhZyArIHNlbGVjdG9yLCAuLi5jaGlsZHJlbik7XHJcblx0XHRcdFx0XHRlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChtYXRjaC5ncm91cHMudGFnKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5pZCkge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5pZCA9IG1hdGNoLmdyb3Vwcy5pZDtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5jbGFzcykge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKG1hdGNoLmdyb3Vwcy5jbGFzcyk7XHJcblx0XHRcdFx0fSBlbHNlIGlmIChtYXRjaC5ncm91cHMuYXR0cjEpIHtcclxuXHRcdFx0XHRcdGVsZW1lbnQuc2V0QXR0cmlidXRlKG1hdGNoLmdyb3Vwcy5hdHRyMSwgXCJ0cnVlXCIpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAobWF0Y2guZ3JvdXBzLmF0dHIyKSB7XHJcblx0XHRcdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZShtYXRjaC5ncm91cHMuYXR0cjIsIG1hdGNoLmdyb3Vwcy52YWwyKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5hdHRyMykge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5zZXRBdHRyaWJ1dGUobWF0Y2guZ3JvdXBzLmF0dHIzLCBtYXRjaC5ncm91cHMudmFsMy5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAobWF0Y2guZ3JvdXBzLmF0dHI0KSB7XHJcblx0XHRcdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZShtYXRjaC5ncm91cHMuYXR0cjQsIG1hdGNoLmdyb3Vwcy52YWw0LnJlcGxhY2UoL1xcXFwnL2csICdcXCcnKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIGZpcnN0TWF0Y2ggPSBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRmb3IgKGxldCBsaXN0ZW5lciBvZiBjaGlsZHJlbi5maWx0ZXIoZSA9PiB0eXBlb2YgZSA9PSAnZnVuY3Rpb24nKSBhcyBMaXN0ZW5lcltdKSB7XHJcblx0XHRcdFx0bGV0IG5hbWU6IHN0cmluZyA9IGxpc3RlbmVyLm5hbWU7XHJcblx0XHRcdFx0aWYgKCFuYW1lKSBuYW1lID0gKGxpc3RlbmVyICsgJycpLm1hdGNoKC9cXGIoPyFmdW5jdGlvblxcYilcXHcrLylbMF07XHJcblx0XHRcdFx0aWYgKCFuYW1lKSB0aHJvdyBuZXcgRXJyb3IoJ3RyeWluZyB0byBiaW5kIHVubmFtZWQgZnVuY3Rpb24nKTtcclxuXHRcdFx0XHRpZiAobmFtZS5zdGFydHNXaXRoKCdib3VuZCAnKSkgbmFtZSA9IG5hbWUuc2xpY2UoJ2JvdW5kICcubGVuZ3RoKTtcclxuXHRcdFx0XHRpZiAobmFtZS5zdGFydHNXaXRoKCdvbicpKSB7XHJcblx0XHRcdFx0XHRpZiAoIWVsZW1lbnQuaGFzT3duUHJvcGVydHkobmFtZSkpIHRocm93IG5ldyBFcnJvcihgPCAke2VsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpfT4gZG9lcyBub3QgaGF2ZSBcIiR7bmFtZX1cIiBsaXN0ZW5lcmApO1xyXG5cdFx0XHRcdFx0aWYgKCFhbGxvd092ZXJyaWRlT25MaXN0ZW5lcnMgJiYgZWxlbWVudFtuYW1lXSkgdGhyb3cgbmV3IEVycm9yKCdvdmVycmlkaW5nIGBvbiAqIGAgbGlzdGVuZXJzIGlzIGRpc2FibGVkJyk7XHJcblx0XHRcdFx0XHRlbGVtZW50W25hbWVdID0gbGlzdGVuZXI7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGlmIChhbGxvd09ubHlFeGlzdGluZ0xpc3RlbmVycyAmJiBlbGVtZW50WydvbicgKyBuYW1lXSA9PT0gdW5kZWZpbmVkKVxyXG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYDwke2VsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpfT4gZG9lcyBub3QgaGF2ZSBcIm9uJyR7bmFtZX0nXCIgbGlzdGVuZXJgKTtcclxuXHRcdFx0XHRcdGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBsaXN0ZW5lcik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsZW1lbnQuYXBwZW5kKC4uLmNoaWxkcmVuLmZpbHRlcihlID0+IHR5cGVvZiBlICE9ICdmdW5jdGlvbicpIGFzIChOb2RlIHwgc3RyaW5nKVtdKTtcclxuXHRcdFx0cmV0dXJuIGVsZW1lbnQ7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFPckVsbTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3RvcjogSywgcGFyZW50PzogUGFyZW50Tm9kZSB8IHNlbGVjdG9yKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFPckVsbTxFIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50PihzZWxlY3Rvcjogc3RyaW5nLCBwYXJlbnQ/OiBQYXJlbnROb2RlIHwgc2VsZWN0b3IpOiBFO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFPckVsbTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3Rvcjogc3RyaW5nLCBwYXJlbnQ/OiBQYXJlbnROb2RlIHwgc2VsZWN0b3IpOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcU9yRWxtKHNlbGVjdG9yOiBzdHJpbmcsIHBhcmVudD86IFBhcmVudE5vZGUgfCBzdHJpbmcpIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBwYXJlbnQgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRwYXJlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHBhcmVudCkgYXMgUGFyZW50Tm9kZTtcclxuXHRcdFx0XHRpZiAoIXBhcmVudCkgdGhyb3cgbmV3IEVycm9yKCdmYWlsZWQgdG8gZmluZCBwYXJlbnQgZWxlbWVudCcpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChzZWxlY3Rvci5pbmNsdWRlcygnPicpKSB7XHJcblx0XHRcdFx0bGV0IHBhcmVudFNlbGVjdG9yID0gc2VsZWN0b3Iuc3BsaXQoJz4nKS5zbGljZSgwLCAtMSkuam9pbignPicpO1xyXG5cdFx0XHRcdHNlbGVjdG9yID0gc2VsZWN0b3Iuc3BsaXQoJz4nKS5wb3AoKTtcclxuXHRcdFx0XHRwYXJlbnQgPSAocGFyZW50IHx8IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yKHBhcmVudFNlbGVjdG9yKSBhcyBQYXJlbnROb2RlO1xyXG5cdFx0XHRcdGlmICghcGFyZW50KSB0aHJvdyBuZXcgRXJyb3IoJ2ZhaWxlZCB0byBmaW5kIHBhcmVudCBlbGVtZW50Jyk7XHJcblx0XHRcdH1cclxuXHRcdFx0bGV0IGNoaWxkID0gKHBhcmVudCB8fCBkb2N1bWVudCkucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XHJcblx0XHRcdGlmIChjaGlsZCkgcmV0dXJuIGNoaWxkO1xyXG5cclxuXHRcdFx0Y2hpbGQgPSBlbG0oc2VsZWN0b3IpO1xyXG5cdFx0XHRwYXJlbnQ/LmFwcGVuZChjaGlsZCk7XHJcblx0XHRcdHJldHVybiBjaGlsZDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBldGMge1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGtleWJpbmQoa2V5OiBzdHJpbmcsIGZuOiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHZvaWQpIHtcclxuXHRcdFx0bGV0IGNvZGUgPSBrZXkubGVuZ3RoID09IDEgPyAnS2V5JyArIGtleS50b1VwcGVyQ2FzZSgpIDoga2V5O1xyXG5cdFx0XHRmdW5jdGlvbiBvbmtleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcclxuXHRcdFx0XHRpZiAoZXZlbnQuY29kZSA9PSBjb2RlKSB7XHJcblx0XHRcdFx0XHRmbihldmVudCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbmtleWRvd24pO1xyXG5cdFx0XHRyZXR1cm4gKCkgPT4gcmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9ua2V5ZG93bik7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZ1bGxzY3JlZW4ob24/OiBib29sZWFuKSB7XHJcblx0XHRcdGxldCBjZW50cmFsID0gSW1hZ2VTY3JvbGxpbmdFeHRlbnNpb24uaW1hZ2VTY3JvbGxpbmdBY3RpdmUgJiYgSW1hZ2VTY3JvbGxpbmdFeHRlbnNpb24uZ2V0Q2VudHJhbEltZygpO1xyXG5cdFx0XHRpZiAoIWRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50KSB7XHJcblx0XHRcdFx0aWYgKG9uID09IGZhbHNlKSByZXR1cm47XHJcblx0XHRcdFx0YXdhaXQgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuKCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0aWYgKG9uID09IHRydWUpIHJldHVybjtcclxuXHRcdFx0XHRhd2FpdCBkb2N1bWVudC5leGl0RnVsbHNjcmVlbigpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChjZW50cmFsKSB7XHJcblx0XHRcdFx0Y2VudHJhbC5zY3JvbGxJbnRvVmlldygpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGFueWJpbmQoa2V5T3JFdmVudDogc3RyaW5nIHwgbnVtYmVyLCBmbjogKGV2ZW50OiBFdmVudCkgPT4gdm9pZCkge1xyXG5cdFx0XHRpZiAodHlwZW9mIGtleU9yRXZlbnQgPT0gXCJudW1iZXJcIikga2V5T3JFdmVudCA9IGtleU9yRXZlbnQgKyAnJztcclxuXHRcdFx0Ly8gZGV0ZWN0IGlmIGl0IGlzIGV2ZW50XHJcblx0XHRcdGxldCBpc0V2ZW50ID0gd2luZG93Lmhhc093blByb3BlcnR5KCdvbicgKyBrZXlPckV2ZW50KTtcclxuXHRcdFx0aWYgKGlzRXZlbnQpIHtcclxuXHRcdFx0XHRhZGRFdmVudExpc3RlbmVyKGtleU9yRXZlbnQsIGZuKTtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gcGFyc2Uga2V5IGNvZGVcclxuXHRcdFx0aWYgKCFpc05hTihwYXJzZUludChrZXlPckV2ZW50KSkpIHtcclxuXHRcdFx0XHRrZXlPckV2ZW50ID0gYERpZ2l0JHtrZXlPckV2ZW50fWA7XHJcblx0XHRcdH0gZWxzZSBpZiAoa2V5T3JFdmVudC5sZW5ndGggPT0gMSkge1xyXG5cdFx0XHRcdGtleU9yRXZlbnQgPSBgS2V5JHtrZXlPckV2ZW50LnRvVXBwZXJDYXNlKCl9YDtcclxuXHRcdFx0fVxyXG5cdFx0XHRhZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZXYgPT4ge1xyXG5cdFx0XHRcdGlmIChldi5jb2RlICE9IGtleU9yRXZlbnQpIHJldHVybjtcclxuXHRcdFx0XHRmbihldik7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBmdWxsc2NyZWVuT24oa2V5OiBzdHJpbmcpIHtcclxuXHRcdFx0aWYgKGtleSA9PSAnc2Nyb2xsJykge1xyXG5cdFx0XHRcdGFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsICgpID0+IGZ1bGxzY3JlZW4odHJ1ZSkpO1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4ga2V5YmluZChrZXksICgpID0+IGZ1bGxzY3JlZW4oKSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGZJc0ZvckZ1bGxzY3JlZW4oKSB7XHJcblx0XHRcdGtleWJpbmQoJ0YnLCAoKSA9PiBmdWxsc2NyZWVuKCkpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBoYXNoQ29kZSh0aGlzOiBzdHJpbmcpO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGhhc2hDb2RlKHZhbHVlOiBzdHJpbmcpO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGhhc2hDb2RlKHRoaXM6IHN0cmluZywgdmFsdWU/OiBzdHJpbmcpIHtcclxuXHRcdFx0dmFsdWUgPz89IHRoaXM7XHJcblx0XHRcdGxldCBoYXNoID0gMDtcclxuXHRcdFx0Zm9yIChsZXQgYyBvZiB2YWx1ZSkge1xyXG5cdFx0XHRcdGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSArIGMuY2hhckNvZGVBdCgwKTtcclxuXHRcdFx0XHRoYXNoID0gaGFzaCAmIGhhc2g7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGhhc2g7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGluaXQoKSB7XHJcblx0XHRcdC8vIFN0cmluZy5wcm90b3R5cGUuaGFzaENvZGUgPSBoYXNoQ29kZTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gY3VycmVudFNjcmlwdEhhc2goKSB7XHJcblx0XHRcdHJldHVybiBoYXNoQ29kZShkb2N1bWVudC5jdXJyZW50U2NyaXB0LmlubmVySFRNTCk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHJlbG9hZE9uQ3VycmVudFNjcmlwdENoYW5nZWQoc2NyaXB0TmFtZTogc3RyaW5nID0gbG9jYXRpb24uaG9zdG5hbWUgKyAnLnVqcycpIHtcclxuXHRcdFx0bGV0IHNjcmlwdElkID0gYHJlbG9hZE9uQ3VycmVudFNjcmlwdENoYW5nZWRfJHtzY3JpcHROYW1lfWA7XHJcblx0XHRcdGxldCBzY3JpcHRIYXNoID0gY3VycmVudFNjcmlwdEhhc2goKSArICcnO1xyXG5cdFx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShzY3JpcHRJZCwgc2NyaXB0SGFzaCk7XHJcblx0XHRcdGFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgKCkgPT4ge1xyXG5cdFx0XHRcdGlmIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShzY3JpcHRJZCkgIT0gc2NyaXB0SGFzaCkge1xyXG5cdFx0XHRcdFx0bG9jYXRpb24ucmVsb2FkKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgbGV0IGZhc3RTY3JvbGw6IHtcclxuXHRcdFx0KHNwZWVkPzogbnVtYmVyKTogdm9pZDtcclxuXHRcdFx0c3BlZWQ/OiBudW1iZXI7XHJcblx0XHRcdGFjdGl2ZT86IGJvb2xlYW47XHJcblx0XHRcdG9mZj86ICgpID0+IHZvaWQ7XHJcblx0XHR9ID0gZnVuY3Rpb24gKHNwZWVkID0gMC4yNSkge1xyXG5cdFx0XHRpZiAoZmFzdFNjcm9sbC5hY3RpdmUpIGZhc3RTY3JvbGwub2ZmKCk7XHJcblx0XHRcdGZhc3RTY3JvbGwuYWN0aXZlID0gdHJ1ZTtcclxuXHRcdFx0ZmFzdFNjcm9sbC5zcGVlZCA9IHNwZWVkO1xyXG5cdFx0XHRmdW5jdGlvbiBvbndoZWVsKGV2ZW50OiBNb3VzZUV2ZW50ICYgeyB3aGVlbERlbHRhWTogbnVtYmVyIH0pIHtcclxuXHRcdFx0XHRpZiAoZXZlbnQuZGVmYXVsdFByZXZlbnRlZCkgcmV0dXJuO1xyXG5cdFx0XHRcdGlmIChldmVudC5jdHJsS2V5IHx8IGV2ZW50LnNoaWZ0S2V5KSByZXR1cm47XHJcblx0XHRcdFx0c2Nyb2xsQnkoMCwgLU1hdGguc2lnbihldmVudC53aGVlbERlbHRhWSkgKiBpbm5lckhlaWdodCAqIGZhc3RTY3JvbGwuc3BlZWQpO1xyXG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdH1cclxuXHRcdFx0YWRkRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIG9ud2hlZWwsIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdGZhc3RTY3JvbGwub2ZmID0gKCkgPT4ge1xyXG5cdFx0XHRcdGZhc3RTY3JvbGwuYWN0aXZlID0gZmFsc2U7XHJcblx0XHRcdFx0cmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIG9ud2hlZWwpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRmYXN0U2Nyb2xsLmFjdGl2ZSA9IGZhbHNlO1xyXG5cdFx0ZmFzdFNjcm9sbC5vZmYgPSAoKSA9PiB7IH07XHJcblxyXG5cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gb25yYWYoZjogKCkgPT4gdm9pZCkge1xyXG5cdFx0XHRsZXQgbG9vcCA9IHRydWU7XHJcblx0XHRcdHZvaWQgYXN5bmMgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdHdoaWxlIChsb29wKSB7XHJcblx0XHRcdFx0XHRhd2FpdCBQcm9taXNlLmZyYW1lKCk7XHJcblx0XHRcdFx0XHRmKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KCk7XHJcblx0XHRcdHJldHVybiAoKSA9PiB7IGxvb3AgPSBmYWxzZSB9O1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCByZXNpemVPYnNlcnZlcjogUmVzaXplT2JzZXJ2ZXI7XHJcblx0XHRsZXQgcmVzaXplTGlzdGVuZXJzOiAoKG5ld0hlaWdodDogbnVtYmVyLCBvbGRIZWlnaHQ6IG51bWJlcikgPT4gdm9pZClbXSA9IFtdO1xyXG5cdFx0bGV0IHByZXZpb3VzQm9keUhlaWdodCA9IDA7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gb25oZWlnaHRjaGFuZ2UoZjogKG5ld0hlaWdodDogbnVtYmVyLCBvbGRIZWlnaHQ6IG51bWJlcikgPT4gdm9pZCkge1xyXG5cdFx0XHRpZiAoIXJlc2l6ZU9ic2VydmVyKSB7XHJcblx0XHRcdFx0cHJldmlvdXNCb2R5SGVpZ2h0ID0gZG9jdW1lbnQuYm9keS5jbGllbnRIZWlnaHQ7XHJcblx0XHRcdFx0cmVzaXplT2JzZXJ2ZXIgPSBuZXcgUmVzaXplT2JzZXJ2ZXIoZW50cmllcyA9PiB7XHJcblx0XHRcdFx0XHRmb3IgKGxldCBlIG9mIGVudHJpZXMpIHtcclxuXHRcdFx0XHRcdFx0aWYgKGUudGFyZ2V0ICE9IGRvY3VtZW50LmJvZHkpIGNvbnRpbnVlO1xyXG5cclxuXHRcdFx0XHRcdFx0bGV0IG5ld0JvZHlIZWlnaHQgPSBlLnRhcmdldC5jbGllbnRIZWlnaHQ7XHJcblx0XHRcdFx0XHRcdGZvciAobGV0IGYgb2YgcmVzaXplTGlzdGVuZXJzKSB7XHJcblx0XHRcdFx0XHRcdFx0ZihuZXdCb2R5SGVpZ2h0LCBwcmV2aW91c0JvZHlIZWlnaHQpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdHByZXZpb3VzQm9keUhlaWdodCA9IG5ld0JvZHlIZWlnaHQ7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0cmVzaXplT2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXNpemVMaXN0ZW5lcnMucHVzaChmKTtcclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKCkge1xyXG5cdFx0XHRcdHJlc2l6ZUxpc3RlbmVycy5zcGxpY2UocmVzaXplTGlzdGVuZXJzLmluZGV4T2YoZikpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG59XHJcblxyXG4vLyBpbnRlcmZhY2UgU3RyaW5nIHtcclxuLy8gXHRoYXNoQ29kZTogKCkgPT4gbnVtYmVyO1xyXG4vLyB9XHJcbiIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIEZldGNoRXh0ZW5zaW9uIHtcclxuXHRcdGV4cG9ydCB0eXBlIFJlcXVlc3RJbml0RXggPSBSZXF1ZXN0SW5pdCAmIHsgbWF4QWdlPzogbnVtYmVyIH07XHJcblx0XHRleHBvcnQgdHlwZSBSZXF1ZXN0SW5pdEV4SnNvbiA9IFJlcXVlc3RJbml0ICYgeyBtYXhBZ2U/OiBudW1iZXIsIGluZGV4ZWREYj86IGJvb2xlYW4gfTtcclxuXHRcdGV4cG9ydCBsZXQgZGVmYXVsdHM6IFJlcXVlc3RJbml0ID0geyBjcmVkZW50aWFsczogJ2luY2x1ZGUnIH07XHJcblxyXG5cdFx0ZXhwb3J0IGxldCBjYWNoZTogQ2FjaGUgPSBudWxsO1xyXG5cdFx0YXN5bmMgZnVuY3Rpb24gb3BlbkNhY2hlKCkge1xyXG5cdFx0XHRpZiAoY2FjaGUpIHJldHVybiBjYWNoZTtcclxuXHRcdFx0Y2FjaGUgPSBhd2FpdCBjYWNoZXMub3BlbignZmV0Y2gnKTtcclxuXHRcdFx0cmV0dXJuIGNhY2hlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGlzU3RhbGUoY2FjaGVkQXQ6IG51bWJlciwgbWF4QWdlPzogbnVtYmVyKSB7XHJcblx0XHRcdGlmIChtYXhBZ2UgPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRyZXR1cm4gRGF0ZS5ub3coKSAtIGNhY2hlZEF0ID49IG1heEFnZTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FjaGVkKHVybDogc3RyaW5nLCBpbml0OiBSZXF1ZXN0SW5pdEV4ID0ge30pOiBQcm9taXNlPFJlc3BvbnNlPiB7XHJcblx0XHRcdGxldCBjYWNoZSA9IGF3YWl0IG9wZW5DYWNoZSgpO1xyXG5cdFx0XHRsZXQgcmVzcG9uc2UgPSBhd2FpdCBjYWNoZS5tYXRjaCh1cmwpO1xyXG5cdFx0XHRpZiAocmVzcG9uc2UpIHtcclxuXHRcdFx0XHRyZXNwb25zZS5jYWNoZWRBdCA9ICtyZXNwb25zZS5oZWFkZXJzLmdldCgnY2FjaGVkLWF0JykgfHwgMDtcclxuXHRcdFx0XHRpZiAoIWlzU3RhbGUocmVzcG9uc2UuY2FjaGVkQXQsIGluaXQubWF4QWdlKSlcclxuXHRcdFx0XHRcdHJldHVybiByZXNwb25zZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwgeyAuLi5kZWZhdWx0cywgLi4uaW5pdCB9KTtcclxuXHRcdFx0aWYgKHJlc3BvbnNlLm9rKSB7XHJcblx0XHRcdFx0cmVzcG9uc2UuY2FjaGVkQXQgPSBEYXRlLm5vdygpO1xyXG5cdFx0XHRcdGxldCBjbG9uZSA9IHJlc3BvbnNlLmNsb25lKCk7XHJcblx0XHRcdFx0bGV0IGluaXQ6IFJlc3BvbnNlSW5pdCA9IHtcclxuXHRcdFx0XHRcdHN0YXR1czogY2xvbmUuc3RhdHVzLCBzdGF0dXNUZXh0OiBjbG9uZS5zdGF0dXNUZXh0LFxyXG5cdFx0XHRcdFx0aGVhZGVyczogW1snY2FjaGVkLWF0JywgYCR7cmVzcG9uc2UuY2FjaGVkQXR9YF0sIC4uLmNsb25lLmhlYWRlcnMuZW50cmllcygpXVxyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0bGV0IHJlc3VsdFJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKGNsb25lLmJvZHksIGluaXQpO1xyXG5cdFx0XHRcdGNhY2hlLnB1dCh1cmwsIHJlc3VsdFJlc3BvbnNlKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gcmVzcG9uc2U7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhY2hlZERvYyh1cmw6IHN0cmluZywgaW5pdDogUmVxdWVzdEluaXRFeCA9IHt9KTogUHJvbWlzZTxEb2N1bWVudD4ge1xyXG5cdFx0XHRsZXQgcmVzcG9uc2UgPSBhd2FpdCBjYWNoZWQodXJsLCBpbml0KTtcclxuXHRcdFx0bGV0IHRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XHJcblx0XHRcdGxldCBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKCk7XHJcblx0XHRcdGxldCBkb2MgPSBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKHRleHQsICd0ZXh0L2h0bWwnKTtcclxuXHRcdFx0bGV0IGJhc2UgPSBkb2MuY3JlYXRlRWxlbWVudCgnYmFzZScpO1xyXG5cdFx0XHRiYXNlLmhyZWYgPSB1cmw7XHJcblx0XHRcdGRvYy5oZWFkLmFwcGVuZChiYXNlKTtcclxuXHRcdFx0ZG9jLmNhY2hlZEF0ID0gcmVzcG9uc2UuY2FjaGVkQXQ7XHJcblx0XHRcdHJldHVybiBkb2M7XHJcblx0XHR9XHJcblxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBkb2ModXJsOiBzdHJpbmcsIGluaXQ6IFJlcXVlc3RJbml0RXggPSB7fSk6IFByb21pc2U8RG9jdW1lbnQ+IHtcclxuXHRcdFx0bGV0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7IC4uLmRlZmF1bHRzLCAuLi5pbml0IH0pO1xyXG5cdFx0XHRsZXQgdGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcclxuXHRcdFx0bGV0IHBhcnNlciA9IG5ldyBET01QYXJzZXIoKTtcclxuXHRcdFx0bGV0IGRvYyA9IHBhcnNlci5wYXJzZUZyb21TdHJpbmcodGV4dCwgJ3RleHQvaHRtbCcpO1xyXG5cdFx0XHRsZXQgYmFzZSA9IGRvYy5jcmVhdGVFbGVtZW50KCdiYXNlJyk7XHJcblx0XHRcdGJhc2UuaHJlZiA9IHVybDtcclxuXHRcdFx0ZG9jLmhlYWQuYXBwZW5kKGJhc2UpO1xyXG5cdFx0XHRkb2MuY2FjaGVkQXQgPSByZXNwb25zZS5jYWNoZWRBdDtcclxuXHRcdFx0cmV0dXJuIGRvYztcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgYXN5bmMgZnVuY3Rpb24geG1sRG9jKHVybDogc3RyaW5nKTogUHJvbWlzZTxEb2N1bWVudD4ge1xyXG5cdFx0XHRsZXQgcCA9IFByb21pc2VFeHRlbnNpb24uZW1wdHkoKTtcclxuXHRcdFx0bGV0IG9SZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuXHRcdFx0b1JlcS5vbmxvYWQgPSBwLnI7XHJcblx0XHRcdG9SZXEucmVzcG9uc2VUeXBlID0gJ2RvY3VtZW50JztcclxuXHRcdFx0b1JlcS5vcGVuKFwiZ2V0XCIsIHVybCwgdHJ1ZSk7XHJcblx0XHRcdG9SZXEuc2VuZCgpO1xyXG5cdFx0XHRhd2FpdCBwO1xyXG5cdFx0XHRyZXR1cm4gb1JlcS5yZXNwb25zZVhNTDtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgYXN5bmMgZnVuY3Rpb24ganNvbih1cmw6IHN0cmluZywgaW5pdDogUmVxdWVzdEluaXQgPSB7fSk6IFByb21pc2U8dW5rbm93bj4ge1xyXG5cdFx0XHRyZXR1cm4gZmV0Y2godXJsLCB7IC4uLmRlZmF1bHRzLCAuLi5pbml0IH0pLnRoZW4oZSA9PiBlLmpzb24oKSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsZWFyQ2FjaGUoKSB7XHJcblx0XHRcdGNhY2hlID0gbnVsbDtcclxuXHRcdFx0cmV0dXJuIGNhY2hlcy5kZWxldGUoJ2ZldGNoJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVuY2FjaGUodXJsOiBzdHJpbmcpIHtcclxuXHRcdFx0bGV0IGNhY2hlID0gYXdhaXQgb3BlbkNhY2hlKCk7XHJcblx0XHRcdHJldHVybiBjYWNoZS5kZWxldGUodXJsKTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgYXN5bmMgZnVuY3Rpb24gaXNDYWNoZWQodXJsOiBzdHJpbmcsIG9wdGlvbnM6IHsgbWF4QWdlPzogbnVtYmVyLCBpbmRleGVkRGI/OiBib29sZWFuIHwgJ29ubHknIH0gPSB7fSk6IFByb21pc2U8Ym9vbGVhbiB8ICdpZGInPiB7XHJcblx0XHRcdGlmIChvcHRpb25zLmluZGV4ZWREYikge1xyXG5cdFx0XHRcdGxldCBkYkpzb24gPSBhd2FpdCBpZGJHZXQodXJsKTtcclxuXHRcdFx0XHRpZiAoZGJKc29uKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gaXNTdGFsZShkYkpzb24uY2FjaGVkQXQsIG9wdGlvbnMubWF4QWdlKSA/IGZhbHNlIDogJ2lkYic7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChvcHRpb25zLmluZGV4ZWREYiA9PSAnb25seScpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRsZXQgY2FjaGUgPSBhd2FpdCBvcGVuQ2FjaGUoKTtcclxuXHRcdFx0bGV0IHJlc3BvbnNlID0gYXdhaXQgY2FjaGUubWF0Y2godXJsKTtcclxuXHRcdFx0aWYgKCFyZXNwb25zZSkgcmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRpZiAodHlwZW9mIG9wdGlvbnM/Lm1heEFnZSA9PSAnbnVtYmVyJykge1xyXG5cdFx0XHRcdGxldCBjYWNoZWRBdCA9ICtyZXNwb25zZS5oZWFkZXJzLmdldCgnY2FjaGVkLWF0JykgfHwgMDtcclxuXHRcdFx0XHRpZiAoaXNTdGFsZShyZXNwb25zZS5jYWNoZWRBdCwgb3B0aW9ucy5tYXhBZ2UpKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhY2hlZEpzb24odXJsOiBzdHJpbmcsIGluaXQ6IFJlcXVlc3RJbml0RXhKc29uID0ge30pOiBQcm9taXNlPHVua25vd24+IHtcclxuXHRcdFx0aWYgKGluaXQuaW5kZXhlZERiKSB7XHJcblx0XHRcdFx0bGV0IGRiSnNvbiA9IGF3YWl0IGlkYkdldCh1cmwpO1xyXG5cdFx0XHRcdGlmIChkYkpzb24pIHtcclxuXHRcdFx0XHRcdGlmICghaXNTdGFsZShkYkpzb24uY2FjaGVkQXQsIGluaXQubWF4QWdlKSkge1xyXG5cdFx0XHRcdFx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoZGJKc29uLmRhdGEgYXMgYW55LCAnY2FjaGVkJywgZGJKc29uLmNhY2hlZEF0KTtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIGRiSnNvbi5kYXRhO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRsZXQgcmVzcG9uc2UgPSBhd2FpdCBjYWNoZWQodXJsLCBpbml0KTtcclxuXHRcdFx0bGV0IGpzb24gPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XHJcblx0XHRcdGlmICghKCdjYWNoZWQnIGluIGpzb24pKSB7XHJcblx0XHRcdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKGpzb24sICdjYWNoZWQnLCByZXNwb25zZS5jYWNoZWRBdCk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGluaXQuaW5kZXhlZERiKSB7XHJcblx0XHRcdFx0aWRiUHV0KHVybCwganNvbiwgcmVzcG9uc2UuY2FjaGVkQXQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBqc29uO1xyXG5cdFx0fVxyXG5cclxuXHJcblx0XHRsZXQgX2lkYkluc3RhbmNlUHJvbWlzZTogSURCRGF0YWJhc2UgfCBQcm9taXNlPElEQkRhdGFiYXNlPiA9IG51bGw7XHJcblx0XHRsZXQgaWRiSW5zdGFuY2U6IElEQkRhdGFiYXNlID0gbnVsbDtcclxuXHJcblx0XHRhc3luYyBmdW5jdGlvbiBvcGVuSWRiKCk6IFByb21pc2U8SURCRGF0YWJhc2U+IHtcclxuXHRcdFx0aWYgKGlkYkluc3RhbmNlKSByZXR1cm4gaWRiSW5zdGFuY2U7XHJcblx0XHRcdGlmIChhd2FpdCBfaWRiSW5zdGFuY2VQcm9taXNlKSB7XHJcblx0XHRcdFx0cmV0dXJuIGlkYkluc3RhbmNlO1xyXG5cdFx0XHR9XHJcblx0XHRcdGxldCBpcnEgPSBpbmRleGVkREIub3BlbignZmV0Y2gnKTtcclxuXHRcdFx0aXJxLm9udXBncmFkZW5lZWRlZCA9IGV2ZW50ID0+IHtcclxuXHRcdFx0XHRsZXQgZGIgPSBpcnEucmVzdWx0O1xyXG5cdFx0XHRcdGxldCBzdG9yZSA9IGRiLmNyZWF0ZU9iamVjdFN0b3JlKCdmZXRjaCcsIHsga2V5UGF0aDogJ3VybCcgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0X2lkYkluc3RhbmNlUHJvbWlzZSA9IG5ldyBQcm9taXNlKChyLCBqKSA9PiB7XHJcblx0XHRcdFx0aXJxLm9uc3VjY2VzcyA9IHI7XHJcblx0XHRcdFx0aXJxLm9uZXJyb3IgPSBqO1xyXG5cdFx0XHR9KS50aGVuKCgpID0+IGlycS5yZXN1bHQsICgpID0+IG51bGwpO1xyXG5cdFx0XHRpZGJJbnN0YW5jZSA9IF9pZGJJbnN0YW5jZVByb21pc2UgPSBhd2FpdCBfaWRiSW5zdGFuY2VQcm9taXNlO1xyXG5cdFx0XHRpZiAoIWlkYkluc3RhbmNlKSB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBvcGVuIGluZGV4ZWREQicpO1xyXG5cdFx0XHRyZXR1cm4gaWRiSW5zdGFuY2U7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGlkYkNsZWFyKCkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1RPRE8nKVxyXG5cdFx0fVxyXG5cclxuXHJcblx0XHRhc3luYyBmdW5jdGlvbiBpZGJHZXQodXJsOiBzdHJpbmcpOiBQcm9taXNlPHsgdXJsOiBzdHJpbmcsIGRhdGE6IHVua25vd24sIGNhY2hlZEF0OiBudW1iZXIgfSB8IHVuZGVmaW5lZD4ge1xyXG5cdFx0XHRsZXQgZGIgPSBhd2FpdCBvcGVuSWRiKCk7XHJcblx0XHRcdGxldCB0ID0gZGIudHJhbnNhY3Rpb24oWydmZXRjaCddLCAncmVhZG9ubHknKTtcclxuXHRcdFx0bGV0IHJxID0gdC5vYmplY3RTdG9yZSgnZmV0Y2gnKS5nZXQodXJsKTtcclxuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKHIgPT4ge1xyXG5cdFx0XHRcdHJxLm9uc3VjY2VzcyA9ICgpID0+IHIocnEucmVzdWx0KTtcclxuXHRcdFx0XHRycS5vbmVycm9yID0gKCkgPT4gcih1bmRlZmluZWQpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRhc3luYyBmdW5jdGlvbiBpZGJQdXQodXJsOiBzdHJpbmcsIGRhdGE6IHVua25vd24sIGNhY2hlZEF0PzogbnVtYmVyKTogUHJvbWlzZTxJREJWYWxpZEtleSB8IHVuZGVmaW5lZD4ge1xyXG5cdFx0XHRsZXQgZGIgPSBhd2FpdCBvcGVuSWRiKCk7XHJcblx0XHRcdGxldCB0ID0gZGIudHJhbnNhY3Rpb24oWydmZXRjaCddLCAncmVhZHdyaXRlJyk7XHJcblx0XHRcdGxldCBycSA9IHQub2JqZWN0U3RvcmUoJ2ZldGNoJykucHV0KHsgdXJsLCBkYXRhLCBjYWNoZWRBdDogY2FjaGVkQXQgPz8gK25ldyBEYXRlKCkgfSk7XHJcblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZShyID0+IHtcclxuXHRcdFx0XHRycS5vbnN1Y2Nlc3MgPSAoKSA9PiByKHJxLnJlc3VsdCk7XHJcblx0XHRcdFx0cnEub25lcnJvciA9ICgpID0+IHIodW5kZWZpbmVkKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFbnRyeUZpbHRlcmVyRXh0ZW5zaW9uIHtcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIGNhbiBiZSBlaXRoZXIgTWFwIG9yIFdlYWtNYXBcclxuXHRcdCAqIChXZWFrTWFwIGlzIGxpa2VseSB0byBiZSB1c2VsZXNzIGlmIHRoZXJlIGFyZSBsZXNzIHRoZW4gMTBrIG9sZCBub2RlcyBpbiBtYXApXHJcblx0XHQgKi9cclxuXHRcdGxldCBNYXBUeXBlID0gTWFwO1xyXG5cdFx0dHlwZSBNYXBUeXBlPEsgZXh0ZW5kcyBvYmplY3QsIFY+ID0vLyBNYXA8SywgVj4gfCBcclxuXHRcdFx0V2Vha01hcDxLLCBWPjtcclxuXHJcblx0XHRmdW5jdGlvbiB0b0VsQXJyYXkoZW50cnlTZWxlY3Rvcjogc2VsZWN0b3IgfCAoKCkgPT4gSFRNTEVsZW1lbnRbXSkpOiBIVE1MRWxlbWVudFtdIHtcclxuXHRcdFx0cmV0dXJuIHR5cGVvZiBlbnRyeVNlbGVjdG9yID09ICdmdW5jdGlvbicgPyBlbnRyeVNlbGVjdG9yKCkgOiBxcShlbnRyeVNlbGVjdG9yKTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgY2xhc3MgRW50cnlGaWx0ZXJlcjxEYXRhIGV4dGVuZHMge30gPSB7fT4ge1xyXG5cdFx0XHRjb250YWluZXI6IEhUTUxFbGVtZW50O1xyXG5cdFx0XHRlbnRyeVNlbGVjdG9yOiBzZWxlY3RvciB8ICgoKSA9PiBIVE1MRWxlbWVudFtdKTtcclxuXHRcdFx0Y29uc3RydWN0b3IoZW50cnlTZWxlY3Rvcjogc2VsZWN0b3IgfCAoKCkgPT4gSFRNTEVsZW1lbnRbXSksIGVuYWJsZWQ6IGJvb2xlYW4gfCAnc29mdCcgPSAnc29mdCcpIHtcclxuXHRcdFx0XHR0aGlzLmVudHJ5U2VsZWN0b3IgPSBlbnRyeVNlbGVjdG9yO1xyXG5cdFx0XHRcdHRoaXMuY29udGFpbmVyID0gZWxtKCcuZWYtY29udGFpbmVyJyk7XHJcblx0XHRcdFx0aWYgKCFlbnRyeVNlbGVjdG9yKSB7XHJcblx0XHRcdFx0XHQvLyBkaXNhYmxlIGlmIG5vIHNlbGVjdG9yIHByb3ZpZGVkIChsaWtlbHkgaXMgYSBnZW5lcmljIGVmKVxyXG5cdFx0XHRcdFx0dGhpcy5kaXNhYmxlKCk7XHJcblx0XHRcdFx0fSBlbHNlIGlmIChlbmFibGVkID09ICdzb2Z0Jykge1xyXG5cdFx0XHRcdFx0dGhpcy5zb2Z0RGlzYWJsZSA9IHRydWU7XHJcblx0XHRcdFx0XHR0aGlzLmRpc2FibGUoJ3NvZnQnKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGVuYWJsZWQgIT0gZmFsc2UpIHtcclxuXHRcdFx0XHRcdHRoaXMuc3R5bGUoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy51cGRhdGUoKTtcclxuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyPFBhZ2luYXRlRXh0ZW5zaW9uLlBNb2RpZnlFdmVudD4oJ3BhZ2luYXRpb25tb2RpZnknLCAoKSA9PiB0aGlzLnJlcXVlc3RVcGRhdGUoKSk7XHJcblx0XHRcdFx0ZXRjLm9uaGVpZ2h0Y2hhbmdlKCgpID0+IHRoaXMucmVxdWVzdFVwZGF0ZSgpKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZW50cmllczogSFRNTEVsZW1lbnRbXSA9IFtdO1xyXG5cdFx0XHRlbnRyeURhdGFzOiBNYXBUeXBlPEhUTUxFbGVtZW50LCBEYXRhPiA9IG5ldyBNYXBUeXBlKCk7XHJcblxyXG5cdFx0XHRnZXREYXRhKGVsOiBIVE1MRWxlbWVudCk6IERhdGE7XHJcblx0XHRcdGdldERhdGEoKTogRGF0YVtdO1xyXG5cdFx0XHRnZXREYXRhKGVsPzogSFRNTEVsZW1lbnQpOiBEYXRhIHwgRGF0YVtdIHtcclxuXHRcdFx0XHRpZiAoIWVsKSByZXR1cm4gdGhpcy5lbnRyaWVzLm1hcChlID0+IHRoaXMuZ2V0RGF0YShlKSk7XHJcblx0XHRcdFx0bGV0IGRhdGEgPSB0aGlzLmVudHJ5RGF0YXMuZ2V0KGVsKTtcclxuXHRcdFx0XHRpZiAoIWRhdGEpIHtcclxuXHRcdFx0XHRcdGRhdGEgPSB0aGlzLnBhcnNlRW50cnkoZWwpO1xyXG5cdFx0XHRcdFx0dGhpcy5lbnRyeURhdGFzLnNldChlbCwgZGF0YSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBkYXRhO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR1cGRhdGVQZW5kaW5nID0gZmFsc2U7XHJcblx0XHRcdHJlcGFyc2VQZW5kaW5nID0gZmFsc2U7XHJcblx0XHRcdHJlcXVlc3RVcGRhdGUocmVwYXJzZSA9IGZhbHNlKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMudXBkYXRlUGVuZGluZykgcmV0dXJuO1xyXG5cdFx0XHRcdHRoaXMudXBkYXRlUGVuZGluZyA9IHRydWU7XHJcblx0XHRcdFx0aWYgKHJlcGFyc2UpIHRoaXMucmVwYXJzZVBlbmRpbmcgPSB0cnVlO1xyXG5cdFx0XHRcdHNldFRpbWVvdXQoKCkgPT4gdGhpcy51cGRhdGUoKSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHBhcnNlcnM6IFBhcnNlckZuPERhdGE+W10gPSBbXTtcclxuXHRcdFx0d3JpdGVEYXRhQXR0cmlidXRlID0gZmFsc2U7XHJcblx0XHRcdGFkZFBhcnNlcihwYXJzZXI6IFBhcnNlckZuPERhdGE+KSB7XHJcblx0XHRcdFx0dGhpcy5wYXJzZXJzLnB1c2gocGFyc2VyKTtcclxuXHRcdFx0XHR0aGlzLnJlcXVlc3RVcGRhdGUodHJ1ZSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cGFyc2VFbnRyeShlbDogSFRNTEVsZW1lbnQpOiBEYXRhIHtcclxuXHRcdFx0XHRlbC5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2VmLWVudHJ5LWNvbnRhaW5lcicpO1xyXG5cdFx0XHRcdGVsLmNsYXNzTGlzdC5hZGQoJ2VmLWVudHJ5Jyk7XHJcblxyXG5cdFx0XHRcdGxldCBkYXRhOiBEYXRhID0ge30gYXMgRGF0YTtcclxuXHRcdFx0XHRmb3IgKGxldCBwYXJzZXIgb2YgdGhpcy5wYXJzZXJzKSB7XHJcblx0XHRcdFx0XHRsZXQgbmV3RGF0YSA9IHBhcnNlcihlbCwgZGF0YSk7XHJcblx0XHRcdFx0XHRpZiAoIW5ld0RhdGEgfHwgbmV3RGF0YSA9PSBkYXRhKSBjb250aW51ZTtcclxuXHRcdFx0XHRcdGlmICghSXNQcm9taXNlKG5ld0RhdGEpKSB7XHJcblx0XHRcdFx0XHRcdE9iamVjdC5hc3NpZ24oZGF0YSwgbmV3RGF0YSk7XHJcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0bmV3RGF0YS50aGVuKHBOZXdEYXRhID0+IHtcclxuXHRcdFx0XHRcdFx0aWYgKHBOZXdEYXRhICYmIHBOZXdEYXRhICE9IGRhdGEpIHtcclxuXHRcdFx0XHRcdFx0XHRPYmplY3QuYXNzaWduKGRhdGEsIHBOZXdEYXRhKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR0aGlzLnJlcXVlc3RVcGRhdGUoKTtcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0aGlzLndyaXRlRGF0YUF0dHJpYnV0ZSkge1xyXG5cdFx0XHRcdFx0ZWwuc2V0QXR0cmlidXRlKCdlZi1kYXRhJywgSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gZGF0YTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0YWRkSXRlbTxJVCwgVCBleHRlbmRzIElULCBJUyBleHRlbmRzIEZpbHRlcmVySXRlbVBhcnRpYWwsIFMsIFRTIGV4dGVuZHMgUyAmIElTICYgRmlsdGVyZXJJdGVtU291cmNlPihjb25zdHJ1Y3RvcjogeyBuZXcoZGF0YTogVFMpOiBUIH0sIGxpc3Q6IElUW10sIGRhdGE6IElTLCBzb3VyY2U6IFMpOiBUIHtcclxuXHRcdFx0XHRPYmplY3QuYXNzaWduKGRhdGEsIHNvdXJjZSwgeyBwYXJlbnQ6IHRoaXMgfSk7XHJcblx0XHRcdFx0ZGF0YS5uYW1lID8/PSBkYXRhLmlkO1xyXG5cdFx0XHRcdGxldCBpdGVtID0gbmV3IGNvbnN0cnVjdG9yKGRhdGEgYXMgVFMpO1xyXG5cdFx0XHRcdGxpc3QucHVzaChpdGVtKTtcclxuXHRcdFx0XHRyZXR1cm4gaXRlbTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZmlsdGVyczogSUZpbHRlcjxEYXRhPltdID0gW107XHJcblx0XHRcdHNvcnRlcnM6IElTb3J0ZXI8RGF0YT5bXSA9IFtdO1xyXG5cdFx0XHRtb2RpZmllcnM6IElNb2RpZmllcjxEYXRhPltdID0gW107XHJcblxyXG5cdFx0XHRhZGRGaWx0ZXIoaWQ6IHN0cmluZywgZmlsdGVyOiBGaWx0ZXJGbjxEYXRhPiwgZGF0YTogRmlsdGVyUGFydGlhbDxEYXRhPiA9IHt9KTogRmlsdGVyPERhdGE+IHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hZGRJdGVtKEZpbHRlciwgdGhpcy5maWx0ZXJzLCBkYXRhLCB7IGlkLCBmaWx0ZXIgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0YWRkVkZpbHRlcjxWIGV4dGVuZHMgbnVtYmVyIHwgc3RyaW5nPihpZDogc3RyaW5nLCBmaWx0ZXI6IFZhbHVlRmlsdGVyRm48RGF0YSwgVj4sIGRhdGE6IFZhbHVlRmlsdGVyUGFydGlhbDxEYXRhLCBWPik6IFZhbHVlRmlsdGVyPERhdGEsIFY+O1xyXG5cdFx0XHRhZGRWRmlsdGVyPFYgZXh0ZW5kcyBudW1iZXIgfCBzdHJpbmc+KGlkOiBzdHJpbmcsIGZpbHRlcjogVmFsdWVGaWx0ZXJGbjxEYXRhLCBWPiwgZGF0YTogVik7XHJcblx0XHRcdGFkZFZGaWx0ZXI8ViBleHRlbmRzIG51bWJlciB8IHN0cmluZz4oaWQ6IHN0cmluZywgZmlsdGVyOiBWYWx1ZUZpbHRlckZuPERhdGEsIFY+LCBkYXRhOiBWYWx1ZUZpbHRlclBhcnRpYWw8RGF0YSwgVj4gfCBWKSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiBkYXRhICE9ICdvYmplY3QnIHx8ICFkYXRhKSB7XHJcblx0XHRcdFx0XHRkYXRhID0geyBpbnB1dDogZGF0YSBhcyBWIH07XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiB0aGlzLmFkZEl0ZW0oVmFsdWVGaWx0ZXIsIHRoaXMuZmlsdGVycywgZGF0YSwgeyBpZCwgZmlsdGVyIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFkZE1GaWx0ZXIoaWQ6IHN0cmluZywgdmFsdWU6IChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpID0+IHN0cmluZywgZGF0YTogTWF0Y2hGaWx0ZXJTb3VyY2U8RGF0YT4pIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hZGRJdGVtKE1hdGNoRmlsdGVyLCB0aGlzLmZpbHRlcnMsIGRhdGEsIHsgaWQsIHZhbHVlIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFkZFRhZ0ZpbHRlcihpZDogc3RyaW5nLCBkYXRhOiBUYWdGaWx0ZXJTb3VyY2U8RGF0YT4pIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hZGRJdGVtKFRhZ0ZpbHRlciwgdGhpcy5maWx0ZXJzLCBkYXRhLCB7IGlkIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFkZFNvcnRlcjxWIGV4dGVuZHMgbnVtYmVyIHwgc3RyaW5nPihpZDogc3RyaW5nLCBzb3J0ZXI6IFNvcnRlckZuPERhdGEsIFY+LCBkYXRhOiBTb3J0ZXJQYXJ0aWFsU291cmNlPERhdGEsIFY+ID0ge30pOiBTb3J0ZXI8RGF0YSwgVj4ge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmFkZEl0ZW0oU29ydGVyLCB0aGlzLnNvcnRlcnMsIGRhdGEsIHsgaWQsIHNvcnRlciB9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRhZGRNb2RpZmllcihpZDogc3RyaW5nLCBtb2RpZmllcjogTW9kaWZpZXJGbjxEYXRhPiwgZGF0YTogTW9kaWZpZXJQYXJ0aWFsPERhdGE+ID0ge30pOiBNb2RpZmllcjxEYXRhPiB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuYWRkSXRlbShNb2RpZmllciwgdGhpcy5tb2RpZmllcnMsIGRhdGEsIHsgaWQsIG1vZGlmaWVyIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFkZFByZWZpeChpZDogc3RyaW5nLCBwcmVmaXg6IFByZWZpeGVyRm48RGF0YT4sIGRhdGE6IFByZWZpeGVyUGFydGlhbDxEYXRhPiA9IHt9KTogUHJlZml4ZXI8RGF0YT4ge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmFkZEl0ZW0oUHJlZml4ZXIsIHRoaXMubW9kaWZpZXJzLCBkYXRhLCB7IGlkLCBwcmVmaXggfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0YWRkUGFnaW5hdGlvbkluZm8oaWQ6IHN0cmluZyA9ICdwZ2luZm8nLCBkYXRhOiBQYXJ0aWFsPEZpbHRlcmVySXRlbVNvdXJjZT4gPSB7fSkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmFkZEl0ZW0oUGFnaW5hdGlvbkluZm9GaWx0ZXIsIHRoaXMuZmlsdGVycywgZGF0YSwgeyBpZCB9KTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZmlsdGVyRW50cmllcygpIHtcclxuXHRcdFx0XHRmb3IgKGxldCBlbCBvZiB0aGlzLmVudHJpZXMpIHtcclxuXHRcdFx0XHRcdGxldCBkYXRhID0gdGhpcy5nZXREYXRhKGVsKTtcclxuXHRcdFx0XHRcdGxldCB2YWx1ZSA9IHRydWU7XHJcblx0XHRcdFx0XHRmb3IgKGxldCBmaWx0ZXIgb2YgdGhpcy5maWx0ZXJzKSB7XHJcblx0XHRcdFx0XHRcdHZhbHVlID0gdmFsdWUgJiYgZmlsdGVyLmFwcGx5KGRhdGEsIGVsKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsLmNsYXNzTGlzdC50b2dnbGUoJ2VmLWZpbHRlcmVkLW91dCcsICF2YWx1ZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRvcmRlcmVkRW50cmllczogSFRNTEVsZW1lbnRbXSA9IFtdO1xyXG5cdFx0XHRvcmRlck1vZGU6ICdjc3MnIHwgJ3N3YXAnID0gJ2Nzcyc7XHJcblx0XHRcdHNvcnRFbnRyaWVzKCkge1xyXG5cdFx0XHRcdGlmICh0aGlzLmVudHJpZXMubGVuZ3RoIDw9IDEpIHJldHVybjtcclxuXHRcdFx0XHRpZiAodGhpcy5vcmRlcmVkRW50cmllcy5sZW5ndGggPT0gMCkgdGhpcy5vcmRlcmVkRW50cmllcyA9IHRoaXMuZW50cmllcztcclxuXHRcdFx0XHRpZiAodGhpcy5zb3J0ZXJzLmxlbmd0aCA9PSAwKSByZXR1cm47XHJcblxyXG5cdFx0XHRcdGxldCBlbnRyaWVzID0gdGhpcy5lbnRyaWVzO1xyXG5cdFx0XHRcdGxldCBwYWlyczogW0RhdGEsIEhUTUxFbGVtZW50XVtdID0gZW50cmllcy5tYXAoZSA9PiBbdGhpcy5nZXREYXRhKGUpLCBlXSk7XHJcblx0XHRcdFx0bGV0IGFsbE9mZiA9IHRydWU7XHJcblx0XHRcdFx0Zm9yIChsZXQgc29ydGVyIG9mIHRoaXMuc29ydGVycykge1xyXG5cdFx0XHRcdFx0aWYgKHNvcnRlci5tb2RlICE9ICdvZmYnKSB7XHJcblx0XHRcdFx0XHRcdHBhaXJzID0gc29ydGVyLnNvcnQocGFpcnMpO1xyXG5cdFx0XHRcdFx0XHRhbGxPZmYgPSBmYWxzZTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZW50cmllcyA9IHBhaXJzLm1hcChlID0+IGVbMV0pO1xyXG5cdFx0XHRcdGlmICh0aGlzLm9yZGVyTW9kZSA9PSAnc3dhcCcpIHtcclxuXHRcdFx0XHRcdGlmICghZW50cmllcy5ldmVyeSgoZSwgaSkgPT4gZSA9PSB0aGlzLm9yZGVyZWRFbnRyaWVzW2ldKSkge1xyXG5cdFx0XHRcdFx0XHRsZXQgYnIgPSBlbG0oYCR7ZW50cmllc1swXT8udGFnTmFtZX0uZWYtYmVmb3JlLXNvcnRbaGlkZGVuXWApO1xyXG5cdFx0XHRcdFx0XHR0aGlzLm9yZGVyZWRFbnRyaWVzWzBdLmJlZm9yZShicik7XHJcblx0XHRcdFx0XHRcdGJyLmFmdGVyKC4uLmVudHJpZXMpO1xyXG5cdFx0XHRcdFx0XHRici5yZW1vdmUoKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0ZW50cmllcy5tYXAoKGUsIGkpID0+IHtcclxuXHRcdFx0XHRcdFx0aWYgKGFsbE9mZikge1xyXG5cdFx0XHRcdFx0XHRcdGUuY2xhc3NMaXN0LnJlbW92ZSgnZWYtcmVvcmRlcicpO1xyXG5cdFx0XHRcdFx0XHRcdGUucGFyZW50RWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdlZi1yZW9yZGVyLWNvbnRhaW5lcicpO1xyXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdC8vIHVzZSBgZGlzcGxheTpmbGV4YCBjb250YWluZXIgYW5kIGBvcmRlcjp2YXIoLS1lZi1vcmRlcilgIGZvciBjaGlsZHJlbiBcclxuXHRcdFx0XHRcdFx0XHRlLmNsYXNzTGlzdC5hZGQoJ2VmLXJlb3JkZXInKTtcclxuXHRcdFx0XHRcdFx0XHRlLnN0eWxlLnNldFByb3BlcnR5KCctLWVmLW9yZGVyJywgaSArICcnKTtcclxuXHRcdFx0XHRcdFx0XHRlLnBhcmVudEVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnZWYtcmVvcmRlci1jb250YWluZXInKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMub3JkZXJlZEVudHJpZXMgPSBlbnRyaWVzO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRtb2RpZnlFbnRyaWVzKCkge1xyXG5cdFx0XHRcdGxldCBlbnRyaWVzID0gdGhpcy5lbnRyaWVzO1xyXG5cdFx0XHRcdGxldCBwYWlyczogW0hUTUxFbGVtZW50LCBEYXRhXVtdID0gZW50cmllcy5tYXAoZSA9PiBbZSwgdGhpcy5nZXREYXRhKGUpXSk7XHJcblx0XHRcdFx0Zm9yIChsZXQgbW9kaWZpZXIgb2YgdGhpcy5tb2RpZmllcnMpIHtcclxuXHRcdFx0XHRcdGZvciAobGV0IFtlLCBkXSBvZiBwYWlycykge1xyXG5cdFx0XHRcdFx0XHRtb2RpZmllci5hcHBseShkLCBlKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdG1vdmVUb1RvcChpdGVtOiBJU29ydGVyPERhdGE+IHwgSU1vZGlmaWVyPERhdGE+KSB7XHJcblx0XHRcdFx0aWYgKHRoaXMuc29ydGVycy5pbmNsdWRlcyhpdGVtIGFzIElTb3J0ZXI8RGF0YT4pKSB7XHJcblx0XHRcdFx0XHR0aGlzLnNvcnRlcnMuc3BsaWNlKHRoaXMuc29ydGVycy5pbmRleE9mKGl0ZW0gYXMgSVNvcnRlcjxEYXRhPiksIDEpO1xyXG5cdFx0XHRcdFx0dGhpcy5zb3J0ZXJzLnB1c2goaXRlbSBhcyBJU29ydGVyPERhdGE+KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kaWZpZXJzLmluY2x1ZGVzKGl0ZW0gYXMgSU1vZGlmaWVyPERhdGE+KSkge1xyXG5cdFx0XHRcdFx0dGhpcy5tb2RpZmllcnMuc3BsaWNlKHRoaXMubW9kaWZpZXJzLmluZGV4T2YoaXRlbSBhcyBJTW9kaWZpZXI8RGF0YT4pLCAxKTtcclxuXHRcdFx0XHRcdHRoaXMubW9kaWZpZXJzLnB1c2goaXRlbSBhcyBJTW9kaWZpZXI8RGF0YT4pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dXBkYXRlKHJlcGFyc2UgPSB0aGlzLnJlcGFyc2VQZW5kaW5nKSB7XHJcblx0XHRcdFx0dGhpcy51cGRhdGVQZW5kaW5nID0gZmFsc2U7XHJcblx0XHRcdFx0aWYgKHRoaXMuZGlzYWJsZWQgPT0gdHJ1ZSkgcmV0dXJuO1xyXG5cclxuXHRcdFx0XHRsZXQgZW50cmllcyA9IHR5cGVvZiB0aGlzLmVudHJ5U2VsZWN0b3IgPT0gJ2Z1bmN0aW9uJyA/IHRoaXMuZW50cnlTZWxlY3RvcigpIDogcXEodGhpcy5lbnRyeVNlbGVjdG9yKTtcclxuXHJcblx0XHRcdFx0aWYgKHRoaXMuZGlzYWJsZWQgPT0gJ3NvZnQnKSB7XHJcblx0XHRcdFx0XHRpZiAoIWVudHJpZXMubGVuZ3RoKSByZXR1cm47XHJcblx0XHRcdFx0XHR0aGlzLmVuYWJsZSgpO1xyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodGhpcy5kaXNhYmxlZCAhPSBmYWxzZSkgdGhyb3cgMDtcclxuXHJcblx0XHRcdFx0aWYgKCFlbnRyaWVzLmxlbmd0aCAmJiB0aGlzLnNvZnREaXNhYmxlKSB7XHJcblx0XHRcdFx0XHR0aGlzLmRpc2FibGUoJ3NvZnQnKTsgcmV0dXJuO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0aWYgKHJlcGFyc2UpIHtcclxuXHRcdFx0XHRcdHRoaXMuZW50cnlEYXRhcyA9IG5ldyBNYXBUeXBlKCk7XHJcblx0XHRcdFx0XHR0aGlzLnJlcGFyc2VQZW5kaW5nID0gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICghdGhpcy5jb250YWluZXIuY2xvc2VzdCgnYm9keScpKSB7XHJcblx0XHRcdFx0XHR0aGlzLmNvbnRhaW5lci5hcHBlbmRUbygnYm9keScpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodGhpcy5lbnRyaWVzLmxlbmd0aCAhPSBlbnRyaWVzLmxlbmd0aCB8fCB0aGlzLmVudHJpZXMpIHtcclxuXHRcdFx0XHRcdC8vIFRPRE86IHNvcnQgZW50cmllcyBpbiBpbml0aWFsIG9yZGVyXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMuZW50cmllcyA9IGVudHJpZXM7XHJcblx0XHRcdFx0dGhpcy5maWx0ZXJFbnRyaWVzKCk7XHJcblx0XHRcdFx0dGhpcy5zb3J0RW50cmllcygpO1xyXG5cdFx0XHRcdHRoaXMubW9kaWZ5RW50cmllcygpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRvZmZJbmNvbXBhdGlibGUoaW5jb21wYXRpYmxlOiBzdHJpbmdbXSkge1xyXG5cdFx0XHRcdGZvciAobGV0IGZpbHRlciBvZiB0aGlzLmZpbHRlcnMpIHtcclxuXHRcdFx0XHRcdGlmIChpbmNvbXBhdGlibGUuaW5jbHVkZXMoZmlsdGVyLmlkKSkge1xyXG5cdFx0XHRcdFx0XHRmaWx0ZXIudG9nZ2xlTW9kZSgnb2ZmJyk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZvciAobGV0IHNvcnRlciBvZiB0aGlzLnNvcnRlcnMpIHtcclxuXHRcdFx0XHRcdGlmIChpbmNvbXBhdGlibGUuaW5jbHVkZXMoc29ydGVyLmlkKSkge1xyXG5cdFx0XHRcdFx0XHRzb3J0ZXIudG9nZ2xlTW9kZSgnb2ZmJyk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZvciAobGV0IG1vZGlmaWVyIG9mIHRoaXMubW9kaWZpZXJzKSB7XHJcblx0XHRcdFx0XHRpZiAoaW5jb21wYXRpYmxlLmluY2x1ZGVzKG1vZGlmaWVyLmlkKSkge1xyXG5cdFx0XHRcdFx0XHRtb2RpZmllci50b2dnbGVNb2RlKCdvZmYnKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHN0eWxlKHMgPSAnJykge1xyXG5cdFx0XHRcdEVudHJ5RmlsdGVyZXIuc3R5bGUocyk7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHRcdH1cclxuXHRcdFx0c3RhdGljIHN0eWxlKHMgPSAnJykge1xyXG5cdFx0XHRcdGxldCBzdHlsZSA9IHEoJ3N0eWxlLmVmLXN0eWxlJykgfHwgZWxtKCdzdHlsZS5lZi1zdHlsZScpLmFwcGVuZFRvKCdoZWFkJyk7XHJcblx0XHRcdFx0c3R5bGUuaW5uZXJIVE1MID0gYFxyXG5cdFx0XHRcdFx0LmVmLWNvbnRhaW5lciB7XHJcblx0XHRcdFx0XHRcdGRpc3BsYXk6IGZsZXg7XHJcblx0XHRcdFx0XHRcdGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XHJcblx0XHRcdFx0XHRcdHBvc2l0aW9uOiBmaXhlZDtcclxuXHRcdFx0XHRcdFx0dG9wOiAwO1xyXG5cdFx0XHRcdFx0XHRyaWdodDogMDtcclxuXHRcdFx0XHRcdFx0ei1pbmRleDogOTk5OTk5OTk5OTk5OTk5OTk5OTtcclxuXHRcdFx0XHRcdFx0bWluLXdpZHRoOiAxMDBweDtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC5lZi1lbnRyeSB7fVxyXG5cclxuXHRcdFx0XHRcdC5lZi1maWx0ZXJlZC1vdXQge1xyXG5cdFx0XHRcdFx0XHRkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0YnV0dG9uLmVmLWl0ZW0ge31cclxuXHRcdFx0XHRcdGJ1dHRvbi5lZi1pdGVtW2VmLW1vZGU9XCJvZmZcIl0ge1xyXG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kOiBsaWdodGdyYXk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRidXR0b24uZWYtaXRlbVtlZi1tb2RlPVwib25cIl0ge1xyXG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kOiBsaWdodGdyZWVuO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0YnV0dG9uLmVmLWl0ZW1bZWYtbW9kZT1cIm9wcG9zaXRlXCJdIHtcclxuXHRcdFx0XHRcdFx0YmFja2dyb3VuZDogeWVsbG93O1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGJ1dHRvbi5lZi1pdGVtLmVmLWZpbHRlciA+IGlucHV0IHtcclxuXHRcdFx0XHRcdFx0ZmxvYXQ6IHJpZ2h0O1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFtlZi1wcmVmaXhdOjpiZWZvcmUge1xyXG5cdFx0XHRcdFx0XHRjb250ZW50OiBhdHRyKGVmLXByZWZpeCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRbZWYtcG9zdGZpeF06OmFmdGVyIHtcclxuXHRcdFx0XHRcdFx0Y29udGVudDogYXR0cihlZi1wb3N0Zml4KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdGAgKyBzO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRzb2Z0RGlzYWJsZSA9IHRydWU7XHJcblx0XHRcdGRpc2FibGVkOiBib29sZWFuIHwgJ3NvZnQnID0gZmFsc2U7XHJcblx0XHRcdGRpc2FibGUoc29mdD86ICdzb2Z0Jykge1xyXG5cdFx0XHRcdHRoaXMuZGlzYWJsZWQgPSB0cnVlO1xyXG5cdFx0XHRcdGlmIChzb2Z0ID09ICdzb2Z0JykgdGhpcy5kaXNhYmxlZCA9ICdzb2Z0JztcclxuXHRcdFx0XHR0aGlzLmNvbnRhaW5lci5yZW1vdmUoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbmFibGUoKSB7XHJcblx0XHRcdFx0dGhpcy5kaXNhYmxlZCA9IGZhbHNlO1xyXG5cdFx0XHRcdHRoaXMudXBkYXRlUGVuZGluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdHRoaXMucmVxdWVzdFVwZGF0ZSgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjbGVhcigpIHtcclxuXHRcdFx0XHR0aGlzLmVudHJ5RGF0YXMgPSBuZXcgTWFwKCk7XHJcblx0XHRcdFx0dGhpcy5wYXJzZXJzLnNwbGljZSgwLCA5OTkpO1xyXG5cdFx0XHRcdHRoaXMuZmlsdGVycy5zcGxpY2UoMCwgOTk5KS5tYXAoZSA9PiBlLnJlbW92ZSgpKTtcclxuXHRcdFx0XHR0aGlzLnNvcnRlcnMuc3BsaWNlKDAsIDk5OSkubWFwKGUgPT4gZS5yZW1vdmUoKSk7XHJcblx0XHRcdFx0dGhpcy5tb2RpZmllcnMuc3BsaWNlKDAsIDk5OSkubWFwKGUgPT4gZS5yZW1vdmUoKSk7XHJcblx0XHRcdFx0dGhpcy5lbmFibGUoKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Z2V0IF9kYXRhcygpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5lbnRyaWVzXHJcblx0XHRcdFx0XHQuZmlsdGVyKGUgPT4gIWUuY2xhc3NMaXN0LmNvbnRhaW5zKCdlZi1maWx0ZXJlZC1vdXQnKSlcclxuXHRcdFx0XHRcdC5tYXAoZSA9PiB0aGlzLmdldERhdGEoZSkpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIElzUHJvbWlzZTxUPihwOiBQcm9taXNlTGlrZTxUPiB8IFQpOiBwIGlzIFByb21pc2VMaWtlPFQ+IHtcclxuXHRcdFx0aWYgKCFwKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdHJldHVybiB0eXBlb2YgKHAgYXMgUHJvbWlzZUxpa2U8VD4pLnRoZW4gPT0gJ2Z1bmN0aW9uJztcclxuXHRcdH1cclxuXHR9XHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHRleHBvcnQgY2xhc3MgT2JzZXJ2ZXIge1xyXG5cdFx0XHJcblx0fVxyXG59XHJcblxyXG4vKlxyXG5cclxuZnVuY3Rpb24gb2JzZXJ2ZUNsYXNzQWRkKGNscywgY2IpIHtcclxuXHRsZXQgcXVldWVkID0gZmFsc2U7XHJcblx0YXN5bmMgZnVuY3Rpb24gcnVuKCkge1xyXG5cdFx0aWYgKHF1ZXVlZCkgcmV0dXJuO1xyXG5cdFx0cXVldWVkID0gdHJ1ZTtcclxuXHRcdGF3YWl0IFByb21pc2UuZnJhbWUoKTtcclxuXHRcdHF1ZXVlZCA9IGZhbHNlO1xyXG5cdFx0Y2IoKTtcclxuXHR9XHJcblx0bmV3IE11dGF0aW9uT2JzZXJ2ZXIobGlzdCA9PiB7XHJcblx0XHRmb3IgKGxldCBtciBvZiBsaXN0KSB7XHJcblx0XHRcdGlmIChtci50eXBlID09ICdhdHRyaWJ1dGVzJyAmJiBtci5hdHRyaWJ1dGVOYW1lID09ICdjbGFzcycpIHtcclxuXHRcdFx0XHRpZiAobXIudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhjbHMpKSB7XHJcblx0XHRcdFx0XHRydW4oKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKG1yLnR5cGUgPT0gJ2NoaWxkTGlzdCcpIHtcclxuXHRcdFx0XHRmb3IgKGxldCBjaCBvZiBtci5hZGRlZE5vZGVzKSB7XHJcblx0XHRcdFx0XHRpZiAoY2guY2xhc3NMaXN0Py5jb250YWlucyhjbHMpKSB7XHJcblx0XHRcdFx0XHRcdHJ1bigpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0pLm9ic2VydmUoZG9jdW1lbnQuYm9keSwge1xyXG5cdFx0Y2hpbGRMaXN0OiB0cnVlLFxyXG5cdFx0YXR0cmlidXRlczogdHJ1ZSxcclxuXHRcdHN1YnRyZWU6IHRydWUsXHJcblx0fSk7XHJcbn1cclxuXHJcbiovIiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblxyXG5cdGV4cG9ydCBuYW1lc3BhY2UgUGFnaW5hdGVFeHRlbnNpb24ge1xyXG5cclxuXHRcdGV4cG9ydCB0eXBlIFBSZXF1ZXN0RXZlbnQgPSBDdXN0b21FdmVudDx7XHJcblx0XHRcdHJlYXNvbj86IEV2ZW50LFxyXG5cdFx0XHRjb3VudDogbnVtYmVyLFxyXG5cdFx0XHRjb25zdW1lZDogbnVtYmVyO1xyXG5cdFx0XHRfZXZlbnQ/OiAncGFnaW5hdGlvbnJlcXVlc3QnLFxyXG5cdFx0fT47XHJcblx0XHRleHBvcnQgdHlwZSBQU3RhcnRFdmVudCA9IEN1c3RvbUV2ZW50PHtcclxuXHRcdFx0cGFnaW5hdGU6IFBhZ2luYXRlLFxyXG5cdFx0XHRfZXZlbnQ/OiAncGFnaW5hdGlvbnN0YXJ0JyxcclxuXHRcdH0+O1xyXG5cdFx0ZXhwb3J0IHR5cGUgUEVuZEV2ZW50ID0gQ3VzdG9tRXZlbnQ8e1xyXG5cdFx0XHRwYWdpbmF0ZTogUGFnaW5hdGUsXHJcblx0XHRcdF9ldmVudD86ICdwYWdpbmF0aW9uZW5kJyxcclxuXHRcdH0+O1xyXG5cdFx0ZXhwb3J0IHR5cGUgUE1vZGlmeUV2ZW50ID0gQ3VzdG9tRXZlbnQ8e1xyXG5cdFx0XHRwYWdpbmF0ZTogUGFnaW5hdGUsXHJcblx0XHRcdGFkZGVkOiBIVE1MRWxlbWVudFtdLFxyXG5cdFx0XHRyZW1vdmVkOiBIVE1MRWxlbWVudFtdLFxyXG5cdFx0XHRzZWxlY3Rvcjogc2VsZWN0b3IsXHJcblx0XHRcdF9ldmVudD86ICdwYWdpbmF0aW9ubW9kaWZ5JyxcclxuXHRcdH0+O1xyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBQYWdpbmF0ZSB7XHJcblx0XHRcdGRvYzogRG9jdW1lbnQ7XHJcblxyXG5cdFx0XHRlbmFibGVkID0gdHJ1ZTtcclxuXHRcdFx0Y29uZGl0aW9uOiBzZWxlY3RvciB8ICgoKSA9PiBib29sZWFuKTtcclxuXHRcdFx0cXVldWVkID0gMDtcclxuXHRcdFx0cnVubmluZyA9IGZhbHNlO1xyXG5cdFx0XHRfaW5pdGVkID0gZmFsc2U7XHJcblxyXG5cdFx0XHRzdGF0aWMgc2hpZnRSZXF1ZXN0Q291bnQgPSAxMDtcclxuXHRcdFx0c3RhdGljIF9pbml0ZWQgPSBmYWxzZTtcclxuXHRcdFx0c3RhdGljIHJlbW92ZURlZmF1bHRSdW5CaW5kaW5nczogKCkgPT4gdm9pZDtcclxuXHRcdFx0c3RhdGljIGFkZERlZmF1bHRSdW5CaW5kaW5ncygpIHtcclxuXHRcdFx0XHRQYWdpbmF0ZS5yZW1vdmVEZWZhdWx0UnVuQmluZGluZ3M/LigpO1xyXG5cdFx0XHRcdGZ1bmN0aW9uIG9ubW91c2Vkb3duKGV2ZW50OiBNb3VzZUV2ZW50KSB7XHJcblx0XHRcdFx0XHRpZiAoZXZlbnQuYnV0dG9uICE9IDEpIHJldHVybjtcclxuXHRcdFx0XHRcdGxldCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgRWxlbWVudDtcclxuXHRcdFx0XHRcdGlmICh0YXJnZXQ/LmNsb3Nlc3QoJ2EnKSkgcmV0dXJuO1xyXG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHRcdGxldCBjb3VudCA9IGV2ZW50LnNoaWZ0S2V5ID8gUGFnaW5hdGUuc2hpZnRSZXF1ZXN0Q291bnQgOiAxO1xyXG5cdFx0XHRcdFx0UGFnaW5hdGUucmVxdWVzdFBhZ2luYXRpb24oY291bnQsIGV2ZW50LCB0YXJnZXQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRmdW5jdGlvbiBvbmtleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcclxuXHRcdFx0XHRcdGlmIChldmVudC5jb2RlICE9ICdBbHRSaWdodCcpIHJldHVybjtcclxuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFx0XHRsZXQgY291bnQgPSBldmVudC5zaGlmdEtleSA/IFBhZ2luYXRlLnNoaWZ0UmVxdWVzdENvdW50IDogMTtcclxuXHRcdFx0XHRcdGxldCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgRWxlbWVudDtcclxuXHRcdFx0XHRcdFBhZ2luYXRlLnJlcXVlc3RQYWdpbmF0aW9uKGNvdW50LCBldmVudCwgdGFyZ2V0KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgb25tb3VzZWRvd24pO1xyXG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbmtleWRvd24pO1xyXG5cdFx0XHRcdFBhZ2luYXRlLnJlbW92ZURlZmF1bHRSdW5CaW5kaW5ncyA9ICgpID0+IHtcclxuXHRcdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIG9ubW91c2Vkb3duKTtcclxuXHRcdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbmtleWRvd24pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRzdGF0aWMgaW5zdGFuY2VzOiBQYWdpbmF0ZVtdID0gW107XHJcblxyXG5cdFx0XHQvLyBsaXN0ZW5lcnNcclxuXHRcdFx0aW5pdCgpIHtcclxuXHRcdFx0XHRpZiAoIVBhZ2luYXRlLnJlbW92ZURlZmF1bHRSdW5CaW5kaW5ncykge1xyXG5cdFx0XHRcdFx0UGFnaW5hdGUuYWRkRGVmYXVsdFJ1bkJpbmRpbmdzKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0aGlzLl9pbml0ZWQpIHJldHVybjtcclxuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyPFBSZXF1ZXN0RXZlbnQ+KCdwYWdpbmF0aW9ucmVxdWVzdCcsIHRoaXMub25QYWdpbmF0aW9uUmVxdWVzdC5iaW5kKHRoaXMpKTtcclxuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyPFBFbmRFdmVudD4oJ3BhZ2luYXRpb25lbmQnLCB0aGlzLm9uUGFnaW5hdGlvbkVuZC5iaW5kKHRoaXMpKTtcclxuXHRcdFx0XHRQYWdpbmF0ZS5pbnN0YW5jZXMucHVzaCh0aGlzKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRvblBhZ2luYXRpb25SZXF1ZXN0KGV2ZW50OiBQUmVxdWVzdEV2ZW50KSB7XHJcblx0XHRcdFx0aWYgKHRoaXMuY2FuQ29uc3VtZVJlcXVlc3QoKSkge1xyXG5cdFx0XHRcdFx0ZXZlbnQuZGV0YWlsLmNvbnN1bWVkKys7XHJcblx0XHRcdFx0XHR0aGlzLnF1ZXVlZCArPSBldmVudC5kZXRhaWwuY291bnQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICghdGhpcy5ydW5uaW5nICYmIHRoaXMucXVldWVkKSB7XHJcblx0XHRcdFx0XHR0aGlzLmNvbnN1bWVSZXF1ZXN0KCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9O1xyXG5cdFx0XHRvblBhZ2luYXRpb25FbmQoZXZlbnQ6IFBFbmRFdmVudCkge1xyXG5cdFx0XHRcdGlmICh0aGlzLnF1ZXVlZCAmJiB0aGlzLmNhbkNvbnN1bWVSZXF1ZXN0KCkpIHtcclxuXHRcdFx0XHRcdHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XHJcblx0XHRcdFx0XHRcdGlmICghdGhpcy5jYW5Db25zdW1lUmVxdWVzdCgpKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKGB0aGlzIHBhZ2luYXRlIGNhbiBub3Qgd29yayBhbnltb3JlYCk7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5xdWV1ZWQgPSAwO1xyXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuY29uc3VtZVJlcXVlc3QoKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGNhbkNvbnN1bWVSZXF1ZXN0KCkge1xyXG5cdFx0XHRcdGlmICghdGhpcy5lbmFibGVkKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0aWYgKHRoaXMucnVubmluZykgcmV0dXJuIHRydWU7XHJcblx0XHRcdFx0aWYgKHRoaXMuY29uZGl0aW9uKSB7XHJcblx0XHRcdFx0XHRpZiAodHlwZW9mIHRoaXMuY29uZGl0aW9uID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdFx0aWYgKCF0aGlzLmNvbmRpdGlvbigpKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRpZiAoIWRvY3VtZW50LnEodGhpcy5jb25kaXRpb24pKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFzeW5jIGNvbnN1bWVSZXF1ZXN0KCkge1xyXG5cdFx0XHRcdGlmICh0aGlzLnJ1bm5pbmcpIHJldHVybjtcclxuXHRcdFx0XHR0aGlzLnF1ZXVlZC0tO1xyXG5cdFx0XHRcdHRoaXMucnVubmluZyA9IHRydWU7XHJcblx0XHRcdFx0dGhpcy5lbWl0U3RhcnQoKTtcclxuXHRcdFx0XHRhd2FpdCB0aGlzLm9ucnVuPy4oKTtcclxuXHRcdFx0XHR0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcclxuXHRcdFx0XHR0aGlzLmVtaXRFbmQoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRvbnJ1bjogKCkgPT4gUHJvbWlzZTx2b2lkPjtcclxuXHJcblxyXG5cdFx0XHQvLyBlbWl0dGVyc1xyXG5cdFx0XHRzdGF0aWMgcmVxdWVzdFBhZ2luYXRpb24oY291bnQgPSAxLCByZWFzb24/OiBFdmVudCwgdGFyZ2V0OiBFbGVtZW50ID0gZG9jdW1lbnQuYm9keSkge1xyXG5cdFx0XHRcdGxldCBkZXRhaWw6IFBSZXF1ZXN0RXZlbnRbJ2RldGFpbCddID0geyBjb3VudCwgcmVhc29uLCBjb25zdW1lZDogMCB9O1xyXG5cdFx0XHRcdGZ1bmN0aW9uIGZhaWwoZXZlbnQ6IFBSZXF1ZXN0RXZlbnQpIHtcclxuXHRcdFx0XHRcdGlmIChldmVudC5kZXRhaWwuY29uc3VtZWQgPT0gMCkge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFBhZ2luYXRpb24gcmVxdWVzdCBmYWlsZWQ6IG5vIGxpc3RlbmVyc2ApO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cmVtb3ZlRXZlbnRMaXN0ZW5lcigncGFnaW5hdGlvbnJlcXVlc3QnLCBmYWlsKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0YWRkRXZlbnRMaXN0ZW5lcigncGFnaW5hdGlvbnJlcXVlc3QnLCBmYWlsKTtcclxuXHRcdFx0XHR0YXJnZXQuZW1pdDxQUmVxdWVzdEV2ZW50PigncGFnaW5hdGlvbnJlcXVlc3QnLCB7IGNvdW50LCByZWFzb24sIGNvbnN1bWVkOiAwIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVtaXRTdGFydCgpIHtcclxuXHRcdFx0XHRkb2N1bWVudC5ib2R5LmVtaXQ8UFN0YXJ0RXZlbnQ+KCdwYWdpbmF0aW9uc3RhcnQnLCB7IHBhZ2luYXRlOiB0aGlzIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVtaXRNb2RpZnkoYWRkZWQsIHJlbW92ZWQsIHNlbGVjdG9yKSB7XHJcblx0XHRcdFx0ZG9jdW1lbnQuYm9keS5lbWl0PFBNb2RpZnlFdmVudD4oJ3BhZ2luYXRpb25tb2RpZnknLCB7IHBhZ2luYXRlOiB0aGlzLCBhZGRlZCwgcmVtb3ZlZCwgc2VsZWN0b3IgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZW1pdEVuZCgpIHtcclxuXHRcdFx0XHRkb2N1bWVudC5ib2R5LmVtaXQ8UEVuZEV2ZW50PigncGFnaW5hdGlvbmVuZCcsIHsgcGFnaW5hdGU6IHRoaXMgfSk7XHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHQvLyBmZXRjaGluZzogXHJcblx0XHRcdGFzeW5jIGZldGNoRG9jdW1lbnQobGluazogTGluaywgc3Bpbm5lciA9IHRydWUsIG1heEFnZSA9IDApOiBQcm9taXNlPERvY3VtZW50PiB7XHJcblx0XHRcdFx0dGhpcy5kb2MgPSBudWxsO1xyXG5cdFx0XHRcdGxldCBhID0gc3Bpbm5lciAmJiBQYWdpbmF0ZS5saW5rVG9BbmNob3IobGluayk7XHJcblx0XHRcdFx0YT8uY2xhc3NMaXN0LmFkZCgncGFnaW5hdGUtc3BpbicpO1xyXG5cdFx0XHRcdGxpbmsgPSBQYWdpbmF0ZS5saW5rVG9VcmwobGluayk7XHJcblx0XHRcdFx0dGhpcy5kb2MgPSAhbWF4QWdlID8gYXdhaXQgZmV0Y2guZG9jKGxpbmspIDogYXdhaXQgZmV0Y2guY2FjaGVkLmRvYyhsaW5rLCB7IG1heEFnZSB9KTtcclxuXHRcdFx0XHRhPy5jbGFzc0xpc3QucmVtb3ZlKCdwYWdpbmF0ZS1zcGluJyk7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuZG9jO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFzeW5jIGZldGNoQ2FjaGVkRG9jdW1lbnQobGluazogTGluaywgc3Bpbm5lciA9IHRydWUpOiBQcm9taXNlPERvY3VtZW50PiB7XHJcblx0XHRcdFx0dGhpcy5kb2MgPSBudWxsO1xyXG5cdFx0XHRcdGxldCBhID0gc3Bpbm5lciAmJiBQYWdpbmF0ZS5saW5rVG9BbmNob3IobGluayk7XHJcblx0XHRcdFx0YT8uY2xhc3NMaXN0LmFkZCgncGFnaW5hdGUtc3BpbicpO1xyXG5cdFx0XHRcdGxpbmsgPSBQYWdpbmF0ZS5saW5rVG9VcmwobGluayk7XHJcblx0XHRcdFx0dGhpcy5kb2MgPSBhd2FpdCBmZXRjaC5jYWNoZWQuZG9jKGxpbmspO1xyXG5cdFx0XHRcdGE/LmNsYXNzTGlzdC5yZW1vdmUoJ3BhZ2luYXRlLXNwaW4nKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5kb2M7XHJcblx0XHRcdH1cclxuXHRcdFx0cHJlZmV0Y2goc291cmNlOiBzZWxlY3Rvcikge1xyXG5cdFx0XHRcdGRvY3VtZW50LnFxPCdhJz4oc291cmNlKS5tYXAoZSA9PiB7XHJcblx0XHRcdFx0XHRpZiAoZS5ocmVmKSB7XHJcblx0XHRcdFx0XHRcdGVsbShgbGlua1tyZWw9XCJwcmVmZXRjaFwiXVtocmVmPVwiJHtlLmhyZWZ9XCJdYCkuYXBwZW5kVG8oJ2hlYWQnKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vIFRPRE86IGlmIGUuc3JjXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHQvLyBtb2RpZmljYXRpb246IFxyXG5cdFx0XHRhZnRlcihzb3VyY2U6IHNlbGVjdG9yLCB0YXJnZXQ6IHNlbGVjdG9yID0gc291cmNlKSB7XHJcblx0XHRcdFx0bGV0IGFkZGVkID0gdGhpcy5kb2MucXEoc291cmNlKTtcclxuXHRcdFx0XHRpZiAoIWFkZGVkLmxlbmd0aCkgcmV0dXJuO1xyXG5cdFx0XHRcdGxldCBmb3VuZCA9IGRvY3VtZW50LnFxKHRhcmdldCk7XHJcblx0XHRcdFx0aWYgKGZvdW5kLmxlbmd0aCA9PSAwKSB0aHJvdyBuZXcgRXJyb3IoYGZhaWxlZCB0byBmaW5kIHdoZXJlIHRvIGFwcGVuZGApO1xyXG5cdFx0XHRcdGZvdW5kLnBvcCgpLmFmdGVyKC4uLmFkZGVkKTtcclxuXHRcdFx0XHR0aGlzLmVtaXRNb2RpZnkoYWRkZWQsIFtdLCBzb3VyY2UpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJlcGxhY2VFYWNoKHNvdXJjZTogc2VsZWN0b3IsIHRhcmdldDogc2VsZWN0b3IgPSBzb3VyY2UpIHtcclxuXHRcdFx0XHRsZXQgYWRkZWQgPSB0aGlzLmRvYy5xcShzb3VyY2UpO1xyXG5cdFx0XHRcdGxldCByZW1vdmVkID0gZG9jdW1lbnQucXEodGFyZ2V0KTtcclxuXHRcdFx0XHRpZiAoYWRkZWQubGVuZ3RoICE9IHJlbW92ZWQubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoYGFkZGVkL3JlbW92ZWQgY291bnQgbWlzbWF0Y2hgKTtcclxuXHRcdFx0XHRyZW1vdmVkLm1hcCgoZSwgaSkgPT4gZS5yZXBsYWNlV2l0aChhZGRlZFtpXSkpO1xyXG5cdFx0XHRcdHRoaXMuZW1pdE1vZGlmeShhZGRlZCwgcmVtb3ZlZCwgc291cmNlKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXBsYWNlKHNvdXJjZTogc2VsZWN0b3IsIHRhcmdldDogc2VsZWN0b3IgPSBzb3VyY2UpIHtcclxuXHRcdFx0XHRsZXQgYWRkZWQgPSB0aGlzLmRvYy5xcShzb3VyY2UpO1xyXG5cdFx0XHRcdGxldCByZW1vdmVkID0gZG9jdW1lbnQucXEodGFyZ2V0KTtcclxuXHRcdFx0XHRpZiAoYWRkZWQubGVuZ3RoICE9IHJlbW92ZWQubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoYG5vdCBpbXBsZW1lbnRlZGApO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnJlcGxhY2VFYWNoKHNvdXJjZSwgdGFyZ2V0KTtcclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHRcdC8vIHV0aWxcclxuXHRcdFx0c3RhdGljIGxpbmtUb1VybChsaW5rOiBMaW5rKTogdXJsIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIGxpbmsgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdGlmIChsaW5rLnN0YXJ0c1dpdGgoJ2h0dHAnKSkgcmV0dXJuIGxpbmsgYXMgdXJsO1xyXG5cdFx0XHRcdFx0bGluayA9IGRvY3VtZW50LnE8J2EnPihsaW5rKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGxpbmsudGFnTmFtZSAhPSAnQScpIHRocm93IG5ldyBFcnJvcignbGluayBzaG91bGQgYmUgPGE+IGVsZW1lbnQhJyk7XHJcblx0XHRcdFx0cmV0dXJuIChsaW5rIGFzIEhUTUxBbmNob3JFbGVtZW50KS5ocmVmIGFzIHVybDtcclxuXHRcdFx0fVxyXG5cdFx0XHRzdGF0aWMgbGlua1RvQW5jaG9yKGxpbms6IExpbmspOiBIVE1MQW5jaG9yRWxlbWVudCB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiBsaW5rID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRpZiAobGluay5zdGFydHNXaXRoKCdodHRwJykpIHJldHVybiBudWxsO1xyXG5cdFx0XHRcdFx0cmV0dXJuIGRvY3VtZW50LnE8J2EnPihsaW5rKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIGxpbms7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHN0YXRpYyBzdGF0aWNDYWxsPFQ+KGRhdGE6IHtcclxuXHRcdFx0XHRjb25kaXRpb24/OiBzZWxlY3RvciB8ICgoKSA9PiBib29sZWFuKSxcclxuXHRcdFx0XHRwcmVmZXRjaD86IHNlbGVjdG9yIHwgc2VsZWN0b3JbXSxcclxuXHRcdFx0XHRjbGljaz86IHNlbGVjdG9yIHwgc2VsZWN0b3JbXSxcclxuXHRcdFx0XHRkb2M/OiBzZWxlY3RvciB8IHNlbGVjdG9yW10sXHJcblx0XHRcdFx0YWZ0ZXI/OiBzZWxlY3RvciB8IHNlbGVjdG9yW10sXHJcblx0XHRcdFx0cmVwbGFjZT86IHNlbGVjdG9yIHwgc2VsZWN0b3JbXSxcclxuXHRcdFx0XHRzdGFydD86ICgpID0+IHZvaWQ7XHJcblx0XHRcdFx0ZW5kPzogKCkgPT4gdm9pZDtcclxuXHRcdFx0fSkge1xyXG5cdFx0XHRcdGxldCBwID0gbmV3IFBhZ2luYXRlKCk7XHJcblx0XHRcdFx0cC5zdGF0aWNDYWxsKGRhdGEpO1xyXG5cdFx0XHRcdHJldHVybiBwO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyYXdEYXRhOiBhbnk7XHJcblx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHRjb25kaXRpb246ICgpID0+IGJvb2xlYW47XHJcblx0XHRcdFx0cHJlZmV0Y2g6IGFueVtdO1xyXG5cdFx0XHRcdGRvYzogc2VsZWN0b3JbXTtcclxuXHRcdFx0XHRjbGljazogc2VsZWN0b3JbXTtcclxuXHRcdFx0XHRhZnRlcjogc2VsZWN0b3JbXTtcclxuXHRcdFx0XHRyZXBsYWNlOiBzZWxlY3RvcltdO1xyXG5cdFx0XHRcdG1heEFnZTogbnVtYmVyO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHRzdGF0aWNDYWxsKGRhdGE6IHtcclxuXHRcdFx0XHRjb25kaXRpb24/OiBzZWxlY3RvciB8ICgoKSA9PiBib29sZWFuKSxcclxuXHRcdFx0XHRwcmVmZXRjaD86IHNlbGVjdG9yIHwgc2VsZWN0b3JbXSxcclxuXHRcdFx0XHRjbGljaz86IHNlbGVjdG9yIHwgc2VsZWN0b3JbXSxcclxuXHRcdFx0XHRkb2M/OiBzZWxlY3RvciB8IHNlbGVjdG9yW10sXHJcblx0XHRcdFx0YWZ0ZXI/OiBzZWxlY3RvciB8IHNlbGVjdG9yW10sXHJcblx0XHRcdFx0cmVwbGFjZT86IHNlbGVjdG9yIHwgc2VsZWN0b3JbXSxcclxuXHRcdFx0XHRzdGFydD86ICgpID0+IHZvaWQ7XHJcblx0XHRcdFx0ZW5kPzogKCkgPT4gdm9pZDtcclxuXHRcdFx0XHRtYXhBZ2U/OiBudW1iZXI7XHJcblx0XHRcdFx0Y2FjaGU/OiBib29sZWFuO1xyXG5cdFx0XHR9KSB7XHJcblx0XHRcdFx0ZnVuY3Rpb24gdG9BcnJheTxUPih2PzogVCB8IFRbXSB8IHVuZGVmaW5lZCk6IFRbXSB7XHJcblx0XHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheSh2KSkgcmV0dXJuIHY7XHJcblx0XHRcdFx0XHRpZiAodiA9PSBudWxsKSByZXR1cm4gW107XHJcblx0XHRcdFx0XHRyZXR1cm4gW3ZdO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRmdW5jdGlvbiB0b0NvbmRpdGlvbihzPzogc2VsZWN0b3IgfCAoKCkgPT4gYm9vbGVhbikgfCB1bmRlZmluZWQpOiAoKSA9PiBib29sZWFuIHtcclxuXHRcdFx0XHRcdGlmICghcykgcmV0dXJuICgpID0+IHRydWU7XHJcblx0XHRcdFx0XHRpZiAodHlwZW9mIHMgPT0gJ3N0cmluZycpIHJldHVybiAoKSA9PiAhIWRvY3VtZW50LnEocyk7XHJcblx0XHRcdFx0XHRyZXR1cm4gcztcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZnVuY3Rpb24gY2FuRmluZChhOiBzZWxlY3RvcltdKSB7XHJcblx0XHRcdFx0XHRpZiAoYS5sZW5ndGggPT0gMCkgcmV0dXJuIHRydWU7XHJcblx0XHRcdFx0XHRyZXR1cm4gYS5zb21lKHMgPT4gISFkb2N1bWVudC5xKHMpKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZnVuY3Rpb24gZmluZE9uZShhOiBzZWxlY3RvcltdKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gYS5maW5kKHMgPT4gZG9jdW1lbnQucShzKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMucmF3RGF0YSA9IGRhdGE7XHJcblx0XHRcdFx0dGhpcy5kYXRhID0ge1xyXG5cdFx0XHRcdFx0Y29uZGl0aW9uOiB0b0NvbmRpdGlvbihkYXRhLmNvbmRpdGlvbiksXHJcblx0XHRcdFx0XHRwcmVmZXRjaDogdG9BcnJheTxzZWxlY3Rvcj4oZGF0YS5wcmVmZXRjaClcclxuXHRcdFx0XHRcdFx0LmZsYXRNYXAoZSA9PiB0b0FycmF5KGRhdGFbZV0gPz8gZSkpLFxyXG5cdFx0XHRcdFx0ZG9jOiB0b0FycmF5PHNlbGVjdG9yPihkYXRhLmRvYyksXHJcblx0XHRcdFx0XHRjbGljazogdG9BcnJheTxzZWxlY3Rvcj4oZGF0YS5jbGljayksXHJcblx0XHRcdFx0XHRhZnRlcjogdG9BcnJheTxzZWxlY3Rvcj4oZGF0YS5hZnRlciksXHJcblx0XHRcdFx0XHRyZXBsYWNlOiB0b0FycmF5PHNlbGVjdG9yPihkYXRhLnJlcGxhY2UpLFxyXG5cdFx0XHRcdFx0bWF4QWdlOiBkYXRhLm1heEFnZSA/PyAoZGF0YS5jYWNoZSA/IDM2NSAqIDI0ICogMjYwMGUzIDogMCksXHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHR0aGlzLmNvbmRpdGlvbiA9ICgpID0+IHtcclxuXHRcdFx0XHRcdGlmICghdGhpcy5kYXRhLmNvbmRpdGlvbigpKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0XHRpZiAoIWNhbkZpbmQodGhpcy5kYXRhLmRvYykpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHRcdGlmICghY2FuRmluZCh0aGlzLmRhdGEuY2xpY2spKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHR9O1xyXG5cdFx0XHRcdHRoaXMuaW5pdCgpO1xyXG5cdFx0XHRcdGlmICh0aGlzLmRhdGEuY29uZGl0aW9uKCkpIHtcclxuXHRcdFx0XHRcdHRoaXMuZGF0YS5wcmVmZXRjaC5tYXAocyA9PiB0aGlzLnByZWZldGNoKHMpKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5vbnJ1biA9IGFzeW5jICgpID0+IHtcclxuXHRcdFx0XHRcdC8vIGlmICghZml4ZWREYXRhLmNvbmRpdGlvbigpKSByZXR1cm47XHJcblx0XHRcdFx0XHRhd2FpdCBkYXRhLnN0YXJ0Py4oKTtcclxuXHRcdFx0XHRcdHRoaXMuZGF0YS5jbGljay5tYXAoZSA9PiBkb2N1bWVudC5xKGUpPy5jbGljaygpKTtcclxuXHRcdFx0XHRcdGxldCBkb2MgPSBmaW5kT25lKHRoaXMuZGF0YS5kb2MpO1xyXG5cdFx0XHRcdFx0aWYgKGRvYykgYXdhaXQgdGhpcy5mZXRjaERvY3VtZW50KGRvYywgdHJ1ZSwgdGhpcy5kYXRhLm1heEFnZSk7XHJcblx0XHRcdFx0XHR0aGlzLmRhdGEuYWZ0ZXIubWFwKHMgPT4gdGhpcy5hZnRlcihzKSk7XHJcblx0XHRcdFx0XHR0aGlzLmRhdGEucmVwbGFjZS5tYXAocyA9PiB0aGlzLnJlcGxhY2UocykpO1xyXG5cdFx0XHRcdFx0YXdhaXQgZGF0YS5lbmQ/LigpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHR9XHJcblx0XHR0eXBlIFNlbE9yRWwgPSBzZWxlY3RvciB8IEhUTUxFbGVtZW50O1xyXG5cdFx0dHlwZSBTb21laG93PFQ+ID0gbnVsbCB8IFQgfCBUW10gfCAoKCkgPT4gKG51bGwgfCBUIHwgVFtdKSk7XHJcblx0XHR0eXBlIFNvbWVob3dBc3luYzxUPiA9IG51bGwgfCBUIHwgVFtdIHwgKCgpID0+IChudWxsIHwgVCB8IFRbXSB8IFByb21pc2U8bnVsbCB8IFQgfCBUW10+KSk7XHJcblxyXG5cdFx0ZXhwb3J0IGNvbnN0IHBhZ2luYXRlID0gT2JqZWN0LnNldFByb3RvdHlwZU9mKFBhZ2luYXRlLnN0YXRpY0NhbGwuYmluZChQYWdpbmF0ZSksIG5ldyBQYWdpbmF0ZSgpKTtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBjb25zdCBwYWdpbmF0ZSA9IFBhZ2luYXRlRXh0ZW5zaW9uLnBhZ2luYXRlO1xyXG5cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cdGV4cG9ydCBuYW1lc3BhY2UgSW1hZ2VTY3JvbGxpbmdFeHRlbnNpb24ge1xyXG5cclxuXHRcdGV4cG9ydCBsZXQgaW1hZ2VTY3JvbGxpbmdBY3RpdmUgPSBmYWxzZTtcclxuXHRcdGV4cG9ydCBsZXQgaW1nU2VsZWN0b3IgPSAnaW1nJztcclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gaW1hZ2VTY3JvbGxpbmcoc2VsZWN0b3I/OiBzdHJpbmcpIHtcclxuXHRcdFx0aWYgKGltYWdlU2Nyb2xsaW5nQWN0aXZlKSByZXR1cm47XHJcblx0XHRcdGlmIChzZWxlY3RvcikgaW1nU2VsZWN0b3IgPSBzZWxlY3RvcjtcclxuXHRcdFx0aW1hZ2VTY3JvbGxpbmdBY3RpdmUgPSB0cnVlO1xyXG5cdFx0XHRmdW5jdGlvbiBvbndoZWVsKGV2ZW50OiBNb3VzZUV2ZW50ICYgeyB3aGVlbERlbHRhWTogbnVtYmVyIH0pIHtcclxuXHRcdFx0XHRpZiAoZXZlbnQuc2hpZnRLZXkgfHwgZXZlbnQuY3RybEtleSkgcmV0dXJuO1xyXG5cdFx0XHRcdGlmIChzY3JvbGxXaG9sZUltYWdlKC1NYXRoLnNpZ24oZXZlbnQud2hlZWxEZWx0YVkpKSkge1xyXG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIG9ud2hlZWwsIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdHJldHVybiBpbWFnZVNjcm9sbGluZ09mZiA9ICgpID0+IHtcclxuXHRcdFx0XHRpbWFnZVNjcm9sbGluZ0FjdGl2ZSA9IGZhbHNlO1xyXG5cdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNld2hlZWwnLCBvbndoZWVsKTtcclxuXHRcdFx0fTtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBiaW5kQXJyb3dzKCkge1xyXG5cdFx0XHRhZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZXZlbnQgPT4ge1xyXG5cdFx0XHRcdGlmIChldmVudC5jb2RlID09ICdBcnJvd0xlZnQnKSB7XHJcblx0XHRcdFx0XHRzY3JvbGxXaG9sZUltYWdlKC0xKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGV2ZW50LmNvZGUgPT0gJ0Fycm93UmlnaHQnKSB7XHJcblx0XHRcdFx0XHRzY3JvbGxXaG9sZUltYWdlKDEpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBsZXQgaW1hZ2VTY3JvbGxpbmdPZmYgPSAoKSA9PiB7IH07XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGltZ1RvV2luZG93Q2VudGVyKGltZzogRWxlbWVudCkge1xyXG5cdFx0XHRsZXQgcmVjdCA9IGltZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHRcdFx0cmV0dXJuIChyZWN0LnRvcCArIHJlY3QuYm90dG9tKSAvIDIgLSBpbm5lckhlaWdodCAvIDI7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGdldEFsbEltYWdlSW5mbygpIHtcclxuXHRcdFx0bGV0IGltYWdlcyA9IHFxKGltZ1NlbGVjdG9yKSBhcyBIVE1MSW1hZ2VFbGVtZW50W107XHJcblx0XHRcdGxldCBkYXRhcyA9IGltYWdlcy5tYXAoKGltZywgaW5kZXgpID0+IHtcclxuXHRcdFx0XHRsZXQgcmVjdCA9IGltZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0aW1nLCByZWN0LCBpbmRleCxcclxuXHRcdFx0XHRcdGluU2NyZWVuOiByZWN0LnRvcCA+PSAtMSAmJiByZWN0LmJvdHRvbSA8PSBpbm5lckhlaWdodCxcclxuXHRcdFx0XHRcdGNyb3NzU2NyZWVuOiByZWN0LmJvdHRvbSA+PSAxICYmIHJlY3QudG9wIDw9IGlubmVySGVpZ2h0IC0gMSxcclxuXHRcdFx0XHRcdHlUb1NjcmVlbkNlbnRlcjogKHJlY3QudG9wICsgcmVjdC5ib3R0b20pIC8gMiAtIGlubmVySGVpZ2h0IC8gMixcclxuXHRcdFx0XHRcdGlzSW5DZW50ZXI6IE1hdGguYWJzKChyZWN0LnRvcCArIHJlY3QuYm90dG9tKSAvIDIgLSBpbm5lckhlaWdodCAvIDIpIDwgMyxcclxuXHRcdFx0XHRcdGlzU2NyZWVuSGVpZ2h0OiBNYXRoLmFicyhyZWN0LmhlaWdodCAtIGlubmVySGVpZ2h0KSA8IDMsXHJcblx0XHRcdFx0fTtcclxuXHRcdFx0fSkuZmlsdGVyKGUgPT4gZS5yZWN0Py53aWR0aCB8fCBlLnJlY3Q/LndpZHRoKTtcclxuXHRcdFx0cmV0dXJuIGRhdGFzO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBsZXQgc2Nyb2xsV2hvbGVJbWFnZVBlbmRpbmcgPSBmYWxzZTtcclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZ2V0Q2VudHJhbEltZygpIHtcclxuXHRcdFx0cmV0dXJuIGdldEFsbEltYWdlSW5mbygpLnZzb3J0KGUgPT4gTWF0aC5hYnMoZS55VG9TY3JlZW5DZW50ZXIpKVswXT8uaW1nO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHNjcm9sbFdob2xlSW1hZ2UoZGlyID0gMSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRpZiAoc2Nyb2xsV2hvbGVJbWFnZVBlbmRpbmcpIHJldHVybiB0cnVlO1xyXG5cdFx0XHQvLyBpZiAoZGlyID09IDApIHRocm93IG5ldyBFcnJvcignc2Nyb2xsaW5nIGluIG5vIGRpcmVjdGlvbiEnKTtcclxuXHRcdFx0aWYgKCFkaXIpIHJldHVybiBmYWxzZTtcclxuXHJcblx0XHRcdGRpciA9IE1hdGguc2lnbihkaXIpO1xyXG5cdFx0XHRsZXQgZGF0YXMgPSBnZXRBbGxJbWFnZUluZm8oKS52c29ydChlID0+IGUueVRvU2NyZWVuQ2VudGVyKTtcclxuXHRcdFx0bGV0IGNlbnRyYWwgPSBkYXRhcy52c29ydChlID0+IE1hdGguYWJzKGUueVRvU2NyZWVuQ2VudGVyKSlbMF07XHJcblx0XHRcdGxldCBuZXh0Q2VudHJhbEluZGV4ID0gZGF0YXMuaW5kZXhPZihjZW50cmFsKTtcclxuXHRcdFx0d2hpbGUgKFxyXG5cdFx0XHRcdGRhdGFzW25leHRDZW50cmFsSW5kZXggKyBkaXJdICYmXHJcblx0XHRcdFx0TWF0aC5hYnMoZGF0YXNbbmV4dENlbnRyYWxJbmRleCArIGRpcl0ueVRvU2NyZWVuQ2VudGVyIC0gY2VudHJhbC55VG9TY3JlZW5DZW50ZXIpIDwgMTBcclxuXHRcdFx0KSBuZXh0Q2VudHJhbEluZGV4ICs9IGRpcjtcclxuXHRcdFx0Y2VudHJhbCA9IGRhdGFzW25leHRDZW50cmFsSW5kZXhdO1xyXG5cdFx0XHRsZXQgbmV4dCA9IGRhdGFzW25leHRDZW50cmFsSW5kZXggKyBkaXJdO1xyXG5cclxuXHRcdFx0ZnVuY3Rpb24gc2Nyb2xsVG9JbWFnZShkYXRhOiB0eXBlb2YgY2VudHJhbCB8IHVuZGVmaW5lZCk6IGJvb2xlYW4ge1xyXG5cdFx0XHRcdGlmICghZGF0YSkgcmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdGlmIChzY3JvbGxZICsgZGF0YS55VG9TY3JlZW5DZW50ZXIgPD0gMCAmJiBzY3JvbGxZIDw9IDApIHtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGRhdGEuaXNTY3JlZW5IZWlnaHQpIHtcclxuXHRcdFx0XHRcdGRhdGEuaW1nLnNjcm9sbEludG9WaWV3KCk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHNjcm9sbFRvKHNjcm9sbFgsIHNjcm9sbFkgKyBkYXRhLnlUb1NjcmVlbkNlbnRlcik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHNjcm9sbFdob2xlSW1hZ2VQZW5kaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHRQcm9taXNlLnJhZigyKS50aGVuKCgpID0+IHNjcm9sbFdob2xlSW1hZ2VQZW5kaW5nID0gZmFsc2UpO1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBpZiBubyBpbWFnZXMsIGRvbid0IHNjcm9sbDtcclxuXHRcdFx0aWYgKCFjZW50cmFsKSByZXR1cm4gZmFsc2U7XHJcblxyXG5cdFx0XHQvLyBpZiBjdXJyZW50IGltYWdlIGlzIG91dHNpZGUgdmlldywgZG9uJ3Qgc2Nyb2xsXHJcblx0XHRcdGlmICghY2VudHJhbC5jcm9zc1NjcmVlbikgcmV0dXJuIGZhbHNlO1xyXG5cclxuXHRcdFx0Ly8gaWYgY3VycmVudCBpbWFnZSBpcyBpbiBjZW50ZXIsIHNjcm9sbCB0byB0aGUgbmV4dCBvbmVcclxuXHRcdFx0aWYgKGNlbnRyYWwuaXNJbkNlbnRlcikge1xyXG5cdFx0XHRcdHJldHVybiBzY3JvbGxUb0ltYWdlKG5leHQpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBpZiB0byBzY3JvbGwgdG8gY3VycmVudCBpbWFnZSB5b3UgaGF2ZSB0byBzY3JvbGwgaW4gb3Bwb3NpZGUgZGlyZWN0aW9uLCBzY3JvbGwgdG8gbmV4dCBvbmVcclxuXHRcdFx0aWYgKE1hdGguc2lnbihjZW50cmFsLnlUb1NjcmVlbkNlbnRlcikgIT0gZGlyKSB7XHJcblx0XHRcdFx0cmV0dXJuIHNjcm9sbFRvSW1hZ2UobmV4dCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIGlmIGN1cnJlbnQgaW1hZ2UgaXMgZmlyc3QvbGFzdCwgZG9uJ3Qgc2Nyb2xsIG92ZXIgMjV2aCB0byBpdFxyXG5cdFx0XHRpZiAoZGlyID09IDEgJiYgY2VudHJhbC5pbmRleCA9PSAwICYmIGNlbnRyYWwueVRvU2NyZWVuQ2VudGVyID4gaW5uZXJIZWlnaHQgLyAyKSB7XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChkaXIgPT0gLTEgJiYgY2VudHJhbC5pbmRleCA9PSBkYXRhcy5sZW5ndGggLSAxICYmIGNlbnRyYWwueVRvU2NyZWVuQ2VudGVyIDwgLWlubmVySGVpZ2h0IC8gMikge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIHNjcm9sbFRvSW1hZ2UoY2VudHJhbCk7XHJcblx0XHR9XHJcblx0fVxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vQXJyYXkudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9EYXRlTm93SGFjay50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2VsZW1lbnQudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9lbG0udHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9GaWx0ZXJlci9FbnRpdHlGaWx0ZXJlci50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2V0Yy50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2ZldGNoLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vT2JqZWN0LnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vb2JzZXJ2ZXIudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9QYWdpbmF0ZS9QYWdpbmF0aW9uLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vUGFnaW5hdGUvSW1hZ2VTY3JvbGxpbmcudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9Qcm9taXNlLnRzXCIgLz5cclxuXHJcblxyXG5cclxuXHJcblxyXG5uYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIF9faW5pdF9fKHdpbmRvdzogV2luZG93KTogXCJpbml0ZWRcIiB8IFwiYWxyZWFkeSBpbml0ZWRcIiB7XHJcblx0XHRpZiAoIXdpbmRvdykgd2luZG93ID0gZ2xvYmFsVGhpcy53aW5kb3cgYXMgV2luZG93O1xyXG5cclxuXHRcdHdpbmRvdy5lbG0gPSBFbG0uZWxtO1xyXG5cdFx0d2luZG93LnEgPSBPYmplY3QuYXNzaWduKFF1ZXJ5U2VsZWN0b3IuV2luZG93US5xLCB7IG9yRWxtOiBQb29wSnMuRWxtLnFPckVsbSB9KTtcclxuXHRcdHdpbmRvdy5xcSA9IFF1ZXJ5U2VsZWN0b3IuV2luZG93US5xcTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShFbGVtZW50LnByb3RvdHlwZSwgJ3EnLCBRdWVyeVNlbGVjdG9yLkVsZW1lbnRRLnEpO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKEVsZW1lbnQucHJvdG90eXBlLCAncXEnLCBRdWVyeVNlbGVjdG9yLkVsZW1lbnRRLnFxKTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShFbGVtZW50LnByb3RvdHlwZSwgJ2FwcGVuZFRvJywgRWxlbWVudEV4dGVuc2lvbi5hcHBlbmRUbyk7XHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoRWxlbWVudC5wcm90b3R5cGUsICdlbWl0JywgRWxlbWVudEV4dGVuc2lvbi5lbWl0KTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShEb2N1bWVudC5wcm90b3R5cGUsICdxJywgUXVlcnlTZWxlY3Rvci5Eb2N1bWVudFEucSk7XHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoRG9jdW1lbnQucHJvdG90eXBlLCAncXEnLCBRdWVyeVNlbGVjdG9yLkRvY3VtZW50US5xcSk7XHJcblxyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKFByb21pc2UsICdlbXB0eScsIFByb21pc2VFeHRlbnNpb24uZW1wdHkpO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKFByb21pc2UsICdmcmFtZScsIFByb21pc2VFeHRlbnNpb24uZnJhbWUpO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKFByb21pc2UsICdyYWYnLCBQcm9taXNlRXh0ZW5zaW9uLmZyYW1lKTtcclxuXHJcblx0XHR3aW5kb3cuZmV0Y2guY2FjaGVkID0gRmV0Y2hFeHRlbnNpb24uY2FjaGVkIGFzIGFueTtcclxuXHRcdHdpbmRvdy5mZXRjaC5kb2MgPSBGZXRjaEV4dGVuc2lvbi5kb2MgYXMgYW55O1xyXG5cdFx0d2luZG93LmZldGNoLmpzb24gPSBGZXRjaEV4dGVuc2lvbi5qc29uIGFzIGFueTtcclxuXHRcdHdpbmRvdy5mZXRjaC5jYWNoZWQuZG9jID0gRmV0Y2hFeHRlbnNpb24uY2FjaGVkRG9jO1xyXG5cdFx0d2luZG93LmZldGNoLmRvYy5jYWNoZWQgPSBGZXRjaEV4dGVuc2lvbi5jYWNoZWREb2M7XHJcblx0XHR3aW5kb3cuZmV0Y2guY2FjaGVkRG9jID0gRmV0Y2hFeHRlbnNpb24uY2FjaGVkRG9jO1xyXG5cdFx0d2luZG93LmZldGNoLmpzb24uY2FjaGVkID0gRmV0Y2hFeHRlbnNpb24uY2FjaGVkSnNvbjtcclxuXHRcdHdpbmRvdy5mZXRjaC5jYWNoZWQuanNvbiA9IEZldGNoRXh0ZW5zaW9uLmNhY2hlZEpzb247XHJcblx0XHR3aW5kb3cuZmV0Y2guaXNDYWNoZWQgPSBGZXRjaEV4dGVuc2lvbi5pc0NhY2hlZDtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShSZXNwb25zZS5wcm90b3R5cGUsICdjYWNoZWRBdCcsIDApO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKERvY3VtZW50LnByb3RvdHlwZSwgJ2NhY2hlZEF0JywgMCk7XHJcblxyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKE9iamVjdCwgJ2RlZmluZVZhbHVlJywgT2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShPYmplY3QsICdkZWZpbmVHZXR0ZXInLCBPYmplY3RFeHRlbnNpb24uZGVmaW5lR2V0dGVyKTtcclxuXHRcdC8vIE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShPYmplY3QsICdtYXAnLCBPYmplY3RFeHRlbnNpb24ubWFwKTtcclxuXHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoQXJyYXksICdtYXAnLCBBcnJheUV4dGVuc2lvbi5tYXApO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKEFycmF5LnByb3RvdHlwZSwgJ3BtYXAnLCBBcnJheUV4dGVuc2lvbi5wbWFwKTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShBcnJheS5wcm90b3R5cGUsICd2c29ydCcsIEFycmF5RXh0ZW5zaW9uLnZzb3J0KTtcclxuXHJcblx0XHR3aW5kb3cucGFnaW5hdGUgPSBQb29wSnMucGFnaW5hdGUgYXMgYW55O1xyXG5cdFx0d2luZG93LmltYWdlU2Nyb2xsaW5nID0gUG9vcEpzLkltYWdlU2Nyb2xsaW5nRXh0ZW5zaW9uO1xyXG5cclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZSh3aW5kb3csICdfX2luaXRfXycsICdhbHJlYWR5IGluaXRlZCcpO1xyXG5cdFx0cmV0dXJuICdpbml0ZWQnO1xyXG5cdH1cclxuXHJcblx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZUdldHRlcih3aW5kb3csICdfX2luaXRfXycsICgpID0+IF9faW5pdF9fKHdpbmRvdykpO1xyXG5cclxuXHRpZiAod2luZG93LmxvY2FsU3RvcmFnZS5fX2luaXRfXykge1xyXG5cdFx0d2luZG93Ll9faW5pdF9fO1xyXG5cdH1cclxuXHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHRleHBvcnQgdHlwZSBWYWx1ZU9mPFQ+ID0gVFtrZXlvZiBUXTtcclxuXHRleHBvcnQgdHlwZSBNYXBwZWRPYmplY3Q8VCwgVj4gPSB7IFtQIGluIGtleW9mIFRdOiBWIH07XHJcblxyXG5cdGV4cG9ydCB0eXBlIHNlbGVjdG9yID0gc3RyaW5nIHwgKHN0cmluZyAmIHsgXzogJ3NlbGVjdG9yJyB9KVxyXG5cdGV4cG9ydCB0eXBlIHVybCA9IGBodHRwJHtzdHJpbmd9YCAmIHsgXzogJ3VybCcgfTtcclxuXHRleHBvcnQgdHlwZSBMaW5rID0gSFRNTEFuY2hvckVsZW1lbnQgfCBzZWxlY3RvciB8IHVybDtcclxufVxyXG5cclxuXHJcbmRlY2xhcmUgY29uc3QgX19pbml0X186IFwiaW5pdGVkXCIgfCBcImFscmVhZHkgaW5pdGVkXCI7XHJcbmRlY2xhcmUgY29uc3QgZWxtOiB0eXBlb2YgUG9vcEpzLkVsbS5lbG07XHJcbmRlY2xhcmUgY29uc3QgcTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLldpbmRvd1EucSAmIHsgb3JFbG06IHR5cGVvZiBQb29wSnMuRWxtLnFPckVsbSB9OztcclxuZGVjbGFyZSBjb25zdCBxcTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLldpbmRvd1EucXE7XHJcbmRlY2xhcmUgY29uc3QgcGFnaW5hdGU6IHR5cGVvZiBQb29wSnMucGFnaW5hdGU7XHJcbmRlY2xhcmUgY29uc3QgaW1hZ2VTY3JvbGxpbmc6IHR5cGVvZiBQb29wSnMuSW1hZ2VTY3JvbGxpbmdFeHRlbnNpb247XHJcbmRlY2xhcmUgbmFtZXNwYWNlIGZldGNoIHtcclxuXHRleHBvcnQgY29uc3QgY2FjaGVkOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZCAmIHsgZG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYywganNvbjogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5jYWNoZWRKc29uIH07XHJcblx0ZXhwb3J0IGNvbnN0IGRvYzogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5kb2MgJiB7IGNhY2hlZDogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5jYWNoZWREb2MgfTtcclxuXHRleHBvcnQgY29uc3QgY2FjaGVkRG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYztcclxuXHRleHBvcnQgY29uc3QganNvbjogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5qc29uICYgeyBjYWNoZWQ6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkSnNvbiB9O1xyXG5cdGV4cG9ydCBjb25zdCBpc0NhY2hlZDogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5pc0NhY2hlZDtcclxufVxyXG5cclxuaW50ZXJmYWNlIFdpbmRvdyB7XHJcblx0cmVhZG9ubHkgX19pbml0X186IFwiaW5pdGVkXCIgfCBcImFscmVhZHkgaW5pdGVkXCI7XHJcblx0ZWxtOiB0eXBlb2YgUG9vcEpzLkVsbS5lbG07XHJcblx0cTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLldpbmRvd1EucSAmIHsgb3JFbG06IHR5cGVvZiBQb29wSnMuRWxtLnFPckVsbSB9O1xyXG5cdHFxOiB0eXBlb2YgUG9vcEpzLlF1ZXJ5U2VsZWN0b3IuV2luZG93US5xcTtcclxuXHRwYWdpbmF0ZTogdHlwZW9mIFBvb3BKcy5wYWdpbmF0ZTtcclxuXHRpbWFnZVNjcm9sbGluZzogdHlwZW9mIFBvb3BKcy5JbWFnZVNjcm9sbGluZ0V4dGVuc2lvbjtcclxuXHRmZXRjaDoge1xyXG5cdFx0KGlucHV0OiBSZXF1ZXN0SW5mbywgaW5pdD86IFJlcXVlc3RJbml0KTogUHJvbWlzZTxSZXNwb25zZT47XHJcblx0XHRjYWNoZWQ6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkICYgeyBkb2M6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkRG9jLCBqc29uOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZEpzb24gfTtcclxuXHRcdGRvYzogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5kb2MgJiB7IGNhY2hlZDogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5jYWNoZWREb2MgfTtcclxuXHRcdGNhY2hlZERvYzogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5jYWNoZWREb2M7XHJcblx0XHRqc29uOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmpzb24gJiB7IGNhY2hlZDogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5jYWNoZWRKc29uIH07XHJcblx0XHRpc0NhY2hlZDogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5pc0NhY2hlZDtcclxuXHR9XHJcbn1cclxuXHJcbmludGVyZmFjZSBFbGVtZW50IHtcclxuXHRxOiB0eXBlb2YgUG9vcEpzLlF1ZXJ5U2VsZWN0b3IuRWxlbWVudFEucTtcclxuXHRxcTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLkVsZW1lbnRRLnFxO1xyXG5cdGFwcGVuZFRvOiB0eXBlb2YgUG9vcEpzLkVsZW1lbnRFeHRlbnNpb24uYXBwZW5kVG87XHJcblx0ZW1pdDogdHlwZW9mIFBvb3BKcy5FbGVtZW50RXh0ZW5zaW9uLmVtaXQ7XHJcblx0YWRkRXZlbnRMaXN0ZW5lcjxUIGV4dGVuZHMgQ3VzdG9tRXZlbnQ8eyBfZXZlbnQ/OiBzdHJpbmcgfT4+KHR5cGU6IFRbJ2RldGFpbCddWydfZXZlbnQnXSwgbGlzdGVuZXI6ICh0aGlzOiBEb2N1bWVudCwgZXY6IFQpID0+IGFueSwgb3B0aW9ucz86IGJvb2xlYW4gfCBBZGRFdmVudExpc3RlbmVyT3B0aW9ucyk6IHZvaWQ7XHJcbn1cclxuaW50ZXJmYWNlIERvY3VtZW50IHtcclxuXHRxOiB0eXBlb2YgUG9vcEpzLlF1ZXJ5U2VsZWN0b3IuRG9jdW1lbnRRLnE7XHJcblx0cXE6IHR5cGVvZiBQb29wSnMuUXVlcnlTZWxlY3Rvci5Eb2N1bWVudFEucXE7XHJcblx0Y2FjaGVkQXQ6IG51bWJlcjtcclxuXHRhZGRFdmVudExpc3RlbmVyPFQgZXh0ZW5kcyBDdXN0b21FdmVudDx7IF9ldmVudD86IHN0cmluZyB9Pj4odHlwZTogVFsnZGV0YWlsJ11bJ19ldmVudCddLCBsaXN0ZW5lcjogKHRoaXM6IERvY3VtZW50LCBldjogVCkgPT4gYW55LCBvcHRpb25zPzogYm9vbGVhbiB8IEFkZEV2ZW50TGlzdGVuZXJPcHRpb25zKTogdm9pZDtcclxufVxyXG5cclxuaW50ZXJmYWNlIE9iamVjdENvbnN0cnVjdG9yIHtcclxuXHRkZWZpbmVWYWx1ZTogdHlwZW9mIFBvb3BKcy5PYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWU7XHJcblx0ZGVmaW5lR2V0dGVyOiB0eXBlb2YgUG9vcEpzLk9iamVjdEV4dGVuc2lvbi5kZWZpbmVHZXR0ZXI7XHJcblx0Ly8gbWFwOiB0eXBlb2YgUG9vcEpzLk9iamVjdEV4dGVuc2lvbi5tYXA7XHJcblx0c2V0UHJvdG90eXBlT2Y8VCwgUD4obzogVCwgcHJvdG86IFApOiBUICYgUDtcclxufVxyXG5pbnRlcmZhY2UgUHJvbWlzZUNvbnN0cnVjdG9yIHtcclxuXHRlbXB0eTogdHlwZW9mIFBvb3BKcy5Qcm9taXNlRXh0ZW5zaW9uLmVtcHR5O1xyXG5cdGZyYW1lOiB0eXBlb2YgUG9vcEpzLlByb21pc2VFeHRlbnNpb24uZnJhbWU7XHJcblx0cmFmOiB0eXBlb2YgUG9vcEpzLlByb21pc2VFeHRlbnNpb24uZnJhbWU7XHJcbn1cclxuXHJcbmludGVyZmFjZSBBcnJheTxUPiB7XHJcblx0dnNvcnQ6IHR5cGVvZiBQb29wSnMuQXJyYXlFeHRlbnNpb24udnNvcnQ7XHJcblx0cG1hcDogdHlwZW9mIFBvb3BKcy5BcnJheUV4dGVuc2lvbi5wbWFwO1xyXG59XHJcbmludGVyZmFjZSBBcnJheUNvbnN0cnVjdG9yIHtcclxuXHRtYXA6IHR5cGVvZiBQb29wSnMuQXJyYXlFeHRlbnNpb24ubWFwO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgRGF0ZUNvbnN0cnVjdG9yIHtcclxuXHRfbm93KCk6IG51bWJlcjtcclxufVxyXG5pbnRlcmZhY2UgRGF0ZSB7XHJcblx0X2dldFRpbWUoKTogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgUmVzcG9uc2Uge1xyXG5cdGNhY2hlZEF0OiBudW1iZXI7XHJcbn1cclxuXHJcbi8vIGludGVyZmFjZSBDdXN0b21FdmVudDxUPiB7XHJcbi8vIFx0ZGV0YWlsPzogVDtcclxuLy8gfVxyXG5cclxuaW50ZXJmYWNlIEZ1bmN0aW9uIHtcclxuXHRiaW5kPFQsIFIsIEFSR1MgZXh0ZW5kcyBhbnlbXT4odGhpczogKHRoaXM6IFQsIC4uLmFyZ3M6IEFSR1MpID0+IFIsIHRoaXNBcmc6IFQpOiAoKC4uLmFyZ3M6IEFSR1MpID0+IFIpXHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHRleHBvcnQgbmFtZXNwYWNlIEVudHJ5RmlsdGVyZXJFeHRlbnNpb24ge1xyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBGaWx0ZXJlckl0ZW08RGF0YT4ge1xyXG5cdFx0XHRpZDogc3RyaW5nID0gXCJcIjtcclxuXHRcdFx0bmFtZT86IHN0cmluZztcclxuXHRcdFx0ZGVzY3JpcHRpb24/OiBzdHJpbmc7XHJcblx0XHRcdHRocmVlV2F5OiBXYXluZXNzID0gZmFsc2U7XHJcblx0XHRcdG1vZGU6IE1vZGUgPSAnb2ZmJztcclxuXHRcdFx0cGFyZW50OiBFbnRyeUZpbHRlcmVyO1xyXG5cdFx0XHRidXR0b246IEhUTUxCdXR0b25FbGVtZW50O1xyXG5cdFx0XHRpbmNvbXBhdGlibGU/OiBzdHJpbmdbXTtcclxuXHRcdFx0aGlkZGVuID0gZmFsc2U7XHJcblxyXG5cdFx0XHRjb25zdHJ1Y3RvcihkYXRhOiBGaWx0ZXJlckl0ZW1Tb3VyY2UpIHtcclxuXHRcdFx0XHRkYXRhLmJ1dHRvbiA/Pz0gJ2J1dHRvbi5lZi1pdGVtJztcclxuXHRcdFx0XHRPYmplY3QuYXNzaWduKHRoaXMsIGRhdGEpO1xyXG5cclxuXHRcdFx0XHR0aGlzLmJ1dHRvbiA9IGVsbShkYXRhLmJ1dHRvbixcclxuXHRcdFx0XHRcdGNsaWNrID0+IHRoaXMuY2xpY2soY2xpY2spLFxyXG5cdFx0XHRcdFx0Y29udGV4dG1lbnUgPT4gdGhpcy5jb250ZXh0bWVudShjb250ZXh0bWVudSksXHJcblx0XHRcdFx0KTtcclxuXHRcdFx0XHR0aGlzLnBhcmVudC5jb250YWluZXIuYXBwZW5kKHRoaXMuYnV0dG9uKTtcclxuXHRcdFx0XHRpZiAodGhpcy5uYW1lKSB7XHJcblx0XHRcdFx0XHR0aGlzLmJ1dHRvbi5hcHBlbmQodGhpcy5uYW1lKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMuZGVzY3JpcHRpb24pIHtcclxuXHRcdFx0XHRcdHRoaXMuYnV0dG9uLnRpdGxlID0gdGhpcy5kZXNjcmlwdGlvbjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSAhPSAnb2ZmJykge1xyXG5cdFx0XHRcdFx0dGhpcy50b2dnbGVNb2RlKGRhdGEubW9kZSwgdHJ1ZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0aGlzLmhpZGRlbikge1xyXG5cdFx0XHRcdFx0dGhpcy5oaWRlKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjbGljayhldmVudDogTW91c2VFdmVudCkge1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29mZicpIHtcclxuXHRcdFx0XHRcdHRoaXMudG9nZ2xlTW9kZSgnb24nKTtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGV2ZW50LnRhcmdldCAhPSB0aGlzLmJ1dHRvbikgcmV0dXJuO1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29uJykge1xyXG5cdFx0XHRcdFx0dGhpcy50b2dnbGVNb2RlKHRoaXMudGhyZWVXYXkgPyAnb3Bwb3NpdGUnIDogJ29mZicpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR0aGlzLnRvZ2dsZU1vZGUoJ29mZicpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjb250ZXh0bWVudShldmVudDogTW91c2VFdmVudCkge1xyXG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSAhPSAnb3Bwb3NpdGUnKSB7XHJcblx0XHRcdFx0XHR0aGlzLnRvZ2dsZU1vZGUoJ29wcG9zaXRlJyk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHRoaXMudG9nZ2xlTW9kZSgnb2ZmJyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0b2dnbGVNb2RlKG1vZGU6IE1vZGUsIGZvcmNlID0gZmFsc2UpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09IG1vZGUgJiYgIWZvcmNlKSByZXR1cm47XHJcblx0XHRcdFx0dGhpcy5tb2RlID0gbW9kZTtcclxuXHRcdFx0XHR0aGlzLmJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2VmLW1vZGUnLCBtb2RlKTtcclxuXHRcdFx0XHRpZiAobW9kZSAhPSAnb2ZmJyAmJiB0aGlzLmluY29tcGF0aWJsZSkge1xyXG5cdFx0XHRcdFx0dGhpcy5wYXJlbnQub2ZmSW5jb21wYXRpYmxlKHRoaXMuaW5jb21wYXRpYmxlKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5wYXJlbnQucmVxdWVzdFVwZGF0ZSgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZW1vdmUoKSB7XHJcblx0XHRcdFx0dGhpcy5idXR0b24ucmVtb3ZlKCk7XHJcblx0XHRcdFx0dGhpcy50b2dnbGVNb2RlKCdvZmYnKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0c2hvdygpIHtcclxuXHRcdFx0XHR0aGlzLmhpZGRlbiA9IGZhbHNlO1xyXG5cdFx0XHRcdHRoaXMuYnV0dG9uLmhpZGRlbiA9IGZhbHNlO1xyXG5cdFx0XHR9XHJcblx0XHRcdGhpZGUoKSB7XHJcblx0XHRcdFx0dGhpcy5oaWRkZW4gPSB0cnVlO1xyXG5cdFx0XHRcdHRoaXMuYnV0dG9uLmhpZGRlbiA9IHRydWU7XHJcblx0XHRcdH1cclxuXHJcblx0XHR9XHJcblxyXG5cdH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL0ZpbHRlcmVySXRlbS50c1wiIC8+XHJcblxyXG5uYW1lc3BhY2UgUG9vcEpzIHtcclxuXHRleHBvcnQgbmFtZXNwYWNlIEVudHJ5RmlsdGVyZXJFeHRlbnNpb24ge1xyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBGaWx0ZXI8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4gaW1wbGVtZW50cyBJRmlsdGVyPERhdGE+IHtcclxuXHRcdFx0ZGVjbGFyZSBmaWx0ZXI6IEZpbHRlckZuPERhdGE+O1xyXG5cclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogRmlsdGVyU291cmNlPERhdGE+KSB7XHJcblx0XHRcdFx0ZGF0YS5idXR0b24gPz89ICdidXR0b24uZWYtaXRlbS5lZi1maWx0ZXJbZWYtbW9kZT1cIm9mZlwiXSc7XHJcblx0XHRcdFx0c3VwZXIoZGF0YSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKiByZXR1cm5zIGlmIGl0ZW0gc2hvdWxkIGJlIHZpc2libGUgKi9cclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb2ZmJykgcmV0dXJuIHRydWU7XHJcblx0XHRcdFx0bGV0IHZhbHVlID0gdGhpcy5maWx0ZXIoZGF0YSwgZWwsIHRoaXMubW9kZSk7XHJcblx0XHRcdFx0bGV0IHJlc3VsdCA9IHR5cGVvZiB2YWx1ZSA9PSBcIm51bWJlclwiID8gdmFsdWUgPiAwIDogdmFsdWU7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb24nKSByZXR1cm4gcmVzdWx0O1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29wcG9zaXRlJykgcmV0dXJuICFyZXN1bHQ7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgY2xhc3MgVmFsdWVGaWx0ZXI8RGF0YSwgViBleHRlbmRzIHN0cmluZyB8IG51bWJlcj4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4gaW1wbGVtZW50cyBJRmlsdGVyPERhdGE+IHtcclxuXHRcdFx0ZGVjbGFyZSBmaWx0ZXI6IFZhbHVlRmlsdGVyRm48RGF0YSwgVj47XHJcblx0XHRcdGlucHV0OiBIVE1MSW5wdXRFbGVtZW50O1xyXG5cdFx0XHRsYXN0VmFsdWU6IFY7XHJcblxyXG5cdFx0XHRjb25zdHJ1Y3RvcihkYXRhOiBWYWx1ZUZpbHRlclNvdXJjZTxEYXRhLCBWPikge1xyXG5cdFx0XHRcdGRhdGEuYnV0dG9uID8/PSAnYnV0dG9uLmVmLWl0ZW0uZWYtZmlsdGVyW2VmLW1vZGU9XCJvZmZcIl0nO1xyXG5cdFx0XHRcdHN1cGVyKGRhdGEpO1xyXG5cdFx0XHRcdGxldCB0eXBlID0gdHlwZW9mIGRhdGEuaW5wdXQgPT0gJ251bWJlcicgPyAnbnVtYmVyJyA6ICd0ZXh0JztcclxuXHRcdFx0XHRsZXQgdmFsdWUgPSBKU09OLnN0cmluZ2lmeShkYXRhLmlucHV0KTtcclxuXHRcdFx0XHRsZXQgaW5wdXQgPSBgaW5wdXRbdHlwZT0ke3R5cGV9XVt2YWx1ZT0ke3ZhbHVlfV1gO1xyXG5cdFx0XHRcdHRoaXMuaW5wdXQgPSBlbG08J2lucHV0Jz4oaW5wdXQsXHJcblx0XHRcdFx0XHRpbnB1dCA9PiB0aGlzLmNoYW5nZSgpLFxyXG5cdFx0XHRcdCkuYXBwZW5kVG8odGhpcy5idXR0b24pO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjaGFuZ2UoKSB7XHJcblx0XHRcdFx0bGV0IHZhbHVlID0gdGhpcy5nZXRWYWx1ZSgpO1xyXG5cdFx0XHRcdGlmICh0aGlzLmxhc3RWYWx1ZSAhPSB2YWx1ZSkge1xyXG5cdFx0XHRcdFx0dGhpcy5sYXN0VmFsdWUgPSB2YWx1ZTtcclxuXHRcdFx0XHRcdHRoaXMucGFyZW50LnJlcXVlc3RVcGRhdGUoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKiByZXR1cm5zIGlmIGl0ZW0gc2hvdWxkIGJlIHZpc2libGUgKi9cclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb2ZmJykgcmV0dXJuIHRydWU7XHJcblx0XHRcdFx0bGV0IHZhbHVlID0gdGhpcy5maWx0ZXIodGhpcy5nZXRWYWx1ZSgpLCBkYXRhLCBlbCk7XHJcblx0XHRcdFx0bGV0IHJlc3VsdCA9IHR5cGVvZiB2YWx1ZSA9PSBcIm51bWJlclwiID8gdmFsdWUgPiAwIDogdmFsdWU7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb24nKSByZXR1cm4gcmVzdWx0O1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29wcG9zaXRlJykgcmV0dXJuICFyZXN1bHQ7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGdldFZhbHVlKCk6IFYge1xyXG5cdFx0XHRcdGxldCB2YWx1ZTogViA9ICh0aGlzLmlucHV0LnR5cGUgPT0gJ3RleHQnID8gdGhpcy5pbnB1dC52YWx1ZSA6IHRoaXMuaW5wdXQudmFsdWVBc051bWJlcikgYXMgVjtcclxuXHRcdFx0XHRyZXR1cm4gdmFsdWU7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgY2xhc3MgTWF0Y2hGaWx0ZXI8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4gaW1wbGVtZW50cyBJRmlsdGVyPERhdGE+IHtcclxuXHRcdFx0ZGVjbGFyZSB2YWx1ZTogKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCkgPT4gc3RyaW5nO1xyXG5cdFx0XHRpbnB1dDogSFRNTElucHV0RWxlbWVudDtcclxuXHRcdFx0bGFzdFZhbHVlOiBzdHJpbmc7XHJcblx0XHRcdG1hdGNoZXI6IChpbnB1dDogc3RyaW5nKSA9PiBib29sZWFuO1xyXG5cclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogTWF0Y2hGaWx0ZXJTb3VyY2U8RGF0YT4pIHtcclxuXHRcdFx0XHRkYXRhLmJ1dHRvbiA/Pz0gJ2J1dHRvbi5lZi1pdGVtLmVmLWZpbHRlcltlZi1tb2RlPVwib2ZmXCJdJztcclxuXHRcdFx0XHRkYXRhLnZhbHVlID8/PSBkYXRhID0+IEpTT04uc3RyaW5naWZ5KGRhdGEpO1xyXG5cdFx0XHRcdHN1cGVyKGRhdGEpO1xyXG5cdFx0XHRcdGxldCB2YWx1ZSA9ICFkYXRhLmlucHV0ID8gJycgOiBKU09OLnN0cmluZ2lmeShkYXRhLmlucHV0KTtcclxuXHRcdFx0XHRsZXQgaW5wdXQgPSBgaW5wdXRbdHlwZT10ZXh0fV1bdmFsdWU9JHt2YWx1ZX1dYDtcclxuXHRcdFx0XHR0aGlzLmlucHV0ID0gZWxtPCdpbnB1dCc+KGlucHV0LFxyXG5cdFx0XHRcdFx0aW5wdXQgPT4gdGhpcy5jaGFuZ2UoKSxcclxuXHRcdFx0XHQpLmFwcGVuZFRvKHRoaXMuYnV0dG9uKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2hhbmdlKCkge1xyXG5cdFx0XHRcdGlmICh0aGlzLmxhc3RWYWx1ZSAhPSB0aGlzLmlucHV0LnZhbHVlKSB7XHJcblx0XHRcdFx0XHR0aGlzLmxhc3RWYWx1ZSA9IHRoaXMuaW5wdXQudmFsdWU7XHJcblx0XHRcdFx0XHR0aGlzLm1hdGNoZXIgPSB0aGlzLmdlbmVyYXRlTWF0Y2hlcih0aGlzLmxhc3RWYWx1ZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRhcHBseShkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvZmYnKSByZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHRsZXQgcmVzdWx0ID0gdGhpcy5tYXRjaGVyKHRoaXMudmFsdWUoZGF0YSwgZWwpKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5tb2RlID09ICdvbicgPyByZXN1bHQgOiAhcmVzdWx0O1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBtYXRjaGVyQ2FjaGU6IE1hcDxzdHJpbmcsICgoaW5wdXQ6IHN0cmluZykgPT4gYm9vbGVhbik+ID0gbmV3IE1hcCgpO1xyXG5cdFx0XHQvLyBnZXRNYXRjaGVyKHNvdXJjZTogc3RyaW5nKTogKGlucHV0OiBzdHJpbmcpID0+IGJvb2xlYW4ge1xyXG5cdFx0XHQvLyBcdGlmICh0aGlzLm1hdGNoZXJDYWNoZS5oYXMoc291cmNlKSkge1xyXG5cdFx0XHQvLyBcdFx0cmV0dXJuIHRoaXMubWF0Y2hlckNhY2hlLmdldChzb3VyY2UpO1xyXG5cdFx0XHQvLyBcdH1cclxuXHRcdFx0Ly8gXHRsZXQgbWF0Y2hlciA9IHRoaXMuZ2VuZXJhdGVNYXRjaGVyKHNvdXJjZSk7XHJcblx0XHRcdC8vIFx0dGhpcy5tYXRjaGVyQ2FjaGUuc2V0KHNvdXJjZSwgbWF0Y2hlcik7XHJcblx0XHRcdC8vIFx0cmV0dXJuIG1hdGNoZXI7XHJcblx0XHRcdC8vIH1cclxuXHRcdFx0Z2VuZXJhdGVNYXRjaGVyKHNvdXJjZTogc3RyaW5nKTogKChpbnB1dDogc3RyaW5nKSA9PiBib29sZWFuKSB7XHJcblx0XHRcdFx0c291cmNlID0gc291cmNlLnRyaW0oKTtcclxuXHRcdFx0XHRpZiAoc291cmNlLmxlbmd0aCA9PSAwKSByZXR1cm4gKCkgPT4gdHJ1ZTtcclxuXHRcdFx0XHRpZiAoc291cmNlLmluY2x1ZGVzKCcgJykpIHtcclxuXHRcdFx0XHRcdGxldCBwYXJ0cyA9IHNvdXJjZS5zcGxpdCgnICcpLm1hcChlID0+IHRoaXMuZ2VuZXJhdGVNYXRjaGVyKGUpKTtcclxuXHRcdFx0XHRcdHJldHVybiAoaW5wdXQpID0+IHBhcnRzLmV2ZXJ5KG0gPT4gbShpbnB1dCkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoc291cmNlLnN0YXJ0c1dpdGgoJy0nKSkge1xyXG5cdFx0XHRcdFx0aWYgKHNvdXJjZS5sZW5ndGggPCAzKSByZXR1cm4gKCkgPT4gdHJ1ZTtcclxuXHRcdFx0XHRcdGxldCBiYXNlID0gdGhpcy5nZW5lcmF0ZU1hdGNoZXIoc291cmNlLnNsaWNlKDEpKTtcclxuXHRcdFx0XHRcdHJldHVybiAoaW5wdXQpID0+ICFiYXNlKGlucHV0KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdGxldCBmbGFncyA9IHNvdXJjZS50b0xvd2VyQ2FzZSgpID09IHNvdXJjZSA/ICdpJyA6ICcnO1xyXG5cdFx0XHRcdFx0bGV0IHJlZ2V4ID0gbmV3IFJlZ0V4cChzb3VyY2UsIGZsYWdzKTtcclxuXHRcdFx0XHRcdHJldHVybiAoaW5wdXQpID0+ICEhaW5wdXQubWF0Y2gocmVnZXgpO1xyXG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHsgfTtcclxuXHRcdFx0XHRyZXR1cm4gKGlucHV0KSA9PiBpbnB1dC5pbmNsdWRlcyhzb3VyY2UpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dHlwZSBUYWdHZXR0ZXJGbjxEYXRhPiA9IHNlbGVjdG9yIHwgKChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQsIG1vZGU6IE1vZGUpID0+IChIVE1MRWxlbWVudFtdIHwgc3RyaW5nW10pKTtcclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgVGFnRmlsdGVyU291cmNlPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtU291cmNlIHtcclxuXHRcdFx0dGFnczogVGFnR2V0dGVyRm48RGF0YT47XHJcblx0XHRcdGlucHV0Pzogc3RyaW5nO1xyXG5cdFx0XHRoaWdoaWdodENsYXNzPzogc3RyaW5nO1xyXG5cdFx0fVxyXG5cdFx0dHlwZSBUYWdNYXRjaGVyID0geyBwb3NpdGl2ZTogYm9vbGVhbiwgbWF0Y2hlczogKHM6IHN0cmluZykgPT4gYm9vbGVhbiB9O1xyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBUYWdGaWx0ZXI8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4gaW1wbGVtZW50cyBJRmlsdGVyPERhdGE+IHtcclxuXHRcdFx0dGFnczogVGFnR2V0dGVyRm48RGF0YT47XHJcblx0XHRcdGlucHV0OiBIVE1MSW5wdXRFbGVtZW50O1xyXG5cdFx0XHRoaWdoaWdodENsYXNzOiBzdHJpbmc7XHJcblxyXG5cdFx0XHRsYXN0VmFsdWU6IHN0cmluZyA9ICcnO1xyXG5cdFx0XHRjYWNoZWRNYXRjaGVyOiBUYWdNYXRjaGVyW107XHJcblxyXG5cclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogVGFnRmlsdGVyU291cmNlPERhdGE+KSB7XHJcblx0XHRcdFx0ZGF0YS5idXR0b24gPz89ICdidXR0b24uZWYtaXRlbS5lZi1maWx0ZXJbZWYtbW9kZT1cIm9mZlwiXSc7XHJcblx0XHRcdFx0c3VwZXIoZGF0YSk7XHJcblx0XHRcdFx0dGhpcy5pbnB1dCA9IGVsbTwnaW5wdXQnPihgaW5wdXRbdHlwZT10ZXh0fV1gLFxyXG5cdFx0XHRcdFx0aW5wdXQgPT4gdGhpcy5jaGFuZ2UoKSxcclxuXHRcdFx0XHQpLmFwcGVuZFRvKHRoaXMuYnV0dG9uKTtcclxuXHRcdFx0XHR0aGlzLmlucHV0LnZhbHVlID0gZGF0YS5pbnB1dCB8fCAnJztcclxuXHRcdFx0XHR0aGlzLnRhZ3MgPSBkYXRhLnRhZ3M7XHJcblx0XHRcdFx0dGhpcy5jYWNoZWRNYXRjaGVyID0gW107XHJcblxyXG5cdFx0XHRcdHRoaXMuaGlnaGlnaHRDbGFzcyA9IGRhdGEuaGlnaGlnaHRDbGFzcyA/PyAnZWYtdGFnLWhpZ2hsaXNodCc7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGFwcGx5KGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xyXG5cdFx0XHRcdGxldCB0YWdzID0gdGhpcy5nZXRUYWdzKGRhdGEsIGVsKTtcclxuXHRcdFx0XHR0YWdzLm1hcCh0YWcgPT4gdGhpcy5yZXNldEhpZ2hsaWdodCh0YWcpKTtcclxuXHJcblx0XHRcdFx0bGV0IHJlc3VsdHMgPSB0aGlzLmNhY2hlZE1hdGNoZXIubWFwKG0gPT4ge1xyXG5cdFx0XHRcdFx0bGV0IHIgPSB7IHBvc2l0aXZlOiBtLnBvc2l0aXZlLCBjb3VudDogMCB9O1xyXG5cdFx0XHRcdFx0Zm9yIChsZXQgdGFnIG9mIHRhZ3MpIHtcclxuXHRcdFx0XHRcdFx0bGV0IHN0ciA9IHR5cGVvZiB0YWcgPT0gJ3N0cmluZycgPyB0YWcgOiB0YWcuaW5uZXJUZXh0O1xyXG5cdFx0XHRcdFx0XHRsZXQgdmFsID0gbS5tYXRjaGVzKHN0cik7XHJcblx0XHRcdFx0XHRcdGlmICh2YWwpIHtcclxuXHRcdFx0XHRcdFx0XHRyLmNvdW50Kys7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5oaWdobGlnaHRUYWcodGFnLCBtLnBvc2l0aXZlKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cmV0dXJuIHI7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0cmV0dXJuIHJlc3VsdHMuZXZlcnkociA9PiByLnBvc2l0aXZlID8gci5jb3VudCA+IDAgOiByLmNvdW50ID09IDApO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJlc2V0SGlnaGxpZ2h0KHRhZzogc3RyaW5nIHwgSFRNTEVsZW1lbnQpIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIHRhZyA9PSAnc3RyaW5nJykgcmV0dXJuO1xyXG5cdFx0XHRcdHRhZy5jbGFzc0xpc3QucmVtb3ZlKHRoaXMuaGlnaGlnaHRDbGFzcyk7XHJcblx0XHRcdH1cclxuXHRcdFx0aGlnaGxpZ2h0VGFnKHRhZzogc3RyaW5nIHwgSFRNTEVsZW1lbnQsIHBvc2l0aXZlOiBib29sZWFuKSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiB0YWcgPT0gJ3N0cmluZycpIHJldHVybjtcclxuXHRcdFx0XHQvLyBGSVhNRVxyXG5cdFx0XHRcdHRhZy5jbGFzc0xpc3QuYWRkKHRoaXMuaGlnaGlnaHRDbGFzcyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGdldFRhZ3MoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnRbXSB8IHN0cmluZ1tdIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIHRoaXMudGFncyA9PSAnc3RyaW5nJykgcmV0dXJuIGVsLnFxPEhUTUxFbGVtZW50Pih0aGlzLnRhZ3MpO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnRhZ3MoZGF0YSwgZWwsIHRoaXMubW9kZSk7XHJcblx0XHRcdH1cclxuXHRcdFx0Z2V0VGFnU3RyaW5ncyhkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpOiBzdHJpbmdbXSB7XHJcblx0XHRcdFx0bGV0IHRhZ3MgPSB0aGlzLmdldFRhZ3MoZGF0YSwgZWwpO1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgdGFnc1swXSA9PSAnc3RyaW5nJykgcmV0dXJuIHRhZ3MgYXMgc3RyaW5nW107XHJcblx0XHRcdFx0cmV0dXJuIHRhZ3MubWFwKChlKSA9PiBlLmlubmVyVGV4dCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNoYW5nZSgpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5sYXN0VmFsdWUgPT0gdGhpcy5pbnB1dC52YWx1ZSkgcmV0dXJuO1xyXG5cdFx0XHRcdHRoaXMubGFzdFZhbHVlID0gdGhpcy5pbnB1dC52YWx1ZTtcclxuXHRcdFx0XHR0aGlzLmNhY2hlZE1hdGNoZXIgPSB0aGlzLnBhcnNlTWF0Y2hlcih0aGlzLmxhc3RWYWx1ZSk7XHJcblx0XHRcdFx0dGhpcy5wYXJlbnQucmVxdWVzdFVwZGF0ZSgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRwYXJzZU1hdGNoZXIobWF0Y2hlcjogc3RyaW5nKTogVGFnTWF0Y2hlcltdIHtcclxuXHRcdFx0XHRtYXRjaGVyLnRyaW0oKTtcclxuXHRcdFx0XHRpZiAoIW1hdGNoZXIpIHJldHVybiBbXTtcclxuXHJcblx0XHRcdFx0aWYgKG1hdGNoZXIuaW5jbHVkZXMoJyAnKSkge1xyXG5cdFx0XHRcdFx0bGV0IHBhcnRzID0gbWF0Y2hlci5tYXRjaCgvXCJbXlwiXSpcInxcXFMrL2cpIHx8IFtdO1xyXG5cdFx0XHRcdFx0cmV0dXJuIHBhcnRzLmZsYXRNYXAoZSA9PiB0aGlzLnBhcnNlTWF0Y2hlcihlKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChtYXRjaGVyLnN0YXJ0c1dpdGgoJy0nKSkge1xyXG5cdFx0XHRcdFx0bGV0IHBhcnRzID0gdGhpcy5wYXJzZU1hdGNoZXIobWF0Y2hlci5zbGljZSgxKSk7XHJcblx0XHRcdFx0XHRyZXR1cm4gcGFydHMubWFwKGUgPT4gKHsgcG9zaXRpdmU6ICFlLnBvc2l0aXZlLCBtYXRjaGVzOiBlLm1hdGNoZXMgfSkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAobWF0Y2hlci5tYXRjaCgvXCJeW15cIl0qXCIkLykpIHtcclxuXHRcdFx0XHRcdG1hdGNoZXIgPSBtYXRjaGVyLnNsaWNlKDEsIC0xKTtcclxuXHRcdFx0XHRcdHJldHVybiBbeyBwb3NpdGl2ZTogdHJ1ZSwgbWF0Y2hlczogdGFnID0+IHRhZyA9PSBtYXRjaGVyIH1dO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAobWF0Y2hlci5sZW5ndGggPCAzKSByZXR1cm4gW107XHJcblx0XHRcdFx0aWYgKG1hdGNoZXIubWF0Y2goL1wiLyk/Lmxlbmd0aCA9PSAxKSByZXR1cm4gW107XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdGxldCBnID0gbmV3IFJlZ0V4cChtYXRjaGVyLCAnaScpO1xyXG5cdFx0XHRcdFx0cmV0dXJuIFt7IHBvc2l0aXZlOiB0cnVlLCBtYXRjaGVzOiB0YWcgPT4gISF0YWcubWF0Y2goZykgfV07XHJcblx0XHRcdFx0fSBjYXRjaCAoZSkgeyB9XHJcblx0XHRcdFx0cmV0dXJuIFt7IHBvc2l0aXZlOiB0cnVlLCBtYXRjaGVzOiB0YWcgPT4gdGFnLmluY2x1ZGVzKG1hdGNoZXIpIH1dO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBQYWdpbmF0aW9uSW5mb0ZpbHRlcjxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbTxEYXRhPiBpbXBsZW1lbnRzIElGaWx0ZXI8RGF0YT4ge1xyXG5cdFx0XHRjb25zdHJ1Y3RvcihkYXRhOiBGaWx0ZXJlckl0ZW1Tb3VyY2UpIHtcclxuXHRcdFx0XHRzdXBlcihkYXRhKTtcclxuXHRcdFx0XHR0aGlzLmluaXQoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRhcHBseSgpIHtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRQYWdpbmF0ZSA9IFBvb3BKcy5QYWdpbmF0ZUV4dGVuc2lvbi5QYWdpbmF0ZTtcclxuXHRcdFx0Y291bnRQYWdpbmF0ZSgpIHtcclxuXHRcdFx0XHRsZXQgZGF0YSA9IHsgcnVubmluZzogMCwgcXVldWVkOiAwLCB9O1xyXG5cdFx0XHRcdGZvciAobGV0IHAgb2YgdGhpcy5QYWdpbmF0ZS5pbnN0YW5jZXMpIHtcclxuXHRcdFx0XHRcdGRhdGEucnVubmluZyArPSArcC5ydW5uaW5nO1xyXG5cdFx0XHRcdFx0ZGF0YS5xdWV1ZWQgKz0gcC5xdWV1ZWQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBkYXRhO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR1cGRhdGVJbmZvKCkge1xyXG5cdFx0XHRcdGxldCBkYXRhID0gdGhpcy5jb3VudFBhZ2luYXRlKCk7XHJcblx0XHRcdFx0aWYgKCFkYXRhLnJ1bm5pbmcgJiYgIWRhdGEucXVldWVkKSB7XHJcblx0XHRcdFx0XHR0aGlzLmhpZGUoKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhpcy5zaG93KCk7XHJcblx0XHRcdFx0XHR0aGlzLmJ1dHRvbi5pbm5lclRleHQgPSBgLi4uICske2RhdGEucnVubmluZyArIGRhdGEucXVldWVkfWA7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRhc3luYyBpbml0KCkge1xyXG5cdFx0XHRcdHdoaWxlKHRydWUpIHtcclxuXHRcdFx0XHRcdGF3YWl0IFByb21pc2UuZnJhbWUoKTtcclxuXHRcdFx0XHRcdHRoaXMudXBkYXRlSW5mbygpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHR9XHJcbn1cclxuIiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFbnRyeUZpbHRlcmVyRXh0ZW5zaW9uIHtcclxuXHJcblx0XHRleHBvcnQgY2xhc3MgTW9kaWZpZXI8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4gaW1wbGVtZW50cyBJTW9kaWZpZXI8RGF0YT4ge1xyXG5cdFx0XHRkZWNsYXJlIG1vZGlmaWVyOiBNb2RpZmllckZuPERhdGE+O1xyXG5cdFx0XHRkZWNsYXJlIHJ1bk9uTm9DaGFuZ2U/OiBib29sZWFuO1xyXG5cclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogTW9kaWZpZXJTb3VyY2U8RGF0YT4pIHtcclxuXHRcdFx0XHRkYXRhLmJ1dHRvbiA/Pz0gJ2J1dHRvbi5lZi1pdGVtLmVmLW1vZGlmaWVyW2VmLW1vZGU9XCJvZmZcIl0nO1xyXG5cdFx0XHRcdHN1cGVyKGRhdGEpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0b2dnbGVNb2RlKG1vZGU6IE1vZGUsIGZvcmNlID0gZmFsc2UpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09IG1vZGUgJiYgIWZvcmNlKSByZXR1cm47XHJcblx0XHRcdFx0dGhpcy5wYXJlbnQubW92ZVRvVG9wKHRoaXMpO1xyXG5cdFx0XHRcdHN1cGVyLnRvZ2dsZU1vZGUobW9kZSwgZm9yY2UpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRhcHBseShkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpIHtcclxuXHRcdFx0XHRsZXQgb2xkTW9kZTogTW9kZSB8IG51bGwgPSBlbC5nZXRBdHRyaWJ1dGUoYGVmLW1vZGlmaWVyLSR7dGhpcy5pZH0tbW9kZWApIGFzIChNb2RlIHwgbnVsbCk7XHJcblx0XHRcdFx0aWYgKG9sZE1vZGUgPT0gdGhpcy5tb2RlICYmICF0aGlzLnJ1bk9uTm9DaGFuZ2UpIHJldHVybjtcclxuXHRcdFx0XHR0aGlzLm1vZGlmaWVyKGRhdGEsIGVsLCB0aGlzLm1vZGUsIG51bGwpO1xyXG5cdFx0XHRcdGVsLnNldEF0dHJpYnV0ZShgZWYtbW9kaWZpZXItJHt0aGlzLmlkfS1tb2RlYCwgdGhpcy5tb2RlKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBQcmVmaXhlcjxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbTxEYXRhPiBpbXBsZW1lbnRzIElNb2RpZmllcjxEYXRhPiB7XHJcblx0XHRcdGRlY2xhcmUgdGFyZ2V0OiBzZWxlY3RvciB8ICgoZTogSFRNTEVsZW1lbnQsIGRhdGE6IERhdGEsIG1vZGU6IE1vZGUpID0+IChIVE1MRWxlbWVudCB8IEhUTUxFbGVtZW50W10pKTtcclxuXHRcdFx0ZGVjbGFyZSBwcmVmaXg/OiAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50LCBtb2RlOiBNb2RlKSA9PiBzdHJpbmc7XHJcblx0XHRcdGRlY2xhcmUgcG9zdGZpeD86IChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQsIG1vZGU6IE1vZGUpID0+IHN0cmluZztcclxuXHRcdFx0ZGVjbGFyZSBwcmVmaXhBdHRyaWJ1dGU6IHN0cmluZztcclxuXHRcdFx0ZGVjbGFyZSBwb3N0Zml4QXR0cmlidXRlOiBzdHJpbmc7XHJcblx0XHRcdGRlY2xhcmUgYWxsOiBib29sZWFuO1xyXG5cclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogUHJlZml4ZXJTb3VyY2U8RGF0YT4pIHtcclxuXHRcdFx0XHRkYXRhLmJ1dHRvbiA/Pz0gJ2J1dHRvbi5lZi1pdGVtLmVmLW1vZGlmaWVyW2VmLW1vZGU9XCJvZmZcIl0nO1xyXG5cdFx0XHRcdGRhdGEudGFyZ2V0ID8/PSBlID0+IGU7XHJcblx0XHRcdFx0ZGF0YS5wcmVmaXhBdHRyaWJ1dGUgPz89ICdlZi1wcmVmaXgnO1xyXG5cdFx0XHRcdGRhdGEucG9zdGZpeEF0dHJpYnV0ZSA/Pz0gJ2VmLXBvc3RmaXgnO1xyXG5cdFx0XHRcdGRhdGEuYWxsID8/PSBmYWxzZTtcclxuXHRcdFx0XHRzdXBlcihkYXRhKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KSB7XHJcblx0XHRcdFx0bGV0IHRhcmdldHMgPSB0aGlzLmdldFRhcmdldHMoZWwsIGRhdGEpO1xyXG5cdFx0XHRcdGlmICh0aGlzLnByZWZpeCkge1xyXG5cdFx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb2ZmJykge1xyXG5cdFx0XHRcdFx0XHR0YXJnZXRzLm1hcChlID0+IGUucmVtb3ZlQXR0cmlidXRlKHRoaXMucHJlZml4QXR0cmlidXRlKSk7XHJcblx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRsZXQgdmFsdWUgPSB0aGlzLnByZWZpeChkYXRhLCBlbCwgdGhpcy5tb2RlKTtcclxuXHRcdFx0XHRcdFx0dGFyZ2V0cy5tYXAoZSA9PiBlLnNldEF0dHJpYnV0ZSh0aGlzLnByZWZpeEF0dHJpYnV0ZSwgdmFsdWUpKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMucG9zdGZpeCkge1xyXG5cdFx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb2ZmJykge1xyXG5cdFx0XHRcdFx0XHR0YXJnZXRzLm1hcChlID0+IGUucmVtb3ZlQXR0cmlidXRlKHRoaXMucG9zdGZpeEF0dHJpYnV0ZSkpO1xyXG5cdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0bGV0IHZhbHVlID0gdGhpcy5wb3N0Zml4KGRhdGEsIGVsLCB0aGlzLm1vZGUpO1xyXG5cdFx0XHRcdFx0XHR0YXJnZXRzLm1hcChlID0+IGUuc2V0QXR0cmlidXRlKHRoaXMucG9zdGZpeEF0dHJpYnV0ZSwgdmFsdWUpKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGdldFRhcmdldHMoZWw6IEhUTUxFbGVtZW50LCBkYXRhOiBEYXRhKTogSFRNTEVsZW1lbnRbXSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiB0aGlzLnRhcmdldCA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0aWYgKHRoaXMuYWxsKSByZXR1cm4gZWwucXEodGhpcy50YXJnZXQpO1xyXG5cdFx0XHRcdFx0cmV0dXJuIFtlbC5xKHRoaXMudGFyZ2V0KV07XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGxldCB0YXJnZXRzID0gdGhpcy50YXJnZXQoZWwsIGRhdGEsIHRoaXMubW9kZSk7XHJcblx0XHRcdFx0XHRyZXR1cm4gQXJyYXkuaXNBcnJheSh0YXJnZXRzKSA/IHRhcmdldHMgOiBbdGFyZ2V0c107XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdH1cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cdGV4cG9ydCBuYW1lc3BhY2UgRW50cnlGaWx0ZXJlckV4dGVuc2lvbiB7XHJcblxyXG5cdFx0ZXhwb3J0IGNsYXNzIFNvcnRlcjxEYXRhLCBWIGV4dGVuZHMgbnVtYmVyIHwgc3RyaW5nPiBleHRlbmRzIEZpbHRlcmVySXRlbTxEYXRhPiBpbXBsZW1lbnRzIElTb3J0ZXI8RGF0YT4ge1xyXG5cdFx0XHRkZWNsYXJlIHNvcnRlcjogU29ydGVyRm48RGF0YSwgVj47XHJcblx0XHRcdGRlY2xhcmUgY29tcGFyYXRvcjogKGE6IFYsIGI6IFYpID0+IG51bWJlcjtcclxuXHJcblx0XHRcdGNvbnN0cnVjdG9yKGRhdGE6IFNvcnRlclNvdXJjZTxEYXRhLCBWPikge1xyXG5cdFx0XHRcdGRhdGEuYnV0dG9uID8/PSAnYnV0dG9uLmVmLWl0ZW0uZWYtc29ydGVyW2VmLW1vZGU9XCJvZmZcIl0nO1xyXG5cdFx0XHRcdGRhdGEuY29tcGFyYXRvciA/Pz0gKGE6IFYsIGI6IFYpID0+IGEgPiBiID8gMSA6IGEgPCBiID8gLTEgOiAwO1xyXG5cdFx0XHRcdHN1cGVyKGRhdGEpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0b2dnbGVNb2RlKG1vZGU6IE1vZGUsIGZvcmNlID0gZmFsc2UpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09IG1vZGUgJiYgIWZvcmNlKSByZXR1cm47XHJcblx0XHRcdFx0dGhpcy5wYXJlbnQubW92ZVRvVG9wKHRoaXMpO1xyXG5cdFx0XHRcdHN1cGVyLnRvZ2dsZU1vZGUobW9kZSwgZm9yY2UpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRzb3J0KGxpc3Q6IFtEYXRhLCBIVE1MRWxlbWVudF1bXSk6IFtEYXRhLCBIVE1MRWxlbWVudF1bXSB7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb2ZmJykgcmV0dXJuIGxpc3Q7XHJcblx0XHRcdFx0cmV0dXJuIGxpc3QudnNvcnQoKFtkYXRhLCBlbF06IFtEYXRhLCBIVE1MRWxlbWVudF0pID0+IHRoaXMuYXBwbHkoZGF0YSwgZWwpLCAoYTogViwgYjogVikgPT4gdGhpcy5jb21wYXJlKGEsIGIpKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0LyoqIHJldHVybnMgb3JkZXIgb2YgZW50cnkgKi9cclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogViB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuc29ydGVyKGRhdGEsIGVsLCB0aGlzLm1vZGUpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjb21wYXJlKGE6IFYsIGI6IFYpOiBudW1iZXIge1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29uJykge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuY29tcGFyYXRvcihhLCBiKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb3Bwb3NpdGUnKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5jb21wYXJhdG9yKGIsIGEpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gMDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHR9XHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFbnRyeUZpbHRlcmVyRXh0ZW5zaW9uIHtcclxuXHRcdGV4cG9ydCB0eXBlIFdheW5lc3MgPSBmYWxzZSB8IHRydWUgfCAnZGlyJztcclxuXHRcdGV4cG9ydCB0eXBlIE1vZGUgPSAnb2ZmJyB8ICdvbicgfCAnb3Bwb3NpdGUnO1xyXG5cclxuXHRcdGV4cG9ydCB0eXBlIFBhcnNlckZuPERhdGE+ID0gKGVsOiBIVE1MRWxlbWVudCwgZGF0YTogUGFydGlhbDxEYXRhPikgPT4gUGFydGlhbDxEYXRhPiB8IHZvaWQgfCBQcm9taXNlTGlrZTxQYXJ0aWFsPERhdGEgfCB2b2lkPj47XHJcblx0XHRleHBvcnQgdHlwZSBGaWx0ZXJGbjxEYXRhPiA9IChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQsIG1vZGU6IE1vZGUpID0+IGJvb2xlYW47XHJcblx0XHRleHBvcnQgdHlwZSBTb3J0ZXJGbjxEYXRhLCBWPiA9IChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQsIG1vZGU6IE1vZGUpID0+IFY7XHJcblx0XHRleHBvcnQgdHlwZSBNb2RpZmllckZuPERhdGE+ID0gKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCwgbW9kZTogTW9kZSwgb2xkTW9kZTogTW9kZSB8IG51bGwpID0+IHZvaWQ7XHJcblx0XHRleHBvcnQgdHlwZSBWYWx1ZUZpbHRlckZuPERhdGEsIFY+ID0gKHZhbHVlOiBWLCBkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpID0+IGJvb2xlYW47XHJcblx0XHRleHBvcnQgdHlwZSBQcmVmaXhlckZuPERhdGE+ID0gKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCwgbW9kZTogTW9kZSkgPT4gc3RyaW5nO1xyXG5cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgSUZpbHRlcjxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbTxEYXRhPiB7XHJcblx0XHRcdGFwcGx5KGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCk6IGJvb2xlYW47XHJcblx0XHR9XHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIElTb3J0ZXI8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4ge1xyXG5cdFx0XHRzb3J0KGxpc3Q6IFtEYXRhLCBIVE1MRWxlbWVudF1bXSk6IFtEYXRhLCBIVE1MRWxlbWVudF1bXTtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgSU1vZGlmaWVyPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtPERhdGE+IHtcclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogdm9pZDtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIEZpbHRlcmVySXRlbVNvdXJjZSB7XHJcblx0XHRcdGJ1dHRvbj86IHNlbGVjdG9yO1xyXG5cdFx0XHRpZDogc3RyaW5nO1xyXG5cdFx0XHRuYW1lPzogc3RyaW5nO1xyXG5cdFx0XHRkZXNjcmlwdGlvbj86IHN0cmluZztcclxuXHRcdFx0dGhyZWVXYXk/OiBXYXluZXNzO1xyXG5cdFx0XHRtb2RlPzogTW9kZTtcclxuXHRcdFx0cGFyZW50OiBFbnRyeUZpbHRlcmVyO1xyXG5cdFx0XHRpbmNvbXBhdGlibGU/OiBzdHJpbmdbXTtcclxuXHRcdFx0aGlkZGVuPzogYm9vbGVhbjtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgRmlsdGVyU291cmNlPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtU291cmNlIHtcclxuXHRcdFx0ZmlsdGVyOiBGaWx0ZXJGbjxEYXRhPjtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgVmFsdWVGaWx0ZXJTb3VyY2U8RGF0YSwgVj4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW1Tb3VyY2Uge1xyXG5cdFx0XHRmaWx0ZXI6IFZhbHVlRmlsdGVyRm48RGF0YSwgVj47XHJcblx0XHRcdGlucHV0OiBWO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBNYXRjaEZpbHRlclNvdXJjZTxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbVNvdXJjZSB7XHJcblx0XHRcdHZhbHVlPzogKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCkgPT4gc3RyaW5nO1xyXG5cdFx0XHRpbnB1dD86IHN0cmluZztcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgU29ydGVyU291cmNlPERhdGEsIFY+IGV4dGVuZHMgRmlsdGVyZXJJdGVtU291cmNlIHtcclxuXHRcdFx0c29ydGVyOiBTb3J0ZXJGbjxEYXRhLCBWPjtcclxuXHRcdFx0Y29tcGFyYXRvcj86ICgoYTogViwgYjogVikgPT4gbnVtYmVyKSB8IFY7XHJcblx0XHR9XHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIE1vZGlmaWVyU291cmNlPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtU291cmNlIHtcclxuXHRcdFx0bW9kaWZpZXI6IE1vZGlmaWVyRm48RGF0YT47XHJcblx0XHR9XHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIFByZWZpeGVyU291cmNlPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtU291cmNlIHtcclxuXHRcdFx0dGFyZ2V0Pzogc2VsZWN0b3IgfCAoKGVsOiBIVE1MRWxlbWVudCwgZGF0YTogRGF0YSwgbW9kZTogTW9kZSkgPT4gSFRNTEVsZW1lbnQpO1xyXG5cdFx0XHRwcmVmaXg/OiAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KSA9PiBzdHJpbmc7XHJcblx0XHRcdHBvc3RmaXg/OiAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KSA9PiBzdHJpbmc7XHJcblx0XHRcdHByZWZpeEF0dHJpYnV0ZT86IHN0cmluZztcclxuXHRcdFx0cG9zdGZpeEF0dHJpYnV0ZT86IHN0cmluZztcclxuXHRcdFx0YWxsPzogYm9vbGVhbjtcclxuXHRcdH1cclxuXHJcblx0XHRcclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgRmlsdGVyZXJJdGVtUGFydGlhbCB7XHJcblx0XHRcdGJ1dHRvbj86IHNlbGVjdG9yO1xyXG5cdFx0XHRpZD86IHN0cmluZztcclxuXHRcdFx0bmFtZT86IHN0cmluZztcclxuXHRcdFx0ZGVzY3JpcHRpb24/OiBzdHJpbmc7XHJcblx0XHRcdHRocmVlV2F5PzogV2F5bmVzcztcclxuXHRcdFx0bW9kZT86IE1vZGU7XHJcblx0XHRcdGluY29tcGF0aWJsZT86IHN0cmluZ1tdO1xyXG5cdFx0XHRoaWRkZW4/OiBib29sZWFuO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBGaWx0ZXJQYXJ0aWFsPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtUGFydGlhbCB7IH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgVmFsdWVGaWx0ZXJQYXJ0aWFsPERhdGEsIFY+IGV4dGVuZHMgRmlsdGVyZXJJdGVtUGFydGlhbCB7XHJcblx0XHRcdGlucHV0OiBWO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBTb3J0ZXJQYXJ0aWFsU291cmNlPERhdGEsIFY+IGV4dGVuZHMgRmlsdGVyZXJJdGVtUGFydGlhbCB7XHJcblx0XHRcdGNvbXBhcmF0b3I/OiAoKGE6IFYsIGI6IFYpID0+IG51bWJlcikgfCBWO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBNb2RpZmllclBhcnRpYWw8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW1QYXJ0aWFsIHsgfVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBQcmVmaXhlclBhcnRpYWw8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW1QYXJ0aWFsIHtcclxuXHRcdFx0dGFyZ2V0Pzogc2VsZWN0b3IgfCAoKGVsOiBIVE1MRWxlbWVudCwgZGF0YTogRGF0YSwgbW9kZTogTW9kZSkgPT4gSFRNTEVsZW1lbnQpO1xyXG5cdFx0XHRwcmVmaXg/OiAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KSA9PiBzdHJpbmc7XHJcblx0XHRcdHBvc3RmaXg/OiAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KSA9PiBzdHJpbmc7XHJcblx0XHRcdHByZWZpeEF0dHJpYnV0ZT86IHN0cmluZztcclxuXHRcdFx0cG9zdGZpeEF0dHJpYnV0ZT86IHN0cmluZztcclxuXHRcdFx0YWxsPzogYm9vbGVhbjtcclxuXHRcdH1cclxuXHJcblx0XHR0eXBlIFVuaW9uPFNvdXJjZSwgUmVzdWx0PiA9IHtcclxuXHRcdFx0W1AgaW4ga2V5b2YgU291cmNlICYga2V5b2YgUmVzdWx0XTogU291cmNlW1BdIHwgUmVzdWx0W1BdO1xyXG5cdFx0fSAmIE9taXQ8U291cmNlLCBrZXlvZiBSZXN1bHQ+ICYgT21pdDxSZXN1bHQsIGtleW9mIFNvdXJjZT47XHJcblxyXG5cdFx0dHlwZSBPdmVycmlkZTxULCBPPiA9IE9taXQ8VCwga2V5b2YgTz4gJiBPO1xyXG5cclxuXHRcdHR5cGUgRUZTb3VyY2U8VCBleHRlbmRzIHsgc291cmNlOiBhbnkgfT4gPSBPdmVycmlkZTxPdmVycmlkZTxQYXJ0aWFsPFQ+LCBUWydzb3VyY2UnXT4sIHsgYnV0dG9uPzogc2VsZWN0b3IgfT47XHJcblxyXG5cdFx0dHlwZSBTb3VyY2U8VCBleHRlbmRzIHsgc291cmNlOiBhbnkgfT4gPSBUWydzb3VyY2UnXSAmIHtcclxuXHRcdFx0aWQ/OiBzdHJpbmc7IG5hbWU/OiBzdHJpbmc7IGRlc2NyaXB0aW9uPzogc3RyaW5nO1xyXG5cdFx0XHR0aHJlZVdheT86IFdheW5lc3M7IG1vZGU/OiBNb2RlOyBpbmNvbXBhdGlibGU/OiBzdHJpbmdbXTsgaGlkZGVuPzogYm9vbGVhbjtcclxuXHRcdH07XHJcblxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogY2FuIGJlIGVpdGhlciBNYXAgb3IgV2Vha01hcFxyXG5cdFx0ICogKFdlYWtNYXAgaXMgbGlrZWx5IHRvIGJlIHVzZWxlc3MgaWYgdGhlcmUgYXJlIGxlc3MgdGhlbiAxMGsgb2xkIG5vZGVzIGluIG1hcClcclxuXHRcdCAqL1xyXG5cdFx0bGV0IE1hcFR5cGUgPSBNYXA7XHJcblx0XHR0eXBlIE1hcFR5cGU8SyBleHRlbmRzIG9iamVjdCwgVj4gPS8vIE1hcDxLLCBWPiB8IFxyXG5cdFx0XHRXZWFrTWFwPEssIFY+O1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGxldCBFRiA9IEVudHJ5RmlsdGVyZXJFeHRlbnNpb24uRW50cnlGaWx0ZXJlcjtcclxufSIsIiJdfQ==