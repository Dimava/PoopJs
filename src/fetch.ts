namespace PoopJs {

	export namespace FetchExtension {
		export type RequestInitEx = RequestInit & { maxAge?: number };
		export let defaults: RequestInit = { credentials: 'include' };

		export let cache: Cache = null;
		async function openCache() {
			if (cache) return cache;
			cache = await caches.open('fetch');
			return cache;
		}

		export async function cached(url: string, init: RequestInitEx = {}): Promise<Response> {
			let cache = await openCache();
			let response = await cache.match(url);
			if (response) {
				response.cachedAt = +response.headers.get('cached-at') || 0;
				if (init.maxAge == null || Date.now() - response.cachedAt < init.maxAge)
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

		export async function cachedJson(url: string, init: RequestInitEx = {}): Promise<unknown> {
			let response = await cached(url, init);
			let json = await response.json();
			if (!('cached' in json)) {
				ObjectExtension.defineValue(json, 'cached', response.cachedAt);
			}
			return json;
		}

		export async function doc(url: string): Promise<Document> {
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
	}

}