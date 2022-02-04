namespace PoopJs {

	export type deltaTime = number | `${number}${'s' | 'h' | 'd' | 'w' | 'y'}` | null;

	export function normalizeDeltaTime(maxAge: deltaTime) {
		if (typeof maxAge == 'number') return maxAge;
		if (typeof maxAge != 'string') return Infinity;
		const aToM = { s: 1e3, h: 3600e3, d: 24 * 3600e3, w: 7 * 24 * 3600e3, y: 365 * 24 * 3600e3 };
		let n = parseFloat(maxAge);
		let m = aToM[maxAge[maxAge.length - 1]];
		if (n != n || !m) throw new Error('invalid deltaTime');
		return n * m;
	}

	export namespace FetchExtension {
		export type RequestInitEx = RequestInit & { maxAge?: deltaTime, xml?: boolean };
		export type RequestInitExJson = RequestInit & { maxAge?: deltaTime, indexedDb?: boolean };
		export let defaults: RequestInit = { credentials: 'include' };

		export let cache: Cache = null;
		async function openCache() {
			if (cache) return cache;
			cache = await caches.open('fetch');
			return cache;
		}

		function toDur(dt: deltaTime) {
			dt = normalizeDeltaTime(dt);
			if (dt > 1e10) dt = Date.now() - dt;
			let split = (n: number, d: number) => [n % d, ~~(n / d)];
			let to2 = (n: number) => (n + '').padStart(2, '0');
			var [ms, s] = split(dt, 1000);
			var [s, m] = split(s, 60);
			var [m, h] = split(m, 60);
			var [h, d] = split(h, 24);
			var [d, w] = split(d, 7);
			return w > 1e3 ? 'forever' : w ? `${w}w${d}d` : d ? `${d}d${to2(h)}h` : h + m ? `${to2(h)}:${to2(m)}:${to2(s)}` : `${s + ~~ms / 1000}s`;
		}

		export function isStale(cachedAt: number, maxAge?: deltaTime) {
			if (maxAge == null) return false;
			return Date.now() - cachedAt >= normalizeDeltaTime(maxAge);
		}

		export async function cached(url: string, init: RequestInitEx = {}): Promise<Response> {
			let now = performance.now();
			let cache = await openCache();
			let response = await cache.match(url);
			if (response) {
				response.cachedAt = +response.headers.get('cached-at') || 0;
				if (!isStale(response.cachedAt, normalizeDeltaTime(init.maxAge))) {
					PoopJs.debug && console.log(`Cached response: ${toDur(response.cachedAt)} < c:${toDur(init.maxAge)}`, url);
					return response;
				}
				PoopJs.debug && console.log(`Stale response: ${toDur(response.cachedAt)} > c:${toDur(init.maxAge)}`, url);
			}
			response =
				!init.xml ? await fetch(url, { ...defaults, ...init })
					: await xmlResponse(url, init);
			if (response.ok) {
				response.cachedAt = Date.now();
				let clone = response.clone();
				let init2: ResponseInit = {
					status: clone.status, statusText: clone.statusText,
					headers: [['cached-at', `${response.cachedAt}`], ...clone.headers.entries()]
				};
				let resultResponse = new Response(clone.body, init2);
				cache.put(url, resultResponse);
				let dt = performance.now() - now;
				PoopJs.debug && console.log(`Loaded response: ${toDur(dt)} / c:${toDur(init.maxAge)}`, url);
			} else {
				PoopJs.debug && console.log(`Failed response: ${toDur(response.cachedAt)} / c:${toDur(init.maxAge)}`, url);
			}
			return response;
		}

		export async function cachedDoc(url: string, init: RequestInitEx = {}): Promise<Document> {
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


		export async function doc(url: string, init: RequestInitEx = {}): Promise<Document> {
			let response =
				!init.xml ? await fetch(url, { ...defaults, ...init })
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

		export async function xmlResponse(url: string, init: RequestInitEx = {}): Promise<Response> {
			let p = PromiseExtension.empty();
			let oReq = new XMLHttpRequest();
			oReq.onload = p.r;
			oReq.responseType = 'document';
			oReq.open("get", url, true);
			oReq.send();
			await p;
			if (oReq.responseType != 'document') throw new Error('FIXME');
			return new Response(oReq.responseXML.documentElement.outerHTML, init);
		}

		export async function json(url: string, init: RequestInit = {}): Promise<unknown> {
			return fetch(url, { ...defaults, ...init }).then(e => e.json());
		}

		export async function clearCache() {
			cache = null;
			return caches.delete('fetch');
		}

		export async function uncache(url: string) {
			let cache = await openCache();
			let d1 = cache.delete(url);
			let d2 = await idbDelete(url);
			return (await d1) || d2;
		}

		export async function isCached(url: string, options: { maxAge?: deltaTime, indexedDb?: boolean | 'only' } = {}): Promise<boolean | 'idb'> {
			if (options.indexedDb) {
				let dbJson = await idbGet(url);
				if (dbJson) {
					return isStale(dbJson.cachedAt, normalizeDeltaTime(options.maxAge)) ? false : 'idb';
				}
				if (options.indexedDb == 'only') return false;
			}
			let cache = await openCache();
			let response = await cache.match(url);
			if (!response) return false;
			if (options?.maxAge != null) {
				let cachedAt = +response.headers.get('cached-at') || 0;
				if (isStale(response.cachedAt, normalizeDeltaTime(options.maxAge))) {
					return false;
				}
			}
			return true;
		}



		export async function cachedJson(url: string, init: RequestInitExJson = {}): Promise<unknown> {
			if (init.indexedDb) {
				let dbJson = await idbGet(url);
				if (dbJson) {
					if (!isStale(dbJson.cachedAt, init.maxAge)) {
						ObjectExtension.defineValue(dbJson.data as any, 'cached', dbJson.cachedAt);
						return dbJson.data;
					}
				}
			}
			let response = await cached(url, init);
			let json = await response.json();
			if (!('cached' in json)) {
				ObjectExtension.defineValue(json, 'cached', response.cachedAt);
			}
			if (init.indexedDb) {
				idbPut(url, json, response.cachedAt);
			}
			return json;
		}


		let _idbInstancePromise: IDBDatabase | Promise<IDBDatabase> = null;
		let idbInstance: IDBDatabase = null;

		async function openIdb(): Promise<IDBDatabase> {
			if (idbInstance) return idbInstance;
			if (await _idbInstancePromise) {
				return idbInstance;
			}
			let irq = indexedDB.open('fetch');
			irq.onupgradeneeded = event => {
				let db = irq.result;
				let store = db.createObjectStore('fetch', { keyPath: 'url' });
			}
			_idbInstancePromise = new Promise((r, j) => {
				irq.onsuccess = r;
				irq.onerror = j;
			}).then(() => irq.result, () => null);
			idbInstance = _idbInstancePromise = await _idbInstancePromise;
			if (!idbInstance) throw new Error('Failed to open indexedDB');
			return idbInstance;
		}

		export async function idbClear() {
			throw new Error('TODO')
		}


		async function idbGet(url: string): Promise<{ url: string, data: unknown, cachedAt: number } | undefined> {
			let db = await openIdb();
			let t = db.transaction(['fetch'], 'readonly');
			let rq = t.objectStore('fetch').get(url);
			return new Promise(r => {
				rq.onsuccess = () => r(rq.result);
				rq.onerror = () => r(undefined);
			});
		}

		async function idbPut(url: string, data: unknown, cachedAt?: number): Promise<IDBValidKey | undefined> {
			let db = await openIdb();
			let t = db.transaction(['fetch'], 'readwrite');
			let rq = t.objectStore('fetch').put({ url, data, cachedAt: cachedAt ?? +new Date() });
			return new Promise(r => {
				rq.onsuccess = () => r(rq.result);
				rq.onerror = () => r(undefined);
			});
		}

		async function idbDelete(url: string): Promise<IDBValidKey | undefined> {
			let db = await openIdb();
			let t = db.transaction(['fetch'], 'readwrite');
			let rq = t.objectStore('fetch').delete(url);
			return new Promise(r => {
				rq.onsuccess = () => r(rq.result);
				rq.onerror = () => r(undefined);
			});
		}

	}

}