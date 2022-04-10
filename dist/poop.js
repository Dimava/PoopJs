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
            configurable: true,
            enumerable: true,
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
    // Object.assign(globalThis, { PoopJs });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3Bvb3Bqcy9Qcm9taXNlLnRzIiwiLi4vcG9vcGpzL0FycmF5LnRzIiwiLi4vcG9vcGpzL0RhdGVOb3dIYWNrLnRzIiwiLi4vcG9vcGpzL09iamVjdC50cyIsIi4uL3Bvb3Bqcy9lbGVtZW50LnRzIiwiLi4vcG9vcGpzL2VsbS50cyIsIi4uL3Bvb3Bqcy9ldGMudHMiLCIuLi9wb29wanMvZmV0Y2gudHMiLCIuLi9wb29wanMvRmlsdGVyZXIvRW50aXR5RmlsdGVyZXIudHMiLCIuLi9wb29wanMvb2JzZXJ2ZXIudHMiLCIuLi9wb29wanMvUGFnaW5hdGUvUGFnaW5hdGlvbi50cyIsIi4uL3Bvb3Bqcy9QYWdpbmF0ZS9JbWFnZVNjcm9sbGluZy50cyIsIi4uL3Bvb3Bqcy9pbml0LnRzIiwiLi4vcG9vcGpzL2tleWJpbmQudHMiLCIuLi9wb29wanMvdHlwZXMudHMiLCIuLi9wb29wanMvRmlsdGVyZXIvRmlsdGVyZXJJdGVtLnRzIiwiLi4vcG9vcGpzL0ZpbHRlcmVyL0ZpbHRlci50cyIsIi4uL3Bvb3Bqcy9GaWx0ZXJlci9Nb2RpZmllci50cyIsIi4uL3Bvb3Bqcy9GaWx0ZXJlci9Tb3J0ZXIudHMiLCIuLi9wb29wanMvRmlsdGVyZXIvdHlwZXMudHMiLCIuLi9wb29wanMvUGFnaW5hdGUvSW1hZ2VTY3JvbGxpbmcyLnRzIiwiLi4vcG9vcGpzL1BhZ2luYXRlL21vZGlmaWNhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFVLE1BQU0sQ0F1Q2Y7QUF2Q0QsV0FBVSxNQUFNO0lBY2YsSUFBaUIsZ0JBQWdCLENBdUJoQztJQXZCRCxXQUFpQixnQkFBZ0I7UUFFaEM7O1dBRUc7UUFDSCxTQUFnQixLQUFLO1lBQ3BCLElBQUksT0FBMkIsQ0FBQztZQUNoQyxJQUFJLE1BQThCLENBQUM7WUFDbkMsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFJLENBQUMs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S0FBSyxDQUFDLEVBQWE7WUFDM0IsRUFBRSxHQUFHLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzVCLElBQUksRUFBRSxHQUFHLElBQUk7Z0JBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7WUFDcEMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFTLEVBQUUsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekQsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzlCLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDMUIsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzFCLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6QixPQUFPLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENB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Z0JBQUUsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEQsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxHQUFHLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDdkMsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO0tBQ0QsQ0FBQyxDQUFDO0FBRUosQ0FBQyxFQXJTUyxNQUFNLEtBQU4sTUFBTSxRQXFTZiIsInNvdXJjZXNDb250ZW50IjpbIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgaW50ZXJmYWNlIERlZmVycmVkPFQgPSB2b2lkPiBleHRlbmRzIFByb21pc2U8VD4ge1xyXG5cdFx0cmVzb2x2ZSh2YWx1ZTogVCB8IFByb21pc2VMaWtlPFQ+KTogdm9pZDtcclxuXHRcdHJlamVjdDogKHJlYXNvbj86IGFueSkgPT4gdm9pZDtcclxuXHJcblx0XHRyKHZhbHVlKVxyXG5cdFx0cih2YWx1ZTogVCB8IFByb21pc2VMaWtlPFQ+KTogdm9pZDtcclxuXHRcdGo6IChyZWFzb24/OiBhbnkpID0+IHZvaWQ7XHJcblxyXG5cdFx0Ly8gUHJvbWlzZVN0YXRlOiAncGVuZGluZycgfCAnZnVsZmlsbGVkJyB8ICdyZWplY3RlZCc7XHJcblx0XHQvLyBQcm9taXNlUmVzdWx0PzogVCB8IEVycm9yO1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBQcm9taXNlRXh0ZW5zaW9uIHtcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIENyZWF0ZXMgdW53cmFwcGVkIHByb21pc2VcclxuXHRcdCAqL1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGVtcHR5PFQgPSB2b2lkPigpOiBEZWZlcnJlZDxUPiB7XHJcblx0XHRcdGxldCByZXNvbHZlOiAodmFsdWU6IFQpID0+IHZvaWQ7XHJcblx0XHRcdGxldCByZWplY3Q6IChyZWFzb24/OiBhbnkpID0+IHZvaWQ7XHJcblx0XHRcdHJldHVybiBPYmplY3QuYXNzaWduKG5ldyBQcm9taXNlPFQ+KChyLCBqKSA9PiB7XHJcblx0XHRcdFx0cmVzb2x2ZSA9IHI7XHJcblx0XHRcdFx0cmVqZWN0ID0gajtcclxuXHRcdFx0fSksIHtcclxuXHRcdFx0XHRyZXNvbHZlLCByZWplY3QsXHJcblx0XHRcdFx0cjogcmVzb2x2ZSwgajogcmVqZWN0LFxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgYXN5bmMgZnVuY3Rpb24gZnJhbWUobiA9IDEpOiBQcm9taXNlPG51bWJlcj4ge1xyXG5cdFx0XHR3aGlsZSAoLS1uID4gMCkge1xyXG5cdFx0XHRcdGF3YWl0IG5ldyBQcm9taXNlKHJlcXVlc3RBbmltYXRpb25GcmFtZSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKHJlcXVlc3RBbmltYXRpb25GcmFtZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxufVxyXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9Qcm9taXNlLnRzXCIgLz5cclxubmFtZXNwYWNlIFBvb3BKcyB7XHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBBcnJheUV4dGVuc2lvbiB7XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBtYXA8VCwgVj4odGhpczogVFtdLCBtYXBwZXI6IChlOiBULCBpOiBudW1iZXIsIGE6IFRbXSkgPT4gUHJvbWlzZTxWPiB8IFYsIHRocmVhZHMgPSA1KTogUHJvbWlzZTxWW10+IHtcclxuXHRcdFx0aWYgKCEodGhyZWFkcyA+IDApKSB0aHJvdyBuZXcgRXJyb3IoKTtcclxuXHRcdFx0bGV0IHRhc2tzOiBbVCwgbnVtYmVyLCBUW11dW10gPSB0aGlzLm1hcCgoZSwgaSwgYSkgPT4gW2UsIGksIGFdKTtcclxuXHRcdFx0bGV0IHJlc3VsdHMgPSBBcnJheTxWPih0YXNrcy5sZW5ndGgpO1xyXG5cdFx0XHRsZXQgYW55UmVzb2x2ZWQgPSBQcm9taXNlRXh0ZW5zaW9uLmVtcHR5KCk7XHJcblx0XHRcdGxldCBmcmVlVGhyZWFkcyA9IHRocmVhZHM7XHJcblx0XHRcdGFzeW5jIGZ1bmN0aW9uIHJ1blRhc2sodGFzazogW1QsIG51bWJlciwgVFtdXSk6IFByb21pc2U8Vj4ge1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gYXdhaXQgbWFwcGVyKC4uLnRhc2spO1xyXG5cdFx0XHRcdH0gY2F0Y2ggKGVycikge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGVycjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0YXN5bmMgZnVuY3Rpb24gcnVuKHRhc2spIHtcclxuXHRcdFx0XHRmcmVlVGhyZWFkcy0tO1xyXG5cdFx0XHRcdHJlc3VsdHNbdGFza1sxXV0gPSBhd2FpdCBydW5UYXNrKHRhc2spO1xyXG5cdFx0XHRcdGZyZWVUaHJlYWRzKys7XHJcblx0XHRcdFx0bGV0IG9sZEFueVJlc29sdmVkID0gYW55UmVzb2x2ZWQ7XHJcblx0XHRcdFx0YW55UmVzb2x2ZWQgPSBQcm9taXNlRXh0ZW5zaW9uLmVtcHR5KCk7XHJcblx0XHRcdFx0b2xkQW55UmVzb2x2ZWQucih1bmRlZmluZWQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGZvciAobGV0IHRhc2sgb2YgdGFza3MpIHtcclxuXHRcdFx0XHRpZiAoZnJlZVRocmVhZHMgPT0gMCkge1xyXG5cdFx0XHRcdFx0YXdhaXQgYW55UmVzb2x2ZWQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJ1bih0YXNrKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR3aGlsZSAoZnJlZVRocmVhZHMgPCB0aHJlYWRzKSB7XHJcblx0XHRcdFx0YXdhaXQgYW55UmVzb2x2ZWQ7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHJlc3VsdHM7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIG1hcDxUID0gbnVtYmVyPih0aGlzOiBBcnJheUNvbnN0cnVjdG9yLCBsZW5ndGg6IG51bWJlciwgbWFwcGVyOiAobnVtYmVyKSA9PiBUID0gaSA9PiBpKSB7XHJcblx0XHRcdHJldHVybiB0aGlzKGxlbmd0aCkuZmlsbCgwKS5tYXAoKGUsIGksIGEpID0+IG1hcHBlcihpKSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHZzb3J0PFQ+KHRoaXM6IFRbXSwgbWFwcGVyOiAoZTogVCwgaTogbnVtYmVyLCBhOiBUW10pID0+IG51bWJlciwgc29ydGVyPzogKChhOiBudW1iZXIsIGI6IG51bWJlciwgYWU6IFQsIGJlOiBUKSA9PiBudW1iZXIpIHwgLTEpOiBUW107XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gdnNvcnQ8VCwgVj4odGhpczogVFtdLCBtYXBwZXI6IChlOiBULCBpOiBudW1iZXIsIGE6IFRbXSkgPT4gViwgc29ydGVyOiAoKGE6IFYsIGI6IFYsIGFlOiBULCBiZTogVCkgPT4gbnVtYmVyKSB8IC0xKTogVFtdO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHZzb3J0PFQ+KHRoaXM6IFRbXSwgbWFwcGVyOiAoZTogVCwgaTogbnVtYmVyLCBhOiBUW10pID0+IG51bWJlciwgc29ydGVyOiAoKGE6IG51bWJlciwgYjogbnVtYmVyLCBhZTogVCwgYmU6IFQpID0+IG51bWJlcikgfCAtMSA9IChhLCBiKSA9PiBhIC0gYik6IFRbXSB7XHJcblx0XHRcdGxldCB0aGVTb3J0ZXIgPSB0eXBlb2Ygc29ydGVyID09ICdmdW5jdGlvbicgPyBzb3J0ZXIgOiAoYSwgYikgPT4gYiAtIGE7XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHRcdFx0Lm1hcCgoZSwgaSwgYSkgPT4gKHsgZSwgdjogbWFwcGVyKGUsIGksIGEpIH0pKVxyXG5cdFx0XHRcdC5zb3J0KChhLCBiKSA9PiB0aGVTb3J0ZXIoYS52LCBiLnYsIGEuZSwgYi5lKSlcclxuXHRcdFx0XHQubWFwKGUgPT4gZS5lKTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gYXQ8VD4odGhpczogVFtdLCBpbmRleDogbnVtYmVyKTogVCB7XHJcblx0XHRcdHJldHVybiBpbmRleCA+PSAwID8gdGhpc1tpbmRleF0gOiB0aGlzW3RoaXMubGVuZ3RoICsgaW5kZXhdO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBmaW5kTGFzdDxULCBTIGV4dGVuZHMgVD4odGhpczogVFtdLCBwcmVkaWNhdGU6ICh0aGlzOiB2b2lkLCB2YWx1ZTogVCwgaW5kZXg6IG51bWJlciwgb2JqOiBUW10pID0+IHZhbHVlIGlzIFMsIHRoaXNBcmc/OiBhbnkpOiBTIHwgdW5kZWZpbmVkO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGZpbmRMYXN0PFQ+KHByZWRpY2F0ZTogKHRoaXM6IFRbXSwgdmFsdWU6IFQsIGluZGV4OiBudW1iZXIsIG9iajogVFtdKSA9PiB1bmtub3duLCB0aGlzQXJnPzogYW55KTogVCB8IHVuZGVmaW5lZDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBmaW5kTGFzdDxULCBTIGV4dGVuZHMgVD4odGhpczogVFtdLCBwcmVkaWNhdGU6ICh2YWx1ZTogVCwgaW5kZXg6IG51bWJlciwgb2JqOiBUW10pID0+IHVua25vd24sIHRoaXNBcmc/OiBhbnkpOiBUIHwgUyB8IHVuZGVmaW5lZCB7XHJcblx0XHRcdGZvciAobGV0IGkgPSB0aGlzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcblx0XHRcdFx0aWYgKHByZWRpY2F0ZSh0aGlzW2ldLCBpLCB0aGlzKSkgcmV0dXJuIHRoaXNbaV07XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblxyXG5cdFx0ZXhwb3J0IGNsYXNzIFBNYXA8VCwgViwgRSA9IG5ldmVyPiB7XHJcblx0XHRcdC8qKiBPcmlnaW5hbCBhcnJheSAqL1xyXG5cdFx0XHRzb3VyY2U6IFRbXSA9IFtdO1xyXG5cdFx0XHQvKiogQXN5bmMgZWxlbWVudCBjb252ZXJ0ZXIgZnVuY3Rpb24gKi9cclxuXHRcdFx0bWFwcGVyOiAoZTogVCwgaTogbnVtYmVyLCBhOiBUW10sIHBtYXA6IFBNYXA8VCwgViwgRT4pID0+IFByb21pc2U8ViB8IEU+ID0gKGU6IFQpID0+IGUgYXMgYW55IGFzIFByb21pc2U8Vj47XHJcblx0XHRcdC8qKiBNYXggbnVtYmVyIG9mIHJlcXVlc3RzIGF0IG9uY2UuICAgXHJcblx0XHRcdCAqICAqTWF5KiBiZSBjaGFuZ2VkIGluIHJ1bnRpbWUgKi9cclxuXHRcdFx0dGhyZWFkczogbnVtYmVyID0gNTtcclxuXHRcdFx0LyoqIE1heCBkaXN0YW5jZSBiZXR3ZWVuIHRoZSBvbGRlcnMgaW5jb21wbGV0ZSBhbmQgbmV3ZXN0IGFjdGl2ZSBlbGVtZW50cy4gICBcclxuXHRcdFx0ICogICpNYXkqIGJlIGNoYW5nZWQgaW4gcnVudGltZSAqL1xyXG5cdFx0XHR3aW5kb3c6IG51bWJlciA9IEluZmluaXR5O1xyXG5cclxuXHRcdFx0LyoqIFVuZmluaXNoZWQgcmVzdWx0IGFycmF5ICovXHJcblx0XHRcdHJlc3VsdHM6IChWIHwgRSB8IHVuZGVmaW5lZClbXSA9IFtdO1xyXG5cdFx0XHQvKiogUHJvbWlzZXMgZm9yIGV2ZXJ5IGVsZW1lbnQgKi9cclxuXHRcdFx0cmVxdWVzdHM6IERlZmVycmVkPFYgfCBFPltdID0gW107XHJcblxyXG5cdFx0XHRiZWZvcmVTdGFydDogKGRhdGE6IHtcclxuXHRcdFx0XHRlOiBULCBpOiBudW1iZXIsIGE6IFRbXSwgdj86IFYgfCBFLCByOiAoViB8IEUpW10sIHBtYXA6IFBNYXA8VCwgViwgRT5cclxuXHRcdFx0fSkgPT4gUHJvbWlzZTx2b2lkPiB8IHZvaWQgPSAoKSA9PiB7IH07XHJcblx0XHRcdGFmdGVyQ29tcGxldGU6IChkYXRhOiB7XHJcblx0XHRcdFx0ZTogVCwgaTogbnVtYmVyLCBhOiBUW10sIHY6IFYgfCBFLCByOiAoViB8IEUpW10sIHBtYXA6IFBNYXA8VCwgViwgRT5cclxuXHRcdFx0fSkgPT4gUHJvbWlzZTx2b2lkPiB8IHZvaWQgPSAoKSA9PiB7IH07XHJcblxyXG5cdFx0XHQvKiogTGVuZ3RoIG9mIHRoZSBhcnJheSAqL1xyXG5cdFx0XHRsZW5ndGg6IG51bWJlciA9IC0xO1xyXG5cdFx0XHQvKiogVGhlIG51bWJlciBvZiBlbGVtZW50cyBmaW5pc2hlZCBjb252ZXJ0aW5nICovXHJcblx0XHRcdGNvbXBsZXRlZDogbnVtYmVyID0gLTE7XHJcblx0XHRcdC8qKiBUaHJlYWRzIGN1cnJlbnRseSB3b3JraW5nICAgXHJcblx0XHRcdCAqICBpbiB0aGUgbWFwcGVyIGZ1bmN0aW9uOiBpbmNsdWRpbmcgdGhlIGN1cnJlbnQgb25lICovXHJcblx0XHRcdGFjdGl2ZVRocmVhZHM6IG51bWJlciA9IC0xO1xyXG5cdFx0XHRsYXN0U3RhcnRlZDogbnVtYmVyID0gLTE7XHJcblxyXG5cdFx0XHRhbGxUYXNrc0RvbmU6IERlZmVycmVkPChWIHwgRSlbXT4gJiB7IHBtYXA6IFBNYXA8VCwgViwgRT4gfTtcclxuXHRcdFx0YW55VGFza1Jlc29sdmVkOiBEZWZlcnJlZDx2b2lkPjtcclxuXHJcblx0XHRcdGNvbnN0cnVjdG9yKHNvdXJjZTogUGFydGlhbDxQTWFwPFQsIFYsIEU+Pikge1xyXG5cdFx0XHRcdHRoaXMuYWxsVGFza3NEb25lID0gT2JqZWN0LmFzc2lnbih0aGlzLmVtcHR5UmVzdWx0PChWIHwgRSlbXT4oKSwgeyBwbWFwOiB0aGlzIH0pO1xyXG5cdFx0XHRcdHRoaXMuYW55VGFza1Jlc29sdmVkID0gdGhpcy5lbXB0eVJlc3VsdCgpO1xyXG5cdFx0XHRcdGZvciAobGV0IGsgb2YgT2JqZWN0LmtleXModGhpcykgYXMgKGtleW9mIFBNYXA8VCwgViwgRT4pW10pIHtcclxuXHRcdFx0XHRcdGlmICh0eXBlb2Ygc291cmNlW2tdID09IHR5cGVvZiB0aGlzW2tdKSB7XHJcblx0XHRcdFx0XHRcdHRoaXNba10gPSBzb3VyY2Vba10gYXMgYW55O1xyXG5cdFx0XHRcdFx0fSBlbHNlIGlmIChzb3VyY2Vba10pIHtcclxuXHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBQTWFwOiBpbnZhbGlkIGNvbnN0cnVjdG9yIHBhcmFtZXRlcjogcHJvcGVydHkgJHtrfTogZXhwZWN0ZWQgJHt0eXBlb2YgdGhpc1trXX0sIGJ1dCBnb3QgJHt0eXBlb2Ygc291cmNlW2tdfWApO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0YXN5bmMgc3RhcnRUYXNrKGFycmF5SW5kZXg6IG51bWJlcikge1xyXG5cdFx0XHRcdHRoaXMuYWN0aXZlVGhyZWFkcysrO1xyXG5cdFx0XHRcdGxldCBlID0gdGhpcy5zb3VyY2VbYXJyYXlJbmRleF07XHJcblx0XHRcdFx0YXdhaXQgdGhpcy5iZWZvcmVTdGFydCh7XHJcblx0XHRcdFx0XHRlOiB0aGlzLnNvdXJjZVthcnJheUluZGV4XSxcclxuXHRcdFx0XHRcdGk6IGFycmF5SW5kZXgsXHJcblx0XHRcdFx0XHRhOiB0aGlzLnNvdXJjZSxcclxuXHRcdFx0XHRcdHY6IHVuZGVmaW5lZCxcclxuXHRcdFx0XHRcdHI6IHRoaXMucmVzdWx0cyxcclxuXHRcdFx0XHRcdHBtYXA6IHRoaXMsXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0dGhpcy5sYXN0U3RhcnRlZCA9IGFycmF5SW5kZXg7XHJcblx0XHRcdFx0bGV0IHY6IFYgfCBFO1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHR2ID0gYXdhaXQgdGhpcy5tYXBwZXIodGhpcy5zb3VyY2VbYXJyYXlJbmRleF0sIGFycmF5SW5kZXgsIHRoaXMuc291cmNlLCB0aGlzKTtcclxuXHRcdFx0XHR9IGNhdGNoIChlKSB7XHJcblx0XHRcdFx0XHR2ID0gZSBhcyBFO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLnJlc3VsdHNbYXJyYXlJbmRleF0gPSB2O1xyXG5cdFx0XHRcdHRoaXMucmVxdWVzdHNbYXJyYXlJbmRleF0ucmVzb2x2ZSh2KTtcclxuXHRcdFx0XHR0aGlzLmNvbXBsZXRlZCsrO1xyXG5cdFx0XHRcdGF3YWl0IHRoaXMuYWZ0ZXJDb21wbGV0ZSh7XHJcblx0XHRcdFx0XHRlOiB0aGlzLnNvdXJjZVthcnJheUluZGV4XSxcclxuXHRcdFx0XHRcdGk6IGFycmF5SW5kZXgsXHJcblx0XHRcdFx0XHRhOiB0aGlzLnNvdXJjZSxcclxuXHRcdFx0XHRcdHY6IHYsXHJcblx0XHRcdFx0XHRyOiB0aGlzLnJlc3VsdHMsXHJcblx0XHRcdFx0XHRwbWFwOiB0aGlzLFxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHRoaXMuYWN0aXZlVGhyZWFkcy0tO1xyXG5cdFx0XHRcdHRoaXMuYW55VGFza1Jlc29sdmVkLnJlc29sdmUoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRhc3luYyBydW5faW50ZXJuYWwoKSB7XHJcblx0XHRcdFx0Zm9yIChsZXQgYXJyYXlJbmRleCA9IDA7IGFycmF5SW5kZXggPCB0aGlzLmxlbmd0aDsgYXJyYXlJbmRleCsrKSB7XHJcblx0XHRcdFx0XHR3aGlsZSAodGhpcy5hY3RpdmVUaHJlYWRzID49IHRoaXMudGhyZWFkcykge1xyXG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLmFueVRhc2tSZXNvbHZlZDtcclxuXHRcdFx0XHRcdFx0dGhpcy5hbnlUYXNrUmVzb2x2ZWQgPSB0aGlzLmVtcHR5UmVzdWx0KCk7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5yZXF1ZXN0c1thcnJheUluZGV4IC0gdGhpcy53aW5kb3ddO1xyXG5cdFx0XHRcdFx0dGhpcy5zdGFydFRhc2soYXJyYXlJbmRleCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHdoaWxlICh0aGlzLmFjdGl2ZVRocmVhZHMgPiAwKSB7XHJcblx0XHRcdFx0XHRhd2FpdCB0aGlzLmFueVRhc2tSZXNvbHZlZDtcclxuXHRcdFx0XHRcdHRoaXMuYW55VGFza1Jlc29sdmVkID0gdGhpcy5lbXB0eVJlc3VsdCgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLmFsbFRhc2tzRG9uZS5yZXNvbHZlKHRoaXMucmVzdWx0cyBhcyAoViB8IEUpW10pO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmFsbFRhc2tzRG9uZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRydW4oKSB7XHJcblx0XHRcdFx0dGhpcy5wcmVwYXJlKCk7XHJcblx0XHRcdFx0dGhpcy5ydW5faW50ZXJuYWwoKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hbGxUYXNrc0RvbmU7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHBhdXNlKCkge1xyXG5cdFx0XHRcdGlmICh0aGlzLmFjdGl2ZVRocmVhZHMgPCB0aGlzLmxlbmd0aCArIHRoaXMudGhyZWFkcylcclxuXHRcdFx0XHRcdHRoaXMuYWN0aXZlVGhyZWFkcyArPSB0aGlzLmxlbmd0aCArIHRoaXMudGhyZWFkcztcclxuXHRcdFx0fVxyXG5cdFx0XHR1bnBhdXNlKCkge1xyXG5cdFx0XHRcdGlmICh0aGlzLmFjdGl2ZVRocmVhZHMgPj0gdGhpcy5sZW5ndGggKyB0aGlzLnRocmVhZHMpXHJcblx0XHRcdFx0XHR0aGlzLmFjdGl2ZVRocmVhZHMgLT0gdGhpcy5sZW5ndGggKyB0aGlzLnRocmVhZHM7XHJcblx0XHRcdFx0dGhpcy5hbnlUYXNrUmVzb2x2ZWQucigpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGNhbmNlbCgpIHtcclxuXHRcdFx0XHR0aGlzLm1hcHBlciA9ICgoKSA9PiB7IH0pIGFzIGFueTtcclxuXHRcdFx0XHR0aGlzLmJlZm9yZVN0YXJ0ID0gKCkgPT4geyB9O1xyXG5cdFx0XHRcdHRoaXMuYWZ0ZXJDb21wbGV0ZSA9ICgpID0+IHsgfTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cHJlcGFyZSgpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5sZW5ndGggPT0gLTEpIHRoaXMubGVuZ3RoID0gdGhpcy5zb3VyY2UubGVuZ3RoO1xyXG5cdFx0XHRcdGlmICh0aGlzLnJlc3VsdHMubGVuZ3RoID09IDApIHtcclxuXHRcdFx0XHRcdHRoaXMucmVzdWx0cyA9IEFycmF5KHRoaXMubGVuZ3RoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMucmVxdWVzdHMubGVuZ3RoID09IDApIHtcclxuXHRcdFx0XHRcdHRoaXMucmVxdWVzdHMgPSB0aGlzLnNvdXJjZS5tYXAoZSA9PiB0aGlzLmVtcHR5UmVzdWx0KCkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodGhpcy5jb21wbGV0ZWQgPCAwKSB0aGlzLmNvbXBsZXRlZCA9IDA7XHJcblx0XHRcdFx0aWYgKHRoaXMuYWN0aXZlVGhyZWFkcyA8IDApIHRoaXMuYWN0aXZlVGhyZWFkcyA9IDA7XHJcblx0XHRcdFx0aWYgKHRoaXMubGFzdFN0YXJ0ZWQgPCAtMSkgdGhpcy5sYXN0U3RhcnRlZCA9IC0xO1xyXG5cdFx0XHRcdHRoaXMuYW55VGFza1Jlc29sdmVkID0gdGhpcy5lbXB0eVJlc3VsdCgpO1xyXG5cdFx0XHRcdE9iamVjdC5hc3NpZ24odGhpcy5hbGxUYXNrc0RvbmUsIHsgcG1hcDogdGhpcyB9KTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZW1wdHlSZXN1bHQ8VCA9IFYgfCBFPigpOiBEZWZlcnJlZDxUPiB7XHJcblx0XHRcdFx0bGV0IHJlc29sdmUhOiAodmFsdWU6IFQpID0+IHZvaWQ7XHJcblx0XHRcdFx0bGV0IHJlamVjdCE6IChyZWFzb24/OiBhbnkpID0+IHZvaWQ7XHJcblx0XHRcdFx0bGV0IHAgPSBuZXcgUHJvbWlzZTxUPigociwgaikgPT4ge1xyXG5cdFx0XHRcdFx0cmVzb2x2ZSA9IHI7XHJcblx0XHRcdFx0XHRyZWplY3QgPSBqO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHJldHVybiBPYmplY3QuYXNzaWduKHAsIHsgcmVzb2x2ZSwgcmVqZWN0LCByOiByZXNvbHZlLCBqOiByZWplY3QgfSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHN0YXRpYyB0aGlzX3BtYXA8VCwgViwgRSA9IG5ldmVyPih0aGlzOiBUW10sIG1hcHBlcjogUE1hcDxULCBWLCBFPlsnbWFwcGVyJ10sIG9wdGlvbnM6IFBhcnRpYWw8UE1hcDxULCBWLCBFPj4gfCBudW1iZXIgfCB0cnVlID0ge30pIHtcclxuXHRcdFx0XHRpZiAob3B0aW9ucyA9PSB0cnVlKSBvcHRpb25zID0gSW5maW5pdHk7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zID09ICdudW1iZXInKSBvcHRpb25zID0geyB0aHJlYWRzOiBvcHRpb25zIH07XHJcblx0XHRcdFx0bGV0IHBtYXAgPSBuZXcgUE1hcCh7IHNvdXJjZTogdGhpcywgbWFwcGVyLCAuLi5vcHRpb25zIH0pO1xyXG5cdFx0XHRcdHJldHVybiBwbWFwLnJ1bigpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHN0YXRpYyBwbWFwPFQsIFYsIEUgPSBuZXZlcj4oYXJyYXk6IFRbXSwgbWFwcGVyOiBQTWFwPFQsIFYsIEU+WydtYXBwZXInXSwgb3B0aW9uczogUGFydGlhbDxQTWFwPFQsIFYsIEU+PiB8IG51bWJlciB8IHRydWUgPSB7fSkge1xyXG5cdFx0XHRcdGlmIChvcHRpb25zID09IHRydWUpIG9wdGlvbnMgPSBJbmZpbml0eTtcclxuXHRcdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMgPT0gJ251bWJlcicpIG9wdGlvbnMgPSB7IHRocmVhZHM6IG9wdGlvbnMgfTtcclxuXHRcdFx0XHRsZXQgcG1hcCA9IG5ldyBQTWFwKHsgc291cmNlOiBhcnJheSwgbWFwcGVyLCAuLi5vcHRpb25zIH0pO1xyXG5cdFx0XHRcdHJldHVybiBwbWFwLnJ1bigpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHJcbn0iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBEYXRlTm93SGFjayB7XHJcblxyXG5cdFx0ZXhwb3J0IGxldCBzcGVlZE11bHRpcGxpZXIgPSAxO1xyXG5cdFx0ZXhwb3J0IGxldCBkZWx0YU9mZnNldCA9IDA7XHJcblx0XHRleHBvcnQgbGV0IHN0YXJ0UmVhbHRpbWUgPSAwO1xyXG5cdFx0ZXhwb3J0IGxldCBzdGFydFRpbWUgPSAwO1xyXG5cclxuXHRcdC8vIGV4cG9ydCBsZXQgc3BlZWRNdWx0aXBsaWVyID0gMTtcclxuXHRcdGV4cG9ydCBsZXQgcGVyZm9ybWFuY2VEZWx0YU9mZnNldCA9IDA7XHJcblx0XHRleHBvcnQgbGV0IHBlcmZvcm1hbmNlU3RhcnRSZWFsdGltZSA9IDA7XHJcblx0XHRleHBvcnQgbGV0IHBlcmZvcm1hbmNlU3RhcnRUaW1lID0gMDtcclxuXHJcblx0XHRleHBvcnQgbGV0IHVzZWRNZXRob2RzID0ge1xyXG5cdFx0XHRkYXRlOiB0cnVlLFxyXG5cdFx0XHRwZXJmb3JtYW5jZTogdHJ1ZSxcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gdG9GYWtlVGltZShyZWFsdGltZTogbnVtYmVyKSB7XHJcblx0XHRcdGlmICghdXNlZE1ldGhvZHMuZGF0ZSkgcmV0dXJuIHJlYWx0aW1lO1xyXG5cdFx0XHRyZXR1cm4gTWF0aC5mbG9vcihcclxuXHRcdFx0XHQocmVhbHRpbWUgLSBzdGFydFJlYWx0aW1lKSAqIHNwZWVkTXVsdGlwbGllciArIHN0YXJ0VGltZSArIGRlbHRhT2Zmc2V0XHJcblx0XHRcdCk7XHJcblx0XHR9XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gdG9QZXJmb3JtYW5jZUZha2VUaW1lKHJlYWx0aW1lOiBudW1iZXIpIHtcclxuXHRcdFx0aWYgKCF1c2VkTWV0aG9kcy5wZXJmb3JtYW5jZSkgcmV0dXJuIHJlYWx0aW1lO1xyXG5cdFx0XHRyZXR1cm4gKHJlYWx0aW1lIC0gcGVyZm9ybWFuY2VTdGFydFJlYWx0aW1lKSAqIHNwZWVkTXVsdGlwbGllclxyXG5cdFx0XHRcdCsgcGVyZm9ybWFuY2VTdGFydFRpbWUgKyBwZXJmb3JtYW5jZURlbHRhT2Zmc2V0O1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBsZXQgYnJhY2tldFNwZWVkcyA9IFswLjA1LCAwLjI1LCAxLCAyLCA1LCAxMCwgMjAsIDYwLCAxMjBdO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHNwZWVkaGFjayhzcGVlZDogbnVtYmVyID0gMSkge1xyXG5cdFx0XHRpZiAodHlwZW9mIHNwZWVkICE9ICdudW1iZXInKSB7XHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBEYXRlTm93SGFjazogaW52YWxpZCBzcGVlZDogJHtzcGVlZH1gKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRhY3RpdmF0ZSgpO1xyXG5cdFx0XHRhY3RpdmF0ZVBlcmZvcm1hbmNlKCk7XHJcblx0XHRcdHNwZWVkTXVsdGlwbGllciA9IHNwZWVkO1xyXG5cdFx0XHRsb2NhdGlvbi5oYXNoID0gc3BlZWQgKyAnJztcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiB0aW1lanVtcChzZWNvbmRzOiBudW1iZXIpIHtcclxuXHRcdFx0YWN0aXZhdGUoKTtcclxuXHRcdFx0YWN0aXZhdGVQZXJmb3JtYW5jZSgpO1xyXG5cdFx0XHRkZWx0YU9mZnNldCArPSBzZWNvbmRzICogMTAwMDtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBzd2l0Y2hTcGVlZGhhY2soZGlyOiBudW1iZXIpIHtcclxuXHRcdFx0bGV0IGN1cnJlbnRJbmRleCA9IGJyYWNrZXRTcGVlZHMuaW5kZXhPZihzcGVlZE11bHRpcGxpZXIpO1xyXG5cdFx0XHRpZiAoY3VycmVudEluZGV4ID09IC0xKSBjdXJyZW50SW5kZXggPSBicmFja2V0U3BlZWRzLmluZGV4T2YoMSk7XHJcblx0XHRcdGxldCBuZXdTcGVlZCA9IGJyYWNrZXRTcGVlZHNbY3VycmVudEluZGV4ICsgZGlyXTtcclxuXHRcdFx0aWYgKG5ld1NwZWVkID09IHVuZGVmaW5lZCkgcmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRzcGVlZGhhY2sobmV3U3BlZWQpO1xyXG5cdFx0fVxyXG5cdFx0ZnVuY3Rpb24gb25rZXlkb3duKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XHJcblx0XHRcdGlmIChldmVudC5jb2RlID09ICdCcmFja2V0TGVmdCcpIHtcclxuXHRcdFx0XHRzd2l0Y2hTcGVlZGhhY2soLTEpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChldmVudC5jb2RlID09ICdCcmFja2V0UmlnaHQnKSB7XHJcblx0XHRcdFx0c3dpdGNoU3BlZWRoYWNrKDEpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gYmluZEJyYWNrZXRzKG1vZGUgPSAnb24nKSB7XHJcblx0XHRcdGlmIChtb2RlID09ICdvbicpIHtcclxuXHRcdFx0XHRQb29wSnMua2RzID0ge1xyXG5cdFx0XHRcdFx0QnJhY2tldExlZnQ6ICgpID0+IHN3aXRjaFNwZWVkaGFjaygtMSksXHJcblx0XHRcdFx0XHRCcmFja2V0UmlnaHQ6ICgpID0+IHN3aXRjaFNwZWVkaGFjaygxKSxcclxuXHRcdFx0XHR9O1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGRlbGV0ZSBQb29wSnMua2RzLkJyYWNrZXRMZWZ0O1xyXG5cdFx0XHRcdGRlbGV0ZSBQb29wSnMua2RzLkJyYWNrZXRSaWdodDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBsZXQgYWN0aXZhdGVkID0gZmFsc2U7XHJcblx0XHRmdW5jdGlvbiBhY3RpdmF0ZSgpIHtcclxuXHRcdFx0RGF0ZS5fbm93ID8/PSBEYXRlLm5vdztcclxuXHRcdFx0RGF0ZS5wcm90b3R5cGUuX2dldFRpbWUgPz89IERhdGUucHJvdG90eXBlLmdldFRpbWU7XHJcblx0XHRcdHN0YXJ0VGltZSA9IERhdGUubm93KCk7XHJcblx0XHRcdHN0YXJ0UmVhbHRpbWUgPSBEYXRlLl9ub3coKTtcclxuXHRcdFx0ZGVsdGFPZmZzZXQgPSAwO1xyXG5cdFx0XHQvLyBjb25zb2xlLmxvZyhEYXRlLm5vdygpLCApXHJcblx0XHRcdC8vIGRlYnVnZ2VyO1xyXG5cdFx0XHREYXRlLm5vdyA9ICgpID0+IHRvRmFrZVRpbWUoRGF0ZS5fbm93KCkpO1xyXG5cdFx0XHREYXRlLnByb3RvdHlwZS5nZXRUaW1lID0gZnVuY3Rpb24gKHRoaXM6IERhdGUgJiB7IF90PzogbnVtYmVyIH0pIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fdCA/Pz0gdG9GYWtlVGltZSh0aGlzLl9nZXRUaW1lKCkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdERhdGUucHJvdG90eXBlLnZhbHVlT2YgPSBmdW5jdGlvbiAodGhpczogRGF0ZSkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmdldFRpbWUoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRhY3RpdmF0ZWQgPSB0cnVlO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGxldCBwZXJmb3JtYW5jZUFjdGl2YXRlZCA9IGZhbHNlO1xyXG5cdFx0ZnVuY3Rpb24gYWN0aXZhdGVQZXJmb3JtYW5jZSgpIHtcclxuXHRcdFx0cGVyZm9ybWFuY2UuX25vdyA/Pz0gcGVyZm9ybWFuY2Uubm93O1xyXG5cdFx0XHRwZXJmb3JtYW5jZVN0YXJ0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG5cdFx0XHRwZXJmb3JtYW5jZVN0YXJ0UmVhbHRpbWUgPSBwZXJmb3JtYW5jZS5fbm93KCk7XHJcblx0XHRcdHBlcmZvcm1hbmNlRGVsdGFPZmZzZXQgPSAwO1xyXG5cdFx0XHRwZXJmb3JtYW5jZS5ub3cgPSAoKSA9PiB0b1BlcmZvcm1hbmNlRmFrZVRpbWUocGVyZm9ybWFuY2UuX25vdygpKTtcclxuXHRcdFx0d2luZG93Ll9yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPz89IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XHJcblx0XHRcdHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmID0+IHdpbmRvdy5fcmVxdWVzdEFuaW1hdGlvbkZyYW1lKG4gPT4gZih0b1BlcmZvcm1hbmNlRmFrZVRpbWUobikpKTtcclxuXHRcdFx0cGVyZm9ybWFuY2VBY3RpdmF0ZWQgPSB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHR9XHJcblxyXG5cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIE9iamVjdEV4dGVuc2lvbiB7XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGRlZmluZVZhbHVlPFQsIEsgZXh0ZW5kcyBrZXlvZiBUPihvOiBULCBwOiBLLCB2YWx1ZTogVFtLXSk6IFQ7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZGVmaW5lVmFsdWU8VD4obzogVCwgZm46IEZ1bmN0aW9uKTogVDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBkZWZpbmVWYWx1ZTxUPihvOiBULCBwOiBrZXlvZiBUIHwgc3RyaW5nIHwgRnVuY3Rpb24sIHZhbHVlPzogYW55KTogVCB7XHJcblx0XHRcdGlmICh0eXBlb2YgcCA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0W3AsIHZhbHVlXSA9IFtwLm5hbWUsIHBdIGFzIFtzdHJpbmcsIEZ1bmN0aW9uXTtcclxuXHRcdFx0fVxyXG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobywgcCwge1xyXG5cdFx0XHRcdHZhbHVlLFxyXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdFx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcclxuXHRcdFx0XHR3cml0YWJsZTogdHJ1ZSxcclxuXHRcdFx0fSk7XHJcblx0XHRcdHJldHVybiBvO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBkZWZpbmVHZXR0ZXI8VCwgSyBleHRlbmRzIGtleW9mIFQ+KG86IFQsIHA6IEssIGdldDogKCkgPT4gVFtLXSk6IFQ7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZGVmaW5lR2V0dGVyPFQ+KG86IFQsIGdldDogRnVuY3Rpb24pOiBUO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUdldHRlcjxUPihvOiBULCBwOiBzdHJpbmcgfCBrZXlvZiBUIHwgRnVuY3Rpb24sIGdldD86IGFueSk6IFQge1xyXG5cdFx0XHRpZiAodHlwZW9mIHAgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFtwLCBnZXRdID0gW3AubmFtZSwgcF0gYXMgW3N0cmluZywgRnVuY3Rpb25dO1xyXG5cdFx0XHR9XHJcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBwLCB7XHJcblx0XHRcdFx0Z2V0LFxyXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdFx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcclxuXHRcdFx0fSk7XHJcblx0XHRcdHJldHVybiBvO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBtYXA8VCwgVj4obzogVCwgbWFwcGVyOiAodjogVmFsdWVPZjxUPiwgazoga2V5b2YgVCwgbzogVCkgPT4gVik6IE1hcHBlZE9iamVjdDxULCBWPiB7XHJcblx0XHRcdGxldCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXMobykgYXMgW2tleW9mIFQsIFZhbHVlT2Y8VD5dW107XHJcblx0XHRcdHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoZW50cmllcy5tYXAoKFtrLCB2XSkgPT4gW2ssIG1hcHBlcih2LCBrLCBvKV0pKSBhcyBNYXBwZWRPYmplY3Q8VCwgVj47XHJcblx0XHR9XHJcblx0fVxyXG5cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIFF1ZXJ5U2VsZWN0b3Ige1xyXG5cclxuXHRcdGV4cG9ydCBuYW1lc3BhY2UgV2luZG93USB7XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHNlbGVjdG9yOiBLKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxTIGV4dGVuZHMgc2VsZWN0b3IsIE4gPSBUYWdOYW1lRnJvbVNlbGVjdG9yPFM+PihzZWxlY3RvcjogUyk6IFRhZ0VsZW1lbnRGcm9tVGFnTmFtZTxOPjtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHE8RSBleHRlbmRzIEVsZW1lbnQ+KHNlbGVjdG9yOiBzZWxlY3Rvcik6IEU7XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHNlbGVjdG9yOiBzZWxlY3Rvcik6IEhUTUxFbGVtZW50VGFnTmFtZU1hcFtLXTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHEoc2VsZWN0b3I6IHN0cmluZykge1xyXG5cdFx0XHRcdHJldHVybiAodGhpcz8uZG9jdW1lbnQgPz8gZG9jdW1lbnQpLnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXE8SyBleHRlbmRzIGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcD4oc2VsZWN0b3I6IEspOiAoSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdKVtdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXE8UyBleHRlbmRzIHNlbGVjdG9yLCBOID0gVGFnTmFtZUZyb21TZWxlY3RvcjxTPj4oc2VsZWN0b3I6IFMpOiBUYWdFbGVtZW50RnJvbVRhZ05hbWU8Tj5bXTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEUgZXh0ZW5kcyBFbGVtZW50PihzZWxlY3Rvcjogc2VsZWN0b3IpOiBFW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3Rvcjogc2VsZWN0b3IpOiAoSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdKVtdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXEoc2VsZWN0b3I6IHN0cmluZykge1xyXG5cdFx0XHRcdHJldHVybiBbLi4uKHRoaXM/LmRvY3VtZW50ID8/IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKV07XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgbmFtZXNwYWNlIERvY3VtZW50USB7XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IERvY3VtZW50LCBzZWxlY3RvcjogSyk6IEhUTUxFbGVtZW50VGFnTmFtZU1hcFtLXTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHE8UyBleHRlbmRzIHNlbGVjdG9yLCBOID0gVGFnTmFtZUZyb21TZWxlY3RvcjxTPj4odGhpczogRG9jdW1lbnQsIHNlbGVjdG9yOiBTKTogVGFnRWxlbWVudEZyb21UYWdOYW1lPE4+O1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxFIGV4dGVuZHMgRWxlbWVudD4odGhpczogRG9jdW1lbnQsIHNlbGVjdG9yOiBzZWxlY3Rvcik6IEU7XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IERvY3VtZW50LCBzZWxlY3Rvcjogc2VsZWN0b3IpOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxKHRoaXM6IERvY3VtZW50LCBzZWxlY3Rvcjogc3RyaW5nKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuZG9jdW1lbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXE8SyBleHRlbmRzIGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcD4odGhpczogRG9jdW1lbnQsIHNlbGVjdG9yOiBLKTogKEhUTUxFbGVtZW50VGFnTmFtZU1hcFtLXSlbXTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPFMgZXh0ZW5kcyBzZWxlY3RvciwgTiA9IFRhZ05hbWVGcm9tU2VsZWN0b3I8Uz4+KHRoaXM6IERvY3VtZW50LCBzZWxlY3RvcjogUyk6IFRhZ0VsZW1lbnRGcm9tVGFnTmFtZTxOPltdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXE8RSBleHRlbmRzIEVsZW1lbnQ+KHRoaXM6IERvY3VtZW50LCBzZWxlY3Rvcjogc2VsZWN0b3IpOiBFW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPih0aGlzOiBEb2N1bWVudCwgc2VsZWN0b3I6IHNlbGVjdG9yKTogKEhUTUxFbGVtZW50VGFnTmFtZU1hcFtLXSlbXTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxKHRoaXM6IERvY3VtZW50LCBzZWxlY3Rvcjogc3RyaW5nKSB7XHJcblx0XHRcdFx0cmV0dXJuIFsuLi50aGlzLmRvY3VtZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKV07XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgbmFtZXNwYWNlIEVsZW1lbnRRIHtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHE8SyBleHRlbmRzIGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcD4odGhpczogRWxlbWVudCwgc2VsZWN0b3I6IEspOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxPFMgZXh0ZW5kcyBzZWxlY3RvciwgTiA9IFRhZ05hbWVGcm9tU2VsZWN0b3I8Uz4+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBTKTogVGFnRWxlbWVudEZyb21UYWdOYW1lPE4+O1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcTxFIGV4dGVuZHMgRWxlbWVudD4odGhpczogRWxlbWVudCwgc2VsZWN0b3I6IHNlbGVjdG9yKTogRTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHE8SyBleHRlbmRzIGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcD4odGhpczogRWxlbWVudCwgc2VsZWN0b3I6IHNlbGVjdG9yKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcSh0aGlzOiBFbGVtZW50LCBzZWxlY3Rvcjogc3RyaW5nKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPih0aGlzOiBFbGVtZW50LCBzZWxlY3RvcjogSyk6IChIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10pW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcTxTIGV4dGVuZHMgc2VsZWN0b3IsIE4gPSBUYWdOYW1lRnJvbVNlbGVjdG9yPFM+Pih0aGlzOiBFbGVtZW50LCBzZWxlY3RvcjogUyk6IFRhZ0VsZW1lbnRGcm9tVGFnTmFtZTxOPltdO1xyXG5cdFx0XHRleHBvcnQgZnVuY3Rpb24gcXE8RSBleHRlbmRzIEVsZW1lbnQ+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBzZWxlY3Rvcik6IEVbXTtcclxuXHRcdFx0ZXhwb3J0IGZ1bmN0aW9uIHFxPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHRoaXM6IEVsZW1lbnQsIHNlbGVjdG9yOiBzZWxlY3Rvcik6IChIVE1MRWxlbWVudFRhZ05hbWVNYXBbS10pW107XHJcblx0XHRcdGV4cG9ydCBmdW5jdGlvbiBxcSh0aGlzOiBFbGVtZW50LCBzZWxlY3Rvcjogc3RyaW5nKSB7XHJcblx0XHRcdFx0cmV0dXJuIFsuLi50aGlzLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFbGVtZW50RXh0ZW5zaW9uIHtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBlbWl0PFQgZXh0ZW5kcyBDdXN0b21FdmVudDx7IF9ldmVudD86IHN0cmluZyB9Pj4odGhpczogRWxlbWVudCwgdHlwZTogVFsnZGV0YWlsJ11bJ19ldmVudCddLCBkZXRhaWw/OiBUWydkZXRhaWwnXSk7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZW1pdDxUPih0aGlzOiBFbGVtZW50LCB0eXBlOiBzdHJpbmcsIGRldGFpbD86IFQpIHtcclxuXHRcdFx0bGV0IGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KHR5cGUsIHtcclxuXHRcdFx0XHRidWJibGVzOiB0cnVlLFxyXG5cdFx0XHRcdGRldGFpbCxcclxuXHRcdFx0fSk7XHJcblx0XHRcdHRoaXMuZGlzcGF0Y2hFdmVudChldmVudCk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFRvPEUgZXh0ZW5kcyBFbGVtZW50Pih0aGlzOiBFLCBwYXJlbnQ6IEVsZW1lbnQgfCBzZWxlY3Rvcik6IEUge1xyXG5cdFx0XHRpZiAodHlwZW9mIHBhcmVudCA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdHBhcmVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IocGFyZW50KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRwYXJlbnQuYXBwZW5kKHRoaXMpO1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH1cclxuXHR9XHJcblxyXG59XHJcbiIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIEVsbSB7XHJcblx0XHR0eXBlIENoaWxkID0gTm9kZSB8IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW47XHJcblx0XHR0eXBlIFNvbWVFdmVudCA9IEV2ZW50ICYgTW91c2VFdmVudCAmIEtleWJvYXJkRXZlbnQgJiB7IHRhcmdldDogSFRNTEVsZW1lbnQgfTtcclxuXHRcdHR5cGUgTGlzdGVuZXIgPSAoKGV2ZW50OiBTb21lRXZlbnQpID0+IGFueSlcclxuXHRcdFx0JiB7IG5hbWU/OiBgJHsnJyB8ICdib3VuZCAnfSR7J29uJyB8ICcnfSR7a2V5b2YgSFRNTEVsZW1lbnRFdmVudE1hcH1gIHwgJycgfSB8ICgoZXZlbnQ6IFNvbWVFdmVudCkgPT4gYW55KTtcclxuXHJcblx0XHRjb25zdCBlbG1SZWdleCA9IG5ldyBSZWdFeHAoW1xyXG5cdFx0XHQvXig/PHRhZz5bXFx3LV0rKS8sXHJcblx0XHRcdC8jKD88aWQ+W1xcdy1dKykvLFxyXG5cdFx0XHQvXFwuKD88Y2xhc3M+W1xcdy1dKykvLFxyXG5cdFx0XHQvXFxbKD88YXR0cjE+W1xcdy1dKylcXF0vLFxyXG5cdFx0XHQvXFxbKD88YXR0cjI+W1xcdy1dKyk9KD8hWydcIl0pKD88dmFsMj5bXlxcXV0qKVxcXS8sXHJcblx0XHRcdC9cXFsoPzxhdHRyMz5bXFx3LV0rKT1cIig/PHZhbDM+KD86W15cIl18XFxcXFwiKSopXCJcXF0vLFxyXG5cdFx0XHQvXFxbKD88YXR0cjQ+W1xcdy1dKyk9XCIoPzx2YWw0Pig/OlteJ118XFxcXCcpKilcIlxcXS8sXHJcblx0XHRdLm1hcChlID0+IGUuc291cmNlKS5qb2luKCd8JyksICdnJyk7XHJcblxyXG5cdFx0LyoqIGlmIGBlbG1gIHNob3VsZCBkaXNhbGxvdyBsaXN0ZW5lcnMgbm90IGV4aXN0aW5nIGFzIGBvbiAqIGAgcHJvcGVydHkgb24gdGhlIGVsZW1lbnQgKi9cclxuXHRcdGV4cG9ydCBsZXQgYWxsb3dPbmx5RXhpc3RpbmdMaXN0ZW5lcnMgPSB0cnVlO1xyXG5cclxuXHRcdC8qKiBpZiBgZWxtYCBzaG91bGQgYWxsb3cgb3ZlcnJpZGluZyBgb24gKiBgIGxpc3RlbmVycyBpZiBtdWx0aXBsZSBvZiB0aGVtIGFyZSBwcm92aWRlZCAqL1xyXG5cdFx0ZXhwb3J0IGxldCBhbGxvd092ZXJyaWRlT25MaXN0ZW5lcnMgPSBmYWxzZTtcclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHNlbGVjdG9yOiBLLCAuLi5jaGlsZHJlbjogKENoaWxkIHwgTGlzdGVuZXIpW10pOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbS107XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KHNlbGVjdG9yOiBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXAgZXh0ZW5kcyBLID8gbmV2ZXIgOiBzZWxlY3RvciwgLi4uY2hpbGRyZW46IChDaGlsZCB8IExpc3RlbmVyKVtdKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGVsbTxTIGV4dGVuZHMgc2VsZWN0b3IsIE4gPSBUYWdOYW1lRnJvbVNlbGVjdG9yPFM+PihzZWxlY3RvcjogUywgLi4uY2hpbGRyZW46IChDaGlsZCB8IExpc3RlbmVyKVtdKTogVGFnRWxlbWVudEZyb21UYWdOYW1lPE4+O1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGVsbTxFIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50PihzZWxlY3Rvcjogc2VsZWN0b3IsIC4uLmNoaWxkcmVuOiAoQ2hpbGQgfCBMaXN0ZW5lcilbXSk6IEU7XHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZWxtKCk6IEhUTUxEaXZFbGVtZW50O1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGVsbShzZWxlY3Rvcjogc3RyaW5nID0gJycsIC4uLmNoaWxkcmVuOiAoQ2hpbGQgfCBMaXN0ZW5lcilbXSk6IEhUTUxFbGVtZW50IHtcclxuXHRcdFx0aWYgKHNlbGVjdG9yLnJlcGxhY2VBbGwoZWxtUmVnZXgsICcnKSAhPSAnJykge1xyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBzZWxlY3RvcjogJHtzZWxlY3Rvcn0gYCk7XHJcblx0XHRcdH1cclxuXHRcdFx0bGV0IGVsZW1lbnQ6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0XHRcdC8vIGxldCB0YWcgPSAnJztcclxuXHRcdFx0Ly8gbGV0IGZpcnN0TWF0Y2ggPSBmYWxzZTtcclxuXHRcdFx0Zm9yIChsZXQgbWF0Y2ggb2Ygc2VsZWN0b3IubWF0Y2hBbGwoZWxtUmVnZXgpKSB7XHJcblx0XHRcdFx0aWYgKG1hdGNoLmdyb3Vwcy50YWcpIHtcclxuXHRcdFx0XHRcdC8vIGlmICh0YWcgJiYgbWF0Y2guZ3JvdXBzLnRhZyAhPSB0YWcpIHtcclxuXHRcdFx0XHRcdC8vIFx0dGhyb3cgbmV3IEVycm9yKGBzZWxlY3RvciBoYXMgdHdvIGRpZmZlcmVudCB0YWdzIGF0IG9uY2UgOiA8JHt0YWd9PiBhbmQgPCR7bWF0Y2guZ3JvdXBzLnRhZ30+YCk7XHJcblx0XHRcdFx0XHQvLyB9XHJcblx0XHRcdFx0XHQvLyB0YWcgPSBtYXRjaC5ncm91cHMudGFnO1xyXG5cdFx0XHRcdFx0Ly8gaWYgKCFmaXJzdE1hdGNoKSByZXR1cm4gZWxtKHRhZyArIHNlbGVjdG9yLCAuLi5jaGlsZHJlbik7XHJcblx0XHRcdFx0XHRlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChtYXRjaC5ncm91cHMudGFnKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5pZCkge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5pZCA9IG1hdGNoLmdyb3Vwcy5pZDtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5jbGFzcykge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKG1hdGNoLmdyb3Vwcy5jbGFzcyk7XHJcblx0XHRcdFx0fSBlbHNlIGlmIChtYXRjaC5ncm91cHMuYXR0cjEpIHtcclxuXHRcdFx0XHRcdGVsZW1lbnQuc2V0QXR0cmlidXRlKG1hdGNoLmdyb3Vwcy5hdHRyMSwgXCJ0cnVlXCIpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAobWF0Y2guZ3JvdXBzLmF0dHIyKSB7XHJcblx0XHRcdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZShtYXRjaC5ncm91cHMuYXR0cjIsIG1hdGNoLmdyb3Vwcy52YWwyKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKG1hdGNoLmdyb3Vwcy5hdHRyMykge1xyXG5cdFx0XHRcdFx0ZWxlbWVudC5zZXRBdHRyaWJ1dGUobWF0Y2guZ3JvdXBzLmF0dHIzLCBtYXRjaC5ncm91cHMudmFsMy5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAobWF0Y2guZ3JvdXBzLmF0dHI0KSB7XHJcblx0XHRcdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZShtYXRjaC5ncm91cHMuYXR0cjQsIG1hdGNoLmdyb3Vwcy52YWw0LnJlcGxhY2UoL1xcXFwnL2csICdcXCcnKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIGZpcnN0TWF0Y2ggPSBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRmb3IgKGxldCBsaXN0ZW5lciBvZiBjaGlsZHJlbi5maWx0ZXIoZSA9PiB0eXBlb2YgZSA9PSAnZnVuY3Rpb24nKSBhcyBMaXN0ZW5lcltdKSB7XHJcblx0XHRcdFx0bGV0IG5hbWU6IHN0cmluZyA9IGxpc3RlbmVyLm5hbWU7XHJcblx0XHRcdFx0aWYgKCFuYW1lKSBuYW1lID0gKGxpc3RlbmVyICsgJycpLm1hdGNoKC9cXGIoPyFmdW5jdGlvblxcYilcXHcrLylbMF07XHJcblx0XHRcdFx0aWYgKCFuYW1lKSB0aHJvdyBuZXcgRXJyb3IoJ3RyeWluZyB0byBiaW5kIHVubmFtZWQgZnVuY3Rpb24nKTtcclxuXHRcdFx0XHRpZiAobmFtZS5zdGFydHNXaXRoKCdib3VuZCAnKSkgbmFtZSA9IG5hbWUuc2xpY2UoJ2JvdW5kICcubGVuZ3RoKTtcclxuXHRcdFx0XHRpZiAobmFtZS5zdGFydHNXaXRoKCdvbicpKSB7XHJcblx0XHRcdFx0XHRpZiAoIWVsZW1lbnQuaGFzT3duUHJvcGVydHkobmFtZSkpIHRocm93IG5ldyBFcnJvcihgPCAke2VsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpfT4gZG9lcyBub3QgaGF2ZSBcIiR7bmFtZX1cIiBsaXN0ZW5lcmApO1xyXG5cdFx0XHRcdFx0aWYgKCFhbGxvd092ZXJyaWRlT25MaXN0ZW5lcnMgJiYgZWxlbWVudFtuYW1lXSkgdGhyb3cgbmV3IEVycm9yKCdvdmVycmlkaW5nIGBvbiAqIGAgbGlzdGVuZXJzIGlzIGRpc2FibGVkJyk7XHJcblx0XHRcdFx0XHRlbGVtZW50W25hbWVdID0gbGlzdGVuZXI7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGlmIChhbGxvd09ubHlFeGlzdGluZ0xpc3RlbmVycyAmJiBlbGVtZW50WydvbicgKyBuYW1lXSA9PT0gdW5kZWZpbmVkKVxyXG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYDwke2VsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpfT4gZG9lcyBub3QgaGF2ZSBcIm9uJyR7bmFtZX0nXCIgbGlzdGVuZXJgKTtcclxuXHRcdFx0XHRcdGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBsaXN0ZW5lcik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsZW1lbnQuYXBwZW5kKC4uLmNoaWxkcmVuLmZpbHRlcihlID0+IHR5cGVvZiBlICE9ICdmdW5jdGlvbicpIGFzIChOb2RlIHwgc3RyaW5nKVtdKTtcclxuXHRcdFx0cmV0dXJuIGVsZW1lbnQ7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFPckVsbTxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPihzZWxlY3RvcjogSywgcGFyZW50PzogUGFyZW50Tm9kZSB8IHNlbGVjdG9yKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFPckVsbTxTIGV4dGVuZHMgc2VsZWN0b3IsIE4gPSBUYWdOYW1lRnJvbVNlbGVjdG9yPFM+PihzZWxlY3RvcjogUywgcGFyZW50PzogUGFyZW50Tm9kZSB8IHNlbGVjdG9yKTogVGFnRWxlbWVudEZyb21UYWdOYW1lPE4+O1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFPckVsbTxFIGV4dGVuZHMgRWxlbWVudCA9IEhUTUxFbGVtZW50PihzZWxlY3Rvcjogc3RyaW5nLCBwYXJlbnQ/OiBQYXJlbnROb2RlIHwgc2VsZWN0b3IpOiBFO1xyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHFPckVsbShzZWxlY3Rvcjogc3RyaW5nLCBwYXJlbnQ/OiBQYXJlbnROb2RlIHwgc3RyaW5nKSB7XHJcblx0XHRcdGlmICh0eXBlb2YgcGFyZW50ID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0cGFyZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihwYXJlbnQpIGFzIFBhcmVudE5vZGU7XHJcblx0XHRcdFx0aWYgKCFwYXJlbnQpIHRocm93IG5ldyBFcnJvcignZmFpbGVkIHRvIGZpbmQgcGFyZW50IGVsZW1lbnQnKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoc2VsZWN0b3IuaW5jbHVkZXMoJz4nKSkge1xyXG5cdFx0XHRcdGxldCBwYXJlbnRTZWxlY3RvciA9IHNlbGVjdG9yLnNwbGl0KCc+Jykuc2xpY2UoMCwgLTEpLmpvaW4oJz4nKTtcclxuXHRcdFx0XHRzZWxlY3RvciA9IHNlbGVjdG9yLnNwbGl0KCc+JykucG9wKCk7XHJcblx0XHRcdFx0cGFyZW50ID0gKHBhcmVudCB8fCBkb2N1bWVudCkucXVlcnlTZWxlY3RvcihwYXJlbnRTZWxlY3RvcikgYXMgUGFyZW50Tm9kZTtcclxuXHRcdFx0XHRpZiAoIXBhcmVudCkgdGhyb3cgbmV3IEVycm9yKCdmYWlsZWQgdG8gZmluZCBwYXJlbnQgZWxlbWVudCcpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGxldCBjaGlsZCA9IChwYXJlbnQgfHwgZG9jdW1lbnQpLnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xyXG5cdFx0XHRpZiAoY2hpbGQpIHJldHVybiBjaGlsZDtcclxuXHJcblx0XHRcdGNoaWxkID0gZWxtKHNlbGVjdG9yKTtcclxuXHRcdFx0cGFyZW50Py5hcHBlbmQoY2hpbGQpO1xyXG5cdFx0XHRyZXR1cm4gY2hpbGQ7XHJcblx0XHR9XHJcblx0fVxyXG5cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cdGV4cG9ydCBsZXQgZGVidWcgPSBmYWxzZTtcclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBldGMge1xyXG5cclxuXHJcblx0XHRleHBvcnQgYXN5bmMgZnVuY3Rpb24gZnVsbHNjcmVlbihvbj86IGJvb2xlYW4pIHtcclxuXHRcdFx0bGV0IGNlbnRyYWwgPSBJbWFnZVNjcm9sbGluZ0V4dGVuc2lvbi5pbWFnZVNjcm9sbGluZ0FjdGl2ZSAmJiBJbWFnZVNjcm9sbGluZ0V4dGVuc2lvbi5nZXRDZW50cmFsSW1nKCk7XHJcblx0XHRcdGlmICghZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQpIHtcclxuXHRcdFx0XHRpZiAob24gPT0gZmFsc2UpIHJldHVybjtcclxuXHRcdFx0XHRhd2FpdCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4oKS5jYXRjaCgoKSA9PiB7IH0pO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGlmIChvbiA9PSB0cnVlKSByZXR1cm47XHJcblx0XHRcdFx0YXdhaXQgZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4oKS5jYXRjaCgoKSA9PiB7IH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChjZW50cmFsKSB7XHJcblx0XHRcdFx0Y2VudHJhbC5zY3JvbGxJbnRvVmlldygpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiAhIWRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50O1xyXG5cdFx0fVxyXG5cclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gaGFzaENvZGUodGhpczogc3RyaW5nKTtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBoYXNoQ29kZSh2YWx1ZTogc3RyaW5nKTtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBoYXNoQ29kZSh0aGlzOiBzdHJpbmcsIHZhbHVlPzogc3RyaW5nKSB7XHJcblx0XHRcdHZhbHVlID8/PSB0aGlzO1xyXG5cdFx0XHRsZXQgaGFzaCA9IDA7XHJcblx0XHRcdGZvciAobGV0IGMgb2YgdmFsdWUpIHtcclxuXHRcdFx0XHRoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgKyBjLmNoYXJDb2RlQXQoMCk7XHJcblx0XHRcdFx0aGFzaCA9IGhhc2ggJiBoYXNoO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBoYXNoO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBpbml0KCkge1xyXG5cdFx0XHQvLyBTdHJpbmcucHJvdG90eXBlLmhhc2hDb2RlID0gaGFzaENvZGU7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGN1cnJlbnRTY3JpcHRIYXNoKCkge1xyXG5cdFx0XHRyZXR1cm4gaGFzaENvZGUoZG9jdW1lbnQuY3VycmVudFNjcmlwdC5pbm5lckhUTUwpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiByZWxvYWRPbkN1cnJlbnRTY3JpcHRDaGFuZ2VkKHNjcmlwdE5hbWU6IHN0cmluZyA9IGxvY2F0aW9uLmhvc3RuYW1lICsgJy51anMnKSB7XHJcblx0XHRcdGxldCBzY3JpcHRJZCA9IGByZWxvYWRPbkN1cnJlbnRTY3JpcHRDaGFuZ2VkXyR7c2NyaXB0TmFtZX1gO1xyXG5cdFx0XHRsZXQgc2NyaXB0SGFzaCA9IGN1cnJlbnRTY3JpcHRIYXNoKCkgKyAnJztcclxuXHRcdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oc2NyaXB0SWQsIHNjcmlwdEhhc2gpO1xyXG5cdFx0XHRhZGRFdmVudExpc3RlbmVyKCdmb2N1cycsICgpID0+IHtcclxuXHRcdFx0XHRpZiAobG9jYWxTdG9yYWdlLmdldEl0ZW0oc2NyaXB0SWQpICE9IHNjcmlwdEhhc2gpIHtcclxuXHRcdFx0XHRcdGxvY2F0aW9uLnJlbG9hZCgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGxldCBmYXN0U2Nyb2xsOiB7XHJcblx0XHRcdChzcGVlZD86IG51bWJlcik6IHZvaWQ7XHJcblx0XHRcdHNwZWVkPzogbnVtYmVyO1xyXG5cdFx0XHRhY3RpdmU/OiBib29sZWFuO1xyXG5cdFx0XHRvZmY/OiAoKSA9PiB2b2lkO1xyXG5cdFx0fSA9IGZ1bmN0aW9uIChzcGVlZCA9IDAuMjUpIHtcclxuXHRcdFx0aWYgKGZhc3RTY3JvbGwuYWN0aXZlKSBmYXN0U2Nyb2xsLm9mZigpO1xyXG5cdFx0XHRmYXN0U2Nyb2xsLmFjdGl2ZSA9IHRydWU7XHJcblx0XHRcdGZhc3RTY3JvbGwuc3BlZWQgPSBzcGVlZDtcclxuXHRcdFx0ZnVuY3Rpb24gb253aGVlbChldmVudDogV2hlZWxFdmVudCkge1xyXG5cdFx0XHRcdGlmIChldmVudC5kZWZhdWx0UHJldmVudGVkKSByZXR1cm47XHJcblx0XHRcdFx0aWYgKGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQuc2hpZnRLZXkpIHJldHVybjtcclxuXHRcdFx0XHRzY3JvbGxCeSgwLCAtTWF0aC5zaWduKGV2ZW50LmRlbHRhWSkgKiBpbm5lckhlaWdodCAqIGZhc3RTY3JvbGwuc3BlZWQpO1xyXG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdH1cclxuXHRcdFx0YWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCBvbndoZWVsLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHRmYXN0U2Nyb2xsLm9mZiA9ICgpID0+IHtcclxuXHRcdFx0XHRmYXN0U2Nyb2xsLmFjdGl2ZSA9IGZhbHNlO1xyXG5cdFx0XHRcdHJlbW92ZUV2ZW50TGlzdGVuZXIoJ3doZWVsJywgb253aGVlbCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGZhc3RTY3JvbGwuYWN0aXZlID0gZmFsc2U7XHJcblx0XHRmYXN0U2Nyb2xsLm9mZiA9ICgpID0+IHsgfTtcclxuXHJcblxyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBvbnJhZihmOiAoKSA9PiB2b2lkKSB7XHJcblx0XHRcdGxldCBsb29wID0gdHJ1ZTtcclxuXHRcdFx0dm9pZCBhc3luYyBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0d2hpbGUgKGxvb3ApIHtcclxuXHRcdFx0XHRcdGF3YWl0IFByb21pc2UuZnJhbWUoKTtcclxuXHRcdFx0XHRcdGYoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0oKTtcclxuXHRcdFx0cmV0dXJuICgpID0+IHsgbG9vcCA9IGZhbHNlIH07XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IHJlc2l6ZU9ic2VydmVyOiBSZXNpemVPYnNlcnZlcjtcclxuXHRcdGxldCByZXNpemVMaXN0ZW5lcnM6ICgobmV3SGVpZ2h0OiBudW1iZXIsIG9sZEhlaWdodDogbnVtYmVyKSA9PiB2b2lkKVtdID0gW107XHJcblx0XHRsZXQgcHJldmlvdXNCb2R5SGVpZ2h0ID0gMDtcclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBvbmhlaWdodGNoYW5nZShmOiAobmV3SGVpZ2h0OiBudW1iZXIsIG9sZEhlaWdodDogbnVtYmVyKSA9PiB2b2lkKSB7XHJcblx0XHRcdGlmICghcmVzaXplT2JzZXJ2ZXIpIHtcclxuXHRcdFx0XHRwcmV2aW91c0JvZHlIZWlnaHQgPSBkb2N1bWVudC5ib2R5LmNsaWVudEhlaWdodDtcclxuXHRcdFx0XHRyZXNpemVPYnNlcnZlciA9IG5ldyBSZXNpemVPYnNlcnZlcihlbnRyaWVzID0+IHtcclxuXHRcdFx0XHRcdGZvciAobGV0IGUgb2YgZW50cmllcykge1xyXG5cdFx0XHRcdFx0XHRpZiAoZS50YXJnZXQgIT0gZG9jdW1lbnQuYm9keSkgY29udGludWU7XHJcblxyXG5cdFx0XHRcdFx0XHRsZXQgbmV3Qm9keUhlaWdodCA9IGUudGFyZ2V0LmNsaWVudEhlaWdodDtcclxuXHRcdFx0XHRcdFx0Zm9yIChsZXQgZiBvZiByZXNpemVMaXN0ZW5lcnMpIHtcclxuXHRcdFx0XHRcdFx0XHRmKG5ld0JvZHlIZWlnaHQsIHByZXZpb3VzQm9keUhlaWdodCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0cHJldmlvdXNCb2R5SGVpZ2h0ID0gbmV3Qm9keUhlaWdodDtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHRyZXNpemVPYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJlc2l6ZUxpc3RlbmVycy5wdXNoKGYpO1xyXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoKSB7XHJcblx0XHRcdFx0cmVzaXplTGlzdGVuZXJzLnNwbGljZShyZXNpemVMaXN0ZW5lcnMuaW5kZXhPZihmKSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgZGVjbGFyZSBjb25zdCBrZHM6IHtcclxuXHRcdFx0W2s6IHN0cmluZ106IHN0cmluZyB8ICgoZTogS2V5Ym9hcmRFdmVudCAmIE1vdXNlRXZlbnQpID0+IHZvaWQpXHJcblx0XHR9O1xyXG5cclxuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShldGMsICdrZHMnLCB7XHJcblx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdFx0Z2V0KCkge1xyXG5cdFx0XHRcdGxldCBrZHMgPSBpbml0S2RzKCk7XHJcblx0XHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV0YywgJ2tkcycsIHsgdmFsdWU6IGtkcyB9KTtcclxuXHRcdFx0XHRyZXR1cm4ga2RzO1xyXG5cdFx0XHR9LFxyXG5cdFx0fSk7XHJcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoUG9vcEpzLCAna2RzJywge1xyXG5cdFx0XHRjb25maWd1cmFibGU6IHRydWUsXHJcblx0XHRcdGVudW1lcmFibGU6IHRydWUsXHJcblx0XHRcdGdldDogKCkgPT4gZXRjLmtkcyxcclxuXHRcdFx0c2V0OiAodikgPT4gT2JqZWN0LmFzc2lnbihldGMua2RzLCB2KSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUtkc0NvZGVzKGU6IEtleWJvYXJkRXZlbnQgJiBNb3VzZUV2ZW50KSB7XHJcblx0XHRcdGxldCBiYXNlUHJlZml4ID0gYCR7ZS5zaGlmdEtleSA/ICc8JyA6ICcnfSR7ZS5jdHJsS2V5ID8gJ14nIDogJyd9JHtlLmFsdEtleSA/ICc+JyA6ICcnfWA7XHJcblx0XHRcdGxldCBiYXNlQ29kZSA9IGUuY29kZVxyXG5cdFx0XHRcdD8gZS5jb2RlLnJlcGxhY2UoL0tleXxEaWdpdHxBcnJvd3xMZWZ0fFJpZ2h0LywgJycpXHJcblx0XHRcdFx0OiBbJ0xNQicsICdSTUInLCAnTU1CJ11bZS5idXR0b25dO1xyXG5cdFx0XHRsZXQgZXh0cmFDb2RlID0gZS5jb2RlXHJcblx0XHRcdFx0PyBiYXNlQ29kZS5yZXBsYWNlKCdDb250cm9sJywgJ0N0cmwnKVxyXG5cdFx0XHRcdDogYmFzZUNvZGU7Ly8gWydMZWZ0JywgJ1JpZ2h0JywgJ01pZGRsZSddW2UuYnV0dG9uXTtcclxuXHRcdFx0bGV0IHJhd0NvZGUgPSBlLmNvZGUgPz8gYmFzZUNvZGU7XHJcblx0XHRcdGxldCBrZXlDb2RlID0gZS5rZXkgPz8gYmFzZUNvZGU7XHJcblx0XHRcdGxldCBleHRyYVByZWZpeCA9IGJhc2VQcmVmaXgucmVwbGFjZShcclxuXHRcdFx0XHRiYXNlQ29kZSA9PSAnU2hpZnQnID8gJzwnIDogYmFzZUNvZGUgPT0gJ0NvbnRyb2wnID8gJ14nIDogYmFzZUNvZGUgPT0gJ0FsdCcgPyAnPicgOiAnJ1xyXG5cdFx0XHRcdCwgJycpO1xyXG5cclxuXHRcdFx0bGV0IGNvZGVzID0gW2Jhc2VDb2RlLCBleHRyYUNvZGUsIHJhd0NvZGUsIGtleUNvZGVdLmZsYXRNYXAoXHJcblx0XHRcdFx0YyA9PiBbYmFzZVByZWZpeCwgZXh0cmFQcmVmaXhdLm1hcChwID0+IHAgKyBjKVxyXG5cdFx0XHQpO1xyXG5cdFx0XHQvLy5mbGF0TWFwKGUgPT4gW2UsIGUudG9VcHBlckNhc2UoKSwgZS50b0xvd2VyQ2FzZSgpXSk7XHJcblx0XHRcdGNvZGVzLnB1c2goZS5jb2RlID8gJ2tleScgOiAnbW91c2UnKTtcclxuXHRcdFx0Y29kZXMucHVzaCgnYW55Jyk7XHJcblx0XHRcdHJldHVybiBBcnJheS5mcm9tKG5ldyBTZXQoY29kZXMpKTtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBrZHNMaXN0ZW5lcihlOiBLZXlib2FyZEV2ZW50ICYgTW91c2VFdmVudCkge1xyXG5cdFx0XHRsZXQgY29kZXMgPSBnZW5lcmF0ZUtkc0NvZGVzKGUpO1xyXG5cdFx0XHRPYmplY3QuYXNzaWduKGUsIHsgX2NvZGVzOiBjb2RlcyB9KTtcclxuXHRcdFx0Zm9yIChsZXQgYyBvZiBjb2Rlcykge1xyXG5cdFx0XHRcdGxldCBsaXN0ZW5lciA9IGV0Yy5rZHNbY107XHJcblx0XHRcdFx0aWYgKHR5cGVvZiBsaXN0ZW5lciA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0cShsaXN0ZW5lcikuY2xpY2soKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBsaXN0ZW5lciA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHQoZXRjLmtkc1tjXSBhcyBhbnkpKGUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZnVuY3Rpb24gaW5pdEtkcygpIHtcclxuXHRcdFx0YWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGtkc0xpc3RlbmVyKTtcclxuXHRcdFx0YWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywga2RzTGlzdGVuZXIpO1xyXG5cdFx0XHRyZXR1cm4ge307XHJcblx0XHR9XHJcblx0fVxyXG5cdGV4cG9ydCBkZWNsYXJlIGxldCBrZHM6IHR5cGVvZiBldGMua2RzO1xyXG59XHJcblxyXG4iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblx0ZXhwb3J0IHR5cGUgZGVsdGFUaW1lID0gbnVtYmVyIHwgYCR7bnVtYmVyfSR7J3MnIHwgJ2gnIHwgJ2QnIHwgJ3cnIHwgJ3knfWAgfCBudWxsO1xyXG5cclxuXHRleHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplRGVsdGFUaW1lKG1heEFnZTogZGVsdGFUaW1lKSB7XHJcblx0XHRpZiAodHlwZW9mIG1heEFnZSA9PSAnbnVtYmVyJykgcmV0dXJuIG1heEFnZTtcclxuXHRcdGlmICh0eXBlb2YgbWF4QWdlICE9ICdzdHJpbmcnKSByZXR1cm4gSW5maW5pdHk7XHJcblx0XHRjb25zdCBhVG9NID0geyBzOiAxZTMsIGg6IDM2MDBlMywgZDogMjQgKiAzNjAwZTMsIHc6IDcgKiAyNCAqIDM2MDBlMywgeTogMzY1ICogMjQgKiAzNjAwZTMgfTtcclxuXHRcdGxldCBuID0gcGFyc2VGbG9hdChtYXhBZ2UpO1xyXG5cdFx0bGV0IG0gPSBhVG9NW21heEFnZVttYXhBZ2UubGVuZ3RoIC0gMV1dO1xyXG5cdFx0aWYgKG4gIT0gbiB8fCAhbSkgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIGRlbHRhVGltZScpO1xyXG5cdFx0cmV0dXJuIG4gKiBtO1xyXG5cdH1cclxuXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBGZXRjaEV4dGVuc2lvbiB7XHJcblx0XHRleHBvcnQgdHlwZSBSZXF1ZXN0SW5pdEV4ID0gUmVxdWVzdEluaXQgJiB7XHJcblx0XHRcdG1heEFnZT86IGRlbHRhVGltZSxcclxuXHRcdFx0eG1sPzogYm9vbGVhbixcclxuXHRcdFx0Y2FjaGVVcmw/OiBzdHJpbmcgfCAncG9zdCcgJiB7IF8/OiAncG9zdCcgfSxcclxuXHRcdH07XHJcblx0XHRleHBvcnQgdHlwZSBSZXF1ZXN0SW5pdEV4SnNvbiA9IFJlcXVlc3RJbml0ICYgeyBtYXhBZ2U/OiBkZWx0YVRpbWUsIGluZGV4ZWREYj86IGJvb2xlYW4gfTtcclxuXHRcdGV4cG9ydCBsZXQgZGVmYXVsdHM6IFJlcXVlc3RJbml0ID0geyBjcmVkZW50aWFsczogJ2luY2x1ZGUnIH07XHJcblxyXG5cdFx0ZXhwb3J0IGxldCBjYWNoZTogQ2FjaGUgPSBudWxsO1xyXG5cdFx0YXN5bmMgZnVuY3Rpb24gb3BlbkNhY2hlKCkge1xyXG5cdFx0XHRpZiAoY2FjaGUpIHJldHVybiBjYWNoZTtcclxuXHRcdFx0Y2FjaGUgPSBhd2FpdCBjYWNoZXMub3BlbignZmV0Y2gnKTtcclxuXHRcdFx0cmV0dXJuIGNhY2hlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIHRvRHVyKGR0OiBkZWx0YVRpbWUpIHtcclxuXHRcdFx0ZHQgPSBub3JtYWxpemVEZWx0YVRpbWUoZHQpO1xyXG5cdFx0XHRpZiAoZHQgPiAxZTEwKSBkdCA9IERhdGUubm93KCkgLSBkdDtcclxuXHRcdFx0bGV0IHNwbGl0ID0gKG46IG51bWJlciwgZDogbnVtYmVyKSA9PiBbbiAlIGQsIH5+KG4gLyBkKV07XHJcblx0XHRcdGxldCB0bzIgPSAobjogbnVtYmVyKSA9PiAobiArICcnKS5wYWRTdGFydCgyLCAnMCcpO1xyXG5cdFx0XHR2YXIgW21zLCBzXSA9IHNwbGl0KGR0LCAxMDAwKTtcclxuXHRcdFx0dmFyIFtzLCBtXSA9IHNwbGl0KHMsIDYwKTtcclxuXHRcdFx0dmFyIFttLCBoXSA9IHNwbGl0KG0sIDYwKTtcclxuXHRcdFx0dmFyIFtoLCBkXSA9IHNwbGl0KGgsIDI0KTtcclxuXHRcdFx0dmFyIFtkLCB3XSA9IHNwbGl0KGQsIDcpO1xyXG5cdFx0XHRyZXR1cm4gdyA+IDFlMyA/ICdmb3JldmVyJyA6IHcgPyBgJHt3fXcke2R9ZGAgOiBkID8gYCR7ZH1kJHt0bzIoaCl9aGAgOiBoICsgbSA/IGAke3RvMihoKX06JHt0bzIobSl9OiR7dG8yKHMpfWAgOiBgJHtzICsgfn5tcyAvIDEwMDB9c2A7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGlzU3RhbGUoY2FjaGVkQXQ6IG51bWJlciwgbWF4QWdlPzogZGVsdGFUaW1lKSB7XHJcblx0XHRcdGlmIChtYXhBZ2UgPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRyZXR1cm4gRGF0ZS5ub3coKSAtIGNhY2hlZEF0ID49IG5vcm1hbGl6ZURlbHRhVGltZShtYXhBZ2UpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWNoZWQodXJsOiBzdHJpbmcsIGluaXQ6IFJlcXVlc3RJbml0RXggPSB7fSk6IFByb21pc2U8UmVzcG9uc2U+IHtcclxuXHRcdFx0bGV0IG5vdyA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG5cdFx0XHRsZXQgY2FjaGUgPSBhd2FpdCBvcGVuQ2FjaGUoKTtcclxuXHRcdFx0bGV0IGNhY2hlVXJsID0gKGluaXQuY2FjaGVVcmwgPz8gdXJsKSArICcnO1xyXG5cdFx0XHRpZiAoIWNhY2hlVXJsLnN0YXJ0c1dpdGgoJ2h0dHAnKSkgY2FjaGVVcmwgPSB1cmwgKyAnJiZjYWNoZVVybD0nICsgY2FjaGVVcmw7XHJcblx0XHRcdGxldCByZXNwb25zZSA9IGF3YWl0IGNhY2hlLm1hdGNoKGNhY2hlVXJsKTtcclxuXHRcdFx0aWYgKHJlc3BvbnNlKSB7XHJcblx0XHRcdFx0cmVzcG9uc2UuY2FjaGVkQXQgPSArcmVzcG9uc2UuaGVhZGVycy5nZXQoJ2NhY2hlZC1hdCcpIHx8IDA7XHJcblx0XHRcdFx0aWYgKCFpc1N0YWxlKHJlc3BvbnNlLmNhY2hlZEF0LCBub3JtYWxpemVEZWx0YVRpbWUoaW5pdC5tYXhBZ2UpKSkge1xyXG5cdFx0XHRcdFx0UG9vcEpzLmRlYnVnICYmIGNvbnNvbGUubG9nKGBDYWNoZWQgcmVzcG9uc2U6ICR7dG9EdXIocmVzcG9uc2UuY2FjaGVkQXQpfSA8IGM6JHt0b0R1cihpbml0Lm1heEFnZSl9YCwgdXJsKTtcclxuXHRcdFx0XHRcdHJldHVybiByZXNwb25zZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0UG9vcEpzLmRlYnVnICYmIGNvbnNvbGUubG9nKGBTdGFsZSByZXNwb25zZTogJHt0b0R1cihyZXNwb25zZS5jYWNoZWRBdCl9ID4gYzoke3RvRHVyKGluaXQubWF4QWdlKX1gLCB1cmwpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJlc3BvbnNlID1cclxuXHRcdFx0XHQhaW5pdC54bWwgPyBhd2FpdCBmZXRjaCh1cmwsIHsgLi4uZGVmYXVsdHMsIC4uLmluaXQgfSlcclxuXHRcdFx0XHRcdDogYXdhaXQgeG1sUmVzcG9uc2UodXJsLCBpbml0KTtcclxuXHRcdFx0aWYgKHJlc3BvbnNlLm9rKSB7XHJcblx0XHRcdFx0cmVzcG9uc2UuY2FjaGVkQXQgPSBEYXRlLm5vdygpO1xyXG5cdFx0XHRcdGxldCBjbG9uZSA9IHJlc3BvbnNlLmNsb25lKCk7XHJcblx0XHRcdFx0bGV0IGluaXQyOiBSZXNwb25zZUluaXQgPSB7XHJcblx0XHRcdFx0XHRzdGF0dXM6IGNsb25lLnN0YXR1cywgc3RhdHVzVGV4dDogY2xvbmUuc3RhdHVzVGV4dCxcclxuXHRcdFx0XHRcdGhlYWRlcnM6IFtbJ2NhY2hlZC1hdCcsIGAke3Jlc3BvbnNlLmNhY2hlZEF0fWBdLCAuLi5jbG9uZS5oZWFkZXJzLmVudHJpZXMoKV1cclxuXHRcdFx0XHR9O1xyXG5cdFx0XHRcdGxldCByZXN1bHRSZXNwb25zZSA9IG5ldyBSZXNwb25zZShjbG9uZS5ib2R5LCBpbml0Mik7XHJcblx0XHRcdFx0Y2FjaGUucHV0KGNhY2hlVXJsLCByZXN1bHRSZXNwb25zZSk7XHJcblx0XHRcdFx0bGV0IGR0ID0gcGVyZm9ybWFuY2Uubm93KCkgLSBub3c7XHJcblx0XHRcdFx0UG9vcEpzLmRlYnVnICYmIGNvbnNvbGUubG9nKGBMb2FkZWQgcmVzcG9uc2U6ICR7dG9EdXIoZHQpfSAvIGM6JHt0b0R1cihpbml0Lm1heEFnZSl9YCwgdXJsKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRQb29wSnMuZGVidWcgJiYgY29uc29sZS5sb2coYEZhaWxlZCByZXNwb25zZTogJHt0b0R1cihyZXNwb25zZS5jYWNoZWRBdCl9IC8gYzoke3RvRHVyKGluaXQubWF4QWdlKX1gLCB1cmwpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiByZXNwb25zZTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FjaGVkRG9jKHVybDogc3RyaW5nLCBpbml0OiBSZXF1ZXN0SW5pdEV4ID0ge30pOiBQcm9taXNlPERvY3VtZW50PiB7XHJcblx0XHRcdGxldCByZXNwb25zZSA9IGF3YWl0IGNhY2hlZCh1cmwsIGluaXQpO1xyXG5cdFx0XHRsZXQgdGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcclxuXHRcdFx0bGV0IHBhcnNlciA9IG5ldyBET01QYXJzZXIoKTtcclxuXHRcdFx0bGV0IGRvYyA9IHBhcnNlci5wYXJzZUZyb21TdHJpbmcodGV4dCwgJ3RleHQvaHRtbCcpO1xyXG5cdFx0XHRsZXQgYmFzZSA9IGRvYy5jcmVhdGVFbGVtZW50KCdiYXNlJyk7XHJcblx0XHRcdGJhc2UuaHJlZiA9IHVybDtcclxuXHRcdFx0ZG9jLmhlYWQuYXBwZW5kKGJhc2UpO1xyXG5cdFx0XHRkb2MuY2FjaGVkQXQgPSByZXNwb25zZS5jYWNoZWRBdDtcclxuXHRcdFx0cmV0dXJuIGRvYztcclxuXHRcdH1cclxuXHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRvYyh1cmw6IHN0cmluZywgaW5pdDogUmVxdWVzdEluaXRFeCA9IHt9KTogUHJvbWlzZTxEb2N1bWVudD4ge1xyXG5cdFx0XHRsZXQgcmVzcG9uc2UgPVxyXG5cdFx0XHRcdCFpbml0LnhtbCA/IGF3YWl0IGZldGNoKHVybCwgeyAuLi5kZWZhdWx0cywgLi4uaW5pdCB9KVxyXG5cdFx0XHRcdFx0OiBhd2FpdCB4bWxSZXNwb25zZSh1cmwsIGluaXQpO1xyXG5cdFx0XHRsZXQgdGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcclxuXHRcdFx0bGV0IHBhcnNlciA9IG5ldyBET01QYXJzZXIoKTtcclxuXHRcdFx0bGV0IGRvYyA9IHBhcnNlci5wYXJzZUZyb21TdHJpbmcodGV4dCwgJ3RleHQvaHRtbCcpO1xyXG5cdFx0XHRsZXQgYmFzZSA9IGRvYy5jcmVhdGVFbGVtZW50KCdiYXNlJyk7XHJcblx0XHRcdGJhc2UuaHJlZiA9IHVybDtcclxuXHRcdFx0ZG9jLmhlYWQuYXBwZW5kKGJhc2UpO1xyXG5cdFx0XHRkb2MuY2FjaGVkQXQgPSByZXNwb25zZS5jYWNoZWRBdDtcclxuXHRcdFx0cmV0dXJuIGRvYztcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgYXN5bmMgZnVuY3Rpb24geG1sUmVzcG9uc2UodXJsOiBzdHJpbmcsIGluaXQ6IFJlcXVlc3RJbml0RXggPSB7fSk6IFByb21pc2U8UmVzcG9uc2U+IHtcclxuXHRcdFx0bGV0IHAgPSBQcm9taXNlRXh0ZW5zaW9uLmVtcHR5PFByb2dyZXNzRXZlbnQ8RXZlbnRUYXJnZXQ+PigpO1xyXG5cdFx0XHRsZXQgb1JlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG5cdFx0XHRvUmVxLm9ubG9hZCA9IHAucjtcclxuXHRcdFx0b1JlcS5yZXNwb25zZVR5cGUgPSAnZG9jdW1lbnQnO1xyXG5cdFx0XHRvUmVxLm9wZW4oXCJnZXRcIiwgdXJsLCB0cnVlKTtcclxuXHRcdFx0b1JlcS5zZW5kKCk7XHJcblx0XHRcdGF3YWl0IHA7XHJcblx0XHRcdGlmIChvUmVxLnJlc3BvbnNlVHlwZSAhPSAnZG9jdW1lbnQnKSB0aHJvdyBuZXcgRXJyb3IoJ0ZJWE1FJyk7XHJcblx0XHRcdHJldHVybiBuZXcgUmVzcG9uc2Uob1JlcS5yZXNwb25zZVhNTC5kb2N1bWVudEVsZW1lbnQub3V0ZXJIVE1MLCBpbml0KTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgYXN5bmMgZnVuY3Rpb24ganNvbih1cmw6IHN0cmluZywgaW5pdDogUmVxdWVzdEluaXQgPSB7fSk6IFByb21pc2U8dW5rbm93bj4ge1xyXG5cdFx0XHRyZXR1cm4gZmV0Y2godXJsLCB7IC4uLmRlZmF1bHRzLCAuLi5pbml0IH0pLnRoZW4oZSA9PiBlLmpzb24oKSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsZWFyQ2FjaGUoKSB7XHJcblx0XHRcdGNhY2hlID0gbnVsbDtcclxuXHRcdFx0cmV0dXJuIGNhY2hlcy5kZWxldGUoJ2ZldGNoJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVuY2FjaGUodXJsOiBzdHJpbmcpIHtcclxuXHRcdFx0bGV0IGNhY2hlID0gYXdhaXQgb3BlbkNhY2hlKCk7XHJcblx0XHRcdGxldCBkMSA9IGNhY2hlLmRlbGV0ZSh1cmwpO1xyXG5cdFx0XHRsZXQgZDIgPSBhd2FpdCBpZGJEZWxldGUodXJsKTtcclxuXHRcdFx0cmV0dXJuIChhd2FpdCBkMSkgfHwgZDI7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGlzQ2FjaGVkKHVybDogc3RyaW5nLCBvcHRpb25zOiB7IG1heEFnZT86IGRlbHRhVGltZSwgaW5kZXhlZERiPzogYm9vbGVhbiB8ICdvbmx5JyB9ID0ge30pOiBQcm9taXNlPGJvb2xlYW4gfCAnaWRiJz4ge1xyXG5cdFx0XHRpZiAob3B0aW9ucy5pbmRleGVkRGIpIHtcclxuXHRcdFx0XHRsZXQgZGJKc29uID0gYXdhaXQgaWRiR2V0KHVybCk7XHJcblx0XHRcdFx0aWYgKGRiSnNvbikge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGlzU3RhbGUoZGJKc29uLmNhY2hlZEF0LCBub3JtYWxpemVEZWx0YVRpbWUob3B0aW9ucy5tYXhBZ2UpKSA/IGZhbHNlIDogJ2lkYic7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChvcHRpb25zLmluZGV4ZWREYiA9PSAnb25seScpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRsZXQgY2FjaGUgPSBhd2FpdCBvcGVuQ2FjaGUoKTtcclxuXHRcdFx0bGV0IHJlc3BvbnNlID0gYXdhaXQgY2FjaGUubWF0Y2godXJsKTtcclxuXHRcdFx0aWYgKCFyZXNwb25zZSkgcmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRpZiAob3B0aW9ucz8ubWF4QWdlICE9IG51bGwpIHtcclxuXHRcdFx0XHRsZXQgY2FjaGVkQXQgPSArcmVzcG9uc2UuaGVhZGVycy5nZXQoJ2NhY2hlZC1hdCcpIHx8IDA7XHJcblx0XHRcdFx0aWYgKGlzU3RhbGUocmVzcG9uc2UuY2FjaGVkQXQsIG5vcm1hbGl6ZURlbHRhVGltZShvcHRpb25zLm1heEFnZSkpKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHJcblxyXG5cdFx0ZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhY2hlZEpzb24odXJsOiBzdHJpbmcsIGluaXQ6IFJlcXVlc3RJbml0RXhKc29uID0ge30pOiBQcm9taXNlPHVua25vd24+IHtcclxuXHRcdFx0aWYgKGluaXQuaW5kZXhlZERiKSB7XHJcblx0XHRcdFx0bGV0IGRiSnNvbiA9IGF3YWl0IGlkYkdldCh1cmwpO1xyXG5cdFx0XHRcdGlmIChkYkpzb24pIHtcclxuXHRcdFx0XHRcdGlmICghaXNTdGFsZShkYkpzb24uY2FjaGVkQXQsIGluaXQubWF4QWdlKSkge1xyXG5cdFx0XHRcdFx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoZGJKc29uLmRhdGEgYXMgYW55LCAnY2FjaGVkJywgZGJKc29uLmNhY2hlZEF0KTtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIGRiSnNvbi5kYXRhO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRsZXQgcmVzcG9uc2UgPSBhd2FpdCBjYWNoZWQodXJsLCBpbml0KTtcclxuXHRcdFx0bGV0IGpzb24gPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XHJcblx0XHRcdFBvb3BKcy5kZWJ1ZyAmJiBjb25zb2xlLmxvZyhgICA9IGAsIGpzb24pO1xyXG5cclxuXHRcdFx0aWYgKCEoJ2NhY2hlZCcgaW4ganNvbikpIHtcclxuXHRcdFx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUoanNvbiwgJ2NhY2hlZCcsIHJlc3BvbnNlLmNhY2hlZEF0KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoaW5pdC5pbmRleGVkRGIpIHtcclxuXHRcdFx0XHRpZGJQdXQodXJsLCBqc29uLCByZXNwb25zZS5jYWNoZWRBdCk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGpzb247XHJcblx0XHR9XHJcblxyXG5cclxuXHRcdGxldCBfaWRiSW5zdGFuY2VQcm9taXNlOiBJREJEYXRhYmFzZSB8IFByb21pc2U8SURCRGF0YWJhc2U+ID0gbnVsbDtcclxuXHRcdGxldCBpZGJJbnN0YW5jZTogSURCRGF0YWJhc2UgPSBudWxsO1xyXG5cclxuXHRcdGFzeW5jIGZ1bmN0aW9uIG9wZW5JZGIoKTogUHJvbWlzZTxJREJEYXRhYmFzZT4ge1xyXG5cdFx0XHRpZiAoaWRiSW5zdGFuY2UpIHJldHVybiBpZGJJbnN0YW5jZTtcclxuXHRcdFx0aWYgKGF3YWl0IF9pZGJJbnN0YW5jZVByb21pc2UpIHtcclxuXHRcdFx0XHRyZXR1cm4gaWRiSW5zdGFuY2U7XHJcblx0XHRcdH1cclxuXHRcdFx0bGV0IGlycSA9IGluZGV4ZWREQi5vcGVuKCdmZXRjaCcpO1xyXG5cdFx0XHRpcnEub251cGdyYWRlbmVlZGVkID0gZXZlbnQgPT4ge1xyXG5cdFx0XHRcdGxldCBkYiA9IGlycS5yZXN1bHQ7XHJcblx0XHRcdFx0bGV0IHN0b3JlID0gZGIuY3JlYXRlT2JqZWN0U3RvcmUoJ2ZldGNoJywgeyBrZXlQYXRoOiAndXJsJyB9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRfaWRiSW5zdGFuY2VQcm9taXNlID0gbmV3IFByb21pc2UoKHIsIGopID0+IHtcclxuXHRcdFx0XHRpcnEub25zdWNjZXNzID0gcjtcclxuXHRcdFx0XHRpcnEub25lcnJvciA9IGo7XHJcblx0XHRcdH0pLnRoZW4oKCkgPT4gaXJxLnJlc3VsdCwgKCkgPT4gbnVsbCk7XHJcblx0XHRcdGlkYkluc3RhbmNlID0gX2lkYkluc3RhbmNlUHJvbWlzZSA9IGF3YWl0IF9pZGJJbnN0YW5jZVByb21pc2U7XHJcblx0XHRcdGlmICghaWRiSW5zdGFuY2UpIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIG9wZW4gaW5kZXhlZERCJyk7XHJcblx0XHRcdHJldHVybiBpZGJJbnN0YW5jZTtcclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgYXN5bmMgZnVuY3Rpb24gaWRiQ2xlYXIoKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignVE9ETycpXHJcblx0XHR9XHJcblxyXG5cclxuXHRcdGFzeW5jIGZ1bmN0aW9uIGlkYkdldCh1cmw6IHN0cmluZyk6IFByb21pc2U8eyB1cmw6IHN0cmluZywgZGF0YTogdW5rbm93biwgY2FjaGVkQXQ6IG51bWJlciB9IHwgdW5kZWZpbmVkPiB7XHJcblx0XHRcdGxldCBkYiA9IGF3YWl0IG9wZW5JZGIoKTtcclxuXHRcdFx0bGV0IHQgPSBkYi50cmFuc2FjdGlvbihbJ2ZldGNoJ10sICdyZWFkb25seScpO1xyXG5cdFx0XHRsZXQgcnEgPSB0Lm9iamVjdFN0b3JlKCdmZXRjaCcpLmdldCh1cmwpO1xyXG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UociA9PiB7XHJcblx0XHRcdFx0cnEub25zdWNjZXNzID0gKCkgPT4gcihycS5yZXN1bHQpO1xyXG5cdFx0XHRcdHJxLm9uZXJyb3IgPSAoKSA9PiByKHVuZGVmaW5lZCk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdGFzeW5jIGZ1bmN0aW9uIGlkYlB1dCh1cmw6IHN0cmluZywgZGF0YTogdW5rbm93biwgY2FjaGVkQXQ/OiBudW1iZXIpOiBQcm9taXNlPElEQlZhbGlkS2V5IHwgdW5kZWZpbmVkPiB7XHJcblx0XHRcdGxldCBkYiA9IGF3YWl0IG9wZW5JZGIoKTtcclxuXHRcdFx0bGV0IHQgPSBkYi50cmFuc2FjdGlvbihbJ2ZldGNoJ10sICdyZWFkd3JpdGUnKTtcclxuXHRcdFx0bGV0IHJxID0gdC5vYmplY3RTdG9yZSgnZmV0Y2gnKS5wdXQoeyB1cmwsIGRhdGEsIGNhY2hlZEF0OiBjYWNoZWRBdCA/PyArbmV3IERhdGUoKSB9KTtcclxuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKHIgPT4ge1xyXG5cdFx0XHRcdHJxLm9uc3VjY2VzcyA9ICgpID0+IHIocnEucmVzdWx0KTtcclxuXHRcdFx0XHRycS5vbmVycm9yID0gKCkgPT4gcih1bmRlZmluZWQpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRhc3luYyBmdW5jdGlvbiBpZGJEZWxldGUodXJsOiBzdHJpbmcpOiBQcm9taXNlPElEQlZhbGlkS2V5IHwgdW5kZWZpbmVkPiB7XHJcblx0XHRcdGxldCBkYiA9IGF3YWl0IG9wZW5JZGIoKTtcclxuXHRcdFx0bGV0IHQgPSBkYi50cmFuc2FjdGlvbihbJ2ZldGNoJ10sICdyZWFkd3JpdGUnKTtcclxuXHRcdFx0bGV0IHJxID0gdC5vYmplY3RTdG9yZSgnZmV0Y2gnKS5kZWxldGUodXJsKTtcclxuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKHIgPT4ge1xyXG5cdFx0XHRcdHJxLm9uc3VjY2VzcyA9ICgpID0+IHIocnEucmVzdWx0KTtcclxuXHRcdFx0XHRycS5vbmVycm9yID0gKCkgPT4gcih1bmRlZmluZWQpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0fVxyXG5cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIEVudHJ5RmlsdGVyZXJFeHRlbnNpb24ge1xyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogY2FuIGJlIGVpdGhlciBNYXAgb3IgV2Vha01hcFxyXG5cdFx0ICogKFdlYWtNYXAgaXMgbGlrZWx5IHRvIGJlIHVzZWxlc3MgaWYgdGhlcmUgYXJlIGxlc3MgdGhlbiAxMGsgb2xkIG5vZGVzIGluIG1hcClcclxuXHRcdCAqL1xyXG5cdFx0bGV0IE1hcFR5cGUgPSBNYXA7XHJcblx0XHR0eXBlIE1hcFR5cGU8SyBleHRlbmRzIG9iamVjdCwgVj4gPS8vIE1hcDxLLCBWPiB8IFxyXG5cdFx0XHRXZWFrTWFwPEssIFY+O1xyXG5cclxuXHRcdGZ1bmN0aW9uIHRvRWxBcnJheShlbnRyeVNlbGVjdG9yOiBzZWxlY3RvciB8ICgoKSA9PiBIVE1MRWxlbWVudFtdKSk6IEhUTUxFbGVtZW50W10ge1xyXG5cdFx0XHRyZXR1cm4gdHlwZW9mIGVudHJ5U2VsZWN0b3IgPT0gJ2Z1bmN0aW9uJyA/IGVudHJ5U2VsZWN0b3IoKSA6IHFxKGVudHJ5U2VsZWN0b3IpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBFbnRyeUZpbHRlcmVyPERhdGEgZXh0ZW5kcyB7fSA9IHt9PiB7XHJcblx0XHRcdGNvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XHJcblx0XHRcdGVudHJ5U2VsZWN0b3I6IHNlbGVjdG9yIHwgKCgpID0+IEhUTUxFbGVtZW50W10pO1xyXG5cdFx0XHRjb25zdHJ1Y3RvcihlbnRyeVNlbGVjdG9yOiBzZWxlY3RvciB8ICgoKSA9PiBIVE1MRWxlbWVudFtdKSwgZW5hYmxlZDogYm9vbGVhbiB8ICdzb2Z0JyA9ICdzb2Z0Jykge1xyXG5cdFx0XHRcdHRoaXMuZW50cnlTZWxlY3RvciA9IGVudHJ5U2VsZWN0b3I7XHJcblx0XHRcdFx0dGhpcy5jb250YWluZXIgPSBlbG0oJy5lZi1jb250YWluZXInKTtcclxuXHJcblx0XHRcdFx0aWYgKGVuYWJsZWQgPT0gJ3NvZnQnKSB7XHJcblx0XHRcdFx0XHR0aGlzLnNvZnREaXNhYmxlID0gdHJ1ZTtcclxuXHRcdFx0XHRcdHRoaXMuZGlzYWJsZSgnc29mdCcpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAoZW5hYmxlZCkge1xyXG5cdFx0XHRcdFx0dGhpcy5zb2Z0RGlzYWJsZSA9IGZhbHNlO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHQvLyBlbmFibGVkIGlzIGZhbHN5XHJcblx0XHRcdFx0XHR0aGlzLnNvZnREaXNhYmxlID0gZmFsc2U7XHJcblx0XHRcdFx0XHR0aGlzLmRpc2FibGUoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5zdHlsZSgpO1xyXG5cclxuXHRcdFx0XHR0aGlzLnVwZGF0ZSgpO1xyXG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXI8UGFnaW5hdGVFeHRlbnNpb24uUE1vZGlmeUV2ZW50PigncGFnaW5hdGlvbm1vZGlmeScsICgpID0+IHRoaXMucmVxdWVzdFVwZGF0ZSgpKTtcclxuXHRcdFx0XHRldGMub25oZWlnaHRjaGFuZ2UoKCkgPT4gdGhpcy5yZXF1ZXN0VXBkYXRlKCkpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRlbnRyaWVzOiBIVE1MRWxlbWVudFtdID0gW107XHJcblx0XHRcdGVudHJ5RGF0YXM6IE1hcFR5cGU8SFRNTEVsZW1lbnQsIERhdGE+ID0gbmV3IE1hcFR5cGUoKTtcclxuXHJcblx0XHRcdGdldERhdGEoZWw6IEhUTUxFbGVtZW50KTogRGF0YTtcclxuXHRcdFx0Z2V0RGF0YSgpOiBEYXRhW107XHJcblx0XHRcdGdldERhdGEoZWw/OiBIVE1MRWxlbWVudCk6IERhdGEgfCBEYXRhW10ge1xyXG5cdFx0XHRcdGlmICghZWwpIHJldHVybiB0aGlzLmVudHJpZXMubWFwKGUgPT4gdGhpcy5nZXREYXRhKGUpKTtcclxuXHRcdFx0XHRsZXQgZGF0YSA9IHRoaXMuZW50cnlEYXRhcy5nZXQoZWwpO1xyXG5cdFx0XHRcdGlmICghZGF0YSkge1xyXG5cdFx0XHRcdFx0ZGF0YSA9IHRoaXMucGFyc2VFbnRyeShlbCk7XHJcblx0XHRcdFx0XHR0aGlzLmVudHJ5RGF0YXMuc2V0KGVsLCBkYXRhKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIGRhdGE7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHVwZGF0ZVBlbmRpbmcgPSBmYWxzZTtcclxuXHRcdFx0cmVwYXJzZVBlbmRpbmcgPSBmYWxzZTtcclxuXHRcdFx0cmVxdWVzdFVwZGF0ZShyZXBhcnNlID0gZmFsc2UpIHtcclxuXHRcdFx0XHRpZiAodGhpcy51cGRhdGVQZW5kaW5nKSByZXR1cm47XHJcblx0XHRcdFx0dGhpcy51cGRhdGVQZW5kaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHRpZiAocmVwYXJzZSkgdGhpcy5yZXBhcnNlUGVuZGluZyA9IHRydWU7XHJcblx0XHRcdFx0c2V0VGltZW91dCgoKSA9PiB0aGlzLnVwZGF0ZSgpKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cGFyc2VyczogUGFyc2VyRm48RGF0YT5bXSA9IFtdO1xyXG5cdFx0XHR3cml0ZURhdGFBdHRyaWJ1dGUgPSBmYWxzZTtcclxuXHRcdFx0YWRkUGFyc2VyKHBhcnNlcjogUGFyc2VyRm48RGF0YT4pIHtcclxuXHRcdFx0XHR0aGlzLnBhcnNlcnMucHVzaChwYXJzZXIpO1xyXG5cdFx0XHRcdHRoaXMucmVxdWVzdFVwZGF0ZSh0cnVlKTtcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyByZXBhcnNlRW50cmllcyhlbnRyaWVzID0gdGhpcy5lbnRyaWVzKTogRGF0YVtdIHtcclxuXHRcdFx0Ly8gXHQvLyBwcmVwYXJzZVxyXG5cdFx0XHQvLyBcdGxldCBwYXJlbnRzID0gbmV3IFNldChlbnRyaWVzLm1hcChlPT5lLnBhcmVudEVsZW1lbnQpKTtcclxuXHRcdFx0Ly8gXHRmb3IgKGxldCBwYXJlbnQgb2YgcGFyZW50cykge1xyXG5cdFx0XHQvLyBcdFx0cGFyZW50LmNsYXNzTGlzdC5hZGQoJ2VmLWVudHJ5LWNvbnRhaW5lcicpO1xyXG5cdFx0XHQvLyBcdH1cclxuXHRcdFx0Ly8gXHRmb3IgKGxldCBlIG9mIGVudHJpZXMpIHtcclxuXHRcdFx0Ly8gXHRcdGUuY2xhc3NMaXN0LmFkZCgnZWYtZW50cnknKTtcclxuXHRcdFx0Ly8gXHR9XHJcblxyXG5cdFx0XHQvLyBcdGxldCBkYXRhcyA9XHJcblx0XHRcdC8vIFx0Zm9yIChsZXQgcGFyc2VyIG9mIHRoaXMucGFyc2Vycykge1xyXG5cclxuXHRcdFx0Ly8gXHR9XHJcblx0XHRcdC8vIFx0cmV0dXJuIDAgYXMgYW55O1xyXG5cdFx0XHQvLyB9XHJcblx0XHRcdHBhcnNlRW50cnkoZWw6IEhUTUxFbGVtZW50KTogRGF0YSB7XHJcblx0XHRcdFx0ZWwucGFyZW50RWxlbWVudC5jbGFzc0xpc3QuYWRkKCdlZi1lbnRyeS1jb250YWluZXInKTtcclxuXHRcdFx0XHRlbC5jbGFzc0xpc3QuYWRkKCdlZi1lbnRyeScpO1xyXG5cclxuXHRcdFx0XHRsZXQgZGF0YTogRGF0YSA9IHt9IGFzIERhdGE7XHJcblx0XHRcdFx0Zm9yIChsZXQgcGFyc2VyIG9mIHRoaXMucGFyc2Vycykge1xyXG5cdFx0XHRcdFx0bGV0IG5ld0RhdGEgPSBwYXJzZXIoZWwsIGRhdGEpO1xyXG5cdFx0XHRcdFx0aWYgKCFuZXdEYXRhIHx8IG5ld0RhdGEgPT0gZGF0YSkgY29udGludWU7XHJcblx0XHRcdFx0XHRpZiAoIUlzUHJvbWlzZShuZXdEYXRhKSkge1xyXG5cdFx0XHRcdFx0XHRPYmplY3QuYXNzaWduKGRhdGEsIG5ld0RhdGEpO1xyXG5cdFx0XHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdG5ld0RhdGEudGhlbihwTmV3RGF0YSA9PiB7XHJcblx0XHRcdFx0XHRcdGlmIChwTmV3RGF0YSAmJiBwTmV3RGF0YSAhPSBkYXRhKSB7XHJcblx0XHRcdFx0XHRcdFx0T2JqZWN0LmFzc2lnbihkYXRhLCBwTmV3RGF0YSk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0dGhpcy5yZXF1ZXN0VXBkYXRlKCk7XHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodGhpcy53cml0ZURhdGFBdHRyaWJ1dGUpIHtcclxuXHRcdFx0XHRcdGVsLnNldEF0dHJpYnV0ZSgnZWYtZGF0YScsIEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIGRhdGE7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGFkZEl0ZW08SVQsIFQgZXh0ZW5kcyBJVCwgSVMgZXh0ZW5kcyBGaWx0ZXJlckl0ZW1QYXJ0aWFsLCBTLCBUUyBleHRlbmRzIFMgJiBJUyAmIEZpbHRlcmVySXRlbVNvdXJjZT4oY29uc3RydWN0b3I6IHsgbmV3KGRhdGE6IFRTKTogVCB9LCBsaXN0OiBJVFtdLCBkYXRhOiBJUywgc291cmNlOiBTKTogVCB7XHJcblx0XHRcdFx0T2JqZWN0LmFzc2lnbihkYXRhLCBzb3VyY2UsIHsgcGFyZW50OiB0aGlzIH0pO1xyXG5cdFx0XHRcdGRhdGEubmFtZSA/Pz0gZGF0YS5pZDtcclxuXHRcdFx0XHRsZXQgaXRlbSA9IG5ldyBjb25zdHJ1Y3RvcihkYXRhIGFzIFRTKTtcclxuXHRcdFx0XHRsaXN0LnB1c2goaXRlbSk7XHJcblx0XHRcdFx0cmV0dXJuIGl0ZW07XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZpbHRlcnM6IElGaWx0ZXI8RGF0YT5bXSA9IFtdO1xyXG5cdFx0XHRzb3J0ZXJzOiBJU29ydGVyPERhdGE+W10gPSBbXTtcclxuXHRcdFx0bW9kaWZpZXJzOiBJTW9kaWZpZXI8RGF0YT5bXSA9IFtdO1xyXG5cclxuXHRcdFx0Z2V0IGJ5TmFtZSgpIHtcclxuXHRcdFx0XHRyZXR1cm4gT2JqZWN0LmFzc2lnbihcclxuXHRcdFx0XHRcdE9iamVjdC5mcm9tRW50cmllcyh0aGlzLmZpbHRlcnMubWFwKGUgPT4gW2UuaWQsIGVdKSksXHJcblx0XHRcdFx0XHRPYmplY3QuZnJvbUVudHJpZXModGhpcy5zb3J0ZXJzLm1hcChlID0+IFtlLmlkLCBlXSkpLFxyXG5cdFx0XHRcdFx0T2JqZWN0LmZyb21FbnRyaWVzKHRoaXMubW9kaWZpZXJzLm1hcChlID0+IFtlLmlkLCBlXSkpLFxyXG5cdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRmaWx0ZXJzOiBPYmplY3QuZnJvbUVudHJpZXModGhpcy5maWx0ZXJzLm1hcChlID0+IFtlLmlkLCBlXSkpLFxyXG5cdFx0XHRcdFx0XHRzb3J0ZXJzOiBPYmplY3QuZnJvbUVudHJpZXModGhpcy5zb3J0ZXJzLm1hcChlID0+IFtlLmlkLCBlXSkpLFxyXG5cdFx0XHRcdFx0XHRtb2RpZmllcnM6IE9iamVjdC5mcm9tRW50cmllcyh0aGlzLm1vZGlmaWVycy5tYXAoZSA9PiBbZS5pZCwgZV0pKSxcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0KTtcclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHRcdGFkZEZpbHRlcihpZDogc3RyaW5nLCBmaWx0ZXI6IEZpbHRlckZuPERhdGE+LCBkYXRhPzogRmlsdGVyUGFydGlhbDxEYXRhPik6IEZpbHRlcjxEYXRhPjtcclxuXHRcdFx0YWRkRmlsdGVyKHByb3BOYW1lOiBzdHJpbmcgJiBrZXlvZiBEYXRhKTogRmlsdGVyPERhdGE+O1xyXG5cdFx0XHRhZGRGaWx0ZXIoaWQ6IHN0cmluZywgZmlsdGVyPzogRmlsdGVyRm48RGF0YT4sIGRhdGE6IEZpbHRlclBhcnRpYWw8RGF0YT4gPSB7fSk6IEZpbHRlcjxEYXRhPiB7XHJcblx0XHRcdFx0aWYgKCFmaWx0ZXIpIHJldHVybiB0aGlzLmFkZEZpbHRlcihpZCwgZCA9PiBkW2lkXSk7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuYWRkSXRlbShGaWx0ZXIsIHRoaXMuZmlsdGVycywgZGF0YSwgeyBpZCwgZmlsdGVyIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFkZFZGaWx0ZXI8ViBleHRlbmRzIG51bWJlciB8IHN0cmluZz4oaWQ6IHN0cmluZywgZmlsdGVyOiBWYWx1ZUZpbHRlckZuPERhdGEsIFY+LCBkYXRhOiBWYWx1ZUZpbHRlclBhcnRpYWw8RGF0YSwgVj4pOiBWYWx1ZUZpbHRlcjxEYXRhLCBWPjtcclxuXHRcdFx0YWRkVkZpbHRlcjxWIGV4dGVuZHMgbnVtYmVyIHwgc3RyaW5nPihpZDogc3RyaW5nLCBmaWx0ZXI6IFZhbHVlRmlsdGVyRm48RGF0YSwgVj4sIGRhdGE6IFYpO1xyXG5cdFx0XHRhZGRWRmlsdGVyPFYgZXh0ZW5kcyBudW1iZXI+KHByb3BOYW1lOiBzdHJpbmcgJiBrZXlvZiBEYXRhLCBkZWZhdWx0TWluOiBWKTtcclxuXHRcdFx0YWRkVkZpbHRlcjxWIGV4dGVuZHMgbnVtYmVyIHwgc3RyaW5nPihpZDogc3RyaW5nLCBmaWx0ZXI6IFZhbHVlRmlsdGVyRm48RGF0YSwgVj4gfCBWLCBkYXRhPzogVmFsdWVGaWx0ZXJQYXJ0aWFsPERhdGEsIFY+IHwgVikge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgZmlsdGVyICE9ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmFkZFZGaWx0ZXIoaWQsICh2LCBkKSA9PiBkW2lkXSA+IHYsIGZpbHRlcik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0eXBlb2YgZGF0YSAhPSAnb2JqZWN0JyB8fCAhZGF0YSkge1xyXG5cdFx0XHRcdFx0ZGF0YSA9IHsgaW5wdXQ6IGRhdGEgYXMgViB9O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hZGRJdGVtKFZhbHVlRmlsdGVyLCB0aGlzLmZpbHRlcnMsIGRhdGEsIHsgaWQsIGZpbHRlciB9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRhZGRNRmlsdGVyKGlkOiBzdHJpbmcsIHZhbHVlOiAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KSA9PiBzdHJpbmcsIGRhdGE6IE1hdGNoRmlsdGVyU291cmNlPERhdGE+KSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuYWRkSXRlbShNYXRjaEZpbHRlciwgdGhpcy5maWx0ZXJzLCBkYXRhLCB7IGlkLCB2YWx1ZSB9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRhZGRUYWdGaWx0ZXIoaWQ6IHN0cmluZywgZGF0YTogVGFnRmlsdGVyU291cmNlPERhdGE+KSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuYWRkSXRlbShUYWdGaWx0ZXIsIHRoaXMuZmlsdGVycywgZGF0YSwgeyBpZCB9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRhZGRTb3J0ZXI8ViBleHRlbmRzIG51bWJlciB8IHN0cmluZz4oaWQ6IHN0cmluZywgc29ydGVyOiBTb3J0ZXJGbjxEYXRhLCBWPiwgZGF0YTogU29ydGVyUGFydGlhbFNvdXJjZTxEYXRhLCBWPiA9IHt9KTogU29ydGVyPERhdGEsIFY+IHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hZGRJdGVtKFNvcnRlciwgdGhpcy5zb3J0ZXJzLCBkYXRhLCB7IGlkLCBzb3J0ZXIgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0YWRkTW9kaWZpZXIoaWQ6IHN0cmluZywgbW9kaWZpZXI6IE1vZGlmaWVyRm48RGF0YT4sIGRhdGE6IE1vZGlmaWVyUGFydGlhbDxEYXRhPiA9IHt9KTogTW9kaWZpZXI8RGF0YT4ge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmFkZEl0ZW0oTW9kaWZpZXIsIHRoaXMubW9kaWZpZXJzLCBkYXRhLCB7IGlkLCBtb2RpZmllciB9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRhZGRQcmVmaXgoaWQ6IHN0cmluZywgcHJlZml4OiBQcmVmaXhlckZuPERhdGE+LCBkYXRhOiBQcmVmaXhlclBhcnRpYWw8RGF0YT4gPSB7fSk6IFByZWZpeGVyPERhdGE+IHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hZGRJdGVtKFByZWZpeGVyLCB0aGlzLm1vZGlmaWVycywgZGF0YSwgeyBpZCwgcHJlZml4IH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFkZFBhZ2luYXRpb25JbmZvKGlkOiBzdHJpbmcgPSAncGdpbmZvJywgZGF0YTogUGFydGlhbDxGaWx0ZXJlckl0ZW1Tb3VyY2U+ID0ge30pIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hZGRJdGVtKFBhZ2luYXRpb25JbmZvRmlsdGVyLCB0aGlzLmZpbHRlcnMsIGRhdGEsIHsgaWQgfSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZpbHRlckVudHJpZXMoKSB7XHJcblx0XHRcdFx0Zm9yIChsZXQgZWwgb2YgdGhpcy5lbnRyaWVzKSB7XHJcblx0XHRcdFx0XHRsZXQgZGF0YSA9IHRoaXMuZ2V0RGF0YShlbCk7XHJcblx0XHRcdFx0XHRsZXQgdmFsdWUgPSB0cnVlO1xyXG5cdFx0XHRcdFx0Zm9yIChsZXQgZmlsdGVyIG9mIHRoaXMuZmlsdGVycykge1xyXG5cdFx0XHRcdFx0XHR2YWx1ZSA9IHZhbHVlICYmIGZpbHRlci5hcHBseShkYXRhLCBlbCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbC5jbGFzc0xpc3QudG9nZ2xlKCdlZi1maWx0ZXJlZC1vdXQnLCAhdmFsdWUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0X3ByZXZpb3VzU3RhdGUgPSB7XHJcblx0XHRcdFx0YWxsU29ydGVyc09mZjogdHJ1ZSxcclxuXHRcdFx0XHR1cGRhdGVEdXJhdGlvbjogMCxcclxuXHRcdFx0XHRmaW5pc2hlZEF0OiAwLFxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0b3JkZXJlZEVudHJpZXM6IEhUTUxFbGVtZW50W10gPSBbXTtcclxuXHRcdFx0b3JkZXJNb2RlOiAnY3NzJyB8ICdzd2FwJyA9ICdjc3MnO1xyXG5cdFx0XHRzb3J0RW50cmllcygpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5lbnRyaWVzLmxlbmd0aCA8PSAxKSByZXR1cm47XHJcblx0XHRcdFx0aWYgKHRoaXMub3JkZXJlZEVudHJpZXMubGVuZ3RoID09IDApIHRoaXMub3JkZXJlZEVudHJpZXMgPSB0aGlzLmVudHJpZXM7XHJcblx0XHRcdFx0aWYgKHRoaXMuc29ydGVycy5sZW5ndGggPT0gMCkgcmV0dXJuO1xyXG5cclxuXHRcdFx0XHRsZXQgZW50cmllcyA9IHRoaXMuZW50cmllcztcclxuXHRcdFx0XHRsZXQgcGFpcnM6IFtEYXRhLCBIVE1MRWxlbWVudF1bXSA9IGVudHJpZXMubWFwKGUgPT4gW3RoaXMuZ2V0RGF0YShlKSwgZV0pO1xyXG5cdFx0XHRcdGxldCBhbGxPZmYgPSB0cnVlO1xyXG5cdFx0XHRcdGZvciAobGV0IHNvcnRlciBvZiB0aGlzLnNvcnRlcnMpIHtcclxuXHRcdFx0XHRcdGlmIChzb3J0ZXIubW9kZSAhPSAnb2ZmJykge1xyXG5cdFx0XHRcdFx0XHRwYWlycyA9IHNvcnRlci5zb3J0KHBhaXJzKTtcclxuXHRcdFx0XHRcdFx0YWxsT2ZmID0gZmFsc2U7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVudHJpZXMgPSBwYWlycy5tYXAoZSA9PiBlWzFdKTtcclxuXHRcdFx0XHRpZiAodGhpcy5vcmRlck1vZGUgPT0gJ3N3YXAnKSB7XHJcblx0XHRcdFx0XHRpZiAoIWVudHJpZXMuZXZlcnkoKGUsIGkpID0+IGUgPT0gdGhpcy5vcmRlcmVkRW50cmllc1tpXSkpIHtcclxuXHRcdFx0XHRcdFx0bGV0IGJyID0gZWxtKGAke2VudHJpZXNbMF0/LnRhZ05hbWV9LmVmLWJlZm9yZS1zb3J0W2hpZGRlbl1gKTtcclxuXHRcdFx0XHRcdFx0dGhpcy5vcmRlcmVkRW50cmllc1swXS5iZWZvcmUoYnIpO1xyXG5cdFx0XHRcdFx0XHRici5hZnRlciguLi5lbnRyaWVzKTtcclxuXHRcdFx0XHRcdFx0YnIucmVtb3ZlKCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGlmIChhbGxPZmYgIT0gdGhpcy5fcHJldmlvdXNTdGF0ZS5hbGxTb3J0ZXJzT2ZmKSB7XHJcblx0XHRcdFx0XHRcdGVudHJpZXMubWFwKChlLCBpKSA9PiB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKGFsbE9mZikge1xyXG5cdFx0XHRcdFx0XHRcdFx0ZS5jbGFzc0xpc3QucmVtb3ZlKCdlZi1yZW9yZGVyJyk7XHJcblx0XHRcdFx0XHRcdFx0XHRlLnBhcmVudEVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnZWYtcmVvcmRlci1jb250YWluZXInKTtcclxuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdFx0Ly8gdXNlIGBmbGV4YCBvciBgZ3JpZGAgY29udGFpbmVyIGFuZCBgb3JkZXI6dmFyKC0tZWYtb3JkZXIpYCBmb3IgY2hpbGRyZW4gXHJcblx0XHRcdFx0XHRcdFx0XHRlLmNsYXNzTGlzdC5hZGQoJ2VmLXJlb3JkZXInKTtcclxuXHRcdFx0XHRcdFx0XHRcdGUucGFyZW50RWxlbWVudC5jbGFzc0xpc3QuYWRkKCdlZi1yZW9yZGVyLWNvbnRhaW5lcicpO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpZiAoIWFsbE9mZikge1xyXG5cdFx0XHRcdFx0XHRlbnRyaWVzLm1hcCgoZSwgaSkgPT4ge1xyXG5cdFx0XHRcdFx0XHRcdGUuc3R5bGUuc2V0UHJvcGVydHkoJy0tZWYtb3JkZXInLCBpICsgJycpO1xyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5vcmRlcmVkRW50cmllcyA9IGVudHJpZXM7XHJcblx0XHRcdFx0dGhpcy5fcHJldmlvdXNTdGF0ZS5hbGxTb3J0ZXJzT2ZmID0gYWxsT2ZmO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRtb2RpZnlFbnRyaWVzKCkge1xyXG5cdFx0XHRcdGxldCBlbnRyaWVzID0gdGhpcy5lbnRyaWVzO1xyXG5cdFx0XHRcdGxldCBwYWlyczogW0hUTUxFbGVtZW50LCBEYXRhXVtdID0gZW50cmllcy5tYXAoZSA9PiBbZSwgdGhpcy5nZXREYXRhKGUpXSk7XHJcblx0XHRcdFx0Zm9yIChsZXQgbW9kaWZpZXIgb2YgdGhpcy5tb2RpZmllcnMpIHtcclxuXHRcdFx0XHRcdGZvciAobGV0IFtlLCBkXSBvZiBwYWlycykge1xyXG5cdFx0XHRcdFx0XHRtb2RpZmllci5hcHBseShkLCBlKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdG1vdmVUb1RvcChpdGVtOiBJU29ydGVyPERhdGE+IHwgSU1vZGlmaWVyPERhdGE+KSB7XHJcblx0XHRcdFx0aWYgKHRoaXMuc29ydGVycy5pbmNsdWRlcyhpdGVtIGFzIElTb3J0ZXI8RGF0YT4pKSB7XHJcblx0XHRcdFx0XHR0aGlzLnNvcnRlcnMuc3BsaWNlKHRoaXMuc29ydGVycy5pbmRleE9mKGl0ZW0gYXMgSVNvcnRlcjxEYXRhPiksIDEpO1xyXG5cdFx0XHRcdFx0dGhpcy5zb3J0ZXJzLnB1c2goaXRlbSBhcyBJU29ydGVyPERhdGE+KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kaWZpZXJzLmluY2x1ZGVzKGl0ZW0gYXMgSU1vZGlmaWVyPERhdGE+KSkge1xyXG5cdFx0XHRcdFx0dGhpcy5tb2RpZmllcnMuc3BsaWNlKHRoaXMubW9kaWZpZXJzLmluZGV4T2YoaXRlbSBhcyBJTW9kaWZpZXI8RGF0YT4pLCAxKTtcclxuXHRcdFx0XHRcdHRoaXMubW9kaWZpZXJzLnB1c2goaXRlbSBhcyBJTW9kaWZpZXI8RGF0YT4pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZmluZEVudHJpZXMoKTogSFRNTEVsZW1lbnRbXSB7XHJcblx0XHRcdFx0cmV0dXJuIHR5cGVvZiB0aGlzLmVudHJ5U2VsZWN0b3IgPT0gJ2Z1bmN0aW9uJyA/IHRoaXMuZW50cnlTZWxlY3RvcigpIDogcXEodGhpcy5lbnRyeVNlbGVjdG9yKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0X2VhcmxpZXN0VXBkYXRlID0gMDtcclxuXHRcdFx0dXBkYXRlKHJlcGFyc2UgPSB0aGlzLnJlcGFyc2VQZW5kaW5nKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMuZGlzYWJsZWQgPT0gdHJ1ZSkgcmV0dXJuO1xyXG5cdFx0XHRcdGlmICh0aGlzLl9wcmV2aW91c1N0YXRlLnVwZGF0ZUR1cmF0aW9uID09IDk5Xzk5OSkge1xyXG5cdFx0XHRcdFx0UG9vcEpzLmRlYnVnICYmIGNvbnNvbGUubG9nKGBFRjogdXBkYXRlIGluIHByb2dyZXNzYCk7XHJcblx0XHRcdFx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xyXG5cdFx0XHRcdFx0XHRzZXRUaW1lb3V0KCgpID0+IHtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLnVwZGF0ZShyZXBhcnNlKVxyXG5cdFx0XHRcdFx0XHR9LCAxMDApXHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0bGV0IGNvb2xkb3duID0gTWF0aC5taW4oMTAwMDAsIDggKiB0aGlzLl9wcmV2aW91c1N0YXRlLnVwZGF0ZUR1cmF0aW9uKVxyXG5cdFx0XHRcdGxldCBlYXJsaWVzdFVwZGF0ZSA9IHRoaXMuX3ByZXZpb3VzU3RhdGUuZmluaXNoZWRBdCArIGNvb2xkb3duO1xyXG5cdFx0XHRcdGlmIChwZXJmb3JtYW5jZS5ub3coKSA8IGVhcmxpZXN0VXBkYXRlKSB7XHJcblx0XHRcdFx0XHRpZiAodGhpcy5fZWFybGllc3RVcGRhdGUgIT0gZWFybGllc3RVcGRhdGUpIHtcclxuXHRcdFx0XHRcdFx0dGhpcy5fZWFybGllc3RVcGRhdGUgPSBlYXJsaWVzdFVwZGF0ZTtcclxuXHRcdFx0XHRcdFx0aWYgKFBvb3BKcy5kZWJ1Zykge1xyXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGBFRjogdXBkYXRlIGRlbGF5ZWQgYnkgJHt+fihlYXJsaWVzdFVwZGF0ZSAtIHBlcmZvcm1hbmNlLm5vdygpKX1tcyAkeycnXHJcblx0XHRcdFx0XHRcdFx0XHR9IChsYXN0IHVwZGF0ZSBkdXJhdGlvbjogJHt0aGlzLl9wcmV2aW91c1N0YXRlLnVwZGF0ZUR1cmF0aW9ufSlgKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0dGhpcy51cGRhdGVQZW5kaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHRcdHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB0aGlzLnVwZGF0ZSgpKTtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy51cGRhdGVQZW5kaW5nID0gZmFsc2U7XHJcblx0XHRcdFx0bGV0IG5vdyA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG5cclxuXHRcdFx0XHRsZXQgZW50cmllcyA9IHRoaXMuZmluZEVudHJpZXMoKTtcclxuXHJcblx0XHRcdFx0aWYgKHRoaXMuZGlzYWJsZWQgPT0gJ3NvZnQnKSB7XHJcblx0XHRcdFx0XHRpZiAoIWVudHJpZXMubGVuZ3RoKSByZXR1cm47XHJcblx0XHRcdFx0XHRQb29wSnMuZGVidWcgJiYgY29uc29sZS5sb2coYEVmIHNvZnQtZW5hYmxlZDogeDA9Pngke2VudHJpZXMubGVuZ3RofWAsIHRoaXMuZW50cnlTZWxlY3RvciwgdGhpcyk7XHJcblx0XHRcdFx0XHR0aGlzLmVuYWJsZSgpO1xyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodGhpcy5kaXNhYmxlZCAhPSBmYWxzZSkgdGhyb3cgMDtcclxuXHJcblx0XHRcdFx0aWYgKCFlbnRyaWVzLmxlbmd0aCAmJiB0aGlzLnNvZnREaXNhYmxlKSB7XHJcblx0XHRcdFx0XHRQb29wSnMuZGVidWcgJiYgY29uc29sZS5sb2coYEVmIHNvZnQtZGlzYWJsZWQ6IHgke3RoaXMuZW5hYmxlLmxlbmd0aH09PngwYCwgdGhpcy5lbnRyeVNlbGVjdG9yLCB0aGlzKTtcclxuXHRcdFx0XHRcdHRoaXMuZGlzYWJsZSgnc29mdCcpO1xyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0aWYgKHJlcGFyc2UpIHtcclxuXHRcdFx0XHRcdHRoaXMuZW50cnlEYXRhcyA9IG5ldyBNYXBUeXBlKCk7XHJcblx0XHRcdFx0XHR0aGlzLnJlcGFyc2VQZW5kaW5nID0gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICghdGhpcy5jb250YWluZXIuY2xvc2VzdCgnYm9keScpKSB7XHJcblx0XHRcdFx0XHR0aGlzLmNvbnRhaW5lci5hcHBlbmRUbygnYm9keScpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodGhpcy5lbnRyaWVzLmxlbmd0aCAhPSBlbnRyaWVzLmxlbmd0aCkge1xyXG5cdFx0XHRcdFx0UG9vcEpzLmRlYnVnICYmIGNvbnNvbGUubG9nKGBFZiB1cGRhdGU6IHgke3RoaXMuZW50cmllcy5sZW5ndGh9PT54JHtlbnRyaWVzLmxlbmd0aH1gLCB0aGlzLmVudHJ5U2VsZWN0b3IsIHRoaXMpO1xyXG5cdFx0XHRcdFx0Ly8gfHwgdGhpcy5lbnRyaWVzXHJcblx0XHRcdFx0XHQvLyBUT0RPOiBzb3J0IGVudHJpZXMgaW4gaW5pdGlhbCBvcmRlclxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLmVudHJpZXMgPSBlbnRyaWVzO1xyXG5cdFx0XHRcdHRoaXMuZmlsdGVyRW50cmllcygpO1xyXG5cdFx0XHRcdHRoaXMuc29ydEVudHJpZXMoKTtcclxuXHRcdFx0XHR0aGlzLm1vZGlmeUVudHJpZXMoKTtcclxuXHRcdFx0XHRsZXQgdGltZVVzZWQgPSBwZXJmb3JtYW5jZS5ub3coKSAtIG5vdztcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhgRUY6IHVwZGF0ZSB0b29rICR7fn50aW1lVXNlZH1tc2ApO1xyXG5cdFx0XHRcdHRoaXMuX3ByZXZpb3VzU3RhdGUudXBkYXRlRHVyYXRpb24gPSA5OV85OTk7XHJcblx0XHRcdFx0dGhpcy5fcHJldmlvdXNTdGF0ZS5maW5pc2hlZEF0ID0gcGVyZm9ybWFuY2Uubm93KCkgKyA5OV85OTk7XHJcblx0XHRcdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcclxuXHRcdFx0XHRcdGxldCBkdCA9IHRoaXMuX3ByZXZpb3VzU3RhdGUudXBkYXRlRHVyYXRpb24gPSBwZXJmb3JtYW5jZS5ub3coKSAtIG5vdztcclxuXHRcdFx0XHRcdHRoaXMuX3ByZXZpb3VzU3RhdGUuZmluaXNoZWRBdCA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRvZmZJbmNvbXBhdGlibGUoaW5jb21wYXRpYmxlOiBzdHJpbmdbXSkge1xyXG5cdFx0XHRcdGZvciAobGV0IGZpbHRlciBvZiB0aGlzLmZpbHRlcnMpIHtcclxuXHRcdFx0XHRcdGlmIChpbmNvbXBhdGlibGUuaW5jbHVkZXMoZmlsdGVyLmlkKSkge1xyXG5cdFx0XHRcdFx0XHRmaWx0ZXIudG9nZ2xlTW9kZSgnb2ZmJyk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZvciAobGV0IHNvcnRlciBvZiB0aGlzLnNvcnRlcnMpIHtcclxuXHRcdFx0XHRcdGlmIChpbmNvbXBhdGlibGUuaW5jbHVkZXMoc29ydGVyLmlkKSkge1xyXG5cdFx0XHRcdFx0XHRzb3J0ZXIudG9nZ2xlTW9kZSgnb2ZmJyk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZvciAobGV0IG1vZGlmaWVyIG9mIHRoaXMubW9kaWZpZXJzKSB7XHJcblx0XHRcdFx0XHRpZiAoaW5jb21wYXRpYmxlLmluY2x1ZGVzKG1vZGlmaWVyLmlkKSkge1xyXG5cdFx0XHRcdFx0XHRtb2RpZmllci50b2dnbGVNb2RlKCdvZmYnKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHN0eWxlKHMgPSAnJykge1xyXG5cdFx0XHRcdEVudHJ5RmlsdGVyZXIuc3R5bGUocyk7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHRcdH1cclxuXHRcdFx0c3RhdGljIHN0eWxlKHMgPSAnJykge1xyXG5cdFx0XHRcdGxldCBzdHlsZSA9IHEoJ3N0eWxlLmVmLXN0eWxlJykgfHwgZWxtKCdzdHlsZS5lZi1zdHlsZScpLmFwcGVuZFRvKCdoZWFkJyk7XHJcblx0XHRcdFx0c3R5bGUuaW5uZXJIVE1MID0gYFxyXG5cdFx0XHRcdFx0LmVmLWNvbnRhaW5lciB7XHJcblx0XHRcdFx0XHRcdGRpc3BsYXk6IGZsZXg7XHJcblx0XHRcdFx0XHRcdGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XHJcblx0XHRcdFx0XHRcdHBvc2l0aW9uOiBmaXhlZDtcclxuXHRcdFx0XHRcdFx0dG9wOiAwO1xyXG5cdFx0XHRcdFx0XHRyaWdodDogMDtcclxuXHRcdFx0XHRcdFx0ei1pbmRleDogOTk5OTk5OTk5OTk5OTk5OTk5OTtcclxuXHRcdFx0XHRcdFx0bWluLXdpZHRoOiAxMDBweDtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC5lZi1lbnRyeSB7fVxyXG5cclxuXHRcdFx0XHRcdC5lZi1maWx0ZXJlZC1vdXQge1xyXG5cdFx0XHRcdFx0XHRkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0YnV0dG9uLmVmLWl0ZW0ge31cclxuXHRcdFx0XHRcdGJ1dHRvbi5lZi1pdGVtW2VmLW1vZGU9XCJvZmZcIl0ge1xyXG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kOiBsaWdodGdyYXk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRidXR0b24uZWYtaXRlbVtlZi1tb2RlPVwib25cIl0ge1xyXG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kOiBsaWdodGdyZWVuO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0YnV0dG9uLmVmLWl0ZW1bZWYtbW9kZT1cIm9wcG9zaXRlXCJdIHtcclxuXHRcdFx0XHRcdFx0YmFja2dyb3VuZDogeWVsbG93O1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGJ1dHRvbi5lZi1pdGVtLmVmLWZpbHRlciA+IGlucHV0IHtcclxuXHRcdFx0XHRcdFx0ZmxvYXQ6IHJpZ2h0O1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFtlZi1wcmVmaXhdOjpiZWZvcmUge1xyXG5cdFx0XHRcdFx0XHRjb250ZW50OiBhdHRyKGVmLXByZWZpeCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRbZWYtcG9zdGZpeF06OmFmdGVyIHtcclxuXHRcdFx0XHRcdFx0Y29udGVudDogYXR0cihlZi1wb3N0Zml4KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdGAgKyBzO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRzb2Z0RGlzYWJsZSA9IHRydWU7XHJcblx0XHRcdGRpc2FibGVkOiBib29sZWFuIHwgJ3NvZnQnID0gZmFsc2U7XHJcblx0XHRcdGRpc2FibGUoc29mdD86ICdzb2Z0Jykge1xyXG5cdFx0XHRcdHRoaXMuZGlzYWJsZWQgPSB0cnVlO1xyXG5cdFx0XHRcdGlmIChzb2Z0ID09ICdzb2Z0JykgdGhpcy5kaXNhYmxlZCA9ICdzb2Z0JztcclxuXHRcdFx0XHR0aGlzLmNvbnRhaW5lci5yZW1vdmUoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbmFibGUoKSB7XHJcblx0XHRcdFx0dGhpcy5kaXNhYmxlZCA9IGZhbHNlO1xyXG5cdFx0XHRcdHRoaXMudXBkYXRlUGVuZGluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdHRoaXMucmVxdWVzdFVwZGF0ZSgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjbGVhcigpIHtcclxuXHRcdFx0XHR0aGlzLmVudHJ5RGF0YXMgPSBuZXcgTWFwVHlwZSgpO1xyXG5cdFx0XHRcdHRoaXMucGFyc2Vycy5zcGxpY2UoMCwgOTk5KTtcclxuXHRcdFx0XHR0aGlzLmZpbHRlcnMuc3BsaWNlKDAsIDk5OSkubWFwKGUgPT4gZS5yZW1vdmUoKSk7XHJcblx0XHRcdFx0dGhpcy5zb3J0ZXJzLnNwbGljZSgwLCA5OTkpLm1hcChlID0+IGUucmVtb3ZlKCkpO1xyXG5cdFx0XHRcdHRoaXMubW9kaWZpZXJzLnNwbGljZSgwLCA5OTkpLm1hcChlID0+IGUucmVtb3ZlKCkpO1xyXG5cdFx0XHRcdHRoaXMuZW5hYmxlKCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGdldCBfZGF0YXMoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuZW50cmllc1xyXG5cdFx0XHRcdFx0LmZpbHRlcihlID0+ICFlLmNsYXNzTGlzdC5jb250YWlucygnZWYtZmlsdGVyZWQtb3V0JykpXHJcblx0XHRcdFx0XHQubWFwKGUgPT4gdGhpcy5nZXREYXRhKGUpKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBJc1Byb21pc2U8VD4ocDogUHJvbWlzZUxpa2U8VD4gfCBUKTogcCBpcyBQcm9taXNlTGlrZTxUPiB7XHJcblx0XHRcdGlmICghcCkgcmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRyZXR1cm4gdHlwZW9mIChwIGFzIFByb21pc2VMaWtlPFQ+KS50aGVuID09ICdmdW5jdGlvbic7XHJcblx0XHR9XHJcblx0fVxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblx0ZXhwb3J0IGNsYXNzIE9ic2VydmVyIHtcclxuXHRcdFxyXG5cdH1cclxufVxyXG5cclxuLypcclxuXHJcbmZ1bmN0aW9uIG9ic2VydmVDbGFzc0FkZChjbHMsIGNiKSB7XHJcblx0bGV0IHF1ZXVlZCA9IGZhbHNlO1xyXG5cdGFzeW5jIGZ1bmN0aW9uIHJ1bigpIHtcclxuXHRcdGlmIChxdWV1ZWQpIHJldHVybjtcclxuXHRcdHF1ZXVlZCA9IHRydWU7XHJcblx0XHRhd2FpdCBQcm9taXNlLmZyYW1lKCk7XHJcblx0XHRxdWV1ZWQgPSBmYWxzZTtcclxuXHRcdGNiKCk7XHJcblx0fVxyXG5cdG5ldyBNdXRhdGlvbk9ic2VydmVyKGxpc3QgPT4ge1xyXG5cdFx0Zm9yIChsZXQgbXIgb2YgbGlzdCkge1xyXG5cdFx0XHRpZiAobXIudHlwZSA9PSAnYXR0cmlidXRlcycgJiYgbXIuYXR0cmlidXRlTmFtZSA9PSAnY2xhc3MnKSB7XHJcblx0XHRcdFx0aWYgKG1yLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoY2xzKSkge1xyXG5cdFx0XHRcdFx0cnVuKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChtci50eXBlID09ICdjaGlsZExpc3QnKSB7XHJcblx0XHRcdFx0Zm9yIChsZXQgY2ggb2YgbXIuYWRkZWROb2Rlcykge1xyXG5cdFx0XHRcdFx0aWYgKGNoLmNsYXNzTGlzdD8uY29udGFpbnMoY2xzKSkge1xyXG5cdFx0XHRcdFx0XHRydW4oKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9KS5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHtcclxuXHRcdGNoaWxkTGlzdDogdHJ1ZSxcclxuXHRcdGF0dHJpYnV0ZXM6IHRydWUsXHJcblx0XHRzdWJ0cmVlOiB0cnVlLFxyXG5cdH0pO1xyXG59XHJcblxyXG4qLyIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIFBhZ2luYXRlRXh0ZW5zaW9uIHtcclxuXHJcblx0XHRleHBvcnQgdHlwZSBQUmVxdWVzdEV2ZW50ID0gQ3VzdG9tRXZlbnQ8e1xyXG5cdFx0XHRyZWFzb24/OiBLZXlib2FyZEV2ZW50IHwgTW91c2VFdmVudCxcclxuXHRcdFx0Y291bnQ6IG51bWJlcixcclxuXHRcdFx0Y29uc3VtZWQ6IG51bWJlcixcclxuXHRcdFx0X2V2ZW50PzogJ3BhZ2luYXRpb25yZXF1ZXN0JyxcclxuXHRcdH0+O1xyXG5cdFx0ZXhwb3J0IHR5cGUgUFN0YXJ0RXZlbnQgPSBDdXN0b21FdmVudDx7XHJcblx0XHRcdHBhZ2luYXRlOiBQYWdpbmF0ZSxcclxuXHRcdFx0X2V2ZW50PzogJ3BhZ2luYXRpb25zdGFydCcsXHJcblx0XHR9PjtcclxuXHRcdGV4cG9ydCB0eXBlIFBFbmRFdmVudCA9IEN1c3RvbUV2ZW50PHtcclxuXHRcdFx0cGFnaW5hdGU6IFBhZ2luYXRlLFxyXG5cdFx0XHRfZXZlbnQ/OiAncGFnaW5hdGlvbmVuZCcsXHJcblx0XHR9PjtcclxuXHRcdGV4cG9ydCB0eXBlIFBNb2RpZnlFdmVudCA9IEN1c3RvbUV2ZW50PHtcclxuXHRcdFx0cGFnaW5hdGU6IFBhZ2luYXRlLFxyXG5cdFx0XHRhZGRlZDogSFRNTEVsZW1lbnRbXSxcclxuXHRcdFx0cmVtb3ZlZDogSFRNTEVsZW1lbnRbXSxcclxuXHRcdFx0c2VsZWN0b3I6IHNlbGVjdG9yLFxyXG5cdFx0XHRfZXZlbnQ/OiAncGFnaW5hdGlvbm1vZGlmeScsXHJcblx0XHR9PjtcclxuXHJcblx0XHRleHBvcnQgY2xhc3MgUGFnaW5hdGUge1xyXG5cdFx0XHRkb2M6IERvY3VtZW50O1xyXG5cclxuXHRcdFx0ZW5hYmxlZCA9IHRydWU7XHJcblx0XHRcdGNvbmRpdGlvbjogc2VsZWN0b3IgfCAoKCkgPT4gYm9vbGVhbik7XHJcblx0XHRcdHF1ZXVlZCA9IDA7XHJcblx0XHRcdHJ1bm5pbmcgPSBmYWxzZTtcclxuXHRcdFx0X2luaXRlZCA9IGZhbHNlO1xyXG5cdFx0XHRzaGlmdFJlcXVlc3RDb3VudD86IG51bWJlciB8ICgoKSA9PiBudW1iZXIpO1xyXG5cclxuXHRcdFx0c3RhdGljIHNoaWZ0UmVxdWVzdENvdW50ID0gMTA7XHJcblx0XHRcdHN0YXRpYyBfaW5pdGVkID0gZmFsc2U7XHJcblx0XHRcdHN0YXRpYyByZW1vdmVEZWZhdWx0UnVuQmluZGluZ3M6ICgpID0+IHZvaWQ7XHJcblx0XHRcdHN0YXRpYyBhZGREZWZhdWx0UnVuQmluZGluZ3MoKSB7XHJcblx0XHRcdFx0UGFnaW5hdGUucmVtb3ZlRGVmYXVsdFJ1bkJpbmRpbmdzPy4oKTtcclxuXHRcdFx0XHRmdW5jdGlvbiBvbm1vdXNlZG93bihldmVudDogTW91c2VFdmVudCkge1xyXG5cdFx0XHRcdFx0aWYgKGV2ZW50LmJ1dHRvbiAhPSAxKSByZXR1cm47XHJcblx0XHRcdFx0XHRsZXQgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIEVsZW1lbnQ7XHJcblx0XHRcdFx0XHRpZiAodGFyZ2V0Py5jbG9zZXN0KCdhJykpIHJldHVybjtcclxuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFx0XHRsZXQgY291bnQgPSBldmVudC5zaGlmdEtleSA/IFBhZ2luYXRlLnNoaWZ0UmVxdWVzdENvdW50IDogMTtcclxuXHRcdFx0XHRcdFBhZ2luYXRlLnJlcXVlc3RQYWdpbmF0aW9uKGNvdW50LCBldmVudCwgdGFyZ2V0KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZnVuY3Rpb24gb25rZXlkb3duKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XHJcblx0XHRcdFx0XHRpZiAoZXZlbnQuY29kZSAhPSAnQWx0UmlnaHQnKSByZXR1cm47XHJcblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdFx0bGV0IGNvdW50ID0gZXZlbnQuc2hpZnRLZXkgPyBQYWdpbmF0ZS5zaGlmdFJlcXVlc3RDb3VudCA6IDE7XHJcblx0XHRcdFx0XHRsZXQgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIEVsZW1lbnQ7XHJcblx0XHRcdFx0XHRQYWdpbmF0ZS5yZXF1ZXN0UGFnaW5hdGlvbihjb3VudCwgZXZlbnQsIHRhcmdldCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIG9ubW91c2Vkb3duKTtcclxuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25rZXlkb3duKTtcclxuXHRcdFx0XHRQYWdpbmF0ZS5yZW1vdmVEZWZhdWx0UnVuQmluZGluZ3MgPSAoKSA9PiB7XHJcblx0XHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBvbm1vdXNlZG93bik7XHJcblx0XHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25rZXlkb3duKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0c3RhdGljIGluc3RhbmNlczogUGFnaW5hdGVbXSA9IFtdO1xyXG5cclxuXHRcdFx0Ly8gbGlzdGVuZXJzXHJcblx0XHRcdGluaXQoKSB7XHJcblx0XHRcdFx0aWYgKCFQYWdpbmF0ZS5yZW1vdmVEZWZhdWx0UnVuQmluZGluZ3MpIHtcclxuXHRcdFx0XHRcdFBhZ2luYXRlLmFkZERlZmF1bHRSdW5CaW5kaW5ncygpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodGhpcy5faW5pdGVkKSByZXR1cm47XHJcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcjxQUmVxdWVzdEV2ZW50PigncGFnaW5hdGlvbnJlcXVlc3QnLCB0aGlzLm9uUGFnaW5hdGlvblJlcXVlc3QuYmluZCh0aGlzKSk7XHJcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcjxQRW5kRXZlbnQ+KCdwYWdpbmF0aW9uZW5kJywgdGhpcy5vblBhZ2luYXRpb25FbmQuYmluZCh0aGlzKSk7XHJcblx0XHRcdFx0UGFnaW5hdGUuaW5zdGFuY2VzLnB1c2godGhpcyk7XHJcblx0XHRcdFx0aWYgKFBvb3BKcy5kZWJ1Zykge1xyXG5cdFx0XHRcdFx0bGV0IGFjdGl2ZSA9IHRoaXMuY2FuQ29uc3VtZVJlcXVlc3QoKSA/ICdhY3RpdmUnIDogJ2luYWN0aXZlJztcclxuXHRcdFx0XHRcdGlmIChhY3RpdmUgPT0gJ2FjdGl2ZScpXHJcblx0XHRcdFx0XHRcdFBvb3BKcy5kZWJ1ZyAmJiBjb25zb2xlLmxvZyhgUGFnaW5hdGUgaW5zdGFudGlhdGVkICgke2FjdGl2ZX0pOiBgLCB0aGlzLmRhdGEpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRvblBhZ2luYXRpb25SZXF1ZXN0KGV2ZW50OiBQUmVxdWVzdEV2ZW50KSB7XHJcblx0XHRcdFx0aWYgKHRoaXMuY2FuQ29uc3VtZVJlcXVlc3QoKSkge1xyXG5cdFx0XHRcdFx0ZXZlbnQuZGV0YWlsLmNvbnN1bWVkKys7XHJcblx0XHRcdFx0XHRsZXQgcXVldWVkID0gIWV2ZW50LmRldGFpbC5yZWFzb24/LnNoaWZ0S2V5ID8gbnVsbCA6IHR5cGVvZiB0aGlzLnNoaWZ0UmVxdWVzdENvdW50ID09ICdmdW5jdGlvbicgPyB0aGlzLnNoaWZ0UmVxdWVzdENvdW50KCkgOiB0aGlzLnNoaWZ0UmVxdWVzdENvdW50O1xyXG5cdFx0XHRcdFx0dGhpcy5xdWV1ZWQgKz0gcXVldWVkID8/IGV2ZW50LmRldGFpbC5jb3VudDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKCF0aGlzLnJ1bm5pbmcgJiYgdGhpcy5xdWV1ZWQpIHtcclxuXHRcdFx0XHRcdHRoaXMuY29uc3VtZVJlcXVlc3QoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH07XHJcblx0XHRcdG9uUGFnaW5hdGlvbkVuZChldmVudDogUEVuZEV2ZW50KSB7XHJcblx0XHRcdFx0aWYgKHRoaXMucXVldWVkICYmIHRoaXMuY2FuQ29uc3VtZVJlcXVlc3QoKSkge1xyXG5cdFx0XHRcdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcclxuXHRcdFx0XHRcdFx0aWYgKCF0aGlzLmNhbkNvbnN1bWVSZXF1ZXN0KCkpIHtcclxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oYHRoaXMgcGFnaW5hdGUgY2FuIG5vdCB3b3JrIGFueW1vcmVgKTtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLnF1ZXVlZCA9IDA7XHJcblx0XHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5jb25zdW1lUmVxdWVzdCgpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0Y2FuQ29uc3VtZVJlcXVlc3QoKSB7XHJcblx0XHRcdFx0aWYgKCF0aGlzLmVuYWJsZWQpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHRpZiAodGhpcy5ydW5uaW5nKSByZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHRpZiAodGhpcy5jb25kaXRpb24pIHtcclxuXHRcdFx0XHRcdGlmICh0eXBlb2YgdGhpcy5jb25kaXRpb24gPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0XHRpZiAoIXRoaXMuY29uZGl0aW9uKCkpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdGlmICghZG9jdW1lbnQucSh0aGlzLmNvbmRpdGlvbikpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH1cclxuXHRcdFx0YXN5bmMgY29uc3VtZVJlcXVlc3QoKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMucnVubmluZykgcmV0dXJuO1xyXG5cdFx0XHRcdHRoaXMucXVldWVkLS07XHJcblx0XHRcdFx0dGhpcy5ydW5uaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHR0aGlzLmVtaXRTdGFydCgpO1xyXG5cdFx0XHRcdGF3YWl0IHRoaXMub25ydW4/LigpO1xyXG5cdFx0XHRcdHRoaXMucnVubmluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdHRoaXMuZW1pdEVuZCgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdG9ucnVuOiAoKSA9PiBQcm9taXNlPHZvaWQ+O1xyXG5cclxuXHJcblx0XHRcdC8vIGVtaXR0ZXJzXHJcblx0XHRcdHN0YXRpYyByZXF1ZXN0UGFnaW5hdGlvbihjb3VudCA9IDEsIHJlYXNvbj86IFBSZXF1ZXN0RXZlbnRbJ2RldGFpbCddWydyZWFzb24nXSwgdGFyZ2V0OiBFbGVtZW50ID0gZG9jdW1lbnQuYm9keSkge1xyXG5cdFx0XHRcdGxldCBkZXRhaWw6IFBSZXF1ZXN0RXZlbnRbJ2RldGFpbCddID0geyBjb3VudCwgcmVhc29uLCBjb25zdW1lZDogMCB9O1xyXG5cdFx0XHRcdGZ1bmN0aW9uIGZhaWwoZXZlbnQ6IFBSZXF1ZXN0RXZlbnQpIHtcclxuXHRcdFx0XHRcdGlmIChldmVudC5kZXRhaWwuY29uc3VtZWQgPT0gMCkge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFBhZ2luYXRpb24gcmVxdWVzdCBmYWlsZWQ6IG5vIGxpc3RlbmVyc2ApO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cmVtb3ZlRXZlbnRMaXN0ZW5lcigncGFnaW5hdGlvbnJlcXVlc3QnLCBmYWlsKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0YWRkRXZlbnRMaXN0ZW5lcigncGFnaW5hdGlvbnJlcXVlc3QnLCBmYWlsKTtcclxuXHRcdFx0XHR0YXJnZXQuZW1pdDxQUmVxdWVzdEV2ZW50PigncGFnaW5hdGlvbnJlcXVlc3QnLCB7IGNvdW50LCByZWFzb24sIGNvbnN1bWVkOiAwIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVtaXRTdGFydCgpIHtcclxuXHRcdFx0XHRkb2N1bWVudC5ib2R5LmVtaXQ8UFN0YXJ0RXZlbnQ+KCdwYWdpbmF0aW9uc3RhcnQnLCB7IHBhZ2luYXRlOiB0aGlzIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVtaXRNb2RpZnkoYWRkZWQsIHJlbW92ZWQsIHNlbGVjdG9yKSB7XHJcblx0XHRcdFx0ZG9jdW1lbnQuYm9keS5lbWl0PFBNb2RpZnlFdmVudD4oJ3BhZ2luYXRpb25tb2RpZnknLCB7IHBhZ2luYXRlOiB0aGlzLCBhZGRlZCwgcmVtb3ZlZCwgc2VsZWN0b3IgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZW1pdEVuZCgpIHtcclxuXHRcdFx0XHRkb2N1bWVudC5ib2R5LmVtaXQ8UEVuZEV2ZW50PigncGFnaW5hdGlvbmVuZCcsIHsgcGFnaW5hdGU6IHRoaXMgfSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIGZldGNoaW5nOiBcclxuXHRcdFx0YXN5bmMgZmV0Y2hEb2N1bWVudChsaW5rOiBMaW5rLCBzcGlubmVyID0gdHJ1ZSwgbWF4QWdlOiBkZWx0YVRpbWUgPSAwKTogUHJvbWlzZTxEb2N1bWVudD4ge1xyXG5cdFx0XHRcdHRoaXMuZG9jID0gbnVsbDtcclxuXHRcdFx0XHRsZXQgYSA9IHNwaW5uZXIgJiYgUGFnaW5hdGUubGlua1RvQW5jaG9yKGxpbmspO1xyXG5cdFx0XHRcdGE/LmNsYXNzTGlzdC5hZGQoJ3BhZ2luYXRlLXNwaW4nKTtcclxuXHRcdFx0XHRsaW5rID0gUGFnaW5hdGUubGlua1RvVXJsKGxpbmspO1xyXG5cdFx0XHRcdGxldCBpbml0ID0geyBtYXhBZ2UsIHhtbDogdGhpcy5kYXRhLnhtbCB9O1xyXG5cdFx0XHRcdHRoaXMuZG9jID0gIW1heEFnZSA/IGF3YWl0IGZldGNoLmRvYyhsaW5rLCBpbml0KSA6IGF3YWl0IGZldGNoLmNhY2hlZC5kb2MobGluaywgaW5pdCk7XHJcblx0XHRcdFx0YT8uY2xhc3NMaXN0LnJlbW92ZSgncGFnaW5hdGUtc3BpbicpO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmRvYztcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0c3RhdGljIHByZWZldGNoKHNvdXJjZTogc2VsZWN0b3IpIHtcclxuXHRcdFx0XHRkb2N1bWVudC5xcTwnYSc+KHNvdXJjZSkubWFwKGUgPT4ge1xyXG5cdFx0XHRcdFx0aWYgKGUuaHJlZikge1xyXG5cdFx0XHRcdFx0XHRlbG0oYGxpbmtbcmVsPVwicHJlZmV0Y2hcIl1baHJlZj1cIiR7ZS5ocmVmfVwiXWApLmFwcGVuZFRvKCdoZWFkJyk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvLyBUT0RPOiBpZiBlLnNyY1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0Ly8gbW9kaWZpY2F0aW9uOiBcclxuXHRcdFx0YWZ0ZXIoc291cmNlOiBzZWxlY3RvciwgdGFyZ2V0OiBzZWxlY3RvciA9IHNvdXJjZSkge1xyXG5cdFx0XHRcdGxldCBhZGRlZCA9IHRoaXMuZG9jLnFxKHNvdXJjZSk7XHJcblx0XHRcdFx0aWYgKCFhZGRlZC5sZW5ndGgpIHJldHVybjtcclxuXHRcdFx0XHRsZXQgZm91bmQgPSBkb2N1bWVudC5xcSh0YXJnZXQpO1xyXG5cdFx0XHRcdGlmIChmb3VuZC5sZW5ndGggPT0gMCkgdGhyb3cgbmV3IEVycm9yKGBmYWlsZWQgdG8gZmluZCB3aGVyZSB0byBhcHBlbmRgKTtcclxuXHRcdFx0XHRmb3VuZC5wb3AoKS5hZnRlciguLi5hZGRlZCk7XHJcblx0XHRcdFx0dGhpcy5lbWl0TW9kaWZ5KGFkZGVkLCBbXSwgc291cmNlKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXBsYWNlRWFjaChzb3VyY2U6IHNlbGVjdG9yLCB0YXJnZXQ6IHNlbGVjdG9yID0gc291cmNlKSB7XHJcblx0XHRcdFx0bGV0IGFkZGVkID0gdGhpcy5kb2MucXEoc291cmNlKTtcclxuXHRcdFx0XHRsZXQgcmVtb3ZlZCA9IGRvY3VtZW50LnFxKHRhcmdldCk7XHJcblx0XHRcdFx0aWYgKGFkZGVkLmxlbmd0aCAhPSByZW1vdmVkLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKGBhZGRlZC9yZW1vdmVkIGNvdW50IG1pc21hdGNoYCk7XHJcblx0XHRcdFx0cmVtb3ZlZC5tYXAoKGUsIGkpID0+IGUucmVwbGFjZVdpdGgoYWRkZWRbaV0pKTtcclxuXHRcdFx0XHR0aGlzLmVtaXRNb2RpZnkoYWRkZWQsIHJlbW92ZWQsIHNvdXJjZSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmVwbGFjZShzb3VyY2U6IHNlbGVjdG9yLCB0YXJnZXQ6IHNlbGVjdG9yID0gc291cmNlKSB7XHJcblx0XHRcdFx0bGV0IGFkZGVkID0gdGhpcy5kb2MucXEoc291cmNlKTtcclxuXHRcdFx0XHRsZXQgcmVtb3ZlZCA9IGRvY3VtZW50LnFxKHRhcmdldCk7XHJcblx0XHRcdFx0aWYgKGFkZGVkLmxlbmd0aCAhPSByZW1vdmVkLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKGBub3QgaW1wbGVtZW50ZWRgKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5yZXBsYWNlRWFjaChzb3VyY2UsIHRhcmdldCk7XHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHQvLyB1dGlsXHJcblx0XHRcdHN0YXRpYyBsaW5rVG9VcmwobGluazogTGluayk6IHVybCB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiBsaW5rID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRpZiAobGluay5zdGFydHNXaXRoKCdodHRwJykpIHJldHVybiBsaW5rIGFzIHVybDtcclxuXHRcdFx0XHRcdGxpbmsgPSBkb2N1bWVudC5xPCdhJz4obGluayk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChsaW5rLnRhZ05hbWUgIT0gJ0EnKSB0aHJvdyBuZXcgRXJyb3IoJ2xpbmsgc2hvdWxkIGJlIDxhPiBlbGVtZW50IScpO1xyXG5cdFx0XHRcdHJldHVybiAobGluayBhcyBIVE1MQW5jaG9yRWxlbWVudCkuaHJlZiBhcyB1cmw7XHJcblx0XHRcdH1cclxuXHRcdFx0c3RhdGljIGxpbmtUb0FuY2hvcihsaW5rOiBMaW5rKTogSFRNTEFuY2hvckVsZW1lbnQge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgbGluayA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0aWYgKGxpbmsuc3RhcnRzV2l0aCgnaHR0cCcpKSByZXR1cm4gbnVsbDtcclxuXHRcdFx0XHRcdHJldHVybiBkb2N1bWVudC5xPCdhJz4obGluayk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBsaW5rO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRzdGF0aWMgc3RhdGljQ2FsbDxUPih0aGlzOiB2b2lkLCBkYXRhOiBQYXJhbWV0ZXJzPFBhZ2luYXRlWydzdGF0aWNDYWxsJ10+WzBdKSB7XHJcblx0XHRcdFx0bGV0IHAgPSBuZXcgUGFnaW5hdGUoKTtcclxuXHRcdFx0XHRwLnN0YXRpY0NhbGwoZGF0YSk7XHJcblx0XHRcdFx0cmV0dXJuIHA7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJhd0RhdGE6IGFueTtcclxuXHRcdFx0ZGF0YToge1xyXG5cdFx0XHRcdGNvbmRpdGlvbjogKCkgPT4gYm9vbGVhbjtcclxuXHRcdFx0XHRwcmVmZXRjaDogYW55W107XHJcblx0XHRcdFx0ZG9jOiBzZWxlY3RvcltdO1xyXG5cdFx0XHRcdGNsaWNrOiBzZWxlY3RvcltdO1xyXG5cdFx0XHRcdGFmdGVyOiBzZWxlY3RvcltdO1xyXG5cdFx0XHRcdHJlcGxhY2U6IHNlbGVjdG9yW107XHJcblx0XHRcdFx0bWF4QWdlOiBkZWx0YVRpbWU7XHJcblx0XHRcdFx0c3RhcnQ/OiAodGhpczogUGFnaW5hdGUpID0+IHZvaWQ7XHJcblx0XHRcdFx0bW9kaWZ5PzogKHRoaXM6IFBhZ2luYXRlLCBkb2M6IERvY3VtZW50KSA9PiB2b2lkO1xyXG5cdFx0XHRcdGVuZD86ICh0aGlzOiBQYWdpbmF0ZSwgZG9jOiBEb2N1bWVudCkgPT4gdm9pZDtcclxuXHRcdFx0XHR4bWw/OiBib29sZWFuO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHRzdGF0aWNDYWxsKGRhdGE6IHtcclxuXHRcdFx0XHRjb25kaXRpb24/OiBzZWxlY3RvciB8ICgoKSA9PiBib29sZWFuKSxcclxuXHRcdFx0XHRwcmVmZXRjaD86IHNlbGVjdG9yIHwgc2VsZWN0b3JbXSxcclxuXHRcdFx0XHRjbGljaz86IHNlbGVjdG9yIHwgc2VsZWN0b3JbXSxcclxuXHRcdFx0XHRkb2M/OiBzZWxlY3RvciB8IHNlbGVjdG9yW10sXHJcblx0XHRcdFx0YWZ0ZXI/OiBzZWxlY3RvciB8IHNlbGVjdG9yW10sXHJcblx0XHRcdFx0cmVwbGFjZT86IHNlbGVjdG9yIHwgc2VsZWN0b3JbXSxcclxuXHRcdFx0XHRzdGFydD86ICh0aGlzOiBQYWdpbmF0ZSkgPT4gdm9pZDtcclxuXHRcdFx0XHRtb2RpZnk/OiAodGhpczogUGFnaW5hdGUsIGRvYzogRG9jdW1lbnQpID0+IHZvaWQ7XHJcblx0XHRcdFx0ZW5kPzogKHRoaXM6IFBhZ2luYXRlLCBkb2M6IERvY3VtZW50KSA9PiB2b2lkO1xyXG5cdFx0XHRcdG1heEFnZT86IGRlbHRhVGltZTtcclxuXHRcdFx0XHRjYWNoZT86IGRlbHRhVGltZSB8IHRydWU7XHJcblx0XHRcdFx0eG1sPzogYm9vbGVhbjtcclxuXHRcdFx0XHRwYWdlcj86IHNlbGVjdG9yIHwgc2VsZWN0b3JbXTtcclxuXHRcdFx0XHRzaGlmdGVkPzogbnVtYmVyIHwgKCgpID0+IG51bWJlcik7XHJcblx0XHRcdH0pIHtcclxuXHRcdFx0XHRmdW5jdGlvbiB0b0FycmF5PFQ+KHY/OiBUIHwgVFtdIHwgdW5kZWZpbmVkKTogVFtdIHtcclxuXHRcdFx0XHRcdGlmIChBcnJheS5pc0FycmF5KHYpKSByZXR1cm4gdjtcclxuXHRcdFx0XHRcdGlmICh2ID09IG51bGwpIHJldHVybiBbXTtcclxuXHRcdFx0XHRcdHJldHVybiBbdl07XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZ1bmN0aW9uIHRvQ29uZGl0aW9uKHM/OiBzZWxlY3RvciB8ICgoKSA9PiBib29sZWFuKSB8IHVuZGVmaW5lZCk6ICgpID0+IGJvb2xlYW4ge1xyXG5cdFx0XHRcdFx0aWYgKCFzKSByZXR1cm4gKCkgPT4gdHJ1ZTtcclxuXHRcdFx0XHRcdGlmICh0eXBlb2YgcyA9PSAnc3RyaW5nJykgcmV0dXJuICgpID0+ICEhZG9jdW1lbnQucShzKTtcclxuXHRcdFx0XHRcdHJldHVybiBzO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRmdW5jdGlvbiBjYW5GaW5kKGE6IHNlbGVjdG9yW10pIHtcclxuXHRcdFx0XHRcdGlmIChhLmxlbmd0aCA9PSAwKSByZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHRcdHJldHVybiBhLnNvbWUocyA9PiAhIWRvY3VtZW50LnEocykpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRmdW5jdGlvbiBmaW5kT25lKGE6IHNlbGVjdG9yW10pIHtcclxuXHRcdFx0XHRcdHJldHVybiBhLmZpbmQocyA9PiBkb2N1bWVudC5xKHMpKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5yYXdEYXRhID0gZGF0YTtcclxuXHRcdFx0XHR0aGlzLmRhdGEgPSB7XHJcblx0XHRcdFx0XHRjb25kaXRpb246IHRvQ29uZGl0aW9uKGRhdGEuY29uZGl0aW9uKSxcclxuXHRcdFx0XHRcdHByZWZldGNoOiB0b0FycmF5PHNlbGVjdG9yPihkYXRhLnByZWZldGNoKVxyXG5cdFx0XHRcdFx0XHQuZmxhdE1hcChlID0+IHRvQXJyYXkoZGF0YVtlXSA/PyBlKSksXHJcblx0XHRcdFx0XHRkb2M6IHRvQXJyYXk8c2VsZWN0b3I+KGRhdGEuZG9jKSxcclxuXHRcdFx0XHRcdGNsaWNrOiB0b0FycmF5PHNlbGVjdG9yPihkYXRhLmNsaWNrKSxcclxuXHRcdFx0XHRcdGFmdGVyOiB0b0FycmF5PHNlbGVjdG9yPihkYXRhLmFmdGVyKSxcclxuXHRcdFx0XHRcdHJlcGxhY2U6IHRvQXJyYXk8c2VsZWN0b3I+KGRhdGEucmVwbGFjZSksXHJcblx0XHRcdFx0XHRtYXhBZ2U6IGRhdGEubWF4QWdlID8/IChkYXRhLmNhY2hlID09IHRydWUgPyAnMXknIDogZGF0YS5jYWNoZSksXHJcblx0XHRcdFx0XHRzdGFydDogZGF0YS5zdGFydCwgbW9kaWZ5OiBkYXRhLm1vZGlmeSwgZW5kOiBkYXRhLmVuZCxcclxuXHRcdFx0XHRcdHhtbDogZGF0YS54bWwsXHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHR0aGlzLnNoaWZ0UmVxdWVzdENvdW50ID0gZGF0YS5zaGlmdGVkO1xyXG5cdFx0XHRcdGlmIChkYXRhLnBhZ2VyKSB7XHJcblx0XHRcdFx0XHRsZXQgcGFnZXIgPSB0b0FycmF5PHNlbGVjdG9yPihkYXRhLnBhZ2VyKTtcclxuXHRcdFx0XHRcdHRoaXMuZGF0YS5kb2MgPSB0aGlzLmRhdGEuZG9jLmZsYXRNYXAoZSA9PiBwYWdlci5tYXAocCA9PiBgJHtwfSAke2V9YCkpO1xyXG5cdFx0XHRcdFx0dGhpcy5kYXRhLnJlcGxhY2UucHVzaCguLi5wYWdlcik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMuY29uZGl0aW9uID0gKCkgPT4ge1xyXG5cdFx0XHRcdFx0aWYgKCF0aGlzLmRhdGEuY29uZGl0aW9uKCkpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHRcdGlmICghY2FuRmluZCh0aGlzLmRhdGEuZG9jKSkgcmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdFx0aWYgKCFjYW5GaW5kKHRoaXMuZGF0YS5jbGljaykpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0dGhpcy5pbml0KCk7XHJcblx0XHRcdFx0aWYgKHRoaXMuZGF0YS5jb25kaXRpb24oKSkge1xyXG5cdFx0XHRcdFx0dGhpcy5kYXRhLnByZWZldGNoLm1hcChzID0+IFBhZ2luYXRlLnByZWZldGNoKHMpKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5vbnJ1biA9IGFzeW5jICgpID0+IHtcclxuXHRcdFx0XHRcdC8vIGlmICghZml4ZWREYXRhLmNvbmRpdGlvbigpKSByZXR1cm47XHJcblx0XHRcdFx0XHRhd2FpdCB0aGlzLmRhdGEuc3RhcnQ/LmNhbGwodGhpcyk7XHJcblx0XHRcdFx0XHR0aGlzLmRhdGEuY2xpY2subWFwKGUgPT4gZG9jdW1lbnQucShlKT8uY2xpY2soKSk7XHJcblx0XHRcdFx0XHRsZXQgZG9jID0gZmluZE9uZSh0aGlzLmRhdGEuZG9jKTtcclxuXHRcdFx0XHRcdGlmIChkb2MpIHtcclxuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5mZXRjaERvY3VtZW50KGRvYywgdHJ1ZSwgdGhpcy5kYXRhLm1heEFnZSk7XHJcblx0XHRcdFx0XHRcdHRoaXMuZGF0YS5yZXBsYWNlLm1hcChzID0+IHRoaXMucmVwbGFjZShzKSk7XHJcblx0XHRcdFx0XHRcdHRoaXMuZGF0YS5hZnRlci5tYXAocyA9PiB0aGlzLmFmdGVyKHMpKTtcclxuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5kYXRhLm1vZGlmeT8uY2FsbCh0aGlzLCB0aGlzLmRvYyk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRhd2FpdCB0aGlzLmRhdGEuZW5kPy5jYWxsKHRoaXMsIGRvYyAmJiB0aGlzLmRvYyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdH1cclxuXHRcdHR5cGUgU2VsT3JFbCA9IHNlbGVjdG9yIHwgSFRNTEVsZW1lbnQ7XHJcblx0XHR0eXBlIFNvbWVob3c8VD4gPSBudWxsIHwgVCB8IFRbXSB8ICgoKSA9PiAobnVsbCB8IFQgfCBUW10pKTtcclxuXHRcdHR5cGUgU29tZWhvd0FzeW5jPFQ+ID0gbnVsbCB8IFQgfCBUW10gfCAoKCkgPT4gKG51bGwgfCBUIHwgVFtdIHwgUHJvbWlzZTxudWxsIHwgVCB8IFRbXT4pKTtcclxuXHJcblx0XHRleHBvcnQgY29uc3QgcGFnaW5hdGUgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YoT2JqZWN0LmFzc2lnbihQYWdpbmF0ZS5zdGF0aWNDYWxsLCBuZXcgUGFnaW5hdGUoKSksIFBhZ2luYXRlKTtcclxuXHR9XHJcblxyXG5cdGV4cG9ydCBjb25zdCBwYWdpbmF0ZSA9IFBhZ2luYXRlRXh0ZW5zaW9uLnBhZ2luYXRlO1xyXG5cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cdGV4cG9ydCBuYW1lc3BhY2UgSW1hZ2VTY3JvbGxpbmdFeHRlbnNpb24ge1xyXG5cclxuXHRcdGV4cG9ydCBsZXQgaW1hZ2VTY3JvbGxpbmdBY3RpdmUgPSBmYWxzZTtcclxuXHRcdGV4cG9ydCBsZXQgaW1nU2VsZWN0b3IgPSAnaW1nJztcclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gaW1hZ2VTY3JvbGxpbmcoc2VsZWN0b3I/OiBzdHJpbmcpIHtcclxuXHRcdFx0aWYgKGltYWdlU2Nyb2xsaW5nQWN0aXZlKSByZXR1cm47XHJcblx0XHRcdGlmIChzZWxlY3RvcikgaW1nU2VsZWN0b3IgPSBzZWxlY3RvcjtcclxuXHRcdFx0aW1hZ2VTY3JvbGxpbmdBY3RpdmUgPSB0cnVlO1xyXG5cdFx0XHRmdW5jdGlvbiBvbndoZWVsKGV2ZW50OiBNb3VzZUV2ZW50ICYgeyB3aGVlbERlbHRhWTogbnVtYmVyIH0pIHtcclxuXHRcdFx0XHRpZiAoZXZlbnQuc2hpZnRLZXkgfHwgZXZlbnQuY3RybEtleSkgcmV0dXJuO1xyXG5cdFx0XHRcdGlmIChzY3JvbGxXaG9sZUltYWdlKC1NYXRoLnNpZ24oZXZlbnQud2hlZWxEZWx0YVkpKSkge1xyXG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIG9ud2hlZWwsIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdHJldHVybiBpbWFnZVNjcm9sbGluZ09mZiA9ICgpID0+IHtcclxuXHRcdFx0XHRpbWFnZVNjcm9sbGluZ0FjdGl2ZSA9IGZhbHNlO1xyXG5cdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNld2hlZWwnLCBvbndoZWVsKTtcclxuXHRcdFx0fTtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBiaW5kQXJyb3dzKCkge1xyXG5cdFx0XHRhZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZXZlbnQgPT4ge1xyXG5cdFx0XHRcdGlmIChldmVudC5jb2RlID09ICdBcnJvd0xlZnQnKSB7XHJcblx0XHRcdFx0XHRzY3JvbGxXaG9sZUltYWdlKC0xKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGV2ZW50LmNvZGUgPT0gJ0Fycm93UmlnaHQnKSB7XHJcblx0XHRcdFx0XHRzY3JvbGxXaG9sZUltYWdlKDEpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBsZXQgaW1hZ2VTY3JvbGxpbmdPZmYgPSAoKSA9PiB7IH07XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGltZ1RvV2luZG93Q2VudGVyKGltZzogRWxlbWVudCkge1xyXG5cdFx0XHRsZXQgcmVjdCA9IGltZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHRcdFx0cmV0dXJuIChyZWN0LnRvcCArIHJlY3QuYm90dG9tKSAvIDIgLSBpbm5lckhlaWdodCAvIDI7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIGdldEFsbEltYWdlSW5mbygpIHtcclxuXHRcdFx0bGV0IGltYWdlcyA9IHFxKGltZ1NlbGVjdG9yKSBhcyBIVE1MSW1hZ2VFbGVtZW50W107XHJcblx0XHRcdGxldCBkYXRhcyA9IGltYWdlcy5tYXAoKGltZywgaW5kZXgpID0+IHtcclxuXHRcdFx0XHRsZXQgcmVjdCA9IGltZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0aW1nLCByZWN0LCBpbmRleCxcclxuXHRcdFx0XHRcdGluU2NyZWVuOiByZWN0LnRvcCA+PSAtMSAmJiByZWN0LmJvdHRvbSA8PSBpbm5lckhlaWdodCxcclxuXHRcdFx0XHRcdGNyb3NzU2NyZWVuOiByZWN0LmJvdHRvbSA+PSAxICYmIHJlY3QudG9wIDw9IGlubmVySGVpZ2h0IC0gMSxcclxuXHRcdFx0XHRcdHlUb1NjcmVlbkNlbnRlcjogKHJlY3QudG9wICsgcmVjdC5ib3R0b20pIC8gMiAtIGlubmVySGVpZ2h0IC8gMixcclxuXHRcdFx0XHRcdGlzSW5DZW50ZXI6IE1hdGguYWJzKChyZWN0LnRvcCArIHJlY3QuYm90dG9tKSAvIDIgLSBpbm5lckhlaWdodCAvIDIpIDwgMyxcclxuXHRcdFx0XHRcdGlzU2NyZWVuSGVpZ2h0OiBNYXRoLmFicyhyZWN0LmhlaWdodCAtIGlubmVySGVpZ2h0KSA8IDMsXHJcblx0XHRcdFx0fTtcclxuXHRcdFx0fSkuZmlsdGVyKGUgPT4gZS5yZWN0Py53aWR0aCB8fCBlLnJlY3Q/LndpZHRoKTtcclxuXHRcdFx0cmV0dXJuIGRhdGFzO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBsZXQgc2Nyb2xsV2hvbGVJbWFnZVBlbmRpbmcgPSBmYWxzZTtcclxuXHJcblx0XHRleHBvcnQgZnVuY3Rpb24gZ2V0Q2VudHJhbEltZygpIHtcclxuXHRcdFx0cmV0dXJuIGdldEFsbEltYWdlSW5mbygpLnZzb3J0KGUgPT4gTWF0aC5hYnMoZS55VG9TY3JlZW5DZW50ZXIpKVswXT8uaW1nO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHNjcm9sbFdob2xlSW1hZ2UoZGlyID0gMSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRpZiAoc2Nyb2xsV2hvbGVJbWFnZVBlbmRpbmcpIHJldHVybiB0cnVlO1xyXG5cdFx0XHQvLyBpZiAoZGlyID09IDApIHRocm93IG5ldyBFcnJvcignc2Nyb2xsaW5nIGluIG5vIGRpcmVjdGlvbiEnKTtcclxuXHRcdFx0aWYgKCFkaXIpIHJldHVybiBmYWxzZTtcclxuXHJcblx0XHRcdGRpciA9IE1hdGguc2lnbihkaXIpO1xyXG5cdFx0XHRsZXQgZGF0YXMgPSBnZXRBbGxJbWFnZUluZm8oKS52c29ydChlID0+IGUueVRvU2NyZWVuQ2VudGVyKTtcclxuXHRcdFx0bGV0IGNlbnRyYWwgPSBkYXRhcy52c29ydChlID0+IE1hdGguYWJzKGUueVRvU2NyZWVuQ2VudGVyKSlbMF07XHJcblx0XHRcdGxldCBuZXh0Q2VudHJhbEluZGV4ID0gZGF0YXMuaW5kZXhPZihjZW50cmFsKTtcclxuXHRcdFx0d2hpbGUgKFxyXG5cdFx0XHRcdGRhdGFzW25leHRDZW50cmFsSW5kZXggKyBkaXJdICYmXHJcblx0XHRcdFx0TWF0aC5hYnMoZGF0YXNbbmV4dENlbnRyYWxJbmRleCArIGRpcl0ueVRvU2NyZWVuQ2VudGVyIC0gY2VudHJhbC55VG9TY3JlZW5DZW50ZXIpIDwgMTBcclxuXHRcdFx0KSBuZXh0Q2VudHJhbEluZGV4ICs9IGRpcjtcclxuXHRcdFx0Y2VudHJhbCA9IGRhdGFzW25leHRDZW50cmFsSW5kZXhdO1xyXG5cdFx0XHRsZXQgbmV4dCA9IGRhdGFzW25leHRDZW50cmFsSW5kZXggKyBkaXJdO1xyXG5cclxuXHRcdFx0ZnVuY3Rpb24gc2Nyb2xsVG9JbWFnZShkYXRhOiB0eXBlb2YgY2VudHJhbCB8IHVuZGVmaW5lZCk6IGJvb2xlYW4ge1xyXG5cdFx0XHRcdGlmICghZGF0YSkgcmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdGlmIChzY3JvbGxZICsgZGF0YS55VG9TY3JlZW5DZW50ZXIgPD0gMCAmJiBzY3JvbGxZIDw9IDApIHtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGRhdGEuaXNTY3JlZW5IZWlnaHQpIHtcclxuXHRcdFx0XHRcdGRhdGEuaW1nLnNjcm9sbEludG9WaWV3KCk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHNjcm9sbFRvKHNjcm9sbFgsIHNjcm9sbFkgKyBkYXRhLnlUb1NjcmVlbkNlbnRlcik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHNjcm9sbFdob2xlSW1hZ2VQZW5kaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHRQcm9taXNlLnJhZigyKS50aGVuKCgpID0+IHNjcm9sbFdob2xlSW1hZ2VQZW5kaW5nID0gZmFsc2UpO1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBpZiBubyBpbWFnZXMsIGRvbid0IHNjcm9sbDtcclxuXHRcdFx0aWYgKCFjZW50cmFsKSByZXR1cm4gZmFsc2U7XHJcblxyXG5cdFx0XHQvLyBpZiBjdXJyZW50IGltYWdlIGlzIG91dHNpZGUgdmlldywgZG9uJ3Qgc2Nyb2xsXHJcblx0XHRcdGlmICghY2VudHJhbC5jcm9zc1NjcmVlbikgcmV0dXJuIGZhbHNlO1xyXG5cclxuXHRcdFx0Ly8gaWYgY3VycmVudCBpbWFnZSBpcyBpbiBjZW50ZXIsIHNjcm9sbCB0byB0aGUgbmV4dCBvbmVcclxuXHRcdFx0aWYgKGNlbnRyYWwuaXNJbkNlbnRlcikge1xyXG5cdFx0XHRcdHJldHVybiBzY3JvbGxUb0ltYWdlKG5leHQpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBpZiB0byBzY3JvbGwgdG8gY3VycmVudCBpbWFnZSB5b3UgaGF2ZSB0byBzY3JvbGwgaW4gb3Bwb3NpZGUgZGlyZWN0aW9uLCBzY3JvbGwgdG8gbmV4dCBvbmVcclxuXHRcdFx0aWYgKE1hdGguc2lnbihjZW50cmFsLnlUb1NjcmVlbkNlbnRlcikgIT0gZGlyKSB7XHJcblx0XHRcdFx0cmV0dXJuIHNjcm9sbFRvSW1hZ2UobmV4dCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIGlmIGN1cnJlbnQgaW1hZ2UgaXMgZmlyc3QvbGFzdCwgZG9uJ3Qgc2Nyb2xsIG92ZXIgMjV2aCB0byBpdFxyXG5cdFx0XHRpZiAoZGlyID09IDEgJiYgY2VudHJhbC5pbmRleCA9PSAwICYmIGNlbnRyYWwueVRvU2NyZWVuQ2VudGVyID4gaW5uZXJIZWlnaHQgLyAyKSB7XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChkaXIgPT0gLTEgJiYgY2VudHJhbC5pbmRleCA9PSBkYXRhcy5sZW5ndGggLSAxICYmIGNlbnRyYWwueVRvU2NyZWVuQ2VudGVyIDwgLWlubmVySGVpZ2h0IC8gMikge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIHNjcm9sbFRvSW1hZ2UoY2VudHJhbCk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGZ1bmN0aW9uIHNhdmVTY3JvbGxQb3NpdGlvbigpIHtcclxuXHRcdFx0bGV0IGltZyA9IGdldENlbnRyYWxJbWcoKTtcclxuXHRcdFx0bGV0IHJlY3QgPSBpbWcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblx0XHRcdGxldCBjZW50ZXJUb1dpbmRvd0NlbnRlciA9IChyZWN0LnRvcCArIHJlY3QuYm90dG9tKSAvIDIgLSBpbm5lckhlaWdodCAvIDI7XHJcblx0XHRcdGxldCBvZmZzZXQgPSBjZW50ZXJUb1dpbmRvd0NlbnRlciAvIHJlY3QuaGVpZ2h0O1xyXG5cdFx0XHRyZXR1cm4geyBpbWcsIG9mZnNldCwgbG9hZCgpIHsgbG9hZFNjcm9sbFBvc2l0aW9uKHsgaW1nLCBvZmZzZXQgfSk7IH0gfTtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBmdW5jdGlvbiBsb2FkU2Nyb2xsUG9zaXRpb24ocG9zOiB7IGltZzogSFRNTEltYWdlRWxlbWVudCwgb2Zmc2V0OiBudW1iZXIgfSkge1xyXG5cdFx0XHRsZXQgcmVjdCA9IHBvcy5pbWcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblx0XHRcdGxldCBjZW50ZXJUb1dpbmRvd0NlbnRlciA9IHBvcy5vZmZzZXQgKiByZWN0LmhlaWdodDtcclxuXHRcdFx0bGV0IGFjdHVhbENlbnRlclRvV2luZG93Q2VudGVyID0gKHJlY3QudG9wICsgcmVjdC5ib3R0b20pIC8gMiAtIGlubmVySGVpZ2h0IC8gMjtcclxuXHRcdFx0c2Nyb2xsQnkoMCwgYWN0dWFsQ2VudGVyVG9XaW5kb3dDZW50ZXIgLSBjZW50ZXJUb1dpbmRvd0NlbnRlcik7XHJcblx0XHR9XHJcblxyXG5cdH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL0FycmF5LnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vRGF0ZU5vd0hhY2sudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9lbGVtZW50LnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZWxtLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vRmlsdGVyZXIvRW50aXR5RmlsdGVyZXIudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9ldGMudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9mZXRjaC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL09iamVjdC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL29ic2VydmVyLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vUGFnaW5hdGUvUGFnaW5hdGlvbi50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL1BhZ2luYXRlL0ltYWdlU2Nyb2xsaW5nLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vUHJvbWlzZS50c1wiIC8+XHJcblxyXG5cclxuXHJcblxyXG5cclxubmFtZXNwYWNlIFBvb3BKcyB7XHJcblxyXG5cdGV4cG9ydCBmdW5jdGlvbiBfX2luaXRfXyh3aW5kb3c6IFdpbmRvdyAmIHR5cGVvZiBnbG9iYWxUaGlzKTogXCJpbml0ZWRcIiB8IFwiYWxyZWFkeSBpbml0ZWRcIiB7XHJcblx0XHRpZiAoIXdpbmRvdykgd2luZG93ID0gZ2xvYmFsVGhpcy53aW5kb3cgYXMgV2luZG93ICYgdHlwZW9mIGdsb2JhbFRoaXM7XHJcblxyXG5cdFx0d2luZG93LmVsbSA9IEVsbS5lbG07XHJcblx0XHR3aW5kb3cucSA9IE9iamVjdC5hc3NpZ24oUXVlcnlTZWxlY3Rvci5XaW5kb3dRLnEsIHsgb3JFbG06IFBvb3BKcy5FbG0ucU9yRWxtIH0pO1xyXG5cdFx0d2luZG93LnFxID0gUXVlcnlTZWxlY3Rvci5XaW5kb3dRLnFxO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKHdpbmRvdy5FbGVtZW50LnByb3RvdHlwZSwgJ3EnLCBRdWVyeVNlbGVjdG9yLkVsZW1lbnRRLnEpO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKHdpbmRvdy5FbGVtZW50LnByb3RvdHlwZSwgJ3FxJywgUXVlcnlTZWxlY3Rvci5FbGVtZW50US5xcSk7XHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUod2luZG93LkVsZW1lbnQucHJvdG90eXBlLCAnYXBwZW5kVG8nLCBFbGVtZW50RXh0ZW5zaW9uLmFwcGVuZFRvKTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZSh3aW5kb3cuRWxlbWVudC5wcm90b3R5cGUsICdlbWl0JywgRWxlbWVudEV4dGVuc2lvbi5lbWl0KTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZSh3aW5kb3cuRG9jdW1lbnQucHJvdG90eXBlLCAncScsIFF1ZXJ5U2VsZWN0b3IuRG9jdW1lbnRRLnEpO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKHdpbmRvdy5Eb2N1bWVudC5wcm90b3R5cGUsICdxcScsIFF1ZXJ5U2VsZWN0b3IuRG9jdW1lbnRRLnFxKTtcclxuXHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUod2luZG93LlByb21pc2UsICdlbXB0eScsIFByb21pc2VFeHRlbnNpb24uZW1wdHkpO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKHdpbmRvdy5Qcm9taXNlLCAnZnJhbWUnLCBQcm9taXNlRXh0ZW5zaW9uLmZyYW1lKTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZSh3aW5kb3cuUHJvbWlzZSwgJ3JhZicsIFByb21pc2VFeHRlbnNpb24uZnJhbWUpO1xyXG5cclxuXHRcdHdpbmRvdy5mZXRjaC5jYWNoZWQgPSBGZXRjaEV4dGVuc2lvbi5jYWNoZWQgYXMgYW55O1xyXG5cdFx0d2luZG93LmZldGNoLmRvYyA9IEZldGNoRXh0ZW5zaW9uLmRvYyBhcyBhbnk7XHJcblx0XHR3aW5kb3cuZmV0Y2guanNvbiA9IEZldGNoRXh0ZW5zaW9uLmpzb24gYXMgYW55O1xyXG5cdFx0d2luZG93LmZldGNoLmNhY2hlZC5kb2MgPSBGZXRjaEV4dGVuc2lvbi5jYWNoZWREb2M7XHJcblx0XHR3aW5kb3cuZmV0Y2guZG9jLmNhY2hlZCA9IEZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYztcclxuXHRcdHdpbmRvdy5mZXRjaC5jYWNoZWREb2MgPSBGZXRjaEV4dGVuc2lvbi5jYWNoZWREb2M7XHJcblx0XHR3aW5kb3cuZmV0Y2guanNvbi5jYWNoZWQgPSBGZXRjaEV4dGVuc2lvbi5jYWNoZWRKc29uO1xyXG5cdFx0d2luZG93LmZldGNoLmNhY2hlZC5qc29uID0gRmV0Y2hFeHRlbnNpb24uY2FjaGVkSnNvbjtcclxuXHRcdHdpbmRvdy5mZXRjaC5pc0NhY2hlZCA9IEZldGNoRXh0ZW5zaW9uLmlzQ2FjaGVkO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKHdpbmRvdy5SZXNwb25zZS5wcm90b3R5cGUsICdjYWNoZWRBdCcsIDApO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKHdpbmRvdy5Eb2N1bWVudC5wcm90b3R5cGUsICdjYWNoZWRBdCcsIDApO1xyXG5cclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZSh3aW5kb3cuT2JqZWN0LCAnZGVmaW5lVmFsdWUnLCBPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUpO1xyXG5cdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKHdpbmRvdy5PYmplY3QsICdkZWZpbmVHZXR0ZXInLCBPYmplY3RFeHRlbnNpb24uZGVmaW5lR2V0dGVyKTtcclxuXHRcdC8vIE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZShPYmplY3QsICdtYXAnLCBPYmplY3RFeHRlbnNpb24ubWFwKTtcclxuXHJcblx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUod2luZG93LkFycmF5LCAnbWFwJywgQXJyYXlFeHRlbnNpb24ubWFwKTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZSh3aW5kb3cuQXJyYXkucHJvdG90eXBlLCAncG1hcCcsIEFycmF5RXh0ZW5zaW9uLlBNYXAudGhpc19wbWFwKTtcclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZSh3aW5kb3cuQXJyYXkucHJvdG90eXBlLCAndnNvcnQnLCBBcnJheUV4dGVuc2lvbi52c29ydCk7XHJcblx0XHRpZiAoIVtdLmF0KVxyXG5cdFx0XHRPYmplY3RFeHRlbnNpb24uZGVmaW5lVmFsdWUod2luZG93LkFycmF5LnByb3RvdHlwZSwgJ2F0JywgQXJyYXlFeHRlbnNpb24uYXQpO1xyXG5cdFx0aWYgKCFbXS5maW5kTGFzdClcclxuXHRcdFx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlKHdpbmRvdy5BcnJheS5wcm90b3R5cGUsICdmaW5kTGFzdCcsIEFycmF5RXh0ZW5zaW9uLmZpbmRMYXN0KTtcclxuXHJcblx0XHR3aW5kb3cucGFnaW5hdGUgPSBQb29wSnMucGFnaW5hdGUgYXMgYW55O1xyXG5cdFx0d2luZG93LmltYWdlU2Nyb2xsaW5nID0gUG9vcEpzLkltYWdlU2Nyb2xsaW5nRXh0ZW5zaW9uO1xyXG5cclxuXHRcdE9iamVjdEV4dGVuc2lvbi5kZWZpbmVWYWx1ZSh3aW5kb3csICdfX2luaXRfXycsICdhbHJlYWR5IGluaXRlZCcpO1xyXG5cdFx0cmV0dXJuICdpbml0ZWQnO1xyXG5cdH1cclxuXHJcblx0T2JqZWN0RXh0ZW5zaW9uLmRlZmluZUdldHRlcih3aW5kb3csICdfX2luaXRfXycsICgpID0+IF9faW5pdF9fKHdpbmRvdykpO1xyXG5cdC8vIE9iamVjdC5hc3NpZ24oZ2xvYmFsVGhpcywgeyBQb29wSnMgfSk7XHJcblxyXG5cdGlmICh3aW5kb3cubG9jYWxTdG9yYWdlLl9faW5pdF9fKSB7XHJcblx0XHR3aW5kb3cuX19pbml0X187XHJcblx0fVxyXG5cclxufSIsIiIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cdGV4cG9ydCB0eXBlIFZhbHVlT2Y8VD4gPSBUW2tleW9mIFRdO1xyXG5cdGV4cG9ydCB0eXBlIE1hcHBlZE9iamVjdDxULCBWPiA9IHsgW1AgaW4ga2V5b2YgVF06IFYgfTtcclxuXHJcblx0ZXhwb3J0IHR5cGUgc2VsZWN0b3IgPSBzdHJpbmcgfCBzdHJpbmcgJiB7IF8/OiAnc2VsZWN0b3InIH1cclxuXHRleHBvcnQgdHlwZSB1cmwgPSBgaHR0cCR7c3RyaW5nfWAgJiB7IF8/OiAndXJsJyB9O1xyXG5cdGV4cG9ydCB0eXBlIExpbmsgPSBIVE1MQW5jaG9yRWxlbWVudCB8IHNlbGVjdG9yIHwgdXJsO1xyXG5cclxuXHJcblxyXG5cclxuXHR0eXBlIHRyaW1TdGFydDxTLCBDIGV4dGVuZHMgc3RyaW5nPiA9IFMgZXh0ZW5kcyBgJHtDfSR7aW5mZXIgUzF9YCA/IHRyaW1TdGFydDxTMSwgQz4gOiBTO1xyXG5cdHR5cGUgdHJpbUVuZDxTLCBDIGV4dGVuZHMgc3RyaW5nPiA9IFMgZXh0ZW5kcyBgJHtpbmZlciBTMX0ke0N9YCA/IHRyaW1FbmQ8UzEsIEM+IDogUztcclxuXHR0eXBlIHRyaW08UywgQyBleHRlbmRzIHN0cmluZyA9ICcgJyB8ICdcXHQnIHwgJ1xcbic+ID0gdHJpbVN0YXJ0PHRyaW1FbmQ8UywgQz4sIEM+O1xyXG5cclxuXHR0eXBlIHNwbGl0PFMsIEMgZXh0ZW5kcyBzdHJpbmc+ID0gUyBleHRlbmRzIGAke2luZmVyIFMxfSR7Q30ke2luZmVyIFMyfWAgPyBzcGxpdDxTMSwgQz4gfCBzcGxpdDxTMiwgQz4gOiBTO1xyXG5cdHR5cGUgc3BsaXRTdGFydDxTLCBDIGV4dGVuZHMgc3RyaW5nPiA9IFMgZXh0ZW5kcyBgJHtpbmZlciBTMX0ke0N9JHtpbmZlciBfUzJ9YCA/IHNwbGl0U3RhcnQ8UzEsIEM+IDogUztcclxuXHR0eXBlIHNwbGl0RW5kPFMsIEMgZXh0ZW5kcyBzdHJpbmc+ID0gUyBleHRlbmRzIGAke2luZmVyIF9TMX0ke0N9JHtpbmZlciBTMn1gID8gc3BsaXRFbmQ8UzIsIEM+IDogUztcclxuXHJcblx0dHlwZSByZXBsYWNlPFMsIEMgZXh0ZW5kcyBzdHJpbmcsIFYgZXh0ZW5kcyBzdHJpbmc+ID0gUyBleHRlbmRzIGAke2luZmVyIFMxfSR7Q30ke2luZmVyIFMzfWAgPyByZXBsYWNlPGAke1MxfSR7Vn0ke1MzfWAsIEMsIFY+IDogUztcclxuXHJcblx0dHlwZSB3cyA9ICcgJyB8ICdcXHQnIHwgJ1xcbic7XHJcblxyXG5cdC8vIHR5cGUgaW5zYW5lU2VsZWN0b3IgPSAnIGEgLCBiW3F3ZV0gXFxuICwgYy54ICwgZCN5ICwgeCBlICwgeD5mICwgeCA+IGcgLCBbcXdlXSAsIGg6bm90KHg+eSkgLCBpbWcgJztcclxuXHJcblx0Ly8gdHlwZSBfaTEgPSByZXBsYWNlPGluc2FuZVNlbGVjdG9yLCBgWyR7c3RyaW5nfV1gLCAnLic+O1xyXG5cdC8vIHR5cGUgX2kxNSA9IHJlcGxhY2U8X2kxLCBgKCR7c3RyaW5nfSlgLCAnLic+O1xyXG5cdC8vIHR5cGUgX2kxNyA9IHJlcGxhY2U8X2kxNSwgRXhjbHVkZTx3cywgJyAnPiwgJyAnPjtcclxuXHQvLyB0eXBlIF9pMiA9IHNwbGl0PF9pMTcsICcsJz47XHJcblx0Ly8gdHlwZSBfaTMgPSB0cmltPF9pMj47XHJcblx0Ly8gdHlwZSBfaTQgPSBzcGxpdEVuZDxfaTMsIHdzIHwgJz4nPjtcclxuXHQvLyB0eXBlIF9pNSA9IHNwbGl0U3RhcnQ8X2k0LCAnLicgfCAnIycgfCAnOic+O1xyXG5cdC8vIHR5cGUgX2k2ID0gKEhUTUxFbGVtZW50VGFnTmFtZU1hcCAmIHsgJyc6IEhUTUxFbGVtZW50IH0gJiB7IFtrOiBzdHJpbmddOiBIVE1MRWxlbWVudCB9KVtfaTVdO1xyXG5cdGV4cG9ydCB0eXBlIFRhZ05hbWVGcm9tU2VsZWN0b3I8UyBleHRlbmRzIHN0cmluZz4gPSBzcGxpdFN0YXJ0PHNwbGl0RW5kPHRyaW08c3BsaXQ8cmVwbGFjZTxyZXBsYWNlPHJlcGxhY2U8UywgYFske3N0cmluZ31dYCwgJy4nPiwgYCgke3N0cmluZ30pYCwgJy4nPiwgRXhjbHVkZTx3cywgJyAnPiwgJyAnPiwgJywnPj4sIHdzIHwgJz4nPiwgJy4nIHwgJyMnIHwgJzonPjtcclxuXHJcblx0ZXhwb3J0IHR5cGUgVGFnRWxlbWVudEZyb21UYWdOYW1lPFM+ID0gUyBleHRlbmRzIGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcCA/IEhUTUxFbGVtZW50VGFnTmFtZU1hcFtTXSA6IEhUTUxFbGVtZW50O1xyXG59XHJcblxyXG5cclxuZGVjbGFyZSBjb25zdCBfX2luaXRfXzogXCJpbml0ZWRcIiB8IFwiYWxyZWFkeSBpbml0ZWRcIjtcclxuZGVjbGFyZSBjb25zdCBlbG06IHR5cGVvZiBQb29wSnMuRWxtLmVsbTtcclxuZGVjbGFyZSBjb25zdCBxOiB0eXBlb2YgUG9vcEpzLlF1ZXJ5U2VsZWN0b3IuV2luZG93US5xICYgeyBvckVsbTogdHlwZW9mIFBvb3BKcy5FbG0ucU9yRWxtIH07O1xyXG5kZWNsYXJlIGNvbnN0IHFxOiB0eXBlb2YgUG9vcEpzLlF1ZXJ5U2VsZWN0b3IuV2luZG93US5xcTtcclxuZGVjbGFyZSBjb25zdCBwYWdpbmF0ZTogdHlwZW9mIFBvb3BKcy5wYWdpbmF0ZTtcclxuZGVjbGFyZSBjb25zdCBpbWFnZVNjcm9sbGluZzogdHlwZW9mIFBvb3BKcy5JbWFnZVNjcm9sbGluZ0V4dGVuc2lvbjtcclxuZGVjbGFyZSBuYW1lc3BhY2UgZmV0Y2gge1xyXG5cdGV4cG9ydCBsZXQgY2FjaGVkOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZCAmIHsgZG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYywganNvbjogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5jYWNoZWRKc29uIH07XHJcblx0ZXhwb3J0IGxldCBkb2M6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uZG9jICYgeyBjYWNoZWQ6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkRG9jIH07XHJcblx0ZXhwb3J0IGxldCBjYWNoZWREb2M6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkRG9jO1xyXG5cdGV4cG9ydCBsZXQganNvbjogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5qc29uICYgeyBjYWNoZWQ6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkSnNvbiB9O1xyXG5cdGV4cG9ydCBsZXQgaXNDYWNoZWQ6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uaXNDYWNoZWQ7XHJcbn1cclxuXHJcbmludGVyZmFjZSBXaW5kb3cge1xyXG5cdHJlYWRvbmx5IF9faW5pdF9fOiBcImluaXRlZFwiIHwgXCJhbHJlYWR5IGluaXRlZFwiO1xyXG5cdGVsbTogdHlwZW9mIFBvb3BKcy5FbG0uZWxtO1xyXG5cdHE6IHR5cGVvZiBQb29wSnMuUXVlcnlTZWxlY3Rvci5XaW5kb3dRLnEgJiB7IG9yRWxtOiB0eXBlb2YgUG9vcEpzLkVsbS5xT3JFbG0gfTtcclxuXHRxcTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLldpbmRvd1EucXE7XHJcblx0cGFnaW5hdGU6IHR5cGVvZiBQb29wSnMucGFnaW5hdGU7XHJcblx0aW1hZ2VTY3JvbGxpbmc6IHR5cGVvZiBQb29wSnMuSW1hZ2VTY3JvbGxpbmdFeHRlbnNpb247XHJcblx0ZmV0Y2g6IHtcclxuXHRcdChpbnB1dDogUmVxdWVzdEluZm8sIGluaXQ/OiBSZXF1ZXN0SW5pdCk6IFByb21pc2U8UmVzcG9uc2U+O1xyXG5cdFx0Y2FjaGVkOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZCAmIHsgZG9jOiB0eXBlb2YgUG9vcEpzLkZldGNoRXh0ZW5zaW9uLmNhY2hlZERvYywganNvbjogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5jYWNoZWRKc29uIH07XHJcblx0XHRkb2M6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uZG9jICYgeyBjYWNoZWQ6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkRG9jIH07XHJcblx0XHRjYWNoZWREb2M6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkRG9jO1xyXG5cdFx0anNvbjogdHlwZW9mIFBvb3BKcy5GZXRjaEV4dGVuc2lvbi5qc29uICYgeyBjYWNoZWQ6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uY2FjaGVkSnNvbiB9O1xyXG5cdFx0aXNDYWNoZWQ6IHR5cGVvZiBQb29wSnMuRmV0Y2hFeHRlbnNpb24uaXNDYWNoZWQ7XHJcblx0fVxyXG59XHJcblxyXG5pbnRlcmZhY2UgRWxlbWVudCB7XHJcblx0cTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLkVsZW1lbnRRLnE7XHJcblx0cXE6IHR5cGVvZiBQb29wSnMuUXVlcnlTZWxlY3Rvci5FbGVtZW50US5xcTtcclxuXHRhcHBlbmRUbzogdHlwZW9mIFBvb3BKcy5FbGVtZW50RXh0ZW5zaW9uLmFwcGVuZFRvO1xyXG5cdGVtaXQ6IHR5cGVvZiBQb29wSnMuRWxlbWVudEV4dGVuc2lvbi5lbWl0O1xyXG5cdGFkZEV2ZW50TGlzdGVuZXI8VCBleHRlbmRzIEN1c3RvbUV2ZW50PHsgX2V2ZW50Pzogc3RyaW5nIH0+Pih0eXBlOiBUWydkZXRhaWwnXVsnX2V2ZW50J10sIGxpc3RlbmVyOiAodGhpczogRG9jdW1lbnQsIGV2OiBUKSA9PiBhbnksIG9wdGlvbnM/OiBib29sZWFuIHwgQWRkRXZlbnRMaXN0ZW5lck9wdGlvbnMpOiB2b2lkO1xyXG59XHJcbmludGVyZmFjZSBEb2N1bWVudCB7XHJcblx0cTogdHlwZW9mIFBvb3BKcy5RdWVyeVNlbGVjdG9yLkRvY3VtZW50US5xO1xyXG5cdHFxOiB0eXBlb2YgUG9vcEpzLlF1ZXJ5U2VsZWN0b3IuRG9jdW1lbnRRLnFxO1xyXG5cdGNhY2hlZEF0OiBudW1iZXI7XHJcblx0YWRkRXZlbnRMaXN0ZW5lcjxUIGV4dGVuZHMgQ3VzdG9tRXZlbnQ8eyBfZXZlbnQ/OiBzdHJpbmcgfT4+KHR5cGU6IFRbJ2RldGFpbCddWydfZXZlbnQnXSwgbGlzdGVuZXI6ICh0aGlzOiBEb2N1bWVudCwgZXY6IFQpID0+IGFueSwgb3B0aW9ucz86IGJvb2xlYW4gfCBBZGRFdmVudExpc3RlbmVyT3B0aW9ucyk6IHZvaWQ7XHJcbn1cclxuXHJcbmludGVyZmFjZSBPYmplY3RDb25zdHJ1Y3RvciB7XHJcblx0ZGVmaW5lVmFsdWU6IHR5cGVvZiBQb29wSnMuT2JqZWN0RXh0ZW5zaW9uLmRlZmluZVZhbHVlO1xyXG5cdGRlZmluZUdldHRlcjogdHlwZW9mIFBvb3BKcy5PYmplY3RFeHRlbnNpb24uZGVmaW5lR2V0dGVyO1xyXG5cdC8vIG1hcDogdHlwZW9mIFBvb3BKcy5PYmplY3RFeHRlbnNpb24ubWFwO1xyXG5cdHNldFByb3RvdHlwZU9mPFQsIFA+KG86IFQsIHByb3RvOiBQKTogVCAmIFA7XHJcblxyXG5cclxuXHRmcm9tRW50cmllczxLIGV4dGVuZHMgc3RyaW5nIHwgbnVtYmVyIHwgc3ltYm9sLCBWPihcclxuXHRcdGVudHJpZXM6IHJlYWRvbmx5IChyZWFkb25seSBbSywgVl0pW11cclxuXHQpOiB7IFtrIGluIEtdOiBWIH07XHJcbn1cclxuaW50ZXJmYWNlIFByb21pc2VDb25zdHJ1Y3RvciB7XHJcblx0ZW1wdHk6IHR5cGVvZiBQb29wSnMuUHJvbWlzZUV4dGVuc2lvbi5lbXB0eTtcclxuXHRmcmFtZTogdHlwZW9mIFBvb3BKcy5Qcm9taXNlRXh0ZW5zaW9uLmZyYW1lO1xyXG5cdHJhZjogdHlwZW9mIFBvb3BKcy5Qcm9taXNlRXh0ZW5zaW9uLmZyYW1lO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgQXJyYXk8VD4ge1xyXG5cdHZzb3J0OiB0eXBlb2YgUG9vcEpzLkFycmF5RXh0ZW5zaW9uLnZzb3J0O1xyXG5cdC8vIHBtYXA6IHR5cGVvZiBQb29wSnMuQXJyYXlFeHRlbnNpb24ucG1hcDtcclxuXHRwbWFwOiB0eXBlb2YgUG9vcEpzLkFycmF5RXh0ZW5zaW9uLlBNYXAudGhpc19wbWFwO1xyXG59XHJcbmludGVyZmFjZSBBcnJheUNvbnN0cnVjdG9yIHtcclxuXHRtYXA6IHR5cGVvZiBQb29wSnMuQXJyYXlFeHRlbnNpb24ubWFwO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgRGF0ZUNvbnN0cnVjdG9yIHtcclxuXHRfbm93KCk6IG51bWJlcjtcclxufVxyXG5pbnRlcmZhY2UgRGF0ZSB7XHJcblx0X2dldFRpbWUoKTogbnVtYmVyO1xyXG59XHJcbmludGVyZmFjZSBQZXJmb3JtYW5jZSB7XHJcblx0X25vdzogUGVyZm9ybWFuY2VbJ25vdyddO1xyXG59XHJcbmludGVyZmFjZSBXaW5kb3cge1xyXG5cdF9yZXF1ZXN0QW5pbWF0aW9uRnJhbWU6IFdpbmRvd1sncmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XHJcbn1cclxuXHJcbmludGVyZmFjZSBSZXNwb25zZSB7XHJcblx0Y2FjaGVkQXQ6IG51bWJlcjtcclxufVxyXG5cclxuLy8gaW50ZXJmYWNlIEN1c3RvbUV2ZW50PFQ+IHtcclxuLy8gXHRkZXRhaWw/OiBUO1xyXG4vLyB9XHJcblxyXG5pbnRlcmZhY2UgRnVuY3Rpb24ge1xyXG5cdGJpbmQ8VCwgUiwgQVJHUyBleHRlbmRzIGFueVtdPih0aGlzOiAodGhpczogVCwgLi4uYXJnczogQVJHUykgPT4gUiwgdGhpc0FyZzogVCk6ICgoLi4uYXJnczogQVJHUykgPT4gUilcclxufVxyXG5cclxuLy8gZm9yY2UgYWxsb3cgJycuc3BsaXQoJy4nKS5wb3AoKSFcclxuaW50ZXJmYWNlIFN0cmluZyB7XHJcblx0c3BsaXQoc3BsaXR0ZXI6IHN0cmluZyk6IFtzdHJpbmcsIC4uLnN0cmluZ1tdXTtcclxufVxyXG5pbnRlcmZhY2UgQXJyYXk8VD4ge1xyXG5cdHBvcCgpOiB0aGlzIGV4dGVuZHMgW1QsIC4uLlRbXV0gPyBUIDogVCB8IHVuZGVmaW5lZDtcclxuXHRhdChpbmRleDogbnVtYmVyKTogVDtcclxuXHRmaW5kTGFzdDxTIGV4dGVuZHMgVD4ocHJlZGljYXRlOiAodGhpczogdm9pZCwgdmFsdWU6IFQsIGluZGV4OiBudW1iZXIsIG9iajogVFtdKSA9PiB2YWx1ZSBpcyBTLCB0aGlzQXJnPzogYW55KTogUyB8IHVuZGVmaW5lZDtcclxuXHRmaW5kTGFzdChwcmVkaWNhdGU6ICh2YWx1ZTogVCwgaW5kZXg6IG51bWJlciwgb2JqOiBUW10pID0+IHVua25vd24sIHRoaXNBcmc/OiBhbnkpOiBUIHwgdW5kZWZpbmVkO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgTWF0aCB7XHJcblx0c2lnbih4OiBudW1iZXIpOiAtMSB8IDAgfCAxO1xyXG59XHJcbiIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cdGV4cG9ydCBuYW1lc3BhY2UgRW50cnlGaWx0ZXJlckV4dGVuc2lvbiB7XHJcblxyXG5cdFx0ZXhwb3J0IGNsYXNzIEZpbHRlcmVySXRlbTxEYXRhPiB7XHJcblx0XHRcdGlkOiBzdHJpbmcgPSBcIlwiO1xyXG5cdFx0XHRuYW1lPzogc3RyaW5nO1xyXG5cdFx0XHRkZXNjcmlwdGlvbj86IHN0cmluZztcclxuXHRcdFx0dGhyZWVXYXk6IFdheW5lc3MgPSBmYWxzZTtcclxuXHRcdFx0bW9kZTogTW9kZSA9ICdvZmYnO1xyXG5cdFx0XHRwYXJlbnQ6IEVudHJ5RmlsdGVyZXI7XHJcblx0XHRcdGJ1dHRvbjogSFRNTEJ1dHRvbkVsZW1lbnQ7XHJcblx0XHRcdGluY29tcGF0aWJsZT86IHN0cmluZ1tdO1xyXG5cdFx0XHRoaWRkZW4gPSBmYWxzZTtcclxuXHJcblx0XHRcdGNvbnN0cnVjdG9yKGRhdGE6IEZpbHRlcmVySXRlbVNvdXJjZSkge1xyXG5cdFx0XHRcdGRhdGEuYnV0dG9uID8/PSAnYnV0dG9uLmVmLWl0ZW0nO1xyXG5cdFx0XHRcdE9iamVjdC5hc3NpZ24odGhpcywgZGF0YSk7XHJcblxyXG5cdFx0XHRcdHRoaXMuYnV0dG9uID0gZWxtPCdidXR0b24nPihkYXRhLmJ1dHRvbixcclxuXHRcdFx0XHRcdGNsaWNrID0+IHRoaXMuY2xpY2soY2xpY2spLFxyXG5cdFx0XHRcdFx0Y29udGV4dG1lbnUgPT4gdGhpcy5jb250ZXh0bWVudShjb250ZXh0bWVudSksXHJcblx0XHRcdFx0KTtcclxuXHRcdFx0XHR0aGlzLnBhcmVudC5jb250YWluZXIuYXBwZW5kKHRoaXMuYnV0dG9uKTtcclxuXHRcdFx0XHRpZiAodGhpcy5uYW1lKSB7XHJcblx0XHRcdFx0XHR0aGlzLmJ1dHRvbi5hcHBlbmQodGhpcy5uYW1lKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMuZGVzY3JpcHRpb24pIHtcclxuXHRcdFx0XHRcdHRoaXMuYnV0dG9uLnRpdGxlID0gdGhpcy5kZXNjcmlwdGlvbjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSAhPSAnb2ZmJykge1xyXG5cdFx0XHRcdFx0dGhpcy50b2dnbGVNb2RlKGRhdGEubW9kZSwgdHJ1ZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0aGlzLmhpZGRlbikge1xyXG5cdFx0XHRcdFx0dGhpcy5oaWRlKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjbGljayhldmVudDogTW91c2VFdmVudCkge1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29mZicpIHtcclxuXHRcdFx0XHRcdHRoaXMudG9nZ2xlTW9kZSgnb24nKTtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGV2ZW50LnRhcmdldCAhPSB0aGlzLmJ1dHRvbikgcmV0dXJuO1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29uJykge1xyXG5cdFx0XHRcdFx0dGhpcy50b2dnbGVNb2RlKHRoaXMudGhyZWVXYXkgPyAnb3Bwb3NpdGUnIDogJ29mZicpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR0aGlzLnRvZ2dsZU1vZGUoJ29mZicpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjb250ZXh0bWVudShldmVudDogTW91c2VFdmVudCkge1xyXG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSAhPSAnb3Bwb3NpdGUnKSB7XHJcblx0XHRcdFx0XHR0aGlzLnRvZ2dsZU1vZGUoJ29wcG9zaXRlJyk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHRoaXMudG9nZ2xlTW9kZSgnb2ZmJyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0b2dnbGVNb2RlKG1vZGU6IE1vZGUsIGZvcmNlID0gZmFsc2UpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09IG1vZGUgJiYgIWZvcmNlKSByZXR1cm47XHJcblx0XHRcdFx0dGhpcy5tb2RlID0gbW9kZTtcclxuXHRcdFx0XHR0aGlzLmJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2VmLW1vZGUnLCBtb2RlKTtcclxuXHRcdFx0XHRpZiAobW9kZSAhPSAnb2ZmJyAmJiB0aGlzLmluY29tcGF0aWJsZSkge1xyXG5cdFx0XHRcdFx0dGhpcy5wYXJlbnQub2ZmSW5jb21wYXRpYmxlKHRoaXMuaW5jb21wYXRpYmxlKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5wYXJlbnQucmVxdWVzdFVwZGF0ZSgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZW1vdmUoKSB7XHJcblx0XHRcdFx0dGhpcy5idXR0b24ucmVtb3ZlKCk7XHJcblx0XHRcdFx0dGhpcy50b2dnbGVNb2RlKCdvZmYnKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0c2hvdygpIHtcclxuXHRcdFx0XHR0aGlzLmhpZGRlbiA9IGZhbHNlO1xyXG5cdFx0XHRcdHRoaXMuYnV0dG9uLmhpZGRlbiA9IGZhbHNlO1xyXG5cdFx0XHR9XHJcblx0XHRcdGhpZGUoKSB7XHJcblx0XHRcdFx0dGhpcy5oaWRkZW4gPSB0cnVlO1xyXG5cdFx0XHRcdHRoaXMuYnV0dG9uLmhpZGRlbiA9IHRydWU7XHJcblx0XHRcdH1cclxuXHJcblx0XHR9XHJcblxyXG5cdH1cclxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL0ZpbHRlcmVySXRlbS50c1wiIC8+XHJcblxyXG5uYW1lc3BhY2UgUG9vcEpzIHtcclxuXHRleHBvcnQgbmFtZXNwYWNlIEVudHJ5RmlsdGVyZXJFeHRlbnNpb24ge1xyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBGaWx0ZXI8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4gaW1wbGVtZW50cyBJRmlsdGVyPERhdGE+IHtcclxuXHRcdFx0ZGVjbGFyZSBmaWx0ZXI6IEZpbHRlckZuPERhdGE+O1xyXG5cclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogRmlsdGVyU291cmNlPERhdGE+KSB7XHJcblx0XHRcdFx0ZGF0YS5idXR0b24gPz89ICdidXR0b24uZWYtaXRlbS5lZi1maWx0ZXJbZWYtbW9kZT1cIm9mZlwiXSc7XHJcblx0XHRcdFx0c3VwZXIoZGF0YSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKiByZXR1cm5zIGlmIGl0ZW0gc2hvdWxkIGJlIHZpc2libGUgKi9cclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb2ZmJykgcmV0dXJuIHRydWU7XHJcblx0XHRcdFx0bGV0IHZhbHVlID0gdGhpcy5maWx0ZXIoZGF0YSwgZWwsIHRoaXMubW9kZSk7XHJcblx0XHRcdFx0bGV0IHJlc3VsdCA9IHR5cGVvZiB2YWx1ZSA9PSBcIm51bWJlclwiID8gdmFsdWUgPiAwIDogdmFsdWU7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb24nKSByZXR1cm4gcmVzdWx0O1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29wcG9zaXRlJykgcmV0dXJuICFyZXN1bHQ7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgY2xhc3MgVmFsdWVGaWx0ZXI8RGF0YSwgViBleHRlbmRzIHN0cmluZyB8IG51bWJlcj4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4gaW1wbGVtZW50cyBJRmlsdGVyPERhdGE+IHtcclxuXHRcdFx0ZGVjbGFyZSBmaWx0ZXI6IFZhbHVlRmlsdGVyRm48RGF0YSwgVj47XHJcblx0XHRcdGlucHV0OiBIVE1MSW5wdXRFbGVtZW50O1xyXG5cdFx0XHRsYXN0VmFsdWU6IFY7XHJcblxyXG5cdFx0XHRjb25zdHJ1Y3RvcihkYXRhOiBWYWx1ZUZpbHRlclNvdXJjZTxEYXRhLCBWPikge1xyXG5cdFx0XHRcdGRhdGEuYnV0dG9uID8/PSAnYnV0dG9uLmVmLWl0ZW0uZWYtZmlsdGVyW2VmLW1vZGU9XCJvZmZcIl0nO1xyXG5cdFx0XHRcdHN1cGVyKGRhdGEpO1xyXG5cdFx0XHRcdGxldCB0eXBlID0gdHlwZW9mIGRhdGEuaW5wdXQgPT0gJ251bWJlcicgPyAnbnVtYmVyJyA6ICd0ZXh0JztcclxuXHRcdFx0XHRsZXQgdmFsdWUgPSBKU09OLnN0cmluZ2lmeShkYXRhLmlucHV0KTtcclxuXHRcdFx0XHRsZXQgaW5wdXQgPSBgaW5wdXRbdHlwZT0ke3R5cGV9XVt2YWx1ZT0ke3ZhbHVlfV1gO1xyXG5cdFx0XHRcdHRoaXMuaW5wdXQgPSBlbG08J2lucHV0Jz4oaW5wdXQsXHJcblx0XHRcdFx0XHRpbnB1dCA9PiB0aGlzLmNoYW5nZSgpLFxyXG5cdFx0XHRcdCkuYXBwZW5kVG8odGhpcy5idXR0b24pO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjaGFuZ2UoKSB7XHJcblx0XHRcdFx0bGV0IHZhbHVlID0gdGhpcy5nZXRWYWx1ZSgpO1xyXG5cdFx0XHRcdGlmICh0aGlzLmxhc3RWYWx1ZSAhPSB2YWx1ZSkge1xyXG5cdFx0XHRcdFx0dGhpcy5sYXN0VmFsdWUgPSB2YWx1ZTtcclxuXHRcdFx0XHRcdHRoaXMucGFyZW50LnJlcXVlc3RVcGRhdGUoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8qKiByZXR1cm5zIGlmIGl0ZW0gc2hvdWxkIGJlIHZpc2libGUgKi9cclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb2ZmJykgcmV0dXJuIHRydWU7XHJcblx0XHRcdFx0bGV0IHZhbHVlID0gdGhpcy5maWx0ZXIodGhpcy5nZXRWYWx1ZSgpLCBkYXRhLCBlbCk7XHJcblx0XHRcdFx0bGV0IHJlc3VsdCA9IHR5cGVvZiB2YWx1ZSA9PSBcIm51bWJlclwiID8gdmFsdWUgPiAwIDogdmFsdWU7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb24nKSByZXR1cm4gcmVzdWx0O1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ29wcG9zaXRlJykgcmV0dXJuICFyZXN1bHQ7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGdldFZhbHVlKCk6IFYge1xyXG5cdFx0XHRcdGxldCB2YWx1ZTogViA9ICh0aGlzLmlucHV0LnR5cGUgPT0gJ3RleHQnID8gdGhpcy5pbnB1dC52YWx1ZSA6IHRoaXMuaW5wdXQudmFsdWVBc051bWJlcikgYXMgVjtcclxuXHRcdFx0XHRyZXR1cm4gdmFsdWU7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRleHBvcnQgY2xhc3MgTWF0Y2hGaWx0ZXI8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4gaW1wbGVtZW50cyBJRmlsdGVyPERhdGE+IHtcclxuXHRcdFx0ZGVjbGFyZSB2YWx1ZTogKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCkgPT4gc3RyaW5nO1xyXG5cdFx0XHRpbnB1dDogSFRNTElucHV0RWxlbWVudDtcclxuXHRcdFx0bGFzdFZhbHVlOiBzdHJpbmc7XHJcblx0XHRcdG1hdGNoZXI6IChpbnB1dDogc3RyaW5nKSA9PiBib29sZWFuO1xyXG5cclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogTWF0Y2hGaWx0ZXJTb3VyY2U8RGF0YT4pIHtcclxuXHRcdFx0XHRkYXRhLmJ1dHRvbiA/Pz0gJ2J1dHRvbi5lZi1pdGVtLmVmLWZpbHRlcltlZi1tb2RlPVwib2ZmXCJdJztcclxuXHRcdFx0XHRkYXRhLnZhbHVlID8/PSBkYXRhID0+IEpTT04uc3RyaW5naWZ5KGRhdGEpO1xyXG5cdFx0XHRcdHN1cGVyKGRhdGEpO1xyXG5cdFx0XHRcdGxldCB2YWx1ZSA9ICFkYXRhLmlucHV0ID8gJycgOiBKU09OLnN0cmluZ2lmeShkYXRhLmlucHV0KTtcclxuXHRcdFx0XHRsZXQgaW5wdXQgPSBgaW5wdXRbdHlwZT10ZXh0fV1bdmFsdWU9JHt2YWx1ZX1dYDtcclxuXHRcdFx0XHR0aGlzLmlucHV0ID0gZWxtPCdpbnB1dCc+KGlucHV0LFxyXG5cdFx0XHRcdFx0aW5wdXQgPT4gdGhpcy5jaGFuZ2UoKSxcclxuXHRcdFx0XHQpLmFwcGVuZFRvKHRoaXMuYnV0dG9uKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2hhbmdlKCkge1xyXG5cdFx0XHRcdGlmICh0aGlzLmxhc3RWYWx1ZSAhPSB0aGlzLmlucHV0LnZhbHVlKSB7XHJcblx0XHRcdFx0XHR0aGlzLmxhc3RWYWx1ZSA9IHRoaXMuaW5wdXQudmFsdWU7XHJcblx0XHRcdFx0XHR0aGlzLm1hdGNoZXIgPSB0aGlzLmdlbmVyYXRlTWF0Y2hlcih0aGlzLmxhc3RWYWx1ZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRhcHBseShkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvZmYnKSByZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHRsZXQgcmVzdWx0ID0gdGhpcy5tYXRjaGVyKHRoaXMudmFsdWUoZGF0YSwgZWwpKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5tb2RlID09ICdvbicgPyByZXN1bHQgOiAhcmVzdWx0O1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBtYXRjaGVyQ2FjaGU6IE1hcDxzdHJpbmcsICgoaW5wdXQ6IHN0cmluZykgPT4gYm9vbGVhbik+ID0gbmV3IE1hcCgpO1xyXG5cdFx0XHQvLyBnZXRNYXRjaGVyKHNvdXJjZTogc3RyaW5nKTogKGlucHV0OiBzdHJpbmcpID0+IGJvb2xlYW4ge1xyXG5cdFx0XHQvLyBcdGlmICh0aGlzLm1hdGNoZXJDYWNoZS5oYXMoc291cmNlKSkge1xyXG5cdFx0XHQvLyBcdFx0cmV0dXJuIHRoaXMubWF0Y2hlckNhY2hlLmdldChzb3VyY2UpO1xyXG5cdFx0XHQvLyBcdH1cclxuXHRcdFx0Ly8gXHRsZXQgbWF0Y2hlciA9IHRoaXMuZ2VuZXJhdGVNYXRjaGVyKHNvdXJjZSk7XHJcblx0XHRcdC8vIFx0dGhpcy5tYXRjaGVyQ2FjaGUuc2V0KHNvdXJjZSwgbWF0Y2hlcik7XHJcblx0XHRcdC8vIFx0cmV0dXJuIG1hdGNoZXI7XHJcblx0XHRcdC8vIH1cclxuXHRcdFx0Z2VuZXJhdGVNYXRjaGVyKHNvdXJjZTogc3RyaW5nKTogKChpbnB1dDogc3RyaW5nKSA9PiBib29sZWFuKSB7XHJcblx0XHRcdFx0c291cmNlID0gc291cmNlLnRyaW0oKTtcclxuXHRcdFx0XHRpZiAoc291cmNlLmxlbmd0aCA9PSAwKSByZXR1cm4gKCkgPT4gdHJ1ZTtcclxuXHRcdFx0XHRpZiAoc291cmNlLmluY2x1ZGVzKCcgJykpIHtcclxuXHRcdFx0XHRcdGxldCBwYXJ0cyA9IHNvdXJjZS5zcGxpdCgnICcpLm1hcChlID0+IHRoaXMuZ2VuZXJhdGVNYXRjaGVyKGUpKTtcclxuXHRcdFx0XHRcdHJldHVybiAoaW5wdXQpID0+IHBhcnRzLmV2ZXJ5KG0gPT4gbShpbnB1dCkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoc291cmNlLnN0YXJ0c1dpdGgoJy0nKSkge1xyXG5cdFx0XHRcdFx0aWYgKHNvdXJjZS5sZW5ndGggPCAzKSByZXR1cm4gKCkgPT4gdHJ1ZTtcclxuXHRcdFx0XHRcdGxldCBiYXNlID0gdGhpcy5nZW5lcmF0ZU1hdGNoZXIoc291cmNlLnNsaWNlKDEpKTtcclxuXHRcdFx0XHRcdHJldHVybiAoaW5wdXQpID0+ICFiYXNlKGlucHV0KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdGxldCBmbGFncyA9IHNvdXJjZS50b0xvd2VyQ2FzZSgpID09IHNvdXJjZSA/ICdpJyA6ICcnO1xyXG5cdFx0XHRcdFx0bGV0IHJlZ2V4ID0gbmV3IFJlZ0V4cChzb3VyY2UsIGZsYWdzKTtcclxuXHRcdFx0XHRcdHJldHVybiAoaW5wdXQpID0+ICEhaW5wdXQubWF0Y2gocmVnZXgpO1xyXG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHsgfTtcclxuXHRcdFx0XHRyZXR1cm4gKGlucHV0KSA9PiBpbnB1dC5pbmNsdWRlcyhzb3VyY2UpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dHlwZSBUYWdHZXR0ZXJGbjxEYXRhPiA9IHNlbGVjdG9yIHwgKChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQsIG1vZGU6IE1vZGUpID0+IChIVE1MRWxlbWVudFtdIHwgc3RyaW5nW10pKTtcclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgVGFnRmlsdGVyU291cmNlPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtU291cmNlIHtcclxuXHRcdFx0dGFnczogVGFnR2V0dGVyRm48RGF0YT47XHJcblx0XHRcdGlucHV0Pzogc3RyaW5nO1xyXG5cdFx0XHRoaWdoaWdodENsYXNzPzogc3RyaW5nO1xyXG5cdFx0fVxyXG5cdFx0dHlwZSBUYWdNYXRjaGVyID0geyBwb3NpdGl2ZTogYm9vbGVhbiwgbWF0Y2hlczogKHM6IHN0cmluZykgPT4gYm9vbGVhbiB9O1xyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBUYWdGaWx0ZXI8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4gaW1wbGVtZW50cyBJRmlsdGVyPERhdGE+IHtcclxuXHRcdFx0dGFnczogVGFnR2V0dGVyRm48RGF0YT47XHJcblx0XHRcdGlucHV0OiBIVE1MSW5wdXRFbGVtZW50O1xyXG5cdFx0XHRoaWdoaWdodENsYXNzOiBzdHJpbmc7XHJcblxyXG5cdFx0XHRsYXN0VmFsdWU6IHN0cmluZyA9ICcnO1xyXG5cdFx0XHRjYWNoZWRNYXRjaGVyOiBUYWdNYXRjaGVyW107XHJcblxyXG5cclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogVGFnRmlsdGVyU291cmNlPERhdGE+KSB7XHJcblx0XHRcdFx0ZGF0YS5idXR0b24gPz89ICdidXR0b24uZWYtaXRlbS5lZi1maWx0ZXJbZWYtbW9kZT1cIm9mZlwiXSc7XHJcblx0XHRcdFx0c3VwZXIoZGF0YSk7XHJcblx0XHRcdFx0dGhpcy5pbnB1dCA9IGVsbTwnaW5wdXQnPihgaW5wdXRbdHlwZT10ZXh0fV1gLFxyXG5cdFx0XHRcdFx0aW5wdXQgPT4gdGhpcy5jaGFuZ2UoKSxcclxuXHRcdFx0XHQpLmFwcGVuZFRvKHRoaXMuYnV0dG9uKTtcclxuXHRcdFx0XHR0aGlzLmlucHV0LnZhbHVlID0gZGF0YS5pbnB1dCB8fCAnJztcclxuXHRcdFx0XHR0aGlzLnRhZ3MgPSBkYXRhLnRhZ3M7XHJcblx0XHRcdFx0dGhpcy5jYWNoZWRNYXRjaGVyID0gW107XHJcblxyXG5cdFx0XHRcdHRoaXMuaGlnaGlnaHRDbGFzcyA9IGRhdGEuaGlnaGlnaHRDbGFzcyA/PyAnZWYtdGFnLWhpZ2hsaXNodCc7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGFwcGx5KGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xyXG5cdFx0XHRcdGxldCB0YWdzID0gdGhpcy5nZXRUYWdzKGRhdGEsIGVsKTtcclxuXHRcdFx0XHR0YWdzLm1hcCh0YWcgPT4gdGhpcy5yZXNldEhpZ2hsaWdodCh0YWcpKTtcclxuXHJcblx0XHRcdFx0bGV0IHJlc3VsdHMgPSB0aGlzLmNhY2hlZE1hdGNoZXIubWFwKG0gPT4ge1xyXG5cdFx0XHRcdFx0bGV0IHIgPSB7IHBvc2l0aXZlOiBtLnBvc2l0aXZlLCBjb3VudDogMCB9O1xyXG5cdFx0XHRcdFx0Zm9yIChsZXQgdGFnIG9mIHRhZ3MpIHtcclxuXHRcdFx0XHRcdFx0bGV0IHN0ciA9IHR5cGVvZiB0YWcgPT0gJ3N0cmluZycgPyB0YWcgOiB0YWcuaW5uZXJUZXh0O1xyXG5cdFx0XHRcdFx0XHRsZXQgdmFsID0gbS5tYXRjaGVzKHN0cik7XHJcblx0XHRcdFx0XHRcdGlmICh2YWwpIHtcclxuXHRcdFx0XHRcdFx0XHRyLmNvdW50Kys7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5oaWdobGlnaHRUYWcodGFnLCBtLnBvc2l0aXZlKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cmV0dXJuIHI7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0cmV0dXJuIHJlc3VsdHMuZXZlcnkociA9PiByLnBvc2l0aXZlID8gci5jb3VudCA+IDAgOiByLmNvdW50ID09IDApO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJlc2V0SGlnaGxpZ2h0KHRhZzogc3RyaW5nIHwgSFRNTEVsZW1lbnQpIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIHRhZyA9PSAnc3RyaW5nJykgcmV0dXJuO1xyXG5cdFx0XHRcdHRhZy5jbGFzc0xpc3QucmVtb3ZlKHRoaXMuaGlnaGlnaHRDbGFzcyk7XHJcblx0XHRcdH1cclxuXHRcdFx0aGlnaGxpZ2h0VGFnKHRhZzogc3RyaW5nIHwgSFRNTEVsZW1lbnQsIHBvc2l0aXZlOiBib29sZWFuKSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiB0YWcgPT0gJ3N0cmluZycpIHJldHVybjtcclxuXHRcdFx0XHQvLyBGSVhNRVxyXG5cdFx0XHRcdHRhZy5jbGFzc0xpc3QuYWRkKHRoaXMuaGlnaGlnaHRDbGFzcyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGdldFRhZ3MoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnRbXSB8IHN0cmluZ1tdIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIHRoaXMudGFncyA9PSAnc3RyaW5nJykgcmV0dXJuIGVsLnFxPEhUTUxFbGVtZW50Pih0aGlzLnRhZ3MpO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnRhZ3MoZGF0YSwgZWwsIHRoaXMubW9kZSk7XHJcblx0XHRcdH1cclxuXHRcdFx0Z2V0VGFnU3RyaW5ncyhkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpOiBzdHJpbmdbXSB7XHJcblx0XHRcdFx0bGV0IHRhZ3MgPSB0aGlzLmdldFRhZ3MoZGF0YSwgZWwpO1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgdGFnc1swXSA9PSAnc3RyaW5nJykgcmV0dXJuIHRhZ3MgYXMgc3RyaW5nW107XHJcblx0XHRcdFx0cmV0dXJuIHRhZ3MubWFwKChlKSA9PiBlLmlubmVyVGV4dCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNoYW5nZSgpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5sYXN0VmFsdWUgPT0gdGhpcy5pbnB1dC52YWx1ZSkgcmV0dXJuO1xyXG5cdFx0XHRcdHRoaXMubGFzdFZhbHVlID0gdGhpcy5pbnB1dC52YWx1ZTtcclxuXHRcdFx0XHR0aGlzLmNhY2hlZE1hdGNoZXIgPSB0aGlzLnBhcnNlTWF0Y2hlcih0aGlzLmxhc3RWYWx1ZSk7XHJcblx0XHRcdFx0dGhpcy5wYXJlbnQucmVxdWVzdFVwZGF0ZSgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRwYXJzZU1hdGNoZXIobWF0Y2hlcjogc3RyaW5nKTogVGFnTWF0Y2hlcltdIHtcclxuXHRcdFx0XHRtYXRjaGVyLnRyaW0oKTtcclxuXHRcdFx0XHRpZiAoIW1hdGNoZXIpIHJldHVybiBbXTtcclxuXHJcblx0XHRcdFx0aWYgKG1hdGNoZXIuaW5jbHVkZXMoJyAnKSkge1xyXG5cdFx0XHRcdFx0bGV0IHBhcnRzID0gbWF0Y2hlci5tYXRjaCgvXCJbXlwiXSpcInxcXFMrL2cpIHx8IFtdO1xyXG5cdFx0XHRcdFx0cmV0dXJuIHBhcnRzLmZsYXRNYXAoZSA9PiB0aGlzLnBhcnNlTWF0Y2hlcihlKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChtYXRjaGVyLnN0YXJ0c1dpdGgoJy0nKSkge1xyXG5cdFx0XHRcdFx0bGV0IHBhcnRzID0gdGhpcy5wYXJzZU1hdGNoZXIobWF0Y2hlci5zbGljZSgxKSk7XHJcblx0XHRcdFx0XHRyZXR1cm4gcGFydHMubWFwKGUgPT4gKHsgcG9zaXRpdmU6ICFlLnBvc2l0aXZlLCBtYXRjaGVzOiBlLm1hdGNoZXMgfSkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAobWF0Y2hlci5tYXRjaCgvXCJeW15cIl0qXCIkLykpIHtcclxuXHRcdFx0XHRcdG1hdGNoZXIgPSBtYXRjaGVyLnNsaWNlKDEsIC0xKTtcclxuXHRcdFx0XHRcdHJldHVybiBbeyBwb3NpdGl2ZTogdHJ1ZSwgbWF0Y2hlczogdGFnID0+IHRhZyA9PSBtYXRjaGVyIH1dO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAobWF0Y2hlci5sZW5ndGggPCAzKSByZXR1cm4gW107XHJcblx0XHRcdFx0aWYgKG1hdGNoZXIubWF0Y2goL1wiLyk/Lmxlbmd0aCA9PSAxKSByZXR1cm4gW107XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdGxldCBnID0gbmV3IFJlZ0V4cChtYXRjaGVyLCAnaScpO1xyXG5cdFx0XHRcdFx0cmV0dXJuIFt7IHBvc2l0aXZlOiB0cnVlLCBtYXRjaGVzOiB0YWcgPT4gISF0YWcubWF0Y2goZykgfV07XHJcblx0XHRcdFx0fSBjYXRjaCAoZSkgeyB9XHJcblx0XHRcdFx0cmV0dXJuIFt7IHBvc2l0aXZlOiB0cnVlLCBtYXRjaGVzOiB0YWcgPT4gdGFnLmluY2x1ZGVzKG1hdGNoZXIpIH1dO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBQYWdpbmF0aW9uSW5mb0ZpbHRlcjxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbTxEYXRhPiBpbXBsZW1lbnRzIElGaWx0ZXI8RGF0YT4ge1xyXG5cdFx0XHRjb25zdHJ1Y3RvcihkYXRhOiBGaWx0ZXJlckl0ZW1Tb3VyY2UpIHtcclxuXHRcdFx0XHRzdXBlcihkYXRhKTtcclxuXHRcdFx0XHR0aGlzLmluaXQoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRhcHBseSgpIHtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRQYWdpbmF0ZSA9IFBvb3BKcy5QYWdpbmF0ZUV4dGVuc2lvbi5QYWdpbmF0ZTtcclxuXHRcdFx0Y291bnRQYWdpbmF0ZSgpIHtcclxuXHRcdFx0XHRsZXQgZGF0YSA9IHsgcnVubmluZzogMCwgcXVldWVkOiAwLCB9O1xyXG5cdFx0XHRcdGZvciAobGV0IHAgb2YgdGhpcy5QYWdpbmF0ZS5pbnN0YW5jZXMpIHtcclxuXHRcdFx0XHRcdGRhdGEucnVubmluZyArPSArcC5ydW5uaW5nO1xyXG5cdFx0XHRcdFx0ZGF0YS5xdWV1ZWQgKz0gcC5xdWV1ZWQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBkYXRhO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR1cGRhdGVJbmZvKCkge1xyXG5cdFx0XHRcdGxldCBkYXRhID0gdGhpcy5jb3VudFBhZ2luYXRlKCk7XHJcblx0XHRcdFx0aWYgKCFkYXRhLnJ1bm5pbmcgJiYgIWRhdGEucXVldWVkKSB7XHJcblx0XHRcdFx0XHR0aGlzLmhpZGRlbiB8fCB0aGlzLmhpZGUoKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhpcy5oaWRkZW4gJiYgdGhpcy5zaG93KCk7XHJcblx0XHRcdFx0XHRsZXQgdGV4dCA9IGAuLi4gKyR7ZGF0YS5ydW5uaW5nICsgZGF0YS5xdWV1ZWR9YDtcclxuXHRcdFx0XHRcdGlmICh0aGlzLmJ1dHRvbi5pbm5lckhUTUwgIT0gdGV4dCkge1xyXG5cdFx0XHRcdFx0XHR0aGlzLmJ1dHRvbi5pbm5lclRleHQgPSB0ZXh0O1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0YXN5bmMgaW5pdCgpIHtcclxuXHRcdFx0XHR3aGlsZSAodHJ1ZSkge1xyXG5cdFx0XHRcdFx0YXdhaXQgUHJvbWlzZS5mcmFtZSgpO1xyXG5cdFx0XHRcdFx0dGhpcy51cGRhdGVJbmZvKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdH1cclxufVxyXG4iLCJuYW1lc3BhY2UgUG9vcEpzIHtcclxuXHRleHBvcnQgbmFtZXNwYWNlIEVudHJ5RmlsdGVyZXJFeHRlbnNpb24ge1xyXG5cclxuXHRcdGV4cG9ydCBjbGFzcyBNb2RpZmllcjxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbTxEYXRhPiBpbXBsZW1lbnRzIElNb2RpZmllcjxEYXRhPiB7XHJcblx0XHRcdGRlY2xhcmUgbW9kaWZpZXI6IE1vZGlmaWVyRm48RGF0YT47XHJcblx0XHRcdGRlY2xhcmUgcnVuT25Ob0NoYW5nZT86IGJvb2xlYW47XHJcblxyXG5cdFx0XHRjb25zdHJ1Y3RvcihkYXRhOiBNb2RpZmllclNvdXJjZTxEYXRhPikge1xyXG5cdFx0XHRcdGRhdGEuYnV0dG9uID8/PSAnYnV0dG9uLmVmLWl0ZW0uZWYtbW9kaWZpZXJbZWYtbW9kZT1cIm9mZlwiXSc7XHJcblx0XHRcdFx0c3VwZXIoZGF0YSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRvZ2dsZU1vZGUobW9kZTogTW9kZSwgZm9yY2UgPSBmYWxzZSkge1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gbW9kZSAmJiAhZm9yY2UpIHJldHVybjtcclxuXHRcdFx0XHR0aGlzLnBhcmVudC5tb3ZlVG9Ub3AodGhpcyk7XHJcblx0XHRcdFx0c3VwZXIudG9nZ2xlTW9kZShtb2RlLCBmb3JjZSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGFwcGx5KGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCkge1xyXG5cdFx0XHRcdGxldCBvbGRNb2RlOiBNb2RlIHwgbnVsbCA9IGVsLmdldEF0dHJpYnV0ZShgZWYtbW9kaWZpZXItJHt0aGlzLmlkfS1tb2RlYCkgYXMgKE1vZGUgfCBudWxsKTtcclxuXHRcdFx0XHRpZiAob2xkTW9kZSA9PSB0aGlzLm1vZGUgJiYgIXRoaXMucnVuT25Ob0NoYW5nZSkgcmV0dXJuO1xyXG5cdFx0XHRcdHRoaXMubW9kaWZpZXIoZGF0YSwgZWwsIHRoaXMubW9kZSwgbnVsbCk7XHJcblx0XHRcdFx0ZWwuc2V0QXR0cmlidXRlKGBlZi1tb2RpZmllci0ke3RoaXMuaWR9LW1vZGVgLCB0aGlzLm1vZGUpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZXhwb3J0IGNsYXNzIFByZWZpeGVyPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtPERhdGE+IGltcGxlbWVudHMgSU1vZGlmaWVyPERhdGE+IHtcclxuXHRcdFx0ZGVjbGFyZSB0YXJnZXQ6IHNlbGVjdG9yIHwgKChlOiBIVE1MRWxlbWVudCwgZGF0YTogRGF0YSwgbW9kZTogTW9kZSkgPT4gKEhUTUxFbGVtZW50IHwgSFRNTEVsZW1lbnRbXSkpO1xyXG5cdFx0XHRkZWNsYXJlIHByZWZpeD86IChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQsIG1vZGU6IE1vZGUpID0+IHN0cmluZztcclxuXHRcdFx0ZGVjbGFyZSBwb3N0Zml4PzogKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCwgbW9kZTogTW9kZSkgPT4gc3RyaW5nO1xyXG5cdFx0XHRkZWNsYXJlIHByZWZpeEF0dHJpYnV0ZTogc3RyaW5nO1xyXG5cdFx0XHRkZWNsYXJlIHBvc3RmaXhBdHRyaWJ1dGU6IHN0cmluZztcclxuXHRcdFx0ZGVjbGFyZSBhbGw6IGJvb2xlYW47XHJcblxyXG5cdFx0XHRjb25zdHJ1Y3RvcihkYXRhOiBQcmVmaXhlclNvdXJjZTxEYXRhPikge1xyXG5cdFx0XHRcdGRhdGEuYnV0dG9uID8/PSAnYnV0dG9uLmVmLWl0ZW0uZWYtbW9kaWZpZXJbZWYtbW9kZT1cIm9mZlwiXSc7XHJcblx0XHRcdFx0ZGF0YS50YXJnZXQgPz89IGUgPT4gZTtcclxuXHRcdFx0XHRkYXRhLnByZWZpeEF0dHJpYnV0ZSA/Pz0gJ2VmLXByZWZpeCc7XHJcblx0XHRcdFx0ZGF0YS5wb3N0Zml4QXR0cmlidXRlID8/PSAnZWYtcG9zdGZpeCc7XHJcblx0XHRcdFx0ZGF0YS5hbGwgPz89IGZhbHNlO1xyXG5cdFx0XHRcdHN1cGVyKGRhdGEpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRhcHBseShkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpIHtcclxuXHRcdFx0XHRsZXQgdGFyZ2V0cyA9IHRoaXMuZ2V0VGFyZ2V0cyhlbCwgZGF0YSk7XHJcblx0XHRcdFx0aWYgKHRoaXMucHJlZml4KSB7XHJcblx0XHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvZmYnKSB7XHJcblx0XHRcdFx0XHRcdHRhcmdldHMubWFwKGUgPT4gZS5yZW1vdmVBdHRyaWJ1dGUodGhpcy5wcmVmaXhBdHRyaWJ1dGUpKTtcclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdGxldCB2YWx1ZSA9IHRoaXMucHJlZml4KGRhdGEsIGVsLCB0aGlzLm1vZGUpO1xyXG5cdFx0XHRcdFx0XHR0YXJnZXRzLm1hcChlID0+IGUuc2V0QXR0cmlidXRlKHRoaXMucHJlZml4QXR0cmlidXRlLCB2YWx1ZSkpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodGhpcy5wb3N0Zml4KSB7XHJcblx0XHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvZmYnKSB7XHJcblx0XHRcdFx0XHRcdHRhcmdldHMubWFwKGUgPT4gZS5yZW1vdmVBdHRyaWJ1dGUodGhpcy5wb3N0Zml4QXR0cmlidXRlKSk7XHJcblx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRsZXQgdmFsdWUgPSB0aGlzLnBvc3RmaXgoZGF0YSwgZWwsIHRoaXMubW9kZSk7XHJcblx0XHRcdFx0XHRcdHRhcmdldHMubWFwKGUgPT4gZS5zZXRBdHRyaWJ1dGUodGhpcy5wb3N0Zml4QXR0cmlidXRlLCB2YWx1ZSkpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Z2V0VGFyZ2V0cyhlbDogSFRNTEVsZW1lbnQsIGRhdGE6IERhdGEpOiBIVE1MRWxlbWVudFtdIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIHRoaXMudGFyZ2V0ID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRpZiAodGhpcy5hbGwpIHJldHVybiBlbC5xcSh0aGlzLnRhcmdldCk7XHJcblx0XHRcdFx0XHRyZXR1cm4gW2VsLnEodGhpcy50YXJnZXQpXTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0bGV0IHRhcmdldHMgPSB0aGlzLnRhcmdldChlbCwgZGF0YSwgdGhpcy5tb2RlKTtcclxuXHRcdFx0XHRcdHJldHVybiBBcnJheS5pc0FycmF5KHRhcmdldHMpID8gdGFyZ2V0cyA6IFt0YXJnZXRzXTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0fVxyXG59IiwibmFtZXNwYWNlIFBvb3BKcyB7XHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFbnRyeUZpbHRlcmVyRXh0ZW5zaW9uIHtcclxuXHJcblx0XHRleHBvcnQgY2xhc3MgU29ydGVyPERhdGEsIFYgZXh0ZW5kcyBudW1iZXIgfCBzdHJpbmc+IGV4dGVuZHMgRmlsdGVyZXJJdGVtPERhdGE+IGltcGxlbWVudHMgSVNvcnRlcjxEYXRhPiB7XHJcblx0XHRcdGRlY2xhcmUgc29ydGVyOiBTb3J0ZXJGbjxEYXRhLCBWPjtcclxuXHRcdFx0ZGVjbGFyZSBjb21wYXJhdG9yOiAoYTogViwgYjogVikgPT4gbnVtYmVyO1xyXG5cclxuXHRcdFx0Y29uc3RydWN0b3IoZGF0YTogU29ydGVyU291cmNlPERhdGEsIFY+KSB7XHJcblx0XHRcdFx0ZGF0YS5idXR0b24gPz89ICdidXR0b24uZWYtaXRlbS5lZi1zb3J0ZXJbZWYtbW9kZT1cIm9mZlwiXSc7XHJcblx0XHRcdFx0ZGF0YS5jb21wYXJhdG9yID8/PSAoYTogViwgYjogVikgPT4gYSA+IGIgPyAxIDogYSA8IGIgPyAtMSA6IDA7XHJcblx0XHRcdFx0c3VwZXIoZGF0YSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRvZ2dsZU1vZGUobW9kZTogTW9kZSwgZm9yY2UgPSBmYWxzZSkge1xyXG5cdFx0XHRcdGlmICh0aGlzLm1vZGUgPT0gbW9kZSAmJiAhZm9yY2UpIHJldHVybjtcclxuXHRcdFx0XHR0aGlzLnBhcmVudC5tb3ZlVG9Ub3AodGhpcyk7XHJcblx0XHRcdFx0c3VwZXIudG9nZ2xlTW9kZShtb2RlLCBmb3JjZSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHNvcnQobGlzdDogW0RhdGEsIEhUTUxFbGVtZW50XVtdKTogW0RhdGEsIEhUTUxFbGVtZW50XVtdIHtcclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvZmYnKSByZXR1cm4gbGlzdDtcclxuXHRcdFx0XHRyZXR1cm4gbGlzdC52c29ydCgoW2RhdGEsIGVsXTogW0RhdGEsIEhUTUxFbGVtZW50XSkgPT4gdGhpcy5hcHBseShkYXRhLCBlbCksIChhOiBWLCBiOiBWKSA9PiB0aGlzLmNvbXBhcmUoYSwgYikpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvKiogcmV0dXJucyBvcmRlciBvZiBlbnRyeSAqL1xyXG5cdFx0XHRhcHBseShkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpOiBWIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5zb3J0ZXIoZGF0YSwgZWwsIHRoaXMubW9kZSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNvbXBhcmUoYTogViwgYjogVik6IG51bWJlciB7XHJcblx0XHRcdFx0aWYgKHRoaXMubW9kZSA9PSAnb24nKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5jb21wYXJhdG9yKGEsIGIpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodGhpcy5tb2RlID09ICdvcHBvc2l0ZScpIHtcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmNvbXBhcmF0b3IoYiwgYSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiAwO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdH1cclxufSIsIm5hbWVzcGFjZSBQb29wSnMge1xyXG5cclxuXHRleHBvcnQgbmFtZXNwYWNlIEVudHJ5RmlsdGVyZXJFeHRlbnNpb24ge1xyXG5cdFx0ZXhwb3J0IHR5cGUgV2F5bmVzcyA9IGZhbHNlIHwgdHJ1ZSB8ICdkaXInO1xyXG5cdFx0ZXhwb3J0IHR5cGUgTW9kZSA9ICdvZmYnIHwgJ29uJyB8ICdvcHBvc2l0ZSc7XHJcblxyXG5cdFx0ZXhwb3J0IHR5cGUgUGFyc2VyRm48RGF0YT4gPSAoZWw6IEhUTUxFbGVtZW50LCBkYXRhOiBQYXJ0aWFsPERhdGE+KSA9PiBQYXJ0aWFsPERhdGE+IHwgdm9pZCB8IFByb21pc2VMaWtlPFBhcnRpYWw8RGF0YSB8IHZvaWQ+PjtcclxuXHRcdGV4cG9ydCB0eXBlIEZpbHRlckZuPERhdGE+ID0gKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCwgbW9kZTogTW9kZSkgPT4gYm9vbGVhbjtcclxuXHRcdGV4cG9ydCB0eXBlIFNvcnRlckZuPERhdGEsIFY+ID0gKGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCwgbW9kZTogTW9kZSkgPT4gVjtcclxuXHRcdGV4cG9ydCB0eXBlIE1vZGlmaWVyRm48RGF0YT4gPSAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50LCBtb2RlOiBNb2RlLCBvbGRNb2RlOiBNb2RlIHwgbnVsbCkgPT4gdm9pZDtcclxuXHRcdGV4cG9ydCB0eXBlIFZhbHVlRmlsdGVyRm48RGF0YSwgVj4gPSAodmFsdWU6IFYsIGRhdGE6IERhdGEsIGVsOiBIVE1MRWxlbWVudCkgPT4gYm9vbGVhbjtcclxuXHRcdGV4cG9ydCB0eXBlIFByZWZpeGVyRm48RGF0YT4gPSAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50LCBtb2RlOiBNb2RlKSA9PiBzdHJpbmc7XHJcblxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBJRmlsdGVyPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtPERhdGE+IHtcclxuXHRcdFx0YXBwbHkoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KTogYm9vbGVhbjtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgSVNvcnRlcjxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbTxEYXRhPiB7XHJcblx0XHRcdHNvcnQobGlzdDogW0RhdGEsIEhUTUxFbGVtZW50XVtdKTogW0RhdGEsIEhUTUxFbGVtZW50XVtdO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBJTW9kaWZpZXI8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW08RGF0YT4ge1xyXG5cdFx0XHRhcHBseShkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpOiB2b2lkO1xyXG5cdFx0fVxyXG5cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgRmlsdGVyZXJJdGVtU291cmNlIHtcclxuXHRcdFx0YnV0dG9uPzogc2VsZWN0b3I7XHJcblx0XHRcdGlkOiBzdHJpbmc7XHJcblx0XHRcdG5hbWU/OiBzdHJpbmc7XHJcblx0XHRcdGRlc2NyaXB0aW9uPzogc3RyaW5nO1xyXG5cdFx0XHR0aHJlZVdheT86IFdheW5lc3M7XHJcblx0XHRcdG1vZGU/OiBNb2RlO1xyXG5cdFx0XHRwYXJlbnQ6IEVudHJ5RmlsdGVyZXI7XHJcblx0XHRcdGluY29tcGF0aWJsZT86IHN0cmluZ1tdO1xyXG5cdFx0XHRoaWRkZW4/OiBib29sZWFuO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBGaWx0ZXJTb3VyY2U8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW1Tb3VyY2Uge1xyXG5cdFx0XHRmaWx0ZXI6IEZpbHRlckZuPERhdGE+O1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBWYWx1ZUZpbHRlclNvdXJjZTxEYXRhLCBWPiBleHRlbmRzIEZpbHRlcmVySXRlbVNvdXJjZSB7XHJcblx0XHRcdGZpbHRlcjogVmFsdWVGaWx0ZXJGbjxEYXRhLCBWPjtcclxuXHRcdFx0aW5wdXQ6IFY7XHJcblx0XHR9XHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIE1hdGNoRmlsdGVyU291cmNlPERhdGE+IGV4dGVuZHMgRmlsdGVyZXJJdGVtU291cmNlIHtcclxuXHRcdFx0dmFsdWU/OiAoZGF0YTogRGF0YSwgZWw6IEhUTUxFbGVtZW50KSA9PiBzdHJpbmc7XHJcblx0XHRcdGlucHV0Pzogc3RyaW5nO1xyXG5cdFx0fVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBTb3J0ZXJTb3VyY2U8RGF0YSwgVj4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW1Tb3VyY2Uge1xyXG5cdFx0XHRzb3J0ZXI6IFNvcnRlckZuPERhdGEsIFY+O1xyXG5cdFx0XHRjb21wYXJhdG9yPzogKChhOiBWLCBiOiBWKSA9PiBudW1iZXIpIHwgVjtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgTW9kaWZpZXJTb3VyY2U8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW1Tb3VyY2Uge1xyXG5cdFx0XHRtb2RpZmllcjogTW9kaWZpZXJGbjxEYXRhPjtcclxuXHRcdH1cclxuXHRcdGV4cG9ydCBpbnRlcmZhY2UgUHJlZml4ZXJTb3VyY2U8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW1Tb3VyY2Uge1xyXG5cdFx0XHR0YXJnZXQ/OiBzZWxlY3RvciB8ICgoZWw6IEhUTUxFbGVtZW50LCBkYXRhOiBEYXRhLCBtb2RlOiBNb2RlKSA9PiBIVE1MRWxlbWVudCk7XHJcblx0XHRcdHByZWZpeD86IChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpID0+IHN0cmluZztcclxuXHRcdFx0cG9zdGZpeD86IChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpID0+IHN0cmluZztcclxuXHRcdFx0cHJlZml4QXR0cmlidXRlPzogc3RyaW5nO1xyXG5cdFx0XHRwb3N0Zml4QXR0cmlidXRlPzogc3RyaW5nO1xyXG5cdFx0XHRhbGw/OiBib29sZWFuO1xyXG5cdFx0fVxyXG5cclxuXHRcdFxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBGaWx0ZXJlckl0ZW1QYXJ0aWFsIHtcclxuXHRcdFx0YnV0dG9uPzogc2VsZWN0b3I7XHJcblx0XHRcdGlkPzogc3RyaW5nO1xyXG5cdFx0XHRuYW1lPzogc3RyaW5nO1xyXG5cdFx0XHRkZXNjcmlwdGlvbj86IHN0cmluZztcclxuXHRcdFx0dGhyZWVXYXk/OiBXYXluZXNzO1xyXG5cdFx0XHRtb2RlPzogTW9kZTtcclxuXHRcdFx0aW5jb21wYXRpYmxlPzogc3RyaW5nW107XHJcblx0XHRcdGhpZGRlbj86IGJvb2xlYW47XHJcblx0XHR9XHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIEZpbHRlclBhcnRpYWw8RGF0YT4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW1QYXJ0aWFsIHsgfVxyXG5cdFx0ZXhwb3J0IGludGVyZmFjZSBWYWx1ZUZpbHRlclBhcnRpYWw8RGF0YSwgVj4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW1QYXJ0aWFsIHtcclxuXHRcdFx0aW5wdXQ6IFY7XHJcblx0XHR9XHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIFNvcnRlclBhcnRpYWxTb3VyY2U8RGF0YSwgVj4gZXh0ZW5kcyBGaWx0ZXJlckl0ZW1QYXJ0aWFsIHtcclxuXHRcdFx0Y29tcGFyYXRvcj86ICgoYTogViwgYjogVikgPT4gbnVtYmVyKSB8IFY7XHJcblx0XHR9XHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIE1vZGlmaWVyUGFydGlhbDxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbVBhcnRpYWwgeyB9XHJcblx0XHRleHBvcnQgaW50ZXJmYWNlIFByZWZpeGVyUGFydGlhbDxEYXRhPiBleHRlbmRzIEZpbHRlcmVySXRlbVBhcnRpYWwge1xyXG5cdFx0XHR0YXJnZXQ/OiBzZWxlY3RvciB8ICgoZWw6IEhUTUxFbGVtZW50LCBkYXRhOiBEYXRhLCBtb2RlOiBNb2RlKSA9PiBIVE1MRWxlbWVudCk7XHJcblx0XHRcdHByZWZpeD86IChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpID0+IHN0cmluZztcclxuXHRcdFx0cG9zdGZpeD86IChkYXRhOiBEYXRhLCBlbDogSFRNTEVsZW1lbnQpID0+IHN0cmluZztcclxuXHRcdFx0cHJlZml4QXR0cmlidXRlPzogc3RyaW5nO1xyXG5cdFx0XHRwb3N0Zml4QXR0cmlidXRlPzogc3RyaW5nO1xyXG5cdFx0XHRhbGw/OiBib29sZWFuO1xyXG5cdFx0fVxyXG5cclxuXHRcdHR5cGUgVW5pb248U291cmNlLCBSZXN1bHQ+ID0ge1xyXG5cdFx0XHRbUCBpbiBrZXlvZiBTb3VyY2UgJiBrZXlvZiBSZXN1bHRdOiBTb3VyY2VbUF0gfCBSZXN1bHRbUF07XHJcblx0XHR9ICYgT21pdDxTb3VyY2UsIGtleW9mIFJlc3VsdD4gJiBPbWl0PFJlc3VsdCwga2V5b2YgU291cmNlPjtcclxuXHJcblx0XHR0eXBlIE92ZXJyaWRlPFQsIE8+ID0gT21pdDxULCBrZXlvZiBPPiAmIE87XHJcblxyXG5cdFx0dHlwZSBFRlNvdXJjZTxUIGV4dGVuZHMgeyBzb3VyY2U6IGFueSB9PiA9IE92ZXJyaWRlPE92ZXJyaWRlPFBhcnRpYWw8VD4sIFRbJ3NvdXJjZSddPiwgeyBidXR0b24/OiBzZWxlY3RvciB9PjtcclxuXHJcblx0XHR0eXBlIFNvdXJjZTxUIGV4dGVuZHMgeyBzb3VyY2U6IGFueSB9PiA9IFRbJ3NvdXJjZSddICYge1xyXG5cdFx0XHRpZD86IHN0cmluZzsgbmFtZT86IHN0cmluZzsgZGVzY3JpcHRpb24/OiBzdHJpbmc7XHJcblx0XHRcdHRocmVlV2F5PzogV2F5bmVzczsgbW9kZT86IE1vZGU7IGluY29tcGF0aWJsZT86IHN0cmluZ1tdOyBoaWRkZW4/OiBib29sZWFuO1xyXG5cdFx0fTtcclxuXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBjYW4gYmUgZWl0aGVyIE1hcCBvciBXZWFrTWFwXHJcblx0XHQgKiAoV2Vha01hcCBpcyBsaWtlbHkgdG8gYmUgdXNlbGVzcyBpZiB0aGVyZSBhcmUgbGVzcyB0aGVuIDEwayBvbGQgbm9kZXMgaW4gbWFwKVxyXG5cdFx0ICovXHJcblx0XHRsZXQgTWFwVHlwZSA9IE1hcDtcclxuXHRcdHR5cGUgTWFwVHlwZTxLIGV4dGVuZHMgb2JqZWN0LCBWPiA9Ly8gTWFwPEssIFY+IHwgXHJcblx0XHRcdFdlYWtNYXA8SywgVj47XHJcblx0fVxyXG5cclxuXHRleHBvcnQgbGV0IEVGID0gRW50cnlGaWx0ZXJlckV4dGVuc2lvbi5FbnRyeUZpbHRlcmVyO1xyXG59IiwiXHJcblxyXG5uYW1lc3BhY2UgUG9vcEpzIHtcclxuXHJcblxyXG5cdGV4cG9ydCBjbGFzcyBTY3JvbGxJbmZvIHtcclxuXHRcdGVsOiBIVE1MRWxlbWVudDtcclxuXHRcdC8qKiBhYnNvbHV0ZSByZWN0ICovXHJcblx0XHRyZWN0OiBET01SZWN0O1xyXG5cclxuXHRcdGNvbnN0cnVjdG9yKGVsOiBIVE1MRWxlbWVudCkge1xyXG5cdFx0XHR0aGlzLmVsID0gZWw7XHJcblx0XHRcdGxldCByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblx0XHRcdGZ1bmN0aW9uIG4odjogbnVtYmVyKSB7IHJldHVybiArdi50b0ZpeGVkKDMpOyB9XHJcblx0XHRcdHRoaXMucmVjdCA9IG5ldyBET01SZWN0KFxyXG5cdFx0XHRcdG4ocmVjdC54IC8gaW5uZXJXaWR0aCksIG4oKHJlY3QueSArIHNjcm9sbFkpIC8gaW5uZXJIZWlnaHQpLFxyXG5cdFx0XHRcdG4ocmVjdC53aWR0aCAvIGlubmVyV2lkdGgpLCBuKHJlY3QuaGVpZ2h0IC8gaW5uZXJIZWlnaHQpKTtcclxuXHRcdH1cclxuXHRcdHRvcE9mZnNldChzY3JvbGxZID0gd2luZG93LnNjcm9sbFkpIHtcclxuXHRcdFx0bGV0IHdpbmRvd1kgPSBzY3JvbGxZIC8gaW5uZXJIZWlnaHQ7XHJcblx0XHRcdGxldCBvZmZzZXQgPSB0aGlzLnJlY3QudG9wIC0gd2luZG93WTtcclxuXHRcdFx0cmV0dXJuICtvZmZzZXQudG9GaXhlZCgzKTtcclxuXHRcdH1cclxuXHRcdGNlbnRlck9mZnNldChzY3JvbGxZID0gd2luZG93LnNjcm9sbFkpIHtcclxuXHRcdFx0bGV0IHdpbmRvd1kgPSBzY3JvbGxZIC8gaW5uZXJIZWlnaHQgKyAwLjU7XHJcblx0XHRcdGxldCBvZmZzZXQgPSB0aGlzLnJlY3QudG9wICsgdGhpcy5yZWN0LmhlaWdodCAvIDIgLSB3aW5kb3dZO1xyXG5cdFx0XHRyZXR1cm4gK29mZnNldC50b0ZpeGVkKDMpO1xyXG5cdFx0fVxyXG5cdFx0Ym90dG9tT2Zmc2V0KHNjcm9sbFkgPSB3aW5kb3cuc2Nyb2xsWSkge1xyXG5cdFx0XHRsZXQgd2luZG93WSA9IHNjcm9sbFkgLyBpbm5lckhlaWdodCArIDE7XHJcblx0XHRcdGxldCBvZmZzZXQgPSB0aGlzLnJlY3QuYm90dG9tIC0gd2luZG93WTtcclxuXHRcdFx0cmV0dXJuICtvZmZzZXQudG9GaXhlZCgzKTtcclxuXHRcdH1cclxuXHRcdGRpc3RhbmNlRnJvbVNjcmVlbihzY3JvbGxZID0gd2luZG93LnNjcm9sbFkpIHtcclxuXHRcdFx0bGV0IHdpbmRvd1kgPSBzY3JvbGxZIC8gaW5uZXJIZWlnaHQ7XHJcblx0XHRcdGlmICh0aGlzLnJlY3QuYm90dG9tIDwgd2luZG93WSAtIDAuMDAwMSkgcmV0dXJuIHRoaXMucmVjdC5ib3R0b20gLSB3aW5kb3dZO1xyXG5cdFx0XHRpZiAodGhpcy5yZWN0LnRvcCA+IHdpbmRvd1kgKyAxLjAwMSkgcmV0dXJuIHRoaXMucmVjdC50b3AgLSB3aW5kb3dZIC0gMTtcclxuXHRcdH1cclxuXHJcblx0XHRnZXQgZnVsbERpcigpIHtcclxuXHRcdFx0aWYgKHRoaXMudG9wT2Zmc2V0KCkgPCAtMC4wMDEpXHJcblx0XHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0XHRpZiAodGhpcy5ib3R0b21PZmZzZXQoKSA+IDAuMDAxKVxyXG5cdFx0XHRcdHJldHVybiAxO1xyXG5cdFx0XHRyZXR1cm4gMDtcclxuXHRcdH1cclxuXHRcdGdldCBfb2Zmc2V0cygpIHtcclxuXHRcdFx0cmV0dXJuIFt0aGlzLnRvcE9mZnNldCgpLCB0aGlzLmNlbnRlck9mZnNldCgpLCB0aGlzLmJvdHRvbU9mZnNldCgpXTtcclxuXHRcdH1cclxuXHJcblx0fVxyXG5cclxuXHRleHBvcnQgY2xhc3MgSW1hZ2VTY3JvbGxlciB7XHJcblx0XHRzZWxlY3RvciA9ICdpbWcnO1xyXG5cclxuXHRcdGVuYWJsZWQgPSBmYWxzZTtcclxuXHRcdGRpc2FibGVXaGVlbCA9IGZhbHNlO1xyXG5cdFx0bGlzdGVuZXI/OiBhbnk7XHJcblxyXG5cdFx0c3RvcFByb3BhZ2F0aW9uID0gZmFsc2U7XHJcblxyXG5cdFx0Y29uc3RydWN0b3Ioc2VsZWN0b3IgPSAnJykge1xyXG5cdFx0XHRpZiAoc2VsZWN0b3IpIHRoaXMuc2VsZWN0b3IgPSBzZWxlY3RvcjtcclxuXHRcdH1cclxuXHJcblx0XHRfd2hlZWxMaXN0ZW5lcj86IChldmVudDogV2hlZWxFdmVudCkgPT4gdm9pZDtcclxuXHRcdG9uV2hlZWxTY3JvbGxGYWlsZWQ/OiAoZXZlbnQ6IFdoZWVsRXZlbnQpID0+IHZvaWQ7XHJcblx0XHRiaW5kV2hlZWwoKSB7XHJcblx0XHRcdGlmICh0aGlzLl93aGVlbExpc3RlbmVyKSByZXR1cm47XHJcblx0XHRcdGxldCBsID0gdGhpcy5fd2hlZWxMaXN0ZW5lciA9IChldmVudCkgPT4ge1xyXG5cdFx0XHRcdGlmICh0aGlzLl93aGVlbExpc3RlbmVyICE9IGwpIHJldHVybiByZW1vdmVFdmVudExpc3RlbmVyKCd3aGVlbCcsIGwpO1xyXG5cdFx0XHRcdGlmICghdGhpcy5lbmFibGVkKSByZXR1cm47XHJcblx0XHRcdFx0aWYgKCFldmVudC5kZWx0YVkpIHJldHVybjtcclxuXHRcdFx0XHRpZiAoZXZlbnQuc2hpZnRLZXkgfHwgZXZlbnQuY3RybEtleSkgcmV0dXJuO1xyXG5cdFx0XHRcdGlmICh0aGlzLnNjcm9sbChNYXRoLnNpZ24oZXZlbnQuZGVsdGFZKSkpIHtcclxuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFx0XHR0aGlzLnN0b3BQcm9wYWdhdGlvbiAmJiBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhpcy5vbldoZWVsU2Nyb2xsRmFpbGVkPy4oZXZlbnQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRhZGRFdmVudExpc3RlbmVyKCd3aGVlbCcsIHRoaXMuX3doZWVsTGlzdGVuZXIsIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHR9XHJcblx0XHRfYXJyb3dMaXN0ZW5lcj86IChldmVudDogS2V5Ym9hcmRFdmVudCkgPT4gdm9pZDtcclxuXHRcdGJpbmRBcnJvd3MoKSB7XHJcblx0XHRcdGlmICh0aGlzLl9hcnJvd0xpc3RlbmVyKSByZXR1cm47XHJcblx0XHRcdHRoaXMuX2Fycm93TGlzdGVuZXIgPSAoZXZlbnQpID0+IHtcclxuXHRcdFx0XHRpZiAoIXRoaXMuZW5hYmxlZCkgcmV0dXJuO1xyXG5cdFx0XHRcdGlmIChldmVudC5jb2RlID09ICdBcnJvd0xlZnQnKSB7XHJcblx0XHRcdFx0XHRpZiAodGhpcy5zY3JvbGwoLTEpKSB7XHJcblx0XHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFx0XHRcdHRoaXMuc3RvcFByb3BhZ2F0aW9uICYmIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoZXZlbnQuY29kZSA9PSAnQXJyb3dSaWdodCcpIHtcclxuXHRcdFx0XHRcdGlmICh0aGlzLnNjcm9sbCgxKSkge1xyXG5cdFx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdFx0XHR0aGlzLnN0b3BQcm9wYWdhdGlvbiAmJiBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHR9XHJcblx0XHRcdGFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9hcnJvd0xpc3RlbmVyLCB7IGNhcHR1cmU6IHRydWUgfSk7XHJcblx0XHR9XHJcblxyXG5cdFx0LyoqIGVuYWJsZSB0aGlzIHNjcm9sbGVyICovXHJcblx0XHRvbihzZWxlY3RvciA9ICcnKTogdGhpcyB7XHJcblx0XHRcdGlmIChzZWxlY3RvcikgdGhpcy5zZWxlY3RvciA9IHNlbGVjdG9yO1xyXG5cdFx0XHR0aGlzLmVuYWJsZWQgPSB0cnVlO1xyXG5cdFx0XHR0aGlzLmJpbmRBcnJvd3MoKTtcclxuXHRcdFx0dGhpcy5iaW5kV2hlZWwoKTtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9XHJcblxyXG5cdFx0LyoqIGRpc2FibGUgdGhpcyBzY3JvbGxlciAqL1xyXG5cdFx0b2ZmKHNlbGVjdG9yID0gJycpOiB0aGlzIHtcclxuXHRcdFx0aWYgKHNlbGVjdG9yKSB0aGlzLnNlbGVjdG9yID0gc2VsZWN0b3I7XHJcblx0XHRcdHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH1cclxuXHJcblx0XHRtb2RlOiAnc2luZ2xlJyB8ICdncm91cCcgPSAnZ3JvdXAnO1xyXG5cclxuXHRcdC8qKiBzY3JvbGwgdG8gdGhlIG5leHQgaXRlbSAqL1xyXG5cdFx0c2Nyb2xsKGRpcjogLTEgfCAwIHwgMSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRpZiAodGhpcy5tb2RlID09ICdncm91cCcpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5zY3JvbGxUb05leHRHcm91cChkaXIpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICh0aGlzLm1vZGUgPT0gJ3NpbmdsZScpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5zY3JvbGxUb05leHRDZW50ZXIoZGlyKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHJcblx0XHRzY3JvbGxUb05leHRDZW50ZXIoZGlyOiAtMSB8IDAgfCAxKTogYm9vbGVhbiB7XHJcblx0XHRcdGxldCBuZXh0ID0gdGhpcy5fbmV4dFNjcm9sbFRhcmdldChkaXIsICdzaW5nbGUnKTtcclxuXHRcdFx0aWYgKFBvb3BKcy5kZWJ1ZykgeyBjb25zb2xlLmxvZyhgc2Nyb2xsOiBgLCBuZXh0KTsgfVxyXG5cdFx0XHRpZiAoIW5leHQpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0bmV4dC5lbC5zY3JvbGxJbnRvVmlldyh7IGJsb2NrOiAnY2VudGVyJyB9KTtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9XHJcblxyXG5cdFx0c2Nyb2xsVG9OZXh0R3JvdXAoZGlyOiAtMSB8IDAgfCAxKTogYm9vbGVhbiB7XHJcblx0XHRcdGxldCBuZXh0ID0gdGhpcy5fbmV4dFNjcm9sbFRhcmdldChkaXIsICdncm91cCcpO1xyXG5cdFx0XHRpZiAoUG9vcEpzLmRlYnVnKSB7IGNvbnNvbGUubG9nKGBzY3JvbGw6IGAsIG5leHQpOyB9XHJcblx0XHRcdGlmICghbmV4dCB8fCAhbmV4dC5sZW5ndGgpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0bGV0IHkgPSAobmV4dFswXS5yZWN0LnRvcCArIG5leHQuYXQoLTEpLnJlY3QuYm90dG9tIC0gMSkgLyAyO1xyXG5cdFx0XHQvLyBmaXhtZVxyXG5cdFx0XHRpZiAoTWF0aC5hYnMoc2Nyb2xsWSAvIGlubmVySGVpZ2h0IC0geSkgPiAwLjc1MCkge1xyXG5cdFx0XHRcdGlmICghdGhpcy5nZXRBbGxTY3JvbGxzKCkuZmluZChlID0+IGUuZnVsbERpciA9PSAwKSkge1xyXG5cdFx0XHRcdFx0aWYgKFBvb3BKcy5kZWJ1ZykgeyBjb25zb2xlLmxvZyhgc2Nyb2xsIHRvbyBmYXJgLCBuZXh0KTsgfVxyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRzY3JvbGxUbygwLCB5ICogaW5uZXJIZWlnaHQpO1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH1cclxuXHJcblx0XHRfbmV4dFNjcm9sbFRhcmdldChkaXI6IC0xIHwgMCB8IDEsIG1vZGU6ICdzaW5nbGUnKTogU2Nyb2xsSW5mbyB8IHVuZGVmaW5lZDtcclxuXHRcdF9uZXh0U2Nyb2xsVGFyZ2V0KGRpcjogLTEgfCAwIHwgMSwgbW9kZTogJ2dyb3VwJyk6IFNjcm9sbEluZm9bXSB8IHVuZGVmaW5lZDtcclxuXHRcdF9uZXh0U2Nyb2xsVGFyZ2V0KGRpcjogLTEgfCAwIHwgMSwgbW9kZTogJ3NpbmdsZScgfCAnZ3JvdXAnKSB7XHJcblx0XHRcdGxldCBzY3JvbGxzID0gdGhpcy5nZXRBbGxTY3JvbGxzKCk7XHJcblx0XHRcdGlmIChtb2RlID09ICdzaW5nbGUnKSB7XHJcblx0XHRcdFx0aWYgKGRpciA9PSAtMSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHNjcm9sbHMuZmluZExhc3QoZSA9PiBlLmZ1bGxEaXIgPT0gLTEpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoZGlyID09IDApIHtcclxuXHRcdFx0XHRcdGxldCBsaXN0ID0gc2Nyb2xscy5maWx0ZXIoZSA9PiBlLmZ1bGxEaXIgPT0gMCk7XHJcblx0XHRcdFx0XHRyZXR1cm4gbGlzdFt+fihsaXN0Lmxlbmd0aCAvIDIpXTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGRpciA9PSAxKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gc2Nyb2xscy5maW5kKGUgPT4gZS5mdWxsRGlyID09IDEpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAobW9kZSA9PSAnZ3JvdXAnKSB7XHJcblx0XHRcdFx0aWYgKGRpciA9PSAtMSkge1xyXG5cdFx0XHRcdFx0bGV0IGxhc3QgPSBzY3JvbGxzLmZpbmRMYXN0KGUgPT4gZS5mdWxsRGlyID09IC0xKTtcclxuXHRcdFx0XHRcdGlmICghbGFzdCkgcmV0dXJuO1xyXG5cdFx0XHRcdFx0cmV0dXJuIHNjcm9sbHMuZmlsdGVyKGUgPT4gTWF0aC5hYnMoZS5yZWN0LnRvcCAtIGxhc3QucmVjdC5ib3R0b20pIDw9IDEuMDAxICYmIGUuZnVsbERpciA9PSAtMSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChkaXIgPT0gMCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHNjcm9sbHMuZmlsdGVyKGUgPT4gZS5mdWxsRGlyID09IDApO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoZGlyID09IDEpIHtcclxuXHRcdFx0XHRcdGxldCBsYXN0ID0gc2Nyb2xscy5maW5kKGUgPT4gZS5mdWxsRGlyID09IDEpO1xyXG5cdFx0XHRcdFx0aWYgKCFsYXN0KSByZXR1cm47XHJcblx0XHRcdFx0XHRyZXR1cm4gc2Nyb2xscy5maWx0ZXIoZSA9PiBNYXRoLmFicyhsYXN0LnJlY3QudG9wIC0gZS5yZWN0LmJvdHRvbSkgPD0gMS4wMDEgJiYgZS5mdWxsRGlyID09IDEpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHJcblx0XHRnZXRBbGxTY3JvbGxzKHNlbGVjdG9yID0gdGhpcy5zZWxlY3Rvcikge1xyXG5cdFx0XHRyZXR1cm4gcXEoc2VsZWN0b3IpLm1hcChlID0+IG5ldyBTY3JvbGxJbmZvKGUpKS52c29ydChlID0+IGUuY2VudGVyT2Zmc2V0KCkpO1xyXG5cdFx0fVxyXG5cclxuXHJcblxyXG5cclxuXHJcblx0XHQvKiogdXNlZCAgKi9cclxuXHRcdGFzeW5jIGtlZXAocmVzaXplcjogKCkgPT4gYW55IHwgUHJvbWlzZTxhbnk+LCByYWYgPSBmYWxzZSkge1xyXG5cdFx0XHRsZXQgcG9zID0gdGhpcy5zYXZlKCk7XHJcblx0XHRcdGF3YWl0IHJlc2l6ZXIoKTtcclxuXHRcdFx0cG9zLnJlc3RvcmUoKTtcclxuXHRcdFx0aWYgKHJhZikge1xyXG5cdFx0XHRcdGF3YWl0IFByb21pc2UuZnJhbWUoKTtcclxuXHRcdFx0XHRwb3MucmVzdG9yZSgpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0LyoqIHNhdmUgY3VycmVudCBpdGVtIHNjcm9sbCBwb3NpdGlvbiAqL1xyXG5cdFx0c2F2ZSgpOiB7IGluZm86IFNjcm9sbEluZm8sIG9mZnNldDogbnVtYmVyLCByZXN0b3JlKCk6IHZvaWQgfSB7XHJcblx0XHRcdGxldCBzY3JvbGxzID0gdGhpcy5nZXRBbGxTY3JvbGxzKCk7XHJcblx0XHRcdGlmICghc2Nyb2xscy5sZW5ndGgpIHtcclxuXHRcdFx0XHRyZXR1cm4geyBpbmZvOiB1bmRlZmluZWQgYXMgYW55LCBvZmZzZXQ6IC0xLCByZXN0b3JlOiAoKSA9PiB7IH0gfTtcclxuXHRcdFx0fVxyXG5cdFx0XHRsZXQgaW5mbyA9IHNjcm9sbHMudnNvcnQoZSA9PiBNYXRoLmFicyhlLmNlbnRlck9mZnNldCgpKSlbMF07XHJcblx0XHRcdGxldCBvZmZzZXQgPSBpbmZvLmNlbnRlck9mZnNldCgpO1xyXG5cdFx0XHRmdW5jdGlvbiByZXN0b3JlKCkge1xyXG5cdFx0XHRcdGxldCBuZXdJbmZvID0gbmV3IFNjcm9sbEluZm8oaW5mby5lbCk7XHJcblx0XHRcdFx0bGV0IG5ld09mZnNldCA9IG5ld0luZm8uY2VudGVyT2Zmc2V0KCk7XHJcblx0XHRcdFx0c2Nyb2xsVG8oMCwgc2Nyb2xsWSArIChuZXdPZmZzZXQgLSBvZmZzZXQpICogaW5uZXJIZWlnaHQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB7IGluZm8sIG9mZnNldCwgcmVzdG9yZSB9O1xyXG5cdFx0fVxyXG5cclxuXHJcblx0XHRzdGF0aWMgY3JlYXRlRGVmYXVsdCgpOiBJbWFnZVNjcm9sbGVyIHtcclxuXHRcdFx0cmV0dXJuIG5ldyBJbWFnZVNjcm9sbGVyKCk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRleHBvcnQgZGVjbGFyZSBsZXQgaXM6IEltYWdlU2Nyb2xsZXI7XHJcblxyXG5cdGRlZmluZUxhenkoUG9vcEpzLCAnaXMnLCAoKSA9PiBJbWFnZVNjcm9sbGVyLmNyZWF0ZURlZmF1bHQoKSk7XHJcblxyXG5cclxuXHRmdW5jdGlvbiBkZWZpbmVMYXp5PFQsIEsgZXh0ZW5kcyBrZXlvZiBULCBWIGV4dGVuZHMgVFtLXT4oXHJcblx0XHR0YXJnZXQ6IFQsIHByb3A6IEssIGdldDogKHRoaXM6IHZvaWQpID0+IFZcclxuXHQpIHtcclxuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHByb3AsIHtcclxuXHRcdFx0Z2V0OiAoKSA9PiB7XHJcblx0XHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgcHJvcCwge1xyXG5cdFx0XHRcdFx0dmFsdWU6IGdldCgpLFxyXG5cdFx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdFx0d3JpdGFibGU6IHRydWUsXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0cmV0dXJuIHRhcmdldFtwcm9wXTtcclxuXHRcdFx0fSxcclxuXHRcdFx0c2V0KHYpIHtcclxuXHRcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBwcm9wLCB7XHJcblx0XHRcdFx0XHR2YWx1ZTogdixcclxuXHRcdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdFx0XHRcdHdyaXRhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHJldHVybiB0YXJnZXRbcHJvcF07XHJcblx0XHRcdH0sXHJcblx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0Y29uc3QgdmFycyA9IHt9IGFzIFJlY29yZDxzdHJpbmcsIG51bWJlciB8IHN0cmluZz47XHJcblx0ZXhwb3J0IGNvbnN0IHN0eWxlVmFycyA9IG5ldyBQcm94eSh2YXJzIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4sIHtcclxuXHRcdGdldCh0YXJnZXQsIHByb3A6IHN0cmluZyk6IHN0cmluZyB7XHJcblx0XHRcdGlmIChwcm9wLnN0YXJ0c1dpdGgoJy0tJykpIHByb3AgPSBwcm9wLnNsaWNlKDIpO1xyXG5cdFx0XHRsZXQgc3R5bGUgPSBkb2N1bWVudC5ib2R5LnN0eWxlO1xyXG5cdFx0XHRsZXQgdiA9IHN0eWxlLmdldFByb3BlcnR5VmFsdWUoJy0tJyArIHByb3ApO1xyXG5cdFx0XHR0YXJnZXRbcHJvcF0gPSB2O1xyXG5cdFx0XHRyZXR1cm4gdjtcclxuXHRcdH0sXHJcblx0XHRzZXQodGFyZ2V0LCBwcm9wOiBzdHJpbmcsIHY6IHN0cmluZyk6IHRydWUge1xyXG5cdFx0XHRpZiAocHJvcC5zdGFydHNXaXRoKCctLScpKSBwcm9wID0gcHJvcC5zbGljZSgyKTtcclxuXHRcdFx0bGV0IHN0eWxlID0gZG9jdW1lbnQuYm9keS5zdHlsZTtcclxuXHRcdFx0dGFyZ2V0W3Byb3BdID0gdjtcclxuXHRcdFx0c3R5bGUuc2V0UHJvcGVydHkoJy0tJyArIHByb3AsIHYgKyAnJyk7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fSxcclxuXHR9KTtcclxuXHRleHBvcnQgY29uc3Qgc3R5bGVWYXJzTiA9IG5ldyBQcm94eSh2YXJzIGFzIFJlY29yZDxzdHJpbmcsIG51bWJlcj4sIHtcclxuXHRcdGdldCh0YXJnZXQsIHByb3A6IHN0cmluZyk6IG51bWJlciB7XHJcblx0XHRcdGlmIChwcm9wLnN0YXJ0c1dpdGgoJy0tJykpIHByb3AgPSBwcm9wLnNsaWNlKDIpO1xyXG5cdFx0XHRsZXQgc3R5bGUgPSBkb2N1bWVudC5ib2R5LnN0eWxlO1xyXG5cdFx0XHRsZXQgdjogc3RyaW5nID0gc3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnLS0nICsgcHJvcCk7XHJcblx0XHRcdHJldHVybiArdjtcclxuXHRcdH0sXHJcblx0XHRzZXQodGFyZ2V0LCBwcm9wOiBzdHJpbmcsIHY6IG51bWJlcik6IHRydWUge1xyXG5cdFx0XHRpZiAocHJvcC5zdGFydHNXaXRoKCctLScpKSBwcm9wID0gcHJvcC5zbGljZSgyKTtcclxuXHRcdFx0bGV0IHN0eWxlID0gZG9jdW1lbnQuYm9keS5zdHlsZTtcclxuXHRcdFx0dGFyZ2V0W3Byb3BdID0gK3Y7XHJcblx0XHRcdHN0eWxlLnNldFByb3BlcnR5KCctLScgKyBwcm9wLCB2ICsgJycpO1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH0sXHJcblx0fSk7XHJcblxyXG59XHJcblxyXG4iLCIiXX0=