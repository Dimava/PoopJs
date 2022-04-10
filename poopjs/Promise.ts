namespace PoopJs {

	export interface Deferred<T = void> extends Promise<T> {
		resolve(value: T | PromiseLike<T>): void;
		reject: (reason?: any) => void;

		r(value)
		r(value: T | PromiseLike<T>): void;
		j: (reason?: any) => void;

		// PromiseState: 'pending' | 'fulfilled' | 'rejected';
		// PromiseResult?: T | Error;
	}

	export namespace PromiseExtension {

		/**
		 * Creates unwrapped promise
		 */
		export function empty<T = void>(): Deferred<T> {
			let resolve: (value: T) => void;
			let reject: (reason?: any) => void;
			return Object.assign(new Promise<T>((r, j) => {
				resolve = r;
				reject = j;
			}), {
				resolve, reject,
				r: resolve, j: reject,
			});
		}

		export async function frame(n = 1): Promise<number> {
			while (--n > 0) {
				await new Promise(requestAnimationFrame);
			}
			return new Promise(requestAnimationFrame);
		}
	}

}
