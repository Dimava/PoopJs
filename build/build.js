var PoopJs;
(function (PoopJs) {
    let array;
    (function (array) {
        async function pmap(mapper, threads = 5) {
            if (!(threads > 0))
                throw new Error();
            let tasks = this.map((e, i, a) => [e, i, a]);
            let results = Array(tasks.length);
            let anyResolved = PoopJs.promise.empty();
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
                anyResolved = PoopJs.promise.empty();
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
        array.pmap = pmap;
        function map(length, mapper = i => i) {
            return this(length).fill(0).map((e, i, a) => mapper(i));
        }
        array.map = map;
        function vsort(mapper, sorter = (a, b) => a - b) {
            let theSorter = typeof sorter == 'function' ? sorter : (a, b) => b - a;
            return this
                .map((e, i, a) => ({ e, v: mapper(e, i, a) }))
                .sort((a, b) => theSorter(a.v, b.v, a.e, b.e))
                .map(e => e.e);
        }
        array.vsort = vsort;
    })(array = PoopJs.array || (PoopJs.array = {}));
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
    let winq;
    (function (winq) {
        function q(selector, parent = document) {
            return parent.querySelector(selector);
        }
        winq.q = q;
        function qq(selector, parent = document) {
            return [...parent.querySelectorAll(selector)];
        }
        winq.qq = qq;
    })(winq = PoopJs.winq || (PoopJs.winq = {}));
    let docq;
    (function (docq) {
        function q(selector) {
            return this.documentElement.querySelector(selector);
        }
        docq.q = q;
        function qq(selector) {
            return [...this.documentElement.querySelectorAll(selector)];
        }
        docq.qq = qq;
    })(docq = PoopJs.docq || (PoopJs.docq = {}));
    let element;
    (function (element) {
        function q(selector) {
            return this.querySelector(selector);
        }
        element.q = q;
        function qq(selector) {
            return [...this.querySelectorAll(selector)];
        }
        element.qq = qq;
        function emit(type, detail) {
            let event = new CustomEvent(type, {
                bubbles: true,
                detail,
            });
            this.dispatchEvent(event);
        }
        element.emit = emit;
        function appendTo(parent) {
            if (typeof parent == 'string') {
                parent = document.querySelector(parent);
            }
            parent.append(this);
            return this;
        }
        element.appendTo = appendTo;
    })(element = PoopJs.element || (PoopJs.element = {}));
})(PoopJs || (PoopJs = {}));
// Object.defineGetter(Element.prototype, function data(){
// 	let data = JSON.parse(this.dataset.data || '{}');
// 	return new Proxy(data, {
// 		get: (target, name) => {
// 			if (name == 'data') return data;
// 			return data[name];
// 		},
// 		set: (target, name, value) => {
// 			data[name] = value;
// 			this.dataset.data = JSON.stringify(data);
// 		},
// 	});
// });
var PoopJs;
(function (PoopJs) {
    class EntryFilterer {
        constructor(sel) {
            this.active = false;
            this.parsers = [];
            this.filters = [];
            this.sorters = [];
            this.activeSorters = [];
            this.selector = '';
            this.entryGetter = () => qq(this.selector);
            if (typeof sel == 'string') {
                this.selector = sel;
            }
            else {
                this.entryGetter = sel;
            }
            this.container = elm('.ef-container');
        }
        show(on = true) {
            if (!on)
                return this;
            this.container.appendTo('body');
            PoopJs.paginate.onchange(() => this.onPaginateChange());
            this.active = true;
            this.update();
            return this;
        }
        getEntries(update = false) {
            return this.entryGetter();
        }
        parse() {
            for (let el of this.getEntries()) {
                let data = JSON.parse(el.dataset.ef || '{}');
                for (let parser of this.parsers) {
                    data = parser(el, data) || data;
                }
                el.dataset.ef = JSON.stringify(data);
            }
        }
        getEntriesWithData() {
            return this.getEntries().map(el => ({ el, data: JSON.parse(el.dataset.ef || '{}') }));
        }
        onPaginateChange() {
            this.update();
        }
        addParser(parser) {
            this.parsers.push(parser);
            this.parse();
        }
        addFilter(name, filter, on) {
            let entry = { name, filter, on: false, button: undefined };
            this.filters.push(entry);
            entry.button = elm('button.ef-filter', name, (click) => {
                entry.on = !entry.on;
                click.target.classList.toggle('ef-filter-on', entry.on);
                this.update();
            }).appendTo(this.container);
            if (on) {
                requestAnimationFrame(() => entry.button.click());
            }
        }
        addSorter(name, sortValue, on) {
            let entry = { name, sortValue, on: !!on };
            this.sorters.push(entry);
            elm('button.ef-sorter', name, (click) => {
                entry.on = !entry.on;
                click.target.classList.toggle('ef-sorter-on', entry.on);
                if (entry.on)
                    this.activeSorters.push(sortValue);
                else
                    this.activeSorters.splice(this.activeSorters.indexOf(sortValue), 1);
                this.update();
            }).appendTo(this.container);
        }
        update() {
            if (!this.active)
                return;
            this.parse();
            let ens = this.getEntriesWithData();
            for (let en of ens) {
                let on = true;
                for (let f of this.filters) {
                    if (f.on)
                        on = on && f.filter(en.data);
                }
                en.el.classList.toggle('ef-hidden', !on);
            }
            if (!this.activeSorters.length)
                return;
            let br = elm('br');
            ens[0].el.before(br);
            for (let sorter of this.activeSorters) {
                ens = ens.vsort(({ data }) => sorter(data));
            }
            br.after(...ens.map(e => e.el));
            br.remove();
        }
    }
    PoopJs.EntryFilterer = EntryFilterer;
})(PoopJs || (PoopJs = {}));
var PoopJs;
(function (PoopJs) {
    let object;
    (function (object) {
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
        object.defineValue = defineValue;
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
        object.defineGetter = defineGetter;
        function map(o, mapper) {
            let entries = Object.entries(o);
            return Object.fromEntries(entries.map(([k, v]) => [k, mapper(v, k, o)]));
        }
        object.map = map;
    })(object = PoopJs.object || (PoopJs.object = {}));
})(PoopJs || (PoopJs = {}));
var PoopJs;
(function (PoopJs) {
    let promise;
    (function (promise) {
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
        promise.empty = empty;
        async function frame(n = 1) {
            while (--n > 0) {
                await new Promise(requestAnimationFrame);
            }
            return new Promise(requestAnimationFrame);
        }
        promise.frame = frame;
    })(promise = PoopJs.promise || (PoopJs.promise = {}));
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
    let Fetch;
    (function (Fetch) {
        async function cached(url) {
            let cache = await caches.open('fetch');
            let response = await cache.match(url);
            if (response) {
                return response;
            }
            response = await fetch(url, { credentials: 'include' });
            cache.put(url, response.clone());
            return response;
        }
        Fetch.cached = cached;
        async function cachedDoc(url) {
            let response = await cached(url);
            let text = await response.text();
            let parser = new DOMParser();
            return parser.parseFromString(text, 'text/html');
        }
        Fetch.cachedDoc = cachedDoc;
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
        Fetch.doc = doc;
    })(Fetch = PoopJs.Fetch || (PoopJs.Fetch = {}));
})(PoopJs || (PoopJs = {}));
var PoopJs;
(function (PoopJs) {
    class paginate {
        static init() {
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
                this.paginationrequest(event);
            });
            document.documentElement.addEventListener('keydown', (event) => {
                if (event.code != 'AltRight')
                    return;
                event.preventDefault();
                let target = event.target;
                target.emit('paginationrequest', event);
                this.paginationrequest(event);
            });
            document.documentElement.addEventListener('paginationend', (event) => {
                paginate.wip = false;
                if (paginate.queued) {
                    paginate.queued--;
                    paginate.run();
                }
            });
        }
        static paginationrequest(event) {
            getSelection().removeAllRanges();
            if (event.shiftKey || event.detail?.shiftKey
                || event.buttons == 1) {
                paginate.queued += 9;
            }
            if (paginate.wip) {
                paginate.queued++;
                return;
            }
            paginate.run();
        }
        static run() {
            paginate.wip = true;
            document.documentElement.emit('paginationstart');
        }
        static onrun(condition, fn = condition) {
            paginate.init();
            if (!condition)
                return;
            console.log('paginate registered:', fn);
            document.addEventListener('paginationstart', fn);
        }
        static onchange(condition, fn = condition) {
            paginate.init();
            if (!condition)
                return;
            document.addEventListener('paginationchange', fn);
        }
        static end() {
            document.documentElement.emit('paginationend');
        }
        static onend(condition, fn = condition) {
            if (!condition)
                return;
            document.addEventListener('paginationend', fn);
        }
        static toHref(link) {
            if (typeof link == 'string') {
                if (link.startsWith('http')) {
                    return link;
                }
                link = q(link);
            }
            return link.href;
        }
        static toAnchor(link) {
            if (typeof link == 'string') {
                if (link.startsWith('http')) {
                    return elm(`a[href=${link}]`);
                }
                return q(link);
            }
            return link;
        }
        static async aDoc(link) {
            let a = this.toAnchor(link);
            if (!a)
                throw new Error('not a link');
            a.classList.add('paginate-spin');
            let doc = await fetch.doc(a.href);
            this.doc = doc;
            return doc;
        }
        static async aCachedDoc(link) {
            let a = this.toAnchor(link);
            if (!a)
                throw new Error('not a link');
            a.classList.add('paginate-spin');
            let doc = await fetch.cached.doc(a.href);
            a.classList.remove('paginate-spin');
            this.doc = doc;
            return doc;
        }
        static appendChildren(doc, source, target = source) {
            if (typeof doc == 'string')
                return this.appendChildren(this.doc, doc, source);
            let children = [...doc.q(source).children];
            q(target).append(...children);
            document.documentElement.emit('paginationchange', children);
            return this;
        }
        static afterLast(doc, source, target = source) {
            if (typeof doc == 'string')
                return this.afterLast(this.doc, doc, source);
            let children = doc.qq(source);
            let last = qq(target).pop();
            last.after(...children);
            document.documentElement.emit('paginationchange');
            return this;
        }
        static replace(doc, source, target = source) {
            if (typeof doc == 'string')
                return this.replace(this.doc, doc, source);
            let child = doc.q(source);
            q(target).replaceWith(child);
            document.documentElement.emit('paginationchange', [child]);
            return this;
        }
        static prefetch(enabled, link) {
            if (!link) {
                link = enabled;
            }
            else {
                if (!enabled)
                    return;
            }
            if (typeof link == 'string') {
                if (!link.startsWith('http')) {
                    link = q(link);
                }
            }
            if (typeof link != 'string') {
                link = link.href;
            }
            elm(`link[rel="prefetch"][href="${link}"]`).appendTo('head');
            return this;
        }
        static imageScrolling(selector) {
            if (this.imageScrollingActive)
                return;
            if (selector)
                this.imgSelector = selector;
            this.imageScrollingActive = true;
            document.addEventListener('mousewheel', (e) => {
                this.scrollWholeImage(-Math.sign(e.wheelDeltaY));
                e.preventDefault();
            }, {
                passive: false
            });
        }
        static imgToWindowCenter(img) {
            let rect = img.getBoundingClientRect();
            return rect.y + rect.height / 2 - innerHeight / 2;
        }
        static getImages() {
            return qq(this.imgSelector);
        }
        static getCentralImg() {
            return this.getImages().vsort(img => Math.abs(this.imgToWindowCenter(img)))[0];
        }
        static scrollWholeImage(dir = 1) {
            let img = this.getCentralImg();
            let images = this.getImages();
            let index = images.indexOf(img);
            let nextImg = images[index + (dir == 1 ? 1 : -1)];
            let delta = this.imgToWindowCenter(nextImg);
            scrollBy(0, delta);
        }
    }
    paginate.active = false;
    paginate.queued = 0;
    paginate.wip = false;
    paginate.imageScrollingActive = false;
    paginate.imgSelector = 'img';
    PoopJs.paginate = paginate;
    ;
})(PoopJs || (PoopJs = {}));
/// <reference path="./Array.ts" />
/// <reference path="./DateNowHack.ts" />
/// <reference path="./Element.ts" />
/// <reference path="./elm.ts" />
/// <reference path="./fetch.ts" />
/// <reference path="./Object.ts" />
/// <reference path="./paginate.ts" />
/// <reference path="./Promise.ts" />
var PoopJs;
(function (PoopJs) {
    function __init__(window) {
        if (!window)
            window = globalThis.window;
        window.elm = PoopJs.Elm.elm;
        window.q = PoopJs.winq.q;
        window.qq = PoopJs.winq.qq;
        PoopJs.object.defineValue(Element.prototype, 'q', PoopJs.element.q);
        PoopJs.object.defineValue(Element.prototype, 'qq', PoopJs.element.qq);
        PoopJs.object.defineValue(Element.prototype, 'appendTo', PoopJs.element.appendTo);
        PoopJs.object.defineValue(Element.prototype, 'emit', PoopJs.element.emit);
        PoopJs.object.defineValue(Document.prototype, 'q', PoopJs.docq.q);
        PoopJs.object.defineValue(Document.prototype, 'qq', PoopJs.docq.qq);
        PoopJs.object.defineValue(Promise, 'empty', PoopJs.promise.empty);
        PoopJs.object.defineValue(Promise, 'frame', PoopJs.promise.frame);
        PoopJs.object.defineValue(Promise, 'raf', PoopJs.promise.frame);
        window.fetch.cached = PoopJs.Fetch.cached;
        window.fetch.doc = PoopJs.Fetch.doc;
        window.fetch.cached.doc = PoopJs.Fetch.cachedDoc;
        window.fetch.doc.cached = PoopJs.Fetch.cachedDoc;
        window.fetch.cachedDoc = PoopJs.Fetch.cachedDoc;
        PoopJs.object.defineValue(Object, 'defineValue', PoopJs.object.defineValue);
        PoopJs.object.defineValue(Object, 'defineGetter', PoopJs.object.defineGetter);
        Object.defineValue(Object, 'map', PoopJs.object.map);
        PoopJs.object.defineValue(Array, 'map', PoopJs.array.map);
        PoopJs.object.defineValue(Array.prototype, 'pmap', PoopJs.array.pmap);
        PoopJs.object.defineValue(Array.prototype, 'vsort', PoopJs.array.vsort);
        window.paginate = PoopJs.paginate;
        window.DateNowHack = PoopJs.DateNowHack.DateNowHack;
        PoopJs.object.defineValue(window, '__init__', 'already inited');
        return 'inited';
    }
    PoopJs.__init__ = __init__;
    PoopJs.object.defineGetter(window, '__init__', () => __init__(window));
    if (window.localStorage.__init__) {
        window.__init__;
    }
})(PoopJs || (PoopJs = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQuanMiLCJzb3VyY2VSb290IjoiaHR0cDovLzEyNy4wLjAuMTo4ODg3L3Byb2plY3RzL3Bvb3Bqcy9zcmMvIiwic291cmNlcyI6WyJBcnJheS50cyIsIkRhdGVOb3dIYWNrLnRzIiwiRWxlbWVudC50cyIsIkVudHJ5RmlsdGVyLnRzIiwiT2JqZWN0LnRzIiwiUHJvbWlzZS50cyIsImVsbS50cyIsImZldGNoLnRzIiwicGFnaW5hdGUudHMiLCJpbml0LnRzIiwidHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBVSxNQUFNLENBb0RmO0FBcERELFdBQVUsTUFBTTtJQUVmLElBQWlCLEtBQUssQ0FnRHJCO0lBaERELFdBQWlCLEtBQUs7UUFHZCxLQUFLLFVBQVUsSUFBSSxDQUFrQixNQUFtRCxFQUFFLE9BQU8sR0FBRyxDQUFDO1lBQzNHLElBQUksQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7Z0JBQUUsTUFBTSxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ3RDLElBQUksS0FBSyxHQUF1QixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBSSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDckMsSUFBSSxXQUFXLEdBQUcsT0FBQSxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDbEMsSUFBSSxXQUFXLEdBQUcsT0FBTyxDQUFDO1lBQzFCLEtBQUssVUFBVSxPQUFPLENBQUMsSUFBc0I7Z0JBQzVDLElBQUk7b0JBQ0gsT0FBTyxNQUFNLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO2lCQUM3QjtnQkFBQyxPQUFPLEdBQUcsRUFBRTtvQkFDYixPQUFPLEdBQUcsQ0FBQztpQkFDWDtZQUNGLENBQUM7WUFDRCxLQUFLLFVB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LE1BQWdCLENBQUM7UUFFbEQsTUFBTSxDQUFDLEdBQUcsR0FBRyxPQUFBLEdBQUcsQ0FBQyxHQUFHLENBQUM7UUFDckIsTUFBTSxDQUFDLENBQUMsR0FBRyxPQUFBLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDbEIsTUFBTSxDQUFDLEVBQUUsR0FBRyxPQUFBLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDcEIsT0FBQSxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLE9BQUEsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RELE9BQUEsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxPQUFBLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN4RCxPQUFBLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsT0FBQSxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDcEUsT0FBQSxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLE9BQUEsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVELE9BQUEsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxPQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwRCxPQUFBLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsT0FBQSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFdEQsT0FBQSxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBQSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEQsT0FBQSxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBQSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEQsT0FBQSxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBQSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFbEQsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsT0FBQSxLQUFLLENBQUMsTUFBYSxDQUFDO1FBQzFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLE9BQUEsS0FBSyxDQUFDLEdBQVUsQ0FBQztRQUNwQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsT0FBQSxLQUFLLENBQUMsU0FBUyxDQUFDO1FBQzFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxPQUFBLEtBQUssQ0FBQyxTQUFTLENBQUM7UUFDMUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsT0FBQSxLQUFLLENBQUMsU0FBUyxDQUFDO1FBRXpDLE9BQUEsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsYUFBYSxFQUFFLE9BQUEsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzlELE9BQUEsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsY0FBYyxFQUFFLE9BQUEsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ2hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFBLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUU5QyxPQUFBLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxPQUFBLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM1QyxPQUFBLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsT0FBQSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEQsT0FBQSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLE9BQUEsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRTFELE1BQU0sQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUNsQyxNQUFNLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDO1FBRXBELE9BQUEsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDekQsT0FBTyxRQUFRLENBQUM7SUFDakIsQ0FBQztJQXBDZSxlQUFRLFdBb0N2QixDQUFBO0lBRUQsT0FBQSxNQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFFaEUsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRTtRQUNqQyxNQUFNLENBQUMsUUFBUSxDQUFDO0tBQ2hCO0FBRUYsQ0FBQyxFQTlDUyxNQUFNLEtBQU4sTUFBTSxRQThDZiIsInNvdXJjZXNDb250ZW50IjpbIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIGFycmF5IHtcclxuXHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBtYXA8VCwgVj4odGhpczogVFtdLCBtYXBwZXI6IChlOiBULCBpOiBudW1iZXIsIGE6IFRbXSkgPT4gUHJvbWlzZTxWPiB8IFYsIHRocmVhZHMgPSA1KTogUHJvbWlzZTxWW10+IHtcclxuXHRcdFx0aWYgKCEodGhyZWFkcyA+IDApKSB0aHJvdyBuZXcgRXJyb3IoKTtcclxuXHRcdFx0bGV0IHRhc2tzOiBbVCwgbnVtYmVyLCBUW11dW10gPSB0aGlzLm1hcCgoZSwgaSwgYSkgPT4gW2UsIGksIGFdKTtcclxuXHRcdFx0bGV0IHJlc3VsdHMgPSBBcnJheTxWPih0YXNrcy5sZW5ndGgpO1xyXG5cdFx0XHRsZXQgYW55UmVzb2x2ZWQgPSBwcm9taXNlLmVtcHR5KCk7XHJcblx0XHRcdGxldCBmcmVlVGhyZWFkcyA9IHRocmVhZHM7XHJcblx0XHRcdGFzeW5jIGZ1bmN0aW9uIHJ1blRhc2sodGFzazogW1QsIG51bWJlciwgVFtdXSk6IFByb21pc2U8Vj4ge1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gYXdhaXQgbWFwcGVyKC4uLnRhc2spO1xyXG5cdFx0XHRcdH0gY2F0Y2ggKGVycikge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGVycjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0YXN5bmMgZnVuY3Rpb24gcnVuKHRhc2spIHtcclxuXHRcdFx0XHRmcmVlVGhyZWFkcy0tO1xyXG5cdFx0XHRcdHJlc3VsdHNbdGFza1sxXV0gPSBhd2FpdCBydW5UYXNrKHRhc2spO1xyXG5cdFx0XHRcdGZyZWVUaHJlYWRzKys7XHJcblx0XHRcdFx0bGV0IG9sZEFueVJlc29sdmVkID0gYW55UmVzb2x2ZWQ7XHJcblx0XHRcdFx0YW55UmVzb2x2ZWQgPSBwcm9taXNlLmVtcHR5KCk7XHJcblx0XHRcdFx0b2xkQW55UmVzb2x2ZWQucih1bmRlZmluZWQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGZvciAobGV0IHRhc2sgb2YgdGFza3MpIHtcclxuXHRcdFx0XHRpZiAoZnJlZVRocmVhZHMgPT0gMCkge1xyXG5cdFx0XHRcdFx0YXdhaXQgYW55UmVzb2x2ZWQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJ1bih0YXNrKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR3aGlsZSAoZnJlZVRocmVhZHMgPCB0aHJlYWRzKSB7XHJcblx0XHRcdFx0YXdhaXQgYW55UmVzb2x2ZWQ7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHJlc3VsdHM7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIG1hcDxUID0gbnVtYmVyPih0aGlzOiBBcnJheUNvbnN0cnVjdG9yLCBsZW5ndGg6IG51bWJlciwgbWFwcGVyOiAobnVtYmVyKSA9PiBUID0gaSA9PiBpKSB7XHJcblx0XHRcdHJldHVybiB0aGlzKGxlbmd0aCkuZmlsbCgwKS5tYXAoKGUsIGksIGEpID0+IG1hcHBlcihpKSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHZzb3J0PFQ+KHRoaXM6IFRbXSwgbWFwcGVyOiAoZTogVCwgaTogbnVtYmVyLCBhOiBUW10pID0+IG51bWJlciwgc29ydGVyOiAoKGE6IG51bWJlciwgYjogbnVtYmVyLCBhZTogVCwgYmU6IFQpID0+IG51bWJlcikgfCAtMSA9IChhLCBiKSA9PiBhIC0gYikge1xyXG5cdFx0XHRsZXQgdGhlU29ydGVyID0gdHlwZW9mIHNvcnRlciA9PSAnZnVuY3Rpb24nID8gc29ydGVyIDogKGEsIGIpID0+IGIgLSBhO1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0XHRcdC5tYXAoKGUsIGksIGEpID0+ICh7IGUsIHY6IG1hcHBlcihlLCBpLCBhKSB9KSlcclxuXHRcdFx0XHQuc29ydCgoYSwgYikgPT4gdGhlU29ydGVyKGEudiwgYi52LCBhLmUsIGIuZSkpXHJcblx0XHRcdFx0Lm1hcChlID0+IGUuZSk7XHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBEYXRlTm93SGFjayB7XHJcblx0XHRcclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gRGF0ZU5vd0hhY2sobiA9IDUpIHtcclxuXHRcdFx0RGF0ZS5fbm93ID8/PSBEYXRlLm5vdztcclxuXHRcdFx0bGV0IF9zdGFydCA9IERhdGUuX25vdygpO1xyXG5cdFx0XHRsZXQgc3RhcnQgPSBEYXRlLm5vdygpO1xyXG5cdFx0XHREYXRlLm5vdyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHJldHVybiAodGhpcy5fbm93KCkgLSBfc3RhcnQpICogbiArIHN0YXJ0O1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHREYXRlLnByb3RvdHlwZS5fZ2V0VGltZSA/Pz0gRGF0ZS5wcm90b3R5cGUuZ2V0VGltZTtcclxuXHRcdFx0bGV0IF9ndF9zdGFydCA9IG5ldyBEYXRlKCkuX2dldFRpbWUoKTtcclxuXHRcdFx0bGV0IGd0X3N0YXJ0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcblx0XHRcdERhdGUucHJvdG90eXBlLmdldFRpbWUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRyZXR1cm4gKHRoaXMuX2dldFRpbWUoKSAtIF9ndF9zdGFydCkgKiBuICsgZ3Rfc3RhcnQ7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNvbnNvbGUubG9nKGBEYXRlTm93SGFjazpgLCBuKTtcclxuXHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHJcblxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblxyXG5cdGV4cG9ydCBuYW1lc3BhY2Ugd2lucSB7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3RvcjogSywgcGFyZW50PzogUGFyZW50Tm9kZSk6IEhUTUxFbGVtZW50VGFnTmFtZU1hcFtLXSB8IG51bGw7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcTxFIGV4dGVuZHMgRWxlbWVudCA9IEVsZW1lbnQ+KHNlbGVjdG9yOiBzdHJpbmcsIHBhcmVudD86IFBhcmVudE5vZGUpOiBFIHwgbnVsbDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBxKHNlbGVjdG9yOiBzdHJpbmcsIHBhcmVudDogUGFyZW50Tm9kZSA9IGRvY3VtZW50KSB7XHJcblx0XHRcdHJldHVybiBwYXJlbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHNlbGVjdG9yOiBLLCBwYXJlbnQ/OiBQYXJlbnROb2RlKTogKEhUTUxFbGVtZW50VGFnTmFtZU1hcFtLXSlbXTtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxFIGV4dGVuZHMgRWxlbWVudCA9IEVsZW1lbnQ+KHNlbGVjdG9yOiBzdHJpbmcsIHBhcmVudD86IFBhcmVudE5vZGUpOiBFW107XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcXEoc2VsZWN0b3I6IHN0cmluZywgcGFyZW50OiBQYXJlbnROb2RlID0gZG9jdW1lbnQpIHtcclxuXHRcdFx0cmV0dXJuIFsuLi5wYXJlbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcildO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBkb2NxIHtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IERvY3VtZW50LCBzZWxlY3RvcjogSyk6IEhUTUxFbGVtZW50VGFnTmFtZU1hcFtLXSB8IG51bGw7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcTxFIGV4dGVuZHMgRWxlbWVudCA9IEVsZW1lbnQ+KHRoaXM6IERvY3VtZW50LCBzZWxlY3Rvcjogc3RyaW5nKTogRSB8IG51bGw7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcSh0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IHN0cmluZykge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5kb2N1bWVudEVsZW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IERvY3VtZW50LCBzZWxlY3RvcjogSyk6IChIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10pW107XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcXE8RSBleHRlbmRzIEVsZW1lbnQgPSBFbGVtZW50Pih0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IHN0cmluZyk6IEVbXTtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBxcSh0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IHN0cmluZykge1xyXG5cdFx0XHRyZXR1cm4gWy4uLnRoaXMuZG9jdW1lbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGV4cG9ydCBuYW1lc3BhY2UgZWxlbWVudCB7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPih0aGlzOiBFbGVtZW50LCBzZWxlY3RvcjogSyk6IEhUTUxFbGVtZW50VGFnTmFtZU1hcFtLXSB8IG51bGw7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcTxFIGV4dGVuZHMgRWxlbWVudCA9IEVsZW1lbnQ+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpOiBFIHwgbnVsbDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBxKHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBLKTogKEhUTUxFbGVtZW50VGFnTmFtZU1hcFtLXSlbXTtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxFIGV4dGVuZHMgRWxlbWVudCA9IEVsZW1lbnQ+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpOiBFW107XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcXEodGhpczogRWxlbWVudCwgc2VsZWN0b3I6IHN0cmluZykge1xyXG5cdFx0XHRyZXR1cm4gWy4uLnRoaXMucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcildO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBlbWl0KHRoaXM6IEVsZW1lbnQsIHR5cGU6IHN0cmluZywgZGV0YWlsPzogYW55KSB7XHJcblx0XHRcdGxldCBldmVudCA9IG5ldyBDdXN0b21FdmVudCh0eXBlLCB7XHJcblx0XHRcdFx0YnViYmxlczogdHJ1ZSxcclxuXHRcdFx0XHRkZXRhaWwsXHJcblx0XHRcdH0pO1xyXG5cdFx0XHR0aGlzLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBhcHBlbmRUbyh0aGlzOiBFbGVtZW50LCBwYXJlbnQ6IEVsZW1lbnQpO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFRvKHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFRvKHRoaXM6IEVsZW1lbnQsIHBhcmVudDogRWxlbWVudCB8IHN0cmluZykge1xyXG5cdFx0XHRpZiAodHlwZW9mIHBhcmVudCA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdHBhcmVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IocGFyZW50KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRwYXJlbnQuYXBwZW5kKHRoaXMpO1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH1cclxuXHR9XHJcblxyXG59XHJcblxyXG5cclxuXHQvLyBPYmplY3QuZGVmaW5lR2V0dGVyKEVsZW1lbnQucHJvdG90eXBlLCBmdW5jdGlvbiBkYXRhKCl7XHJcblx0Ly8gXHRsZXQgZGF0YSA9IEpTT04ucGFyc2UodGhpcy5kYXRhc2V0LmRhdGEgfHwgJ3t9Jyk7XHJcblx0Ly8gXHRyZXR1cm4gbmV3IFByb3h5KGRhdGEsIHtcclxuXHQvLyBcdFx0Z2V0OiAodGFyZ2V0LCBuYW1lKSA9PiB7XHJcblx0Ly8gXHRcdFx0aWYgKG5hbWUgPT0gJ2RhdGEnKSByZXR1cm4gZGF0YTtcclxuXHQvLyBcdFx0XHRyZXR1cm4gZGF0YVtuYW1lXTtcclxuXHQvLyBcdFx0fSxcclxuXHQvLyBcdFx0c2V0OiAodGFyZ2V0LCBuYW1lLCB2YWx1ZSkgPT4ge1xyXG5cdC8vIFx0XHRcdGRhdGFbbmFtZV0gPSB2YWx1ZTtcclxuXHQvLyBcdFx0XHR0aGlzLmRhdGFzZXQuZGF0YSA9IEpTT04uc3RyaW5naWZ5KGRhdGEpO1xyXG5cdC8vIFx0XHR9LFxyXG5cdC8vIFx0fSk7XHJcblx0Ly8gfSk7IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblxyXG5cdGV4cG9ydCBjbGFzcyBFbnRyeUZpbHRlcmVyPERhdGE+IHtcclxuXHRcdGFjdGl2ZSA9IGZhbHNlO1xyXG5cdFx0cGFyc2VyczogKChlbDogSFRNTEVsZW1lbnQsIGRhdGE6IERhdGEpID0+IERhdGEgfCB2b2lkKVtdID0gW107XHJcblx0XHRmaWx0ZXJzOiAoeyBuYW1lOiBzdHJpbmcsIG9uOiBib29sZWFuLCBmaWx0ZXI6IChkYXRhOiBEYXRhKSA9PiBib29sZWFuIH0pW10gPSBbXTtcclxuXHRcdHNvcnRlcnM6ICh7IG5hbWU6IHN0cmluZywgc29ydFZhbHVlOiAoZGF0YTogRGF0YSkgPT4gbnVtYmVyLCBvbj86IGJvb2xlYW4gfSlbXSA9IFtdO1xyXG5cdFx0YWN0aXZlU29ydGVyczogKChkYXRhOiBEYXRhKSA9PiBudW1iZXIpW10gPSBbXTtcclxuXHJcblx0XHRjb250YWluZXI6IEhUTUxFbGVtZW50O1xyXG5cclxuXHRcdHNlbGVjdG9yID0gJyc7XHJcblx0XHRlbnRyeUdldHRlcjogKCkgPT4gSFRNTEVsZW1lbnRbXSA9ICgpID0+IHFxKHRoaXMuc2VsZWN0b3IpO1xyXG5cclxuXHRcdGNvbnN0cnVjdG9yKHNlbGVjdG9yOiBzdHJpbmcpO1xyXG5cdFx0Y29uc3RydWN0b3IoZW50cnlHZXR0ZXI6ICgpID0+IEhUTUxFbGVtZW50W10pO1xyXG5cdFx0Y29uc3RydWN0b3Ioc2VsOiBzdHJpbmcgfCAoKCkgPT4gSFRNTEVsZW1lbnRbXSkpIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBzZWwgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHR0aGlzLnNlbGVjdG9yID0gc2VsO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMuZW50cnlHZXR0ZXIgPSBzZWw7XHJcblx0XHRcdH1cclxuXHRcdFx0dGhpcy5jb250YWluZXIgPSBlbG0oJy5lZi1jb250YWluZXInKTtcclxuXHRcdH1cclxuXHJcblx0XHRzaG93KG9uID0gdHJ1ZSkge1xyXG5cdFx0XHRpZiAoIW9uKSByZXR1cm4gdGhpcztcclxuXHRcdFx0dGhpcy5jb250YWluZXIuYXBwZW5kVG8oJ2JvZHknKTtcclxuXHRcdFx0cGFnaW5hdGUub25jaGFuZ2UoKCkgPT4gdGhpcy5vblBhZ2luYXRlQ2hhbmdlKCkpO1xyXG5cdFx0XHR0aGlzLmFjdGl2ZSA9IHRydWU7XHJcblx0XHRcdHRoaXMudXBkYXRlKCk7XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fVxyXG5cclxuXHRcdGdldEVudHJpZXModXBkYXRlID0gZmFsc2UpOiBIVE1MRWxlbWVudFtdIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuZW50cnlHZXR0ZXIoKTtcclxuXHRcdH1cclxuXHRcdHBhcnNlKCkge1xyXG5cdFx0XHRmb3IgKGxldCBlbCBvZiB0aGlzLmdldEVudHJpZXMoKSkge1xyXG5cdFx0XHRcdGxldCBkYXRhOiBEYXRhID0gSlNPTi5wYXJzZShlbC5kYXRhc2V0LmVmIHx8ICd7fScpO1xyXG5cdFx0XHRcdGZvciAobGV0IHBhcnNlciBvZiB0aGlzLnBhcnNlcnMpIHtcclxuXHRcdFx0XHRcdGRhdGEgPSBwYXJzZXIoZWwsIGRhdGEpIHx8IGRhdGE7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsLmRhdGFzZXQuZWYgPSBKU09OLnN0cmluZ2lmeShkYXRhKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGdldEVudHJpZXNXaXRoRGF0YSgpOiB7IGVsOiBIVE1MRWxlbWVudCwgZGF0YTogRGF0YSB9W10ge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5nZXRFbnRyaWVzKCkubWFwKGVsID0+ICh7IGVsLCBkYXRhOiBKU09OLnBhcnNlKGVsLmRhdGFzZXQuZWYgfHwgJ3t9JykgfSkpO1xyXG5cdFx0fVxyXG5cclxuXHRcdG9uUGFnaW5hdGVDaGFuZ2UoKSB7XHJcblx0XHRcdHRoaXMudXBkYXRlKCk7XHJcblx0XHR9XHJcblxyXG5cdFx0YWRkUGFyc2VyKHBhcnNlcjogKGVsOiBIVE1MRWxlbWVudCwgZGF0YTogRGF0YSkgPT4gdm9pZCB8IERhdGEpIHtcclxuXHRcdFx0dGhpcy5wYXJzZXJzLnB1c2gocGFyc2VyKTtcclxuXHRcdFx0dGhpcy5wYXJzZSgpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGFkZEZpbHRlcihuYW1lOiBzdHJpbmcsIGZpbHRlcjogKGRhdGE6IERhdGEpID0+IGJvb2xlYW4sIG9uPzogYm9vbGVhbikge1xyXG5cdFx0XHRsZXQgZW50cnkgPSB7IG5hbWUsIGZpbHRlciwgb246IGZhbHNlLCBidXR0b246IHVuZGVmaW5lZCBhcyBIVE1MRWxlbWVudCB9O1xyXG5cdFx0XHR0aGlzLmZpbHRlcnMucHVzaChlbnRyeSk7XHJcblx0XHRcdGVudHJ5LmJ1dHRvbiA9IGVsbShcclxuXHRcdFx0XHQnYnV0dG9uLmVmLWZpbHRlcicsXHJcblx0XHRcdFx0bmFtZSxcclxuXHRcdFx0XHQoY2xpY2s6IE1vdXNlRXZlbnQgJiB7IHRhcmdldDogSFRNTEVsZW1lbnQgfSkgPT4ge1xyXG5cdFx0XHRcdFx0ZW50cnkub24gPSAhZW50cnkub247XHJcblx0XHRcdFx0XHRjbGljay50YXJnZXQuY2xhc3NMaXN0LnRvZ2dsZSgnZWYtZmlsdGVyLW9uJywgZW50cnkub24pO1xyXG5cdFx0XHRcdFx0dGhpcy51cGRhdGUoKTtcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHQpLmFwcGVuZFRvKHRoaXMuY29udGFpbmVyKTtcclxuXHRcdFx0aWYgKG9uKSB7XHJcblx0XHRcdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IGVudHJ5LmJ1dHRvbi5jbGljaygpKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGFkZFNvcnRlcihuYW1lOiBzdHJpbmcsIHNvcnRWYWx1ZTogKGRhdGE6IERhdGEpID0+IG51bWJlciwgb24/OiBib29sZWFuKSB7XHJcblx0XHRcdGxldCBlbnRyeSA9IHsgbmFtZSwgc29ydFZhbHVlLCBvbjogISFvbiB9O1xyXG5cdFx0XHR0aGlzLnNvcnRlcnMucHVzaChlbnRyeSk7XHJcblx0XHRcdGVsbShcclxuXHRcdFx0XHQnYnV0dG9uLmVmLXNvcnRlcicsXHJcblx0XHRcdFx0bmFtZSxcclxuXHRcdFx0XHQoY2xpY2s6IE1vdXNlRXZlbnQgJiB7IHRhcmdldDogSFRNTEVsZW1lbnQgfSkgPT4ge1xyXG5cdFx0XHRcdFx0ZW50cnkub24gPSAhZW50cnkub247XHJcblx0XHRcdFx0XHRjbGljay50YXJnZXQuY2xhc3NMaXN0LnRvZ2dsZSgnZWYtc29ydGVyLW9uJywgZW50cnkub24pO1xyXG5cdFx0XHRcdFx0aWYgKGVudHJ5Lm9uKSB0aGlzLmFjdGl2ZVNvcnRlcnMucHVzaChzb3J0VmFsdWUpO1xyXG5cdFx0XHRcdFx0ZWxzZSB0aGlzLmFjdGl2ZVNvcnRlcnMuc3BsaWNlKHRoaXMuYWN0aXZlU29ydGVycy5pbmRleE9mKHNvcnRWYWx1ZSksIDEpO1xyXG5cdFx0XHRcdFx0dGhpcy51cGRhdGUoKTtcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHQpLmFwcGVuZFRvKHRoaXMuY29udGFpbmVyKTtcclxuXHRcdH1cclxuXHJcblx0XHR1cGRhdGUoKSB7XHJcblx0XHRcdGlmICghdGhpcy5hY3RpdmUpIHJldHVybjtcclxuXHRcdFx0dGhpcy5wYXJzZSgpO1xyXG5cdFx0XHRsZXQgZW5zID0gdGhpcy5nZXRFbnRyaWVzV2l0aERhdGEoKTtcclxuXHRcdFx0Zm9yIChsZXQgZW4gb2YgZW5zKSB7XHJcblx0XHRcdFx0bGV0IG9uID0gdHJ1ZTtcclxuXHRcdFx0XHRmb3IgKGxldCBmIG9mIHRoaXMuZmlsdGVycykge1xyXG5cdFx0XHRcdFx0aWYgKGYub24pIG9uID0gb24gJiYgZi5maWx0ZXIoZW4uZGF0YSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVuLmVsLmNsYXNzTGlzdC50b2dnbGUoJ2VmLWhpZGRlbicsICFvbik7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCF0aGlzLmFjdGl2ZVNvcnRlcnMubGVuZ3RoKSByZXR1cm47XHJcblx0XHRcdGxldCBiciA9IGVsbSgnYnInKTtcclxuXHRcdFx0ZW5zWzBdLmVsLmJlZm9yZShicik7XHJcblx0XHRcdGZvciAobGV0IHNvcnRlciBvZiB0aGlzLmFjdGl2ZVNvcnRlcnMpIHtcclxuXHRcdFx0XHRlbnMgPSBlbnMudnNvcnQoKHsgZGF0YSB9KSA9PiBzb3J0ZXIoZGF0YSkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGJyLmFmdGVyKC4uLmVucy5tYXAoZSA9PiBlLmVsKSk7XHJcblx0XHRcdGJyLnJlbW92ZSgpO1xyXG5cdFx0fVxyXG5cclxuXHR9XHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBvYmplY3Qge1xyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBkZWZpbmVWYWx1ZTxUPihvOiBULCBwOiBrZXlvZiBULCB2YWx1ZTogYW55KTogVDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBkZWZpbmVWYWx1ZTxUPihvOiBULCBmbjogRnVuY3Rpb24pOiBUO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGRlZmluZVZhbHVlPFQ+KG86IFQsIHA6IGtleW9mIFQgfCBzdHJpbmcgfCBGdW5jdGlvbiwgdmFsdWU/OiBhbnkpOiBUIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBwID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRbcCwgdmFsdWVdID0gW3AubmFtZSwgcF0gYXMgW3N0cmluZywgRnVuY3Rpb25dO1xyXG5cdFx0XHR9XHJcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBwLCB7XHJcblx0XHRcdFx0dmFsdWUsXHJcblx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdGVudW1lcmFibGU6IGZhbHNlLFxyXG5cdFx0XHRcdHdyaXRhYmxlOiB0cnVlLFxyXG5cdFx0XHR9KTtcclxuXHRcdFx0cmV0dXJuIG87XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUdldHRlcjxUPihvOiBULCBwOiBrZXlvZiBULCBnZXQ6ICgpID0+IFZhbHVlT2Y8VD4pOiBUO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUdldHRlcjxUPihvOiBULCBnZXQ6IEZ1bmN0aW9uKTogVDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBkZWZpbmVHZXR0ZXI8VD4obzogVCwgcDogc3RyaW5nIHwga2V5b2YgVCB8IEZ1bmN0aW9uLCBnZXQ/OiBhbnkpOiBUIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBwID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRbcCwgZ2V0XSA9IFtwLm5hbWUsIHBdIGFzIFtzdHJpbmcsIEZ1bmN0aW9uXTtcclxuXHRcdFx0fVxyXG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobywgcCwge1xyXG5cdFx0XHRcdGdldCxcclxuXHRcdFx0XHRjb25maWd1cmFibGU6IHRydWUsXHJcblx0XHRcdFx0ZW51bWVyYWJsZTogZmFsc2UsXHJcblx0XHRcdH0pO1xyXG5cdFx0XHRyZXR1cm4gbztcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gbWFwPFQsIFY+KG86IFQsIG1hcHBlcjogKHY6IFZhbHVlT2Y8VD4sIGs6IGtleW9mIFQsIG86IFQpID0+IFYpOiBNYXBwZWRPYmplY3Q8VCxWPiB7XHJcblx0XHRcdGxldCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXMobykgYXMgW2tleW9mIFQsIFZhbHVlT2Y8VD5dW107XHJcblx0XHRcdHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoZW50cmllcy5tYXAoKFtrLHZdKSA9PiBbaywgbWFwcGVyKHYsIGssIG8pXSkpIGFzIE1hcHBlZE9iamVjdDxULFY+O1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBwcm9taXNlIHtcclxuXHRcdHR5cGUgVW53cmFwcGVkUHJvbWlzZTxUPiA9IFByb21pc2U8VD4gJiB7XHJcblx0XHRcdHJlc29sdmU6ICh2YWx1ZTogVCB8IFByb21pc2VMaWtlPFQ+KSA9PiB2b2lkO1xyXG5cdFx0XHRyZWplY3Q6IChyZWFzb24/OiBhbnkpID0+IHZvaWQ7XHJcblx0XHRcdHI6ICh2YWx1ZTogVCB8IFByb21pc2VMaWtlPFQ+KSA9PiB2b2lkO1xyXG5cdFx0XHRqOiAocmVhc29uPzogYW55KSA9PiB2b2lkO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogQ3JlYXRlcyB1bndyYXBwZWQgcHJvbWlzZVxyXG5cdFx0ICovXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZW1wdHk8VD4oKSB7XHJcblx0XHRcdGxldCByZXNvbHZlOiAodmFsdWU6IFQpID0+IHZvaWQ7XHJcblx0XHRcdGxldCByZWplY3Q6IChyZWFzb24/OiBhbnkpID0+IHZvaWQ7XHJcblx0XHRcdGxldCBwID0gbmV3IFByb21pc2U8VD4oKHIsIGopID0+IHtcclxuXHRcdFx0XHRyZXNvbHZlID0gcjtcclxuXHRcdFx0XHRyZWplY3QgPSBqO1xyXG5cdFx0XHR9KSBhcyBVbndyYXBwZWRQcm9taXNlPFQ+O1xyXG5cdFx0XHRwLnJlc29sdmUgPSBwLnIgPSByZXNvbHZlO1xyXG5cdFx0XHRwLnJlamVjdCA9IHAuaiA9IHJlamVjdDtcclxuXHRcdFx0cmV0dXJuIHA7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZyYW1lKG4gPSAxKTogUHJvbWlzZTxudW1iZXI+IHtcclxuXHRcdFx0d2hpbGUgKC0tbiA+IDApIHtcclxuXHRcdFx0XHRhd2FpdCBuZXcgUHJvbWlzZShyZXF1ZXN0QW5pbWF0aW9uRnJhbWUpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZShyZXF1ZXN0QW5pbWF0aW9uRnJhbWUpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn1cclxuIiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblxyXG5cdGV4cG9ydCBuYW1lc3BhY2UgRWxtIHtcclxuXHRcdHR5cGUgQ2hpbGQgPSBhbnk7XHJcblx0XHR0eXBlIExpc3RlbmVyID0gKGV2ZW50OiBFdmVudCkgPT4gYW55O1xyXG5cclxuXHRcdGNvbnN0IGVsbVJlZ2V4ID0gbmV3IFJlZ0V4cChbXHJcblx0XHRcdC9eKD88dGFnPltcXHctXSspLyxcclxuXHRcdFx0LyMoPzxpZD5bXFx3LV0rKS8sXHJcblx0XHRcdC9cXC4oPzxjbGFzcz5bXFx3LV0rKS8sXHJcblx0XHRcdC9cXFsoPzxhdHRyMT5bXFx3LV0rKVxcXS8sXHJcblx0XHRcdC9cXFsoPzxhdHRyMj5bXFx3LV0rKT0oPyFbJ1wiXSkoPzx2YWwyPlteXFxdXSopXFxdLyxcclxuXHRcdFx0L1xcWyg/PGF0dHIzPltcXHctXSspPVwiKD88dmFsMz4oPzpbXlwiXXxcXFxcXCIpKilcIlxcXS8sXHJcblx0XHRcdC9cXFsoPzxhdHRyND5bXFx3LV0rKT1cIig/PHZhbDQ+KD86W14nXXxcXFxcJykqKVwiXFxdLyxcclxuXHRcdF0ubWFwKGUgPT4gZS5zb3VyY2UpLmpvaW4oJ3wnKSwgJ2cnKTtcclxuXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBDcmVhdGVzIGFuIGVsZW1lbnQgbWF0Y2hpbmcgcHJvdmlkZWQgc2VsZWN0b3IsIHdpdGggcHJvdmlkZWQgY2hpbGRyZW4gYW5kIGxpc3RlbmVyc1xyXG5cdFx0ICovXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtKHNlbGVjdG9yPzogc3RyaW5nLCAuLi5jaGlsZHJlbjogKENoaWxkIHwgTGlzdGVuZXIpW10pOiBIVE1MRWxlbWVudDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBlbG0oc2VsZWN0b3I6IGBpbnB1dCR7c3RyaW5nfWAsIC4uLmNoaWxkcmVuOiAoQ2hpbGQgfCBMaXN0ZW5lcilbXSk6IEhUTUxJbnB1dEVsZW1lbnQ7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtKHNlbGVjdG9yOiBgaW1nJHtzdHJpbmd9YCwgLi4uY2hpbGRyZW46IChDaGlsZCB8IExpc3RlbmVyKVtdKTogSFRNTEltYWdlRWxlbWVudDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBlbG0oc2VsZWN0b3I6IHN0cmluZyA9ICcnLCAuLi5jaGlsZHJlbjogKENoaWxkIHwgTGlzdGVuZXIpW10pOiBIVE1MRWxlbWVudCB7XHJcblx0XHRcdGlmIChzZWxlY3Rvci5yZXBsYWNlQWxsKGVsbVJlZ2V4LCAnJykgIT0gJycpIHtcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgc2VsZWN0b3I6ICR7c2VsZWN0b3J9YCk7XHJcblx0XHRcdH1cclxuXHRcdFx0bGV0IGVsZW1lbnQ6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0XHRcdGZvciAobGV0IG1hdGNoIG9mIHNlbGVjdG9yLm1hdGNoQWxsKGVsbVJlZ2V4KSkge1xyXG5cdFx0XHRcdGlmIChtYXRjaC5ncm91cHMudGFnKSB7XHJcblx0XHRcdFx0XHRlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChtYXRjaC5ncm91cHMudGFnKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5pZCkge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5pZCA9IG1hdGNoLmdyb3Vwcy5pZDtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5jbGFzcykge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKG1hdGNoLmdyb3Vwcy5jbGFzcyk7XHJcblx0XHRcdFx0fSBlbHNlIGlmIChtYXRjaC5ncm91cHMuYXR0cjEpIHtcclxuXHRcdFx0XHRcdGVsZW1lbnQuc2V0QXR0cmlidXRlKG1hdGNoLmdyb3Vwcy5hdHRyMSwgXCJ0cnVlXCIpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAobWF0Y2guZ3JvdXBzLmF0dHIyKSB7XHJcblx0XHRcdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZShtYXRjaC5ncm91cHMuYXR0cjIsIG1hdGNoLmdyb3Vwcy52YWwyKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5hdHRyMykge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5zZXRBdHRyaWJ1dGUobWF0Y2guZ3JvdXBzLmF0dHIzLCBtYXRjaC5ncm91cHMudmFsMy5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAobWF0Y2guZ3JvdXBzLmF0dHI0KSB7XHJcblx0XHRcdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZShtYXRjaC5ncm91cHMuYXR0cjQsIG1hdGNoLmdyb3Vwcy52YWw0LnJlcGxhY2UoL1xcXFwnL2csICdcXCcnKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGZvciAobGV0IGxpc3RlbmVyIG9mIGNoaWxkcmVuLmZpbHRlcihlID0+IHR5cGVvZiBlID09ICdmdW5jdGlvbicpIGFzIExpc3RlbmVyW10pIHtcclxuXHRcdFx0XHRsZXQgbmFtZSA9IGxpc3RlbmVyLm5hbWU7XHJcblx0XHRcdFx0aWYgKCFuYW1lKSBuYW1lID0gKGxpc3RlbmVyICsgJycpLm1hdGNoKC9cXHcrLylbMF07XHJcblx0XHRcdFx0aWYgKG5hbWUuc3RhcnRzV2l0aCgnb24nKSkgbmFtZSA9IG5hbWUuc2xpY2UoMik7XHJcblx0XHRcdFx0aWYgKGVsZW1lbnRbJ29uJyArIG5hbWVdID09PSBudWxsKSB7XHJcblx0XHRcdFx0XHRlbGVtZW50WydvbicgKyBuYW1lXSA9IGxpc3RlbmVyO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgbGlzdGVuZXIpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRlbGVtZW50LmFwcGVuZCguLi5jaGlsZHJlbi5maWx0ZXIoZSA9PiB0eXBlb2YgZSAhPSAnZnVuY3Rpb24nKSk7XHJcblx0XHRcdHJldHVybiBlbGVtZW50O1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBGZXRjaCB7XHJcblx0XHRleHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FjaGVkKHVybDogc3RyaW5nKTogUHJvbWlzZTxSZXNwb25zZT4ge1xyXG5cdFx0XHRsZXQgY2FjaGUgPSBhd2FpdCBjYWNoZXMub3BlbignZmV0Y2gnKTtcclxuXHRcdFx0bGV0IHJlc3BvbnNlID0gYXdhaXQgY2FjaGUubWF0Y2godXJsKTtcclxuXHRcdFx0aWYgKHJlc3BvbnNlKSB7XHJcblx0XHRcdFx0cmV0dXJuIHJlc3BvbnNlO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7IGNyZWRlbnRpYWxzOiAnaW5jbHVkZScgfSk7XHJcblx0XHRcdGNhY2hlLnB1dCh1cmwsIHJlc3BvbnNlLmNsb25lKCkpO1xyXG5cdFx0XHRyZXR1cm4gcmVzcG9uc2U7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhY2hlZERvYyh1cmw6IHN0cmluZyk6IFByb21pc2U8RG9jdW1lbnQ+IHtcclxuXHRcdFx0bGV0IHJlc3BvbnNlID0gYXdhaXQgY2FjaGVkKHVybCk7XHJcblx0XHRcdGxldCB0ZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xyXG5cdFx0XHRsZXQgcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xyXG5cdFx0XHRyZXR1cm4gcGFyc2VyLnBhcnNlRnJvbVN0cmluZyh0ZXh0LCAndGV4dC9odG1sJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRvYyh1cmw6IHN0cmluZyk6IFByb21pc2U8RG9jdW1lbnQ+IHtcclxuXHRcdFx0bGV0IHAgPSBQcm9taXNlLmVtcHR5KCk7XHJcblx0XHRcdGxldCBvUmVxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcblx0XHRcdG9SZXEub25sb2FkID0gcC5yO1xyXG5cdFx0XHRvUmVxLnJlc3BvbnNlVHlwZSA9ICdkb2N1bWVudCc7XHJcblx0XHRcdG9SZXEub3BlbihcImdldFwiLCB1cmwsIHRydWUpO1xyXG5cdFx0XHRvUmVxLnNlbmQoKTtcclxuXHRcdFx0YXdhaXQgcDtcclxuXHRcdFx0cmV0dXJuIG9SZXEucmVzcG9uc2VYTUw7XHJcblx0XHR9XHJcblx0fVxyXG5cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHR0eXBlIExpbmsgPSBFbGVtZW50IHwgc3RyaW5nIHwgYGh0dHAke3N0cmluZ31gO1xyXG5cclxuXHRleHBvcnQgY2xhc3MgcGFnaW5hdGUge1xyXG5cdFx0c3RhdGljIGFjdGl2ZSA9IGZhbHNlO1xyXG5cdFx0c3RhdGljIHF1ZXVlZCA9IDA7XHJcblx0XHRzdGF0aWMgd2lwID0gZmFsc2U7XHJcblx0XHRzdGF0aWMgZG9jOiBEb2N1bWVudDtcclxuXHRcdHN0YXRpYyBpbml0KCkge1xyXG5cdFx0XHRpZiAocGFnaW5hdGUuYWN0aXZlKVxyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0cGFnaW5hdGUuYWN0aXZlID0gdHJ1ZTtcclxuXHJcblx0XHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZXZlbnQpID0+IHtcclxuXHRcdFx0XHRpZiAoZXZlbnQuYnV0dG9uICE9IDEpXHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0bGV0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBFbGVtZW50O1xyXG5cdFx0XHRcdGlmICh0YXJnZXQuY2xvc2VzdCgnYScpKVxyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdHRhcmdldC5lbWl0KCdwYWdpbmF0aW9ucmVxdWVzdCcsIGV2ZW50KTtcclxuXHRcdFx0XHR0aGlzLnBhZ2luYXRpb25yZXF1ZXN0KGV2ZW50KTtcclxuXHRcdFx0fSk7XHJcblx0XHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGV2ZW50KSA9PiB7XHJcblx0XHRcdFx0aWYgKGV2ZW50LmNvZGUgIT0gJ0FsdFJpZ2h0JylcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdGxldCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgRWxlbWVudDtcclxuXHRcdFx0XHR0YXJnZXQuZW1pdCgncGFnaW5hdGlvbnJlcXVlc3QnLCBldmVudCk7XHJcblx0XHRcdFx0dGhpcy5wYWdpbmF0aW9ucmVxdWVzdChldmVudCk7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncGFnaW5hdGlvbmVuZCcsIChldmVudCkgPT4ge1xyXG5cdFx0XHRcdHBhZ2luYXRlLndpcCA9IGZhbHNlO1xyXG5cdFx0XHRcdGlmIChwYWdpbmF0ZS5xdWV1ZWQpIHtcclxuXHRcdFx0XHRcdHBhZ2luYXRlLnF1ZXVlZC0tO1xyXG5cdFx0XHRcdFx0cGFnaW5hdGUucnVuKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHRcdHN0YXRpYyBwYWdpbmF0aW9ucmVxdWVzdChldmVudCkge1xyXG5cdFx0XHRnZXRTZWxlY3Rpb24oKS5yZW1vdmVBbGxSYW5nZXMoKTtcclxuXHRcdFx0aWYgKGV2ZW50LnNoaWZ0S2V5IHx8IGV2ZW50LmRldGFpbD8uc2hpZnRLZXlcclxuXHRcdFx0XHR8fCBldmVudC5idXR0b25zID09IDEpIHtcclxuXHRcdFx0XHRwYWdpbmF0ZS5xdWV1ZWQgKz0gOTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAocGFnaW5hdGUud2lwKSB7XHJcblx0XHRcdFx0cGFnaW5hdGUucXVldWVkKys7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdHBhZ2luYXRlLnJ1bigpO1xyXG5cdFx0fVxyXG5cdFx0c3RhdGljIHJ1bigpIHtcclxuXHRcdFx0cGFnaW5hdGUud2lwID0gdHJ1ZTtcclxuXHRcdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmVtaXQoJ3BhZ2luYXRpb25zdGFydCcpO1xyXG5cdFx0fVxyXG5cdFx0c3RhdGljIG9ucnVuKGNvbmRpdGlvbiwgZm4gPSBjb25kaXRpb24pIHtcclxuXHRcdFx0cGFnaW5hdGUuaW5pdCgpO1xyXG5cdFx0XHRpZiAoIWNvbmRpdGlvbikgcmV0dXJuO1xyXG5cdFx0XHRjb25zb2xlLmxvZygncGFnaW5hdGUgcmVnaXN0ZXJlZDonLCBmbik7XHJcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BhZ2luYXRpb25zdGFydCcsIGZuKTtcclxuXHRcdH1cclxuXHRcdHN0YXRpYyBvbmNoYW5nZShjb25kaXRpb24sIGZuID0gY29uZGl0aW9uKSB7XHJcblx0XHRcdHBhZ2luYXRlLmluaXQoKTtcclxuXHRcdFx0aWYgKCFjb25kaXRpb24pIHJldHVybjtcclxuXHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncGFnaW5hdGlvbmNoYW5nZScsIGZuKTtcclxuXHRcdH1cclxuXHRcdHN0YXRpYyBlbmQoKSB7XHJcblx0XHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5lbWl0KCdwYWdpbmF0aW9uZW5kJyk7XHJcblx0XHR9XHJcblx0XHRzdGF0aWMgb25lbmQoY29uZGl0aW9uLCBmbiA9IGNvbmRpdGlvbikge1xyXG5cdFx0XHRpZiAoIWNvbmRpdGlvbikgcmV0dXJuO1xyXG5cdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdwYWdpbmF0aW9uZW5kJywgZm4pO1xyXG5cdFx0fVxyXG5cdFx0c3RhdGljIHRvSHJlZihsaW5rOiBMaW5rKSB7XHJcblx0XHRcdGlmICh0eXBlb2YgbGluayA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdGlmIChsaW5rLnN0YXJ0c1dpdGgoJ2h0dHAnKSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGxpbms7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGxpbmsgPSBxKGxpbmspO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiAobGluayBhcyBIVE1MQW5jaG9yRWxlbWVudCkuaHJlZjtcclxuXHRcdH1cclxuXHRcdHN0YXRpYyB0b0FuY2hvcihsaW5rOiBMaW5rKTogSFRNTEFuY2hvckVsZW1lbnQge1xyXG5cdFx0XHRpZiAodHlwZW9mIGxpbmsgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRpZiAobGluay5zdGFydHNXaXRoKCdodHRwJykpIHtcclxuXHRcdFx0XHRcdHJldHVybiBlbG0oYGFbaHJlZj0ke2xpbmt9XWApIGFzIEhUTUxBbmNob3JFbGVtZW50O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gcShsaW5rKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gbGluayBhcyBIVE1MQW5jaG9yRWxlbWVudDtcclxuXHRcdH1cclxuXHRcdHN0YXRpYyBhc3luYyBhRG9jKGxpbms6IExpbmspIHtcclxuXHRcdFx0bGV0IGEgPSB0aGlzLnRvQW5jaG9yKGxpbmspO1xyXG5cdFx0XHRpZiAoIWEpIHRocm93IG5ldyBFcnJvcignbm90IGEgbGluaycpO1xyXG5cdFx0XHRhLmNsYXNzTGlzdC5hZGQoJ3BhZ2luYXRlLXNwaW4nKTtcclxuXHRcdFx0bGV0IGRvYyA9IGF3YWl0IGZldGNoLmRvYyhhLmhyZWYpO1xyXG5cdFx0XHR0aGlzLmRvYyA9IGRvYztcclxuXHRcdFx0cmV0dXJuIGRvYztcclxuXHRcdH1cclxuXHRcdHN0YXRpYyBhc3luYyBhQ2FjaGVkRG9jKGxpbms6IExpbmspIHtcclxuXHRcdFx0bGV0IGEgPSB0aGlzLnRvQW5jaG9yKGxpbmspO1xyXG5cdFx0XHRpZiAoIWEpIHRocm93IG5ldyBFcnJvcignbm90IGEgbGluaycpO1xyXG5cdFx0XHRhLmNsYXNzTGlzdC5hZGQoJ3BhZ2luYXRlLXNwaW4nKTtcclxuXHRcdFx0bGV0IGRvYyA9IGF3YWl0IGZldGNoLmNhY2hlZC5kb2MoYS5ocmVmKTtcclxuXHRcdFx0YS5jbGFzc0xpc3QucmVtb3ZlKCdwYWdpbmF0ZS1zcGluJyk7XHJcblx0XHRcdHRoaXMuZG9jID0gZG9jO1xyXG5cdFx0XHRyZXR1cm4gZG9jO1xyXG5cdFx0fVxyXG5cdFx0c3RhdGljIGFwcGVuZENoaWxkcmVuKGRvYywgc291cmNlLCB0YXJnZXQgPSBzb3VyY2UpIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBkb2MgPT0gJ3N0cmluZycpXHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuYXBwZW5kQ2hpbGRyZW4odGhpcy5kb2MsIGRvYywgc291cmNlKTtcclxuXHRcdFx0bGV0IGNoaWxkcmVuID0gWy4uLmRvYy5xKHNvdXJjZSkuY2hpbGRyZW5dO1xyXG5cdFx0XHRxKHRhcmdldCkuYXBwZW5kKC4uLmNoaWxkcmVuKTtcclxuXHRcdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmVtaXQoJ3BhZ2luYXRpb25jaGFuZ2UnLCBjaGlsZHJlbik7XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fVxyXG5cdFx0c3RhdGljIGFmdGVyTGFzdChkb2MsIHNvdXJjZSwgdGFyZ2V0ID0gc291cmNlKSB7XHJcblx0XHRcdGlmICh0eXBlb2YgZG9jID09ICdzdHJpbmcnKVxyXG5cdFx0XHRcdHJldHVybiB0aGlzLmFmdGVyTGFzdCh0aGlzLmRvYywgZG9jLCBzb3VyY2UpO1xyXG5cdFx0XHRsZXQgY2hpbGRyZW4gPSBkb2MucXEoc291cmNlKTtcclxuXHRcdFx0bGV0IGxhc3QgPSBxcSh0YXJnZXQpLnBvcCgpO1xyXG5cdFx0XHRsYXN0LmFmdGVyKC4uLmNoaWxkcmVuKTtcclxuXHRcdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmVtaXQoJ3BhZ2luYXRpb25jaGFuZ2UnKTtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9XHJcblx0XHRzdGF0aWMgcmVwbGFjZShkb2M6IERvY3VtZW50LCBzb3VyY2U6IHN0cmluZywgdGFyZ2V0Pzogc3RyaW5nKTogdHlwZW9mIHBhZ2luYXRlO1xyXG5cdFx0c3RhdGljIHJlcGxhY2Uoc291cmNlOiBzdHJpbmcsIHRhcmdldD86IHN0cmluZyk6IHR5cGVvZiBwYWdpbmF0ZTtcclxuXHRcdHN0YXRpYyByZXBsYWNlKGRvYzogRG9jdW1lbnQgfCBzdHJpbmcsIHNvdXJjZTogc3RyaW5nLCB0YXJnZXQgPSBzb3VyY2UpOiB0eXBlb2YgcGFnaW5hdGUge1xyXG5cdFx0XHRpZiAodHlwZW9mIGRvYyA9PSAnc3RyaW5nJylcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5yZXBsYWNlKHRoaXMuZG9jLCBkb2MsIHNvdXJjZSk7XHJcblx0XHRcdGxldCBjaGlsZCA9IGRvYy5xKHNvdXJjZSlcclxuXHRcdFx0cSh0YXJnZXQpLnJlcGxhY2VXaXRoKGNoaWxkKTtcclxuXHRcdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmVtaXQoJ3BhZ2luYXRpb25jaGFuZ2UnLCBbY2hpbGRdKTtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9XHJcblxyXG5cdFx0c3RhdGljIHByZWZldGNoKGVuYWJsZWQ6IGFueSwgbGluazogc3RyaW5nIHwgRWxlbWVudCk6IHR5cGVvZiBwYWdpbmF0ZTtcclxuXHRcdHN0YXRpYyBwcmVmZXRjaChsaW5rOiBzdHJpbmcgfCBFbGVtZW50KTogdHlwZW9mIHBhZ2luYXRlO1xyXG5cdFx0c3RhdGljIHByZWZldGNoKGVuYWJsZWQ6IGFueSwgbGluaz86IHN0cmluZyB8IEVsZW1lbnQpIHtcclxuXHRcdFx0aWYgKCFsaW5rKSB7XHJcblx0XHRcdFx0bGluayA9IGVuYWJsZWQ7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0aWYgKCFlbmFibGVkKSByZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHR5cGVvZiBsaW5rID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0aWYgKCFsaW5rLnN0YXJ0c1dpdGgoJ2h0dHAnKSkge1xyXG5cdFx0XHRcdFx0bGluayA9IHEobGluayk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGlmICh0eXBlb2YgbGluayAhPSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdGxpbmsgPSAobGluayBhcyBIVE1MQW5jaG9yRWxlbWVudCkuaHJlZjtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbG0oYGxpbmtbcmVsPVwicHJlZmV0Y2hcIl1baHJlZj1cIiR7bGlua31cIl1gKS5hcHBlbmRUbygnaGVhZCcpO1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH1cclxuXHJcblx0XHRzdGF0aWMgaW1hZ2VTY3JvbGxpbmdBY3RpdmUgPSBmYWxzZTtcclxuXHRcdHN0YXRpYyBpbWFnZVNjcm9sbGluZyhzZWxlY3Rvcj86IHN0cmluZykge1xyXG5cdFx0XHRpZiAodGhpcy5pbWFnZVNjcm9sbGluZ0FjdGl2ZSkgcmV0dXJuO1xyXG5cdFx0XHRpZiAoc2VsZWN0b3IpIHRoaXMuaW1nU2VsZWN0b3IgPSBzZWxlY3RvcjtcclxuXHRcdFx0dGhpcy5pbWFnZVNjcm9sbGluZ0FjdGl2ZSA9IHRydWU7XHJcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXHJcblx0XHRcdFx0J21vdXNld2hlZWwnLFxyXG5cdFx0XHRcdChlOiBhbnkpID0+IHtcclxuXHRcdFx0XHRcdHRoaXMuc2Nyb2xsV2hvbGVJbWFnZSgtTWF0aC5zaWduKGUud2hlZWxEZWx0YVkpKTtcclxuXHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHR9LCB7XHJcblx0XHRcdFx0cGFzc2l2ZTogZmFsc2VcclxuXHRcdFx0fVxyXG5cdFx0XHQpO1xyXG5cclxuXHRcdH1cclxuXHRcdHN0YXRpYyBpbWdTZWxlY3RvciA9ICdpbWcnO1xyXG5cdFx0c3RhdGljIGltZ1RvV2luZG93Q2VudGVyKGltZykge1xyXG5cdFx0XHRsZXQgcmVjdCA9IGltZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHRcdFx0cmV0dXJuIHJlY3QueSArIHJlY3QuaGVpZ2h0IC8gMiAtIGlubmVySGVpZ2h0IC8gMjtcclxuXHRcdH1cclxuXHRcdHN0YXRpYyBnZXRJbWFnZXMoKSB7XHJcblx0XHRcdHJldHVybiBxcSh0aGlzLmltZ1NlbGVjdG9yKTtcclxuXHRcdH1cclxuXHRcdHN0YXRpYyBnZXRDZW50cmFsSW1nKCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5nZXRJbWFnZXMoKS52c29ydChpbWcgPT4gTWF0aC5hYnModGhpcy5pbWdUb1dpbmRvd0NlbnRlcihpbWcpKSlbMF07XHJcblx0XHR9XHJcblx0XHRzdGF0aWMgc2Nyb2xsV2hvbGVJbWFnZShkaXIgPSAxKSB7XHJcblx0XHRcdGxldCBpbWcgPSB0aGlzLmdldENlbnRyYWxJbWcoKTtcclxuXHRcdFx0bGV0IGltYWdlcyA9IHRoaXMuZ2V0SW1hZ2VzKCk7XHJcblx0XHRcdGxldCBpbmRleCA9IGltYWdlcy5pbmRleE9mKGltZyk7XHJcblx0XHRcdGxldCBuZXh0SW1nID0gaW1hZ2VzW2luZGV4ICsgKGRpciA9PSAxID8gMSA6IC0xKV07XHJcblx0XHRcdGxldCBkZWx0YSA9IHRoaXMuaW1nVG9XaW5kb3dDZW50ZXIobmV4dEltZyk7XHJcblx0XHRcdHNjcm9sbEJ5KDAsIGRlbHRhKTtcclxuXHRcdH1cclxuXHR9O1xyXG5cclxuXHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9BcnJheS50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL0RhdGVOb3dIYWNrLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vRWxlbWVudC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2VsbS50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2ZldGNoLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vT2JqZWN0LnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vcGFnaW5hdGUudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9Qcm9taXNlLnRzXCIgLz5cclxuXHJcblxyXG5cclxuXHJcbm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gX19pbml0X18od2luZG93OiBXaW5kb3cpOiBcImluaXRlZFwiIHwgXCJhbHJlYWR5IGluaXRlZFwiIHtcclxuXHRcdGlmICghd2luZG93KSB3aW5kb3cgPSBnbG9iYWxUaGlzLndpbmRvdyBhcyBXaW5kb3c7XHJcblxyXG5cdFx0d2luZG93LmVsbSA9IEVsbS5lbG07XHJcblx0XHR3aW5kb3cucSA9IHdpbnEucTtcclxuXHRcdHdpbmRvdy5xcSA9IHdpbnEucXE7XHJcblx0XHRvYmplY3QuZGVmaW5lVmFsdWUoRWxlbWVudC5wcm90b3R5cGUsICdxJywgZWxlbWVudC5xKTtcclxuXHRcdG9iamVjdC5kZWZpbmVWYWx1ZShFbGVtZW50LnByb3RvdHlwZSwgJ3FxJywgZWxlbWVudC5xcSk7XHJcblx0XHRvYmplY3QuZGVmaW5lVmFsdWUoRWxlbWVudC5wcm90b3R5cGUsICdhcHBlbmRUbycsIGVsZW1lbnQuYXBwZW5kVG8pO1xyXG5cdFx0b2JqZWN0LmRlZmluZVZhbHVlKEVsZW1lbnQucHJvdG90eXBlLCAnZW1pdCcsIGVsZW1lbnQuZW1pdCk7XHJcblx0XHRvYmplY3QuZGVmaW5lVmFsdWUoRG9jdW1lbnQucHJvdG90eXBlLCAncScsIGRvY3EucSk7XHJcblx0XHRvYmplY3QuZGVmaW5lVmFsdWUoRG9jdW1lbnQucHJvdG90eXBlLCAncXEnLCBkb2NxLnFxKTtcclxuXHJcblx0XHRvYmplY3QuZGVmaW5lVmFsdWUoUHJvbWlzZSwgJ2VtcHR5JywgcHJvbWlzZS5lbXB0eSk7XHJcblx0XHRvYmplY3QuZGVmaW5lVmFsdWUoUHJvbWlzZSwgJ2ZyYW1lJywgcHJvbWlzZS5mcmFtZSk7XHJcblx0XHRvYmplY3QuZGVmaW5lVmFsdWUoUHJvbWlzZSwgJ3JhZicsIHByb21pc2UuZnJhbWUpO1xyXG5cclxuXHRcdHdpbmRvdy5mZXRjaC5jYWNoZWQgPSBGZXRjaC5jYWNoZWQgYXMgYW55O1xyXG5cdFx0d2luZG93LmZldGNoLmRvYyA9IEZldGNoLmRvYyBhcyBhbnk7XHJcblx0XHR3aW5kb3cuZmV0Y2guY2FjaGVkLmRvYyA9IEZldGNoLmNhY2hlZERvYztcclxuXHRcdHdpbmRvdy5mZXRjaC5kb2MuY2FjaGVkID0gRmV0Y2guY2FjaGVkRG9jO1xyXG5cdFx0d2luZG93LmZldGNoLmNhY2hlZERvYyA9IEZldGNoLmNhY2hlZERvYztcclxuXHJcblx0XHRvYmplY3QuZGVmaW5lVmFsdWUoT2JqZWN0LCAnZGVmaW5lVmFsdWUnLCBvYmplY3QuZGVmaW5lVmFsdWUpO1xyXG5cdFx0b2JqZWN0LmRlZmluZVZhbHVlKE9iamVjdCwgJ2RlZmluZUdldHRlcicsIG9iamVjdC5kZWZpbmVHZXR0ZXIpO1xyXG5cdFx0T2JqZWN0LmRlZmluZVZhbHVlKE9iamVjdCwgJ21hcCcsIG9iamVjdC5tYXApO1xyXG5cclxuXHRcdG9iamVjdC5kZWZpbmVWYWx1ZShBcnJheSwgJ21hcCcsIGFycmF5Lm1hcCk7XHJcblx0XHRvYmplY3QuZGVmaW5lVmFsdWUoQXJyYXkucHJvdG90eXBlLCAncG1hcCcsIGFycmF5LnBtYXApO1xyXG5cdFx0b2JqZWN0LmRlZmluZVZhbHVlKEFycmF5LnByb3RvdHlwZSwgJ3Zzb3J0JywgYXJyYXkudnNvcnQpO1xyXG5cclxuXHRcdHdpbmRvdy5wYWdpbmF0ZSA9IFBvb3BKcy5wYWdpbmF0ZTtcclxuXHRcdHdpbmRvdy5EYXRlTm93SGFjayA9IFBvb3BKcy5EYXRlTm93SGFjay5EYXRlTm93SGFjaztcclxuXHJcblx0XHRvYmplY3QuZGVmaW5lVmFsdWUod2luZG93LCAnX19pbml0X18nLCAnYWxyZWFkeSBpbml0ZWQnKTtcclxuXHRcdHJldHVybiAnaW5pdGVkJztcclxuXHR9XHJcblxyXG5cdG9iamVjdC5kZWZpbmVHZXR0ZXIod2luZG93LCAnX19pbml0X18nLCAoKSA9PiBfX2luaXRfXyh3aW5kb3cpKTtcclxuXHJcblx0aWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2UuX19pbml0X18pIHtcclxuXHRcdHdpbmRvdy5fX2luaXRfXztcclxuXHR9XHJcblxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblx0ZXhwb3J0IHR5cGUgVmFsdWVPZjxUPiA9IFRba2V5b2YgVF07XHJcblx0ZXhwb3J0IHR5cGUgTWFwcGVkT2JqZWN0PFQsIFY+ID0ge1tQIGluIGtleW9mIFRdOiBWfTtcclxufVxyXG5cclxuXHJcbmRlY2xhcmUgY29uc3QgX19pbml0X186IFwiaW5pdGVkXCIgfCBcImFscmVhZHkgaW5pdGVkXCI7XHJcbmRlY2xhcmUgY29uc3QgZWxtOiB0eXBlb2YgUG9vcEpzLkVsbS5lbG07XHJcbmRlY2xhcmUgY29uc3QgcTogdHlwZW9mIFBvb3BKcy53aW5xLnE7XHJcbmRlY2xhcmUgY29uc3QgcXE6IHR5cGVvZiBQb29wSnMud2lucS5xcTtcclxuZGVjbGFyZSBjb25zdCBwYWdpbmF0ZTogdHlwZW9mIFBvb3BKcy5wYWdpbmF0ZTtcclxuZGVjbGFyZSBjb25zdCBEYXRlTm93SGFjazogdHlwZW9mIFBvb3BKcy5EYXRlTm93SGFjay5EYXRlTm93SGFjaztcclxuZGVjbGFyZSBuYW1lc3BhY2UgZmV0Y2gge1xyXG5cdGV4cG9ydCBjb25zdCBjYWNoZWQ6IHR5cGVvZiBQb29wSnMuRmV0Y2guY2FjaGVkICYgeyBkb2M6IHR5cGVvZiBQb29wSnMuRmV0Y2guY2FjaGVkRG9jIH07XHJcblx0ZXhwb3J0IGNvbnN0IGRvYzogdHlwZW9mIFBvb3BKcy5GZXRjaC5kb2MgJiB7IGNhY2hlZDogdHlwZW9mIFBvb3BKcy5GZXRjaC5jYWNoZWREb2MgfTtcclxuXHRleHBvcnQgY29uc3QgY2FjaGVkRG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoLmNhY2hlZERvYztcclxufVxyXG5cclxuaW50ZXJmYWNlIFdpbmRvdyB7XHJcblx0cmVhZG9ubHkgX19pbml0X186IFwiaW5pdGVkXCIgfCBcImFscmVhZHkgaW5pdGVkXCI7XHJcblx0ZWxtOiB0eXBlb2YgUG9vcEpzLkVsbS5lbG07XHJcblx0cTogdHlwZW9mIFBvb3BKcy53aW5xLnE7XHJcblx0cXE6IHR5cGVvZiBQb29wSnMud2lucS5xcTtcclxuXHRwYWdpbmF0ZTogdHlwZW9mIFBvb3BKcy5wYWdpbmF0ZTtcclxuXHREYXRlTm93SGFjazogdHlwZW9mIFBvb3BKcy5EYXRlTm93SGFjay5EYXRlTm93SGFjaztcclxuXHRmZXRjaDoge1xyXG5cdFx0KGlucHV0OiBSZXF1ZXN0SW5mbywgaW5pdD86IFJlcXVlc3RJbml0KTogUHJvbWlzZTxSZXNwb25zZT47XHJcblx0XHRjYWNoZWQ6IHR5cGVvZiBQb29wSnMuRmV0Y2guY2FjaGVkICYgeyBkb2M6IHR5cGVvZiBQb29wSnMuRmV0Y2guY2FjaGVkRG9jIH07XHJcblx0XHRkb2M6IHR5cGVvZiBQb29wSnMuRmV0Y2guZG9jICYgeyBjYWNoZWQ6IHR5cGVvZiBQb29wSnMuRmV0Y2guY2FjaGVkRG9jIH07XHJcblx0XHRjYWNoZWREb2M6IHR5cGVvZiBQb29wSnMuRmV0Y2guY2FjaGVkRG9jO1xyXG5cdH1cclxufVxyXG5cclxuaW50ZXJmYWNlIEVsZW1lbnQge1xyXG5cdHE6IHR5cGVvZiBQb29wSnMuZWxlbWVudC5xO1xyXG5cdHFxOiB0eXBlb2YgUG9vcEpzLmVsZW1lbnQucXE7XHJcblx0YXBwZW5kVG86IHR5cGVvZiBQb29wSnMuZWxlbWVudC5hcHBlbmRUbztcclxuXHRlbWl0OiB0eXBlb2YgUG9vcEpzLmVsZW1lbnQuZW1pdDtcclxufVxyXG5cclxuaW50ZXJmYWNlIERvY3VtZW50IHtcclxuXHRxOiB0eXBlb2YgUG9vcEpzLmRvY3EucTtcclxuXHRxcTogdHlwZW9mIFBvb3BKcy5kb2NxLnFxO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgT2JqZWN0Q29uc3RydWN0b3Ige1xyXG5cdGRlZmluZVZhbHVlOiB0eXBlb2YgUG9vcEpzLm9iamVjdC5kZWZpbmVWYWx1ZTtcclxuXHRkZWZpbmVHZXR0ZXI6IHR5cGVvZiBQb29wSnMub2JqZWN0LmRlZmluZUdldHRlcjtcclxuXHRtYXA6IHR5cGVvZiBQb29wSnMub2JqZWN0Lm1hcDtcclxufVxyXG5pbnRlcmZhY2UgUHJvbWlzZUNvbnN0cnVjdG9yIHtcclxuXHRlbXB0eTogdHlwZW9mIFBvb3BKcy5wcm9taXNlLmVtcHR5O1xyXG5cdGZyYW1lOiB0eXBlb2YgUG9vcEpzLnByb21pc2UuZnJhbWU7XHJcblx0cmFmOiB0eXBlb2YgUG9vcEpzLnByb21pc2UuZnJhbWU7XHJcbn1cclxuXHJcbmludGVyZmFjZSBBcnJheTxUPiB7XHJcblx0dnNvcnQ6IHR5cGVvZiBQb29wSnMuYXJyYXkudnNvcnQ7XHJcblx0cG1hcDogdHlwZW9mIFBvb3BKcy5hcnJheS5wbWFwO1xyXG59XHJcbmludGVyZmFjZSBBcnJheUNvbnN0cnVjdG9yIHtcclxuXHRtYXA6IHR5cGVvZiBQb29wSnMuYXJyYXkubWFwO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgRGF0ZUNvbnN0cnVjdG9yIHtcclxuXHRfbm93KCk6IG51bWJlcjtcclxufVxyXG5pbnRlcmZhY2UgRGF0ZSB7XHJcblx0X2dldFRpbWUoKTogbnVtYmVyO1xyXG59Il19