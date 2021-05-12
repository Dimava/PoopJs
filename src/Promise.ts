

type UnwrappedPromise<T> = Promise<T> & {
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;
	r: (value: T | PromiseLike<T>) => void;
	j: (reason?: any) => void;
}

/**
 * Creates unwrapped promise
 */
export function empty<T>() {
	let resolve: (value: T) => void;
	let reject: (reason?: any) => void;
	let p = new Promise<T>((r, j) => {
		resolve = r;
		reject = j;
	}) as UnwrappedPromise<T>;
	p.resolve = p.r = resolve;
	p.reject = p.j = reject;
	return p;
}

export async function frame(n = 1): Promise<number> {
	while (--n > 0) {
		await new Promise(requestAnimationFrame);
	}
	return new Promise(requestAnimationFrame);
}
