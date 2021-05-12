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
    let Elm;
    (function (Elm) {
        const elmRegex = new RegExp([
            /^(?<tag>[\w-]+)/,
            /#(?<id>[\w-]+)/,
            /\.(?<class>[\w-]+)/,
            /\[(?<attr1>[\w-]+)\]/,
            /\[(?<attr2>[\w-]+=(?!['"])(?<val2>[^\]]*))\]/,
            /\[(?<attr3>[\w-]+="(?<val3>([^"]|\\")*))")\]/,
            /\[(?<attr4>[\w-]+="(?<val4>([^']|\\')*))")\]/,
        ].map(e => e.source).join('|'), 'g');
        function elm(selector, ...children) {
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
                    element.setAttribute(match.groups.attr2, match.groups.val2.replace(/\\"/g, '"'));
                }
                else if (match.groups.attr4) {
                    element.setAttribute(match.groups.attr2, match.groups.val2.replace(/\\'/g, '\''));
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
/// <reference path="./elm.ts" />
/// <reference path="./element.ts" />
/// <reference path="./Promise.ts" />
/// <reference path="./fetch.ts" />
/// <reference path="Object.ts" />
/// <reference path="Array.ts" />
var PoopJs;
(function (PoopJs) {
    function __init__(window) {
        if (!window)
            window = globalThis.window;
        if (Object.prototype.hasOwnProperty.call(window, '__init__'))
            return 'already inited';
        window.elm = PoopJs.Elm.elm;
        window.q = PoopJs.winq.q;
        window.qq = PoopJs.winq.qq;
        PoopJs.object.defineValue(Element.prototype, 'q', PoopJs.element.q);
        PoopJs.object.defineValue(Element.prototype, 'qq', PoopJs.element.qq);
        PoopJs.object.defineValue(Element.prototype, 'appendTo', PoopJs.element.appendTo);
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
        PoopJs.object.defineValue(Array, 'map', PoopJs.array.map);
        PoopJs.object.defineValue(Array.prototype, 'pmap', PoopJs.array.pmap);
        PoopJs.object.defineValue(Array.prototype, 'vsort', PoopJs.array.vsort);
        // globalThis.DateNowHack = DateNowHack;
        // globalThis.paginate = paginate;
        // Array.map = map;
        // Object.map = function(o, mapper) {
        // 	return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, mapper(v, k, o)]));
        // }
        // Object.defineValue(Array.prototype, pmap);
        // Object.defineValue(Array.prototype, vsort);
    }
    PoopJs.__init__ = __init__;
    PoopJs.object.defineGetter(window, '__init__', () => __init__(window));
    if (window.localStorage.__init__) {
        window.__init__;
    }
})(PoopJs || (PoopJs = {}));
elm: typeof PoopJs.Elm.elm;
// // @ts-ignore file
// void function () {
// 	if (globalThis.hasOwnProperty('__init__')) {
// 		return;
// 	}
// 	function DateNowHack(n = 5) {
// 		Date._now ??= Date.now;
// 		let _start = Date._now();
// 		let start = Date.now();
// 		Date.now = function () {
// 			return (this._now() - _start) * n + start;
// 		}
// 		console.log(`DateNowHack:`, n);
// 	}
// 	let paginate = {
// 		active: false,
// 		queued: 0,
// 		wip: false,
// 		init() {
// 			if (paginate.active)
// 				return;
// 			paginate.active = true;
// 			document.body.addEventListener('auxclick', (event) => {
// 				if (event.which == 3)
// 					return;
// 				if (event.target.closest('a'))
// 					return;
// 				event.target.emit('paginationrequest', event);
// 				this.paginationrequest(event);
// 			});
// 			document.body.addEventListener('keydown', (event) => {
// 				if (event.code != 'AltRight')
// 					return;
// 				event.preventDefault();
// 				event.target.emit('paginationrequest', event);
// 				this.paginationrequest(event);
// 			});
// 			document.body.addEventListener('paginationend', (event) => {
// 				paginate.wip = false;
// 				if (paginate.queued) {
// 					paginate.queued--;
// 					paginate.run();
// 				}
// 			});
// 		},
// 		paginationrequest(event) {
// 			getSelection().removeAllRanges();
// 			if (event.shiftKey || event.detail?.shiftKey
// 					|| event.buttons == 1) {
// 				paginate.queued += 9;
// 			}
// 			if (paginate.wip) {
// 				paginate.queued++;
// 				return;
// 			}
// 			paginate.run();			
// 		},
// 		run() {
// 			paginate.wip = true;
// 			document.body.emit('paginationstart');
// 		},
// 		onrun(condition, fn = condition) {
// 			paginate.init();
// 			if (!condition) return;
// 			console.log('paginate registered:', fn);
// 			document.body.addEventListener('paginationstart', fn);
// 		},
// 		onchange(condition, fn = condition) {
// 			paginate.init();
// 			if (!condition) return;
// 			document.body.addEventListener('paginationchange', fn);
// 		},
// 		end() {
// 			document.body.emit('paginationend');
// 		},
// 		onend(condition, fn = condition) {
// 			if (!condition) return;
// 			document.body.addEventListener('paginationend', fn);
// 		},
// 		async aDoc(sel) {
// 			let a = sel instanceof HTMLElement ? sel :  q(sel);
// 			if (!a) throw new Error('not a link');
// 			a.classList.add('paginate-spin');
// 			let doc = await fetch.doc(a.href);
// 			this.doc = doc;
// 			return doc;
// 		},
// 		async aCachedDoc(sel) {
// 			let a = sel instanceof HTMLElement ? sel :  q(sel);
// 			if (!a) throw new Error('not a link');
// 			a.classList.add('paginate-spin');
// 			let doc = await fetch.cached.doc(a.href);
// 			a.classList.remove('paginate-spin');
// 			this.doc = doc;
// 			return doc;
// 		},
// 		appendChildren(doc, source, target = source) {
// 			if (typeof doc == 'string')
// 				return this.appendChildren(this.doc, doc, source);
// 			let children = [...doc.q(source).children];
// 			q(target).append(...children);
// 			document.body.emit('paginationchange', children);
// 			return this;
// 		},
// 		afterLast(doc, source, target = source) {
// 			if (typeof doc == 'string')
// 				return this.afterLast(this.doc, doc, source);
// 			let children = doc.qq(source);
// 			let last = qq(target).pop();
// 			last.after(...children);
// 			document.body.emit('paginationchange');
// 			return this;
// 		},
// 		replace(doc, source, target = source) {
// 			if (typeof doc == 'string')
// 				return this.replace(this.doc, doc, source);
// 				let child = doc.q(source)
// 			q(target).replaceWith(child);
// 			document.body.emit('paginationchange', [child]);
// 			return this;
// 		},
// 		imageScrolling() {
// 			if (this.imageScrolling.active) return;
// 			this.imageScrolling.active = true;
// 			document.addEventListener(
// 				'mousewheel', 
// 				e => {
// 					scrollWholeImage(-Math.sign(e.wheelDeltaY));
// 					e.preventDefault();
// 					console.log(e);
// 				}, {
// 					passive: false
// 				}
// 			);
// 			function scrollWholeImage(dir = 1) {
// 				function imgToWindowCenter(img) {
// 					let rect = img.getBoundingClientRect();
// 					return rect.y + rect.height / 2 - innerHeight / 2;
// 				}
// 				function getCentralImg() {
// 					return qq('img').vsort(img => Math.abs(imgToWindowCenter(img)))[0];
// 				}
// 				let img = getCentralImg();
// 				let nextImg;
// 				if (dir == 1) {
// 					nextImg = img.nextElementSibling.nextElementSibling;
// 				} else {
// 					nextImg = img.previousElementSibling.previousElementSibling;
// 				}
// 				let delta = imgToWindowCenter(nextImg);
// 				scrollBy(0, delta);
// 			}
// 		},
// 	};
// 	function __init__() {
// 		Object.map = function(o, mapper) {
// 			return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, mapper(v, k, o)]));
// 		}
// 		Object.defineGetter(Element.prototype, function data(){
// 			let data = JSON.parse(this.dataset.data || '{}');
// 			return new Proxy(data, {
// 				get: (target, name) => {
// 					if (name == 'data') return data;
// 					return data[name];
// 				},
// 				set: (target, name, value) => {
// 					data[name] = value;
// 					this.dataset.data = JSON.stringify(data);
// 				},
// 			});
// 		});
// 	}
// 	let initialized = false;
// 	Object.defineProperty(globalThis, '__init__', {
// 		get() {
// 			if (initialized) {
// 				return 'already inited';
// 			}
// 			__init__();
// 			return 'init';
// 		}
// 	});
// 	if (localStorage.__init__) {
// 		globalThis.__init__;
// 	}
// }();
//# sourceMappingURL=build.js.map