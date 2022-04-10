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
            return Object.assign(new Promise((r, j) => {
                resolve = r;
                reject = j;
            }), {
                resolve, reject,
                r: resolve, j: reject,
            });
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
        function at(index) {
            return index >= 0 ? this[index] : this[this.length + index];
        }
        ArrayExtension.at = at;
        function findLast(predicate, thisArg) {
            for (let i = this.length - 1; i >= 0; i--) {
                if (predicate(this[i], i, this))
                    return this[i];
            }
        }
        ArrayExtension.findLast = findLast;
        class PMap {
            /** Original array */
            source = [];
            /** Async element converter function */
            mapper = (e) => e;
            /** Max number of requests at once.
             *  *May* be changed in runtime */
            threads = 5;
            /** Max distance between the olders incomplete and newest active elements.
             *  *May* be changed in runtime */
            window = Infinity;
            /** Unfinished result array */
            results = [];
            /** Promises for every element */
            requests = [];
            beforeStart = () => { };
            afterComplete = () => { };
            /** Length of the array */
            length = -1;
            /** The number of elements finished converting */
            completed = -1;
            /** Threads currently working
             *  in the mapper function: including the current one */
            activeThreads = -1;
            lastStarted = -1;
            allTasksDone;
            anyTaskResolved;
            constructor(source) {
                this.allTasksDone = Object.assign(this.emptyResult(), { pmap: this });
                this.anyTaskResolved = this.emptyResult();
                for (let k of Object.keys(this)) {
                    if (typeof source[k] == typeof this[k]) {
                        this[k] = source[k];
                    }
                    else if (source[k]) {
                        throw new Error(`PMap: invalid constructor parameter: property ${k}: expected ${typeof this[k]}, but got ${typeof source[k]}`);
                    }
                }
            }
            async startTask(arrayIndex) {
                this.activeThreads++;
                let e = this.source[arrayIndex];
                await this.beforeStart({
                    e: this.source[arrayIndex],
                    i: arrayIndex,
                    a: this.source,
                    v: undefined,
                    r: this.results,
                    pmap: this,
                });
                this.lastStarted = arrayIndex;
                let v;
                try {
                    v = await this.mapper(this.source[arrayIndex], arrayIndex, this.source, this);
                }
                catch (e) {
                    v = e;
                }
                this.results[arrayIndex] = v;
                this.requests[arrayIndex].resolve(v);
                this.completed++;
                await this.afterComplete({
                    e: this.source[arrayIndex],
                    i: arrayIndex,
                    a: this.source,
                    v: v,
                    r: this.results,
                    pmap: this,
                });
                this.activeThreads--;
                this.anyTaskResolved.resolve();
            }
            async run_internal() {
                for (let arrayIndex = 0; arrayIndex < this.length; arrayIndex++) {
                    while (this.activeThreads >= this.threads) {
                        await this.anyTaskResolved;
                        this.anyTaskResolved = this.emptyResult();
                    }
                    await this.requests[arrayIndex - this.window];
                    this.startTask(arrayIndex);
                }
                while (this.activeThreads > 0) {
                    await this.anyTaskResolved;
                    this.anyTaskResolved = this.emptyResult();
                }
                this.allTasksDone.resolve(this.results);
                return this.allTasksDone;
            }
            run() {
                this.prepare();
                this.run_internal();
                return this.allTasksDone;
            }
            pause() {
                if (this.activeThreads < this.length + this.threads)
                    this.activeThreads += this.length + this.threads;
            }
            unpause() {
                if (this.activeThreads >= this.length + this.threads)
                    this.activeThreads -= this.length + this.threads;
                this.anyTaskResolved.r();
            }
            cancel() {
                this.mapper = (() => { });
                this.beforeStart = () => { };
                this.afterComplete = () => { };
            }
            prepare() {
                if (this.length == -1)
                    this.length = this.source.length;
                if (this.results.length == 0) {
                    this.results = Array(this.length);
                }
                if (this.requests.length == 0) {
                    this.requests = this.source.map(e => this.emptyResult());
                }
                if (this.completed < 0)
                    this.completed = 0;
                if (this.activeThreads < 0)
                    this.activeThreads = 0;
                if (this.lastStarted < -1)
                    this.lastStarted = -1;
                this.anyTaskResolved = this.emptyResult();
                Object.assign(this.allTasksDone, { pmap: this });
                return this;
            }
            emptyResult() {
                let resolve;
                let reject;
                let p = new Promise((r, j) => {
                    resolve = r;
                    reject = j;
                });
                return Object.assign(p, { resolve, reject, r: resolve, j: reject });
            }
            static this_pmap(mapper, options = {}) {
                if (options == true)
                    options = Infinity;
                if (typeof options == 'number')
                    options = { threads: options };
                let pmap = new PMap({ source: this, mapper, ...options });
                return pmap.run();
            }
            static pmap(array, mapper, options = {}) {
                if (options == true)
                    options = Infinity;
                if (typeof options == 'number')
                    options = { threads: options };
                let pmap = new PMap({ source: array, mapper, ...options });
                return pmap.run();
            }
        }
        ArrayExtension.PMap = PMap;
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
        // export let speedMultiplier = 1;
        DateNowHack.performanceDeltaOffset = 0;
        DateNowHack.performanceStartRealtime = 0;
        DateNowHack.performanceStartTime = 0;
        DateNowHack.usedMethods = {
            date: true,
            performance: true,
        };
        function toFakeTime(realtime) {
            if (!DateNowHack.usedMethods.date)
                return realtime;
            return Math.floor((realtime - DateNowHack.startRealtime) * DateNowHack.speedMultiplier + DateNowHack.startTime + DateNowHack.deltaOffset);
        }
        DateNowHack.toFakeTime = toFakeTime;
        function toPerformanceFakeTime(realtime) {
            if (!DateNowHack.usedMethods.performance)
                return realtime;
            return (realtime - DateNowHack.performanceStartRealtime) * DateNowHack.speedMultiplier
                + DateNowHack.performanceStartTime + DateNowHack.performanceDeltaOffset;
        }
        DateNowHack.toPerformanceFakeTime = toPerformanceFakeTime;
        DateNowHack.bracketSpeeds = [0.05, 0.25, 1, 2, 5, 10, 20, 60, 120];
        function speedhack(speed = 1) {
            if (typeof speed != 'number') {
                throw new Error(`DateNowHack: invalid speed: ${speed}`);
            }
            activate();
            activatePerformance();
            DateNowHack.speedMultiplier = speed;
            location.hash = speed + '';
        }
        DateNowHack.speedhack = speedhack;
        function timejump(seconds) {
            activate();
            activatePerformance();
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
            if (mode == 'on') {
                PoopJs.kds = {
                    BracketLeft: () => switchSpeedhack(-1),
                    BracketRight: () => switchSpeedhack(1),
                };
            }
            else {
                delete PoopJs.kds.BracketLeft;
                delete PoopJs.kds.BracketRight;
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
        DateNowHack.performanceActivated = false;
        function activatePerformance() {
            performance._now ??= performance.now;
            DateNowHack.performanceStartTime = performance.now();
            DateNowHack.performanceStartRealtime = performance._now();
            DateNowHack.performanceDeltaOffset = 0;
            performance.now = () => toPerformanceFakeTime(performance._now());
            window._requestAnimationFrame ??= window.requestAnimationFrame;
            window.requestAnimationFrame = f => window._requestAnimationFrame(n => f(toPerformanceFakeTime(n)));
            DateNowHack.performanceActivated = true;
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
                return (this?.document ?? document).querySelector(selector);
            }
            WindowQ.q = q;
            function qq(selector) {
                return [...(this?.document ?? document).querySelectorAll(selector)];
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
    PoopJs.debug = false;
    let etc;
    (function (etc) {
        async function fullscreen(on) {
            let central = PoopJs.ImageScrollingExtension.imageScrollingActive && PoopJs.ImageScrollingExtension.getCentralImg();
            if (!document.fullscreenElement) {
                if (on == false)
                    return;
                await document.documentElement.requestFullscreen().catch(() => { });
            }
            else {
                if (on == true)
                    return;
                await document.exitFullscreen().catch(() => { });
            }
            if (central) {
                central.scrollIntoView();
            }
            return !!document.fullscreenElement;
        }
        etc.fullscreen = fullscreen;
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
                scrollBy(0, -Math.sign(event.deltaY) * innerHeight * etc.fastScroll.speed);
                event.preventDefault();
            }
            addEventListener('wheel', onwheel, { passive: false });
            etc.fastScroll.off = () => {
                etc.fastScroll.active = false;
                removeEventListener('wheel', onwheel);
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
        Object.defineProperty(etc, 'kds', {
            configurable: true,
            get() {
                let kds = initKds();
                Object.defineProperty(etc, 'kds', { value: kds });
                return kds;
            },
        });
        Object.defineProperty(PoopJs, 'kds', {
            get: () => etc.kds,
            set: (v) => Object.assign(etc.kds, v),
        });
        function generateKdsCodes(e) {
            let basePrefix = `${e.shiftKey ? '<' : ''}${e.ctrlKey ? '^' : ''}${e.altKey ? '>' : ''}`;
            let baseCode = e.code
                ? e.code.replace(/Key|Digit|Arrow|Left|Right/, '')
                : ['LMB', 'RMB', 'MMB'][e.button];
            let extraCode = e.code
                ? baseCode.replace('Control', 'Ctrl')
                : baseCode; // ['Left', 'Right', 'Middle'][e.button];
            let rawCode = e.code ?? baseCode;
            let keyCode = e.key ?? baseCode;
            let extraPrefix = basePrefix.replace(baseCode == 'Shift' ? '<' : baseCode == 'Control' ? '^' : baseCode == 'Alt' ? '>' : '', '');
            let codes = [baseCode, extraCode, rawCode, keyCode].flatMap(c => [basePrefix, extraPrefix].map(p => p + c));
            //.flatMap(e => [e, e.toUpperCase(), e.toLowerCase()]);
            codes.push(e.code ? 'key' : 'mouse');
            codes.push('any');
            return Array.from(new Set(codes));
        }
        etc.generateKdsCodes = generateKdsCodes;
        function kdsListener(e) {
            let codes = generateKdsCodes(e);
            Object.assign(e, { _codes: codes });
            for (let c of codes) {
                let listener = etc.kds[c];
                if (typeof listener == 'string') {
                    q(listener).click();
                }
                else if (typeof listener == 'function') {
                    etc.kds[c](e);
                }
            }
        }
        etc.kdsListener = kdsListener;
        function initKds() {
            addEventListener('keydown', kdsListener);
            addEventListener('mousedown', kdsListener);
            return {};
        }
    })(etc = PoopJs.etc || (PoopJs.etc = {}));
})(PoopJs || (PoopJs = {}));
var PoopJs;
(function (PoopJs) {
    function normalizeDeltaTime(maxAge) {
        if (typeof maxAge == 'number')
            return maxAge;
        if (typeof maxAge != 'string')
            return Infinity;
        const aToM = { s: 1e3, h: 3600e3, d: 24 * 3600e3, w: 7 * 24 * 3600e3, y: 365 * 24 * 3600e3 };
        let n = parseFloat(maxAge);
        let m = aToM[maxAge[maxAge.length - 1]];
        if (n != n || !m)
            throw new Error('invalid deltaTime');
        return n * m;
    }
    PoopJs.normalizeDeltaTime = normalizeDeltaTime;
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
        function toDur(dt) {
            dt = normalizeDeltaTime(dt);
            if (dt > 1e10)
                dt = Date.now() - dt;
            let split = (n, d) => [n % d, ~~(n / d)];
            let to2 = (n) => (n + '').padStart(2, '0');
            var [ms, s] = split(dt, 1000);
            var [s, m] = split(s, 60);
            var [m, h] = split(m, 60);
            var [h, d] = split(h, 24);
            var [d, w] = split(d, 7);
            return w > 1e3 ? 'forever' : w ? `${w}w${d}d` : d ? `${d}d${to2(h)}h` : h + m ? `${to2(h)}:${to2(m)}:${to2(s)}` : `${s + ~~ms / 1000}s`;
        }
        function isStale(cachedAt, maxAge) {
            if (maxAge == null)
                return false;
            return Date.now() - cachedAt >= normalizeDeltaTime(maxAge);
        }
        FetchExtension.isStale = isStale;
        async function cached(url, init = {}) {
            let now = performance.now();
            let cache = await openCache();
            let cacheUrl = (init.cacheUrl ?? url) + '';
            if (!cacheUrl.startsWith('http'))
                cacheUrl = url + '&&cacheUrl=' + cacheUrl;
            let response = await cache.match(cacheUrl);
            if (response) {
                response.cachedAt = +response.headers.get('cached-at') || 0;
                if (!isStale(response.cachedAt, normalizeDeltaTime(init.maxAge))) {
                    PoopJs.debug && console.log(`Cached response: ${toDur(response.cachedAt)} < c:${toDur(init.maxAge)}`, url);
                    return response;
                }
                PoopJs.debug && console.log(`Stale response: ${toDur(response.cachedAt)} > c:${toDur(init.maxAge)}`, url);
            }
            response =
                !init.xml ? await fetch(url, { ...FetchExtension.defaults, ...init })
                    : await xmlResponse(url, init);
            if (response.ok) {
                response.cachedAt = Date.now();
                let clone = response.clone();
                let init2 = {
                    status: clone.status, statusText: clone.statusText,
                    headers: [['cached-at', `${response.cachedAt}`], ...clone.headers.entries()]
                };
                let resultResponse = new Response(clone.body, init2);
                cache.put(cacheUrl, resultResponse);
                let dt = performance.now() - now;
                PoopJs.debug && console.log(`Loaded response: ${toDur(dt)} / c:${toDur(init.maxAge)}`, url);
            }
            else {
                PoopJs.debug && console.log(`Failed response: ${toDur(response.cachedAt)} / c:${toDur(init.maxAge)}`, url);
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
            let response = !init.xml ? await fetch(url, { ...FetchExtension.defaults, ...init })
                : await xmlResponse(url, init);
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
        async function xmlResponse(url, init = {}) {
            let p = PoopJs.PromiseExtension.empty();
            let oReq = new XMLHttpRequest();
            oReq.onload = p.r;
            oReq.responseType = 'document';
            oReq.open("get", url, true);
            oReq.send();
            await p;
            if (oReq.responseType != 'document')
                throw new Error('FIXME');
            return new Response(oReq.responseXML.documentElement.outerHTML, init);
        }
        FetchExtension.xmlResponse = xmlResponse;
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
            let d1 = cache.delete(url);
            let d2 = await idbDelete(url);
            return (await d1) || d2;
        }
        FetchExtension.uncache = uncache;
        async function isCached(url, options = {}) {
            if (options.indexedDb) {
                let dbJson = await idbGet(url);
                if (dbJson) {
                    return isStale(dbJson.cachedAt, normalizeDeltaTime(options.maxAge)) ? false : 'idb';
                }
                if (options.indexedDb == 'only')
                    return false;
            }
            let cache = await openCache();
            let response = await cache.match(url);
            if (!response)
                return false;
            if (options?.maxAge != null) {
                let cachedAt = +response.headers.get('cached-at') || 0;
                if (isStale(response.cachedAt, normalizeDeltaTime(options.maxAge))) {
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
            PoopJs.debug && console.log(`  = `, json);
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
        async function idbDelete(url) {
            let db = await openIdb();
            let t = db.transaction(['fetch'], 'readwrite');
            let rq = t.objectStore('fetch').delete(url);
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
                if (enabled == 'soft') {
                    this.softDisable = true;
                    this.disable('soft');
                }
                else if (enabled) {
                    this.softDisable = false;
                }
                else {
                    // enabled is falsy
                    this.softDisable = false;
                    this.disable();
                }
                this.style();
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
            get byName() {
                return Object.assign(Object.fromEntries(this.filters.map(e => [e.id, e])), Object.fromEntries(this.sorters.map(e => [e.id, e])), Object.fromEntries(this.modifiers.map(e => [e.id, e])), {
                    filters: Object.fromEntries(this.filters.map(e => [e.id, e])),
                    sorters: Object.fromEntries(this.sorters.map(e => [e.id, e])),
                    modifiers: Object.fromEntries(this.modifiers.map(e => [e.id, e])),
                });
            }
            addFilter(id, filter, data = {}) {
                if (!filter)
                    return this.addFilter(id, d => d[id]);
                return this.addItem(EntryFiltererExtension.Filter, this.filters, data, { id, filter });
            }
            addVFilter(id, filter, data) {
                if (typeof filter != 'function') {
                    return this.addVFilter(id, (v, d) => d[id] > v, filter);
                }
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
            _previousState = {
                allSortersOff: true,
                updateDuration: 0,
                finishedAt: 0,
            };
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
                    if (allOff != this._previousState.allSortersOff) {
                        entries.map((e, i) => {
                            if (allOff) {
                                e.classList.remove('ef-reorder');
                                e.parentElement.classList.remove('ef-reorder-container');
                            }
                            else {
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
            findEntries() {
                return typeof this.entrySelector == 'function' ? this.entrySelector() : qq(this.entrySelector);
            }
            _earliestUpdate = 0;
            update(reparse = this.reparsePending) {
                if (this.disabled == true)
                    return;
                if (this._previousState.updateDuration == 99_999) {
                    PoopJs.debug && console.log(`EF: update in progress`);
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            this.update(reparse);
                        }, 100);
                    });
                    return;
                }
                let cooldown = Math.min(10000, 8 * this._previousState.updateDuration);
                let earliestUpdate = this._previousState.finishedAt + cooldown;
                if (performance.now() < earliestUpdate) {
                    if (this._earliestUpdate != earliestUpdate) {
                        this._earliestUpdate = earliestUpdate;
                        if (PoopJs.debug) {
                            console.log(`EF: update delayed by ${~~(earliestUpdate - performance.now())}ms ${''} (last update duration: ${this._previousState.updateDuration})`);
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
                    if (!entries.length)
                        return;
                    PoopJs.debug && console.log(`Ef soft-enabled: x0=>x${entries.length}`, this.entrySelector, this);
                    this.enable();
                    return;
                }
                if (this.disabled != false)
                    throw 0;
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
            shiftRequestCount;
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
                if (PoopJs.debug) {
                    let active = this.canConsumeRequest() ? 'active' : 'inactive';
                    if (active == 'active')
                        PoopJs.debug && console.log(`Paginate instantiated (${active}): `, this.data);
                }
            }
            onPaginationRequest(event) {
                if (this.canConsumeRequest()) {
                    event.detail.consumed++;
                    let queued = !event.detail.reason?.shiftKey ? null : typeof this.shiftRequestCount == 'function' ? this.shiftRequestCount() : this.shiftRequestCount;
                    this.queued += queued ?? event.detail.count;
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
                let init = { maxAge, xml: this.data.xml };
                this.doc = !maxAge ? await fetch.doc(link, init) : await fetch.cached.doc(link, init);
                a?.classList.remove('paginate-spin');
                return this.doc;
            }
            static prefetch(source) {
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
                    maxAge: data.maxAge ?? (data.cache == true ? '1y' : data.cache),
                    start: data.start, modify: data.modify, end: data.end,
                    xml: data.xml,
                };
                this.shiftRequestCount = data.shifted;
                if (data.pager) {
                    let pager = toArray(data.pager);
                    this.data.doc = this.data.doc.flatMap(e => pager.map(p => `${p} ${e}`));
                    this.data.replace.push(...pager);
                }
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
                    this.data.prefetch.map(s => Paginate.prefetch(s));
                }
                this.onrun = async () => {
                    // if (!fixedData.condition()) return;
                    await this.data.start?.call(this);
                    this.data.click.map(e => document.q(e)?.click());
                    let doc = findOne(this.data.doc);
                    if (doc) {
                        await this.fetchDocument(doc, true, this.data.maxAge);
                        this.data.replace.map(s => this.replace(s));
                        this.data.after.map(s => this.after(s));
                        await this.data.modify?.call(this, this.doc);
                    }
                    await this.data.end?.call(this, doc && this.doc);
                };
            }
        }
        PaginateExtension.Paginate = Paginate;
        PaginateExtension.paginate = Object.setPrototypeOf(Object.assign(Paginate.staticCall, new Paginate()), Paginate);
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
        function saveScrollPosition() {
            let img = getCentralImg();
            let rect = img.getBoundingClientRect();
            let centerToWindowCenter = (rect.top + rect.bottom) / 2 - innerHeight / 2;
            let offset = centerToWindowCenter / rect.height;
            return { img, offset, load() { loadScrollPosition({ img, offset }); } };
        }
        ImageScrollingExtension.saveScrollPosition = saveScrollPosition;
        function loadScrollPosition(pos) {
            let rect = pos.img.getBoundingClientRect();
            let centerToWindowCenter = pos.offset * rect.height;
            let actualCenterToWindowCenter = (rect.top + rect.bottom) / 2 - innerHeight / 2;
            scrollBy(0, actualCenterToWindowCenter - centerToWindowCenter);
        }
        ImageScrollingExtension.loadScrollPosition = loadScrollPosition;
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
        PoopJs.ObjectExtension.defineValue(window.Element.prototype, 'q', PoopJs.QuerySelector.ElementQ.q);
        PoopJs.ObjectExtension.defineValue(window.Element.prototype, 'qq', PoopJs.QuerySelector.ElementQ.qq);
        PoopJs.ObjectExtension.defineValue(window.Element.prototype, 'appendTo', PoopJs.ElementExtension.appendTo);
        PoopJs.ObjectExtension.defineValue(window.Element.prototype, 'emit', PoopJs.ElementExtension.emit);
        PoopJs.ObjectExtension.defineValue(window.Document.prototype, 'q', PoopJs.QuerySelector.DocumentQ.q);
        PoopJs.ObjectExtension.defineValue(window.Document.prototype, 'qq', PoopJs.QuerySelector.DocumentQ.qq);
        PoopJs.ObjectExtension.defineValue(window.Promise, 'empty', PoopJs.PromiseExtension.empty);
        PoopJs.ObjectExtension.defineValue(window.Promise, 'frame', PoopJs.PromiseExtension.frame);
        PoopJs.ObjectExtension.defineValue(window.Promise, 'raf', PoopJs.PromiseExtension.frame);
        window.fetch.cached = PoopJs.FetchExtension.cached;
        window.fetch.doc = PoopJs.FetchExtension.doc;
        window.fetch.json = PoopJs.FetchExtension.json;
        window.fetch.cached.doc = PoopJs.FetchExtension.cachedDoc;
        window.fetch.doc.cached = PoopJs.FetchExtension.cachedDoc;
        window.fetch.cachedDoc = PoopJs.FetchExtension.cachedDoc;
        window.fetch.json.cached = PoopJs.FetchExtension.cachedJson;
        window.fetch.cached.json = PoopJs.FetchExtension.cachedJson;
        window.fetch.isCached = PoopJs.FetchExtension.isCached;
        PoopJs.ObjectExtension.defineValue(window.Response.prototype, 'cachedAt', 0);
        PoopJs.ObjectExtension.defineValue(window.Document.prototype, 'cachedAt', 0);
        PoopJs.ObjectExtension.defineValue(window.Object, 'defineValue', PoopJs.ObjectExtension.defineValue);
        PoopJs.ObjectExtension.defineValue(window.Object, 'defineGetter', PoopJs.ObjectExtension.defineGetter);
        // ObjectExtension.defineValue(Object, 'map', ObjectExtension.map);
        PoopJs.ObjectExtension.defineValue(window.Array, 'map', PoopJs.ArrayExtension.map);
        PoopJs.ObjectExtension.defineValue(window.Array.prototype, 'pmap', PoopJs.ArrayExtension.PMap.this_pmap);
        PoopJs.ObjectExtension.defineValue(window.Array.prototype, 'vsort', PoopJs.ArrayExtension.vsort);
        if (![].at)
            PoopJs.ObjectExtension.defineValue(window.Array.prototype, 'at', PoopJs.ArrayExtension.at);
        if (![].findLast)
            PoopJs.ObjectExtension.defineValue(window.Array.prototype, 'findLast', PoopJs.ArrayExtension.findLast);
        window.paginate = PoopJs.paginate;
        window.imageScrolling = PoopJs.ImageScrollingExtension;
        PoopJs.ObjectExtension.defineValue(window, '__init__', 'already inited');
        return 'inited';
    }
    PoopJs.__init__ = __init__;
    PoopJs.ObjectExtension.defineGetter(window, '__init__', () => __init__(window));
    Object.assign(globalThis, { PoopJs });
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
                    this.hidden || this.hide();
                }
                else {
                    this.hidden && this.show();
                    let text = `... +${data.running + data.queued}`;
                    if (this.button.innerHTML != text) {
                        this.button.innerText = text;
                    }
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
var PoopJs;
(function (PoopJs) {
    class ScrollInfo {
        el;
        /** absolute rect */
        rect;
        constructor(el) {
            this.el = el;
            let rect = el.getBoundingClientRect();
            function n(v) { return +v.toFixed(3); }
            this.rect = new DOMRect(n(rect.x / innerWidth), n((rect.y + scrollY) / innerHeight), n(rect.width / innerWidth), n(rect.height / innerHeight));
        }
        topOffset(scrollY = window.scrollY) {
            let windowY = scrollY / innerHeight;
            let offset = this.rect.top - windowY;
            return +offset.toFixed(3);
        }
        centerOffset(scrollY = window.scrollY) {
            let windowY = scrollY / innerHeight + 0.5;
            let offset = this.rect.top + this.rect.height / 2 - windowY;
            return +offset.toFixed(3);
        }
        bottomOffset(scrollY = window.scrollY) {
            let windowY = scrollY / innerHeight + 1;
            let offset = this.rect.bottom - windowY;
            return +offset.toFixed(3);
        }
        distanceFromScreen(scrollY = window.scrollY) {
            let windowY = scrollY / innerHeight;
            if (this.rect.bottom < windowY - 0.0001)
                return this.rect.bottom - windowY;
            if (this.rect.top > windowY + 1.001)
                return this.rect.top - windowY - 1;
        }
        get fullDir() {
            if (this.topOffset() < -0.001)
                return -1;
            if (this.bottomOffset() > 0.001)
                return 1;
            return 0;
        }
        get _offsets() {
            return [this.topOffset(), this.centerOffset(), this.bottomOffset()];
        }
    }
    PoopJs.ScrollInfo = ScrollInfo;
    class ImageScroller {
        selector = 'img';
        enabled = false;
        disableWheel = false;
        listener;
        stopPropagation = false;
        constructor(selector = '') {
            if (selector)
                this.selector = selector;
        }
        _wheelListener;
        onWheelScrollFailed;
        bindWheel() {
            if (this._wheelListener)
                return;
            let l = this._wheelListener = (event) => {
                if (this._wheelListener != l)
                    return removeEventListener('wheel', l);
                if (!this.enabled)
                    return;
                if (!event.deltaY)
                    return;
                if (event.shiftKey || event.ctrlKey)
                    return;
                if (this.scroll(Math.sign(event.deltaY))) {
                    event.preventDefault();
                    this.stopPropagation && event.stopImmediatePropagation();
                }
                else {
                    this.onWheelScrollFailed?.(event);
                }
            };
            addEventListener('wheel', this._wheelListener, { passive: false });
        }
        _arrowListener;
        bindArrows() {
            if (this._arrowListener)
                return;
            this._arrowListener = (event) => {
                if (!this.enabled)
                    return;
                if (event.code == 'ArrowLeft') {
                    if (this.scroll(-1)) {
                        event.preventDefault();
                        this.stopPropagation && event.stopImmediatePropagation();
                    }
                }
                if (event.code == 'ArrowRight') {
                    if (this.scroll(1)) {
                        event.preventDefault();
                        this.stopPropagation && event.stopImmediatePropagation();
                    }
                }
            };
            addEventListener('keydown', this._arrowListener, { capture: true });
        }
        /** enable this scroller */
        on(selector = '') {
            if (selector)
                this.selector = selector;
            this.enabled = true;
            this.bindArrows();
            this.bindWheel();
            return this;
        }
        /** disable this scroller */
        off(selector = '') {
            if (selector)
                this.selector = selector;
            this.enabled = false;
            return this;
        }
        mode = 'group';
        /** scroll to the next item */
        scroll(dir) {
            if (this.mode == 'group') {
                return this.scrollToNextGroup(dir);
            }
            if (this.mode == 'single') {
                return this.scrollToNextCenter(dir);
            }
        }
        scrollToNextCenter(dir) {
            let next = this._nextScrollTarget(dir, 'single');
            if (PoopJs.debug) {
                console.log(`scroll: `, next);
            }
            if (!next)
                return false;
            next.el.scrollIntoView({ block: 'center' });
            return true;
        }
        scrollToNextGroup(dir) {
            let next = this._nextScrollTarget(dir, 'group');
            if (PoopJs.debug) {
                console.log(`scroll: `, next);
            }
            if (!next || !next.length)
                return false;
            let y = (next[0].rect.top + next.at(-1).rect.bottom - 1) / 2;
            // fixme
            if (Math.abs(scrollY / innerHeight - y) > 0.750) {
                if (!this.getAllScrolls().find(e => e.fullDir == 0)) {
                    if (PoopJs.debug) {
                        console.log(`scroll too far`, next);
                    }
                    return false;
                }
            }
            scrollTo(0, y * innerHeight);
            return true;
        }
        _nextScrollTarget(dir, mode) {
            let scrolls = this.getAllScrolls();
            if (mode == 'single') {
                if (dir == -1) {
                    return scrolls.findLast(e => e.fullDir == -1);
                }
                if (dir == 0) {
                    let list = scrolls.filter(e => e.fullDir == 0);
                    return list[~~(list.length / 2)];
                }
                if (dir == 1) {
                    return scrolls.find(e => e.fullDir == 1);
                }
            }
            if (mode == 'group') {
                if (dir == -1) {
                    let last = scrolls.findLast(e => e.fullDir == -1);
                    if (!last)
                        return;
                    return scrolls.filter(e => Math.abs(e.rect.top - last.rect.bottom) <= 1.001 && e.fullDir == -1);
                }
                if (dir == 0) {
                    return scrolls.filter(e => e.fullDir == 0);
                }
                if (dir == 1) {
                    let last = scrolls.find(e => e.fullDir == 1);
                    if (!last)
                        return;
                    return scrolls.filter(e => Math.abs(last.rect.top - e.rect.bottom) <= 1.001 && e.fullDir == 1);
                }
            }
        }
        getAllScrolls(selector = this.selector) {
            return qq(selector).map(e => new ScrollInfo(e)).vsort(e => e.centerOffset());
        }
        /** used  */
        async keep(resizer, raf = false) {
            let pos = this.save();
            await resizer();
            pos.restore();
            if (raf) {
                await Promise.frame();
                pos.restore();
            }
        }
        /** save current item scroll position */
        save() {
            let scrolls = this.getAllScrolls();
            if (!scrolls.length) {
                return { info: undefined, offset: -1, restore: () => { } };
            }
            let info = scrolls.vsort(e => Math.abs(e.centerOffset()))[0];
            let offset = info.centerOffset();
            function restore() {
                let newInfo = new ScrollInfo(info.el);
                let newOffset = newInfo.centerOffset();
                scrollTo(0, scrollY + (newOffset - offset) * innerHeight);
            }
            return { info, offset, restore };
        }
        static createDefault() {
            return new ImageScroller();
        }
    }
    PoopJs.ImageScroller = ImageScroller;
    defineLazy(PoopJs, 'is', () => ImageScroller.createDefault());
    function defineLazy(target, prop, get) {
        Object.defineProperty(target, prop, {
            get: () => {
                Object.defineProperty(target, prop, {
                    value: get(),
                    configurable: true,
                    writable: true,
                });
                return target[prop];
            },
            set(v) {
                Object.defineProperty(target, prop, {
                    value: v,
                    configurable: true,
                    writable: true,
                });
                return target[prop];
            },
            configurable: true,
        });
    }
    const vars = {};
    PoopJs.styleVars = new Proxy(vars, {
        get(target, prop) {
            if (prop.startsWith('--'))
                prop = prop.slice(2);
            let style = document.body.style;
            let v = style.getPropertyValue('--' + prop);
            target[prop] = v;
            return v;
        },
        set(target, prop, v) {
            if (prop.startsWith('--'))
                prop = prop.slice(2);
            let style = document.body.style;
            target[prop] = v;
            style.setProperty('--' + prop, v + '');
            return true;
        },
    });
    PoopJs.styleVarsN = new Proxy(vars, {
        get(target, prop) {
            if (prop.startsWith('--'))
                prop = prop.slice(2);
            let style = document.body.style;
            let v = style.getPropertyValue('--' + prop);
            return +v;
        },
        set(target, prop, v) {
            if (prop.startsWith('--'))
                prop = prop.slice(2);
            let style = document.body.style;
            target[prop] = +v;
            style.setProperty('--' + prop, v + '');
            return true;
        },
    });
})(PoopJs || (PoopJs = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3Bvb3Bqcy9Qcm9taXNlLnRzIiwiLi4vcG9vcGpzL0FycmF5LnRzIiwiLi4vcG9vcGpzL0RhdGVOb3dIYWNrLnRzIiwiLi4vcG9vcGpzL09iamVjdC50cyIsIi4uL3Bvb3Bqcy9lbGVtZW50LnRzIiwiLi4vcG9vcGpzL2VsbS50cyIsIi4uL3Bvb3Bqcy9ldGMudHMiLCIuLi9wb29wanMvZmV0Y2gudHMiLCIuLi9wb29wanMvRmlsdGVyZXIvRW50aXR5RmlsdGVyZXIudHMiLCIuLi9wb29wanMvb2JzZXJ2ZXIudHMiLCIuLi9wb29wanMvUGFnaW5hdGUvUGFnaW5hdGlvbi50cyIsIi4uL3Bvb3Bqcy9QYWdpbmF0ZS9JbWFnZVNjcm9sbGluZy50cyIsIi4uL3Bvb3Bqcy9pbml0LnRzIiwiLi4vcG9vcGpzL2tleWJpbmQudHMiLCIuLi9wb29wanMvdHlwZXMudHMiLCIuLi9wb29wanMvRmlsdGVyZXIvRmlsdGVyZXJJdGVtLnRzIiwiLi4vcG9vcGpzL0ZpbHRlcmVyL0ZpbHRlci50cyIsIi4uL3Bvb3Bqcy9GaWx0ZXJlci9Nb2RpZmllci50cyIsIi4uL3Bvb3Bqcy9GaWx0ZXJlci9Tb3J0ZXIudHMiLCIuLi9wb29wanMvRmlsdGVyZXIvdHlwZXMudHMiLCIuLi9wb29wanMvUGFnaW5hdGUvSW1hZ2VTY3JvbGxpbmcyLnRzIiwiLi4vcG9vcGpzL1BhZ2luYXRlL21vZGlmaWNhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFVLE1BQU0sQ0F1Q2Y7QUF2Q0QsV0FBVSxNQUFNO0lBY2YsSUFBaUIsZ0JBQWdCLENBdUJoQztJQXZCRCxXQUFpQixnQkFBZ0I7UUFFaEM7O1dBRUc7UUFDSCxTQUFnQixLQUFLO1lBQ3BCLElBQUksT0FBMkIsQ0FBQztZQUNoQyxJQUFJLE1BQThCLENBQUM7WUFDbkMsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFJLENBQUMs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LEVBQUUsQ0FBQyxDQUFDO1lBQzVCLElBQUksRUFBRSxHQUFHLElBQUk7Z0JBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7WUFDcEMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFTLEVBQUUsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekQsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzlCLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDMUIsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzFCLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6QixPQUFPLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFD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LENBQUM7Z0JBQUUsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEQsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxHQUFHLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDdkMsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO0tBQ0QsQ0FBQyxDQUFDO0FBRUosQ0FBQyxFQXJTUyxNQUFNLEtBQU4sTUFBTSxRQXFTZiIsInNvdXJjZXNDb250ZW50IjpbIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgaW50ZXJmYWNlIERlZmVycmVkPFQgPSB2b2lkPiBleHRlbmRzIFByb21pc2U8VD4ge1xyXG5cdFx0cmVzb2x2ZSh2YWx1ZTogVCB8IFByb21pc2VMaWtlPFQ+KTogdm9pZDtcclxuXHRcdHJlamVjdDogKHJlYXNvbj86IGFueSkgPT4gdm9pZDtcclxuXHJcblx0XHRyKHZhbHVlKVxyXG5cdFx0cih2YWx1ZTogVCB8IFByb21pc2VMaWtlPFQ+KTogdm9pZDtcclxuXHRcdGo6IChyZWFzb24/OiBhbnkpID0+IHZvaWQ7XHJcblxyXG5cdFx0Ly8gUHJvbWlzZVN0YXRlOiAncGVuZGluZycgfCAnZnVsZmlsbGVkJyB8ICdyZWplY3RlZCc7XHJcblx0XHQvLyBQcm9taXNlUmVzdWx0PzogVCB8IEVycm9yO1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBQcm9taXNlRXh0ZW5zaW9uIHtcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIENyZWF0ZXMgdW53cmFwcGVkIHByb21pc2VcclxuXHRcdCAqL1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGVtcHR5PFQgPSB2b2lkPigpOiBEZWZlcnJlZDxUPiB7XHJcblx0XHRcdGxldCByZXNvbHZlOiAodmFsdWU6IFQpID0+IHZvaWQ7XHJcblx0XHRcdGxldCByZWplY3Q6IChyZWFzb24/OiBhbnkpID0+IHZvaWQ7XHJcblx0XHRcdHJldHVybiBPYmplY3QuYXNzaWduKG5ldyBQcm9taXNlPFQ+KChyLCBqKSA9PiB7XHJcblx0XHRcdFx0cmVzb2x2ZSA9IHI7XHJcblx0XHRcdFx0cmVqZWN0ID0gajtcclxuXHRcdFx0fSksIHtcclxuXHRcdFx0XHRyZXNvbHZlLCByZWplY3QsXHJcblx0XHRcdFx0cjogcmVzb2x2ZSwgajogcmVqZWN0LFxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgYXN5bmMgZnVuY3Rpb24gZnJhbWUobiA9IDEpOiBQcm9taXNlPG51bWJlcj4ge1xyXG5cdFx0XHR3aGlsZSAoLS1uID4gMCkge1xyXG5cdFx0XHRcdGF3YWl0IG5ldyBQcm9taXNlKHJlcXVlc3RBbmltYXRpb25GcmFtZSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKHJlcXVlc3RBbmltYXRpb25GcmFtZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxufVxyXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9Qcm9taXNlLnRzXCIgLz5cclxubmFtZXNwYWNlIFBvb3BKcyB7XHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBBcnJheUV4dGVuc2lvbiB7XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBtYXA8VCwgVj4odGhpczogVFtdLCBtYXBwZXI6IChlOiBULCBpOiBudW1iZXIsIGE6IFRbXSkgPT4gUHJvbWlzZTxWPiB8IFYsIHRocmVhZHMgPSA1KTogUHJvbWlzZTxWW10+IHtcclxuXHRcdFx0aWYgKCEodGhyZWFkcyA+IDApKSB0aHJvdyBuZXcgRXJyb3IoKTtcclxuXHRcdFx0bGV0IHRhc2tzOiBbVCwgbnVtYmVyLCBUW11dW10gPSB0aGlzLm1hcCgoZSwgaSwgYSkgPT4gW2UsIGksIGFdKTtcclxuXHRcdFx0bGV0IHJlc3VsdHMgPSBBcnJheTxWPih0YXNrcy5sZW5ndGgpO1xyXG5cdFx0XHRsZXQgYW55UmVzb2x2ZWQgPSBQcm9taXNlRXh0ZW5zaW9uLmVtcHR5KCk7XHJcblx0XHRcdGxldCBmcmVlVGhyZWFkcyA9IHRocmVhZHM7XHJcblx0XHRcdGFzeW5jIGZ1bmN0aW9uIHJ1blRhc2sodGFzazogW1QsIG51bWJlciwgVFtdXSk6IFByb21pc2U8Vj4ge1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gYXdhaXQgbWFwcGVyKC4uLnRhc2spO1xyXG5cdFx0XHRcdH0gY2F0Y2ggKGVycikge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGVycjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0YXN5bmMgZnVuY3Rpb24gcnVuKHRhc2spIHtcclxuXHRcdFx0XHRmcmVlVGhyZWFkcy0tO1xyXG5cdFx0XHRcdHJlc3VsdHNbdGFza1sxXV0gPSBhd2FpdCBydW5UYXNrKHRhc2spO1xyXG5cdFx0XHRcdGZyZWVUaHJlYWRzKys7XHJcblx0XHRcdFx0bGV0IG9sZEFueVJlc29sdmVkID0gYW55UmVzb2x2ZWQ7XHJcblx0XHRcdFx0YW55UmVzb2x2ZWQgPSBQcm9taXNlRXh0ZW5zaW9uLmVtcHR5KCk7XHJcblx0XHRcdFx0b2xkQW55UmVzb2x2ZWQucih1bmRlZmluZWQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGZvciAobGV0IHRhc2sgb2YgdGFza3MpIHtcclxuXHRcdFx0XHRpZiAoZnJlZVRocmVhZHMgPT0gMCkge1xyXG5cdFx0XHRcdFx0YXdhaXQgYW55UmVzb2x2ZWQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJ1bih0YXNrKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR3aGlsZSAoZnJlZVRocmVhZHMgPCB0aHJlYWRzKSB7XHJcblx0XHRcdFx0YXdhaXQgYW55UmVzb2x2ZWQ7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHJlc3VsdHM7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIG1hcDxUID0gbnVtYmVyPih0aGlzOiBBcnJheUNvbnN0cnVjdG9yLCBsZW5ndGg6IG51bWJlciwgbWFwcGVyOiAobnVtYmVyKSA9PiBUID0gaSA9PiBpKSB7XHJcblx0XHRcdHJldHVybiB0aGlzKGxlbmd0aCkuZmlsbCgwKS5tYXAoKGUsIGksIGEpID0+IG1hcHBlcihpKSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHZzb3J0PFQ+KHRoaXM6IFRbXSwgbWFwcGVyOiAoZTogVCwgaTogbnVtYmVyLCBhOiBUW10pID0+IG51bWJlciwgc29ydGVyPzogKChhOiBudW1iZXIsIGI6IG51bWJlciwgYWU6IFQsIGJlOiBUKSA9PiBudW1iZXIpIHwgLTEpOiBUW107XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gdnNvcnQ8VCwgVj4odGhpczogVFtdLCBtYXBwZXI6IChlOiBULCBpOiBudW1iZXIsIGE6IFRbXSkgPT4gViwgc29ydGVyOiAoKGE6IFYsIGI6IFYsIGFlOiBULCBiZTogVCkgPT4gbnVtYmVyKSB8IC0xKTogVFtdO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHZzb3J0PFQ+KHRoaXM6IFRbXSwgbWFwcGVyOiAoZTogVCwgaTogbnVtYmVyLCBhOiBUW10pID0+IG51bWJlciwgc29ydGVyOiAoKGE6IG51bWJlciwgYjogbnVtYmVyLCBhZTogVCwgYmU6IFQpID0+IG51bWJlcikgfCAtMSA9IChhLCBiKSA9PiBhIC0gYik6IFRbXSB7XHJcblx0XHRcdGxldCB0aGVTb3J0ZXIgPSB0eXBlb2Ygc29ydGVyID09ICdmdW5jdGlvbicgPyBzb3J0ZXIgOiAoYSwgYikgPT4gYiAtIGE7XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHRcdFx0Lm1hcCgoZSwgaSwgYSkgPT4gKHsgZSwgdjogbWFwcGVyKGUsIGksIGEpIH0pKVxyXG5cdFx0XHRcdC5zb3J0KChhLCBiKSA9PiB0aGVTb3J0ZXIoYS52LCBiLnYsIGEuZSwgYi5lKSlcclxuXHRcdFx0XHQubWFwKGUgPT4gZS5lKTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gYXQ8VD4odGhpczogVFtdLCBpbmRleDogbnVtYmVyKTogVCB7XHJcblx0XHRcdHJldHVybiBpbmRleCA+PSAwID8gdGhpc1tpbmRleF0gOiB0aGlzW3RoaXMubGVuZ3RoICsgaW5kZXhdO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBmaW5kTGFzdDxULCBTIGV4dGVuZHMgVD4odGhpczogVFtdLCBwcmVkaWNhdGU6ICh0aGlzOiB2b2lkLCB2YWx1ZTogVCwgaW5kZXg6IG51bWJlciwgb2JqOiBUW10pID0+IHZhbHVlIGlzIFMsIHRoaXNBcmc/OiBhbnkpOiBTIHwgdW5kZWZpbmVkO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGZpbmRMYXN0PFQ+KHByZWRpY2F0ZTogKHRoaXM6IFRbXSwgdmFsdWU6IFQsIGluZGV4OiBudW1iZXIsIG9iajogVFtdKSA9PiB1bmtub3duLCB0aGlzQXJnPzogYW55KTogVCB8IHVuZGVmaW5lZDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBmaW5kTGFzdDxULCBTIGV4dGVuZHMgVD4odGhpczogVFtdLCBwcmVkaWNhdGU6ICh2YWx1ZTogVCwgaW5kZXg6IG51bWJlciwgb2JqOiBUW10pID0+IHVua25vd24sIHRoaXNBcmc/OiBhbnkpOiBUIHwgUyB8IHVuZGVmaW5lZCB7XHJcblx0XHRcdGZvciAobGV0IGkgPSB0aGlzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcblx0XHRcdFx0aWYgKHByZWRpY2F0ZSh0aGlzW2ldLCBpLCB0aGlzKSkgcmV0dXJuIHRoaXNbaV07XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblxyXG5cdFx0ZXhwb3J0IGNsYXNzIFBNYXA8VCwgViwgRSA9IG5ldmVyPiB7XHJcblx0XHRcdC8qKiBPcmlnaW5hbCBhcnJheSAqL1xyXG5cdFx0XHRzb3VyY2U6IFRbXSA9IFtdO1xyXG5cdFx0XHQvKiogQXN5bmMgZWxlbWVudCBjb252ZXJ0ZXIgZnVuY3Rpb24gKi9cclxuXHRcdFx0bWFwcGVyOiAoZTogVCwgaTogbnVtYmVyLCBhOiBUW10sIHBtYXA6IFBNYXA8VCwgViwgRT4pID0+IFByb21pc2U8ViB8IEU+ID0gKGU6IFQpID0+IGUgYXMgYW55IGFzIFByb21pc2U8Vj47XHJcblx0XHRcdC8qKiBNYXggbnVtYmVyIG9mIHJlcXVlc3RzIGF0IG9uY2UuICAgXHJcblx0XHRcdCAqICAqTWF5KiBiZSBjaGFuZ2VkIGluIHJ1bnRpbWUgKi9cclxuXHRcdFx0dGhyZWFkczogbnVtYmVyID0gNTtcclxuXHRcdFx0LyoqIE1heCBkaXN0YW5jZSBiZXR3ZWVuIHRoZSBvbGRlcnMgaW5jb21wbGV0ZSBhbmQgbmV3ZXN0IGFjdGl2ZSBlbGVtZW50cy4gICBcclxuXHRcdFx0ICogICpNYXkqIGJlIGNoYW5nZWQgaW4gcnVudGltZSAqL1xyXG5cdFx0XHR3aW5kb3c6IG51bWJlciA9IEluZmluaXR5O1xyXG5cclxuXHRcdFx0LyoqIFVuZmluaXNoZWQgcmVzdWx0IGFycmF5ICovXHJcblx0XHRcdHJlc3VsdHM6IChWIHwgRSB8IHVuZGVmaW5lZClbXSA9IFtdO1xyXG5cdFx0XHQvKiogUHJvbWlzZXMgZm9yIGV2ZXJ5IGVsZW1lbnQgKi9cclxuXHRcdFx0cmVxdWVzdHM6IERlZmVycmVkPFYgfCBFPltdID0gW107XHJcblxyXG5cdFx0XHRiZWZvcmVTdGFydDogKGRhdGE6IHtcclxuXHRcdFx0XHRlOiBULCBpOiBudW1iZXIsIGE6IFRbXSwgdj86IFYgfCBFLCByOiAoViB8IEUpW10sIHBtYXA6IFBNYXA8VCwgViwgRT5cclxuXHRcdFx0fSkgPT4gUHJvbWlzZTx2b2lkPiB8IHZvaWQgPSAoKSA9PiB7IH07XHJcblx0XHRcdGFmdGVyQ29tcGxldGU6IChkYXRhOiB7XHJcblx0XHRcdFx0ZTogVCwgaTogbnVtYmVyLCBhOiBUW10sIHY6IFYgfCBFLCByOiAoViB8IEUpW10sIHBtYXA6IFBNYXA8VCwgViwgRT5cclxuXHRcdFx0fSkgPT4gUHJvbWlzZTx2b2lkPiB8IHZvaWQgPSAoKSA9PiB7IH07XHJcblxyXG5cdFx0XHQvKiogTGVuZ3RoIG9mIHRoZSBhcnJheSAqL1xyXG5cdFx0XHRsZW5ndGg6IG51bWJlciA9IC0xO1xyXG5cdFx0XHQvKiogVGhlIG51bWJlciBvZiBlbGVtZW50cyBmaW5pc2hlZCBjb252ZXJ0aW5nICovXHJcblx0XHRcdGNvbXBsZXRlZDogbnVtYmVyID0gLTE7XHJcblx0XHRcdC8qKiBUaHJlYWRzIGN1cnJlbnRseSB3b3JraW5nICAgXHJcblx0XHRcdCAqICBpbiB0aGUgbWFwcGVyIGZ1bmN0aW9uOiBpbmNsdWRpbmcgdGhlIGN1cnJlbnQgb25lICovXHJcblx0XHRcdGFjdGl2ZVRocmVhZHM6IG51bWJlciA9IC0xO1xyXG5cdFx0XHRsYXN0U3RhcnRlZDogbnVtYmVyID0gLTE7XHJcblxyXG5cdFx0XHRhbGxUYXNrc0RvbmU6IERlZmVycmVkPChWIHwgRSlbXT4gJiB7IHBtYXA6IFBNYXA8VCwgViwgRT4gfTtcclxuXHRcdFx0YW55VGFza1Jlc29sdmVkOiBEZWZlcnJlZDx2b2lkPjtcclxuXHJcblx0XHRcdGNvbnN0cnVjdG9yKHNvdXJjZTogUGFydGlhbDxQTWFwPFQsIFYsIEU+Pikge1xyXG5cdFx0XHRcdHRoaXMuYWxsVGFza3NEb25lID0gT2JqZWN0LmFzc2lnbih0aGlzLmVtcHR5UmVzdWx0PChWIHwgRSlbXT4oKSwgeyBwbWFwOiB0aGlzIH0pO1xyXG5cdFx0XHRcdHRoaXMuYW55VGFza1Jlc29sdmVkID0gdGhpcy5lbXB0eVJlc3VsdCgpO1xyXG5cdFx0XHRcdGZvciAobGV0IGsgb2YgT2JqZWN0LmtleXModGhpcykgYXMgKGtleW9mIFBNYXA8VCwgViwgRT4pW10pIHtcclxuXHRcdFx0XHRcdGlmICh0eXBlb2Ygc291cmNlW2tdID09IHR5cGVvZiB0aGlzW2tdKSB7XHJcblx0XHRcdFx0XHRcdHRoaXNba10gPSBzb3VyY2Vba10gYXMgYW55O1xyXG5cdFx0XHRcdFx0fSBlbHNlIGlmIChzb3VyY2Vba10pIHtcclxuXHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBQTWFwOiBpbnZhbGlkIGNvbnN0cnVjdG9yIHBhcmFtZXRlcjogcHJvcGVydHkgJHtrfTogZXhwZWN0ZWQgJHt0eXBlb2YgdGhpc1trXX0sIGJ1dCBnb3QgJHt0eXBlb2Ygc291cmNlW2tdfWApO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0YXN5bmMgc3RhcnRUYXNrKGFycmF5SW5kZXg6IG51bWJlcikge1xyXG5cdFx0XHRcdHRoaXMuYWN0aXZlVGhyZWFkcysrO1xyXG5cdFx0XHRcdGxldCBlID0gdGhpcy5zb3VyY2VbYXJyYXlJbmRleF07XHJcblx0XHRcdFx0YXdhaXQgdGhpcy5iZWZvcmVTdGFydCh7XHJcblx0XHRcdFx0XHRlOiB0aGlzLnNvdXJjZVthcnJheUluZGV4XSxcclxuXHRcdFx0XHRcdGk6IGFycmF5SW5kZXgsXHJcblx0XHRcdFx0XHRhOiB0aGlzLnNvdXJjZSxcclxuXHRcdFx0XHRcdHY6IHVuZGVmaW5lZCxcclxuXHRcdFx0XHRcdHI6IHRoaXMucmVzdWx0cyxcclxuXHRcdFx0XHRcdHBtYXA6IHRoaXMsXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0dGhpcy5sYXN0U3RhcnRlZCA9IGFycmF5SW5kZXg7XHJcblx0XHRcdFx0bGV0IHY6IFYgfCBFO1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHR2ID0gYXdhaXQgdGhpcy5tYXBwZXIodGhpcy5zb3VyY2VbYXJyYXlJbmRleF0sIGFycmF5SW5kZXgsIHRoaXMuc291cmNlLCB0aGlzKTtcclxuXHRcdFx0XHR9IGNhdGNoIChlKSB7XHJcblx0XHRcdFx0XHR2ID0gZSBhcyBFO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLnJlc3VsdHNbYXJyYXlJbmRleF0gPSB2O1xyXG5cdFx0XHRcdHRoaXMucmVxdWVzdHNbYXJyYXlJbmRleF0ucmVzb2x2ZSh2KTtcclxuXHRcdFx0XHR0aGlzLmNvbXBsZXRlZCsrO1xyXG5cdFx0XHRcdGF3YWl0IHRoaXMuYWZ0ZXJDb21wbGV0ZSh7XHJcblx0XHRcdFx0XHRlOiB0aGlzLnNvdXJjZVthcnJheUluZGV4XSxcclxuXHRcdFx0XHRcdGk6IGFycmF5SW5kZXgsXHJcblx0XHRcdFx0XHRhOiB0aGlzLnNvdXJjZSxcclxuXHRcdFx0XHRcdHY6IHYsXHJcblx0XHRcdFx0XHRyOiB0aGlzLnJlc3VsdHMsXHJcblx0XHRcdFx0XHRwbWFwOiB0aGlzLFxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHRoaXMuYWN0aXZlVGhyZWFkcy0tO1xyXG5cdFx0XHRcdHRoaXMuYW55VGFza1Jlc29sdmVkLnJlc29sdmUoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRhc3luYyBydW5faW50ZXJuYWwoKSB7XHJcblx0XHRcdFx0Zm9yIChsZXQgYXJyYXlJbmRleCA9IDA7IGFycmF5SW5kZXggPCB0aGlzLmxlbmd0aDsgYXJyYXlJbmRleCsrKSB7XHJcblx0XHRcdFx0XHR3aGlsZSAodGhpcy5hY3RpdmVUaHJlYWRzID49IHRoaXMudGhyZWFkcykge1xyXG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLmFueVRhc2tSZXNvbHZlZDtcclxuXHRcdFx0XHRcdFx0dGhpcy5hbnlUYXNrUmVzb2x2ZWQgPSB0aGlzLmVtcHR5UmVzdWx0KCk7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5yZXF1ZXN0c1thcnJheUluZGV4IC0gdGhpcy53aW5kb3ddO1xyXG5cdFx0XHRcdFx0dGhpcy5zdGFydFRhc2soYXJyYXlJbmRleCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHdoaWxlICh0aGlzLmFjdGl2ZVRocmVhZHMgPiAwKSB7XHJcblx0XHRcdFx0XHRhd2FpdCB0aGlzLmFueVRhc2tSZXNvbHZlZDtcclxuXHRcdFx0XHRcdHRoaXMuYW55VGFza1Jlc29sdmVkID0gdGhpcy5lbXB0eVJlc3VsdCgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLmFsbFRhc2tzRG9uZS5yZXNvbHZlKHRoaXMucmVzdWx0cyBhcyAoViB8IEUpW10pO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmFsbFRhc2tzRG9uZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRydW4oKSB7XHJcblx0XHRcdFx0dGhpcy5wcmVwYXJlKCk7XHJcblx0XHRcdFx0dGhpcy5ydW5faW50ZXJuYWwoKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hbGxUYXNrc0RvbmU7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHBhdXNlKCkge1xyXG5cdFx0XHRcdGlmICh0aGlzLmFjdGl2ZVRocmVhZHMgPCB0aGlzLmxlbmd0aCArIHRoaXMudGhyZWFkcylcclxuXHRcdFx0XHRcdHRoaXMuYWN0aXZlVGhyZWFkcyArPSB0aGlzLmxlbmd0aCArIHRoaXMudGhyZWFkcztcclxuXHRcdFx0fVxyXG5cdFx0XHR1bnBhdXNlKCkge1xyXG5cdFx0XHRcdGlmICh0aGlzLmFjdGl2ZVRocmVhZHMgPj0gdGhpcy5sZW5ndGggKyB0aGlzLnRocmVhZHMpXHJcblx0XHRcdFx0XHR0aGlzLmFjdGl2ZVRocmVhZHMgLT0gdGhpcy5sZW5ndGggKyB0aGlzLnRocmVhZHM7XHJcblx0XHRcdFx0dGhpcy5hbnlUYXNrUmVzb2x2ZWQucigpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGNhbmNlbCgpIHtcclxuXHRcdFx0XHR0aGlzLm1hcHBlciA9ICgoKSA9PiB7IH0pIGFzIGFueTtcclxuXHRcdFx0XHR0aGlzLmJlZm9yZVN0YXJ0ID0gKCkgPT4geyB9O1xyXG5cdFx0XHRcdHRoaXMuYWZ0ZXJDb21wbGV0ZSA9ICgpID0+IHsgfTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cHJlcGFyZSgpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5sZW5ndGggPT0gLTEpIHRoaXMubGVuZ3RoID0gdGhpcy5zb3VyY2UubGVuZ3RoO1xyXG5cdFx0XHRcdGlmICh0aGlzLnJlc3VsdHMubGVuZ3RoID09IDApIHtcclxuXHRcdFx0XHRcdHRoaXMucmVzdWx0cyA9IEFycmF5KHRoaXMubGVuZ3RoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMucmVxdWVzdHMubGVuZ3RoID09IDApIHtcclxuXHRcdFx0XHRcdHRoaXMucmVxdWVzdHMgPSB0aGlzLnNvdXJjZS5tYXAoZSA9PiB0aGlzLmVtcHR5UmVzdWx0KCkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodGhpcy5jb21wbGV0ZWQgPCAwKSB0aGlzLmNvbXBsZXRlZCA9IDA7XHJcblx0XHRcdFx0aWYgKHRoaXMuYWN0aXZlVGhyZWFkcyA8IDApIHRoaXMuYWN0aXZlVGhyZWFkcyA9IDA7XHJcblx0XHRcdFx0aWYgKHRoaXMubGFzdFN0YXJ0ZWQgPCAtMSkgdGhpcy5sYXN0U3RhcnRlZCA9IC0xO1xyXG5cdFx0XHRcdHRoaXMuYW55VGFza1Jlc29sdmVkID0gdGhpcy5lbXB0eVJlc3VsdCgpO1xyXG5cdFx0XHRcdE9iamVjdC5hc3NpZ24odGhpcy5hbGxUYXNrc0RvbmUsIHsgcG1hcDogdGhpcyB9KTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZW1wdHlSZXN1bHQ8VCA9IFYgfCBFPigpOiBEZWZlcnJlZDxUPiB7XHJcblx0XHRcdFx0bGV0IHJlc29sdmUhOiAodmFsdWU6IFQpID0+IHZvaWQ7XHJcblx0XHRcdFx0bGV0IHJlamVjdCE6IChyZWFzb24/OiBhbnkpID0+IHZvaWQ7XHJcblx0XHRcdFx0bGV0IHAgPSBuZXcgUHJvbWlzZTxUPigociwgaikgPT4ge1xyXG5cdFx0XHRcdFx0cmVzb2x2ZSA9IHI7XHJcblx0XHRcdFx0XHRyZWplY3QgPSBqO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHJldHVybiBPYmplY3QuYXNzaWduKHAsIHsgcmVzb2x2ZSwgcmVqZWN0LCByOiByZXNvbHZlLCBqOiByZWplY3QgfSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHN0YXRpYyB0aGlzX3BtYXA8VCwgViwgRSA9IG5ldmVyPih0aGlzOiBUW10sIG1hcHBlcjogUE1hcDxULCBWLCBFPlsnbWFwcGVyJ10sIG9wdGlvbnM6IFBhcnRpYWw8UE1hcDxULCBWLCBFPj4gfCBudW1iZXIgfCB0cnVlID0ge30pIHtcclxuXHRcdFx0XHRpZiAob3B0aW9ucyA9PSB0cnVlKSBvcHRpb25zID0gSW5maW5pdHk7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zID09ICdudW1iZXInKSBvcHRpb25zID0geyB0aHJlYWRzOiBvcHRpb25zIH07XHJcblx0XHRcdFx0bGV0IHBtYXAgPSBuZXcgUE1hcCh7IHNvdXJjZTogdGhpcywgbWFwcGVyLCAuLi5vcHRpb25zIH0pO1xyXG5cdFx0XHRcdHJldHVybiBwbWFwLnJ1bigpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHN0YXRpYyBwbWFwPFQsIFYsIEUgPSBuZXZlcj4oYXJyYXk6IFRbXSwgbWFwcGVyOiBQTWFwPFQsIFYsIEU+WydtYXBwZXInXSwgb3B0aW9uczogUGFydGlhbDxQTWFwPFQsIFYsIEU+PiB8IG51bWJlciB8IHRydWUgPSB7fSkge1xyXG5cdFx0XHRcdGlmIChvcHRpb25zID09IHRydWUpIG9wdGlvbnMgPSBJbmZpbml0eTtcclxuXHRcdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMgPT0gJ251bWJlcicpIG9wdGlvbnMgPSB7IHRocmVhZHM6IG9wdGlvbnMgfTtcclxuXHRcdFx0XHRsZXQgcG1hcCA9IG5ldyBQTWFwKHsgc291cmNlOiBhcnJheSwgbWFwcGVyLCAuLi5vcHRpb25zIH0pO1xyXG5cdFx0XHRcdHJldHVybiBwbWFwLnJ1bigpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBEYXRlTm93SGFjayB7XHJcblxyXG5cdFx0ZXhwb3J0IGxldCBzcGVlZE11bHRpcGxpZXIgPSAxO1xyXG5cdFx0ZXhwb3J0IGxldCBkZWx0YU9mZnNldCA9IDA7XHJcblx0XHRleHBvcnQgbGV0IHN0YXJ0UmVhbHRpbWUgPSAwO1xyXG5cdFx0ZXhwb3J0IGxldCBzdGFydFRpbWUgPSAwO1xyXG5cclxuXHRcdC8vIGV4cG9ydCBsZXQgc3BlZWRNdWx0aXBsaWVyID0gMTtcclxuXHRcdGV4cG9ydCBsZXQgcGVyZm9ybWFuY2VEZWx0YU9mZnNldCA9IDA7XHJcblx0XHRleHBvcnQgbGV0IHBlcmZvcm1hbmNlU3RhcnRSZWFsdGltZSA9IDA7XHJcblx0XHRleHBvcnQgbGV0IHBlcmZvcm1hbmNlU3RhcnRUaW1lID0gMDtcclxuXHJcblx0XHRleHBvcnQgbGV0IHVzZWRNZXRob2RzID0ge1xyXG5cdFx0XHRkYXRlOiB0cnVlLFxyXG5cdFx0XHRwZXJmb3JtYW5jZTogdHJ1ZSxcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gdG9GYWtlVGltZShyZWFsdGltZTogbnVtYmVyKSB7XHJcblx0XHRcdGlmICghdXNlZE1ldGhvZHMuZGF0ZSkgcmV0dXJuIHJlYWx0aW1lO1xyXG5cdFx0XHRyZXR1cm4gTWF0aC5mbG9vcihcclxuXHRcdFx0XHQocmVhbHRpbWUgLSBzdGFydFJlYWx0aW1lKSAqIHNwZWVkTXVsdGlwbGllciArIHN0YXJ0VGltZSArIGRlbHRhT2Zmc2V0XHJcblx0XHRcdCk7XHJcblx0XHR9XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gdG9QZXJmb3JtYW5jZUZha2VUaW1lKHJlYWx0aW1lOiBudW1iZXIpIHtcclxuXHRcdFx0aWYgKCF1c2VkTWV0aG9kcy5wZXJmb3JtYW5jZSkgcmV0dXJuIHJlYWx0aW1lO1xyXG5cdFx0XHRyZXR1cm4gKHJlYWx0aW1lIC0gcGVyZm9ybWFuY2VTdGFydFJlYWx0aW1lKSAqIHNwZWVkTXVsdGlwbGllclxyXG5cdFx0XHRcdCsgcGVyZm9ybWFuY2VTdGFydFRpbWUgKyBwZXJmb3JtYW5jZURlbHRhT2Zmc2V0O1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBsZXQgYnJhY2tldFNwZWVkcyA9IFswLjA1LCAwLjI1LCAxLCAyLCA1LCAxMCwgMjAsIDYwLCAxMjBdO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHNwZWVkaGFjayhzcGVlZDogbnVtYmVyID0gMSkge1xyXG5cdFx0XHRpZiAodHlwZW9mIHNwZWVkICE9ICdudW1iZXInKSB7XHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBEYXRlTm93SGFjazogaW52YWxpZCBzcGVlZDogJHtzcGVlZH1gKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRhY3RpdmF0ZSgpO1xyXG5cdFx0XHRhY3RpdmF0ZVBlcmZvcm1hbmNlKCk7XHJcblx0XHRcdHNwZWVkTXVsdGlwbGllciA9IHNwZWVkO1xyXG5cdFx0XHRsb2NhdGlvbi5oYXNoID0gc3BlZWQgKyAnJztcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiB0aW1lanVtcChzZWNvbmRzOiBudW1iZXIpIHtcclxuXHRcdFx0YWN0aXZhdGUoKTtcclxuXHRcdFx0YWN0aXZhdGVQZXJmb3JtYW5jZSgpO1xyXG5cdFx0XHRkZWx0YU9mZnNldCArPSBzZWNvbmRzICogMTAwMDtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBzd2l0Y2hTcGVlZGhhY2soZGlyOiBudW1iZXIpIHtcclxuXHRcdFx0bGV0IGN1cnJlbnRJbmRleCA9IGJyYWNrZXRTcGVlZHMuaW5kZXhPZihzcGVlZE11bHRpcGxpZXIpO1xyXG5cdFx0XHRpZiAoY3VycmVudEluZGV4ID09IC0xKSBjdXJyZW50SW5kZXggPSBicmFja2V0U3BlZWRzLmluZGV4T2YoMSk7XHJcblx0XHRcdGxldCBuZXdTcGVlZCA9IGJyYWNrZXRTcGVlZHNbY3VycmVudEluZGV4ICsgZGlyXTtcclxuXHRcdFx0aWYgKG5ld1NwZWVkID09IHVuZGVmaW5lZCkgcmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRzcGVlZGhhY2sobmV3U3BlZWQpO1xyXG5cdFx0fVxyXG5cdFx0ZnVuY3Rpb24gb25rZXlkb3duKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XHJcblx0XHRcdGlmIChldmVudC5jb2RlID09ICdCcmFja2V0TGVmdCcpIHtcclxuXHRcdFx0XHRzd2l0Y2hTcGVlZGhhY2soLTEpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChldmVudC5jb2RlID09ICdCcmFja2V0UmlnaHQnKSB7XHJcblx0XHRcdFx0c3dpdGNoU3BlZWRoYWNrKDEpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gYmluZEJyYWNrZXRzKG1vZGUgPSAnb24nKSB7XHJcblx0XHRcdGlmIChtb2RlID09ICdvbicpIHtcclxuXHRcdFx0XHRQb29wSnMua2RzID0ge1xyXG5cdFx0XHRcdFx0QnJhY2tldExlZnQ6ICgpID0+IHN3aXRjaFNwZWVkaGFjaygtMSksXHJcblx0XHRcdFx0XHRCcmFja2V0UmlnaHQ6ICgpID0+IHN3aXRjaFNwZWVkaGFjaygxKSxcclxuXHRcdFx0XHR9O1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGRlbGV0ZSBQb29wSnMua2RzLkJyYWNrZXRMZWZ0O1xyXG5cdFx0XHRcdGRlbGV0ZSBQb29wSnMua2RzLkJyYWNrZXRSaWdodDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBsZXQgYWN0aXZhdGVkID0gZmFsc2U7XHJcblx0XHRmdW5jdGlvbiBhY3RpdmF0ZSgpIHtcclxuXHRcdFx0RGF0ZS5fbm93ID8/PSBEYXRlLm5vdztcclxuXHRcdFx0RGF0ZS5wcm90b3R5cGUuX2dldFRpbWUgPz89IERhdGUucHJvdG90eXBlLmdldFRpbWU7XHJcblx0XHRcdHN0YXJ0VGltZSA9IERhdGUubm93KCk7XHJcblx0XHRcdHN0YXJ0UmVhbHRpbWUgPSBEYXRlLl9ub3coKTtcclxuXHRcdFx0ZGVsdGFPZmZzZXQgPSAwO1xyXG5cdFx0XHQvLyBjb25zb2xlLmxvZyhEYXRlLm5vdygpLCApXHJcblx0XHRcdC8vIGRlYnVnZ2VyO1xyXG5cdFx0XHREYXRlLm5vdyA9ICgpID0+IHRvRmFrZVRpbWUoRGF0ZS5fbm93KCkpO1xyXG5cdFx0XHREYXRlLnByb3RvdHlwZS5nZXRUaW1lID0gZnVuY3Rpb24gKHRoaXM6IERhdGUgJiB7IF90PzogbnVtYmVyIH0pIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fdCA/Pz0gdG9GYWtlVGltZSh0aGlzLl9nZXRUaW1lKCkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdERhdGUucHJvdG90eXBlLnZhbHVlT2YgPSBmdW5jdGlvbiAodGhpczogRGF0ZSkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmdldFRpbWUoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRhY3RpdmF0ZWQgPSB0cnVlO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGxldCBwZXJmb3JtYW5jZUFjdGl2YXRlZCA9IGZhbHNlO1xyXG5cdFx0ZnVuY3Rpb24gYWN0aXZhdGVQZXJmb3JtYW5jZSgpIHtcclxuXHRcdFx0cGVyZm9ybWFuY2UuX25vdyA/Pz0gcGVyZm9ybWFuY2Uubm93O1xyXG5cdFx0XHRwZXJmb3JtYW5jZVN0YXJ0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG5cdFx0XHRwZXJmb3JtYW5jZVN0YXJ0UmVhbHRpbWUgPSBwZXJmb3JtYW5jZS5fbm93KCk7XHJcblx0XHRcdHBlcmZvcm1hbmNlRGVsdGFPZmZzZXQgPSAwO1xyXG5cdFx0XHRwZXJmb3JtYW5jZS5ub3cgPSAoKSA9PiB0b1BlcmZvcm1hbmNlRmFrZVRpbWUocGVyZm9ybWFuY2UuX25vdygpKTtcclxuXHRcdFx0d2luZG93Ll9yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPz89IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XHJcblx0XHRcdHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmID0+IHdpbmRvdy5fcmVxdWVzdEFuaW1hdGlvbkZyYW1lKG4gPT4gZih0b1BlcmZvcm1hbmNlRmFrZVRpbWUobikpKTtcclxuXHRcdFx0cGVyZm9ybWFuY2VBY3RpdmF0ZWQgPSB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHR9XHJcblxyXG5cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIE9iamVjdEV4dGVuc2lvbiB7XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGRlZmluZVZhbHVlPFQsIEsgZXh0ZW5kcyBrZXlvZiBUPihvOiBULCBwOiBLLCB2YWx1ZTogVFtLXSk6IFQ7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZGVmaW5lVmFsdWU8VD4obzogVCwgZm46IEZ1bmN0aW9uKTogVDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBkZWZpbmVWYWx1ZTxUPihvOiBULCBwOiBrZXlvZiBUIHwgc3RyaW5nIHwgRnVuY3Rpb24sIHZhbHVlPzogYW55KTogVCB7XHJcblx0XHRcdGlmICh0eXBlb2YgcCA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0W3AsIHZhbHVlXSA9IFtwLm5hbWUsIHBdIGFzIFtzdHJpbmcsIEZ1bmN0aW9uXTtcclxuXHRcdFx0fVxyXG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobywgcCwge1xyXG5cdFx0XHRcdHZhbHVlLFxyXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdFx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcclxuXHRcdFx0XHR3cml0YWJsZTogdHJ1ZSxcclxuXHRcdFx0fSk7XHJcblx0XHRcdHJldHVybiBvO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBkZWZpbmVHZXR0ZXI8VCwgSyBleHRlbmRzIGtleW9mIFQ+KG86IFQsIHA6IEssIGdldDogKCkgPT4gVFtLXSk6IFQ7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZGVmaW5lR2V0dGVyPFQ+KG86IFQsIGdldDogRnVuY3Rpb24pOiBUO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUdldHRlcjxUPihvOiBULCBwOiBzdHJpbmcgfCBrZXlvZiBUIHwgRnVuY3Rpb24sIGdldD86IGFueSk6IFQge1xyXG5cdFx0XHRpZiAodHlwZW9mIHAgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFtwLCBnZXRdID0gW3AubmFtZSwgcF0gYXMgW3N0cmluZywgRnVuY3Rpb25dO1xyXG5cdFx0XHR9XHJcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBwLCB7XHJcblx0XHRcdFx0Z2V0LFxyXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdFx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcclxuXHRcdFx0fSk7XHJcblx0XHRcdHJldHVybiBvO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBtYXA8VCwgVj4obzogVCwgbWFwcGVyOiAodjogVmFsdWVPZjxUPiwgazoga2V5b2YgVCwgbzogVCkgPT4gVik6IE1hcHBlZE9iamVjdDxULCBWPiB7XHJcblx0XHRcdGxldCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXMobykgYXMgW2tleW9mIFQsIFZhbHVlT2Y8VD5dW107XHJcblx0XHRcdHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoZW50cmllcy5tYXAoKFtrLCB2XSkgPT4gW2ssIG1hcHBlcih2LCBrLCBvKV0pKSBhcyBNYXBwZWRPYmplY3Q8VCwgVj47XHJcblx0XHR9XHJcblx0fVxyXG5cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIFF1ZXJ5U2VsZWN0b3Ige1xyXG5cclxuXHRcdGV4cG9ydCBuYW1lc3BhY2UgV2luZG93USB7XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHNlbGVjdG9yOiBLKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxTIGV4dGVuZHMgc2VsZWN0b3IsIE4gPSBUYWdOYW1lRnJvbVNlbGVjdG9yPFM+PihzZWxlY3RvcjogUyk6IFRhZ0VsZW1lbnRGcm9tVGFnTmFtZTxOPjtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHE8RSBleHRlbmRzIEVsZW1lbnQ+KHNlbGVjdG9yOiBzZWxlY3Rvcik6IEU7XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHNlbGVjdG9yOiBzZWxlY3Rvcik6IEhUTUxFbGVtZW50VGFnTmFtZU1hcFtLXTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHEoc2VsZWN0b3I6IHN0cmluZykge1xyXG5cdFx0XHRcdHJldHVybiAodGhpcz8uZG9jdW1lbnQgPz8gZG9jdW1lbnQpLnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXE8SyBleHRlbmRzIGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcD4oc2VsZWN0b3I6IEspOiAoSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdKVtdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXE8UyBleHRlbmRzIHNlbGVjdG9yLCBOID0gVGFnTmFtZUZyb21TZWxlY3RvcjxTPj4oc2VsZWN0b3I6IFMpOiBUYWdFbGVtZW50RnJvbVRhZ05hbWU8Tj5bXTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEUgZXh0ZW5kcyBFbGVtZW50PihzZWxlY3Rvcjogc2VsZWN0b3IpOiBFW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3Rvcjogc2VsZWN0b3IpOiAoSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdKVtdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXEoc2VsZWN0b3I6IHN0cmluZykge1xyXG5cdFx0XHRcdHJldHVybiBbLi4uKHRoaXM/LmRvY3VtZW50ID8/IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKV07XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgbmFtZXNwYWNlIERvY3VtZW50USB7XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IERvY3VtZW50LCBzZWxlY3RvcjogSyk6IEhUTUxFbGVtZW50VGFnTmFtZU1hcFtLXTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHE8UyBleHRlbmRzIHNlbGVjdG9yLCBOID0gVGFnTmFtZUZyb21TZWxlY3RvcjxTPj4odGhpczogRG9jdW1lbnQsIHNlbGVjdG9yOiBTKTogVGFnRWxlbWVudEZyb21UYWdOYW1lPE4+O1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxFIGV4dGVuZHMgRWxlbWVudD4odGhpczogRG9jdW1lbnQsIHNlbGVjdG9yOiBzZWxlY3Rvcik6IEU7XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IERvY3VtZW50LCBzZWxlY3Rvcjogc2VsZWN0b3IpOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxKHRoaXM6IERvY3VtZW50LCBzZWxlY3Rvcjogc3RyaW5nKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuZG9jdW1lbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXE8SyBleHRlbmRzIGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcD4odGhpczogRG9jdW1lbnQsIHNlbGVjdG9yOiBLKTogKEhUTUxFbGVtZW50VGFnTmFtZU1hcFtLXSlbXTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPFMgZXh0ZW5kcyBzZWxlY3RvciwgTiA9IFRhZ05hbWVGcm9tU2VsZWN0b3I8Uz4+KHRoaXM6IERvY3VtZW50LCBzZWxlY3RvcjogUyk6IFRhZ0VsZW1lbnRGcm9tVGFnTmFtZTxOPltdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXE8RSBleHRlbmRzIEVsZW1lbnQ+KHRoaXM6IERvY3VtZW50LCBzZWxlY3Rvcjogc2VsZWN0b3IpOiBFW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPih0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IHNlbGVjdG9yKTogKEhUTUxFbGVtZW50VGFnTmFtZU1hcFtLXSlbXTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxKHRoaXM6IERvY3VtZW50LCBzZWxlY3Rvcjogc3RyaW5nKSB7XHJcblx0XHRcdFx0cmV0dXJuIFsuLi50aGlzLmRvY3VtZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKV07XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgbmFtZXNwYWNlIEVsZW1lbnRRIHtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHE8SyBleHRlbmRzIGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcD4odGhpczogRWxlbWVudCwgc2VsZWN0b3I6IEspOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPFMgZXh0ZW5kcyBzZWxlY3RvciwgTiA9IFRhZ05hbWVGcm9tU2VsZWN0b3I8Uz4+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBTKTogVGFnRWxlbWVudEZyb21UYWdOYW1lPE4+O1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxFIGV4dGVuZHMgRWxlbWVudD4odGhpczogRWxlbWVudCwgc2VsZWN0b3I6IHNlbGVjdG9yKTogRTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHE8SyBleHRlbmRzIGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcD4odGhpczogRWxlbWVudCwgc2VsZWN0b3I6IHNlbGVjdG9yKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcSh0aGlzOiBFbGVtZW50LCBzZWxlY3Rvcjogc3RyaW5nKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPih0aGlzOiBFbGVtZW50LCBzZWxlY3RvcjogSyk6IChIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10pW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxTIGV4dGVuZHMgc2VsZWN0b3IsIE4gPSBUYWdOYW1lRnJvbVNlbGVjdG9yPFM+Pih0aGlzOiBFbGVtZW50LCBzZWxlY3RvcjogUyk6IFRhZ0VsZW1lbnRGcm9tVGFnTmFtZTxOPltdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXE8RSBleHRlbmRzIEVsZW1lbnQ+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBzZWxlY3Rvcik6IEVbXTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBzZWxlY3Rvcik6IChIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10pW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcSh0aGlzOiBFbGVtZW50LCBzZWxlY3Rvcjogc3RyaW5nKSB7XHJcblx0XHRcdFx0cmV0dXJuIFsuLi50aGlzLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFbGVtZW50RXh0ZW5zaW9uIHtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBlbWl0PFQgZXh0ZW5kcyBDdXN0b21FdmVudDx7IF9ldmVudD86IHN0cmluZyB9Pj4odGhpczogRWxlbWVudCwgdHlwZTogVFsnZGV0YWlsJ11bJ19ldmVudCddLCBkZXRhaWw/OiBUWydkZXRhaWwnXSk7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZW1pdDxUPih0aGlzOiBFbGVtZW50LCB0eXBlOiBzdHJpbmcsIGRldGFpbD86IFQpIHtcclxuXHRcdFx0bGV0IGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KHR5cGUsIHtcclxuXHRcdFx0XHRidWJibGVzOiB0cnVlLFxyXG5cdFx0XHRcdGRldGFpbCxcclxuXHRcdFx0fSk7XHJcblx0XHRcdHRoaXMuZGlzcGF0Y2hFdmVudChldmVudCk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFRvPEUgZXh0ZW5kcyBFbGVtZW50Pih0aGlzOiBFLCBwYXJlbnQ6IEVsZW1lbnQgfCBzZWxlY3Rvcik6IEUge1xyXG5cdFx0XHRpZiAodHlwZW9mIHBhcmVudCA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdHBhcmVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IocGFyZW50KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRwYXJlbnQuYXBwZW5kKHRoaXMpO1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH1cclxuXHR9XHJcblxyXG59XHJcbiIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIEVsbSB7XHJcblx0XHR0eXBlIENoaWxkID0gTm9kZSB8IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW47XHJcblx0XHR0eXBlIFNvbWVFdmVudCA9IEV2ZW50ICYgTW91c2VFdmVudCAmIEtleWJvYXJkRXZlbnQgJiB7IHRhcmdldDogSFRNTEVsZW1lbnQgfTtcclxuXHRcdHR5cGUgTGlzdGVuZXIgPSAoKGV2ZW50OiBTb21lRXZlbnQpID0+IGFueSlcclxuXHRcdFx0JiB7IG5hbWU/OiBgJHsnJyB8ICdib3VuZCAnfSR7J29uJyB8ICcnfSR7a2V5b2YgSFRNTEVsZW1lbnRFdmVudE1hcH1gIHwgJycgfSB8ICgoZXZlbnQ6IFNvbWVFdmVudCkgPT4gYW55KTtcclxuXHJcblx0XHRjb25zdCBlbG1SZWdleCA9IG5ldyBSZWdFeHAoW1xyXG5cdFx0XHQvXig/PHRhZz5bXFx3LV0rKS8sXHJcblx0XHRcdC8jKD88aWQ+W1xcdy1dKykvLFxyXG5cdFx0XHQvXFwuKD88Y2xhc3M+W1xcdy1dKykvLFxyXG5cdFx0XHQvXFxbKD88YXR0cjE+W1xcdy1dKylcXF0vLFxyXG5cdFx0XHQvXFxbKD88YXR0cjI+W1xcdy1dKyk9KD8hWydcIl0pKD88dmFsMj5bXlxcXV0qKVxcXS8sXHJcblx0XHRcdC9cXFsoPzxhdHRyMz5bXFx3LV0rKT1cIig/PHZhbDM+KD86W15cIl18XFxcXFwiKSopXCJcXF0vLFxyXG5cdFx0XHQvXFxbKD88YXR0cjQ+W1xcdy1dKyk9XCIoPzx2YWw0Pig/OlteJ118XFxcXCcpKilcIlxcXS8sXHJcblx0XHRdLm1hcChlID0+IGUuc291cmNlKS5qb2luKCd8JyksICdnJyk7XHJcblxyXG5cdFx0LyoqIGlmIGBlbG1gIHNob3VsZCBkaXNhbGxvdyBsaXN0ZW5lcnMgbm90IGV4aXN0aW5nIGFzIGBvbiAqIGAgcHJvcGVydHkgb24gdGhlIGVsZW1lbnQgKi9cclxuXHRcdGV4cG9ydCBsZXQgYWxsb3dPbmx5RXhpc3RpbmdMaXN0ZW5lcnMgPSB0cnVlO1xyXG5cclxuXHRcdC8qKiBpZiBgZWxtYCBzaG91bGQgYWxsb3cgb3ZlcnJpZGluZyBgb24gKiBgIGxpc3RlbmVycyBpZiBtdWx0aXBsZSBvZiB0aGVtIGFyZSBwcm92aWRlZCAqL1xyXG5cdFx0ZXhwb3J0IGxldCBhbGxvd092ZXJyaWRlT25MaXN0ZW5lcnMgPSBmYWxzZTtcclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHNlbGVjdG9yOiBLLCAuLi5jaGlsZHJlbjogKENoaWxkIHwgTGlzdGVuZXIpW10pOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHNlbGVjdG9yOiBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXAgZXh0ZW5kcyBLID8gbmV2ZXIgOiBzZWxlY3RvciwgLi4uY2hpbGRyZW46IChDaGlsZCB8IExpc3RlbmVyKVtdKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGVsbTxTIGV4dGVuZHMgc2VsZWN0b3IsIE4gPSBUYWdOYW1lRnJvbVNlbGVjdG9yPFM+PihzZWxlY3RvcjogUywgLi4uY2hpbGRyZW46IChDaGlsZCB8IExpc3RlbmVyKVtdKTogVGFnRWxlbWVudEZyb21UYWdOYW1lPE4+O1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGVsbTxFIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50PihzZWxlY3Rvcjogc2VsZWN0b3IsIC4uLmNoaWxkcmVuOiAoQ2hpbGQgfCBMaXN0ZW5lcilbXSk6IEU7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtKCk6IEhUTUxEaXZFbGVtZW50O1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGVsbShzZWxlY3Rvcjogc3RyaW5nID0gJycsIC4uLmNoaWxkcmVuOiAoQ2hpbGQgfCBMaXN0ZW5lcilbXSk6IEhUTUxFbGVtZW50IHtcclxuXHRcdFx0aWYgKHNlbGVjdG9yLnJlcGxhY2VBbGwoZWxtUmVnZXgsICcnKSAhPSAnJykge1xyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBzZWxlY3RvcjogJHtzZWxlY3Rvcn0gYCk7XHJcblx0XHRcdH1cclxuXHRcdFx0bGV0IGVsZW1lbnQ6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0XHRcdC8vIGxldCB0YWcgPSAnJztcclxuXHRcdFx0Ly8gbGV0IGZpcnN0TWF0Y2ggPSBmYWxzZTtcclxuXHRcdFx0Zm9yIChsZXQgbWF0Y2ggb2Ygc2VsZWN0b3IubWF0Y2hBbGwoZWxtUmVnZXgpKSB7XHJcblx0XHRcdFx0aWYgKG1hdGNoLmdyb3Vwcy50YWcpIHtcclxuXHRcdFx0XHRcdC8vIGlmICh0YWcgJiYgbWF0Y2guZ3JvdXBzLnRhZyAhPSB0YWcpIHtcclxuXHRcdFx0XHRcdC8vIFx0dGhyb3cgbmV3IEVycm9yKGBzZWxlY3RvciBoYXMgdHdvIGRpZmZlcmVudCB0YWdzIGF0IG9uY2UgOiA8JHt0YWd9PiBhbmQgPCR7bWF0Y2guZ3JvdXBzLnRhZ30+YCk7XHJcblx0XHRcdFx0XHQvLyB9XHJcblx0XHRcdFx0XHQvLyB0YWcgPSBtYXRjaC5ncm91cHMudGFnO1xyXG5cdFx0XHRcdFx0Ly8gaWYgKCFmaXJzdE1hdGNoKSByZXR1cm4gZWxtKHRhZyArIHNlbGVjdG9yLCAuLi5jaGlsZHJlbik7XHJcblx0XHRcdFx0XHRlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChtYXRjaC5ncm91cHMudGFnKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5pZCkge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5pZCA9IG1hdGNoLmdyb3Vwcy5pZDtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5jbGFzcykge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKG1hdGNoLmdyb3Vwcy5jbGFzcyk7XHJcblx0XHRcdFx0fSBlbHNlIGlmIChtYXRjaC5ncm91cHMuYXR0cjEpIHtcclxuXHRcdFx0XHRcdGVsZW1lbnQuc2V0QXR0cmlidXRlKG1hdGNoLmdyb3Vwcy5hdHRyMSwgXCJ0cnVlXCIpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAobWF0Y2guZ3JvdXBzLmF0dHIyKSB7XHJcblx0XHRcdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZShtYXRjaC5ncm91cHMuYXR0cjIsIG1hdGNoLmdyb3Vwcy52YWwyKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5hdHRyMykge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5zZXRBdHRyaWJ1dGUobWF0Y2guZ3JvdXBzLmF0dHIzLCBtYXRjaC5ncm91cHMudmFsMy5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAobWF0Y2guZ3JvdXBzLmF0dHI0KSB7XHJcblx0XHRcdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZShtYXRjaC5ncm91cHMuYXR0cjQsIG1hdGNoLmdyb3Vwcy52YWw0LnJlcGxhY2UoL1xcXFwnL2csICdcXCcnKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIGZpcnN0TWF0Y2ggPSBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRmb3IgKGxldCBsaXN0ZW5lciBvZiBjaGlsZHJlbi5maWx0ZXIoZSA9PiB0eXBlb2YgZSA9PSAnZnVuY3Rpb24nKSBhcyBMaXN0ZW5lcltdKSB7XHJcblx0XHRcdFx0bGV0IG5hbWU6IHN0cmluZyA9IGxpc3RlbmVyLm5hbWU7XHJcblx0XHRcdFx0aWYgKCFuYW1lKSBuYW1lID0gKGxpc3RlbmVyICsgJycpLm1hdGNoKC9cXGIoPyFmdW5jdGlvblxcYilcXHcrLylbMF07XHJcblx0XHRcdFx0aWYgKCFuYW1lKSB0aHJvdyBuZXcgRXJyb3IoJ3RyeWluZyB0byBiaW5kIHVubmFtZWQgZnVuY3Rpb24nKTtcclxuXHRcdFx0XHRpZiAobmFtZS5zdGFydHNXaXRoKCdib3VuZCAnKSkgbmFtZSA9IG5hbWUuc2xpY2UoJ2JvdW5kICcubGVuZ3RoKTtcclxuXHRcdFx0XHRpZiAobmFtZS5zdGFydHNXaXRoKCdvbicpKSB7XHJcblx0XHRcdFx0XHRpZiAoIWVsZW1lbnQuaGFzT3duUHJvcGVydHkobmFtZSkpIHRocm93IG5ldyBFcnJvcihgPCAke2VsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpfT4gZG9lcyBub3QgaGF2ZSBcIiR7bmFtZX1cIiBsaXN0ZW5lcmApO1xyXG5cdFx0XHRcdFx0aWYgKCFhbGxvd092ZXJyaWRlT25MaXN0ZW5lcnMgJiYgZWxlbWVudFtuYW1lXSkgdGhyb3cgbmV3IEVycm9yKCdvdmVycmlkaW5nIGBvbiAqIGAgbGlzdGVuZXJzIGlzIGRpc2FibGVkJyk7XHJcblx0XHRcdFx0XHRlbGVtZW50W25hbWVdID0gbGlzdGVuZXI7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGlmIChhbGxvd09ubHlFeGlzdGluZ0xpc3RlbmVycyAmJiBlbGVtZW50WydvbicgKyBuYW1lXSA9PT0gdW5kZWZpbmVkKVxyXG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYDwke2VsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpfT4gZG9lcyBub3QgaGF2ZSBcIm9uJyR7bmFtZX0nXCIgbGlzdGVuZXJgKTtcclxuXHRcdFx0XHRcdGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBsaXN0ZW5lcik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsZW1lbnQuYXBwZW5kKC4uLmNoaWxkcmVuLmZpbHRlcihlID0+IHR5cGVvZiBlICE9ICdmdW5jdGlvbicpIGFzIChOb2RlIHwgc3RyaW5nKVtdKTtcclxuXHRcdFx0cmV0dXJuIGVsZW1lbnQ7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFPckVsbTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3RvcjogSywgcGFyZW50PzogUGFyZW50Tm9kZSB8IHNlbGVjdG9yKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFPckVsbTxTIGV4dGVuZHMgc2VsZWN0b3IsIE4gPSBUYWdOYW1lRnJvbVNlbGVjdG9yPFM+PihzZWxlY3RvcjogUywgcGFyZW50PzogUGFyZW50Tm9kZSB8IHNlbGVjdG9yKTogVGFnRWxlbWVudEZyb21UYWdOYW1lPE4+O1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFPckVsbTxFIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50PihzZWxlY3Rvcjogc3RyaW5nLCBwYXJlbnQ/OiBQYXJlbnROb2RlIHwgc2VsZWN0b3IpOiBFO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFPckVsbShzZWxlY3Rvcjogc3RyaW5nLCBwYXJlbnQ/OiBQYXJlbnROb2RlIHwgc3RyaW5nKSB7XHJcblx0XHRcdGlmICh0eXBlb2YgcGFyZW50ID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0cGFyZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihwYXJlbnQpIGFzIFBhcmVudE5vZGU7XHJcblx0XHRcdFx0aWYgKCFwYXJlbnQpIHRocm93IG5ldyBFcnJvcignZmFpbGVkIHRvIGZpbmQgcGFyZW50IGVsZW1lbnQnKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoc2VsZWN0b3IuaW5jbHVkZXMoJz4nKSkge1xyXG5cdFx0XHRcdGxldCBwYXJlbnRTZWxlY3RvciA9IHNlbGVjdG9yLnNwbGl0KCc+Jykuc2xpY2UoMCwgLTEpLmpvaW4oJz4nKTtcclxuXHRcdFx0XHRzZWxlY3RvciA9IHNlbGVjdG9yLnNwbGl0KCc+JykucG9wKCk7XHJcblx0XHRcdFx0cGFyZW50ID0gKHBhcmVudCB8fCBkb2N1bWVudCkucXVlcnlTZWxlY3RvcihwYXJlbnRTZWxlY3RvcikgYXMgUGFyZW50Tm9kZTtcclxuXHRcdFx0XHRpZiAoIXBhcmVudCkgdGhyb3cgbmV3IEVycm9yKCdmYWlsZWQgdG8gZmluZCBwYXJlbnQgZWxlbWVudCcpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGxldCBjaGlsZCA9IChwYXJlbnQgfHwgZG9jdW1lbnQpLnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xyXG5cdFx0XHRpZiAoY2hpbGQpIHJldHVybiBjaGlsZDtcclxuXHJcblx0XHRcdGNoaWxkID0gZWxtKHNlbGVjdG9yKTtcclxuXHRcdFx0cGFyZW50Py5hcHBlbmQoY2hpbGQpO1xyXG5cdFx0XHRyZXR1cm4gY2hpbGQ7XHJcblx0XHR9XHJcblx0fVxyXG5cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cdGV4cG9ydCBsZXQgZGVidWcgPSBmYWxzZTtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBldGMge1xyXG5cclxuXHJcblx0XHRleHBvcnQgYXN5bmMgZnVuY3Rpb24gZnVsbHNjcmVlbihvbj86IGJvb2xlYW4pIHtcclxuXHRcdFx0bGV0IGNlbnRyYWwgPSBJbWFnZVNjcm9sbGluZ0V4dGVuc2lvbi5pbWFnZVNjcm9sbGluZ0FjdGl2ZSAmJiBJbWFnZVNjcm9sbGluZ0V4dGVuc2lvbi5nZXRDZW50cmFsSW1nKCk7XHJcblx0XHRcdGlmICghZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQpIHtcclxuXHRcdFx0XHRpZiAob24gPT0gZmFsc2UpIHJldHVybjtcclxuXHRcdFx0XHRhd2FpdCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4oKS5jYXRjaCgoKSA9PiB7IH0pO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGlmIChvbiA9PSB0cnVlKSByZXR1cm47XHJcblx0XHRcdFx0YXdhaXQgZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4oKS5jYXRjaCgoKSA9PiB7IH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChjZW50cmFsKSB7XHJcblx0XHRcdFx0Y2VudHJhbC5zY3JvbGxJbnRvVmlldygpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiAhIWRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50O1xyXG5cdFx0fVxyXG5cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gaGFzaENvZGUodGhpczogc3RyaW5nKTtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBoYXNoQ29kZSh2YWx1ZTogc3RyaW5nKTtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBoYXNoQ29kZSh0aGlzOiBzdHJpbmcsIHZhbHVlPzogc3RyaW5nKSB7XHJcblx0XHRcdHZhbHVlID8/PSB0aGlzO1xyXG5cdFx0XHRsZXQgaGFzaCA9IDA7XHJcblx0XHRcdGZvciAobGV0IGMgb2YgdmFsdWUpIHtcclxuXHRcdFx0XHRoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgKyBjLmNoYXJDb2RlQXQoMCk7XHJcblx0XHRcdFx0aGFzaCA9IGhhc2ggJiBoYXNoO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBoYXNoO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBpbml0KCkge1xyXG5cdFx0XHQvLyBTdHJpbmcucHJvdG90eXBlLmhhc2hDb2RlID0gaGFzaENvZGU7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGN1cnJlbnRTY3JpcHRIYXNoKCkge1xyXG5cdFx0XHRyZXR1cm4gaGFzaENvZGUoZG9jdW1lbnQuY3VycmVudFNjcmlwdC5pbm5lckhUTUwpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiByZWxvYWRPbkN1cnJlbnRTY3JpcHRDaGFuZ2VkKHNjcmlwdE5hbWU6IHN0cmluZyA9IGxvY2F0aW9uLmhvc3RuYW1lICsgJy51anMnKSB7XHJcblx0XHRcdGxldCBzY3JpcHRJZCA9IGByZWxvYWRPbkN1cnJlbnRTY3JpcHRDaGFuZ2VkXyR7c2NyaXB0TmFtZX1gO1xyXG5cdFx0XHRsZXQgc2NyaXB0SGFzaCA9IGN1cnJlbnRTY3JpcHRIYXNoKCkgKyAnJztcclxuXHRcdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oc2NyaXB0SWQsIHNjcmlwdEhhc2gpO1xyXG5cdFx0XHRhZGRFdmVudExpc3RlbmVyKCdmb2N1cycsICgpID0+IHtcclxuXHRcdFx0XHRpZiAobG9jYWxTdG9yYWdlLmdldEl0ZW0oc2NyaXB0SWQpICE9IHNjcmlwdEhhc2gpIHtcclxuXHRcdFx0XHRcdGxvY2F0aW9uLnJlbG9hZCgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGxldCBmYXN0U2Nyb2xsOiB7XHJcblx0XHRcdChzcGVlZD86IG51bWJlcik6IHZvaWQ7XHJcblx0XHRcdHNwZWVkPzogbnVtYmVyO1xyXG5cdFx0XHRhY3RpdmU/OiBib29sZWFuO1xyXG5cdFx0XHRvZmY/OiAoKSA9PiB2b2lkO1xyXG5cdFx0fSA9IGZ1bmN0aW9uIChzcGVlZCA9IDAuMjUpIHtcclxuXHRcdFx0aWYgKGZhc3RTY3JvbGwuYWN0aXZlKSBmYXN0U2Nyb2xsLm9mZigpO1xyXG5cdFx0XHRmYXN0U2Nyb2xsLmFjdGl2ZSA9IHRydWU7XHJcblx0XHRcdGZhc3RTY3JvbGwuc3BlZWQgPSBzcGVlZDtcclxuXHRcdFx0ZnVuY3Rpb24gb253aGVlbChldmVudDogV2hlZWxFdmVudCkge1xyXG5cdFx0XHRcdGlmIChldmVudC5kZWZhdWx0UHJldmVudGVkKSByZXR1cm47XHJcblx0XHRcdFx0aWYgKGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQuc2hpZnRLZXkpIHJldHVybjtcclxuXHRcdFx0XHRzY3JvbGxCeSgwLCAtTWF0aC5zaWduKGV2ZW50LmRlbHRhWSkgKiBpbm5lckhlaWdodCAqIGZhc3RTY3JvbGwuc3BlZWQpO1xyXG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdH1cclxuXHRcdFx0YWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCBvbndoZWVsLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHRmYXN0U2Nyb2xsLm9mZiA9ICgpID0+IHtcclxuXHRcdFx0XHRmYXN0U2Nyb2xsLmFjdGl2ZSA9IGZhbHNlO1xyXG5cdFx0XHRcdHJlbW92ZUV2ZW50TGlzdGVuZXIoJ3doZWVsJywgb253aGVlbCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGZhc3RTY3JvbGwuYWN0aXZlID0gZmFsc2U7XHJcblx0XHRmYXN0U2Nyb2xsLm9mZiA9ICgpID0+IHsgfTtcclxuXHJcblxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBvbnJhZihmOiAoKSA9PiB2b2lkKSB7XHJcblx0XHRcdGxldCBsb29wID0gdHJ1ZTtcclxuXHRcdFx0dm9pZCBhc3luYyBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0d2hpbGUgKGxvb3ApIHtcclxuXHRcdFx0XHRcdGF3YWl0IFByb21pc2UuZnJhbWUoKTtcclxuXHRcdFx0XHRcdGYoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0oKTtcclxuXHRcdFx0cmV0dXJuICgpID0+IHsgbG9vcCA9IGZhbHNlIH07XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IHJlc2l6ZU9ic2VydmVyOiBSZXNpemVPYnNlcnZlcjtcclxuXHRcdGxldCByZXNpemVMaXN0ZW5lcnM6ICgobmV3SGVpZ2h0OiBudW1iZXIsIG9sZEhlaWdodDogbnVtYmVyKSA9PiB2b2lkKVtdID0gW107XHJcblx0XHRsZXQgcHJldmlvdXNCb2R5SGVpZ2h0ID0gMDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBvbmhlaWdodGNoYW5nZShmOiAobmV3SGVpZ2h0OiBudW1iZXIsIG9sZEhlaWdodDogbnVtYmVyKSA9PiB2b2lkKSB7XHJcblx0XHRcdGlmICghcmVzaXplT2JzZXJ2ZXIpIHtcclxuXHRcdFx0XHRwcmV2aW91c0JvZHlIZWlnaHQgPSBkb2N1bWVudC5ib2R5LmNsaWVudEhlaWdodDtcclxuXHRcdFx0XHRyZXNpemVPYnNlcnZlciA9IG5ldyBSZXNpemVPYnNlcnZlcihlbnRyaWVzID0+IHtcclxuXHRcdFx0XHRcdGZvciAobGV0IGUgb2YgZW50cmllcykge1xyXG5cdFx0XHRcdFx0XHRpZiAoZS50YXJnZXQgIT0gZG9jdW1lbnQuYm9keSkgY29udGludWU7XHJcblxyXG5cdFx0XHRcdFx0XHRsZXQgbmV3Qm9keUhlaWdodCA9IGUudGFyZ2V0LmNsaWVudEhlaWdodDtcclxuXHRcdFx0XHRcdFx0Zm9yIChsZXQgZiBvZiByZXNpemVMaXN0ZW5lcnMpIHtcclxuXHRcdFx0XHRcdFx0XHRmKG5ld0JvZHlIZWlnaHQsIHByZXZpb3VzQm9keUhlaWdodCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0cHJldmlvdXNCb2R5SGVpZ2h0ID0gbmV3Qm9keUhlaWdodDtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHRyZXNpemVPYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJlc2l6ZUxpc3RlbmVycy5wdXNoKGYpO1xyXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoKSB7XHJcblx0XHRcdFx0cmVzaXplTGlzdGVuZXJzLnNwbGljZShyZXNpemVMaXN0ZW5lcnMuaW5kZXhPZihmKSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgZGVjbGFyZSBjb25zdCBrZHM6IHtcclxuXHRcdFx0W2s6IHN0cmluZ106IHN0cmluZyB8ICgoZTogS2V5Ym9hcmRFdmVudCAmIE1vdXNlRXZlbnQpID0+IHZvaWQpXHJcblx0XHR9O1xyXG5cclxuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShldGMsICdrZHMnLCB7XHJcblx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdFx0Z2V0KCkge1xyXG5cdFx0XHRcdGxldCBrZHMgPSBpbml0S2RzKCk7XHJcblx0XHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV0YywgJ2tkcycsIHsgdmFsdWU6IGtkcyB9KTtcclxuXHRcdFx0XHRyZXR1cm4ga2RzO1xyXG5cdFx0XHR9LFxyXG5cdFx0fSk7XHJcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoUG9vcEpzLCAna2RzJywge1xyXG5cdFx0XHRnZXQ6ICgpID0+IGV0Yy5rZHMsXHJcblx0XHRcdHNldDogKHYpID0+IE9iamVjdC5hc3NpZ24oZXRjLmtkcywgdiksXHJcblx0XHR9KTtcclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVLZHNDb2RlcyhlOiBLZXlib2FyZEV2ZW50ICYgTW91c2VFdmVudCkge1xyXG5cdFx0XHRsZXQgYmFzZVByZWZpeCA9IGAke2Uuc2hpZnRLZXkgPyAnPCcgOiAnJ30ke2UuY3RybEtleSA/ICdeJyA6ICcnfSR7ZS5hbHRLZXkgPyAnPicgOiAnJ31gO1xyXG5cdFx0XHRsZXQgYmFzZUNvZGUgPSBlLmNvZGVcclxuXHRcdFx0XHQ/IGUuY29kZS5yZXBsYWNlKC9LZXl8RGlnaXR8QXJyb3d8TGVmdHxSaWdodC8sICcnKVxyXG5cdFx0XHRcdDogWydMTUInLCAnUk1CJywgJ01NQiddW2UuYnV0dG9uXTtcclxuXHRcdFx0bGV0IGV4dHJhQ29kZSA9IGUuY29kZVxyXG5cdFx0XHRcdD8gYmFzZUNvZGUucmVwbGFjZSgnQ29udHJvbCcsICdDdHJsJylcclxuXHRcdFx0XHQ6IGJhc2VDb2RlOy8vIFsnTGVmdCcsICdSaWdodCcsICdNaWRkbGUnXVtlLmJ1dHRvbl07XHJcblx0XHRcdGxldCByYXdDb2RlID0gZS5jb2RlID8/IGJhc2VDb2RlO1xyXG5cdFx0XHRsZXQga2V5Q29kZSA9IGUua2V5ID8/IGJhc2VDb2RlO1xyXG5cdFx0XHRsZXQgZXh0cmFQcmVmaXggPSBiYXNlUHJlZml4LnJlcGxhY2UoXHJcblx0XHRcdFx0YmFzZUNvZGUgPT0gJ1NoaWZ0JyA/ICc8JyA6IGJhc2VDb2RlID09ICdDb250cm9sJyA/ICdeJyA6IGJhc2VDb2RlID09ICdBbHQnID8gJz4nIDogJydcclxuXHRcdFx0XHQsICcnKTtcclxuXHJcblx0XHRcdGxldCBjb2RlcyA9IFtiYXNlQ29kZSwgZXh0cmFDb2RlLCByYXdDb2RlLCBrZXlDb2RlXS5mbGF0TWFwKFxyXG5cdFx0XHRcdGMgPT4gW2Jhc2VQcmVmaXgsIGV4dHJhUHJlZml4XS5tYXAocCA9PiBwICsgYylcclxuXHRcdFx0KTtcclxuXHRcdFx0Ly8uZmxhdE1hcChlID0+IFtlLCBlLnRvVXBwZXJDYXNlKCksIGUudG9Mb3dlckNhc2UoKV0pO1xyXG5cdFx0XHRjb2Rlcy5wdXNoKGUuY29kZSA/ICdrZXknIDogJ21vdXNlJyk7XHJcblx0XHRcdGNvZGVzLnB1c2goJ2FueScpO1xyXG5cdFx0XHRyZXR1cm4gQXJyYXkuZnJvbShuZXcgU2V0KGNvZGVzKSk7XHJcblx0XHR9XHJcblx0XHRleHBvcnQgZnVuY3Rpb24ga2RzTGlzdGVuZXIoZTogS2V5Ym9hcmRFdmVudCAmIE1vdXNlRXZlbnQpIHtcclxuXHRcdFx0bGV0IGNvZGVzID0gZ2VuZXJhdGVLZHNDb2RlcyhlKTtcclxuXHRcdFx0T2JqZWN0LmFzc2lnbihlLCB7IF9jb2RlczogY29kZXMgfSk7XHJcblx0XHRcdGZvciAobGV0IGMgb2YgY29kZXMpIHtcclxuXHRcdFx0XHRsZXQgbGlzdGVuZXIgPSBldGMua2RzW2NdO1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgbGlzdGVuZXIgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdHEobGlzdGVuZXIpLmNsaWNrKCk7XHJcblx0XHRcdFx0fSBlbHNlIGlmICh0eXBlb2YgbGlzdGVuZXIgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0KGV0Yy5rZHNbY10gYXMgYW55KShlKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGZ1bmN0aW9uIGluaXRLZHMoKSB7XHJcblx0XHRcdGFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBrZHNMaXN0ZW5lcik7XHJcblx0XHRcdGFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGtkc0xpc3RlbmVyKTtcclxuXHRcdFx0cmV0dXJuIHt9O1xyXG5cdFx0fVxyXG5cdH1cclxuXHRleHBvcnQgZGVjbGFyZSBsZXQga2RzOiB0eXBlb2YgZXRjLmtkcztcclxufVxyXG5cclxuIiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblxyXG5cdGV4cG9ydCB0eXBlIGRlbHRhVGltZSA9IG51bWJlciB8IGAke251bWJlcn0keydzJyB8ICdoJyB8ICdkJyB8ICd3JyB8ICd5J31gIHwgbnVsbDtcclxuXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZURlbHRhVGltZShtYXhBZ2U6IGRlbHRhVGltZSkge1xyXG5cdFx0aWYgKHR5cGVvZiBtYXhBZ2UgPT0gJ251bWJlcicpIHJldHVybiBtYXhBZ2U7XHJcblx0XHRpZiAodHlwZW9mIG1heEFnZSAhPSAnc3RyaW5nJykgcmV0dXJuIEluZmluaXR5O1xyXG5cdFx0Y29uc3QgYVRvTSA9IHsgczogMWUzLCBoOiAzNjAwZTMsIGQ6IDI0ICogMzYwMGUzLCB3OiA3ICogMjQgKiAzNjAwZTMsIHk6IDM2NSAqIDI0ICogMzYwMGUzIH07XHJcblx0XHRsZXQgbiA9IHBhcnNlRmxvYXQobWF4QWdlKTtcclxuXHRcdGxldCBtID0gYVRvTVttYXhBZ2VbbWF4QWdlLmxlbmd0aCAtIDFdXTtcclxuXHRcdGlmIChuICE9IG4gfHwgIW0pIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBkZWx0YVRpbWUnKTtcclxuXHRcdHJldHVybiBuICogbTtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBuYW1lc3BhY2UgRmV0Y2hFeHRlbnNpb24ge1xyXG5cdFx0ZXhwb3J0IHR5cGUgUmVxdWVzdEluaXRFeCA9IFJlcXVlc3RJbml0ICYge1xyXG5cdFx0XHRtYXhBZ2U/OiBkZWx0YVRpbWUsXHJcblx0XHRcdHhtbD86IGJvb2xlYW4sXHJcblx0XHRcdGNhY2hlVXJsPzogc3RyaW5nIHwgJ3Bvc3QnICYgeyBfPzogJ3Bvc3QnIH0sXHJcblx0XHR9O1xyXG5cdFx0ZXhwb3J0IHR5cGUgUmVxdWVzdEluaXRFeEpzb24gPSBSZXF1ZXN0SW5pdCAmIHsgbWF4QWdlPzogZGVsdGFUaW1lLCBpbmRleGVkRGI/OiBib29sZWFuIH07XHJcblx0XHRleHBvcnQgbGV0IGRlZmF1bHRzOiBSZXF1ZXN0SW5pdCA9IHsgY3JlZGVudGlhbHM6ICdpbmNsdWRlJyB9O1xyXG5cclxuXHRcdGV4cG9ydCBsZXQgY2FjaGU6IENhY2hlID0gbnVsbDtcclxuXHRcdGFzeW5jIGZ1bmN0aW9uIG9wZW5DYWNoZSgpIHtcclxuXHRcdFx0aWYgKGNhY2hlKSByZXR1cm4gY2FjaGU7XHJcblx0XHRcdGNhY2hlID0gYXdhaXQgY2FjaGVzLm9wZW4oJ2ZldGNoJyk7XHJcblx0XHRcdHJldHVybiBjYWNoZTtcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiB0b0R1cihkdDogZGVsdGFUaW1lKSB7XHJcblx0XHRcdGR0ID0gbm9ybWFsaXplRGVsdGFUaW1lKGR0KTtcclxuXHRcdFx0aWYgKGR0ID4gMWUxMCkgZHQgPSBEYXRlLm5vdygpIC0gZHQ7XHJcblx0XHRcdGxldCBzcGxpdCA9IChuOiBudW1iZXIsIGQ6IG51bWJlcikgPT4gW24gJSBkLCB+fihuIC8gZCldO1xyXG5cdFx0XHRsZXQgdG8yID0gKG46IG51bWJlcikgPT4gKG4gKyAnJykucGFkU3RhcnQoMiwgJzAnKTtcclxuXHRcdFx0dmFyIFttcywgc10gPSBzcGxpdChkdCwgMTAwMCk7XHJcblx0XHRcdHZhciBbcywgbV0gPSBzcGxpdChzLCA2MCk7XHJcblx0XHRcdHZhciBbbSwgaF0gPSBzcGxpdChtLCA2MCk7XHJcblx0XHRcdHZhciBbaCwgZF0gPSBzcGxpdChoLCAyNCk7XHJcblx0XHRcdHZhciBbZCwgd10gPSBzcGxpdChkLCA3KTtcclxuXHRcdFx0cmV0dXJuIHcgPiAxZTMgPyAnZm9yZXZlcicgOiB3ID8gYCR7d313JHtkfWRgIDogZCA/IGAke2R9ZCR7dG8yKGgpfWhgIDogaCArIG0gPyBgJHt0bzIoaCl9OiR7dG8yKG0pfToke3RvMihzKX1gIDogYCR7cyArIH5+bXMgLyAxMDAwfXNgO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBpc1N0YWxlKGNhY2hlZEF0OiBudW1iZXIsIG1heEFnZT86IGRlbHRhVGltZSkge1xyXG5cdFx0XHRpZiAobWF4QWdlID09IG51bGwpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0cmV0dXJuIERhdGUubm93KCkgLSBjYWNoZWRBdCA+PSBub3JtYWxpemVEZWx0YVRpbWUobWF4QWdlKTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FjaGVkKHVybDogc3RyaW5nLCBpbml0OiBSZXF1ZXN0SW5pdEV4ID0ge30pOiBQcm9taXNlPFJlc3BvbnNlPiB7XHJcblx0XHRcdGxldCBub3cgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuXHRcdFx0bGV0IGNhY2hlID0gYXdhaXQgb3BlbkNhY2hlKCk7XHJcblx0XHRcdGxldCBjYWNoZVVybCA9IChpbml0LmNhY2hlVXJsID8/IHVybCkgKyAnJztcclxuXHRcdFx0aWYgKCFjYWNoZVVybC5zdGFydHNXaXRoKCdodHRwJykpIGNhY2hlVXJsID0gdXJsICsgJyYmY2FjaGVVcmw9JyArIGNhY2hlVXJsO1xyXG5cdFx0XHRsZXQgcmVzcG9uc2UgPSBhd2FpdCBjYWNoZS5tYXRjaChjYWNoZVVybCk7XHJcblx0XHRcdGlmIChyZXNwb25zZSkge1xyXG5cdFx0XHRcdHJlc3BvbnNlLmNhY2hlZEF0ID0gK3Jlc3BvbnNlLmhlYWRlcnMuZ2V0KCdjYWNoZWQtYXQnKSB8fCAwO1xyXG5cdFx0XHRcdGlmICghaXNTdGFsZShyZXNwb25zZS5jYWNoZWRBdCwgbm9ybWFsaXplRGVsdGFUaW1lKGluaXQubWF4QWdlKSkpIHtcclxuXHRcdFx0XHRcdFBvb3BKcy5kZWJ1ZyAmJiBjb25zb2xlLmxvZyhgQ2FjaGVkIHJlc3BvbnNlOiAke3RvRHVyKHJlc3BvbnNlLmNhY2hlZEF0KX0gPCBjOiR7dG9EdXIoaW5pdC5tYXhBZ2UpfWAsIHVybCk7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzcG9uc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdFBvb3BKcy5kZWJ1ZyAmJiBjb25zb2xlLmxvZyhgU3RhbGUgcmVzcG9uc2U6ICR7dG9EdXIocmVzcG9uc2UuY2FjaGVkQXQpfSA+IGM6JHt0b0R1cihpbml0Lm1heEFnZSl9YCwgdXJsKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXNwb25zZSA9XHJcblx0XHRcdFx0IWluaXQueG1sID8gYXdhaXQgZmV0Y2godXJsLCB7IC4uLmRlZmF1bHRzLCAuLi5pbml0IH0pXHJcblx0XHRcdFx0XHQ6IGF3YWl0IHhtbFJlc3BvbnNlKHVybCwgaW5pdCk7XHJcblx0XHRcdGlmIChyZXNwb25zZS5vaykge1xyXG5cdFx0XHRcdHJlc3BvbnNlLmNhY2hlZEF0ID0gRGF0ZS5ub3coKTtcclxuXHRcdFx0XHRsZXQgY2xvbmUgPSByZXNwb25zZS5jbG9uZSgpO1xyXG5cdFx0XHRcdGxldCBpbml0MjogUmVzcG9uc2VJbml0ID0ge1xyXG5cdFx0XHRcdFx0c3RhdHVzOiBjbG9uZS5zdGF0dXMsIHN0YXR1c1RleHQ6IGNsb25lLnN0YXR1c1RleHQsXHJcblx0XHRcdFx0XHRoZWFkZXJzOiBbWydjYWNoZWQtYXQnLCBgJHtyZXNwb25zZS5jYWNoZWRBdH1gXSwgLi4uY2xvbmUuaGVhZGVycy5lbnRyaWVzKCldXHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHRsZXQgcmVzdWx0UmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UoY2xvbmUuYm9keSwgaW5pdDIpO1xyXG5cdFx0XHRcdGNhY2hlLnB1dChjYWNoZVVybCwgcmVzdWx0UmVzcG9uc2UpO1xyXG5cdFx0XHRcdGxldCBkdCA9IHBlcmZvcm1hbmNlLm5vdygpIC0gbm93O1xyXG5cdFx0XHRcdFBvb3BKcy5kZWJ1ZyAmJiBjb25zb2xlLmxvZyhgTG9hZGVkIHJlc3BvbnNlOiAke3RvRHVyKGR0KX0gLyBjOiR7dG9EdXIoaW5pdC5tYXhBZ2UpfWAsIHVybCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0UG9vcEpzLmRlYnVnICYmIGNvbnNvbGUubG9nKGBGYWlsZWQgcmVzcG9uc2U6ICR7dG9EdXIocmVzcG9uc2UuY2FjaGVkQXQpfSAvIGM6JHt0b0R1cihpbml0Lm1heEFnZSl9YCwgdXJsKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gcmVzcG9uc2U7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhY2hlZERvYyh1cmw6IHN0cmluZywgaW5pdDogUmVxdWVzdEluaXRFeCA9IHt9KTogUHJvbWlzZTxEb2N1bWVudD4ge1xyXG5cdFx0XHRsZXQgcmVzcG9uc2UgPSBhd2FpdCBjYWNoZWQodXJsLCBpbml0KTtcclxuXHRcdFx0bGV0IHRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XHJcblx0XHRcdGxldCBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKCk7XHJcblx0XHRcdGxldCBkb2MgPSBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKHRleHQsICd0ZXh0L2h0bWwnKTtcclxuXHRcdFx0bGV0IGJhc2UgPSBkb2MuY3JlYXRlRWxlbWVudCgnYmFzZScpO1xyXG5cdFx0XHRiYXNlLmhyZWYgPSB1cmw7XHJcblx0XHRcdGRvYy5oZWFkLmFwcGVuZChiYXNlKTtcclxuXHRcdFx0ZG9jLmNhY2hlZEF0ID0gcmVzcG9uc2UuY2FjaGVkQXQ7XHJcblx0XHRcdHJldHVybiBkb2M7XHJcblx0XHR9XHJcblxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBkb2ModXJsOiBzdHJpbmcsIGluaXQ6IFJlcXVlc3RJbml0RXggPSB7fSk6IFByb21pc2U8RG9jdW1lbnQ+IHtcclxuXHRcdFx0bGV0IHJlc3BvbnNlID1cclxuXHRcdFx0XHQhaW5pdC54bWwgPyBhd2FpdCBmZXRjaCh1cmwsIHsgLi4uZGVmYXVsdHMsIC4uLmluaXQgfSlcclxuXHRcdFx0XHRcdDogYXdhaXQgeG1sUmVzcG9uc2UodXJsLCBpbml0KTtcclxuXHRcdFx0bGV0IHRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XHJcblx0XHRcdGxldCBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKCk7XHJcblx0XHRcdGxldCBkb2MgPSBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKHRleHQsICd0ZXh0L2h0bWwnKTtcclxuXHRcdFx0bGV0IGJhc2UgPSBkb2MuY3JlYXRlRWxlbWVudCgnYmFzZScpO1xyXG5cdFx0XHRiYXNlLmhyZWYgPSB1cmw7XHJcblx0XHRcdGRvYy5oZWFkLmFwcGVuZChiYXNlKTtcclxuXHRcdFx0ZG9jLmNhY2hlZEF0ID0gcmVzcG9uc2UuY2FjaGVkQXQ7XHJcblx0XHRcdHJldHVybiBkb2M7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHhtbFJlc3BvbnNlKHVybDogc3RyaW5nLCBpbml0OiBSZXF1ZXN0SW5pdEV4ID0ge30pOiBQcm9taXNlPFJlc3BvbnNlPiB7XHJcblx0XHRcdGxldCBwID0gUHJvbWlzZUV4dGVuc2lvbi5lbXB0eTxQcm9ncmVzc0V2ZW50PEV2ZW50VGFyZ2V0Pj4oKTtcclxuXHRcdFx0bGV0IG9SZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuXHRcdFx0b1JlcS5vbmxvYWQgPSBwLnI7XHJcblx0XHRcdG9SZXEucmVzcG9uc2VUeXBlID0gJ2RvY3VtZW50JztcclxuXHRcdFx0b1JlcS5vcGVuKFwiZ2V0XCIsIHVybCwgdHJ1ZSk7XHJcblx0XHRcdG9SZXEuc2VuZCgpO1xyXG5cdFx0XHRhd2FpdCBwO1xyXG5cdFx0XHRpZiAob1JlcS5yZXNwb25zZVR5cGUgIT0gJ2RvY3VtZW50JykgdGhyb3cgbmV3IEVycm9yKCdGSVhNRScpO1xyXG5cdFx0XHRyZXR1cm4gbmV3IFJlc3BvbnNlKG9SZXEucmVzcG9uc2VYTUwuZG9jdW1lbnRFbGVtZW50Lm91dGVySFRNTCwgaW5pdCk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGpzb24odXJsOiBzdHJpbmcsIGluaXQ6IFJlcXVlc3RJbml0ID0ge30pOiBQcm9taXNlPHVua25vd24+IHtcclxuXHRcdFx0cmV0dXJuIGZldGNoKHVybCwgeyAuLi5kZWZhdWx0cywgLi4uaW5pdCB9KS50aGVuKGUgPT4gZS5qc29uKCkpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbGVhckNhY2hlKCkge1xyXG5cdFx0XHRjYWNoZSA9IG51bGw7XHJcblx0XHRcdHJldHVybiBjYWNoZXMuZGVsZXRlKCdmZXRjaCcpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiB1bmNhY2hlKHVybDogc3RyaW5nKSB7XHJcblx0XHRcdGxldCBjYWNoZSA9IGF3YWl0IG9wZW5DYWNoZSgpO1xyXG5cdFx0XHRsZXQgZDEgPSBjYWNoZS5kZWxldGUodXJsKTtcclxuXHRcdFx0bGV0IGQyID0gYXdhaXQgaWRiRGVsZXRlKHVybCk7XHJcblx0XHRcdHJldHVybiAoYXdhaXQgZDEpIHx8IGQyO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBpc0NhY2hlZCh1cmw6IHN0cmluZywgb3B0aW9uczogeyBtYXhBZ2U/OiBkZWx0YVRpbWUsIGluZGV4ZWREYj86IGJvb2xlYW4gfCAnb25seScgfSA9IHt9KTogUHJvbWlzZTxib29sZWFuIHwgJ2lkYic+IHtcclxuXHRcdFx0aWYgKG9wdGlvbnMuaW5kZXhlZERiKSB7XHJcblx0XHRcdFx0bGV0IGRiSnNvbiA9IGF3YWl0IGlkYkdldCh1cmwpO1xyXG5cdFx0XHRcdGlmIChkYkpzb24pIHtcclxuXHRcdFx0XHRcdHJldHVybiBpc1N0YWxlKGRiSnNvbi5jYWNoZWRBdCwgbm9ybWFsaXplRGVsdGFUaW1lKG9wdGlvbnMubWF4QWdlKSkgPyBmYWxzZSA6ICdpZGInO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAob3B0aW9ucy5pbmRleGVkRGIgPT0gJ29ubHknKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdFx0bGV0IGNhY2hlID0gYXdhaXQgb3BlbkNhY2hlKCk7XHJcblx0XHRcdGxldCByZXNwb25zZSA9IGF3YWl0IGNhY2hlLm1hdGNoKHVybCk7XHJcblx0XHRcdGlmICghcmVzcG9uc2UpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0aWYgKG9wdGlvbnM/Lm1heEFnZSAhPSBudWxsKSB7XHJcblx0XHRcdFx0bGV0IGNhY2hlZEF0ID0gK3Jlc3BvbnNlLmhlYWRlcnMuZ2V0KCdjYWNoZWQtYXQnKSB8fCAwO1xyXG5cdFx0XHRcdGlmIChpc1N0YWxlKHJlc3BvbnNlLmNhY2hlZEF0LCBub3JtYWxpemVEZWx0YVRpbWUob3B0aW9ucy5tYXhBZ2UpKSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH1cclxuXHJcblxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWNoZWRKc29uKHVybDogc3RyaW5nLCBpbml0OiBSZXF1ZXN0SW5pdEV4SnNvbiA9IHt9KTogUHJvbWlzZTx1bmtub3duPiB7XHJcblx0XHRcdGlmIChpbml0LmluZGV4ZWREYikge1xyXG5cdFx0XHRcdGxldCBkYkpzb24gPSBhd2FpdCBpZGJHZXQodXJsKTtcclxuXHRcdFx0XHRpZiAoZGJKc29uKSB7XHJcblx0XHRcdFx0XHRpZiAoIWlzU3RhbGUoZGJKc29uLmNhY2hlZEF0LCBpbml0Lm1heEFnZSkpIHtcclxuXHRcdFx0XHRcdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKGRiSnNvbi5kYXRhIGFzIGFueSwgJ2NhY2hlZCcsIGRiSnNvbi5jYWNoZWRBdCk7XHJcblx0XHRcdFx0XHRcdHJldHVybiBkYkpzb24uZGF0YTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0bGV0IHJlc3BvbnNlID0gYXdhaXQgY2FjaGVkKHVybCwgaW5pdCk7XHJcblx0XHRcdGxldCBqc29uID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG5cdFx0XHRQb29wSnMuZGVidWcgJiYgY29uc29sZS5sb2coYCAgPSBgLCBqc29uKTtcclxuXHJcblx0XHRcdGlmICghKCdjYWNoZWQnIGluIGpzb24pKSB7XHJcblx0XHRcdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKGpzb24sICdjYWNoZWQnLCByZXNwb25zZS5jYWNoZWRBdCk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGluaXQuaW5kZXhlZERiKSB7XHJcblx0XHRcdFx0aWRiUHV0KHVybCwganNvbiwgcmVzcG9uc2UuY2FjaGVkQXQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBqc29uO1xyXG5cdFx0fVxyXG5cclxuXHJcblx0XHRsZXQgX2lkYkluc3RhbmNlUHJvbWlzZTogSURCRGF0YWJhc2UgfCBQcm9taXNlPElEQkRhdGFiYXNlPiA9IG51bGw7XHJcblx0XHRsZXQgaWRiSW5zdGFuY2U6IElEQkRhdGFiYXNlID0gbnVsbDtcclxuXHJcblx0XHRhc3luYyBmdW5jdGlvbiBvcGVuSWRiKCk6IFByb21pc2U8SURCRGF0YWJhc2U+IHtcclxuXHRcdFx0aWYgKGlkYkluc3RhbmNlKSByZXR1cm4gaWRiSW5zdGFuY2U7XHJcblx0XHRcdGlmIChhd2FpdCBfaWRiSW5zdGFuY2VQcm9taXNlKSB7XHJcblx0XHRcdFx0cmV0dXJuIGlkYkluc3RhbmNlO1xyXG5cdFx0XHR9XHJcblx0XHRcdGxldCBpcnEgPSBpbmRleGVkREIub3BlbignZmV0Y2gnKTtcclxuXHRcdFx0aXJxLm9udXBncmFkZW5lZWRlZCA9IGV2ZW50ID0+IHtcclxuXHRcdFx0XHRsZXQgZGIgPSBpcnEucmVzdWx0O1xyXG5cdFx0XHRcdGxldCBzdG9yZSA9IGRiLmNyZWF0ZU9iamVjdFN0b3JlKCdmZXRjaCcsIHsga2V5UGF0aDogJ3VybCcgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0X2lkYkluc3RhbmNlUHJvbWlzZSA9IG5ldyBQcm9taXNlKChyLCBqKSA9PiB7XHJcblx0XHRcdFx0aXJxLm9uc3VjY2VzcyA9IHI7XHJcblx0XHRcdFx0aXJxLm9uZXJyb3IgPSBqO1xyXG5cdFx0XHR9KS50aGVuKCgpID0+IGlycS5yZXN1bHQsICgpID0+IG51bGwpO1xyXG5cdFx0XHRpZGJJbnN0YW5jZSA9IF9pZGJJbnN0YW5jZVByb21pc2UgPSBhd2FpdCBfaWRiSW5zdGFuY2VQcm9taXNlO1xyXG5cdFx0XHRpZiAoIWlkYkluc3RhbmNlKSB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBvcGVuIGluZGV4ZWREQicpO1xyXG5cdFx0XHRyZXR1cm4gaWRiSW5zdGFuY2U7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGlkYkNsZWFyKCkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1RPRE8nKVxyXG5cdFx0fVxyXG5cclxuXHJcblx0XHRhc3luYyBmdW5jdGlvbiBpZGJHZXQodXJsOiBzdHJpbmcpOiBQcm9taXNlPHsgdXJsOiBzdHJpbmcsIGRhdGE6IHVua25vd24sIGNhY2hlZEF0OiBudW1iZXIgfSB8IHVuZGVmaW5lZD4ge1xyXG5cdFx0XHRsZXQgZGIgPSBhd2FpdCBvcGVuSWRiKCk7XHJcblx0XHRcdGxldCB0ID0gZGIudHJhbnNhY3Rpb24oWydmZXRjaCddLCAncmVhZG9ubHknKTtcclxuXHRcdFx0bGV0IHJxID0gdC5vYmplY3RTdG9yZSgnZmV0Y2gnKS5nZXQodXJsKTtcclxuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKHIgPT4ge1xyXG5cdFx0XHRcdHJxLm9uc3VjY2VzcyA9ICgpID0+IHIocnEucmVzdWx0KTtcclxuXHRcdFx0XHRycS5vbmVycm9yID0gKCkgPT4gcih1bmRlZmluZWQpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRhc3luYyBmdW5jdGlvbiBpZGJQdXQodXJsOiBzdHJpbmcsIGRhdGE6IHVua25vd24sIGNhY2hlZEF0PzogbnVtYmVyKTogUHJvbWlzZTxJREJWYWxpZEtleSB8IHVuZGVmaW5lZD4ge1xyXG5cdFx0XHRsZXQgZGIgPSBhd2FpdCBvcGVuSWRiKCk7XHJcblx0XHRcdGxldCB0ID0gZGIudHJhbnNhY3Rpb24oWydmZXRjaCddLCAncmVhZHdyaXRlJyk7XHJcblx0XHRcdGxldCBycSA9IHQub2JqZWN0U3RvcmUoJ2ZldGNoJykucHV0KHsgdXJsLCBkYXRhLCBjYWNoZWRBdDogY2FjaGVkQXQgPz8gK25ldyBEYXRlKCkgfSk7XHJcblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZShyID0+IHtcclxuXHRcdFx0XHRycS5vbnN1Y2Nlc3MgPSAoKSA9PiByKHJxLnJlc3VsdCk7XHJcblx0XHRcdFx0cnEub25lcnJvciA9ICgpID0+IHIodW5kZWZpbmVkKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cdFx0YXN5bmMgZnVuY3Rpb24gaWRiRGVsZXRlKHVybDogc3RyaW5nKTogUHJvbWlzZTxJREJWYWxpZEtleSB8IHVuZGVmaW5lZD4ge1xyXG5cdFx0XHRsZXQgZGIgPSBhd2FpdCBvcGVuSWRiKCk7XHJcblx0XHRcdGxldCB0ID0gZGIudHJhbnNhY3Rpb24oWydmZXRjaCddLCAncmVhZHdyaXRlJyk7XHJcblx0XHRcdGxldCBycSA9IHQub2JqZWN0U3RvcmUoJ2ZldGNoJykuZGVsZXRlKHVybCk7XHJcblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZShyID0+IHtcclxuXHRcdFx0XHRycS5vbnN1Y2Nlc3MgPSAoKSA9PiByKHJxLnJlc3VsdCk7XHJcblx0XHRcdFx0cnEub25lcnJvciA9ICgpID0+IHIodW5kZWZpbmVkKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFbnRyeUZpbHRlcmVyRXh0ZW5zaW9uIHtcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIGNhbiBiZSBlaXRoZXIgTWFwIG9yIFdlYWtNYXBcclxuXHRcdCAqIChXZWFrTWFwIGlzIGxpa2VseSB0byBiZSB1c2VsZXNzIGlmIHRoZXJlIGFyZSBsZXNzIHRoZW4gMTBrIG9sZCBub2RlcyBpbiBtYXApXHJcblx0XHQgKi9cclxuXHRcdGxldCBNYXBUeXBlID0gTWFwO1xyXG5cdFx0dHlwZSBNYXBUeXBlPEsgZXh0ZW5kcyBvYmplY3QsIFY+ID0vLyBNYXA8SywgVj4gfCBcclxuXHRcdFx0V2Vha01hcDxLLCBWPjtcclxuXHJcblx0XHRmdW5jdGlvbiB0b0VsQXJyYXkoZW50cnlTZWxlY3Rvcjogc2VsZWN0b3IgfCAoKCkgPT4gSFRNTEVsZW1lbnRbXSkpOiBIVE1MRWxlbWVudFtdIHtcclxuXHRcdFx0cmV0dXJuIHR5cGVvZiBlbnRyeVNlbGVjdG9yID09ICdmdW5jdGlvbicgPyBlbnRyeVNlbGVjdG9yKCkgOiBxcShlbnRyeVNlbGVjdG9yKTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgY2xhc3MgRW50cnlGaWx0ZXJlcjxEYXRhIGV4dGVuZHMge30gPSB7fT4ge1xyXG5cdFx0XHRjb250YWluZXI6IEhUTUxFbGVtZW50O1xyXG5cdFx0XHRlbnRyeVNlbGVjdG9yOiBzZWxlY3RvciB8ICgoKSA9PiBIVE1MRWxlbWVudFtdKTtcclxuXHRcdFx0Y29uc3RydWN0b3IoZW50cnlTZWxlY3Rvcjogc2VsZWN0b3IgfCAoKCkgPT4gSFRNTEVsZW1lbnRbXSksIGVuYWJsZWQ6IGJvb2xlYW4gfCAnc29mdCcgPSAnc29mdCcpIHtcclxuXHRcdFx0XHR0aGlzLmVudHJ5U2VsZWN0b3IgPSBlbnRyeVNlbGVjdG9yO1xyXG5cdFx0XHRcdHRoaXMuY29udGFpbmVyID0gZWxtKCcuZWYtY29udGFpbmVyJyk7XHJcblxyXG5cdFx0XHRcdGlmIChlbmFibGVkID09ICdzb2Z0Jykge1xyXG5cdFx0XHRcdFx0dGhpcy5zb2Z0RGlzYWJsZSA9IHRydWU7XHJcblx0XHRcdFx0XHR0aGlzLmRpc2FibGUoJ3NvZnQnKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKGVuYWJsZWQpIHtcclxuXHRcdFx0XHRcdHRoaXMuc29mdERpc2FibGUgPSBmYWxzZTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0Ly8gZW5hYmxlZCBpcyBmYWxzeVxyXG5cdFx0XHRcdFx0dGhpcy5zb2Z0RGlzYWJsZSA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0dGhpcy5kaXNhYmxlKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMuc3R5bGUoKTtcclxuXHJcblx0XHRcdFx0dGhpcy51cGRhdGUoKTtcclxuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyPFBhZ2luYXRlRXh0ZW5zaW9uLlBNb2RpZnlFdmVudD4oJ3BhZ2luYXRpb25tb2RpZnknLCAoKSA9PiB0aGlzLnJlcXVlc3RVcGRhdGUoKSk7XHJcblx0XHRcdFx0ZXRjLm9uaGVpZ2h0Y2hhbmdlKCgpID0+IHRoaXMucmVxdWVzdFVwZGF0ZSgpKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZW50cmllczogSFRNTEVsZW1lbnRbXSA9IFtdO1xyXG5cdFx0XHRlbnRyeURhdGFzOiBNYXBUeXBlPEhUTUxFbGVtZW50LCBEYXRhPiA9IG5ldyBNYXBUeXBlKCk7XHJcblxyXG5cdFx0XHRnZXREYXRhKGVsOiBIVE1MRWxlbWVudCk6IERhdGE7XHJcblx0XHRcdGdldERhdGEoKTogRGF0YVtdO1xyXG5cdFx0XHRnZXREYXRhKGVsPzogSFRNTEVsZW1lbnQpOiBEYXRhIHwgRGF0YVtdIHtcclxuXHRcdFx0XHRpZiAoIWVsKSByZXR1cm4gdGhpcy5lbnRyaWVzLm1hcChlID0+IHRoaXMuZ2V0RGF0YShlKSk7XHJcblx0XHRcdFx0bGV0IGRhdGEgPSB0aGlzLmVudHJ5RGF0YXMuZ2V0KGVsKTtcclxuXHRcdFx0XHRpZiAoIWRhdGEpIHtcclxuXHRcdFx0XHRcdGRhdGEgPSB0aGlzLnBhcnNlRW50cnkoZWwpO1xyXG5cdFx0XHRcdFx0dGhpcy5lbnRyeURhdGFzLnNldChlbCwgZGF0YSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBkYXRhO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR1cGRhdGVQZW5kaW5nID0gZmFsc2U7XHJcblx0XHRcdHJlcGFyc2VQZW5kaW5nID0gZmFsc2U7XHJcblx0XHRcdHJlcXVlc3RVcGRhdGUocmVwYXJzZSA9IGZhbHNlKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMudXBkYXRlUGVuZGluZykgcmV0dXJuO1xyXG5cdFx0XHRcdHRoaXMudXBkYXRlUGVuZGluZyA9IHRydWU7XHJcblx0XHRcdFx0aWYgKHJlcGFyc2UpIHRoaXMucmVwYXJzZVBlbmRpbmcgPSB0cnVlO1xyXG5cdFx0XHRcdHNldFRpbWVvdXQoKCkgPT4gdGhpcy51cGRhdGUoKSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHBhcnNlcnM6IFBhcnNlckZuPERhdGE+W10gPSBbXTtcclxuXHRcdFx0d3JpdGVEYXRhQXR0cmlidXRlID0gZmFsc2U7XHJcblx0XHRcdGFkZFBhcnNlcihwYXJzZXI6IFBhcnNlckZuPERhdGE+KSB7XHJcblx0XHRcdFx0dGhpcy5wYXJzZXJzLnB1c2gocGFyc2VyKTtcclxuXHRcdFx0XHR0aGlzLnJlcXVlc3RVcGRhdGUodHJ1ZSk7XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gcmVwYXJzZUVudHJpZXMoZW50cmllcyA9IHRoaXMuZW50cmllcyk6IERhdGFbXSB7XHJcblx0XHRcdC8vIFx0Ly8gcHJlcGFyc2VcclxuXHRcdFx0Ly8gXHRsZXQgcGFyZW50cyA9IG5ldyBTZXQoZW50cmllcy5tYXAoZT0+ZS5wYXJlbnRFbGVtZW50KSk7XHJcblx0XHRcdC8vIFx0Zm9yIChsZXQgcGFyZW50IG9mIHBhcmVudHMpIHtcclxuXHRcdFx0Ly8gXHRcdHBhcmVudC5jbGFzc0xpc3QuYWRkKCdlZi1lbnRyeS1jb250YWluZXInKTtcclxuXHRcdFx0Ly8gXHR9XHJcblx0XHRcdC8vIFx0Zm9yIChsZXQgZSBvZiBlbnRyaWVzKSB7XHJcblx0XHRcdC8vIFx0XHRlLmNsYXNzTGlzdC5hZGQoJ2VmLWVudHJ5Jyk7XHJcblx0XHRcdC8vIFx0fVxyXG5cclxuXHRcdFx0Ly8gXHRsZXQgZGF0YXMgPVxyXG5cdFx0XHQvLyBcdGZvciAobGV0IHBhcnNlciBvZiB0aGlzLnBhcnNlcnMpIHtcclxuXHJcblx0XHRcdC8vIFx0fVxyXG5cdFx0XHQvLyBcdHJldHVybiAwIGFzIGFueTtcclxuXHRcdFx0Ly8gfVxyXG5cdFx0XHRwYXJzZUVudHJ5KGVsOiBIVE1MRWxlbWVudCk6IERhdGEge1xyXG5cdFx0XHRcdGVsLnBhcmVudEVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnZWYtZW50cnktY29udGFpbmVyJyk7XHJcblx0XHRcdFx0ZWwuY2xhc3NMaXN0LmFkZCgnZWYtZW50cnknKTtcclxuXHJcblx0XHRcdFx0bGV0IGRhdGE6IERhdGEgPSB7fSBhcyBEYXRhO1xyXG5cdFx0XHRcdGZvciAobGV0IHBhcnNlciBvZiB0aGlzLnBhcnNlcnMpIHtcclxuXHRcdFx0XHRcdGxldCBuZXdEYXRhID0gcGFyc2VyKGVsLCBkYXRhKTtcclxuXHRcdFx0XHRcdGlmICghbmV3RGF0YSB8fCBuZXdEYXRhID09IGRhdGEpIGNvbnRpbnVlO1xyXG5cdFx0XHRcdFx0aWYgKCFJc1Byb21pc2UobmV3RGF0YSkpIHtcclxuXHRcdFx0XHRcdFx0T2JqZWN0LmFzc2lnbihkYXRhLCBuZXdEYXRhKTtcclxuXHRcdFx0XHRcdFx0Y29udGludWU7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRuZXdEYXRhLnRoZW4ocE5ld0RhdGEgPT4ge1xyXG5cdFx0XHRcdFx0XHRpZiAocE5ld0RhdGEgJiYgcE5ld0RhdGEgIT0gZGF0YSkge1xyXG5cdFx0XHRcdFx0XHRcdE9iamVjdC5hc3NpZ24oZGF0YSwgcE5ld0RhdGEpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdHRoaXMucmVxdWVzdFVwZGF0ZSgpO1xyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMud3JpdGVEYXRhQXR0cmlidXRlKSB7XHJcblx0XHRcdFx0XHRlbC5zZXRBdHRyaWJ1dGUoJ2VmLWRhdGEnLCBKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBkYXRhO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRhZGRJdGVtPElULCBUIGV4dGVuZHMgSVQsIElTIGV4dGVuZHMgRmlsdGVyZXJJdGVtUGFydGlhbCwgUywgVFMgZXh0ZW5kcyBTICYgSVMgJiBGaWx0ZXJlckl0ZW1Tb3VyY2U+KGNvbnN0cnVjdG9yOiB7IG5ldyhkYXRhOiBUUyk6IFQgfSwgbGlzdDogSVRbXSwgZGF0YTogSVMsIHNvdXJjZTogUyk6IFQge1xyXG5cdFx0XHRcdE9iamVjdC5hc3NpZ24oZGF0YSwgc291cmNlLCB7IHBhcmVudDogdGhpcyB9KTtcclxuXHRcdFx0XHRkYXRhLm5hbWUgPz89IGRhdGEuaWQ7XHJcblx0XHRcdFx0bGV0IGl0ZW0gPSBuZXcgY29uc3RydWN0b3IoZGF0YSBhcyBUUyk7XHJcblx0XHRcdFx0bGlzdC5wdXNoKGl0ZW0pO1xyXG5cdFx0XHRcdHJldHVybiBpdGVtO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmaWx0ZXJzOiBJRmlsdGVyPERhdGE+W10gPSBbXTtcclxuXHRcdFx0c29ydGVyczogSVNvcnRlcjxEYXRhPltdID0gW107XHJcblx0XHRcdG1vZGlmaWVyczogSU1vZGlmaWVyPERhdGE+W10gPSBbXTtcclxuXHJcblx0XHRcdGdldCBieU5hbWUoKSB7XHJcblx0XHRcdFx0cmV0dXJuIE9iamVjdC5hc3NpZ24oXHJcblx0XHRcdFx0XHRPYmplY3QuZnJvbUVudHJpZXModGhpcy5maWx0ZXJzLm1hcChlID0+IFtlLmlkLCBlXSkpLFxyXG5cdFx0XHRcdFx0T2JqZWN0LmZyb21FbnRyaWVzKHRoaXMuc29ydGVycy5tYXAoZSA9PiBbZS5pZCwgZV0pKSxcclxuXHRcdFx0XHRcdE9iamVjdC5mcm9tRW50cmllcyh0aGlzLm1vZGlmaWVycy5tYXAoZSA9PiBbZS5pZCwgZV0pKSxcclxuXHRcdFx0XHRcdHtcclxuXHRcdFx0XHRcdFx0ZmlsdGVyczogT2JqZWN0LmZyb21FbnRyaWVzKHRoaXMuZmlsdGVycy5tYXAoZSA9PiBbZS5pZCwgZV0pKSxcclxuXHRcdFx0XHRcdFx0c29ydGVyczogT2JqZWN0LmZyb21FbnRyaWVzKHRoaXMuc29ydGVycy5tYXAoZSA9PiBbZS5pZCwgZV0pKSxcclxuXHRcdFx0XHRcdFx0bW9kaWZpZXJzOiBPYmplY3QuZnJvbUVudHJpZXModGhpcy5tb2RpZmllcnMubWFwKGUgPT4gW2UuaWQsIGVdKSksXHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdCk7XHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHRhZGRGaWx0ZXIoaWQ6IHN0cmluZywgZmlsdGVyOiBGaWx0ZXJGbjxEYXRhPiwgZGF0YT86IEZpbHRlclBhcnRpYWw8RGF0YT4pOiBGaWx0ZXI8RGF0YT47XHJcblx0XHRcdGFkZEZpbHRlcihwcm9wTmFtZTogc3RyaW5nICYga2V5b2YgRGF0YSk6IEZpbHRlcjxEYXRhPjtcclxuXHRcdFx0YWRkRmlsdGVyKGlkOiBzdHJpbmcsIGZpbHRlcj86IEZpbHRlckZuPERhdGE+LCBkYXRhOiBGaWx0ZXJQYXJ0aWFsPERhdGE+ID0ge30pOiBGaWx0ZXI8RGF0YT4ge1xyXG5cdFx0XHRcdGlmICghZmlsdGVyKSByZXR1cm4gdGhpcy5hZGRGaWx0ZXIoaWQsIGQgPT4gZFtpZF0pO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmFkZEl0ZW0oRmlsdGVyLCB0aGlzLmZpbHRlcnMsIGRhdGEsIHsgaWQsIGZpbHRlciB9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRhZGRWRmlsdGVyPFYgZXh0ZW5kcyBudW1iZXIgfCBzdHJpbmc+KGlkOiBzdHJpbmcsIGZpbHRlcjogVmFsdWVGaWx0ZXJGbjxEYXRhLCBWPiwgZGF0YTogVmFsdWVGaWx0ZXJQYXJ0aWFsPERhdGEsIFY+KTogVmFsdWVGaWx0ZXI8RGF0YSwgVj47XHJcblx0XHRcdGFkZFZGaWx0ZXI8ViBleHRlbmRzIG51bWJlciB8IHN0cmluZz4oaWQ6IHN0cmluZywgZmlsdGVyOiBWYWx1ZUZpbHRlckZuPERhdGEsIFY+LCBkYXRhOiBWKTtcclxuXHRcdFx0YWRkVkZpbHRlcjxWIGV4dGVuZHMgbnVtYmVyPihwcm9wTmFtZTogc3RyaW5nICYga2V5b2YgRGF0YSwgZGVmYXVsdE1pbjogVik7XHJcblx0XHRcdGFkZFZGaWx0ZXI8ViBleHRlbmRzIG51bWJlciB8IHN0cmluZz4oaWQ6IHN0cmluZywgZmlsdGVyOiBWYWx1ZUZpbHRlckZuPERhdGEsIFY+IHwgViwgZGF0YT86IFZhbHVlRmlsdGVyUGFydGlhbDxEYXRhLCBWPiB8IFYpIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIGZpbHRlciAhPSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5hZGRWRmlsdGVyKGlkLCAodiwgZCkgPT4gZFtpZF0gPiB2LCBmaWx0ZXIpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodHlwZW9mIGRhdGEgIT0gJ29iamVjdCcgfHwgIWRhdGEpIHtcclxuXHRcdFx0XHRcdGRhdGEgPSB7IGlucHV0OiBkYXRhIGFzIFYgfTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuYWRkSXRlbShWYWx1ZUZpbHRlciwgdGhpcy5maWx0ZXJzLCBkYXRhLCB7IGlkLCBmaWx0ZXIgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0YWRkTUZpbHRlcihpZDogc3RyaW5nLCB2YWx1ZTogKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCkgPT4gc3RyaW5nLCBkYXRhOiBNYXRjaEZpbHRlclNvdXJjZTxEYXRhPikge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmFkZEl0ZW0oTWF0Y2hGaWx0ZXIsIHRoaXMuZmlsdGVycywgZGF0YSwgeyBpZCwgdmFsdWUgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0YWRkVGFnRmlsdGVyKGlkOiBzdHJpbmcsIGRhdGE6IFRhZ0ZpbHRlclNvdXJjZTxEYXRhPikge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmFkZEl0ZW0oVGFnRmlsdGVyLCB0aGlzLmZpbHRlcnMsIGRhdGEsIHsgaWQgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0YWRkU29ydGVyPFYgZXh0ZW5kcyBudW1iZXIgfCBzdHJpbmc+KGlkOiBzdHJpbmcsIHNvcnRlcjogU29ydGVyRm48RGF0YSwgVj4sIGRhdGE6IFNvcnRlclBhcnRpYWxTb3VyY2U8RGF0YSwgVj4gPSB7fSk6IFNvcnRlcjxEYXRhLCBWPiB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuYWRkSXRlbShTb3J0ZXIsIHRoaXMuc29ydGVycywgZGF0YSwgeyBpZCwgc29ydGVyIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFkZE1vZGlmaWVyKGlkOiBzdHJpbmcsIG1vZGlmaWVyOiBNb2RpZmllckZuPERhdGE+LCBkYXRhOiBNb2RpZmllclBhcnRpYWw8RGF0YT4gPSB7fSk6IE1vZGlmaWVyPERhdGE+IHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hZGRJdGVtKE1vZGlmaWVyLCB0aGlzLm1vZGlmaWVycywgZGF0YSwgeyBpZCwgbW9kaWZpZXIgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0YWRkUHJlZml4KGlkOiBzdHJpbmcsIHByZWZpeDogUHJlZml4ZXJGbjxEYXRhPiwgZGF0YTogUHJlZml4ZXJQYXJ0aWFsPERhdGE+ID0ge30pOiBQcmVmaXhlcjxEYXRhPiB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuYWRkSXRlbShQcmVmaXhlciwgdGhpcy5tb2RpZmllcnMsIGRhdGEsIHsgaWQsIHByZWZpeCB9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRhZGRQYWdpbmF0aW9uSW5mbyhpZDogc3RyaW5nID0gJ3BnaW5mbycsIGRhdGE6IFBhcnRpYWw8RmlsdGVyZXJJdGVtU291cmNlPiA9IHt9KSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuYWRkSXRlbShQYWdpbmF0aW9uSW5mb0ZpbHRlciwgdGhpcy5maWx0ZXJzLCBkYXRhLCB7IGlkIH0pO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmaWx0ZXJFbnRyaWVzKCkge1xyXG5cdFx0XHRcdGZvciAobGV0IGVsIG9mIHRoaXMuZW50cmllcykge1xyXG5cdFx0XHRcdFx0bGV0IGRhdGEgPSB0aGlzLmdldERhdGEoZWwpO1xyXG5cdFx0XHRcdFx0bGV0IHZhbHVlID0gdHJ1ZTtcclxuXHRcdFx0XHRcdGZvciAobGV0IGZpbHRlciBvZiB0aGlzLmZpbHRlcnMpIHtcclxuXHRcdFx0XHRcdFx0dmFsdWUgPSB2YWx1ZSAmJiBmaWx0ZXIuYXBwbHkoZGF0YSwgZWwpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWwuY2xhc3NMaXN0LnRvZ2dsZSgnZWYtZmlsdGVyZWQtb3V0JywgIXZhbHVlKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdF9wcmV2aW91c1N0YXRlID0ge1xyXG5cdFx0XHRcdGFsbFNvcnRlcnNPZmY6IHRydWUsXHJcblx0XHRcdFx0dXBkYXRlRHVyYXRpb246IDAsXHJcblx0XHRcdFx0ZmluaXNoZWRBdDogMCxcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdG9yZGVyZWRFbnRyaWVzOiBIVE1MRWxlbWVudFtdID0gW107XHJcblx0XHRcdG9yZGVyTW9kZTogJ2NzcycgfCAnc3dhcCcgPSAnY3NzJztcclxuXHRcdFx0c29ydEVudHJpZXMoKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMuZW50cmllcy5sZW5ndGggPD0gMSkgcmV0dXJuO1xyXG5cdFx0XHRcdGlmICh0aGlzLm9yZGVyZWRFbnRyaWVzLmxlbmd0aCA9PSAwKSB0aGlzLm9yZGVyZWRFbnRyaWVzID0gdGhpcy5lbnRyaWVzO1xyXG5cdFx0XHRcdGlmICh0aGlzLnNvcnRlcnMubGVuZ3RoID09IDApIHJldHVybjtcclxuXHJcblx0XHRcdFx0bGV0IGVudHJpZXMgPSB0aGlzLmVudHJpZXM7XHJcblx0XHRcdFx0bGV0IHBhaXJzOiBbRGF0YSwgSFRNTEVsZW1lbnRdW10gPSBlbnRyaWVzLm1hcChlID0+IFt0aGlzLmdldERhdGEoZSksIGVdKTtcclxuXHRcdFx0XHRsZXQgYWxsT2ZmID0gdHJ1ZTtcclxuXHRcdFx0XHRmb3IgKGxldCBzb3J0ZXIgb2YgdGhpcy5zb3J0ZXJzKSB7XHJcblx0XHRcdFx0XHRpZiAoc29ydGVyLm1vZGUgIT0gJ29mZicpIHtcclxuXHRcdFx0XHRcdFx0cGFpcnMgPSBzb3J0ZXIuc29ydChwYWlycyk7XHJcblx0XHRcdFx0XHRcdGFsbE9mZiA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbnRyaWVzID0gcGFpcnMubWFwKGUgPT4gZVsxXSk7XHJcblx0XHRcdFx0aWYgKHRoaXMub3JkZXJNb2RlID09ICdzd2FwJykge1xyXG5cdFx0XHRcdFx0aWYgKCFlbnRyaWVzLmV2ZXJ5KChlLCBpKSA9PiBlID09IHRoaXMub3JkZXJlZEVudHJpZXNbaV0pKSB7XHJcblx0XHRcdFx0XHRcdGxldCBiciA9IGVsbShgJHtlbnRyaWVzWzBdPy50YWdOYW1lfS5lZi1iZWZvcmUtc29ydFtoaWRkZW5dYCk7XHJcblx0XHRcdFx0XHRcdHRoaXMub3JkZXJlZEVudHJpZXNbMF0uYmVmb3JlKGJyKTtcclxuXHRcdFx0XHRcdFx0YnIuYWZ0ZXIoLi4uZW50cmllcyk7XHJcblx0XHRcdFx0XHRcdGJyLnJlbW92ZSgpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRpZiAoYWxsT2ZmICE9IHRoaXMuX3ByZXZpb3VzU3RhdGUuYWxsU29ydGVyc09mZikge1xyXG5cdFx0XHRcdFx0XHRlbnRyaWVzLm1hcCgoZSwgaSkgPT4ge1xyXG5cdFx0XHRcdFx0XHRcdGlmIChhbGxPZmYpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGUuY2xhc3NMaXN0LnJlbW92ZSgnZWYtcmVvcmRlcicpO1xyXG5cdFx0XHRcdFx0XHRcdFx0ZS5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2VmLXJlb3JkZXItY29udGFpbmVyJyk7XHJcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRcdC8vIHVzZSBgZmxleGAgb3IgYGdyaWRgIGNvbnRhaW5lciBhbmQgYG9yZGVyOnZhcigtLWVmLW9yZGVyKWAgZm9yIGNoaWxkcmVuIFxyXG5cdFx0XHRcdFx0XHRcdFx0ZS5jbGFzc0xpc3QuYWRkKCdlZi1yZW9yZGVyJyk7XHJcblx0XHRcdFx0XHRcdFx0XHRlLnBhcmVudEVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnZWYtcmVvcmRlci1jb250YWluZXInKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0aWYgKCFhbGxPZmYpIHtcclxuXHRcdFx0XHRcdFx0ZW50cmllcy5tYXAoKGUsIGkpID0+IHtcclxuXHRcdFx0XHRcdFx0XHRlLnN0eWxlLnNldFByb3BlcnR5KCctLWVmLW9yZGVyJywgaSArICcnKTtcclxuXHRcdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMub3JkZXJlZEVudHJpZXMgPSBlbnRyaWVzO1xyXG5cdFx0XHRcdHRoaXMuX3ByZXZpb3VzU3RhdGUuYWxsU29ydGVyc09mZiA9IGFsbE9mZjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0bW9kaWZ5RW50cmllcygpIHtcclxuXHRcdFx0XHRsZXQgZW50cmllcyA9IHRoaXMuZW50cmllcztcclxuXHRcdFx0XHRsZXQgcGFpcnM6IFtIVE1MRWxlbWVudCwgRGF0YV1bXSA9IGVudHJpZXMubWFwKGUgPT4gW2UsIHRoaXMuZ2V0RGF0YShlKV0pO1xyXG5cdFx0XHRcdGZvciAobGV0IG1vZGlmaWVyIG9mIHRoaXMubW9kaWZpZXJzKSB7XHJcblx0XHRcdFx0XHRmb3IgKGxldCBbZSwgZF0gb2YgcGFpcnMpIHtcclxuXHRcdFx0XHRcdFx0bW9kaWZpZXIuYXBwbHkoZCwgZSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRtb3ZlVG9Ub3AoaXRlbTogSVNvcnRlcjxEYXRhPiB8IElNb2RpZmllcjxEYXRhPikge1xyXG5cdFx0XHRcdGlmICh0aGlzLnNvcnRlcnMuaW5jbHVkZXMoaXRlbSBhcyBJU29ydGVyPERhdGE+KSkge1xyXG5cdFx0XHRcdFx0dGhpcy5zb3J0ZXJzLnNwbGljZSh0aGlzLnNvcnRlcnMuaW5kZXhPZihpdGVtIGFzIElTb3J0ZXI8RGF0YT4pLCAxKTtcclxuXHRcdFx0XHRcdHRoaXMuc29ydGVycy5wdXNoKGl0ZW0gYXMgSVNvcnRlcjxEYXRhPik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGlmaWVycy5pbmNsdWRlcyhpdGVtIGFzIElNb2RpZmllcjxEYXRhPikpIHtcclxuXHRcdFx0XHRcdHRoaXMubW9kaWZpZXJzLnNwbGljZSh0aGlzLm1vZGlmaWVycy5pbmRleE9mKGl0ZW0gYXMgSU1vZGlmaWVyPERhdGE+KSwgMSk7XHJcblx0XHRcdFx0XHR0aGlzLm1vZGlmaWVycy5wdXNoKGl0ZW0gYXMgSU1vZGlmaWVyPERhdGE+KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZpbmRFbnRyaWVzKCk6IEhUTUxFbGVtZW50W10ge1xyXG5cdFx0XHRcdHJldHVybiB0eXBlb2YgdGhpcy5lbnRyeVNlbGVjdG9yID09ICdmdW5jdGlvbicgPyB0aGlzLmVudHJ5U2VsZWN0b3IoKSA6IHFxKHRoaXMuZW50cnlTZWxlY3Rvcik7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdF9lYXJsaWVzdFVwZGF0ZSA9IDA7XHJcblx0XHRcdHVwZGF0ZShyZXBhcnNlID0gdGhpcy5yZXBhcnNlUGVuZGluZykge1xyXG5cdFx0XHRcdGlmICh0aGlzLmRpc2FibGVkID09IHRydWUpIHJldHVybjtcclxuXHRcdFx0XHRpZiAodGhpcy5fcHJldmlvdXNTdGF0ZS51cGRhdGVEdXJhdGlvbiA9PSA5OV85OTkpIHtcclxuXHRcdFx0XHRcdFBvb3BKcy5kZWJ1ZyAmJiBjb25zb2xlLmxvZyhgRUY6IHVwZGF0ZSBpbiBwcm9ncmVzc2ApO1xyXG5cdFx0XHRcdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcclxuXHRcdFx0XHRcdFx0c2V0VGltZW91dCgoKSA9PiB7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy51cGRhdGUocmVwYXJzZSlcclxuXHRcdFx0XHRcdFx0fSwgMTAwKVxyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGxldCBjb29sZG93biA9IE1hdGgubWluKDEwMDAwLCA4ICogdGhpcy5fcHJldmlvdXNTdGF0ZS51cGRhdGVEdXJhdGlvbilcclxuXHRcdFx0XHRsZXQgZWFybGllc3RVcGRhdGUgPSB0aGlzLl9wcmV2aW91c1N0YXRlLmZpbmlzaGVkQXQgKyBjb29sZG93bjtcclxuXHRcdFx0XHRpZiAocGVyZm9ybWFuY2Uubm93KCkgPCBlYXJsaWVzdFVwZGF0ZSkge1xyXG5cdFx0XHRcdFx0aWYgKHRoaXMuX2VhcmxpZXN0VXBkYXRlICE9IGVhcmxpZXN0VXBkYXRlKSB7XHJcblx0XHRcdFx0XHRcdHRoaXMuX2VhcmxpZXN0VXBkYXRlID0gZWFybGllc3RVcGRhdGU7XHJcblx0XHRcdFx0XHRcdGlmIChQb29wSnMuZGVidWcpIHtcclxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhgRUY6IHVwZGF0ZSBkZWxheWVkIGJ5ICR7fn4oZWFybGllc3RVcGRhdGUgLSBwZXJmb3JtYW5jZS5ub3coKSl9bXMgJHsnJ1xyXG5cdFx0XHRcdFx0XHRcdFx0fSAobGFzdCB1cGRhdGUgZHVyYXRpb246ICR7dGhpcy5fcHJldmlvdXNTdGF0ZS51cGRhdGVEdXJhdGlvbn0pYCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHRoaXMudXBkYXRlUGVuZGluZyA9IHRydWU7XHJcblx0XHRcdFx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gdGhpcy51cGRhdGUoKSk7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMudXBkYXRlUGVuZGluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdGxldCBub3cgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuXHJcblx0XHRcdFx0bGV0IGVudHJpZXMgPSB0aGlzLmZpbmRFbnRyaWVzKCk7XHJcblxyXG5cdFx0XHRcdGlmICh0aGlzLmRpc2FibGVkID09ICdzb2Z0Jykge1xyXG5cdFx0XHRcdFx0aWYgKCFlbnRyaWVzLmxlbmd0aCkgcmV0dXJuO1xyXG5cdFx0XHRcdFx0UG9vcEpzLmRlYnVnICYmIGNvbnNvbGUubG9nKGBFZiBzb2Z0LWVuYWJsZWQ6IHgwPT54JHtlbnRyaWVzLmxlbmd0aH1gLCB0aGlzLmVudHJ5U2VsZWN0b3IsIHRoaXMpO1xyXG5cdFx0XHRcdFx0dGhpcy5lbmFibGUoKTtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMuZGlzYWJsZWQgIT0gZmFsc2UpIHRocm93IDA7XHJcblxyXG5cdFx0XHRcdGlmICghZW50cmllcy5sZW5ndGggJiYgdGhpcy5zb2Z0RGlzYWJsZSkge1xyXG5cdFx0XHRcdFx0UG9vcEpzLmRlYnVnICYmIGNvbnNvbGUubG9nKGBFZiBzb2Z0LWRpc2FibGVkOiB4JHt0aGlzLmVuYWJsZS5sZW5ndGh9PT54MGAsIHRoaXMuZW50cnlTZWxlY3RvciwgdGhpcyk7XHJcblx0XHRcdFx0XHR0aGlzLmRpc2FibGUoJ3NvZnQnKTtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGlmIChyZXBhcnNlKSB7XHJcblx0XHRcdFx0XHR0aGlzLmVudHJ5RGF0YXMgPSBuZXcgTWFwVHlwZSgpO1xyXG5cdFx0XHRcdFx0dGhpcy5yZXBhcnNlUGVuZGluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoIXRoaXMuY29udGFpbmVyLmNsb3Nlc3QoJ2JvZHknKSkge1xyXG5cdFx0XHRcdFx0dGhpcy5jb250YWluZXIuYXBwZW5kVG8oJ2JvZHknKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMuZW50cmllcy5sZW5ndGggIT0gZW50cmllcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdFBvb3BKcy5kZWJ1ZyAmJiBjb25zb2xlLmxvZyhgRWYgdXBkYXRlOiB4JHt0aGlzLmVudHJpZXMubGVuZ3RofT0+eCR7ZW50cmllcy5sZW5ndGh9YCwgdGhpcy5lbnRyeVNlbGVjdG9yLCB0aGlzKTtcclxuXHRcdFx0XHRcdC8vIHx8IHRoaXMuZW50cmllc1xyXG5cdFx0XHRcdFx0Ly8gVE9ETzogc29ydCBlbnRyaWVzIGluIGluaXRpYWwgb3JkZXJcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5lbnRyaWVzID0gZW50cmllcztcclxuXHRcdFx0XHR0aGlzLmZpbHRlckVudHJpZXMoKTtcclxuXHRcdFx0XHR0aGlzLnNvcnRFbnRyaWVzKCk7XHJcblx0XHRcdFx0dGhpcy5tb2RpZnlFbnRyaWVzKCk7XHJcblx0XHRcdFx0bGV0IHRpbWVVc2VkID0gcGVyZm9ybWFuY2Uubm93KCkgLSBub3c7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coYEVGOiB1cGRhdGUgdG9vayAke35+dGltZVVzZWR9bXNgKTtcclxuXHRcdFx0XHR0aGlzLl9wcmV2aW91c1N0YXRlLnVwZGF0ZUR1cmF0aW9uID0gOTlfOTk5O1xyXG5cdFx0XHRcdHRoaXMuX3ByZXZpb3VzU3RhdGUuZmluaXNoZWRBdCA9IHBlcmZvcm1hbmNlLm5vdygpICsgOTlfOTk5O1xyXG5cdFx0XHRcdHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XHJcblx0XHRcdFx0XHRsZXQgZHQgPSB0aGlzLl9wcmV2aW91c1N0YXRlLnVwZGF0ZUR1cmF0aW9uID0gcGVyZm9ybWFuY2Uubm93KCkgLSBub3c7XHJcblx0XHRcdFx0XHR0aGlzLl9wcmV2aW91c1N0YXRlLmZpbmlzaGVkQXQgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0b2ZmSW5jb21wYXRpYmxlKGluY29tcGF0aWJsZTogc3RyaW5nW10pIHtcclxuXHRcdFx0XHRmb3IgKGxldCBmaWx0ZXIgb2YgdGhpcy5maWx0ZXJzKSB7XHJcblx0XHRcdFx0XHRpZiAoaW5jb21wYXRpYmxlLmluY2x1ZGVzKGZpbHRlci5pZCkpIHtcclxuXHRcdFx0XHRcdFx0ZmlsdGVyLnRvZ2dsZU1vZGUoJ29mZicpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRmb3IgKGxldCBzb3J0ZXIgb2YgdGhpcy5zb3J0ZXJzKSB7XHJcblx0XHRcdFx0XHRpZiAoaW5jb21wYXRpYmxlLmluY2x1ZGVzKHNvcnRlci5pZCkpIHtcclxuXHRcdFx0XHRcdFx0c29ydGVyLnRvZ2dsZU1vZGUoJ29mZicpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRmb3IgKGxldCBtb2RpZmllciBvZiB0aGlzLm1vZGlmaWVycykge1xyXG5cdFx0XHRcdFx0aWYgKGluY29tcGF0aWJsZS5pbmNsdWRlcyhtb2RpZmllci5pZCkpIHtcclxuXHRcdFx0XHRcdFx0bW9kaWZpZXIudG9nZ2xlTW9kZSgnb2ZmJyk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRzdHlsZShzID0gJycpIHtcclxuXHRcdFx0XHRFbnRyeUZpbHRlcmVyLnN0eWxlKHMpO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0XHR9XHJcblx0XHRcdHN0YXRpYyBzdHlsZShzID0gJycpIHtcclxuXHRcdFx0XHRsZXQgc3R5bGUgPSBxKCdzdHlsZS5lZi1zdHlsZScpIHx8IGVsbSgnc3R5bGUuZWYtc3R5bGUnKS5hcHBlbmRUbygnaGVhZCcpO1xyXG5cdFx0XHRcdHN0eWxlLmlubmVySFRNTCA9IGBcclxuXHRcdFx0XHRcdC5lZi1jb250YWluZXIge1xyXG5cdFx0XHRcdFx0XHRkaXNwbGF5OiBmbGV4O1xyXG5cdFx0XHRcdFx0XHRmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xyXG5cdFx0XHRcdFx0XHRwb3NpdGlvbjogZml4ZWQ7XHJcblx0XHRcdFx0XHRcdHRvcDogMDtcclxuXHRcdFx0XHRcdFx0cmlnaHQ6IDA7XHJcblx0XHRcdFx0XHRcdHotaW5kZXg6IDk5OTk5OTk5OTk5OTk5OTk5OTk7XHJcblx0XHRcdFx0XHRcdG1pbi13aWR0aDogMTAwcHg7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQuZWYtZW50cnkge31cclxuXHJcblx0XHRcdFx0XHQuZWYtZmlsdGVyZWQtb3V0IHtcclxuXHRcdFx0XHRcdFx0ZGlzcGxheTogbm9uZSAhaW1wb3J0YW50O1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGJ1dHRvbi5lZi1pdGVtIHt9XHJcblx0XHRcdFx0XHRidXR0b24uZWYtaXRlbVtlZi1tb2RlPVwib2ZmXCJdIHtcclxuXHRcdFx0XHRcdFx0YmFja2dyb3VuZDogbGlnaHRncmF5O1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0YnV0dG9uLmVmLWl0ZW1bZWYtbW9kZT1cIm9uXCJdIHtcclxuXHRcdFx0XHRcdFx0YmFja2dyb3VuZDogbGlnaHRncmVlbjtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGJ1dHRvbi5lZi1pdGVtW2VmLW1vZGU9XCJvcHBvc2l0ZVwiXSB7XHJcblx0XHRcdFx0XHRcdGJhY2tncm91bmQ6IHllbGxvdztcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRidXR0b24uZWYtaXRlbS5lZi1maWx0ZXIgPiBpbnB1dCB7XHJcblx0XHRcdFx0XHRcdGZsb2F0OiByaWdodDtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRbZWYtcHJlZml4XTo6YmVmb3JlIHtcclxuXHRcdFx0XHRcdFx0Y29udGVudDogYXR0cihlZi1wcmVmaXgpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0W2VmLXBvc3RmaXhdOjphZnRlciB7XHJcblx0XHRcdFx0XHRcdGNvbnRlbnQ6IGF0dHIoZWYtcG9zdGZpeCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRgICsgcztcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0c29mdERpc2FibGUgPSB0cnVlO1xyXG5cdFx0XHRkaXNhYmxlZDogYm9vbGVhbiB8ICdzb2Z0JyA9IGZhbHNlO1xyXG5cdFx0XHRkaXNhYmxlKHNvZnQ/OiAnc29mdCcpIHtcclxuXHRcdFx0XHR0aGlzLmRpc2FibGVkID0gdHJ1ZTtcclxuXHRcdFx0XHRpZiAoc29mdCA9PSAnc29mdCcpIHRoaXMuZGlzYWJsZWQgPSAnc29mdCc7XHJcblx0XHRcdFx0dGhpcy5jb250YWluZXIucmVtb3ZlKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZW5hYmxlKCkge1xyXG5cdFx0XHRcdHRoaXMuZGlzYWJsZWQgPSBmYWxzZTtcclxuXHRcdFx0XHR0aGlzLnVwZGF0ZVBlbmRpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHR0aGlzLnJlcXVlc3RVcGRhdGUoKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2xlYXIoKSB7XHJcblx0XHRcdFx0dGhpcy5lbnRyeURhdGFzID0gbmV3IE1hcFR5cGUoKTtcclxuXHRcdFx0XHR0aGlzLnBhcnNlcnMuc3BsaWNlKDAsIDk5OSk7XHJcblx0XHRcdFx0dGhpcy5maWx0ZXJzLnNwbGljZSgwLCA5OTkpLm1hcChlID0+IGUucmVtb3ZlKCkpO1xyXG5cdFx0XHRcdHRoaXMuc29ydGVycy5zcGxpY2UoMCwgOTk5KS5tYXAoZSA9PiBlLnJlbW92ZSgpKTtcclxuXHRcdFx0XHR0aGlzLm1vZGlmaWVycy5zcGxpY2UoMCwgOTk5KS5tYXAoZSA9PiBlLnJlbW92ZSgpKTtcclxuXHRcdFx0XHR0aGlzLmVuYWJsZSgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRnZXQgX2RhdGFzKCkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmVudHJpZXNcclxuXHRcdFx0XHRcdC5maWx0ZXIoZSA9PiAhZS5jbGFzc0xpc3QuY29udGFpbnMoJ2VmLWZpbHRlcmVkLW91dCcpKVxyXG5cdFx0XHRcdFx0Lm1hcChlID0+IHRoaXMuZ2V0RGF0YShlKSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gSXNQcm9taXNlPFQ+KHA6IFByb21pc2VMaWtlPFQ+IHwgVCk6IHAgaXMgUHJvbWlzZUxpa2U8VD4ge1xyXG5cdFx0XHRpZiAoIXApIHJldHVybiBmYWxzZTtcclxuXHRcdFx0cmV0dXJuIHR5cGVvZiAocCBhcyBQcm9taXNlTGlrZTxUPikudGhlbiA9PSAnZnVuY3Rpb24nO1xyXG5cdFx0fVxyXG5cdH1cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cdGV4cG9ydCBjbGFzcyBPYnNlcnZlciB7XHJcblx0XHRcclxuXHR9XHJcbn1cclxuXHJcbi8qXHJcblxyXG5mdW5jdGlvbiBvYnNlcnZlQ2xhc3NBZGQoY2xzLCBjYikge1xyXG5cdGxldCBxdWV1ZWQgPSBmYWxzZTtcclxuXHRhc3luYyBmdW5jdGlvbiBydW4oKSB7XHJcblx0XHRpZiAocXVldWVkKSByZXR1cm47XHJcblx0XHRxdWV1ZWQgPSB0cnVlO1xyXG5cdFx0YXdhaXQgUHJvbWlzZS5mcmFtZSgpO1xyXG5cdFx0cXVldWVkID0gZmFsc2U7XHJcblx0XHRjYigpO1xyXG5cdH1cclxuXHRuZXcgTXV0YXRpb25PYnNlcnZlcihsaXN0ID0+IHtcclxuXHRcdGZvciAobGV0IG1yIG9mIGxpc3QpIHtcclxuXHRcdFx0aWYgKG1yLnR5cGUgPT0gJ2F0dHJpYnV0ZXMnICYmIG1yLmF0dHJpYnV0ZU5hbWUgPT0gJ2NsYXNzJykge1xyXG5cdFx0XHRcdGlmIChtci50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKGNscykpIHtcclxuXHRcdFx0XHRcdHJ1bigpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAobXIudHlwZSA9PSAnY2hpbGRMaXN0Jykge1xyXG5cdFx0XHRcdGZvciAobGV0IGNoIG9mIG1yLmFkZGVkTm9kZXMpIHtcclxuXHRcdFx0XHRcdGlmIChjaC5jbGFzc0xpc3Q/LmNvbnRhaW5zKGNscykpIHtcclxuXHRcdFx0XHRcdFx0cnVuKCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSkub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7XHJcblx0XHRjaGlsZExpc3Q6IHRydWUsXHJcblx0XHRhdHRyaWJ1dGVzOiB0cnVlLFxyXG5cdFx0c3VidHJlZTogdHJ1ZSxcclxuXHR9KTtcclxufVxyXG5cclxuKi8iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBQYWdpbmF0ZUV4dGVuc2lvbiB7XHJcblxyXG5cdFx0ZXhwb3J0IHR5cGUgUFJlcXVlc3RFdmVudCA9IEN1c3RvbUV2ZW50PHtcclxuXHRcdFx0cmVhc29uPzogS2V5Ym9hcmRFdmVudCB8IE1vdXNlRXZlbnQsXHJcblx0XHRcdGNvdW50OiBudW1iZXIsXHJcblx0XHRcdGNvbnN1bWVkOiBudW1iZXIsXHJcblx0XHRcdF9ldmVudD86ICdwYWdpbmF0aW9ucmVxdWVzdCcsXHJcblx0XHR9PjtcclxuXHRcdGV4cG9ydCB0eXBlIFBTdGFydEV2ZW50ID0gQ3VzdG9tRXZlbnQ8e1xyXG5cdFx0XHRwYWdpbmF0ZTogUGFnaW5hdGUsXHJcblx0XHRcdF9ldmVudD86ICdwYWdpbmF0aW9uc3RhcnQnLFxyXG5cdFx0fT47XHJcblx0XHRleHBvcnQgdHlwZSBQRW5kRXZlbnQgPSBDdXN0b21FdmVudDx7XHJcblx0XHRcdHBhZ2luYXRlOiBQYWdpbmF0ZSxcclxuXHRcdFx0X2V2ZW50PzogJ3BhZ2luYXRpb25lbmQnLFxyXG5cdFx0fT47XHJcblx0XHRleHBvcnQgdHlwZSBQTW9kaWZ5RXZlbnQgPSBDdXN0b21FdmVudDx7XHJcblx0XHRcdHBhZ2luYXRlOiBQYWdpbmF0ZSxcclxuXHRcdFx0YWRkZWQ6IEhUTUxFbGVtZW50W10sXHJcblx0XHRcdHJlbW92ZWQ6IEhUTUxFbGVtZW50W10sXHJcblx0XHRcdHNlbGVjdG9yOiBzZWxlY3RvcixcclxuXHRcdFx0X2V2ZW50PzogJ3BhZ2luYXRpb25tb2RpZnknLFxyXG5cdFx0fT47XHJcblxyXG5cdFx0ZXhwb3J0IGNsYXNzIFBhZ2luYXRlIHtcclxuXHRcdFx0ZG9jOiBEb2N1bWVudDtcclxuXHJcblx0XHRcdGVuYWJsZWQgPSB0cnVlO1xyXG5cdFx0XHRjb25kaXRpb246IHNlbGVjdG9yIHwgKCgpID0+IGJvb2xlYW4pO1xyXG5cdFx0XHRxdWV1ZWQgPSAwO1xyXG5cdFx0XHRydW5uaW5nID0gZmFsc2U7XHJcblx0XHRcdF9pbml0ZWQgPSBmYWxzZTtcclxuXHRcdFx0c2hpZnRSZXF1ZXN0Q291bnQ/OiBudW1iZXIgfCAoKCkgPT4gbnVtYmVyKTtcclxuXHJcblx0XHRcdHN0YXRpYyBzaGlmdFJlcXVlc3RDb3VudCA9IDEwO1xyXG5cdFx0XHRzdGF0aWMgX2luaXRlZCA9IGZhbHNlO1xyXG5cdFx0XHRzdGF0aWMgcmVtb3ZlRGVmYXVsdFJ1bkJpbmRpbmdzOiAoKSA9PiB2b2lkO1xyXG5cdFx0XHRzdGF0aWMgYWRkRGVmYXVsdFJ1bkJpbmRpbmdzKCkge1xyXG5cdFx0XHRcdFBhZ2luYXRlLnJlbW92ZURlZmF1bHRSdW5CaW5kaW5ncz8uKCk7XHJcblx0XHRcdFx0ZnVuY3Rpb24gb25tb3VzZWRvd24oZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuXHRcdFx0XHRcdGlmIChldmVudC5idXR0b24gIT0gMSkgcmV0dXJuO1xyXG5cdFx0XHRcdFx0bGV0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBFbGVtZW50O1xyXG5cdFx0XHRcdFx0aWYgKHRhcmdldD8uY2xvc2VzdCgnYScpKSByZXR1cm47XHJcblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdFx0bGV0IGNvdW50ID0gZXZlbnQuc2hpZnRLZXkgPyBQYWdpbmF0ZS5zaGlmdFJlcXVlc3RDb3VudCA6IDE7XHJcblx0XHRcdFx0XHRQYWdpbmF0ZS5yZXF1ZXN0UGFnaW5hdGlvbihjb3VudCwgZXZlbnQsIHRhcmdldCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZ1bmN0aW9uIG9ua2V5ZG93bihldmVudDogS2V5Ym9hcmRFdmVudCkge1xyXG5cdFx0XHRcdFx0aWYgKGV2ZW50LmNvZGUgIT0gJ0FsdFJpZ2h0JykgcmV0dXJuO1xyXG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHRcdGxldCBjb3VudCA9IGV2ZW50LnNoaWZ0S2V5ID8gUGFnaW5hdGUuc2hpZnRSZXF1ZXN0Q291bnQgOiAxO1xyXG5cdFx0XHRcdFx0bGV0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBFbGVtZW50O1xyXG5cdFx0XHRcdFx0UGFnaW5hdGUucmVxdWVzdFBhZ2luYXRpb24oY291bnQsIGV2ZW50LCB0YXJnZXQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBvbm1vdXNlZG93bik7XHJcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9ua2V5ZG93bik7XHJcblx0XHRcdFx0UGFnaW5hdGUucmVtb3ZlRGVmYXVsdFJ1bkJpbmRpbmdzID0gKCkgPT4ge1xyXG5cdFx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgb25tb3VzZWRvd24pO1xyXG5cdFx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9ua2V5ZG93bik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdHN0YXRpYyBpbnN0YW5jZXM6IFBhZ2luYXRlW10gPSBbXTtcclxuXHJcblx0XHRcdC8vIGxpc3RlbmVyc1xyXG5cdFx0XHRpbml0KCkge1xyXG5cdFx0XHRcdGlmICghUGFnaW5hdGUucmVtb3ZlRGVmYXVsdFJ1bkJpbmRpbmdzKSB7XHJcblx0XHRcdFx0XHRQYWdpbmF0ZS5hZGREZWZhdWx0UnVuQmluZGluZ3MoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMuX2luaXRlZCkgcmV0dXJuO1xyXG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXI8UFJlcXVlc3RFdmVudD4oJ3BhZ2luYXRpb25yZXF1ZXN0JywgdGhpcy5vblBhZ2luYXRpb25SZXF1ZXN0LmJpbmQodGhpcykpO1xyXG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXI8UEVuZEV2ZW50PigncGFnaW5hdGlvbmVuZCcsIHRoaXMub25QYWdpbmF0aW9uRW5kLmJpbmQodGhpcykpO1xyXG5cdFx0XHRcdFBhZ2luYXRlLmluc3RhbmNlcy5wdXNoKHRoaXMpO1xyXG5cdFx0XHRcdGlmIChQb29wSnMuZGVidWcpIHtcclxuXHRcdFx0XHRcdGxldCBhY3RpdmUgPSB0aGlzLmNhbkNvbnN1bWVSZXF1ZXN0KCkgPyAnYWN0aXZlJyA6ICdpbmFjdGl2ZSc7XHJcblx0XHRcdFx0XHRpZiAoYWN0aXZlID09ICdhY3RpdmUnKVxyXG5cdFx0XHRcdFx0XHRQb29wSnMuZGVidWcgJiYgY29uc29sZS5sb2coYFBhZ2luYXRlIGluc3RhbnRpYXRlZCAoJHthY3RpdmV9KTogYCwgdGhpcy5kYXRhKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0b25QYWdpbmF0aW9uUmVxdWVzdChldmVudDogUFJlcXVlc3RFdmVudCkge1xyXG5cdFx0XHRcdGlmICh0aGlzLmNhbkNvbnN1bWVSZXF1ZXN0KCkpIHtcclxuXHRcdFx0XHRcdGV2ZW50LmRldGFpbC5jb25zdW1lZCsrO1xyXG5cdFx0XHRcdFx0bGV0IHF1ZXVlZCA9ICFldmVudC5kZXRhaWwucmVhc29uPy5zaGlmdEtleSA/IG51bGwgOiB0eXBlb2YgdGhpcy5zaGlmdFJlcXVlc3RDb3VudCA9PSAnZnVuY3Rpb24nID8gdGhpcy5zaGlmdFJlcXVlc3RDb3VudCgpIDogdGhpcy5zaGlmdFJlcXVlc3RDb3VudDtcclxuXHRcdFx0XHRcdHRoaXMucXVldWVkICs9IHF1ZXVlZCA/PyBldmVudC5kZXRhaWwuY291bnQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICghdGhpcy5ydW5uaW5nICYmIHRoaXMucXVldWVkKSB7XHJcblx0XHRcdFx0XHR0aGlzLmNvbnN1bWVSZXF1ZXN0KCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9O1xyXG5cdFx0XHRvblBhZ2luYXRpb25FbmQoZXZlbnQ6IFBFbmRFdmVudCkge1xyXG5cdFx0XHRcdGlmICh0aGlzLnF1ZXVlZCAmJiB0aGlzLmNhbkNvbnN1bWVSZXF1ZXN0KCkpIHtcclxuXHRcdFx0XHRcdHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XHJcblx0XHRcdFx0XHRcdGlmICghdGhpcy5jYW5Db25zdW1lUmVxdWVzdCgpKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKGB0aGlzIHBhZ2luYXRlIGNhbiBub3Qgd29yayBhbnltb3JlYCk7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5xdWV1ZWQgPSAwO1xyXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuY29uc3VtZVJlcXVlc3QoKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGNhbkNvbnN1bWVSZXF1ZXN0KCkge1xyXG5cdFx0XHRcdGlmICghdGhpcy5lbmFibGVkKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0aWYgKHRoaXMucnVubmluZykgcmV0dXJuIHRydWU7XHJcblx0XHRcdFx0aWYgKHRoaXMuY29uZGl0aW9uKSB7XHJcblx0XHRcdFx0XHRpZiAodHlwZW9mIHRoaXMuY29uZGl0aW9uID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdFx0aWYgKCF0aGlzLmNvbmRpdGlvbigpKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRpZiAoIWRvY3VtZW50LnEodGhpcy5jb25kaXRpb24pKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFzeW5jIGNvbnN1bWVSZXF1ZXN0KCkge1xyXG5cdFx0XHRcdGlmICh0aGlzLnJ1bm5pbmcpIHJldHVybjtcclxuXHRcdFx0XHR0aGlzLnF1ZXVlZC0tO1xyXG5cdFx0XHRcdHRoaXMucnVubmluZyA9IHRydWU7XHJcblx0XHRcdFx0dGhpcy5lbWl0U3RhcnQoKTtcclxuXHRcdFx0XHRhd2FpdCB0aGlzLm9ucnVuPy4oKTtcclxuXHRcdFx0XHR0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcclxuXHRcdFx0XHR0aGlzLmVtaXRFbmQoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRvbnJ1bjogKCkgPT4gUHJvbWlzZTx2b2lkPjtcclxuXHJcblxyXG5cdFx0XHQvLyBlbWl0dGVyc1xyXG5cdFx0XHRzdGF0aWMgcmVxdWVzdFBhZ2luYXRpb24oY291bnQgPSAxLCByZWFzb24/OiBQUmVxdWVzdEV2ZW50WydkZXRhaWwnXVsncmVhc29uJ10sIHRhcmdldDogRWxlbWVudCA9IGRvY3VtZW50LmJvZHkpIHtcclxuXHRcdFx0XHRsZXQgZGV0YWlsOiBQUmVxdWVzdEV2ZW50WydkZXRhaWwnXSA9IHsgY291bnQsIHJlYXNvbiwgY29uc3VtZWQ6IDAgfTtcclxuXHRcdFx0XHRmdW5jdGlvbiBmYWlsKGV2ZW50OiBQUmVxdWVzdEV2ZW50KSB7XHJcblx0XHRcdFx0XHRpZiAoZXZlbnQuZGV0YWlsLmNvbnN1bWVkID09IDApIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKGBQYWdpbmF0aW9uIHJlcXVlc3QgZmFpbGVkOiBubyBsaXN0ZW5lcnNgKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BhZ2luYXRpb25yZXF1ZXN0JywgZmFpbCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGFkZEV2ZW50TGlzdGVuZXIoJ3BhZ2luYXRpb25yZXF1ZXN0JywgZmFpbCk7XHJcblx0XHRcdFx0dGFyZ2V0LmVtaXQ8UFJlcXVlc3RFdmVudD4oJ3BhZ2luYXRpb25yZXF1ZXN0JywgeyBjb3VudCwgcmVhc29uLCBjb25zdW1lZDogMCB9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbWl0U3RhcnQoKSB7XHJcblx0XHRcdFx0ZG9jdW1lbnQuYm9keS5lbWl0PFBTdGFydEV2ZW50PigncGFnaW5hdGlvbnN0YXJ0JywgeyBwYWdpbmF0ZTogdGhpcyB9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbWl0TW9kaWZ5KGFkZGVkLCByZW1vdmVkLCBzZWxlY3Rvcikge1xyXG5cdFx0XHRcdGRvY3VtZW50LmJvZHkuZW1pdDxQTW9kaWZ5RXZlbnQ+KCdwYWdpbmF0aW9ubW9kaWZ5JywgeyBwYWdpbmF0ZTogdGhpcywgYWRkZWQsIHJlbW92ZWQsIHNlbGVjdG9yIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVtaXRFbmQoKSB7XHJcblx0XHRcdFx0ZG9jdW1lbnQuYm9keS5lbWl0PFBFbmRFdmVudD4oJ3BhZ2luYXRpb25lbmQnLCB7IHBhZ2luYXRlOiB0aGlzIH0pO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBmZXRjaGluZzogXHJcblx0XHRcdGFzeW5jIGZldGNoRG9jdW1lbnQobGluazogTGluaywgc3Bpbm5lciA9IHRydWUsIG1heEFnZTogZGVsdGFUaW1lID0gMCk6IFByb21pc2U8RG9jdW1lbnQ+IHtcclxuXHRcdFx0XHR0aGlzLmRvYyA9IG51bGw7XHJcblx0XHRcdFx0bGV0IGEgPSBzcGlubmVyICYmIFBhZ2luYXRlLmxpbmtUb0FuY2hvcihsaW5rKTtcclxuXHRcdFx0XHRhPy5jbGFzc0xpc3QuYWRkKCdwYWdpbmF0ZS1zcGluJyk7XHJcblx0XHRcdFx0bGluayA9IFBhZ2luYXRlLmxpbmtUb1VybChsaW5rKTtcclxuXHRcdFx0XHRsZXQgaW5pdCA9IHsgbWF4QWdlLCB4bWw6IHRoaXMuZGF0YS54bWwgfTtcclxuXHRcdFx0XHR0aGlzLmRvYyA9ICFtYXhBZ2UgPyBhd2FpdCBmZXRjaC5kb2MobGluaywgaW5pdCkgOiBhd2FpdCBmZXRjaC5jYWNoZWQuZG9jKGxpbmssIGluaXQpO1xyXG5cdFx0XHRcdGE/LmNsYXNzTGlzdC5yZW1vdmUoJ3BhZ2luYXRlLXNwaW4nKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5kb2M7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHN0YXRpYyBwcmVmZXRjaChzb3VyY2U6IHNlbGVjdG9yKSB7XHJcblx0XHRcdFx0ZG9jdW1lbnQucXE8J2EnPihzb3VyY2UpLm1hcChlID0+IHtcclxuXHRcdFx0XHRcdGlmIChlLmhyZWYpIHtcclxuXHRcdFx0XHRcdFx0ZWxtKGBsaW5rW3JlbD1cInByZWZldGNoXCJdW2hyZWY9XCIke2UuaHJlZn1cIl1gKS5hcHBlbmRUbygnaGVhZCcpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Ly8gVE9ETzogaWYgZS5zcmNcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHRcdC8vIG1vZGlmaWNhdGlvbjogXHJcblx0XHRcdGFmdGVyKHNvdXJjZTogc2VsZWN0b3IsIHRhcmdldDogc2VsZWN0b3IgPSBzb3VyY2UpIHtcclxuXHRcdFx0XHRsZXQgYWRkZWQgPSB0aGlzLmRvYy5xcShzb3VyY2UpO1xyXG5cdFx0XHRcdGlmICghYWRkZWQubGVuZ3RoKSByZXR1cm47XHJcblx0XHRcdFx0bGV0IGZvdW5kID0gZG9jdW1lbnQucXEodGFyZ2V0KTtcclxuXHRcdFx0XHRpZiAoZm91bmQubGVuZ3RoID09IDApIHRocm93IG5ldyBFcnJvcihgZmFpbGVkIHRvIGZpbmQgd2hlcmUgdG8gYXBwZW5kYCk7XHJcblx0XHRcdFx0Zm91bmQucG9wKCkuYWZ0ZXIoLi4uYWRkZWQpO1xyXG5cdFx0XHRcdHRoaXMuZW1pdE1vZGlmeShhZGRlZCwgW10sIHNvdXJjZSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmVwbGFjZUVhY2goc291cmNlOiBzZWxlY3RvciwgdGFyZ2V0OiBzZWxlY3RvciA9IHNvdXJjZSkge1xyXG5cdFx0XHRcdGxldCBhZGRlZCA9IHRoaXMuZG9jLnFxKHNvdXJjZSk7XHJcblx0XHRcdFx0bGV0IHJlbW92ZWQgPSBkb2N1bWVudC5xcSh0YXJnZXQpO1xyXG5cdFx0XHRcdGlmIChhZGRlZC5sZW5ndGggIT0gcmVtb3ZlZC5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihgYWRkZWQvcmVtb3ZlZCBjb3VudCBtaXNtYXRjaGApO1xyXG5cdFx0XHRcdHJlbW92ZWQubWFwKChlLCBpKSA9PiBlLnJlcGxhY2VXaXRoKGFkZGVkW2ldKSk7XHJcblx0XHRcdFx0dGhpcy5lbWl0TW9kaWZ5KGFkZGVkLCByZW1vdmVkLCBzb3VyY2UpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJlcGxhY2Uoc291cmNlOiBzZWxlY3RvciwgdGFyZ2V0OiBzZWxlY3RvciA9IHNvdXJjZSkge1xyXG5cdFx0XHRcdGxldCBhZGRlZCA9IHRoaXMuZG9jLnFxKHNvdXJjZSk7XHJcblx0XHRcdFx0bGV0IHJlbW92ZWQgPSBkb2N1bWVudC5xcSh0YXJnZXQpO1xyXG5cdFx0XHRcdGlmIChhZGRlZC5sZW5ndGggIT0gcmVtb3ZlZC5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihgbm90IGltcGxlbWVudGVkYCk7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMucmVwbGFjZUVhY2goc291cmNlLCB0YXJnZXQpO1xyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0Ly8gdXRpbFxyXG5cdFx0XHRzdGF0aWMgbGlua1RvVXJsKGxpbms6IExpbmspOiB1cmwge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgbGluayA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0aWYgKGxpbmsuc3RhcnRzV2l0aCgnaHR0cCcpKSByZXR1cm4gbGluayBhcyB1cmw7XHJcblx0XHRcdFx0XHRsaW5rID0gZG9jdW1lbnQucTwnYSc+KGxpbmspO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAobGluay50YWdOYW1lICE9ICdBJykgdGhyb3cgbmV3IEVycm9yKCdsaW5rIHNob3VsZCBiZSA8YT4gZWxlbWVudCEnKTtcclxuXHRcdFx0XHRyZXR1cm4gKGxpbmsgYXMgSFRNTEFuY2hvckVsZW1lbnQpLmhyZWYgYXMgdXJsO1xyXG5cdFx0XHR9XHJcblx0XHRcdHN0YXRpYyBsaW5rVG9BbmNob3IobGluazogTGluayk6IEhUTUxBbmNob3JFbGVtZW50IHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIGxpbmsgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdGlmIChsaW5rLnN0YXJ0c1dpdGgoJ2h0dHAnKSkgcmV0dXJuIG51bGw7XHJcblx0XHRcdFx0XHRyZXR1cm4gZG9jdW1lbnQucTwnYSc+KGxpbmspO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gbGluaztcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0c3RhdGljIHN0YXRpY0NhbGw8VD4odGhpczogdm9pZCwgZGF0YTogUGFyYW1ldGVyczxQYWdpbmF0ZVsnc3RhdGljQ2FsbCddPlswXSkge1xyXG5cdFx0XHRcdGxldCBwID0gbmV3IFBhZ2luYXRlKCk7XHJcblx0XHRcdFx0cC5zdGF0aWNDYWxsKGRhdGEpO1xyXG5cdFx0XHRcdHJldHVybiBwO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyYXdEYXRhOiBhbnk7XHJcblx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHRjb25kaXRpb246ICgpID0+IGJvb2xlYW47XHJcblx0XHRcdFx0cHJlZmV0Y2g6IGFueVtdO1xyXG5cdFx0XHRcdGRvYzogc2VsZWN0b3JbXTtcclxuXHRcdFx0XHRjbGljazogc2VsZWN0b3JbXTtcclxuXHRcdFx0XHRhZnRlcjogc2VsZWN0b3JbXTtcclxuXHRcdFx0XHRyZXBsYWNlOiBzZWxlY3RvcltdO1xyXG5cdFx0XHRcdG1heEFnZTogZGVsdGFUaW1lO1xyXG5cdFx0XHRcdHN0YXJ0PzogKHRoaXM6IFBhZ2luYXRlKSA9PiB2b2lkO1xyXG5cdFx0XHRcdG1vZGlmeT86ICh0aGlzOiBQYWdpbmF0ZSwgZG9jOiBEb2N1bWVudCkgPT4gdm9pZDtcclxuXHRcdFx0XHRlbmQ/OiAodGhpczogUGFnaW5hdGUsIGRvYzogRG9jdW1lbnQpID0+IHZvaWQ7XHJcblx0XHRcdFx0eG1sPzogYm9vbGVhbjtcclxuXHRcdFx0fTtcclxuXHRcdFx0c3RhdGljQ2FsbChkYXRhOiB7XHJcblx0XHRcdFx0Y29uZGl0aW9uPzogc2VsZWN0b3IgfCAoKCkgPT4gYm9vbGVhbiksXHJcblx0XHRcdFx0cHJlZmV0Y2g/OiBzZWxlY3RvciB8IHNlbGVjdG9yW10sXHJcblx0XHRcdFx0Y2xpY2s/OiBzZWxlY3RvciB8IHNlbGVjdG9yW10sXHJcblx0XHRcdFx0ZG9jPzogc2VsZWN0b3IgfCBzZWxlY3RvcltdLFxyXG5cdFx0XHRcdGFmdGVyPzogc2VsZWN0b3IgfCBzZWxlY3RvcltdLFxyXG5cdFx0XHRcdHJlcGxhY2U/OiBzZWxlY3RvciB8IHNlbGVjdG9yW10sXHJcblx0XHRcdFx0c3RhcnQ/OiAodGhpczogUGFnaW5hdGUpID0+IHZvaWQ7XHJcblx0XHRcdFx0bW9kaWZ5PzogKHRoaXM6IFBhZ2luYXRlLCBkb2M6IERvY3VtZW50KSA9PiB2b2lkO1xyXG5cdFx0XHRcdGVuZD86ICh0aGlzOiBQYWdpbmF0ZSwgZG9jOiBEb2N1bWVudCkgPT4gdm9pZDtcclxuXHRcdFx0XHRtYXhBZ2U/OiBkZWx0YVRpbWU7XHJcblx0XHRcdFx0Y2FjaGU/OiBkZWx0YVRpbWUgfCB0cnVlO1xyXG5cdFx0XHRcdHhtbD86IGJvb2xlYW47XHJcblx0XHRcdFx0cGFnZXI/OiBzZWxlY3RvciB8IHNlbGVjdG9yW107XHJcblx0XHRcdFx0c2hpZnRlZD86IG51bWJlciB8ICgoKSA9PiBudW1iZXIpO1xyXG5cdFx0XHR9KSB7XHJcblx0XHRcdFx0ZnVuY3Rpb24gdG9BcnJheTxUPih2PzogVCB8IFRbXSB8IHVuZGVmaW5lZCk6IFRbXSB7XHJcblx0XHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheSh2KSkgcmV0dXJuIHY7XHJcblx0XHRcdFx0XHRpZiAodiA9PSBudWxsKSByZXR1cm4gW107XHJcblx0XHRcdFx0XHRyZXR1cm4gW3ZdO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRmdW5jdGlvbiB0b0NvbmRpdGlvbihzPzogc2VsZWN0b3IgfCAoKCkgPT4gYm9vbGVhbikgfCB1bmRlZmluZWQpOiAoKSA9PiBib29sZWFuIHtcclxuXHRcdFx0XHRcdGlmICghcykgcmV0dXJuICgpID0+IHRydWU7XHJcblx0XHRcdFx0XHRpZiAodHlwZW9mIHMgPT0gJ3N0cmluZycpIHJldHVybiAoKSA9PiAhIWRvY3VtZW50LnEocyk7XHJcblx0XHRcdFx0XHRyZXR1cm4gcztcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZnVuY3Rpb24gY2FuRmluZChhOiBzZWxlY3RvcltdKSB7XHJcblx0XHRcdFx0XHRpZiAoYS5sZW5ndGggPT0gMCkgcmV0dXJuIHRydWU7XHJcblx0XHRcdFx0XHRyZXR1cm4gYS5zb21lKHMgPT4gISFkb2N1bWVudC5xKHMpKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZnVuY3Rpb24gZmluZE9uZShhOiBzZWxlY3RvcltdKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gYS5maW5kKHMgPT4gZG9jdW1lbnQucShzKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMucmF3RGF0YSA9IGRhdGE7XHJcblx0XHRcdFx0dGhpcy5kYXRhID0ge1xyXG5cdFx0XHRcdFx0Y29uZGl0aW9uOiB0b0NvbmRpdGlvbihkYXRhLmNvbmRpdGlvbiksXHJcblx0XHRcdFx0XHRwcmVmZXRjaDogdG9BcnJheTxzZWxlY3Rvcj4oZGF0YS5wcmVmZXRjaClcclxuXHRcdFx0XHRcdFx0LmZsYXRNYXAoZSA9PiB0b0FycmF5KGRhdGFbZV0gPz8gZSkpLFxyXG5cdFx0XHRcdFx0ZG9jOiB0b0FycmF5PHNlbGVjdG9yPihkYXRhLmRvYyksXHJcblx0XHRcdFx0XHRjbGljazogdG9BcnJheTxzZWxlY3Rvcj4oZGF0YS5jbGljayksXHJcblx0XHRcdFx0XHRhZnRlcjogdG9BcnJheTxzZWxlY3Rvcj4oZGF0YS5hZnRlciksXHJcblx0XHRcdFx0XHRyZXBsYWNlOiB0b0FycmF5PHNlbGVjdG9yPihkYXRhLnJlcGxhY2UpLFxyXG5cdFx0XHRcdFx0bWF4QWdlOiBkYXRhLm1heEFnZSA/PyAoZGF0YS5jYWNoZSA9PSB0cnVlID8gJzF5JyA6IGRhdGEuY2FjaGUpLFxyXG5cdFx0XHRcdFx0c3RhcnQ6IGRhdGEuc3RhcnQsIG1vZGlmeTogZGF0YS5tb2RpZnksIGVuZDogZGF0YS5lbmQsXHJcblx0XHRcdFx0XHR4bWw6IGRhdGEueG1sLFxyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0dGhpcy5zaGlmdFJlcXVlc3RDb3VudCA9IGRhdGEuc2hpZnRlZDtcclxuXHRcdFx0XHRpZiAoZGF0YS5wYWdlcikge1xyXG5cdFx0XHRcdFx0bGV0IHBhZ2VyID0gdG9BcnJheTxzZWxlY3Rvcj4oZGF0YS5wYWdlcik7XHJcblx0XHRcdFx0XHR0aGlzLmRhdGEuZG9jID0gdGhpcy5kYXRhLmRvYy5mbGF0TWFwKGUgPT4gcGFnZXIubWFwKHAgPT4gYCR7cH0gJHtlfWApKTtcclxuXHRcdFx0XHRcdHRoaXMuZGF0YS5yZXBsYWNlLnB1c2goLi4ucGFnZXIpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLmNvbmRpdGlvbiA9ICgpID0+IHtcclxuXHRcdFx0XHRcdGlmICghdGhpcy5kYXRhLmNvbmRpdGlvbigpKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0XHRpZiAoIWNhbkZpbmQodGhpcy5kYXRhLmRvYykpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHRcdGlmICghY2FuRmluZCh0aGlzLmRhdGEuY2xpY2spKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHR9O1xyXG5cdFx0XHRcdHRoaXMuaW5pdCgpO1xyXG5cdFx0XHRcdGlmICh0aGlzLmRhdGEuY29uZGl0aW9uKCkpIHtcclxuXHRcdFx0XHRcdHRoaXMuZGF0YS5wcmVmZXRjaC5tYXAocyA9PiBQYWdpbmF0ZS5wcmVmZXRjaChzKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMub25ydW4gPSBhc3luYyAoKSA9PiB7XHJcblx0XHRcdFx0XHQvLyBpZiAoIWZpeGVkRGF0YS5jb25kaXRpb24oKSkgcmV0dXJuO1xyXG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5kYXRhLnN0YXJ0Py5jYWxsKHRoaXMpO1xyXG5cdFx0XHRcdFx0dGhpcy5kYXRhLmNsaWNrLm1hcChlID0+IGRvY3VtZW50LnEoZSk/LmNsaWNrKCkpO1xyXG5cdFx0XHRcdFx0bGV0IGRvYyA9IGZpbmRPbmUodGhpcy5kYXRhLmRvYyk7XHJcblx0XHRcdFx0XHRpZiAoZG9jKSB7XHJcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMuZmV0Y2hEb2N1bWVudChkb2MsIHRydWUsIHRoaXMuZGF0YS5tYXhBZ2UpO1xyXG5cdFx0XHRcdFx0XHR0aGlzLmRhdGEucmVwbGFjZS5tYXAocyA9PiB0aGlzLnJlcGxhY2UocykpO1xyXG5cdFx0XHRcdFx0XHR0aGlzLmRhdGEuYWZ0ZXIubWFwKHMgPT4gdGhpcy5hZnRlcihzKSk7XHJcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMuZGF0YS5tb2RpZnk/LmNhbGwodGhpcywgdGhpcy5kb2MpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5kYXRhLmVuZD8uY2FsbCh0aGlzLCBkb2MgJiYgdGhpcy5kb2MpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHR9XHJcblx0XHR0eXBlIFNlbE9yRWwgPSBzZWxlY3RvciB8IEhUTUxFbGVtZW50O1xyXG5cdFx0dHlwZSBTb21laG93PFQ+ID0gbnVsbCB8IFQgfCBUW10gfCAoKCkgPT4gKG51bGwgfCBUIHwgVFtdKSk7XHJcblx0XHR0eXBlIFNvbWVob3dBc3luYzxUPiA9IG51bGwgfCBUIHwgVFtdIHwgKCgpID0+IChudWxsIHwgVCB8IFRbXSB8IFByb21pc2U8bnVsbCB8IFQgfCBUW10+KSk7XHJcblxyXG5cdFx0ZXhwb3J0IGNvbnN0IHBhZ2luYXRlID0gT2JqZWN0LnNldFByb3RvdHlwZU9mKE9iamVjdC5hc3NpZ24oUGFnaW5hdGUuc3RhdGljQ2FsbCwgbmV3IFBhZ2luYXRlKCkpLCBQYWdpbmF0ZSk7XHJcblx0fVxyXG5cclxuXHRleHBvcnQgY29uc3QgcGFnaW5hdGUgPSBQYWdpbmF0ZUV4dGVuc2lvbi5wYWdpbmF0ZTtcclxuXHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHRleHBvcnQgbmFtZXNwYWNlIEltYWdlU2Nyb2xsaW5nRXh0ZW5zaW9uIHtcclxuXHJcblx0XHRleHBvcnQgbGV0IGltYWdlU2Nyb2xsaW5nQWN0aXZlID0gZmFsc2U7XHJcblx0XHRleHBvcnQgbGV0IGltZ1NlbGVjdG9yID0gJ2ltZyc7XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGltYWdlU2Nyb2xsaW5nKHNlbGVjdG9yPzogc3RyaW5nKSB7XHJcblx0XHRcdGlmIChpbWFnZVNjcm9sbGluZ0FjdGl2ZSkgcmV0dXJuO1xyXG5cdFx0XHRpZiAoc2VsZWN0b3IpIGltZ1NlbGVjdG9yID0gc2VsZWN0b3I7XHJcblx0XHRcdGltYWdlU2Nyb2xsaW5nQWN0aXZlID0gdHJ1ZTtcclxuXHRcdFx0ZnVuY3Rpb24gb253aGVlbChldmVudDogTW91c2VFdmVudCAmIHsgd2hlZWxEZWx0YVk6IG51bWJlciB9KSB7XHJcblx0XHRcdFx0aWYgKGV2ZW50LnNoaWZ0S2V5IHx8IGV2ZW50LmN0cmxLZXkpIHJldHVybjtcclxuXHRcdFx0XHRpZiAoc2Nyb2xsV2hvbGVJbWFnZSgtTWF0aC5zaWduKGV2ZW50LndoZWVsRGVsdGFZKSkpIHtcclxuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNld2hlZWwnLCBvbndoZWVsLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHRyZXR1cm4gaW1hZ2VTY3JvbGxpbmdPZmYgPSAoKSA9PiB7XHJcblx0XHRcdFx0aW1hZ2VTY3JvbGxpbmdBY3RpdmUgPSBmYWxzZTtcclxuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXdoZWVsJywgb253aGVlbCk7XHJcblx0XHRcdH07XHJcblx0XHR9XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gYmluZEFycm93cygpIHtcclxuXHRcdFx0YWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGV2ZW50ID0+IHtcclxuXHRcdFx0XHRpZiAoZXZlbnQuY29kZSA9PSAnQXJyb3dMZWZ0Jykge1xyXG5cdFx0XHRcdFx0c2Nyb2xsV2hvbGVJbWFnZSgtMSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChldmVudC5jb2RlID09ICdBcnJvd1JpZ2h0Jykge1xyXG5cdFx0XHRcdFx0c2Nyb2xsV2hvbGVJbWFnZSgxKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblx0XHRleHBvcnQgbGV0IGltYWdlU2Nyb2xsaW5nT2ZmID0gKCkgPT4geyB9O1xyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBpbWdUb1dpbmRvd0NlbnRlcihpbWc6IEVsZW1lbnQpIHtcclxuXHRcdFx0bGV0IHJlY3QgPSBpbWcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblx0XHRcdHJldHVybiAocmVjdC50b3AgKyByZWN0LmJvdHRvbSkgLyAyIC0gaW5uZXJIZWlnaHQgLyAyO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBnZXRBbGxJbWFnZUluZm8oKSB7XHJcblx0XHRcdGxldCBpbWFnZXMgPSBxcShpbWdTZWxlY3RvcikgYXMgSFRNTEltYWdlRWxlbWVudFtdO1xyXG5cdFx0XHRsZXQgZGF0YXMgPSBpbWFnZXMubWFwKChpbWcsIGluZGV4KSA9PiB7XHJcblx0XHRcdFx0bGV0IHJlY3QgPSBpbWcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblx0XHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRcdGltZywgcmVjdCwgaW5kZXgsXHJcblx0XHRcdFx0XHRpblNjcmVlbjogcmVjdC50b3AgPj0gLTEgJiYgcmVjdC5ib3R0b20gPD0gaW5uZXJIZWlnaHQsXHJcblx0XHRcdFx0XHRjcm9zc1NjcmVlbjogcmVjdC5ib3R0b20gPj0gMSAmJiByZWN0LnRvcCA8PSBpbm5lckhlaWdodCAtIDEsXHJcblx0XHRcdFx0XHR5VG9TY3JlZW5DZW50ZXI6IChyZWN0LnRvcCArIHJlY3QuYm90dG9tKSAvIDIgLSBpbm5lckhlaWdodCAvIDIsXHJcblx0XHRcdFx0XHRpc0luQ2VudGVyOiBNYXRoLmFicygocmVjdC50b3AgKyByZWN0LmJvdHRvbSkgLyAyIC0gaW5uZXJIZWlnaHQgLyAyKSA8IDMsXHJcblx0XHRcdFx0XHRpc1NjcmVlbkhlaWdodDogTWF0aC5hYnMocmVjdC5oZWlnaHQgLSBpbm5lckhlaWdodCkgPCAzLFxyXG5cdFx0XHRcdH07XHJcblx0XHRcdH0pLmZpbHRlcihlID0+IGUucmVjdD8ud2lkdGggfHwgZS5yZWN0Py53aWR0aCk7XHJcblx0XHRcdHJldHVybiBkYXRhcztcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgbGV0IHNjcm9sbFdob2xlSW1hZ2VQZW5kaW5nID0gZmFsc2U7XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGdldENlbnRyYWxJbWcoKSB7XHJcblx0XHRcdHJldHVybiBnZXRBbGxJbWFnZUluZm8oKS52c29ydChlID0+IE1hdGguYWJzKGUueVRvU2NyZWVuQ2VudGVyKSlbMF0/LmltZztcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBzY3JvbGxXaG9sZUltYWdlKGRpciA9IDEpOiBib29sZWFuIHtcclxuXHRcdFx0aWYgKHNjcm9sbFdob2xlSW1hZ2VQZW5kaW5nKSByZXR1cm4gdHJ1ZTtcclxuXHRcdFx0Ly8gaWYgKGRpciA9PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ3Njcm9sbGluZyBpbiBubyBkaXJlY3Rpb24hJyk7XHJcblx0XHRcdGlmICghZGlyKSByZXR1cm4gZmFsc2U7XHJcblxyXG5cdFx0XHRkaXIgPSBNYXRoLnNpZ24oZGlyKTtcclxuXHRcdFx0bGV0IGRhdGFzID0gZ2V0QWxsSW1hZ2VJbmZvKCkudnNvcnQoZSA9PiBlLnlUb1NjcmVlbkNlbnRlcik7XHJcblx0XHRcdGxldCBjZW50cmFsID0gZGF0YXMudnNvcnQoZSA9PiBNYXRoLmFicyhlLnlUb1NjcmVlbkNlbnRlcikpWzBdO1xyXG5cdFx0XHRsZXQgbmV4dENlbnRyYWxJbmRleCA9IGRhdGFzLmluZGV4T2YoY2VudHJhbCk7XHJcblx0XHRcdHdoaWxlIChcclxuXHRcdFx0XHRkYXRhc1tuZXh0Q2VudHJhbEluZGV4ICsgZGlyXSAmJlxyXG5cdFx0XHRcdE1hdGguYWJzKGRhdGFzW25leHRDZW50cmFsSW5kZXggKyBkaXJdLnlUb1NjcmVlbkNlbnRlciAtIGNlbnRyYWwueVRvU2NyZWVuQ2VudGVyKSA8IDEwXHJcblx0XHRcdCkgbmV4dENlbnRyYWxJbmRleCArPSBkaXI7XHJcblx0XHRcdGNlbnRyYWwgPSBkYXRhc1tuZXh0Q2VudHJhbEluZGV4XTtcclxuXHRcdFx0bGV0IG5leHQgPSBkYXRhc1tuZXh0Q2VudHJhbEluZGV4ICsgZGlyXTtcclxuXHJcblx0XHRcdGZ1bmN0aW9uIHNjcm9sbFRvSW1hZ2UoZGF0YTogdHlwZW9mIGNlbnRyYWwgfCB1bmRlZmluZWQpOiBib29sZWFuIHtcclxuXHRcdFx0XHRpZiAoIWRhdGEpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHRpZiAoc2Nyb2xsWSArIGRhdGEueVRvU2NyZWVuQ2VudGVyIDw9IDAgJiYgc2Nyb2xsWSA8PSAwKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChkYXRhLmlzU2NyZWVuSGVpZ2h0KSB7XHJcblx0XHRcdFx0XHRkYXRhLmltZy5zY3JvbGxJbnRvVmlldygpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRzY3JvbGxUbyhzY3JvbGxYLCBzY3JvbGxZICsgZGF0YS55VG9TY3JlZW5DZW50ZXIpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRzY3JvbGxXaG9sZUltYWdlUGVuZGluZyA9IHRydWU7XHJcblx0XHRcdFx0UHJvbWlzZS5yYWYoMikudGhlbigoKSA9PiBzY3JvbGxXaG9sZUltYWdlUGVuZGluZyA9IGZhbHNlKTtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gaWYgbm8gaW1hZ2VzLCBkb24ndCBzY3JvbGw7XHJcblx0XHRcdGlmICghY2VudHJhbCkgcmV0dXJuIGZhbHNlO1xyXG5cclxuXHRcdFx0Ly8gaWYgY3VycmVudCBpbWFnZSBpcyBvdXRzaWRlIHZpZXcsIGRvbid0IHNjcm9sbFxyXG5cdFx0XHRpZiAoIWNlbnRyYWwuY3Jvc3NTY3JlZW4pIHJldHVybiBmYWxzZTtcclxuXHJcblx0XHRcdC8vIGlmIGN1cnJlbnQgaW1hZ2UgaXMgaW4gY2VudGVyLCBzY3JvbGwgdG8gdGhlIG5leHQgb25lXHJcblx0XHRcdGlmIChjZW50cmFsLmlzSW5DZW50ZXIpIHtcclxuXHRcdFx0XHRyZXR1cm4gc2Nyb2xsVG9JbWFnZShuZXh0KTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gaWYgdG8gc2Nyb2xsIHRvIGN1cnJlbnQgaW1hZ2UgeW91IGhhdmUgdG8gc2Nyb2xsIGluIG9wcG9zaWRlIGRpcmVjdGlvbiwgc2Nyb2xsIHRvIG5leHQgb25lXHJcblx0XHRcdGlmIChNYXRoLnNpZ24oY2VudHJhbC55VG9TY3JlZW5DZW50ZXIpICE9IGRpcikge1xyXG5cdFx0XHRcdHJldHVybiBzY3JvbGxUb0ltYWdlKG5leHQpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBpZiBjdXJyZW50IGltYWdlIGlzIGZpcnN0L2xhc3QsIGRvbid0IHNjcm9sbCBvdmVyIDI1dmggdG8gaXRcclxuXHRcdFx0aWYgKGRpciA9PSAxICYmIGNlbnRyYWwuaW5kZXggPT0gMCAmJiBjZW50cmFsLnlUb1NjcmVlbkNlbnRlciA+IGlubmVySGVpZ2h0IC8gMikge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoZGlyID09IC0xICYmIGNlbnRyYWwuaW5kZXggPT0gZGF0YXMubGVuZ3RoIC0gMSAmJiBjZW50cmFsLnlUb1NjcmVlbkNlbnRlciA8IC1pbm5lckhlaWdodCAvIDIpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBzY3JvbGxUb0ltYWdlKGNlbnRyYWwpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBzYXZlU2Nyb2xsUG9zaXRpb24oKSB7XHJcblx0XHRcdGxldCBpbWcgPSBnZXRDZW50cmFsSW1nKCk7XHJcblx0XHRcdGxldCByZWN0ID0gaW1nLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG5cdFx0XHRsZXQgY2VudGVyVG9XaW5kb3dDZW50ZXIgPSAocmVjdC50b3AgKyByZWN0LmJvdHRvbSkgLyAyIC0gaW5uZXJIZWlnaHQgLyAyO1xyXG5cdFx0XHRsZXQgb2Zmc2V0ID0gY2VudGVyVG9XaW5kb3dDZW50ZXIgLyByZWN0LmhlaWdodDtcclxuXHRcdFx0cmV0dXJuIHsgaW1nLCBvZmZzZXQsIGxvYWQoKSB7IGxvYWRTY3JvbGxQb3NpdGlvbih7IGltZywgb2Zmc2V0IH0pOyB9IH07XHJcblx0XHR9XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gbG9hZFNjcm9sbFBvc2l0aW9uKHBvczogeyBpbWc6IEhUTUxJbWFnZUVsZW1lbnQsIG9mZnNldDogbnVtYmVyIH0pIHtcclxuXHRcdFx0bGV0IHJlY3QgPSBwb3MuaW1nLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG5cdFx0XHRsZXQgY2VudGVyVG9XaW5kb3dDZW50ZXIgPSBwb3Mub2Zmc2V0ICogcmVjdC5oZWlnaHQ7XHJcblx0XHRcdGxldCBhY3R1YWxDZW50ZXJUb1dpbmRvd0NlbnRlciA9IChyZWN0LnRvcCArIHJlY3QuYm90dG9tKSAvIDIgLSBpbm5lckhlaWdodCAvIDI7XHJcblx0XHRcdHNjcm9sbEJ5KDAsIGFjdHVhbENlbnRlclRvV2luZG93Q2VudGVyIC0gY2VudGVyVG9XaW5kb3dDZW50ZXIpO1xyXG5cdFx0fVxyXG5cclxuXHR9XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9BcnJheS50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL0RhdGVOb3dIYWNrLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZWxlbWVudC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2VsbS50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL0ZpbHRlcmVyL0VudGl0eUZpbHRlcmVyLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZXRjLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZmV0Y2gudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9PYmplY3QudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9vYnNlcnZlci50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL1BhZ2luYXRlL1BhZ2luYXRpb24udHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9QYWdpbmF0ZS9JbWFnZVNjcm9sbGluZy50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL1Byb21pc2UudHNcIiAvPlxyXG5cclxuXHJcblxyXG5cclxuXHJcbm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gX19pbml0X18od2luZG93OiBXaW5kb3cgJiB0eXBlb2YgZ2xvYmFsVGhpcyk6IFwiaW5pdGVkXCIgfCBcImFscmVhZHkgaW5pdGVkXCIge1xyXG5cdFx0aWYgKCF3aW5kb3cpIHdpbmRvdyA9IGdsb2JhbFRoaXMud2luZG93IGFzIFdpbmRvdyAmIHR5cGVvZiBnbG9iYWxUaGlzO1xyXG5cclxuXHRcdHdpbmRvdy5lbG0gPSBFbG0uZWxtO1xyXG5cdFx0d2luZG93LnEgPSBPYmplY3QuYXNzaWduKFF1ZXJ5U2VsZWN0b3IuV2luZG93US5xLCB7IG9yRWxtOiBQb29wSnMuRWxtLnFPckVsbSB9KTtcclxuXHRcdHdpbmRvdy5xcSA9IFF1ZXJ5U2VsZWN0b3IuV2luZG93US5xcTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZSh3aW5kb3cuRWxlbWVudC5wcm90b3R5cGUsICdxJywgUXVlcnlTZWxlY3Rvci5FbGVtZW50US5xKTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZSh3aW5kb3cuRWxlbWVudC5wcm90b3R5cGUsICdxcScsIFF1ZXJ5U2VsZWN0b3IuRWxlbWVudFEucXEpO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKHdpbmRvdy5FbGVtZW50LnByb3RvdHlwZSwgJ2FwcGVuZFRvJywgRWxlbWVudEV4dGVuc2lvbi5hcHBlbmRUbyk7XHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUod2luZG93LkVsZW1lbnQucHJvdG90eXBlLCAnZW1pdCcsIEVsZW1lbnRFeHRlbnNpb24uZW1pdCk7XHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUod2luZG93LkRvY3VtZW50LnByb3RvdHlwZSwgJ3EnLCBRdWVyeVNlbGVjdG9yLkRvY3VtZW50US5xKTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZSh3aW5kb3cuRG9jdW1lbnQucHJvdG90eXBlLCAncXEnLCBRdWVyeVNlbGVjdG9yLkRvY3VtZW50US5xcSk7XHJcblxyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKHdpbmRvdy5Qcm9taXNlLCAnZW1wdHknLCBQcm9taXNlRXh0ZW5zaW9uLmVtcHR5KTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZSh3aW5kb3cuUHJvbWlzZSwgJ2ZyYW1lJywgUHJvbWlzZUV4dGVuc2lvbi5mcmFtZSk7XHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUod2luZG93LlByb21pc2UsICdyYWYnLCBQcm9taXNlRXh0ZW5zaW9uLmZyYW1lKTtcclxuXHJcblx0XHR3aW5kb3cuZmV0Y2guY2FjaGVkID0gRmV0Y2hFeHRlbnNpb24uY2FjaGVkIGFzIGFueTtcclxuXHRcdHdpbmRvdy5mZXRjaC5kb2MgPSBGZXRjaEV4dGVuc2lvbi5kb2MgYXMgYW55O1xyXG5cdFx0d2luZG93LmZldGNoLmpzb24gPSBGZXRjaEV4dGVuc2lvbi5qc29uIGFzIGFueTtcclxuXHRcdHdpbmRvdy5mZXRjaC5jYWNoZWQuZG9jID0gRmV0Y2hFeHRlbnNpb24uY2FjaGVkRG9jO1xyXG5cdFx0d2luZG93LmZldGNoLmRvYy5jYWNoZWQgPSBGZXRjaEV4dGVuc2lvbi5jYWNoZWREb2M7XHJcblx0XHR3aW5kb3cuZmV0Y2guY2FjaGVkRG9jID0gRmV0Y2hFeHRlbnNpb24uY2FjaGVkRG9jO1xyXG5cdFx0d2luZG93LmZldGNoLmpzb24uY2FjaGVkID0gRmV0Y2hFeHRlbnNpb24uY2FjaGVkSnNvbjtcclxuXHRcdHdpbmRvdy5mZXRjaC5jYWNoZWQuanNvbiA9IEZldGNoRXh0ZW5zaW9uLmNhY2hlZEpzb247XHJcblx0XHR3aW5kb3cuZmV0Y2guaXNDYWNoZWQgPSBGZXRjaEV4dGVuc2lvbi5pc0NhY2hlZDtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZSh3aW5kb3cuUmVzcG9uc2UucHJvdG90eXBlLCAnY2FjaGVkQXQnLCAwKTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZSh3aW5kb3cuRG9jdW1lbnQucHJvdG90eXBlLCAnY2FjaGVkQXQnLCAwKTtcclxuXHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUod2luZG93Lk9iamVjdCwgJ2RlZmluZVZhbHVlJywgT2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZSh3aW5kb3cuT2JqZWN0LCAnZGVmaW5lR2V0dGVyJywgT2JqZWN0RXh0ZW5zaW9uLmRlZmluZUdldHRlcik7XHJcblx0XHQvLyBPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoT2JqZWN0LCAnbWFwJywgT2JqZWN0RXh0ZW5zaW9uLm1hcCk7XHJcblxyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKHdpbmRvdy5BcnJheSwgJ21hcCcsIEFycmF5RXh0ZW5zaW9uLm1hcCk7XHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUod2luZG93LkFycmF5LnByb3RvdHlwZSwgJ3BtYXAnLCBBcnJheUV4dGVuc2lvbi5QTWFwLnRoaXNfcG1hcCk7XHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUod2luZG93LkFycmF5LnByb3RvdHlwZSwgJ3Zzb3J0JywgQXJyYXlFeHRlbnNpb24udnNvcnQpO1xyXG5cdFx0aWYgKCFbXS5hdClcclxuXHRcdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKHdpbmRvdy5BcnJheS5wcm90b3R5cGUsICdhdCcsIEFycmF5RXh0ZW5zaW9uLmF0KTtcclxuXHRcdGlmICghW10uZmluZExhc3QpXHJcblx0XHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZSh3aW5kb3cuQXJyYXkucHJvdG90eXBlLCAnZmluZExhc3QnLCBBcnJheUV4dGVuc2lvbi5maW5kTGFzdCk7XHJcblxyXG5cdFx0d2luZG93LnBhZ2luYXRlID0gUG9vcEpzLnBhZ2luYXRlIGFzIGFueTtcclxuXHRcdHdpbmRvdy5pbWFnZVNjcm9sbGluZyA9IFBvb3BKcy5JbWFnZVNjcm9sbGluZ0V4dGVuc2lvbjtcclxuXHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUod2luZG93LCAnX19pbml0X18nLCAnYWxyZWFkeSBpbml0ZWQnKTtcclxuXHRcdHJldHVybiAnaW5pdGVkJztcclxuXHR9XHJcblxyXG5cdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVHZXR0ZXIod2luZG93LCAnX19pbml0X18nLCAoKSA9PiBfX2luaXRfXyh3aW5kb3cpKTtcclxuXHRPYmplY3QuYXNzaWduKGdsb2JhbFRoaXMsIHsgUG9vcEpzIH0pO1xyXG5cclxuXHRpZiAod2luZG93LmxvY2FsU3RvcmFnZS5fX2luaXRfXykge1xyXG5cdFx0d2luZG93Ll9faW5pdF9fO1xyXG5cdH1cclxuXHJcbn0iLCIiLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHRleHBvcnQgdHlwZSBWYWx1ZU9mPFQ+ID0gVFtrZXlvZiBUXTtcclxuXHRleHBvcnQgdHlwZSBNYXBwZWRPYmplY3Q8VCwgVj4gPSB7IFtQIGluIGtleW9mIFRdOiBWIH07XHJcblxyXG5cdGV4cG9ydCB0eXBlIHNlbGVjdG9yID0gc3RyaW5nIHwgc3RyaW5nICYgeyBfPzogJ3NlbGVjdG9yJyB9XHJcblx0ZXhwb3J0IHR5cGUgdXJsID0gYGh0dHAke3N0cmluZ31gICYgeyBfPzogJ3VybCcgfTtcclxuXHRleHBvcnQgdHlwZSBMaW5rID0gSFRNTEFuY2hvckVsZW1lbnQgfCBzZWxlY3RvciB8IHVybDtcclxuXHJcblxyXG5cclxuXHJcblx0dHlwZSB0cmltU3RhcnQ8UywgQyBleHRlbmRzIHN0cmluZz4gPSBTIGV4dGVuZHMgYCR7Q30ke2luZmVyIFMxfWAgPyB0cmltU3RhcnQ8UzEsIEM+IDogUztcclxuXHR0eXBlIHRyaW1FbmQ8UywgQyBleHRlbmRzIHN0cmluZz4gPSBTIGV4dGVuZHMgYCR7aW5mZXIgUzF9JHtDfWAgPyB0cmltRW5kPFMxLCBDPiA6IFM7XHJcblx0dHlwZSB0cmltPFMsIEMgZXh0ZW5kcyBzdHJpbmcgPSAnICcgfCAnXFx0JyB8ICdcXG4nPiA9IHRyaW1TdGFydDx0cmltRW5kPFMsIEM+LCBDPjtcclxuXHJcblx0dHlwZSBzcGxpdDxTLCBDIGV4dGVuZHMgc3RyaW5nPiA9IFMgZXh0ZW5kcyBgJHtpbmZlciBTMX0ke0N9JHtpbmZlciBTMn1gID8gc3BsaXQ8UzEsIEM+IHwgc3BsaXQ8UzIsIEM+IDogUztcclxuXHR0eXBlIHNwbGl0U3RhcnQ8UywgQyBleHRlbmRzIHN0cmluZz4gPSBTIGV4dGVuZHMgYCR7aW5mZXIgUzF9JHtDfSR7aW5mZXIgX1MyfWAgPyBzcGxpdFN0YXJ0PFMxLCBDPiA6IFM7XHJcblx0dHlwZSBzcGxpdEVuZDxTLCBDIGV4dGVuZHMgc3RyaW5nPiA9IFMgZXh0ZW5kcyBgJHtpbmZlciBfUzF9JHtDfSR7aW5mZXIgUzJ9YCA/IHNwbGl0RW5kPFMyLCBDPiA6IFM7XHJcblxyXG5cdHR5cGUgcmVwbGFjZTxTLCBDIGV4dGVuZHMgc3RyaW5nLCBWIGV4dGVuZHMgc3RyaW5nPiA9IFMgZXh0ZW5kcyBgJHtpbmZlciBTMX0ke0N9JHtpbmZlciBTM31gID8gcmVwbGFjZTxgJHtTMX0ke1Z9JHtTM31gLCBDLCBWPiA6IFM7XHJcblxyXG5cdHR5cGUgd3MgPSAnICcgfCAnXFx0JyB8ICdcXG4nO1xyXG5cclxuXHQvLyB0eXBlIGluc2FuZVNlbGVjdG9yID0gJyBhICwgYltxd2VdIFxcbiAsIGMueCAsIGQjeSAsIHggZSAsIHg+ZiAsIHggPiBnICwgW3F3ZV0gLCBoOm5vdCh4PnkpICwgaW1nICc7XHJcblxyXG5cdC8vIHR5cGUgX2kxID0gcmVwbGFjZTxpbnNhbmVTZWxlY3RvciwgYFske3N0cmluZ31dYCwgJy4nPjtcclxuXHQvLyB0eXBlIF9pMTUgPSByZXBsYWNlPF9pMSwgYCgke3N0cmluZ30pYCwgJy4nPjtcclxuXHQvLyB0eXBlIF9pMTcgPSByZXBsYWNlPF9pMTUsIEV4Y2x1ZGU8d3MsICcgJz4sICcgJz47XHJcblx0Ly8gdHlwZSBfaTIgPSBzcGxpdDxfaTE3LCAnLCc+O1xyXG5cdC8vIHR5cGUgX2kzID0gdHJpbTxfaTI+O1xyXG5cdC8vIHR5cGUgX2k0ID0gc3BsaXRFbmQ8X2kzLCB3cyB8ICc+Jz47XHJcblx0Ly8gdHlwZSBfaTUgPSBzcGxpdFN0YXJ0PF9pNCwgJy4nIHwgJyMnIHwgJzonPjtcclxuXHQvLyB0eXBlIF9pNiA9IChIVE1MRWxlbWVudFRhZ05hbWVNYXAgJiB7ICcnOiBIVE1MRWxlbWVudCB9ICYgeyBbazogc3RyaW5nXTogSFRNTEVsZW1lbnQgfSlbX2k1XTtcclxuXHRleHBvcnQgdHlwZSBUYWdOYW1lRnJvbVNlbGVjdG9yPFMgZXh0ZW5kcyBzdHJpbmc+ID0gc3BsaXRTdGFydDxzcGxpdEVuZDx0cmltPHNwbGl0PHJlcGxhY2U8cmVwbGFjZTxyZXBsYWNlPFMsIGBbJHtzdHJpbmd9XWAsICcuJz4sIGAoJHtzdHJpbmd9KWAsICcuJz4sIEV4Y2x1ZGU8d3MsICcgJz4sICcgJz4sICcsJz4+LCB3cyB8ICc+Jz4sICcuJyB8ICcjJyB8ICc6Jz47XHJcblxyXG5cdGV4cG9ydCB0eXBlIFRhZ0VsZW1lbnRGcm9tVGFnTmFtZTxTPiA9IFMgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXAgPyBIVE1MRWxlbWVudFRhZ05hbWVNYXBbU10gOiBIVE1MRWxlbWVudDtcclxufVxyXG5cclxuXHJcbmRlY2xhcmUgY29uc3QgX19pbml0X186IFwiaW5pdGVkXCIgfCBcImFscmVhZHkgaW5pdGVkXCI7XHJcbmRlY2xhcmUgY29uc3QgZWxtOiB0eXBlb2YgUG9vcEpzLkVsbS5lbG07XHJcbmRlY2xhcmUgY29uc3QgcTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLldpbmRvd1EucSAmIHsgb3JFbG06IHR5cGVvZiBQb29wSnMuRWxtLnFPckVsbSB9OztcclxuZGVjbGFyZSBjb25zdCBxcTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLldpbmRvd1EucXE7XHJcbmRlY2xhcmUgY29uc3QgcGFnaW5hdGU6IHR5cGVvZiBQb29wSnMucGFnaW5hdGU7XHJcbmRlY2xhcmUgY29uc3QgaW1hZ2VTY3JvbGxpbmc6IHR5cGVvZiBQb29wSnMuSW1hZ2VTY3JvbGxpbmdFeHRlbnNpb247XHJcbmRlY2xhcmUgbmFtZXNwYWNlIGZldGNoIHtcclxuXHRleHBvcnQgbGV0IGNhY2hlZDogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5jYWNoZWQgJiB7IGRvYzogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5jYWNoZWREb2MsIGpzb246IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkSnNvbiB9O1xyXG5cdGV4cG9ydCBsZXQgZG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmRvYyAmIHsgY2FjaGVkOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYyB9O1xyXG5cdGV4cG9ydCBsZXQgY2FjaGVkRG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYztcclxuXHRleHBvcnQgbGV0IGpzb246IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uanNvbiAmIHsgY2FjaGVkOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZEpzb24gfTtcclxuXHRleHBvcnQgbGV0IGlzQ2FjaGVkOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmlzQ2FjaGVkO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgV2luZG93IHtcclxuXHRyZWFkb25seSBfX2luaXRfXzogXCJpbml0ZWRcIiB8IFwiYWxyZWFkeSBpbml0ZWRcIjtcclxuXHRlbG06IHR5cGVvZiBQb29wSnMuRWxtLmVsbTtcclxuXHRxOiB0eXBlb2YgUG9vcEpzLlF1ZXJ5U2VsZWN0b3IuV2luZG93US5xICYgeyBvckVsbTogdHlwZW9mIFBvb3BKcy5FbG0ucU9yRWxtIH07XHJcblx0cXE6IHR5cGVvZiBQb29wSnMuUXVlcnlTZWxlY3Rvci5XaW5kb3dRLnFxO1xyXG5cdHBhZ2luYXRlOiB0eXBlb2YgUG9vcEpzLnBhZ2luYXRlO1xyXG5cdGltYWdlU2Nyb2xsaW5nOiB0eXBlb2YgUG9vcEpzLkltYWdlU2Nyb2xsaW5nRXh0ZW5zaW9uO1xyXG5cdGZldGNoOiB7XHJcblx0XHQoaW5wdXQ6IFJlcXVlc3RJbmZvLCBpbml0PzogUmVxdWVzdEluaXQpOiBQcm9taXNlPFJlc3BvbnNlPjtcclxuXHRcdGNhY2hlZDogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5jYWNoZWQgJiB7IGRvYzogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5jYWNoZWREb2MsIGpzb246IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkSnNvbiB9O1xyXG5cdFx0ZG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmRvYyAmIHsgY2FjaGVkOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYyB9O1xyXG5cdFx0Y2FjaGVkRG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYztcclxuXHRcdGpzb246IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uanNvbiAmIHsgY2FjaGVkOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZEpzb24gfTtcclxuXHRcdGlzQ2FjaGVkOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmlzQ2FjaGVkO1xyXG5cdH1cclxufVxyXG5cclxuaW50ZXJmYWNlIEVsZW1lbnQge1xyXG5cdHE6IHR5cGVvZiBQb29wSnMuUXVlcnlTZWxlY3Rvci5FbGVtZW50US5xO1xyXG5cdHFxOiB0eXBlb2YgUG9vcEpzLlF1ZXJ5U2VsZWN0b3IuRWxlbWVudFEucXE7XHJcblx0YXBwZW5kVG86IHR5cGVvZiBQb29wSnMuRWxlbWVudEV4dGVuc2lvbi5hcHBlbmRUbztcclxuXHRlbWl0OiB0eXBlb2YgUG9vcEpzLkVsZW1lbnRFeHRlbnNpb24uZW1pdDtcclxuXHRhZGRFdmVudExpc3RlbmVyPFQgZXh0ZW5kcyBDdXN0b21FdmVudDx7IF9ldmVudD86IHN0cmluZyB9Pj4odHlwZTogVFsnZGV0YWlsJ11bJ19ldmVudCddLCBsaXN0ZW5lcjogKHRoaXM6IERvY3VtZW50LCBldjogVCkgPT4gYW55LCBvcHRpb25zPzogYm9vbGVhbiB8IEFkZEV2ZW50TGlzdGVuZXJPcHRpb25zKTogdm9pZDtcclxufVxyXG5pbnRlcmZhY2UgRG9jdW1lbnQge1xyXG5cdHE6IHR5cGVvZiBQb29wSnMuUXVlcnlTZWxlY3Rvci5Eb2N1bWVudFEucTtcclxuXHRxcTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLkRvY3VtZW50US5xcTtcclxuXHRjYWNoZWRBdDogbnVtYmVyO1xyXG5cdGFkZEV2ZW50TGlzdGVuZXI8VCBleHRlbmRzIEN1c3RvbUV2ZW50PHsgX2V2ZW50Pzogc3RyaW5nIH0+Pih0eXBlOiBUWydkZXRhaWwnXVsnX2V2ZW50J10sIGxpc3RlbmVyOiAodGhpczogRG9jdW1lbnQsIGV2OiBUKSA9PiBhbnksIG9wdGlvbnM/OiBib29sZWFuIHwgQWRkRXZlbnRMaXN0ZW5lck9wdGlvbnMpOiB2b2lkO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgT2JqZWN0Q29uc3RydWN0b3Ige1xyXG5cdGRlZmluZVZhbHVlOiB0eXBlb2YgUG9vcEpzLk9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZTtcclxuXHRkZWZpbmVHZXR0ZXI6IHR5cGVvZiBQb29wSnMuT2JqZWN0RXh0ZW5zaW9uLmRlZmluZUdldHRlcjtcclxuXHQvLyBtYXA6IHR5cGVvZiBQb29wSnMuT2JqZWN0RXh0ZW5zaW9uLm1hcDtcclxuXHRzZXRQcm90b3R5cGVPZjxULCBQPihvOiBULCBwcm90bzogUCk6IFQgJiBQO1xyXG5cclxuXHJcblx0ZnJvbUVudHJpZXM8SyBleHRlbmRzIHN0cmluZyB8IG51bWJlciB8IHN5bWJvbCwgVj4oXHJcblx0XHRlbnRyaWVzOiByZWFkb25seSAocmVhZG9ubHkgW0ssIFZdKVtdXHJcblx0KTogeyBbayBpbiBLXTogViB9O1xyXG59XHJcbmludGVyZmFjZSBQcm9taXNlQ29uc3RydWN0b3Ige1xyXG5cdGVtcHR5OiB0eXBlb2YgUG9vcEpzLlByb21pc2VFeHRlbnNpb24uZW1wdHk7XHJcblx0ZnJhbWU6IHR5cGVvZiBQb29wSnMuUHJvbWlzZUV4dGVuc2lvbi5mcmFtZTtcclxuXHRyYWY6IHR5cGVvZiBQb29wSnMuUHJvbWlzZUV4dGVuc2lvbi5mcmFtZTtcclxufVxyXG5cclxuaW50ZXJmYWNlIEFycmF5PFQ+IHtcclxuXHR2c29ydDogdHlwZW9mIFBvb3BKcy5BcnJheUV4dGVuc2lvbi52c29ydDtcclxuXHQvLyBwbWFwOiB0eXBlb2YgUG9vcEpzLkFycmF5RXh0ZW5zaW9uLnBtYXA7XHJcblx0cG1hcDogdHlwZW9mIFBvb3BKcy5BcnJheUV4dGVuc2lvbi5QTWFwLnRoaXNfcG1hcDtcclxufVxyXG5pbnRlcmZhY2UgQXJyYXlDb25zdHJ1Y3RvciB7XHJcblx0bWFwOiB0eXBlb2YgUG9vcEpzLkFycmF5RXh0ZW5zaW9uLm1hcDtcclxufVxyXG5cclxuaW50ZXJmYWNlIERhdGVDb25zdHJ1Y3RvciB7XHJcblx0X25vdygpOiBudW1iZXI7XHJcbn1cclxuaW50ZXJmYWNlIERhdGUge1xyXG5cdF9nZXRUaW1lKCk6IG51bWJlcjtcclxufVxyXG5pbnRlcmZhY2UgUGVyZm9ybWFuY2Uge1xyXG5cdF9ub3c6IFBlcmZvcm1hbmNlWydub3cnXTtcclxufVxyXG5pbnRlcmZhY2UgV2luZG93IHtcclxuXHRfcmVxdWVzdEFuaW1hdGlvbkZyYW1lOiBXaW5kb3dbJ3JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgUmVzcG9uc2Uge1xyXG5cdGNhY2hlZEF0OiBudW1iZXI7XHJcbn1cclxuXHJcbi8vIGludGVyZmFjZSBDdXN0b21FdmVudDxUPiB7XHJcbi8vIFx0ZGV0YWlsPzogVDtcclxuLy8gfVxyXG5cclxuaW50ZXJmYWNlIEZ1bmN0aW9uIHtcclxuXHRiaW5kPFQsIFIsIEFSR1MgZXh0ZW5kcyBhbnlbXT4odGhpczogKHRoaXM6IFQsIC4uLmFyZ3M6IEFSR1MpID0+IFIsIHRoaXNBcmc6IFQpOiAoKC4uLmFyZ3M6IEFSR1MpID0+IFIpXHJcbn1cclxuXHJcbi8vIGZvcmNlIGFsbG93ICcnLnNwbGl0KCcuJykucG9wKCkhXHJcbmludGVyZmFjZSBTdHJpbmcge1xyXG5cdHNwbGl0KHNwbGl0dGVyOiBzdHJpbmcpOiBbc3RyaW5nLCAuLi5zdHJpbmdbXV07XHJcbn1cclxuaW50ZXJmYWNlIEFycmF5PFQ+IHtcclxuXHRwb3AoKTogdGhpcyBleHRlbmRzIFtULCAuLi5UW11dID8gVCA6IFQgfCB1bmRlZmluZWQ7XHJcblx0YXQoaW5kZXg6IG51bWJlcik6IFQ7XHJcblx0ZmluZExhc3Q8UyBleHRlbmRzIFQ+KHByZWRpY2F0ZTogKHRoaXM6IHZvaWQsIHZhbHVlOiBULCBpbmRleDogbnVtYmVyLCBvYmo6IFRbXSkgPT4gdmFsdWUgaXMgUywgdGhpc0FyZz86IGFueSk6IFMgfCB1bmRlZmluZWQ7XHJcblx0ZmluZExhc3QocHJlZGljYXRlOiAodmFsdWU6IFQsIGluZGV4OiBudW1iZXIsIG9iajogVFtdKSA9PiB1bmtub3duLCB0aGlzQXJnPzogYW55KTogVCB8IHVuZGVmaW5lZDtcclxufVxyXG5cclxuaW50ZXJmYWNlIE1hdGgge1xyXG5cdHNpZ24oeDogbnVtYmVyKTogLTEgfCAwIHwgMTtcclxufVxyXG4iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHRleHBvcnQgbmFtZXNwYWNlIEVudHJ5RmlsdGVyZXJFeHRlbnNpb24ge1xyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBGaWx0ZXJlckl0ZW08RGF0YT4ge1xyXG5cdFx0XHRpZDogc3RyaW5nID0gXCJcIjtcclxuXHRcdFx0bmFtZT86IHN0cmluZztcclxuXHRcdFx0ZGVzY3JpcHRpb24/OiBzdHJpbmc7XHJcblx0XHRcdHRocmVlV2F5OiBXYXluZXNzID0gZmFsc2U7XHJcblx0XHRcdG1vZGU6IE1vZGUgPSAnb2ZmJztcclxuXHRcdFx0cGFyZW50OiBFbnRyeUZpbHRlcmVyO1xyXG5cdFx0XHRidXR0b246IEhUTUxCdXR0b25FbGVtZW50O1xyXG5cdFx0XHRpbmNvbXBhdGlibGU/OiBzdHJpbmdbXTtcclxuXHRcdFx0aGlkZGVuID0gZmFsc2U7XHJcblxyXG5cdFx0XHRjb25zdHJ1Y3RvcihkYXRhOiBGaWx0ZXJlckl0ZW1Tb3VyY2UpIHtcclxuXHRcdFx0XHRkYXRhLmJ1dHRvbiA/Pz0gJ2J1dHRvbi5lZi1pdGVtJztcclxuXHRcdFx0XHRPYmplY3QuYXNzaWduKHRoaXMsIGRhdGEpO1xyXG5cclxuXHRcdFx0XHR0aGlzLmJ1dHRvbiA9IGVsbTwnYnV0dG9uJz4oZGF0YS5idXR0b24sXHJcblx0XHRcdFx0XHRjbGljayA9PiB0aGlzLmNsaWNrKGNsaWNrKSxcclxuXHRcdFx0XHRcdGNvbnRleHRtZW51ID0+IHRoaXMuY29udGV4dG1lbnUoY29udGV4dG1lbnUpLFxyXG5cdFx0XHRcdCk7XHJcblx0XHRcdFx0dGhpcy5wYXJlbnQuY29udGFpbmVyLmFwcGVuZCh0aGlzLmJ1dHRvbik7XHJcblx0XHRcdFx0aWYgKHRoaXMubmFtZSkge1xyXG5cdFx0XHRcdFx0dGhpcy5idXR0b24uYXBwZW5kKHRoaXMubmFtZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0aGlzLmRlc2NyaXB0aW9uKSB7XHJcblx0XHRcdFx0XHR0aGlzLmJ1dHRvbi50aXRsZSA9IHRoaXMuZGVzY3JpcHRpb247XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgIT0gJ29mZicpIHtcclxuXHRcdFx0XHRcdHRoaXMudG9nZ2xlTW9kZShkYXRhLm1vZGUsIHRydWUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodGhpcy5oaWRkZW4pIHtcclxuXHRcdFx0XHRcdHRoaXMuaGlkZSgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2xpY2soZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvZmYnKSB7XHJcblx0XHRcdFx0XHR0aGlzLnRvZ2dsZU1vZGUoJ29uJyk7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChldmVudC50YXJnZXQgIT0gdGhpcy5idXR0b24pIHJldHVybjtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvbicpIHtcclxuXHRcdFx0XHRcdHRoaXMudG9nZ2xlTW9kZSh0aGlzLnRocmVlV2F5ID8gJ29wcG9zaXRlJyA6ICdvZmYnKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhpcy50b2dnbGVNb2RlKCdvZmYnKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y29udGV4dG1lbnUoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgIT0gJ29wcG9zaXRlJykge1xyXG5cdFx0XHRcdFx0dGhpcy50b2dnbGVNb2RlKCdvcHBvc2l0ZScpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR0aGlzLnRvZ2dsZU1vZGUoJ29mZicpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dG9nZ2xlTW9kZShtb2RlOiBNb2RlLCBmb3JjZSA9IGZhbHNlKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSBtb2RlICYmICFmb3JjZSkgcmV0dXJuO1xyXG5cdFx0XHRcdHRoaXMubW9kZSA9IG1vZGU7XHJcblx0XHRcdFx0dGhpcy5idXR0b24uc2V0QXR0cmlidXRlKCdlZi1tb2RlJywgbW9kZSk7XHJcblx0XHRcdFx0aWYgKG1vZGUgIT0gJ29mZicgJiYgdGhpcy5pbmNvbXBhdGlibGUpIHtcclxuXHRcdFx0XHRcdHRoaXMucGFyZW50Lm9mZkluY29tcGF0aWJsZSh0aGlzLmluY29tcGF0aWJsZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMucGFyZW50LnJlcXVlc3RVcGRhdGUoKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmVtb3ZlKCkge1xyXG5cdFx0XHRcdHRoaXMuYnV0dG9uLnJlbW92ZSgpO1xyXG5cdFx0XHRcdHRoaXMudG9nZ2xlTW9kZSgnb2ZmJyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHNob3coKSB7XHJcblx0XHRcdFx0dGhpcy5oaWRkZW4gPSBmYWxzZTtcclxuXHRcdFx0XHR0aGlzLmJ1dHRvbi5oaWRkZW4gPSBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRoaWRlKCkge1xyXG5cdFx0XHRcdHRoaXMuaGlkZGVuID0gdHJ1ZTtcclxuXHRcdFx0XHR0aGlzLmJ1dHRvbi5oaWRkZW4gPSB0cnVlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHR9XHJcbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9GaWx0ZXJlckl0ZW0udHNcIiAvPlxyXG5cclxubmFtZXNwYWNlIFBvb3BKcyB7XHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFbnRyeUZpbHRlcmVyRXh0ZW5zaW9uIHtcclxuXHJcblx0XHRleHBvcnQgY2xhc3MgRmlsdGVyPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtPERhdGE+IGltcGxlbWVudHMgSUZpbHRlcjxEYXRhPiB7XHJcblx0XHRcdGRlY2xhcmUgZmlsdGVyOiBGaWx0ZXJGbjxEYXRhPjtcclxuXHJcblx0XHRcdGNvbnN0cnVjdG9yKGRhdGE6IEZpbHRlclNvdXJjZTxEYXRhPikge1xyXG5cdFx0XHRcdGRhdGEuYnV0dG9uID8/PSAnYnV0dG9uLmVmLWl0ZW0uZWYtZmlsdGVyW2VmLW1vZGU9XCJvZmZcIl0nO1xyXG5cdFx0XHRcdHN1cGVyKGRhdGEpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvKiogcmV0dXJucyBpZiBpdGVtIHNob3VsZCBiZSB2aXNpYmxlICovXHJcblx0XHRcdGFwcGx5KGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29mZicpIHJldHVybiB0cnVlO1xyXG5cdFx0XHRcdGxldCB2YWx1ZSA9IHRoaXMuZmlsdGVyKGRhdGEsIGVsLCB0aGlzLm1vZGUpO1xyXG5cdFx0XHRcdGxldCByZXN1bHQgPSB0eXBlb2YgdmFsdWUgPT0gXCJudW1iZXJcIiA/IHZhbHVlID4gMCA6IHZhbHVlO1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29uJykgcmV0dXJuIHJlc3VsdDtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvcHBvc2l0ZScpIHJldHVybiAhcmVzdWx0O1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGNsYXNzIFZhbHVlRmlsdGVyPERhdGEsIFYgZXh0ZW5kcyBzdHJpbmcgfCBudW1iZXI+IGV4dGVuZHMgRmlsdGVyZXJJdGVtPERhdGE+IGltcGxlbWVudHMgSUZpbHRlcjxEYXRhPiB7XHJcblx0XHRcdGRlY2xhcmUgZmlsdGVyOiBWYWx1ZUZpbHRlckZuPERhdGEsIFY+O1xyXG5cdFx0XHRpbnB1dDogSFRNTElucHV0RWxlbWVudDtcclxuXHRcdFx0bGFzdFZhbHVlOiBWO1xyXG5cclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogVmFsdWVGaWx0ZXJTb3VyY2U8RGF0YSwgVj4pIHtcclxuXHRcdFx0XHRkYXRhLmJ1dHRvbiA/Pz0gJ2J1dHRvbi5lZi1pdGVtLmVmLWZpbHRlcltlZi1tb2RlPVwib2ZmXCJdJztcclxuXHRcdFx0XHRzdXBlcihkYXRhKTtcclxuXHRcdFx0XHRsZXQgdHlwZSA9IHR5cGVvZiBkYXRhLmlucHV0ID09ICdudW1iZXInID8gJ251bWJlcicgOiAndGV4dCc7XHJcblx0XHRcdFx0bGV0IHZhbHVlID0gSlNPTi5zdHJpbmdpZnkoZGF0YS5pbnB1dCk7XHJcblx0XHRcdFx0bGV0IGlucHV0ID0gYGlucHV0W3R5cGU9JHt0eXBlfV1bdmFsdWU9JHt2YWx1ZX1dYDtcclxuXHRcdFx0XHR0aGlzLmlucHV0ID0gZWxtPCdpbnB1dCc+KGlucHV0LFxyXG5cdFx0XHRcdFx0aW5wdXQgPT4gdGhpcy5jaGFuZ2UoKSxcclxuXHRcdFx0XHQpLmFwcGVuZFRvKHRoaXMuYnV0dG9uKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2hhbmdlKCkge1xyXG5cdFx0XHRcdGxldCB2YWx1ZSA9IHRoaXMuZ2V0VmFsdWUoKTtcclxuXHRcdFx0XHRpZiAodGhpcy5sYXN0VmFsdWUgIT0gdmFsdWUpIHtcclxuXHRcdFx0XHRcdHRoaXMubGFzdFZhbHVlID0gdmFsdWU7XHJcblx0XHRcdFx0XHR0aGlzLnBhcmVudC5yZXF1ZXN0VXBkYXRlKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvKiogcmV0dXJucyBpZiBpdGVtIHNob3VsZCBiZSB2aXNpYmxlICovXHJcblx0XHRcdGFwcGx5KGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29mZicpIHJldHVybiB0cnVlO1xyXG5cdFx0XHRcdGxldCB2YWx1ZSA9IHRoaXMuZmlsdGVyKHRoaXMuZ2V0VmFsdWUoKSwgZGF0YSwgZWwpO1xyXG5cdFx0XHRcdGxldCByZXN1bHQgPSB0eXBlb2YgdmFsdWUgPT0gXCJudW1iZXJcIiA/IHZhbHVlID4gMCA6IHZhbHVlO1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29uJykgcmV0dXJuIHJlc3VsdDtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvcHBvc2l0ZScpIHJldHVybiAhcmVzdWx0O1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRnZXRWYWx1ZSgpOiBWIHtcclxuXHRcdFx0XHRsZXQgdmFsdWU6IFYgPSAodGhpcy5pbnB1dC50eXBlID09ICd0ZXh0JyA/IHRoaXMuaW5wdXQudmFsdWUgOiB0aGlzLmlucHV0LnZhbHVlQXNOdW1iZXIpIGFzIFY7XHJcblx0XHRcdFx0cmV0dXJuIHZhbHVlO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGNsYXNzIE1hdGNoRmlsdGVyPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtPERhdGE+IGltcGxlbWVudHMgSUZpbHRlcjxEYXRhPiB7XHJcblx0XHRcdGRlY2xhcmUgdmFsdWU6IChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpID0+IHN0cmluZztcclxuXHRcdFx0aW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQ7XHJcblx0XHRcdGxhc3RWYWx1ZTogc3RyaW5nO1xyXG5cdFx0XHRtYXRjaGVyOiAoaW5wdXQ6IHN0cmluZykgPT4gYm9vbGVhbjtcclxuXHJcblx0XHRcdGNvbnN0cnVjdG9yKGRhdGE6IE1hdGNoRmlsdGVyU291cmNlPERhdGE+KSB7XHJcblx0XHRcdFx0ZGF0YS5idXR0b24gPz89ICdidXR0b24uZWYtaXRlbS5lZi1maWx0ZXJbZWYtbW9kZT1cIm9mZlwiXSc7XHJcblx0XHRcdFx0ZGF0YS52YWx1ZSA/Pz0gZGF0YSA9PiBKU09OLnN0cmluZ2lmeShkYXRhKTtcclxuXHRcdFx0XHRzdXBlcihkYXRhKTtcclxuXHRcdFx0XHRsZXQgdmFsdWUgPSAhZGF0YS5pbnB1dCA/ICcnIDogSlNPTi5zdHJpbmdpZnkoZGF0YS5pbnB1dCk7XHJcblx0XHRcdFx0bGV0IGlucHV0ID0gYGlucHV0W3R5cGU9dGV4dH1dW3ZhbHVlPSR7dmFsdWV9XWA7XHJcblx0XHRcdFx0dGhpcy5pbnB1dCA9IGVsbTwnaW5wdXQnPihpbnB1dCxcclxuXHRcdFx0XHRcdGlucHV0ID0+IHRoaXMuY2hhbmdlKCksXHJcblx0XHRcdFx0KS5hcHBlbmRUbyh0aGlzLmJ1dHRvbik7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNoYW5nZSgpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5sYXN0VmFsdWUgIT0gdGhpcy5pbnB1dC52YWx1ZSkge1xyXG5cdFx0XHRcdFx0dGhpcy5sYXN0VmFsdWUgPSB0aGlzLmlucHV0LnZhbHVlO1xyXG5cdFx0XHRcdFx0dGhpcy5tYXRjaGVyID0gdGhpcy5nZW5lcmF0ZU1hdGNoZXIodGhpcy5sYXN0VmFsdWUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb2ZmJykgcmV0dXJuIHRydWU7XHJcblx0XHRcdFx0bGV0IHJlc3VsdCA9IHRoaXMubWF0Y2hlcih0aGlzLnZhbHVlKGRhdGEsIGVsKSk7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMubW9kZSA9PSAnb24nID8gcmVzdWx0IDogIXJlc3VsdDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gbWF0Y2hlckNhY2hlOiBNYXA8c3RyaW5nLCAoKGlucHV0OiBzdHJpbmcpID0+IGJvb2xlYW4pPiA9IG5ldyBNYXAoKTtcclxuXHRcdFx0Ly8gZ2V0TWF0Y2hlcihzb3VyY2U6IHN0cmluZyk6IChpbnB1dDogc3RyaW5nKSA9PiBib29sZWFuIHtcclxuXHRcdFx0Ly8gXHRpZiAodGhpcy5tYXRjaGVyQ2FjaGUuaGFzKHNvdXJjZSkpIHtcclxuXHRcdFx0Ly8gXHRcdHJldHVybiB0aGlzLm1hdGNoZXJDYWNoZS5nZXQoc291cmNlKTtcclxuXHRcdFx0Ly8gXHR9XHJcblx0XHRcdC8vIFx0bGV0IG1hdGNoZXIgPSB0aGlzLmdlbmVyYXRlTWF0Y2hlcihzb3VyY2UpO1xyXG5cdFx0XHQvLyBcdHRoaXMubWF0Y2hlckNhY2hlLnNldChzb3VyY2UsIG1hdGNoZXIpO1xyXG5cdFx0XHQvLyBcdHJldHVybiBtYXRjaGVyO1xyXG5cdFx0XHQvLyB9XHJcblx0XHRcdGdlbmVyYXRlTWF0Y2hlcihzb3VyY2U6IHN0cmluZyk6ICgoaW5wdXQ6IHN0cmluZykgPT4gYm9vbGVhbikge1xyXG5cdFx0XHRcdHNvdXJjZSA9IHNvdXJjZS50cmltKCk7XHJcblx0XHRcdFx0aWYgKHNvdXJjZS5sZW5ndGggPT0gMCkgcmV0dXJuICgpID0+IHRydWU7XHJcblx0XHRcdFx0aWYgKHNvdXJjZS5pbmNsdWRlcygnICcpKSB7XHJcblx0XHRcdFx0XHRsZXQgcGFydHMgPSBzb3VyY2Uuc3BsaXQoJyAnKS5tYXAoZSA9PiB0aGlzLmdlbmVyYXRlTWF0Y2hlcihlKSk7XHJcblx0XHRcdFx0XHRyZXR1cm4gKGlucHV0KSA9PiBwYXJ0cy5ldmVyeShtID0+IG0oaW5wdXQpKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHNvdXJjZS5zdGFydHNXaXRoKCctJykpIHtcclxuXHRcdFx0XHRcdGlmIChzb3VyY2UubGVuZ3RoIDwgMykgcmV0dXJuICgpID0+IHRydWU7XHJcblx0XHRcdFx0XHRsZXQgYmFzZSA9IHRoaXMuZ2VuZXJhdGVNYXRjaGVyKHNvdXJjZS5zbGljZSgxKSk7XHJcblx0XHRcdFx0XHRyZXR1cm4gKGlucHV0KSA9PiAhYmFzZShpbnB1dCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHRsZXQgZmxhZ3MgPSBzb3VyY2UudG9Mb3dlckNhc2UoKSA9PSBzb3VyY2UgPyAnaScgOiAnJztcclxuXHRcdFx0XHRcdGxldCByZWdleCA9IG5ldyBSZWdFeHAoc291cmNlLCBmbGFncyk7XHJcblx0XHRcdFx0XHRyZXR1cm4gKGlucHV0KSA9PiAhIWlucHV0Lm1hdGNoKHJlZ2V4KTtcclxuXHRcdFx0XHR9IGNhdGNoIChlKSB7IH07XHJcblx0XHRcdFx0cmV0dXJuIChpbnB1dCkgPT4gaW5wdXQuaW5jbHVkZXMoc291cmNlKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHR5cGUgVGFnR2V0dGVyRm48RGF0YT4gPSBzZWxlY3RvciB8ICgoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50LCBtb2RlOiBNb2RlKSA9PiAoSFRNTEVsZW1lbnRbXSB8IHN0cmluZ1tdKSk7XHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIFRhZ0ZpbHRlclNvdXJjZTxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbVNvdXJjZSB7XHJcblx0XHRcdHRhZ3M6IFRhZ0dldHRlckZuPERhdGE+O1xyXG5cdFx0XHRpbnB1dD86IHN0cmluZztcclxuXHRcdFx0aGlnaGlnaHRDbGFzcz86IHN0cmluZztcclxuXHRcdH1cclxuXHRcdHR5cGUgVGFnTWF0Y2hlciA9IHsgcG9zaXRpdmU6IGJvb2xlYW4sIG1hdGNoZXM6IChzOiBzdHJpbmcpID0+IGJvb2xlYW4gfTtcclxuXHJcblx0XHRleHBvcnQgY2xhc3MgVGFnRmlsdGVyPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtPERhdGE+IGltcGxlbWVudHMgSUZpbHRlcjxEYXRhPiB7XHJcblx0XHRcdHRhZ3M6IFRhZ0dldHRlckZuPERhdGE+O1xyXG5cdFx0XHRpbnB1dDogSFRNTElucHV0RWxlbWVudDtcclxuXHRcdFx0aGlnaGlnaHRDbGFzczogc3RyaW5nO1xyXG5cclxuXHRcdFx0bGFzdFZhbHVlOiBzdHJpbmcgPSAnJztcclxuXHRcdFx0Y2FjaGVkTWF0Y2hlcjogVGFnTWF0Y2hlcltdO1xyXG5cclxuXHJcblx0XHRcdGNvbnN0cnVjdG9yKGRhdGE6IFRhZ0ZpbHRlclNvdXJjZTxEYXRhPikge1xyXG5cdFx0XHRcdGRhdGEuYnV0dG9uID8/PSAnYnV0dG9uLmVmLWl0ZW0uZWYtZmlsdGVyW2VmLW1vZGU9XCJvZmZcIl0nO1xyXG5cdFx0XHRcdHN1cGVyKGRhdGEpO1xyXG5cdFx0XHRcdHRoaXMuaW5wdXQgPSBlbG08J2lucHV0Jz4oYGlucHV0W3R5cGU9dGV4dH1dYCxcclxuXHRcdFx0XHRcdGlucHV0ID0+IHRoaXMuY2hhbmdlKCksXHJcblx0XHRcdFx0KS5hcHBlbmRUbyh0aGlzLmJ1dHRvbik7XHJcblx0XHRcdFx0dGhpcy5pbnB1dC52YWx1ZSA9IGRhdGEuaW5wdXQgfHwgJyc7XHJcblx0XHRcdFx0dGhpcy50YWdzID0gZGF0YS50YWdzO1xyXG5cdFx0XHRcdHRoaXMuY2FjaGVkTWF0Y2hlciA9IFtdO1xyXG5cclxuXHRcdFx0XHR0aGlzLmhpZ2hpZ2h0Q2xhc3MgPSBkYXRhLmhpZ2hpZ2h0Q2xhc3MgPz8gJ2VmLXRhZy1oaWdobGlzaHQnO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRhcHBseShkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcclxuXHRcdFx0XHRsZXQgdGFncyA9IHRoaXMuZ2V0VGFncyhkYXRhLCBlbCk7XHJcblx0XHRcdFx0dGFncy5tYXAodGFnID0+IHRoaXMucmVzZXRIaWdobGlnaHQodGFnKSk7XHJcblxyXG5cdFx0XHRcdGxldCByZXN1bHRzID0gdGhpcy5jYWNoZWRNYXRjaGVyLm1hcChtID0+IHtcclxuXHRcdFx0XHRcdGxldCByID0geyBwb3NpdGl2ZTogbS5wb3NpdGl2ZSwgY291bnQ6IDAgfTtcclxuXHRcdFx0XHRcdGZvciAobGV0IHRhZyBvZiB0YWdzKSB7XHJcblx0XHRcdFx0XHRcdGxldCBzdHIgPSB0eXBlb2YgdGFnID09ICdzdHJpbmcnID8gdGFnIDogdGFnLmlubmVyVGV4dDtcclxuXHRcdFx0XHRcdFx0bGV0IHZhbCA9IG0ubWF0Y2hlcyhzdHIpO1xyXG5cdFx0XHRcdFx0XHRpZiAodmFsKSB7XHJcblx0XHRcdFx0XHRcdFx0ci5jb3VudCsrO1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuaGlnaGxpZ2h0VGFnKHRhZywgbS5wb3NpdGl2ZSk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHJldHVybiByO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHJldHVybiByZXN1bHRzLmV2ZXJ5KHIgPT4gci5wb3NpdGl2ZSA/IHIuY291bnQgPiAwIDogci5jb3VudCA9PSAwKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXNldEhpZ2hsaWdodCh0YWc6IHN0cmluZyB8IEhUTUxFbGVtZW50KSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiB0YWcgPT0gJ3N0cmluZycpIHJldHVybjtcclxuXHRcdFx0XHR0YWcuY2xhc3NMaXN0LnJlbW92ZSh0aGlzLmhpZ2hpZ2h0Q2xhc3MpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGhpZ2hsaWdodFRhZyh0YWc6IHN0cmluZyB8IEhUTUxFbGVtZW50LCBwb3NpdGl2ZTogYm9vbGVhbikge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgdGFnID09ICdzdHJpbmcnKSByZXR1cm47XHJcblx0XHRcdFx0Ly8gRklYTUVcclxuXHRcdFx0XHR0YWcuY2xhc3NMaXN0LmFkZCh0aGlzLmhpZ2hpZ2h0Q2xhc3MpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRnZXRUYWdzKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50W10gfCBzdHJpbmdbXSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiB0aGlzLnRhZ3MgPT0gJ3N0cmluZycpIHJldHVybiBlbC5xcTxIVE1MRWxlbWVudD4odGhpcy50YWdzKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy50YWdzKGRhdGEsIGVsLCB0aGlzLm1vZGUpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGdldFRhZ1N0cmluZ3MoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogc3RyaW5nW10ge1xyXG5cdFx0XHRcdGxldCB0YWdzID0gdGhpcy5nZXRUYWdzKGRhdGEsIGVsKTtcclxuXHRcdFx0XHRpZiAodHlwZW9mIHRhZ3NbMF0gPT0gJ3N0cmluZycpIHJldHVybiB0YWdzIGFzIHN0cmluZ1tdO1xyXG5cdFx0XHRcdHJldHVybiB0YWdzLm1hcCgoZSkgPT4gZS5pbm5lclRleHQpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjaGFuZ2UoKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMubGFzdFZhbHVlID09IHRoaXMuaW5wdXQudmFsdWUpIHJldHVybjtcclxuXHRcdFx0XHR0aGlzLmxhc3RWYWx1ZSA9IHRoaXMuaW5wdXQudmFsdWU7XHJcblx0XHRcdFx0dGhpcy5jYWNoZWRNYXRjaGVyID0gdGhpcy5wYXJzZU1hdGNoZXIodGhpcy5sYXN0VmFsdWUpO1xyXG5cdFx0XHRcdHRoaXMucGFyZW50LnJlcXVlc3RVcGRhdGUoKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cGFyc2VNYXRjaGVyKG1hdGNoZXI6IHN0cmluZyk6IFRhZ01hdGNoZXJbXSB7XHJcblx0XHRcdFx0bWF0Y2hlci50cmltKCk7XHJcblx0XHRcdFx0aWYgKCFtYXRjaGVyKSByZXR1cm4gW107XHJcblxyXG5cdFx0XHRcdGlmIChtYXRjaGVyLmluY2x1ZGVzKCcgJykpIHtcclxuXHRcdFx0XHRcdGxldCBwYXJ0cyA9IG1hdGNoZXIubWF0Y2goL1wiW15cIl0qXCJ8XFxTKy9nKSB8fCBbXTtcclxuXHRcdFx0XHRcdHJldHVybiBwYXJ0cy5mbGF0TWFwKGUgPT4gdGhpcy5wYXJzZU1hdGNoZXIoZSkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAobWF0Y2hlci5zdGFydHNXaXRoKCctJykpIHtcclxuXHRcdFx0XHRcdGxldCBwYXJ0cyA9IHRoaXMucGFyc2VNYXRjaGVyKG1hdGNoZXIuc2xpY2UoMSkpO1xyXG5cdFx0XHRcdFx0cmV0dXJuIHBhcnRzLm1hcChlID0+ICh7IHBvc2l0aXZlOiAhZS5wb3NpdGl2ZSwgbWF0Y2hlczogZS5tYXRjaGVzIH0pKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKG1hdGNoZXIubWF0Y2goL1wiXlteXCJdKlwiJC8pKSB7XHJcblx0XHRcdFx0XHRtYXRjaGVyID0gbWF0Y2hlci5zbGljZSgxLCAtMSk7XHJcblx0XHRcdFx0XHRyZXR1cm4gW3sgcG9zaXRpdmU6IHRydWUsIG1hdGNoZXM6IHRhZyA9PiB0YWcgPT0gbWF0Y2hlciB9XTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKG1hdGNoZXIubGVuZ3RoIDwgMykgcmV0dXJuIFtdO1xyXG5cdFx0XHRcdGlmIChtYXRjaGVyLm1hdGNoKC9cIi8pPy5sZW5ndGggPT0gMSkgcmV0dXJuIFtdO1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHRsZXQgZyA9IG5ldyBSZWdFeHAobWF0Y2hlciwgJ2knKTtcclxuXHRcdFx0XHRcdHJldHVybiBbeyBwb3NpdGl2ZTogdHJ1ZSwgbWF0Y2hlczogdGFnID0+ICEhdGFnLm1hdGNoKGcpIH1dO1xyXG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHsgfVxyXG5cdFx0XHRcdHJldHVybiBbeyBwb3NpdGl2ZTogdHJ1ZSwgbWF0Y2hlczogdGFnID0+IHRhZy5pbmNsdWRlcyhtYXRjaGVyKSB9XTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgY2xhc3MgUGFnaW5hdGlvbkluZm9GaWx0ZXI8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4gaW1wbGVtZW50cyBJRmlsdGVyPERhdGE+IHtcclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogRmlsdGVyZXJJdGVtU291cmNlKSB7XHJcblx0XHRcdFx0c3VwZXIoZGF0YSk7XHJcblx0XHRcdFx0dGhpcy5pbml0KCk7XHJcblx0XHRcdH1cclxuXHRcdFx0YXBwbHkoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH1cclxuXHRcdFx0UGFnaW5hdGUgPSBQb29wSnMuUGFnaW5hdGVFeHRlbnNpb24uUGFnaW5hdGU7XHJcblx0XHRcdGNvdW50UGFnaW5hdGUoKSB7XHJcblx0XHRcdFx0bGV0IGRhdGEgPSB7IHJ1bm5pbmc6IDAsIHF1ZXVlZDogMCwgfTtcclxuXHRcdFx0XHRmb3IgKGxldCBwIG9mIHRoaXMuUGFnaW5hdGUuaW5zdGFuY2VzKSB7XHJcblx0XHRcdFx0XHRkYXRhLnJ1bm5pbmcgKz0gK3AucnVubmluZztcclxuXHRcdFx0XHRcdGRhdGEucXVldWVkICs9IHAucXVldWVkO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gZGF0YTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dXBkYXRlSW5mbygpIHtcclxuXHRcdFx0XHRsZXQgZGF0YSA9IHRoaXMuY291bnRQYWdpbmF0ZSgpO1xyXG5cdFx0XHRcdGlmICghZGF0YS5ydW5uaW5nICYmICFkYXRhLnF1ZXVlZCkge1xyXG5cdFx0XHRcdFx0dGhpcy5oaWRkZW4gfHwgdGhpcy5oaWRlKCk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHRoaXMuaGlkZGVuICYmIHRoaXMuc2hvdygpO1xyXG5cdFx0XHRcdFx0bGV0IHRleHQgPSBgLi4uICske2RhdGEucnVubmluZyArIGRhdGEucXVldWVkfWA7XHJcblx0XHRcdFx0XHRpZiAodGhpcy5idXR0b24uaW5uZXJIVE1MICE9IHRleHQpIHtcclxuXHRcdFx0XHRcdFx0dGhpcy5idXR0b24uaW5uZXJUZXh0ID0gdGV4dDtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGFzeW5jIGluaXQoKSB7XHJcblx0XHRcdFx0d2hpbGUgKHRydWUpIHtcclxuXHRcdFx0XHRcdGF3YWl0IFByb21pc2UuZnJhbWUoKTtcclxuXHRcdFx0XHRcdHRoaXMudXBkYXRlSW5mbygpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHR9XHJcbn1cclxuIiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFbnRyeUZpbHRlcmVyRXh0ZW5zaW9uIHtcclxuXHJcblx0XHRleHBvcnQgY2xhc3MgTW9kaWZpZXI8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4gaW1wbGVtZW50cyBJTW9kaWZpZXI8RGF0YT4ge1xyXG5cdFx0XHRkZWNsYXJlIG1vZGlmaWVyOiBNb2RpZmllckZuPERhdGE+O1xyXG5cdFx0XHRkZWNsYXJlIHJ1bk9uTm9DaGFuZ2U/OiBib29sZWFuO1xyXG5cclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogTW9kaWZpZXJTb3VyY2U8RGF0YT4pIHtcclxuXHRcdFx0XHRkYXRhLmJ1dHRvbiA/Pz0gJ2J1dHRvbi5lZi1pdGVtLmVmLW1vZGlmaWVyW2VmLW1vZGU9XCJvZmZcIl0nO1xyXG5cdFx0XHRcdHN1cGVyKGRhdGEpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0b2dnbGVNb2RlKG1vZGU6IE1vZGUsIGZvcmNlID0gZmFsc2UpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09IG1vZGUgJiYgIWZvcmNlKSByZXR1cm47XHJcblx0XHRcdFx0dGhpcy5wYXJlbnQubW92ZVRvVG9wKHRoaXMpO1xyXG5cdFx0XHRcdHN1cGVyLnRvZ2dsZU1vZGUobW9kZSwgZm9yY2UpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRhcHBseShkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpIHtcclxuXHRcdFx0XHRsZXQgb2xkTW9kZTogTW9kZSB8IG51bGwgPSBlbC5nZXRBdHRyaWJ1dGUoYGVmLW1vZGlmaWVyLSR7dGhpcy5pZH0tbW9kZWApIGFzIChNb2RlIHwgbnVsbCk7XHJcblx0XHRcdFx0aWYgKG9sZE1vZGUgPT0gdGhpcy5tb2RlICYmICF0aGlzLnJ1bk9uTm9DaGFuZ2UpIHJldHVybjtcclxuXHRcdFx0XHR0aGlzLm1vZGlmaWVyKGRhdGEsIGVsLCB0aGlzLm1vZGUsIG51bGwpO1xyXG5cdFx0XHRcdGVsLnNldEF0dHJpYnV0ZShgZWYtbW9kaWZpZXItJHt0aGlzLmlkfS1tb2RlYCwgdGhpcy5tb2RlKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBQcmVmaXhlcjxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbTxEYXRhPiBpbXBsZW1lbnRzIElNb2RpZmllcjxEYXRhPiB7XHJcblx0XHRcdGRlY2xhcmUgdGFyZ2V0OiBzZWxlY3RvciB8ICgoZTogSFRNTEVsZW1lbnQsIGRhdGE6IERhdGEsIG1vZGU6IE1vZGUpID0+IChIVE1MRWxlbWVudCB8IEhUTUxFbGVtZW50W10pKTtcclxuXHRcdFx0ZGVjbGFyZSBwcmVmaXg/OiAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50LCBtb2RlOiBNb2RlKSA9PiBzdHJpbmc7XHJcblx0XHRcdGRlY2xhcmUgcG9zdGZpeD86IChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQsIG1vZGU6IE1vZGUpID0+IHN0cmluZztcclxuXHRcdFx0ZGVjbGFyZSBwcmVmaXhBdHRyaWJ1dGU6IHN0cmluZztcclxuXHRcdFx0ZGVjbGFyZSBwb3N0Zml4QXR0cmlidXRlOiBzdHJpbmc7XHJcblx0XHRcdGRlY2xhcmUgYWxsOiBib29sZWFuO1xyXG5cclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogUHJlZml4ZXJTb3VyY2U8RGF0YT4pIHtcclxuXHRcdFx0XHRkYXRhLmJ1dHRvbiA/Pz0gJ2J1dHRvbi5lZi1pdGVtLmVmLW1vZGlmaWVyW2VmLW1vZGU9XCJvZmZcIl0nO1xyXG5cdFx0XHRcdGRhdGEudGFyZ2V0ID8/PSBlID0+IGU7XHJcblx0XHRcdFx0ZGF0YS5wcmVmaXhBdHRyaWJ1dGUgPz89ICdlZi1wcmVmaXgnO1xyXG5cdFx0XHRcdGRhdGEucG9zdGZpeEF0dHJpYnV0ZSA/Pz0gJ2VmLXBvc3RmaXgnO1xyXG5cdFx0XHRcdGRhdGEuYWxsID8/PSBmYWxzZTtcclxuXHRcdFx0XHRzdXBlcihkYXRhKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KSB7XHJcblx0XHRcdFx0bGV0IHRhcmdldHMgPSB0aGlzLmdldFRhcmdldHMoZWwsIGRhdGEpO1xyXG5cdFx0XHRcdGlmICh0aGlzLnByZWZpeCkge1xyXG5cdFx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb2ZmJykge1xyXG5cdFx0XHRcdFx0XHR0YXJnZXRzLm1hcChlID0+IGUucmVtb3ZlQXR0cmlidXRlKHRoaXMucHJlZml4QXR0cmlidXRlKSk7XHJcblx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRsZXQgdmFsdWUgPSB0aGlzLnByZWZpeChkYXRhLCBlbCwgdGhpcy5tb2RlKTtcclxuXHRcdFx0XHRcdFx0dGFyZ2V0cy5tYXAoZSA9PiBlLnNldEF0dHJpYnV0ZSh0aGlzLnByZWZpeEF0dHJpYnV0ZSwgdmFsdWUpKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMucG9zdGZpeCkge1xyXG5cdFx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb2ZmJykge1xyXG5cdFx0XHRcdFx0XHR0YXJnZXRzLm1hcChlID0+IGUucmVtb3ZlQXR0cmlidXRlKHRoaXMucG9zdGZpeEF0dHJpYnV0ZSkpO1xyXG5cdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0bGV0IHZhbHVlID0gdGhpcy5wb3N0Zml4KGRhdGEsIGVsLCB0aGlzLm1vZGUpO1xyXG5cdFx0XHRcdFx0XHR0YXJnZXRzLm1hcChlID0+IGUuc2V0QXR0cmlidXRlKHRoaXMucG9zdGZpeEF0dHJpYnV0ZSwgdmFsdWUpKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGdldFRhcmdldHMoZWw6IEhUTUxFbGVtZW50LCBkYXRhOiBEYXRhKTogSFRNTEVsZW1lbnRbXSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiB0aGlzLnRhcmdldCA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0aWYgKHRoaXMuYWxsKSByZXR1cm4gZWwucXEodGhpcy50YXJnZXQpO1xyXG5cdFx0XHRcdFx0cmV0dXJuIFtlbC5xKHRoaXMudGFyZ2V0KV07XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGxldCB0YXJnZXRzID0gdGhpcy50YXJnZXQoZWwsIGRhdGEsIHRoaXMubW9kZSk7XHJcblx0XHRcdFx0XHRyZXR1cm4gQXJyYXkuaXNBcnJheSh0YXJnZXRzKSA/IHRhcmdldHMgOiBbdGFyZ2V0c107XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdH1cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cdGV4cG9ydCBuYW1lc3BhY2UgRW50cnlGaWx0ZXJlckV4dGVuc2lvbiB7XHJcblxyXG5cdFx0ZXhwb3J0IGNsYXNzIFNvcnRlcjxEYXRhLCBWIGV4dGVuZHMgbnVtYmVyIHwgc3RyaW5nPiBleHRlbmRzIEZpbHRlcmVySXRlbTxEYXRhPiBpbXBsZW1lbnRzIElTb3J0ZXI8RGF0YT4ge1xyXG5cdFx0XHRkZWNsYXJlIHNvcnRlcjogU29ydGVyRm48RGF0YSwgVj47XHJcblx0XHRcdGRlY2xhcmUgY29tcGFyYXRvcjogKGE6IFYsIGI6IFYpID0+IG51bWJlcjtcclxuXHJcblx0XHRcdGNvbnN0cnVjdG9yKGRhdGE6IFNvcnRlclNvdXJjZTxEYXRhLCBWPikge1xyXG5cdFx0XHRcdGRhdGEuYnV0dG9uID8/PSAnYnV0dG9uLmVmLWl0ZW0uZWYtc29ydGVyW2VmLW1vZGU9XCJvZmZcIl0nO1xyXG5cdFx0XHRcdGRhdGEuY29tcGFyYXRvciA/Pz0gKGE6IFYsIGI6IFYpID0+IGEgPiBiID8gMSA6IGEgPCBiID8gLTEgOiAwO1xyXG5cdFx0XHRcdHN1cGVyKGRhdGEpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0b2dnbGVNb2RlKG1vZGU6IE1vZGUsIGZvcmNlID0gZmFsc2UpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09IG1vZGUgJiYgIWZvcmNlKSByZXR1cm47XHJcblx0XHRcdFx0dGhpcy5wYXJlbnQubW92ZVRvVG9wKHRoaXMpO1xyXG5cdFx0XHRcdHN1cGVyLnRvZ2dsZU1vZGUobW9kZSwgZm9yY2UpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRzb3J0KGxpc3Q6IFtEYXRhLCBIVE1MRWxlbWVudF1bXSk6IFtEYXRhLCBIVE1MRWxlbWVudF1bXSB7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb2ZmJykgcmV0dXJuIGxpc3Q7XHJcblx0XHRcdFx0cmV0dXJuIGxpc3QudnNvcnQoKFtkYXRhLCBlbF06IFtEYXRhLCBIVE1MRWxlbWVudF0pID0+IHRoaXMuYXBwbHkoZGF0YSwgZWwpLCAoYTogViwgYjogVikgPT4gdGhpcy5jb21wYXJlKGEsIGIpKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0LyoqIHJldHVybnMgb3JkZXIgb2YgZW50cnkgKi9cclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogViB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuc29ydGVyKGRhdGEsIGVsLCB0aGlzLm1vZGUpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjb21wYXJlKGE6IFYsIGI6IFYpOiBudW1iZXIge1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29uJykge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuY29tcGFyYXRvcihhLCBiKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb3Bwb3NpdGUnKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5jb21wYXJhdG9yKGIsIGEpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gMDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHR9XHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFbnRyeUZpbHRlcmVyRXh0ZW5zaW9uIHtcclxuXHRcdGV4cG9ydCB0eXBlIFdheW5lc3MgPSBmYWxzZSB8IHRydWUgfCAnZGlyJztcclxuXHRcdGV4cG9ydCB0eXBlIE1vZGUgPSAnb2ZmJyB8ICdvbicgfCAnb3Bwb3NpdGUnO1xyXG5cclxuXHRcdGV4cG9ydCB0eXBlIFBhcnNlckZuPERhdGE+ID0gKGVsOiBIVE1MRWxlbWVudCwgZGF0YTogUGFydGlhbDxEYXRhPikgPT4gUGFydGlhbDxEYXRhPiB8IHZvaWQgfCBQcm9taXNlTGlrZTxQYXJ0aWFsPERhdGEgfCB2b2lkPj47XHJcblx0XHRleHBvcnQgdHlwZSBGaWx0ZXJGbjxEYXRhPiA9IChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQsIG1vZGU6IE1vZGUpID0+IGJvb2xlYW47XHJcblx0XHRleHBvcnQgdHlwZSBTb3J0ZXJGbjxEYXRhLCBWPiA9IChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQsIG1vZGU6IE1vZGUpID0+IFY7XHJcblx0XHRleHBvcnQgdHlwZSBNb2RpZmllckZuPERhdGE+ID0gKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCwgbW9kZTogTW9kZSwgb2xkTW9kZTogTW9kZSB8IG51bGwpID0+IHZvaWQ7XHJcblx0XHRleHBvcnQgdHlwZSBWYWx1ZUZpbHRlckZuPERhdGEsIFY+ID0gKHZhbHVlOiBWLCBkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpID0+IGJvb2xlYW47XHJcblx0XHRleHBvcnQgdHlwZSBQcmVmaXhlckZuPERhdGE+ID0gKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCwgbW9kZTogTW9kZSkgPT4gc3RyaW5nO1xyXG5cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgSUZpbHRlcjxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbTxEYXRhPiB7XHJcblx0XHRcdGFwcGx5KGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCk6IGJvb2xlYW47XHJcblx0XHR9XHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIElTb3J0ZXI8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4ge1xyXG5cdFx0XHRzb3J0KGxpc3Q6IFtEYXRhLCBIVE1MRWxlbWVudF1bXSk6IFtEYXRhLCBIVE1MRWxlbWVudF1bXTtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgSU1vZGlmaWVyPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtPERhdGE+IHtcclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogdm9pZDtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIEZpbHRlcmVySXRlbVNvdXJjZSB7XHJcblx0XHRcdGJ1dHRvbj86IHNlbGVjdG9yO1xyXG5cdFx0XHRpZDogc3RyaW5nO1xyXG5cdFx0XHRuYW1lPzogc3RyaW5nO1xyXG5cdFx0XHRkZXNjcmlwdGlvbj86IHN0cmluZztcclxuXHRcdFx0dGhyZWVXYXk/OiBXYXluZXNzO1xyXG5cdFx0XHRtb2RlPzogTW9kZTtcclxuXHRcdFx0cGFyZW50OiBFbnRyeUZpbHRlcmVyO1xyXG5cdFx0XHRpbmNvbXBhdGlibGU/OiBzdHJpbmdbXTtcclxuXHRcdFx0aGlkZGVuPzogYm9vbGVhbjtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgRmlsdGVyU291cmNlPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtU291cmNlIHtcclxuXHRcdFx0ZmlsdGVyOiBGaWx0ZXJGbjxEYXRhPjtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgVmFsdWVGaWx0ZXJTb3VyY2U8RGF0YSwgVj4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW1Tb3VyY2Uge1xyXG5cdFx0XHRmaWx0ZXI6IFZhbHVlRmlsdGVyRm48RGF0YSwgVj47XHJcblx0XHRcdGlucHV0OiBWO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBNYXRjaEZpbHRlclNvdXJjZTxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbVNvdXJjZSB7XHJcblx0XHRcdHZhbHVlPzogKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCkgPT4gc3RyaW5nO1xyXG5cdFx0XHRpbnB1dD86IHN0cmluZztcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgU29ydGVyU291cmNlPERhdGEsIFY+IGV4dGVuZHMgRmlsdGVyZXJJdGVtU291cmNlIHtcclxuXHRcdFx0c29ydGVyOiBTb3J0ZXJGbjxEYXRhLCBWPjtcclxuXHRcdFx0Y29tcGFyYXRvcj86ICgoYTogViwgYjogVikgPT4gbnVtYmVyKSB8IFY7XHJcblx0XHR9XHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIE1vZGlmaWVyU291cmNlPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtU291cmNlIHtcclxuXHRcdFx0bW9kaWZpZXI6IE1vZGlmaWVyRm48RGF0YT47XHJcblx0XHR9XHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIFByZWZpeGVyU291cmNlPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtU291cmNlIHtcclxuXHRcdFx0dGFyZ2V0Pzogc2VsZWN0b3IgfCAoKGVsOiBIVE1MRWxlbWVudCwgZGF0YTogRGF0YSwgbW9kZTogTW9kZSkgPT4gSFRNTEVsZW1lbnQpO1xyXG5cdFx0XHRwcmVmaXg/OiAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KSA9PiBzdHJpbmc7XHJcblx0XHRcdHBvc3RmaXg/OiAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KSA9PiBzdHJpbmc7XHJcblx0XHRcdHByZWZpeEF0dHJpYnV0ZT86IHN0cmluZztcclxuXHRcdFx0cG9zdGZpeEF0dHJpYnV0ZT86IHN0cmluZztcclxuXHRcdFx0YWxsPzogYm9vbGVhbjtcclxuXHRcdH1cclxuXHJcblx0XHRcclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgRmlsdGVyZXJJdGVtUGFydGlhbCB7XHJcblx0XHRcdGJ1dHRvbj86IHNlbGVjdG9yO1xyXG5cdFx0XHRpZD86IHN0cmluZztcclxuXHRcdFx0bmFtZT86IHN0cmluZztcclxuXHRcdFx0ZGVzY3JpcHRpb24/OiBzdHJpbmc7XHJcblx0XHRcdHRocmVlV2F5PzogV2F5bmVzcztcclxuXHRcdFx0bW9kZT86IE1vZGU7XHJcblx0XHRcdGluY29tcGF0aWJsZT86IHN0cmluZ1tdO1xyXG5cdFx0XHRoaWRkZW4/OiBib29sZWFuO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBGaWx0ZXJQYXJ0aWFsPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtUGFydGlhbCB7IH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgVmFsdWVGaWx0ZXJQYXJ0aWFsPERhdGEsIFY+IGV4dGVuZHMgRmlsdGVyZXJJdGVtUGFydGlhbCB7XHJcblx0XHRcdGlucHV0OiBWO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBTb3J0ZXJQYXJ0aWFsU291cmNlPERhdGEsIFY+IGV4dGVuZHMgRmlsdGVyZXJJdGVtUGFydGlhbCB7XHJcblx0XHRcdGNvbXBhcmF0b3I/OiAoKGE6IFYsIGI6IFYpID0+IG51bWJlcikgfCBWO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBNb2RpZmllclBhcnRpYWw8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW1QYXJ0aWFsIHsgfVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBQcmVmaXhlclBhcnRpYWw8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW1QYXJ0aWFsIHtcclxuXHRcdFx0dGFyZ2V0Pzogc2VsZWN0b3IgfCAoKGVsOiBIVE1MRWxlbWVudCwgZGF0YTogRGF0YSwgbW9kZTogTW9kZSkgPT4gSFRNTEVsZW1lbnQpO1xyXG5cdFx0XHRwcmVmaXg/OiAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KSA9PiBzdHJpbmc7XHJcblx0XHRcdHBvc3RmaXg/OiAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KSA9PiBzdHJpbmc7XHJcblx0XHRcdHByZWZpeEF0dHJpYnV0ZT86IHN0cmluZztcclxuXHRcdFx0cG9zdGZpeEF0dHJpYnV0ZT86IHN0cmluZztcclxuXHRcdFx0YWxsPzogYm9vbGVhbjtcclxuXHRcdH1cclxuXHJcblx0XHR0eXBlIFVuaW9uPFNvdXJjZSwgUmVzdWx0PiA9IHtcclxuXHRcdFx0W1AgaW4ga2V5b2YgU291cmNlICYga2V5b2YgUmVzdWx0XTogU291cmNlW1BdIHwgUmVzdWx0W1BdO1xyXG5cdFx0fSAmIE9taXQ8U291cmNlLCBrZXlvZiBSZXN1bHQ+ICYgT21pdDxSZXN1bHQsIGtleW9mIFNvdXJjZT47XHJcblxyXG5cdFx0dHlwZSBPdmVycmlkZTxULCBPPiA9IE9taXQ8VCwga2V5b2YgTz4gJiBPO1xyXG5cclxuXHRcdHR5cGUgRUZTb3VyY2U8VCBleHRlbmRzIHsgc291cmNlOiBhbnkgfT4gPSBPdmVycmlkZTxPdmVycmlkZTxQYXJ0aWFsPFQ+LCBUWydzb3VyY2UnXT4sIHsgYnV0dG9uPzogc2VsZWN0b3IgfT47XHJcblxyXG5cdFx0dHlwZSBTb3VyY2U8VCBleHRlbmRzIHsgc291cmNlOiBhbnkgfT4gPSBUWydzb3VyY2UnXSAmIHtcclxuXHRcdFx0aWQ/OiBzdHJpbmc7IG5hbWU/OiBzdHJpbmc7IGRlc2NyaXB0aW9uPzogc3RyaW5nO1xyXG5cdFx0XHR0aHJlZVdheT86IFdheW5lc3M7IG1vZGU/OiBNb2RlOyBpbmNvbXBhdGlibGU/OiBzdHJpbmdbXTsgaGlkZGVuPzogYm9vbGVhbjtcclxuXHRcdH07XHJcblxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogY2FuIGJlIGVpdGhlciBNYXAgb3IgV2Vha01hcFxyXG5cdFx0ICogKFdlYWtNYXAgaXMgbGlrZWx5IHRvIGJlIHVzZWxlc3MgaWYgdGhlcmUgYXJlIGxlc3MgdGhlbiAxMGsgb2xkIG5vZGVzIGluIG1hcClcclxuXHRcdCAqL1xyXG5cdFx0bGV0IE1hcFR5cGUgPSBNYXA7XHJcblx0XHR0eXBlIE1hcFR5cGU8SyBleHRlbmRzIG9iamVjdCwgVj4gPS8vIE1hcDxLLCBWPiB8IFxyXG5cdFx0XHRXZWFrTWFwPEssIFY+O1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGxldCBFRiA9IEVudHJ5RmlsdGVyZXJFeHRlbnNpb24uRW50cnlGaWx0ZXJlcjtcclxufSIsIlxyXG5cclxubmFtZXNwYWNlIFBvb3BKcyB7XHJcblxyXG5cclxuXHRleHBvcnQgY2xhc3MgU2Nyb2xsSW5mbyB7XHJcblx0XHRlbDogSFRNTEVsZW1lbnQ7XHJcblx0XHQvKiogYWJzb2x1dGUgcmVjdCAqL1xyXG5cdFx0cmVjdDogRE9NUmVjdDtcclxuXHJcblx0XHRjb25zdHJ1Y3RvcihlbDogSFRNTEVsZW1lbnQpIHtcclxuXHRcdFx0dGhpcy5lbCA9IGVsO1xyXG5cdFx0XHRsZXQgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG5cdFx0XHRmdW5jdGlvbiBuKHY6IG51bWJlcikgeyByZXR1cm4gK3YudG9GaXhlZCgzKTsgfVxyXG5cdFx0XHR0aGlzLnJlY3QgPSBuZXcgRE9NUmVjdChcclxuXHRcdFx0XHRuKHJlY3QueCAvIGlubmVyV2lkdGgpLCBuKChyZWN0LnkgKyBzY3JvbGxZKSAvIGlubmVySGVpZ2h0KSxcclxuXHRcdFx0XHRuKHJlY3Qud2lkdGggLyBpbm5lcldpZHRoKSwgbihyZWN0LmhlaWdodCAvIGlubmVySGVpZ2h0KSk7XHJcblx0XHR9XHJcblx0XHR0b3BPZmZzZXQoc2Nyb2xsWSA9IHdpbmRvdy5zY3JvbGxZKSB7XHJcblx0XHRcdGxldCB3aW5kb3dZID0gc2Nyb2xsWSAvIGlubmVySGVpZ2h0O1xyXG5cdFx0XHRsZXQgb2Zmc2V0ID0gdGhpcy5yZWN0LnRvcCAtIHdpbmRvd1k7XHJcblx0XHRcdHJldHVybiArb2Zmc2V0LnRvRml4ZWQoMyk7XHJcblx0XHR9XHJcblx0XHRjZW50ZXJPZmZzZXQoc2Nyb2xsWSA9IHdpbmRvdy5zY3JvbGxZKSB7XHJcblx0XHRcdGxldCB3aW5kb3dZID0gc2Nyb2xsWSAvIGlubmVySGVpZ2h0ICsgMC41O1xyXG5cdFx0XHRsZXQgb2Zmc2V0ID0gdGhpcy5yZWN0LnRvcCArIHRoaXMucmVjdC5oZWlnaHQgLyAyIC0gd2luZG93WTtcclxuXHRcdFx0cmV0dXJuICtvZmZzZXQudG9GaXhlZCgzKTtcclxuXHRcdH1cclxuXHRcdGJvdHRvbU9mZnNldChzY3JvbGxZID0gd2luZG93LnNjcm9sbFkpIHtcclxuXHRcdFx0bGV0IHdpbmRvd1kgPSBzY3JvbGxZIC8gaW5uZXJIZWlnaHQgKyAxO1xyXG5cdFx0XHRsZXQgb2Zmc2V0ID0gdGhpcy5yZWN0LmJvdHRvbSAtIHdpbmRvd1k7XHJcblx0XHRcdHJldHVybiArb2Zmc2V0LnRvRml4ZWQoMyk7XHJcblx0XHR9XHJcblx0XHRkaXN0YW5jZUZyb21TY3JlZW4oc2Nyb2xsWSA9IHdpbmRvdy5zY3JvbGxZKSB7XHJcblx0XHRcdGxldCB3aW5kb3dZID0gc2Nyb2xsWSAvIGlubmVySGVpZ2h0O1xyXG5cdFx0XHRpZiAodGhpcy5yZWN0LmJvdHRvbSA8IHdpbmRvd1kgLSAwLjAwMDEpIHJldHVybiB0aGlzLnJlY3QuYm90dG9tIC0gd2luZG93WTtcclxuXHRcdFx0aWYgKHRoaXMucmVjdC50b3AgPiB3aW5kb3dZICsgMS4wMDEpIHJldHVybiB0aGlzLnJlY3QudG9wIC0gd2luZG93WSAtIDE7XHJcblx0XHR9XHJcblxyXG5cdFx0Z2V0IGZ1bGxEaXIoKSB7XHJcblx0XHRcdGlmICh0aGlzLnRvcE9mZnNldCgpIDwgLTAuMDAxKVxyXG5cdFx0XHRcdHJldHVybiAtMTtcclxuXHRcdFx0aWYgKHRoaXMuYm90dG9tT2Zmc2V0KCkgPiAwLjAwMSlcclxuXHRcdFx0XHRyZXR1cm4gMTtcclxuXHRcdFx0cmV0dXJuIDA7XHJcblx0XHR9XHJcblx0XHRnZXQgX29mZnNldHMoKSB7XHJcblx0XHRcdHJldHVybiBbdGhpcy50b3BPZmZzZXQoKSwgdGhpcy5jZW50ZXJPZmZzZXQoKSwgdGhpcy5ib3R0b21PZmZzZXQoKV07XHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGNsYXNzIEltYWdlU2Nyb2xsZXIge1xyXG5cdFx0c2VsZWN0b3IgPSAnaW1nJztcclxuXHJcblx0XHRlbmFibGVkID0gZmFsc2U7XHJcblx0XHRkaXNhYmxlV2hlZWwgPSBmYWxzZTtcclxuXHRcdGxpc3RlbmVyPzogYW55O1xyXG5cclxuXHRcdHN0b3BQcm9wYWdhdGlvbiA9IGZhbHNlO1xyXG5cclxuXHRcdGNvbnN0cnVjdG9yKHNlbGVjdG9yID0gJycpIHtcclxuXHRcdFx0aWYgKHNlbGVjdG9yKSB0aGlzLnNlbGVjdG9yID0gc2VsZWN0b3I7XHJcblx0XHR9XHJcblxyXG5cdFx0X3doZWVsTGlzdGVuZXI/OiAoZXZlbnQ6IFdoZWVsRXZlbnQpID0+IHZvaWQ7XHJcblx0XHRvbldoZWVsU2Nyb2xsRmFpbGVkPzogKGV2ZW50OiBXaGVlbEV2ZW50KSA9PiB2b2lkO1xyXG5cdFx0YmluZFdoZWVsKCkge1xyXG5cdFx0XHRpZiAodGhpcy5fd2hlZWxMaXN0ZW5lcikgcmV0dXJuO1xyXG5cdFx0XHRsZXQgbCA9IHRoaXMuX3doZWVsTGlzdGVuZXIgPSAoZXZlbnQpID0+IHtcclxuXHRcdFx0XHRpZiAodGhpcy5fd2hlZWxMaXN0ZW5lciAhPSBsKSByZXR1cm4gcmVtb3ZlRXZlbnRMaXN0ZW5lcignd2hlZWwnLCBsKTtcclxuXHRcdFx0XHRpZiAoIXRoaXMuZW5hYmxlZCkgcmV0dXJuO1xyXG5cdFx0XHRcdGlmICghZXZlbnQuZGVsdGFZKSByZXR1cm47XHJcblx0XHRcdFx0aWYgKGV2ZW50LnNoaWZ0S2V5IHx8IGV2ZW50LmN0cmxLZXkpIHJldHVybjtcclxuXHRcdFx0XHRpZiAodGhpcy5zY3JvbGwoTWF0aC5zaWduKGV2ZW50LmRlbHRhWSkpKSB7XHJcblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdFx0dGhpcy5zdG9wUHJvcGFnYXRpb24gJiYgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHRoaXMub25XaGVlbFNjcm9sbEZhaWxlZD8uKGV2ZW50KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0YWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLl93aGVlbExpc3RlbmVyLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0fVxyXG5cdFx0X2Fycm93TGlzdGVuZXI/OiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHZvaWQ7XHJcblx0XHRiaW5kQXJyb3dzKCkge1xyXG5cdFx0XHRpZiAodGhpcy5fYXJyb3dMaXN0ZW5lcikgcmV0dXJuO1xyXG5cdFx0XHR0aGlzLl9hcnJvd0xpc3RlbmVyID0gKGV2ZW50KSA9PiB7XHJcblx0XHRcdFx0aWYgKCF0aGlzLmVuYWJsZWQpIHJldHVybjtcclxuXHRcdFx0XHRpZiAoZXZlbnQuY29kZSA9PSAnQXJyb3dMZWZ0Jykge1xyXG5cdFx0XHRcdFx0aWYgKHRoaXMuc2Nyb2xsKC0xKSkge1xyXG5cdFx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdFx0XHR0aGlzLnN0b3BQcm9wYWdhdGlvbiAmJiBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGV2ZW50LmNvZGUgPT0gJ0Fycm93UmlnaHQnKSB7XHJcblx0XHRcdFx0XHRpZiAodGhpcy5zY3JvbGwoMSkpIHtcclxuXHRcdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHRcdFx0dGhpcy5zdG9wUHJvcGFnYXRpb24gJiYgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0fVxyXG5cdFx0XHRhZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fYXJyb3dMaXN0ZW5lciwgeyBjYXB0dXJlOiB0cnVlIH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8qKiBlbmFibGUgdGhpcyBzY3JvbGxlciAqL1xyXG5cdFx0b24oc2VsZWN0b3IgPSAnJyk6IHRoaXMge1xyXG5cdFx0XHRpZiAoc2VsZWN0b3IpIHRoaXMuc2VsZWN0b3IgPSBzZWxlY3RvcjtcclxuXHRcdFx0dGhpcy5lbmFibGVkID0gdHJ1ZTtcclxuXHRcdFx0dGhpcy5iaW5kQXJyb3dzKCk7XHJcblx0XHRcdHRoaXMuYmluZFdoZWVsKCk7XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8qKiBkaXNhYmxlIHRoaXMgc2Nyb2xsZXIgKi9cclxuXHRcdG9mZihzZWxlY3RvciA9ICcnKTogdGhpcyB7XHJcblx0XHRcdGlmIChzZWxlY3RvcikgdGhpcy5zZWxlY3RvciA9IHNlbGVjdG9yO1xyXG5cdFx0XHR0aGlzLmVuYWJsZWQgPSBmYWxzZTtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9XHJcblxyXG5cdFx0bW9kZTogJ3NpbmdsZScgfCAnZ3JvdXAnID0gJ2dyb3VwJztcclxuXHJcblx0XHQvKiogc2Nyb2xsIHRvIHRoZSBuZXh0IGl0ZW0gKi9cclxuXHRcdHNjcm9sbChkaXI6IC0xIHwgMCB8IDEpOiBib29sZWFuIHtcclxuXHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnZ3JvdXAnKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuc2Nyb2xsVG9OZXh0R3JvdXAoZGlyKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAodGhpcy5tb2RlID09ICdzaW5nbGUnKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuc2Nyb2xsVG9OZXh0Q2VudGVyKGRpcik7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblxyXG5cdFx0c2Nyb2xsVG9OZXh0Q2VudGVyKGRpcjogLTEgfCAwIHwgMSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRsZXQgbmV4dCA9IHRoaXMuX25leHRTY3JvbGxUYXJnZXQoZGlyLCAnc2luZ2xlJyk7XHJcblx0XHRcdGlmIChQb29wSnMuZGVidWcpIHsgY29uc29sZS5sb2coYHNjcm9sbDogYCwgbmV4dCk7IH1cclxuXHRcdFx0aWYgKCFuZXh0KSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdG5leHQuZWwuc2Nyb2xsSW50b1ZpZXcoeyBibG9jazogJ2NlbnRlcicgfSk7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdHNjcm9sbFRvTmV4dEdyb3VwKGRpcjogLTEgfCAwIHwgMSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRsZXQgbmV4dCA9IHRoaXMuX25leHRTY3JvbGxUYXJnZXQoZGlyLCAnZ3JvdXAnKTtcclxuXHRcdFx0aWYgKFBvb3BKcy5kZWJ1ZykgeyBjb25zb2xlLmxvZyhgc2Nyb2xsOiBgLCBuZXh0KTsgfVxyXG5cdFx0XHRpZiAoIW5leHQgfHwgIW5leHQubGVuZ3RoKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdGxldCB5ID0gKG5leHRbMF0ucmVjdC50b3AgKyBuZXh0LmF0KC0xKS5yZWN0LmJvdHRvbSAtIDEpIC8gMjtcclxuXHRcdFx0Ly8gZml4bWVcclxuXHRcdFx0aWYgKE1hdGguYWJzKHNjcm9sbFkgLyBpbm5lckhlaWdodCAtIHkpID4gMC43NTApIHtcclxuXHRcdFx0XHRpZiAoIXRoaXMuZ2V0QWxsU2Nyb2xscygpLmZpbmQoZSA9PiBlLmZ1bGxEaXIgPT0gMCkpIHtcclxuXHRcdFx0XHRcdGlmIChQb29wSnMuZGVidWcpIHsgY29uc29sZS5sb2coYHNjcm9sbCB0b28gZmFyYCwgbmV4dCk7IH1cclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0c2Nyb2xsVG8oMCwgeSAqIGlubmVySGVpZ2h0KTtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9XHJcblxyXG5cdFx0X25leHRTY3JvbGxUYXJnZXQoZGlyOiAtMSB8IDAgfCAxLCBtb2RlOiAnc2luZ2xlJyk6IFNjcm9sbEluZm8gfCB1bmRlZmluZWQ7XHJcblx0XHRfbmV4dFNjcm9sbFRhcmdldChkaXI6IC0xIHwgMCB8IDEsIG1vZGU6ICdncm91cCcpOiBTY3JvbGxJbmZvW10gfCB1bmRlZmluZWQ7XHJcblx0XHRfbmV4dFNjcm9sbFRhcmdldChkaXI6IC0xIHwgMCB8IDEsIG1vZGU6ICdzaW5nbGUnIHwgJ2dyb3VwJykge1xyXG5cdFx0XHRsZXQgc2Nyb2xscyA9IHRoaXMuZ2V0QWxsU2Nyb2xscygpO1xyXG5cdFx0XHRpZiAobW9kZSA9PSAnc2luZ2xlJykge1xyXG5cdFx0XHRcdGlmIChkaXIgPT0gLTEpIHtcclxuXHRcdFx0XHRcdHJldHVybiBzY3JvbGxzLmZpbmRMYXN0KGUgPT4gZS5mdWxsRGlyID09IC0xKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGRpciA9PSAwKSB7XHJcblx0XHRcdFx0XHRsZXQgbGlzdCA9IHNjcm9sbHMuZmlsdGVyKGUgPT4gZS5mdWxsRGlyID09IDApO1xyXG5cdFx0XHRcdFx0cmV0dXJuIGxpc3Rbfn4obGlzdC5sZW5ndGggLyAyKV07XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChkaXIgPT0gMSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHNjcm9sbHMuZmluZChlID0+IGUuZnVsbERpciA9PSAxKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKG1vZGUgPT0gJ2dyb3VwJykge1xyXG5cdFx0XHRcdGlmIChkaXIgPT0gLTEpIHtcclxuXHRcdFx0XHRcdGxldCBsYXN0ID0gc2Nyb2xscy5maW5kTGFzdChlID0+IGUuZnVsbERpciA9PSAtMSk7XHJcblx0XHRcdFx0XHRpZiAoIWxhc3QpIHJldHVybjtcclxuXHRcdFx0XHRcdHJldHVybiBzY3JvbGxzLmZpbHRlcihlID0+IE1hdGguYWJzKGUucmVjdC50b3AgLSBsYXN0LnJlY3QuYm90dG9tKSA8PSAxLjAwMSAmJiBlLmZ1bGxEaXIgPT0gLTEpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoZGlyID09IDApIHtcclxuXHRcdFx0XHRcdHJldHVybiBzY3JvbGxzLmZpbHRlcihlID0+IGUuZnVsbERpciA9PSAwKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGRpciA9PSAxKSB7XHJcblx0XHRcdFx0XHRsZXQgbGFzdCA9IHNjcm9sbHMuZmluZChlID0+IGUuZnVsbERpciA9PSAxKTtcclxuXHRcdFx0XHRcdGlmICghbGFzdCkgcmV0dXJuO1xyXG5cdFx0XHRcdFx0cmV0dXJuIHNjcm9sbHMuZmlsdGVyKGUgPT4gTWF0aC5hYnMobGFzdC5yZWN0LnRvcCAtIGUucmVjdC5ib3R0b20pIDw9IDEuMDAxICYmIGUuZnVsbERpciA9PSAxKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblxyXG5cdFx0Z2V0QWxsU2Nyb2xscyhzZWxlY3RvciA9IHRoaXMuc2VsZWN0b3IpIHtcclxuXHRcdFx0cmV0dXJuIHFxKHNlbGVjdG9yKS5tYXAoZSA9PiBuZXcgU2Nyb2xsSW5mbyhlKSkudnNvcnQoZSA9PiBlLmNlbnRlck9mZnNldCgpKTtcclxuXHRcdH1cclxuXHJcblxyXG5cclxuXHJcblxyXG5cdFx0LyoqIHVzZWQgICovXHJcblx0XHRhc3luYyBrZWVwKHJlc2l6ZXI6ICgpID0+IGFueSB8IFByb21pc2U8YW55PiwgcmFmID0gZmFsc2UpIHtcclxuXHRcdFx0bGV0IHBvcyA9IHRoaXMuc2F2ZSgpO1xyXG5cdFx0XHRhd2FpdCByZXNpemVyKCk7XHJcblx0XHRcdHBvcy5yZXN0b3JlKCk7XHJcblx0XHRcdGlmIChyYWYpIHtcclxuXHRcdFx0XHRhd2FpdCBQcm9taXNlLmZyYW1lKCk7XHJcblx0XHRcdFx0cG9zLnJlc3RvcmUoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdC8qKiBzYXZlIGN1cnJlbnQgaXRlbSBzY3JvbGwgcG9zaXRpb24gKi9cclxuXHRcdHNhdmUoKTogeyBpbmZvOiBTY3JvbGxJbmZvLCBvZmZzZXQ6IG51bWJlciwgcmVzdG9yZSgpOiB2b2lkIH0ge1xyXG5cdFx0XHRsZXQgc2Nyb2xscyA9IHRoaXMuZ2V0QWxsU2Nyb2xscygpO1xyXG5cdFx0XHRpZiAoIXNjcm9sbHMubGVuZ3RoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHsgaW5mbzogdW5kZWZpbmVkIGFzIGFueSwgb2Zmc2V0OiAtMSwgcmVzdG9yZTogKCkgPT4geyB9IH07XHJcblx0XHRcdH1cclxuXHRcdFx0bGV0IGluZm8gPSBzY3JvbGxzLnZzb3J0KGUgPT4gTWF0aC5hYnMoZS5jZW50ZXJPZmZzZXQoKSkpWzBdO1xyXG5cdFx0XHRsZXQgb2Zmc2V0ID0gaW5mby5jZW50ZXJPZmZzZXQoKTtcclxuXHRcdFx0ZnVuY3Rpb24gcmVzdG9yZSgpIHtcclxuXHRcdFx0XHRsZXQgbmV3SW5mbyA9IG5ldyBTY3JvbGxJbmZvKGluZm8uZWwpO1xyXG5cdFx0XHRcdGxldCBuZXdPZmZzZXQgPSBuZXdJbmZvLmNlbnRlck9mZnNldCgpO1xyXG5cdFx0XHRcdHNjcm9sbFRvKDAsIHNjcm9sbFkgKyAobmV3T2Zmc2V0IC0gb2Zmc2V0KSAqIGlubmVySGVpZ2h0KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4geyBpbmZvLCBvZmZzZXQsIHJlc3RvcmUgfTtcclxuXHRcdH1cclxuXHJcblxyXG5cdFx0c3RhdGljIGNyZWF0ZURlZmF1bHQoKTogSW1hZ2VTY3JvbGxlciB7XHJcblx0XHRcdHJldHVybiBuZXcgSW1hZ2VTY3JvbGxlcigpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IGRlY2xhcmUgbGV0IGlzOiBJbWFnZVNjcm9sbGVyO1xyXG5cclxuXHRkZWZpbmVMYXp5KFBvb3BKcywgJ2lzJywgKCkgPT4gSW1hZ2VTY3JvbGxlci5jcmVhdGVEZWZhdWx0KCkpO1xyXG5cclxuXHJcblx0ZnVuY3Rpb24gZGVmaW5lTGF6eTxULCBLIGV4dGVuZHMga2V5b2YgVCwgViBleHRlbmRzIFRbS10+KFxyXG5cdFx0dGFyZ2V0OiBULCBwcm9wOiBLLCBnZXQ6ICh0aGlzOiB2b2lkKSA9PiBWXHJcblx0KSB7XHJcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBwcm9wLCB7XHJcblx0XHRcdGdldDogKCkgPT4ge1xyXG5cdFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHByb3AsIHtcclxuXHRcdFx0XHRcdHZhbHVlOiBnZXQoKSxcclxuXHRcdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdFx0XHRcdHdyaXRhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHJldHVybiB0YXJnZXRbcHJvcF07XHJcblx0XHRcdH0sXHJcblx0XHRcdHNldCh2KSB7XHJcblx0XHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgcHJvcCwge1xyXG5cdFx0XHRcdFx0dmFsdWU6IHYsXHJcblx0XHRcdFx0XHRjb25maWd1cmFibGU6IHRydWUsXHJcblx0XHRcdFx0XHR3cml0YWJsZTogdHJ1ZSxcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHRyZXR1cm4gdGFyZ2V0W3Byb3BdO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRjb25maWd1cmFibGU6IHRydWUsXHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGNvbnN0IHZhcnMgPSB7fSBhcyBSZWNvcmQ8c3RyaW5nLCBudW1iZXIgfCBzdHJpbmc+O1xyXG5cdGV4cG9ydCBjb25zdCBzdHlsZVZhcnMgPSBuZXcgUHJveHkodmFycyBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LCB7XHJcblx0XHRnZXQodGFyZ2V0LCBwcm9wOiBzdHJpbmcpOiBzdHJpbmcge1xyXG5cdFx0XHRpZiAocHJvcC5zdGFydHNXaXRoKCctLScpKSBwcm9wID0gcHJvcC5zbGljZSgyKTtcclxuXHRcdFx0bGV0IHN0eWxlID0gZG9jdW1lbnQuYm9keS5zdHlsZTtcclxuXHRcdFx0bGV0IHYgPSBzdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCctLScgKyBwcm9wKTtcclxuXHRcdFx0dGFyZ2V0W3Byb3BdID0gdjtcclxuXHRcdFx0cmV0dXJuIHY7XHJcblx0XHR9LFxyXG5cdFx0c2V0KHRhcmdldCwgcHJvcDogc3RyaW5nLCB2OiBzdHJpbmcpOiB0cnVlIHtcclxuXHRcdFx0aWYgKHByb3Auc3RhcnRzV2l0aCgnLS0nKSkgcHJvcCA9IHByb3Auc2xpY2UoMik7XHJcblx0XHRcdGxldCBzdHlsZSA9IGRvY3VtZW50LmJvZHkuc3R5bGU7XHJcblx0XHRcdHRhcmdldFtwcm9wXSA9IHY7XHJcblx0XHRcdHN0eWxlLnNldFByb3BlcnR5KCctLScgKyBwcm9wLCB2ICsgJycpO1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH0sXHJcblx0fSk7XHJcblx0ZXhwb3J0IGNvbnN0IHN0eWxlVmFyc04gPSBuZXcgUHJveHkodmFycyBhcyBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+LCB7XHJcblx0XHRnZXQodGFyZ2V0LCBwcm9wOiBzdHJpbmcpOiBudW1iZXIge1xyXG5cdFx0XHRpZiAocHJvcC5zdGFydHNXaXRoKCctLScpKSBwcm9wID0gcHJvcC5zbGljZSgyKTtcclxuXHRcdFx0bGV0IHN0eWxlID0gZG9jdW1lbnQuYm9keS5zdHlsZTtcclxuXHRcdFx0bGV0IHY6IHN0cmluZyA9IHN0eWxlLmdldFByb3BlcnR5VmFsdWUoJy0tJyArIHByb3ApO1xyXG5cdFx0XHRyZXR1cm4gK3Y7XHJcblx0XHR9LFxyXG5cdFx0c2V0KHRhcmdldCwgcHJvcDogc3RyaW5nLCB2OiBudW1iZXIpOiB0cnVlIHtcclxuXHRcdFx0aWYgKHByb3Auc3RhcnRzV2l0aCgnLS0nKSkgcHJvcCA9IHByb3Auc2xpY2UoMik7XHJcblx0XHRcdGxldCBzdHlsZSA9IGRvY3VtZW50LmJvZHkuc3R5bGU7XHJcblx0XHRcdHRhcmdldFtwcm9wXSA9ICt2O1xyXG5cdFx0XHRzdHlsZS5zZXRQcm9wZXJ0eSgnLS0nICsgcHJvcCwgdiArICcnKTtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9LFxyXG5cdH0pO1xyXG5cclxufVxyXG5cclxuIiwiIl19