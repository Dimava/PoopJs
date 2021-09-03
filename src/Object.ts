namespace PoopJs {

	export namespace ObjectExtension {

		export function defineValue<T>(o: T, p: keyof T, value: any): T;
		export function defineValue<T>(o: T, fn: Function): T;
		export function defineValue<T>(o: T, p: keyof T | string | Function, value?: any): T {
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

		export function defineGetter<T>(o: T, p: keyof T, get: () => ValueOf<T>): T;
		export function defineGetter<T>(o: T, get: Function): T;
		export function defineGetter<T>(o: T, p: string | keyof T | Function, get?: any): T {
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

		export function map<T, V>(o: T, mapper: (v: ValueOf<T>, k: keyof T, o: T) => V): MappedObject<T,V> {
			let entries = Object.entries(o) as [keyof T, ValueOf<T>][];
			return Object.fromEntries(entries.map(([k,v]) => [k, mapper(v, k, o)])) as MappedObject<T,V>;
		}
	}

}