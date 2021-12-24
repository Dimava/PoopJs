namespace PoopJs {

	export namespace FetchExtension {
		export type RequestInitEx = RequestInit & { maxAge?: number };
		export type RequestInitExJson = RequestInit & { maxAge?: number, indexedDb?: boolean };
		export let defaults: RequestInit = { credentials: 'include' };

		export let cache: Cache = null;
		async function openCache() {
			if (cache) return cache;
			cache = await caches.open('fetch');
			return cache;
		}

		function isStale(cachedAt: number, maxAge?: number) {
			if (maxAge == null) return false;
			return Date.now() - cachedAt >= maxAge;
		}

		export async function cached(url: string, init: RequestInitEx = {}): Promise<Response> {
			let cache = await openCache();
			let response = await cache.match(url);
			if (response) {
				response.cachedAt = +response.headers.get('cached-at') || 0;
				if (!isStale(response.cachedAt, init.maxAge))
					return response;
			}
			response = await fetch(url, { ...defaults, ...init });
			if (response.ok) {
				response.cachedAt = Date.now();
				let clone = response.clone();
				let init: ResponseInit = {
					status: clone.status, statusText: clone.statusText,
					headers: [['cached-at', `${response.cachedAt}`], ...clone.headers.entries()]
				};
				let resultResponse = new Response(clone.body, init);
				cache.put(url, resultResponse);
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
			let response = await fetch(url, { ...defaults, ...init });
			let text = await response.text();
			let parser = new DOMParser();
			let doc = parser.parseFromString(text, 'text/html');
			let base = doc.createElement('base');
			base.href = url;
			doc.head.append(base);
			doc.cachedAt = response.cachedAt;
			return doc;
		}

		export async function xmlDoc(url: string): Promise<Document> {
			let p = PromiseExtension.empty();
			let oReq = new XMLHttpRequest();
			oReq.onload = p.r;
			oReq.responseType = 'document';
			oReq.open("get", url, true);
			oReq.send();
			await p;
			return oReq.responseXML;
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
			return cache.delete(url);
		}

		export async function isCached(url: string, options: { maxAge?: number, indexedDb?: boolean | 'only' } = {}): Promise<boolean | 'idb'> {
			if (options.indexedDb) {
				let dbJson = await idbGet(url);
				if (dbJson) {
					return isStale(dbJson.cachedAt, options.maxAge) ? false : 'idb';
				}
				if (options.indexedDb == 'only') return false;
			}
			let cache = await openCache();
			let response = await cache.match(url);
			if (!response) return false;
			if (typeof options?.maxAge == 'number') {
				let cachedAt = +response.headers.get('cached-at') || 0;
				if (isStale(response.cachedAt, options.maxAge)) {
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

	}

}