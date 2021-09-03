namespace PoopJs {

	export namespace FetchExtension {
		export let defaults: RequestInit = { credentials: 'include' };

		export async function cached(url: string, init: RequestInit = {}): Promise<Response> {
			let cache = await caches.open('fetch');
			let response = await cache.match(url);
			if (response) {
				return response;
			}
			response = await fetch(url, { ...defaults, ...init });
			if (response.ok) {
				cache.put(url, response.clone());
			}
			return response;
		}

		// export async function cachedDoc(url: string): Promise<Document> {
		// 	let cache = await caches.open('fetch');
		// 	let response = await cache.match(url);
		// 	if (!response) {
		// 		response = await fetch(url, { credentials: 'include' });
		// 		await cache.put(url, response.clone());
		// 	}
		// 	return doc(url);
		// }

		export async function cachedDoc(url: string, init: RequestInit = {}): Promise<Document> {
			let response = await cached(url, init);
			let text = await response.text();
			let parser = new DOMParser();
			let doc = parser.parseFromString(text, 'text/html');
			let base = doc.createElement('base');
			base.href = url;
			doc.head.append(base);
			return doc;
		}

		export async function cachedJson(url: string, init: RequestInit = {}): Promise<unknown> {
			let response = await cached(url, init);
			return response.json();
		}

		export async function doc(url: string): Promise<Document> {
			let p = Promise.empty();
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
			return caches.delete('fetch');
		}
	}

}