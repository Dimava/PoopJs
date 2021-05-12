export function defineValue<T>(o: T, p: string, value: any): T & {};
export function defineValue<T>(o: T, fn: Function): T & {};
export function defineValue<T>(o: T, p: string | Function, value?: any): T & {} {
	if (typeof p == 'function') {
		[p, value] = [p.name, p] as [string, Function];
	}
	Object.defineProperty(o, p, {
		value,
		configurable: true,
		enumerable: false,
		writable: true,
	});
	return o;
}


export function defineGetter<T>(o: T, p: string, get: any): T & {};
export function defineGetter<T>(o: T, fn: Function): T & {};
export function defineGetter<T>(o: T, p: string | Function, get?: any): T & {} {
	if (typeof p == 'function') {
		[p, get] = [p.name, p] as [string, Function];
	}
	Object.defineProperty(o, p, {
		get,
		configurable: true,
		enumerable: false,
	});
	return o;
}
