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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9BcnJheS50cyIsIi4uL3NyYy9EYXRlTm93SGFjay50cyIsIi4uL3NyYy9FbGVtZW50LnRzIiwiLi4vc3JjL0VudHJ5RmlsdGVyLnRzIiwiLi4vc3JjL09iamVjdC50cyIsIi4uL3NyYy9Qcm9taXNlLnRzIiwiLi4vc3JjL2VsbS50cyIsIi4uL3NyYy9mZXRjaC50cyIsIi4uL3NyYy9wYWdpbmF0ZS50cyIsIi4uL3NyYy9pbml0LnRzIiwiLi4vc3JjL3R5cGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQVUsTUFBTSxDQW9EZjtBQXBERCxXQUFVLE1BQU07SUFFZixJQUFpQixLQUFLLENBZ0RyQjtJQWhERCxXQUFpQixLQUFLO1FBR2QsS0FBSyxVQUFVLElBQUksQ0FBa0IsTUFBbUQsRUFBRSxPQUFPLEdBQUcsQ0FBQztZQUMzRyxJQUFJLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO2dCQUFFLE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUN0QyxJQUFJLEtBQUssR0FBdUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqRSxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3JDLElBQUksV0FBVyxHQUFHLE9BQUEsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2xDLElBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQztZQUMxQixLQUFLLFVBQVUsT0FBTyxDQUFDLElBQXNCO2dCQUM1QyxJQUFJO29CQUNILE9BQU8sTUFBTSxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztpQkFDN0I7Z0JBQUMsT0FBTyxHQUFHLEVBQUU7b0JBQ2IsT0FBTyxHQUFH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Q0FBQyxNQUFNO1lBQUUsTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFnQixDQUFDO1FBRWxELE1BQU0sQ0FBQyxHQUFHLEdBQUcsT0FBQSxHQUFHLENBQUMsR0FBRyxDQUFDO1FBQ3JCLE1BQU0sQ0FBQyxDQUFDLEdBQUcsT0FBQSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2xCLE1BQU0sQ0FBQyxFQUFFLEdBQUcsT0FBQSxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ3BCLE9BQUEsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxPQUFBLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RCxPQUFBLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsT0FBQSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDeEQsT0FBQSxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLE9BQUEsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BFLE9BQUEsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxPQUFBLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1RCxPQUFBLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsT0FBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEQsT0FBQSxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLE9BQUEsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRXRELE9BQUEsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BELE9BQUEsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BELE9BQUEsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRWxELE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE9BQUEsS0FBSyxDQUFDLE1BQWEsQ0FBQztRQUMxQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxPQUFBLEtBQUssQ0FBQyxHQUFVLENBQUM7UUFDcEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLE9BQUEsS0FBSyxDQUFDLFNBQVMsQ0FBQztRQUMxQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsT0FBQSxLQUFLLENBQUMsU0FBUyxDQUFDO1FBQzFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLE9BQUEsS0FBSyxDQUFDLFNBQVMsQ0FBQztRQUV6QyxPQUFBLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLGFBQWEsRUFBRSxPQUFBLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM5RCxPQUFBLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLGNBQWMsRUFBRSxPQUFBLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNoRSxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsT0FBQSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFOUMsT0FBQSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsT0FBQSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUMsT0FBQSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLE9BQUEsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hELE9BQUEsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxPQUFBLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUUxRCxNQUFNLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7UUFDbEMsTUFBTSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQztRQUVwRCxPQUFBLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3pELE9BQU8sUUFBUSxDQUFDO0lBQ2pCLENBQUM7SUFwQ2UsZUFBUSxXQW9DdkIsQ0FBQTtJQUVELE9BQUEsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBRWhFLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUU7UUFDakMsTUFBTSxDQUFDLFFBQVEsQ0FBQztLQUNoQjtBQUVGLENBQUMsRUE5Q1MsTUFBTSxLQUFOLE1BQU0sUUE4Q2YiLCJzb3VyY2VzQ29udGVudCI6WyJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBhcnJheSB7XHJcblxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBwbWFwPFQsIFY+KHRoaXM6IFRbXSwgbWFwcGVyOiAoZTogVCwgaTogbnVtYmVyLCBhOiBUW10pID0+IFByb21pc2U8Vj4gfCBWLCB0aHJlYWRzID0gNSk6IFByb21pc2U8VltdPiB7XHJcblx0XHRcdGlmICghKHRocmVhZHMgPiAwKSkgdGhyb3cgbmV3IEVycm9yKCk7XHJcblx0XHRcdGxldCB0YXNrczogW1QsIG51bWJlciwgVFtdXVtdID0gdGhpcy5tYXAoKGUsIGksIGEpID0+IFtlLCBpLCBhXSk7XHJcblx0XHRcdGxldCByZXN1bHRzID0gQXJyYXk8Vj4odGFza3MubGVuZ3RoKTtcclxuXHRcdFx0bGV0IGFueVJlc29sdmVkID0gcHJvbWlzZS5lbXB0eSgpO1xyXG5cdFx0XHRsZXQgZnJlZVRocmVhZHMgPSB0aHJlYWRzO1xyXG5cdFx0XHRhc3luYyBmdW5jdGlvbiBydW5UYXNrKHRhc2s6IFtULCBudW1iZXIsIFRbXV0pOiBQcm9taXNlPFY+IHtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGF3YWl0IG1hcHBlciguLi50YXNrKTtcclxuXHRcdFx0XHR9IGNhdGNoIChlcnIpIHtcclxuXHRcdFx0XHRcdHJldHVybiBlcnI7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGFzeW5jIGZ1bmN0aW9uIHJ1bih0YXNrKSB7XHJcblx0XHRcdFx0ZnJlZVRocmVhZHMtLTtcclxuXHRcdFx0XHRyZXN1bHRzW3Rhc2tbMV1dID0gYXdhaXQgcnVuVGFzayh0YXNrKTtcclxuXHRcdFx0XHRmcmVlVGhyZWFkcysrO1xyXG5cdFx0XHRcdGxldCBvbGRBbnlSZXNvbHZlZCA9IGFueVJlc29sdmVkO1xyXG5cdFx0XHRcdGFueVJlc29sdmVkID0gcHJvbWlzZS5lbXB0eSgpO1xyXG5cdFx0XHRcdG9sZEFueVJlc29sdmVkLnIodW5kZWZpbmVkKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRmb3IgKGxldCB0YXNrIG9mIHRhc2tzKSB7XHJcblx0XHRcdFx0aWYgKGZyZWVUaHJlYWRzID09IDApIHtcclxuXHRcdFx0XHRcdGF3YWl0IGFueVJlc29sdmVkO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRydW4odGFzayk7XHJcblx0XHRcdH1cclxuXHRcdFx0d2hpbGUgKGZyZWVUaHJlYWRzIDwgdGhyZWFkcykge1xyXG5cdFx0XHRcdGF3YWl0IGFueVJlc29sdmVkO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiByZXN1bHRzO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBtYXA8VCA9IG51bWJlcj4odGhpczogQXJyYXlDb25zdHJ1Y3RvciwgbGVuZ3RoOiBudW1iZXIsIG1hcHBlcjogKG51bWJlcikgPT4gVCA9IGkgPT4gaSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcyhsZW5ndGgpLmZpbGwoMCkubWFwKChlLCBpLCBhKSA9PiBtYXBwZXIoaSkpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiB2c29ydDxUPih0aGlzOiBUW10sIG1hcHBlcjogKGU6IFQsIGk6IG51bWJlciwgYTogVFtdKSA9PiBudW1iZXIsIHNvcnRlcjogKChhOiBudW1iZXIsIGI6IG51bWJlciwgYWU6IFQsIGJlOiBUKSA9PiBudW1iZXIpIHwgLTEgPSAoYSwgYikgPT4gYSAtIGIpIHtcclxuXHRcdFx0bGV0IHRoZVNvcnRlciA9IHR5cGVvZiBzb3J0ZXIgPT0gJ2Z1bmN0aW9uJyA/IHNvcnRlciA6IChhLCBiKSA9PiBiIC0gYTtcclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdFx0XHQubWFwKChlLCBpLCBhKSA9PiAoeyBlLCB2OiBtYXBwZXIoZSwgaSwgYSkgfSkpXHJcblx0XHRcdFx0LnNvcnQoKGEsIGIpID0+IHRoZVNvcnRlcihhLnYsIGIudiwgYS5lLCBiLmUpKVxyXG5cdFx0XHRcdC5tYXAoZSA9PiBlLmUpO1xyXG5cdFx0fVxyXG5cclxuXHR9XHJcblxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblxyXG5cdGV4cG9ydCBuYW1lc3BhY2UgRGF0ZU5vd0hhY2sge1xyXG5cdFx0XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIERhdGVOb3dIYWNrKG4gPSA1KSB7XHJcblx0XHRcdERhdGUuX25vdyA/Pz0gRGF0ZS5ub3c7XHJcblx0XHRcdGxldCBfc3RhcnQgPSBEYXRlLl9ub3coKTtcclxuXHRcdFx0bGV0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcclxuXHRcdFx0RGF0ZS5ub3cgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRyZXR1cm4gKHRoaXMuX25vdygpIC0gX3N0YXJ0KSAqIG4gKyBzdGFydDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0RGF0ZS5wcm90b3R5cGUuX2dldFRpbWUgPz89IERhdGUucHJvdG90eXBlLmdldFRpbWU7XHJcblx0XHRcdGxldCBfZ3Rfc3RhcnQgPSBuZXcgRGF0ZSgpLl9nZXRUaW1lKCk7XHJcblx0XHRcdGxldCBndF9zdGFydCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG5cdFx0XHREYXRlLnByb3RvdHlwZS5nZXRUaW1lID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0cmV0dXJuICh0aGlzLl9nZXRUaW1lKCkgLSBfZ3Rfc3RhcnQpICogbiArIGd0X3N0YXJ0O1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjb25zb2xlLmxvZyhgRGF0ZU5vd0hhY2s6YCwgbik7XHJcblxyXG5cdFx0fVxyXG5cclxuXHR9XHJcblxyXG5cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIHdpbnEge1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHE8SyBleHRlbmRzIGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcD4oc2VsZWN0b3I6IEssIHBhcmVudD86IFBhcmVudE5vZGUpOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10gfCBudWxsO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHE8RSBleHRlbmRzIEVsZW1lbnQgPSBFbGVtZW50PihzZWxlY3Rvcjogc3RyaW5nLCBwYXJlbnQ/OiBQYXJlbnROb2RlKTogRSB8IG51bGw7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcShzZWxlY3Rvcjogc3RyaW5nLCBwYXJlbnQ6IFBhcmVudE5vZGUgPSBkb2N1bWVudCkge1xyXG5cdFx0XHRyZXR1cm4gcGFyZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3RvcjogSywgcGFyZW50PzogUGFyZW50Tm9kZSk6IChIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10pW107XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcXE8RSBleHRlbmRzIEVsZW1lbnQgPSBFbGVtZW50PihzZWxlY3Rvcjogc3RyaW5nLCBwYXJlbnQ/OiBQYXJlbnROb2RlKTogRVtdO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxKHNlbGVjdG9yOiBzdHJpbmcsIHBhcmVudDogUGFyZW50Tm9kZSA9IGRvY3VtZW50KSB7XHJcblx0XHRcdHJldHVybiBbLi4ucGFyZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGV4cG9ydCBuYW1lc3BhY2UgZG9jcSB7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPih0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IEspOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10gfCBudWxsO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHE8RSBleHRlbmRzIEVsZW1lbnQgPSBFbGVtZW50Pih0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IHN0cmluZyk6IEUgfCBudWxsO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHEodGhpczogRG9jdW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuZG9jdW1lbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPih0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IEspOiAoSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdKVtdO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEUgZXh0ZW5kcyBFbGVtZW50ID0gRWxlbWVudD4odGhpczogRG9jdW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpOiBFW107XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcXEodGhpczogRG9jdW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpIHtcclxuXHRcdFx0cmV0dXJuIFsuLi50aGlzLmRvY3VtZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKV07XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIGVsZW1lbnQge1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHE8SyBleHRlbmRzIGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcD4odGhpczogRWxlbWVudCwgc2VsZWN0b3I6IEspOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10gfCBudWxsO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHE8RSBleHRlbmRzIEVsZW1lbnQgPSBFbGVtZW50Pih0aGlzOiBFbGVtZW50LCBzZWxlY3Rvcjogc3RyaW5nKTogRSB8IG51bGw7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcSh0aGlzOiBFbGVtZW50LCBzZWxlY3Rvcjogc3RyaW5nKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPih0aGlzOiBFbGVtZW50LCBzZWxlY3RvcjogSyk6IChIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10pW107XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gcXE8RSBleHRlbmRzIEVsZW1lbnQgPSBFbGVtZW50Pih0aGlzOiBFbGVtZW50LCBzZWxlY3Rvcjogc3RyaW5nKTogRVtdO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxKHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpIHtcclxuXHRcdFx0cmV0dXJuIFsuLi50aGlzLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZW1pdCh0aGlzOiBFbGVtZW50LCB0eXBlOiBzdHJpbmcsIGRldGFpbD86IGFueSkge1xyXG5cdFx0XHRsZXQgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQodHlwZSwge1xyXG5cdFx0XHRcdGJ1YmJsZXM6IHRydWUsXHJcblx0XHRcdFx0ZGV0YWlsLFxyXG5cdFx0XHR9KTtcclxuXHRcdFx0dGhpcy5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gYXBwZW5kVG8odGhpczogRWxlbWVudCwgcGFyZW50OiBFbGVtZW50KTtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBhcHBlbmRUbyh0aGlzOiBFbGVtZW50LCBzZWxlY3Rvcjogc3RyaW5nKTtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBhcHBlbmRUbyh0aGlzOiBFbGVtZW50LCBwYXJlbnQ6IEVsZW1lbnQgfCBzdHJpbmcpIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBwYXJlbnQgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRwYXJlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHBhcmVudCk7XHJcblx0XHRcdH1cclxuXHRcdFx0cGFyZW50LmFwcGVuZCh0aGlzKTtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9XHJcblx0fVxyXG5cclxufVxyXG5cclxuXHJcblx0Ly8gT2JqZWN0LmRlZmluZUdldHRlcihFbGVtZW50LnByb3RvdHlwZSwgZnVuY3Rpb24gZGF0YSgpe1xyXG5cdC8vIFx0bGV0IGRhdGEgPSBKU09OLnBhcnNlKHRoaXMuZGF0YXNldC5kYXRhIHx8ICd7fScpO1xyXG5cdC8vIFx0cmV0dXJuIG5ldyBQcm94eShkYXRhLCB7XHJcblx0Ly8gXHRcdGdldDogKHRhcmdldCwgbmFtZSkgPT4ge1xyXG5cdC8vIFx0XHRcdGlmIChuYW1lID09ICdkYXRhJykgcmV0dXJuIGRhdGE7XHJcblx0Ly8gXHRcdFx0cmV0dXJuIGRhdGFbbmFtZV07XHJcblx0Ly8gXHRcdH0sXHJcblx0Ly8gXHRcdHNldDogKHRhcmdldCwgbmFtZSwgdmFsdWUpID0+IHtcclxuXHQvLyBcdFx0XHRkYXRhW25hbWVdID0gdmFsdWU7XHJcblx0Ly8gXHRcdFx0dGhpcy5kYXRhc2V0LmRhdGEgPSBKU09OLnN0cmluZ2lmeShkYXRhKTtcclxuXHQvLyBcdFx0fSxcclxuXHQvLyBcdH0pO1xyXG5cdC8vIH0pOyIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgY2xhc3MgRW50cnlGaWx0ZXJlcjxEYXRhPiB7XHJcblx0XHRhY3RpdmUgPSBmYWxzZTtcclxuXHRcdHBhcnNlcnM6ICgoZWw6IEhUTUxFbGVtZW50LCBkYXRhOiBEYXRhKSA9PiBEYXRhIHwgdm9pZClbXSA9IFtdO1xyXG5cdFx0ZmlsdGVyczogKHsgbmFtZTogc3RyaW5nLCBvbjogYm9vbGVhbiwgZmlsdGVyOiAoZGF0YTogRGF0YSkgPT4gYm9vbGVhbiB9KVtdID0gW107XHJcblx0XHRzb3J0ZXJzOiAoeyBuYW1lOiBzdHJpbmcsIHNvcnRWYWx1ZTogKGRhdGE6IERhdGEpID0+IG51bWJlciwgb24/OiBib29sZWFuIH0pW10gPSBbXTtcclxuXHRcdGFjdGl2ZVNvcnRlcnM6ICgoZGF0YTogRGF0YSkgPT4gbnVtYmVyKVtdID0gW107XHJcblxyXG5cdFx0Y29udGFpbmVyOiBIVE1MRWxlbWVudDtcclxuXHJcblx0XHRzZWxlY3RvciA9ICcnO1xyXG5cdFx0ZW50cnlHZXR0ZXI6ICgpID0+IEhUTUxFbGVtZW50W10gPSAoKSA9PiBxcSh0aGlzLnNlbGVjdG9yKTtcclxuXHJcblx0XHRjb25zdHJ1Y3RvcihzZWxlY3Rvcjogc3RyaW5nKTtcclxuXHRcdGNvbnN0cnVjdG9yKGVudHJ5R2V0dGVyOiAoKSA9PiBIVE1MRWxlbWVudFtdKTtcclxuXHRcdGNvbnN0cnVjdG9yKHNlbDogc3RyaW5nIHwgKCgpID0+IEhUTUxFbGVtZW50W10pKSB7XHJcblx0XHRcdGlmICh0eXBlb2Ygc2VsID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0dGhpcy5zZWxlY3RvciA9IHNlbDtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLmVudHJ5R2V0dGVyID0gc2VsO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRoaXMuY29udGFpbmVyID0gZWxtKCcuZWYtY29udGFpbmVyJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0c2hvdyhvbiA9IHRydWUpIHtcclxuXHRcdFx0aWYgKCFvbikgcmV0dXJuIHRoaXM7XHJcblx0XHRcdHRoaXMuY29udGFpbmVyLmFwcGVuZFRvKCdib2R5Jyk7XHJcblx0XHRcdHBhZ2luYXRlLm9uY2hhbmdlKCgpID0+IHRoaXMub25QYWdpbmF0ZUNoYW5nZSgpKTtcclxuXHRcdFx0dGhpcy5hY3RpdmUgPSB0cnVlO1xyXG5cdFx0XHR0aGlzLnVwZGF0ZSgpO1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH1cclxuXHJcblx0XHRnZXRFbnRyaWVzKHVwZGF0ZSA9IGZhbHNlKTogSFRNTEVsZW1lbnRbXSB7XHJcblx0XHRcdHJldHVybiB0aGlzLmVudHJ5R2V0dGVyKCk7XHJcblx0XHR9XHJcblx0XHRwYXJzZSgpIHtcclxuXHRcdFx0Zm9yIChsZXQgZWwgb2YgdGhpcy5nZXRFbnRyaWVzKCkpIHtcclxuXHRcdFx0XHRsZXQgZGF0YTogRGF0YSA9IEpTT04ucGFyc2UoZWwuZGF0YXNldC5lZiB8fCAne30nKTtcclxuXHRcdFx0XHRmb3IgKGxldCBwYXJzZXIgb2YgdGhpcy5wYXJzZXJzKSB7XHJcblx0XHRcdFx0XHRkYXRhID0gcGFyc2VyKGVsLCBkYXRhKSB8fCBkYXRhO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbC5kYXRhc2V0LmVmID0gSlNPTi5zdHJpbmdpZnkoZGF0YSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRnZXRFbnRyaWVzV2l0aERhdGEoKTogeyBlbDogSFRNTEVsZW1lbnQsIGRhdGE6IERhdGEgfVtdIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuZ2V0RW50cmllcygpLm1hcChlbCA9PiAoeyBlbCwgZGF0YTogSlNPTi5wYXJzZShlbC5kYXRhc2V0LmVmIHx8ICd7fScpIH0pKTtcclxuXHRcdH1cclxuXHJcblx0XHRvblBhZ2luYXRlQ2hhbmdlKCkge1xyXG5cdFx0XHR0aGlzLnVwZGF0ZSgpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGFkZFBhcnNlcihwYXJzZXI6IChlbDogSFRNTEVsZW1lbnQsIGRhdGE6IERhdGEpID0+IHZvaWQgfCBEYXRhKSB7XHJcblx0XHRcdHRoaXMucGFyc2Vycy5wdXNoKHBhcnNlcik7XHJcblx0XHRcdHRoaXMucGFyc2UoKTtcclxuXHRcdH1cclxuXHJcblx0XHRhZGRGaWx0ZXIobmFtZTogc3RyaW5nLCBmaWx0ZXI6IChkYXRhOiBEYXRhKSA9PiBib29sZWFuLCBvbj86IGJvb2xlYW4pIHtcclxuXHRcdFx0bGV0IGVudHJ5ID0geyBuYW1lLCBmaWx0ZXIsIG9uOiBmYWxzZSwgYnV0dG9uOiB1bmRlZmluZWQgYXMgSFRNTEVsZW1lbnQgfTtcclxuXHRcdFx0dGhpcy5maWx0ZXJzLnB1c2goZW50cnkpO1xyXG5cdFx0XHRlbnRyeS5idXR0b24gPSBlbG0oXHJcblx0XHRcdFx0J2J1dHRvbi5lZi1maWx0ZXInLFxyXG5cdFx0XHRcdG5hbWUsXHJcblx0XHRcdFx0KGNsaWNrOiBNb3VzZUV2ZW50ICYgeyB0YXJnZXQ6IEhUTUxFbGVtZW50IH0pID0+IHtcclxuXHRcdFx0XHRcdGVudHJ5Lm9uID0gIWVudHJ5Lm9uO1xyXG5cdFx0XHRcdFx0Y2xpY2sudGFyZ2V0LmNsYXNzTGlzdC50b2dnbGUoJ2VmLWZpbHRlci1vbicsIGVudHJ5Lm9uKTtcclxuXHRcdFx0XHRcdHRoaXMudXBkYXRlKCk7XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0KS5hcHBlbmRUbyh0aGlzLmNvbnRhaW5lcik7XHJcblx0XHRcdGlmIChvbikge1xyXG5cdFx0XHRcdHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiBlbnRyeS5idXR0b24uY2xpY2soKSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRhZGRTb3J0ZXIobmFtZTogc3RyaW5nLCBzb3J0VmFsdWU6IChkYXRhOiBEYXRhKSA9PiBudW1iZXIsIG9uPzogYm9vbGVhbikge1xyXG5cdFx0XHRsZXQgZW50cnkgPSB7IG5hbWUsIHNvcnRWYWx1ZSwgb246ICEhb24gfTtcclxuXHRcdFx0dGhpcy5zb3J0ZXJzLnB1c2goZW50cnkpO1xyXG5cdFx0XHRlbG0oXHJcblx0XHRcdFx0J2J1dHRvbi5lZi1zb3J0ZXInLFxyXG5cdFx0XHRcdG5hbWUsXHJcblx0XHRcdFx0KGNsaWNrOiBNb3VzZUV2ZW50ICYgeyB0YXJnZXQ6IEhUTUxFbGVtZW50IH0pID0+IHtcclxuXHRcdFx0XHRcdGVudHJ5Lm9uID0gIWVudHJ5Lm9uO1xyXG5cdFx0XHRcdFx0Y2xpY2sudGFyZ2V0LmNsYXNzTGlzdC50b2dnbGUoJ2VmLXNvcnRlci1vbicsIGVudHJ5Lm9uKTtcclxuXHRcdFx0XHRcdGlmIChlbnRyeS5vbikgdGhpcy5hY3RpdmVTb3J0ZXJzLnB1c2goc29ydFZhbHVlKTtcclxuXHRcdFx0XHRcdGVsc2UgdGhpcy5hY3RpdmVTb3J0ZXJzLnNwbGljZSh0aGlzLmFjdGl2ZVNvcnRlcnMuaW5kZXhPZihzb3J0VmFsdWUpLCAxKTtcclxuXHRcdFx0XHRcdHRoaXMudXBkYXRlKCk7XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0KS5hcHBlbmRUbyh0aGlzLmNvbnRhaW5lcik7XHJcblx0XHR9XHJcblxyXG5cdFx0dXBkYXRlKCkge1xyXG5cdFx0XHRpZiAoIXRoaXMuYWN0aXZlKSByZXR1cm47XHJcblx0XHRcdHRoaXMucGFyc2UoKTtcclxuXHRcdFx0bGV0IGVucyA9IHRoaXMuZ2V0RW50cmllc1dpdGhEYXRhKCk7XHJcblx0XHRcdGZvciAobGV0IGVuIG9mIGVucykge1xyXG5cdFx0XHRcdGxldCBvbiA9IHRydWU7XHJcblx0XHRcdFx0Zm9yIChsZXQgZiBvZiB0aGlzLmZpbHRlcnMpIHtcclxuXHRcdFx0XHRcdGlmIChmLm9uKSBvbiA9IG9uICYmIGYuZmlsdGVyKGVuLmRhdGEpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbi5lbC5jbGFzc0xpc3QudG9nZ2xlKCdlZi1oaWRkZW4nLCAhb24pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghdGhpcy5hY3RpdmVTb3J0ZXJzLmxlbmd0aCkgcmV0dXJuO1xyXG5cdFx0XHRsZXQgYnIgPSBlbG0oJ2JyJyk7XHJcblx0XHRcdGVuc1swXS5lbC5iZWZvcmUoYnIpO1xyXG5cdFx0XHRmb3IgKGxldCBzb3J0ZXIgb2YgdGhpcy5hY3RpdmVTb3J0ZXJzKSB7XHJcblx0XHRcdFx0ZW5zID0gZW5zLnZzb3J0KCh7IGRhdGEgfSkgPT4gc29ydGVyKGRhdGEpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRici5hZnRlciguLi5lbnMubWFwKGUgPT4gZS5lbCkpO1xyXG5cdFx0XHRici5yZW1vdmUoKTtcclxuXHRcdH1cclxuXHJcblx0fVxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblxyXG5cdGV4cG9ydCBuYW1lc3BhY2Ugb2JqZWN0IHtcclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZGVmaW5lVmFsdWU8VD4obzogVCwgcDoga2V5b2YgVCwgdmFsdWU6IGFueSk6IFQ7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZGVmaW5lVmFsdWU8VD4obzogVCwgZm46IEZ1bmN0aW9uKTogVDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBkZWZpbmVWYWx1ZTxUPihvOiBULCBwOiBrZXlvZiBUIHwgc3RyaW5nIHwgRnVuY3Rpb24sIHZhbHVlPzogYW55KTogVCB7XHJcblx0XHRcdGlmICh0eXBlb2YgcCA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0W3AsIHZhbHVlXSA9IFtwLm5hbWUsIHBdIGFzIFtzdHJpbmcsIEZ1bmN0aW9uXTtcclxuXHRcdFx0fVxyXG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobywgcCwge1xyXG5cdFx0XHRcdHZhbHVlLFxyXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdFx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcclxuXHRcdFx0XHR3cml0YWJsZTogdHJ1ZSxcclxuXHRcdFx0fSk7XHJcblx0XHRcdHJldHVybiBvO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBkZWZpbmVHZXR0ZXI8VD4obzogVCwgcDoga2V5b2YgVCwgZ2V0OiAoKSA9PiBWYWx1ZU9mPFQ+KTogVDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBkZWZpbmVHZXR0ZXI8VD4obzogVCwgZ2V0OiBGdW5jdGlvbik6IFQ7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZGVmaW5lR2V0dGVyPFQ+KG86IFQsIHA6IHN0cmluZyB8IGtleW9mIFQgfCBGdW5jdGlvbiwgZ2V0PzogYW55KTogVCB7XHJcblx0XHRcdGlmICh0eXBlb2YgcCA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0W3AsIGdldF0gPSBbcC5uYW1lLCBwXSBhcyBbc3RyaW5nLCBGdW5jdGlvbl07XHJcblx0XHRcdH1cclxuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIHAsIHtcclxuXHRcdFx0XHRnZXQsXHJcblx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdGVudW1lcmFibGU6IGZhbHNlLFxyXG5cdFx0XHR9KTtcclxuXHRcdFx0cmV0dXJuIG87XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIG1hcDxULCBWPihvOiBULCBtYXBwZXI6ICh2OiBWYWx1ZU9mPFQ+LCBrOiBrZXlvZiBULCBvOiBUKSA9PiBWKTogTWFwcGVkT2JqZWN0PFQsVj4ge1xyXG5cdFx0XHRsZXQgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKG8pIGFzIFtrZXlvZiBULCBWYWx1ZU9mPFQ+XVtdO1xyXG5cdFx0XHRyZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKGVudHJpZXMubWFwKChbayx2XSkgPT4gW2ssIG1hcHBlcih2LCBrLCBvKV0pKSBhcyBNYXBwZWRPYmplY3Q8VCxWPjtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblxyXG5cdGV4cG9ydCBuYW1lc3BhY2UgcHJvbWlzZSB7XHJcblx0XHR0eXBlIFVud3JhcHBlZFByb21pc2U8VD4gPSBQcm9taXNlPFQ+ICYge1xyXG5cdFx0XHRyZXNvbHZlOiAodmFsdWU6IFQgfCBQcm9taXNlTGlrZTxUPikgPT4gdm9pZDtcclxuXHRcdFx0cmVqZWN0OiAocmVhc29uPzogYW55KSA9PiB2b2lkO1xyXG5cdFx0XHRyOiAodmFsdWU6IFQgfCBQcm9taXNlTGlrZTxUPikgPT4gdm9pZDtcclxuXHRcdFx0ajogKHJlYXNvbj86IGFueSkgPT4gdm9pZDtcclxuXHRcdH1cclxuXHJcblx0XHQvKipcclxuXHRcdCAqIENyZWF0ZXMgdW53cmFwcGVkIHByb21pc2VcclxuXHRcdCAqL1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGVtcHR5PFQ+KCkge1xyXG5cdFx0XHRsZXQgcmVzb2x2ZTogKHZhbHVlOiBUKSA9PiB2b2lkO1xyXG5cdFx0XHRsZXQgcmVqZWN0OiAocmVhc29uPzogYW55KSA9PiB2b2lkO1xyXG5cdFx0XHRsZXQgcCA9IG5ldyBQcm9taXNlPFQ+KChyLCBqKSA9PiB7XHJcblx0XHRcdFx0cmVzb2x2ZSA9IHI7XHJcblx0XHRcdFx0cmVqZWN0ID0gajtcclxuXHRcdFx0fSkgYXMgVW53cmFwcGVkUHJvbWlzZTxUPjtcclxuXHRcdFx0cC5yZXNvbHZlID0gcC5yID0gcmVzb2x2ZTtcclxuXHRcdFx0cC5yZWplY3QgPSBwLmogPSByZWplY3Q7XHJcblx0XHRcdHJldHVybiBwO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBmcmFtZShuID0gMSk6IFByb21pc2U8bnVtYmVyPiB7XHJcblx0XHRcdHdoaWxlICgtLW4gPiAwKSB7XHJcblx0XHRcdFx0YXdhaXQgbmV3IFByb21pc2UocmVxdWVzdEFuaW1hdGlvbkZyYW1lKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UocmVxdWVzdEFuaW1hdGlvbkZyYW1lKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59XHJcbiIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIEVsbSB7XHJcblx0XHR0eXBlIENoaWxkID0gYW55O1xyXG5cdFx0dHlwZSBMaXN0ZW5lciA9IChldmVudDogRXZlbnQpID0+IGFueTtcclxuXHJcblx0XHRjb25zdCBlbG1SZWdleCA9IG5ldyBSZWdFeHAoW1xyXG5cdFx0XHQvXig/PHRhZz5bXFx3LV0rKS8sXHJcblx0XHRcdC8jKD88aWQ+W1xcdy1dKykvLFxyXG5cdFx0XHQvXFwuKD88Y2xhc3M+W1xcdy1dKykvLFxyXG5cdFx0XHQvXFxbKD88YXR0cjE+W1xcdy1dKylcXF0vLFxyXG5cdFx0XHQvXFxbKD88YXR0cjI+W1xcdy1dKyk9KD8hWydcIl0pKD88dmFsMj5bXlxcXV0qKVxcXS8sXHJcblx0XHRcdC9cXFsoPzxhdHRyMz5bXFx3LV0rKT1cIig/PHZhbDM+KD86W15cIl18XFxcXFwiKSopXCJcXF0vLFxyXG5cdFx0XHQvXFxbKD88YXR0cjQ+W1xcdy1dKyk9XCIoPzx2YWw0Pig/OlteJ118XFxcXCcpKilcIlxcXS8sXHJcblx0XHRdLm1hcChlID0+IGUuc291cmNlKS5qb2luKCd8JyksICdnJyk7XHJcblxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogQ3JlYXRlcyBhbiBlbGVtZW50IG1hdGNoaW5nIHByb3ZpZGVkIHNlbGVjdG9yLCB3aXRoIHByb3ZpZGVkIGNoaWxkcmVuIGFuZCBsaXN0ZW5lcnNcclxuXHRcdCAqL1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGVsbShzZWxlY3Rvcj86IHN0cmluZywgLi4uY2hpbGRyZW46IChDaGlsZCB8IExpc3RlbmVyKVtdKTogSFRNTEVsZW1lbnQ7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtKHNlbGVjdG9yOiBgaW5wdXQke3N0cmluZ31gLCAuLi5jaGlsZHJlbjogKENoaWxkIHwgTGlzdGVuZXIpW10pOiBIVE1MSW5wdXRFbGVtZW50O1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGVsbShzZWxlY3RvcjogYGltZyR7c3RyaW5nfWAsIC4uLmNoaWxkcmVuOiAoQ2hpbGQgfCBMaXN0ZW5lcilbXSk6IEhUTUxJbWFnZUVsZW1lbnQ7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtKHNlbGVjdG9yOiBzdHJpbmcgPSAnJywgLi4uY2hpbGRyZW46IChDaGlsZCB8IExpc3RlbmVyKVtdKTogSFRNTEVsZW1lbnQge1xyXG5cdFx0XHRpZiAoc2VsZWN0b3IucmVwbGFjZUFsbChlbG1SZWdleCwgJycpICE9ICcnKSB7XHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIHNlbGVjdG9yOiAke3NlbGVjdG9yfWApO1xyXG5cdFx0XHR9XHJcblx0XHRcdGxldCBlbGVtZW50OiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5cdFx0XHRmb3IgKGxldCBtYXRjaCBvZiBzZWxlY3Rvci5tYXRjaEFsbChlbG1SZWdleCkpIHtcclxuXHRcdFx0XHRpZiAobWF0Y2guZ3JvdXBzLnRhZykge1xyXG5cdFx0XHRcdFx0ZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobWF0Y2guZ3JvdXBzLnRhZyk7XHJcblx0XHRcdFx0fSBlbHNlIGlmIChtYXRjaC5ncm91cHMuaWQpIHtcclxuXHRcdFx0XHRcdGVsZW1lbnQuaWQgPSBtYXRjaC5ncm91cHMuaWQ7XHJcblx0XHRcdFx0fSBlbHNlIGlmIChtYXRjaC5ncm91cHMuY2xhc3MpIHtcclxuXHRcdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LmFkZChtYXRjaC5ncm91cHMuY2xhc3MpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAobWF0Y2guZ3JvdXBzLmF0dHIxKSB7XHJcblx0XHRcdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZShtYXRjaC5ncm91cHMuYXR0cjEsIFwidHJ1ZVwiKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5hdHRyMikge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5zZXRBdHRyaWJ1dGUobWF0Y2guZ3JvdXBzLmF0dHIyLCBtYXRjaC5ncm91cHMudmFsMik7XHJcblx0XHRcdFx0fSBlbHNlIGlmIChtYXRjaC5ncm91cHMuYXR0cjMpIHtcclxuXHRcdFx0XHRcdGVsZW1lbnQuc2V0QXR0cmlidXRlKG1hdGNoLmdyb3Vwcy5hdHRyMywgbWF0Y2guZ3JvdXBzLnZhbDMucmVwbGFjZSgvXFxcXFwiL2csICdcIicpKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5hdHRyNCkge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5zZXRBdHRyaWJ1dGUobWF0Y2guZ3JvdXBzLmF0dHI0LCBtYXRjaC5ncm91cHMudmFsNC5yZXBsYWNlKC9cXFxcJy9nLCAnXFwnJykpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRmb3IgKGxldCBsaXN0ZW5lciBvZiBjaGlsZHJlbi5maWx0ZXIoZSA9PiB0eXBlb2YgZSA9PSAnZnVuY3Rpb24nKSBhcyBMaXN0ZW5lcltdKSB7XHJcblx0XHRcdFx0bGV0IG5hbWUgPSBsaXN0ZW5lci5uYW1lO1xyXG5cdFx0XHRcdGlmICghbmFtZSkgbmFtZSA9IChsaXN0ZW5lciArICcnKS5tYXRjaCgvXFx3Ky8pWzBdO1xyXG5cdFx0XHRcdGlmIChuYW1lLnN0YXJ0c1dpdGgoJ29uJykpIG5hbWUgPSBuYW1lLnNsaWNlKDIpO1xyXG5cdFx0XHRcdGlmIChlbGVtZW50WydvbicgKyBuYW1lXSA9PT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0ZWxlbWVudFsnb24nICsgbmFtZV0gPSBsaXN0ZW5lcjtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGxpc3RlbmVyKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxlbWVudC5hcHBlbmQoLi4uY2hpbGRyZW4uZmlsdGVyKGUgPT4gdHlwZW9mIGUgIT0gJ2Z1bmN0aW9uJykpO1xyXG5cdFx0XHRyZXR1cm4gZWxlbWVudDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblxyXG5cdGV4cG9ydCBuYW1lc3BhY2UgRmV0Y2gge1xyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhY2hlZCh1cmw6IHN0cmluZyk6IFByb21pc2U8UmVzcG9uc2U+IHtcclxuXHRcdFx0bGV0IGNhY2hlID0gYXdhaXQgY2FjaGVzLm9wZW4oJ2ZldGNoJyk7XHJcblx0XHRcdGxldCByZXNwb25zZSA9IGF3YWl0IGNhY2hlLm1hdGNoKHVybCk7XHJcblx0XHRcdGlmIChyZXNwb25zZSkge1xyXG5cdFx0XHRcdHJldHVybiByZXNwb25zZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwgeyBjcmVkZW50aWFsczogJ2luY2x1ZGUnIH0pO1xyXG5cdFx0XHRjYWNoZS5wdXQodXJsLCByZXNwb25zZS5jbG9uZSgpKTtcclxuXHRcdFx0cmV0dXJuIHJlc3BvbnNlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWNoZWREb2ModXJsOiBzdHJpbmcpOiBQcm9taXNlPERvY3VtZW50PiB7XHJcblx0XHRcdGxldCByZXNwb25zZSA9IGF3YWl0IGNhY2hlZCh1cmwpO1xyXG5cdFx0XHRsZXQgdGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcclxuXHRcdFx0bGV0IHBhcnNlciA9IG5ldyBET01QYXJzZXIoKTtcclxuXHRcdFx0cmV0dXJuIHBhcnNlci5wYXJzZUZyb21TdHJpbmcodGV4dCwgJ3RleHQvaHRtbCcpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBkb2ModXJsOiBzdHJpbmcpOiBQcm9taXNlPERvY3VtZW50PiB7XHJcblx0XHRcdGxldCBwID0gUHJvbWlzZS5lbXB0eSgpO1xyXG5cdFx0XHRsZXQgb1JlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG5cdFx0XHRvUmVxLm9ubG9hZCA9IHAucjtcclxuXHRcdFx0b1JlcS5yZXNwb25zZVR5cGUgPSAnZG9jdW1lbnQnO1xyXG5cdFx0XHRvUmVxLm9wZW4oXCJnZXRcIiwgdXJsLCB0cnVlKTtcclxuXHRcdFx0b1JlcS5zZW5kKCk7XHJcblx0XHRcdGF3YWl0IHA7XHJcblx0XHRcdHJldHVybiBvUmVxLnJlc3BvbnNlWE1MO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0dHlwZSBMaW5rID0gRWxlbWVudCB8IHN0cmluZyB8IGBodHRwJHtzdHJpbmd9YDtcclxuXHJcblx0ZXhwb3J0IGNsYXNzIHBhZ2luYXRlIHtcclxuXHRcdHN0YXRpYyBhY3RpdmUgPSBmYWxzZTtcclxuXHRcdHN0YXRpYyBxdWV1ZWQgPSAwO1xyXG5cdFx0c3RhdGljIHdpcCA9IGZhbHNlO1xyXG5cdFx0c3RhdGljIGRvYzogRG9jdW1lbnQ7XHJcblx0XHRzdGF0aWMgaW5pdCgpIHtcclxuXHRcdFx0aWYgKHBhZ2luYXRlLmFjdGl2ZSlcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdHBhZ2luYXRlLmFjdGl2ZSA9IHRydWU7XHJcblxyXG5cdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGV2ZW50KSA9PiB7XHJcblx0XHRcdFx0aWYgKGV2ZW50LmJ1dHRvbiAhPSAxKVxyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdGxldCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgRWxlbWVudDtcclxuXHRcdFx0XHRpZiAodGFyZ2V0LmNsb3Nlc3QoJ2EnKSlcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR0YXJnZXQuZW1pdCgncGFnaW5hdGlvbnJlcXVlc3QnLCBldmVudCk7XHJcblx0XHRcdFx0dGhpcy5wYWdpbmF0aW9ucmVxdWVzdChldmVudCk7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChldmVudCkgPT4ge1xyXG5cdFx0XHRcdGlmIChldmVudC5jb2RlICE9ICdBbHRSaWdodCcpXHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHRsZXQgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIEVsZW1lbnQ7XHJcblx0XHRcdFx0dGFyZ2V0LmVtaXQoJ3BhZ2luYXRpb25yZXF1ZXN0JywgZXZlbnQpO1xyXG5cdFx0XHRcdHRoaXMucGFnaW5hdGlvbnJlcXVlc3QoZXZlbnQpO1xyXG5cdFx0XHR9KTtcclxuXHRcdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BhZ2luYXRpb25lbmQnLCAoZXZlbnQpID0+IHtcclxuXHRcdFx0XHRwYWdpbmF0ZS53aXAgPSBmYWxzZTtcclxuXHRcdFx0XHRpZiAocGFnaW5hdGUucXVldWVkKSB7XHJcblx0XHRcdFx0XHRwYWdpbmF0ZS5xdWV1ZWQtLTtcclxuXHRcdFx0XHRcdHBhZ2luYXRlLnJ1bigpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0XHRzdGF0aWMgcGFnaW5hdGlvbnJlcXVlc3QoZXZlbnQpIHtcclxuXHRcdFx0Z2V0U2VsZWN0aW9uKCkucmVtb3ZlQWxsUmFuZ2VzKCk7XHJcblx0XHRcdGlmIChldmVudC5zaGlmdEtleSB8fCBldmVudC5kZXRhaWw/LnNoaWZ0S2V5XHJcblx0XHRcdFx0fHwgZXZlbnQuYnV0dG9ucyA9PSAxKSB7XHJcblx0XHRcdFx0cGFnaW5hdGUucXVldWVkICs9IDk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHBhZ2luYXRlLndpcCkge1xyXG5cdFx0XHRcdHBhZ2luYXRlLnF1ZXVlZCsrO1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHRwYWdpbmF0ZS5ydW4oKTtcclxuXHRcdH1cclxuXHRcdHN0YXRpYyBydW4oKSB7XHJcblx0XHRcdHBhZ2luYXRlLndpcCA9IHRydWU7XHJcblx0XHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5lbWl0KCdwYWdpbmF0aW9uc3RhcnQnKTtcclxuXHRcdH1cclxuXHRcdHN0YXRpYyBvbnJ1bihjb25kaXRpb24sIGZuID0gY29uZGl0aW9uKSB7XHJcblx0XHRcdHBhZ2luYXRlLmluaXQoKTtcclxuXHRcdFx0aWYgKCFjb25kaXRpb24pIHJldHVybjtcclxuXHRcdFx0Y29uc29sZS5sb2coJ3BhZ2luYXRlIHJlZ2lzdGVyZWQ6JywgZm4pO1xyXG5cdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdwYWdpbmF0aW9uc3RhcnQnLCBmbik7XHJcblx0XHR9XHJcblx0XHRzdGF0aWMgb25jaGFuZ2UoY29uZGl0aW9uLCBmbiA9IGNvbmRpdGlvbikge1xyXG5cdFx0XHRwYWdpbmF0ZS5pbml0KCk7XHJcblx0XHRcdGlmICghY29uZGl0aW9uKSByZXR1cm47XHJcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BhZ2luYXRpb25jaGFuZ2UnLCBmbik7XHJcblx0XHR9XHJcblx0XHRzdGF0aWMgZW5kKCkge1xyXG5cdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZW1pdCgncGFnaW5hdGlvbmVuZCcpO1xyXG5cdFx0fVxyXG5cdFx0c3RhdGljIG9uZW5kKGNvbmRpdGlvbiwgZm4gPSBjb25kaXRpb24pIHtcclxuXHRcdFx0aWYgKCFjb25kaXRpb24pIHJldHVybjtcclxuXHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncGFnaW5hdGlvbmVuZCcsIGZuKTtcclxuXHRcdH1cclxuXHRcdHN0YXRpYyB0b0hyZWYobGluazogTGluaykge1xyXG5cdFx0XHRpZiAodHlwZW9mIGxpbmsgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRpZiAobGluay5zdGFydHNXaXRoKCdodHRwJykpIHtcclxuXHRcdFx0XHRcdHJldHVybiBsaW5rO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRsaW5rID0gcShsaW5rKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gKGxpbmsgYXMgSFRNTEFuY2hvckVsZW1lbnQpLmhyZWY7XHJcblx0XHR9XHJcblx0XHRzdGF0aWMgdG9BbmNob3IobGluazogTGluayk6IEhUTUxBbmNob3JFbGVtZW50IHtcclxuXHRcdFx0aWYgKHR5cGVvZiBsaW5rID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0aWYgKGxpbmsuc3RhcnRzV2l0aCgnaHR0cCcpKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZWxtKGBhW2hyZWY9JHtsaW5rfV1gKSBhcyBIVE1MQW5jaG9yRWxlbWVudDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHEobGluayk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGxpbmsgYXMgSFRNTEFuY2hvckVsZW1lbnQ7XHJcblx0XHR9XHJcblx0XHRzdGF0aWMgYXN5bmMgYURvYyhsaW5rOiBMaW5rKSB7XHJcblx0XHRcdGxldCBhID0gdGhpcy50b0FuY2hvcihsaW5rKTtcclxuXHRcdFx0aWYgKCFhKSB0aHJvdyBuZXcgRXJyb3IoJ25vdCBhIGxpbmsnKTtcclxuXHRcdFx0YS5jbGFzc0xpc3QuYWRkKCdwYWdpbmF0ZS1zcGluJyk7XHJcblx0XHRcdGxldCBkb2MgPSBhd2FpdCBmZXRjaC5kb2MoYS5ocmVmKTtcclxuXHRcdFx0dGhpcy5kb2MgPSBkb2M7XHJcblx0XHRcdHJldHVybiBkb2M7XHJcblx0XHR9XHJcblx0XHRzdGF0aWMgYXN5bmMgYUNhY2hlZERvYyhsaW5rOiBMaW5rKSB7XHJcblx0XHRcdGxldCBhID0gdGhpcy50b0FuY2hvcihsaW5rKTtcclxuXHRcdFx0aWYgKCFhKSB0aHJvdyBuZXcgRXJyb3IoJ25vdCBhIGxpbmsnKTtcclxuXHRcdFx0YS5jbGFzc0xpc3QuYWRkKCdwYWdpbmF0ZS1zcGluJyk7XHJcblx0XHRcdGxldCBkb2MgPSBhd2FpdCBmZXRjaC5jYWNoZWQuZG9jKGEuaHJlZik7XHJcblx0XHRcdGEuY2xhc3NMaXN0LnJlbW92ZSgncGFnaW5hdGUtc3BpbicpO1xyXG5cdFx0XHR0aGlzLmRvYyA9IGRvYztcclxuXHRcdFx0cmV0dXJuIGRvYztcclxuXHRcdH1cclxuXHRcdHN0YXRpYyBhcHBlbmRDaGlsZHJlbihkb2MsIHNvdXJjZSwgdGFyZ2V0ID0gc291cmNlKSB7XHJcblx0XHRcdGlmICh0eXBlb2YgZG9jID09ICdzdHJpbmcnKVxyXG5cdFx0XHRcdHJldHVybiB0aGlzLmFwcGVuZENoaWxkcmVuKHRoaXMuZG9jLCBkb2MsIHNvdXJjZSk7XHJcblx0XHRcdGxldCBjaGlsZHJlbiA9IFsuLi5kb2MucShzb3VyY2UpLmNoaWxkcmVuXTtcclxuXHRcdFx0cSh0YXJnZXQpLmFwcGVuZCguLi5jaGlsZHJlbik7XHJcblx0XHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5lbWl0KCdwYWdpbmF0aW9uY2hhbmdlJywgY2hpbGRyZW4pO1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH1cclxuXHRcdHN0YXRpYyBhZnRlckxhc3QoZG9jLCBzb3VyY2UsIHRhcmdldCA9IHNvdXJjZSkge1xyXG5cdFx0XHRpZiAodHlwZW9mIGRvYyA9PSAnc3RyaW5nJylcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hZnRlckxhc3QodGhpcy5kb2MsIGRvYywgc291cmNlKTtcclxuXHRcdFx0bGV0IGNoaWxkcmVuID0gZG9jLnFxKHNvdXJjZSk7XHJcblx0XHRcdGxldCBsYXN0ID0gcXEodGFyZ2V0KS5wb3AoKTtcclxuXHRcdFx0bGFzdC5hZnRlciguLi5jaGlsZHJlbik7XHJcblx0XHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5lbWl0KCdwYWdpbmF0aW9uY2hhbmdlJyk7XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fVxyXG5cdFx0c3RhdGljIHJlcGxhY2UoZG9jOiBEb2N1bWVudCwgc291cmNlOiBzdHJpbmcsIHRhcmdldD86IHN0cmluZyk6IHR5cGVvZiBwYWdpbmF0ZTtcclxuXHRcdHN0YXRpYyByZXBsYWNlKHNvdXJjZTogc3RyaW5nLCB0YXJnZXQ/OiBzdHJpbmcpOiB0eXBlb2YgcGFnaW5hdGU7XHJcblx0XHRzdGF0aWMgcmVwbGFjZShkb2M6IERvY3VtZW50IHwgc3RyaW5nLCBzb3VyY2U6IHN0cmluZywgdGFyZ2V0ID0gc291cmNlKTogdHlwZW9mIHBhZ2luYXRlIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBkb2MgPT0gJ3N0cmluZycpXHJcblx0XHRcdFx0cmV0dXJuIHRoaXMucmVwbGFjZSh0aGlzLmRvYywgZG9jLCBzb3VyY2UpO1xyXG5cdFx0XHRsZXQgY2hpbGQgPSBkb2MucShzb3VyY2UpXHJcblx0XHRcdHEodGFyZ2V0KS5yZXBsYWNlV2l0aChjaGlsZCk7XHJcblx0XHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5lbWl0KCdwYWdpbmF0aW9uY2hhbmdlJywgW2NoaWxkXSk7XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fVxyXG5cclxuXHRcdHN0YXRpYyBwcmVmZXRjaChlbmFibGVkOiBhbnksIGxpbms6IHN0cmluZyB8IEVsZW1lbnQpOiB0eXBlb2YgcGFnaW5hdGU7XHJcblx0XHRzdGF0aWMgcHJlZmV0Y2gobGluazogc3RyaW5nIHwgRWxlbWVudCk6IHR5cGVvZiBwYWdpbmF0ZTtcclxuXHRcdHN0YXRpYyBwcmVmZXRjaChlbmFibGVkOiBhbnksIGxpbms/OiBzdHJpbmcgfCBFbGVtZW50KSB7XHJcblx0XHRcdGlmICghbGluaykge1xyXG5cdFx0XHRcdGxpbmsgPSBlbmFibGVkO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGlmICghZW5hYmxlZCkgcmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICh0eXBlb2YgbGluayA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdGlmICghbGluay5zdGFydHNXaXRoKCdodHRwJykpIHtcclxuXHRcdFx0XHRcdGxpbmsgPSBxKGxpbmspO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAodHlwZW9mIGxpbmsgIT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRsaW5rID0gKGxpbmsgYXMgSFRNTEFuY2hvckVsZW1lbnQpLmhyZWY7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxtKGBsaW5rW3JlbD1cInByZWZldGNoXCJdW2hyZWY9XCIke2xpbmt9XCJdYCkuYXBwZW5kVG8oJ2hlYWQnKTtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9XHJcblxyXG5cdFx0c3RhdGljIGltYWdlU2Nyb2xsaW5nQWN0aXZlID0gZmFsc2U7XHJcblx0XHRzdGF0aWMgaW1hZ2VTY3JvbGxpbmcoc2VsZWN0b3I/OiBzdHJpbmcpIHtcclxuXHRcdFx0aWYgKHRoaXMuaW1hZ2VTY3JvbGxpbmdBY3RpdmUpIHJldHVybjtcclxuXHRcdFx0aWYgKHNlbGVjdG9yKSB0aGlzLmltZ1NlbGVjdG9yID0gc2VsZWN0b3I7XHJcblx0XHRcdHRoaXMuaW1hZ2VTY3JvbGxpbmdBY3RpdmUgPSB0cnVlO1xyXG5cdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFxyXG5cdFx0XHRcdCdtb3VzZXdoZWVsJyxcclxuXHRcdFx0XHQoZTogYW55KSA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLnNjcm9sbFdob2xlSW1hZ2UoLU1hdGguc2lnbihlLndoZWVsRGVsdGFZKSk7XHJcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFx0fSwge1xyXG5cdFx0XHRcdHBhc3NpdmU6IGZhbHNlXHJcblx0XHRcdH1cclxuXHRcdFx0KTtcclxuXHJcblx0XHR9XHJcblx0XHRzdGF0aWMgaW1nU2VsZWN0b3IgPSAnaW1nJztcclxuXHRcdHN0YXRpYyBpbWdUb1dpbmRvd0NlbnRlcihpbWcpIHtcclxuXHRcdFx0bGV0IHJlY3QgPSBpbWcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblx0XHRcdHJldHVybiByZWN0LnkgKyByZWN0LmhlaWdodCAvIDIgLSBpbm5lckhlaWdodCAvIDI7XHJcblx0XHR9XHJcblx0XHRzdGF0aWMgZ2V0SW1hZ2VzKCkge1xyXG5cdFx0XHRyZXR1cm4gcXEodGhpcy5pbWdTZWxlY3Rvcik7XHJcblx0XHR9XHJcblx0XHRzdGF0aWMgZ2V0Q2VudHJhbEltZygpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuZ2V0SW1hZ2VzKCkudnNvcnQoaW1nID0+IE1hdGguYWJzKHRoaXMuaW1nVG9XaW5kb3dDZW50ZXIoaW1nKSkpWzBdO1xyXG5cdFx0fVxyXG5cdFx0c3RhdGljIHNjcm9sbFdob2xlSW1hZ2UoZGlyID0gMSkge1xyXG5cdFx0XHRsZXQgaW1nID0gdGhpcy5nZXRDZW50cmFsSW1nKCk7XHJcblx0XHRcdGxldCBpbWFnZXMgPSB0aGlzLmdldEltYWdlcygpO1xyXG5cdFx0XHRsZXQgaW5kZXggPSBpbWFnZXMuaW5kZXhPZihpbWcpO1xyXG5cdFx0XHRsZXQgbmV4dEltZyA9IGltYWdlc1tpbmRleCArIChkaXIgPT0gMSA/IDEgOiAtMSldO1xyXG5cdFx0XHRsZXQgZGVsdGEgPSB0aGlzLmltZ1RvV2luZG93Q2VudGVyKG5leHRJbWcpO1xyXG5cdFx0XHRzY3JvbGxCeSgwLCBkZWx0YSk7XHJcblx0XHR9XHJcblx0fTtcclxuXHJcblxyXG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vQXJyYXkudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9EYXRlTm93SGFjay50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL0VsZW1lbnQudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9lbG0udHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9mZXRjaC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL09iamVjdC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL3BhZ2luYXRlLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vUHJvbWlzZS50c1wiIC8+XHJcblxyXG5cclxuXHJcblxyXG5uYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIF9faW5pdF9fKHdpbmRvdzogV2luZG93KTogXCJpbml0ZWRcIiB8IFwiYWxyZWFkeSBpbml0ZWRcIiB7XHJcblx0XHRpZiAoIXdpbmRvdykgd2luZG93ID0gZ2xvYmFsVGhpcy53aW5kb3cgYXMgV2luZG93O1xyXG5cclxuXHRcdHdpbmRvdy5lbG0gPSBFbG0uZWxtO1xyXG5cdFx0d2luZG93LnEgPSB3aW5xLnE7XHJcblx0XHR3aW5kb3cucXEgPSB3aW5xLnFxO1xyXG5cdFx0b2JqZWN0LmRlZmluZVZhbHVlKEVsZW1lbnQucHJvdG90eXBlLCAncScsIGVsZW1lbnQucSk7XHJcblx0XHRvYmplY3QuZGVmaW5lVmFsdWUoRWxlbWVudC5wcm90b3R5cGUsICdxcScsIGVsZW1lbnQucXEpO1xyXG5cdFx0b2JqZWN0LmRlZmluZVZhbHVlKEVsZW1lbnQucHJvdG90eXBlLCAnYXBwZW5kVG8nLCBlbGVtZW50LmFwcGVuZFRvKTtcclxuXHRcdG9iamVjdC5kZWZpbmVWYWx1ZShFbGVtZW50LnByb3RvdHlwZSwgJ2VtaXQnLCBlbGVtZW50LmVtaXQpO1xyXG5cdFx0b2JqZWN0LmRlZmluZVZhbHVlKERvY3VtZW50LnByb3RvdHlwZSwgJ3EnLCBkb2NxLnEpO1xyXG5cdFx0b2JqZWN0LmRlZmluZVZhbHVlKERvY3VtZW50LnByb3RvdHlwZSwgJ3FxJywgZG9jcS5xcSk7XHJcblxyXG5cdFx0b2JqZWN0LmRlZmluZVZhbHVlKFByb21pc2UsICdlbXB0eScsIHByb21pc2UuZW1wdHkpO1xyXG5cdFx0b2JqZWN0LmRlZmluZVZhbHVlKFByb21pc2UsICdmcmFtZScsIHByb21pc2UuZnJhbWUpO1xyXG5cdFx0b2JqZWN0LmRlZmluZVZhbHVlKFByb21pc2UsICdyYWYnLCBwcm9taXNlLmZyYW1lKTtcclxuXHJcblx0XHR3aW5kb3cuZmV0Y2guY2FjaGVkID0gRmV0Y2guY2FjaGVkIGFzIGFueTtcclxuXHRcdHdpbmRvdy5mZXRjaC5kb2MgPSBGZXRjaC5kb2MgYXMgYW55O1xyXG5cdFx0d2luZG93LmZldGNoLmNhY2hlZC5kb2MgPSBGZXRjaC5jYWNoZWREb2M7XHJcblx0XHR3aW5kb3cuZmV0Y2guZG9jLmNhY2hlZCA9IEZldGNoLmNhY2hlZERvYztcclxuXHRcdHdpbmRvdy5mZXRjaC5jYWNoZWREb2MgPSBGZXRjaC5jYWNoZWREb2M7XHJcblxyXG5cdFx0b2JqZWN0LmRlZmluZVZhbHVlKE9iamVjdCwgJ2RlZmluZVZhbHVlJywgb2JqZWN0LmRlZmluZVZhbHVlKTtcclxuXHRcdG9iamVjdC5kZWZpbmVWYWx1ZShPYmplY3QsICdkZWZpbmVHZXR0ZXInLCBvYmplY3QuZGVmaW5lR2V0dGVyKTtcclxuXHRcdE9iamVjdC5kZWZpbmVWYWx1ZShPYmplY3QsICdtYXAnLCBvYmplY3QubWFwKTtcclxuXHJcblx0XHRvYmplY3QuZGVmaW5lVmFsdWUoQXJyYXksICdtYXAnLCBhcnJheS5tYXApO1xyXG5cdFx0b2JqZWN0LmRlZmluZVZhbHVlKEFycmF5LnByb3RvdHlwZSwgJ3BtYXAnLCBhcnJheS5wbWFwKTtcclxuXHRcdG9iamVjdC5kZWZpbmVWYWx1ZShBcnJheS5wcm90b3R5cGUsICd2c29ydCcsIGFycmF5LnZzb3J0KTtcclxuXHJcblx0XHR3aW5kb3cucGFnaW5hdGUgPSBQb29wSnMucGFnaW5hdGU7XHJcblx0XHR3aW5kb3cuRGF0ZU5vd0hhY2sgPSBQb29wSnMuRGF0ZU5vd0hhY2suRGF0ZU5vd0hhY2s7XHJcblxyXG5cdFx0b2JqZWN0LmRlZmluZVZhbHVlKHdpbmRvdywgJ19faW5pdF9fJywgJ2FscmVhZHkgaW5pdGVkJyk7XHJcblx0XHRyZXR1cm4gJ2luaXRlZCc7XHJcblx0fVxyXG5cclxuXHRvYmplY3QuZGVmaW5lR2V0dGVyKHdpbmRvdywgJ19faW5pdF9fJywgKCkgPT4gX19pbml0X18od2luZG93KSk7XHJcblxyXG5cdGlmICh3aW5kb3cubG9jYWxTdG9yYWdlLl9faW5pdF9fKSB7XHJcblx0XHR3aW5kb3cuX19pbml0X187XHJcblx0fVxyXG5cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cdGV4cG9ydCB0eXBlIFZhbHVlT2Y8VD4gPSBUW2tleW9mIFRdO1xyXG5cdGV4cG9ydCB0eXBlIE1hcHBlZE9iamVjdDxULCBWPiA9IHtbUCBpbiBrZXlvZiBUXTogVn07XHJcbn1cclxuXHJcblxyXG5kZWNsYXJlIGNvbnN0IF9faW5pdF9fOiBcImluaXRlZFwiIHwgXCJhbHJlYWR5IGluaXRlZFwiO1xyXG5kZWNsYXJlIGNvbnN0IGVsbTogdHlwZW9mIFBvb3BKcy5FbG0uZWxtO1xyXG5kZWNsYXJlIGNvbnN0IHE6IHR5cGVvZiBQb29wSnMud2lucS5xO1xyXG5kZWNsYXJlIGNvbnN0IHFxOiB0eXBlb2YgUG9vcEpzLndpbnEucXE7XHJcbmRlY2xhcmUgY29uc3QgcGFnaW5hdGU6IHR5cGVvZiBQb29wSnMucGFnaW5hdGU7XHJcbmRlY2xhcmUgY29uc3QgRGF0ZU5vd0hhY2s6IHR5cGVvZiBQb29wSnMuRGF0ZU5vd0hhY2suRGF0ZU5vd0hhY2s7XHJcbmRlY2xhcmUgbmFtZXNwYWNlIGZldGNoIHtcclxuXHRleHBvcnQgY29uc3QgY2FjaGVkOiB0eXBlb2YgUG9vcEpzLkZldGNoLmNhY2hlZCAmIHsgZG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoLmNhY2hlZERvYyB9O1xyXG5cdGV4cG9ydCBjb25zdCBkb2M6IHR5cGVvZiBQb29wSnMuRmV0Y2guZG9jICYgeyBjYWNoZWQ6IHR5cGVvZiBQb29wSnMuRmV0Y2guY2FjaGVkRG9jIH07XHJcblx0ZXhwb3J0IGNvbnN0IGNhY2hlZERvYzogdHlwZW9mIFBvb3BKcy5GZXRjaC5jYWNoZWREb2M7XHJcbn1cclxuXHJcbmludGVyZmFjZSBXaW5kb3cge1xyXG5cdHJlYWRvbmx5IF9faW5pdF9fOiBcImluaXRlZFwiIHwgXCJhbHJlYWR5IGluaXRlZFwiO1xyXG5cdGVsbTogdHlwZW9mIFBvb3BKcy5FbG0uZWxtO1xyXG5cdHE6IHR5cGVvZiBQb29wSnMud2lucS5xO1xyXG5cdHFxOiB0eXBlb2YgUG9vcEpzLndpbnEucXE7XHJcblx0cGFnaW5hdGU6IHR5cGVvZiBQb29wSnMucGFnaW5hdGU7XHJcblx0RGF0ZU5vd0hhY2s6IHR5cGVvZiBQb29wSnMuRGF0ZU5vd0hhY2suRGF0ZU5vd0hhY2s7XHJcblx0ZmV0Y2g6IHtcclxuXHRcdChpbnB1dDogUmVxdWVzdEluZm8sIGluaXQ/OiBSZXF1ZXN0SW5pdCk6IFByb21pc2U8UmVzcG9uc2U+O1xyXG5cdFx0Y2FjaGVkOiB0eXBlb2YgUG9vcEpzLkZldGNoLmNhY2hlZCAmIHsgZG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoLmNhY2hlZERvYyB9O1xyXG5cdFx0ZG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoLmRvYyAmIHsgY2FjaGVkOiB0eXBlb2YgUG9vcEpzLkZldGNoLmNhY2hlZERvYyB9O1xyXG5cdFx0Y2FjaGVkRG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoLmNhY2hlZERvYztcclxuXHR9XHJcbn1cclxuXHJcbmludGVyZmFjZSBFbGVtZW50IHtcclxuXHRxOiB0eXBlb2YgUG9vcEpzLmVsZW1lbnQucTtcclxuXHRxcTogdHlwZW9mIFBvb3BKcy5lbGVtZW50LnFxO1xyXG5cdGFwcGVuZFRvOiB0eXBlb2YgUG9vcEpzLmVsZW1lbnQuYXBwZW5kVG87XHJcblx0ZW1pdDogdHlwZW9mIFBvb3BKcy5lbGVtZW50LmVtaXQ7XHJcbn1cclxuXHJcbmludGVyZmFjZSBEb2N1bWVudCB7XHJcblx0cTogdHlwZW9mIFBvb3BKcy5kb2NxLnE7XHJcblx0cXE6IHR5cGVvZiBQb29wSnMuZG9jcS5xcTtcclxufVxyXG5cclxuaW50ZXJmYWNlIE9iamVjdENvbnN0cnVjdG9yIHtcclxuXHRkZWZpbmVWYWx1ZTogdHlwZW9mIFBvb3BKcy5vYmplY3QuZGVmaW5lVmFsdWU7XHJcblx0ZGVmaW5lR2V0dGVyOiB0eXBlb2YgUG9vcEpzLm9iamVjdC5kZWZpbmVHZXR0ZXI7XHJcblx0bWFwOiB0eXBlb2YgUG9vcEpzLm9iamVjdC5tYXA7XHJcbn1cclxuaW50ZXJmYWNlIFByb21pc2VDb25zdHJ1Y3RvciB7XHJcblx0ZW1wdHk6IHR5cGVvZiBQb29wSnMucHJvbWlzZS5lbXB0eTtcclxuXHRmcmFtZTogdHlwZW9mIFBvb3BKcy5wcm9taXNlLmZyYW1lO1xyXG5cdHJhZjogdHlwZW9mIFBvb3BKcy5wcm9taXNlLmZyYW1lO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgQXJyYXk8VD4ge1xyXG5cdHZzb3J0OiB0eXBlb2YgUG9vcEpzLmFycmF5LnZzb3J0O1xyXG5cdHBtYXA6IHR5cGVvZiBQb29wSnMuYXJyYXkucG1hcDtcclxufVxyXG5pbnRlcmZhY2UgQXJyYXlDb25zdHJ1Y3RvciB7XHJcblx0bWFwOiB0eXBlb2YgUG9vcEpzLmFycmF5Lm1hcDtcclxufVxyXG5cclxuaW50ZXJmYWNlIERhdGVDb25zdHJ1Y3RvciB7XHJcblx0X25vdygpOiBudW1iZXI7XHJcbn1cclxuaW50ZXJmYWNlIERhdGUge1xyXG5cdF9nZXRUaW1lKCk6IG51bWJlcjtcclxufSJdfQ==