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
// 		globalThis.elm = elm;
// 		globalThis.q = q;
// 		globalThis.qq = qq;
// 		globalThis.DateNowHack = DateNowHack;
// 		globalThis.paginate = paginate;
// 		Promise.empty = empty;
// 		Promise.frame = frame;
// 		fetch.cached = cached;
// 		fetch.doc = doc;
// 		Array.map = map;
// 		Object.defineValue = defineValue;
// 		Object.defineGetter = defineGetter;
// 		Object.map = function(o, mapper) {
// 			return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, mapper(v, k, o)]));
// 		}
// 		Object.defineValue(Array.prototype, pmap);
// 		Object.defineValue(Array.prototype, vsort);
// 		Object.defineValue(Element.prototype, function q(sel) {
// 			return this.querySelector(sel);
// 		});
// 		Object.defineValue(Element.prototype, function qq(sel) {
// 			return [...this.querySelectorAll(sel)];
// 		});
// 		Object.defineValue(Element.prototype, function appendTo(sel) {
// 			if (typeof sel == 'string') sel = q(sel);
// 			sel.append(this);
// 			return this;
// 		});
// 		Object.defineValue(HTMLDocument.prototype, function q(sel) {
// 			return this.documentElement.q(sel);
// 		});
// 		Object.defineValue(HTMLDocument.prototype, function qq(sel) {
// 			return this.documentElement.qq(sel);
// 		});
// 		Object.defineValue(Element.prototype, emit);
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
