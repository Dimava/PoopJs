export async function cached(url: string): Promise<Response> {
	let cache = await caches.open('fetch');
	let response = await cache.match(url);
	if (response) {
		return response;
	}
	response = await fetch(url, { credentials: 'include' });
	cache.put(url, response.clone());
	return response;
}

export async function cachedDoc(url: string): Promise<Document> {
	let response = await cached(url);
	let text = await response.text();
	let parser = new DOMParser();
	return parser.parseFromString(text, 'text/html');
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
