/// <reference path="./Promise.ts" />
namespace PoopJs {
	export namespace ArrayExtension {

		export async function pmap<T, V>(this: T[], mapper: (e: T, i: number, a: T[]) => Promise<V> | V, threads = 5): Promise<V[]> {
			if (!(threads > 0)) throw new Error();
			let tasks: [T, number, T[]][] = this.map((e, i, a) => [e, i, a]);
			let results = Array<V>(tasks.length);
			let anyResolved = PromiseExtension.empty();
			let freeThreads = threads;
			async function runTask(task: [T, number, T[]]): Promise<V> {
				try {
					return await mapper(...task);
				} catch (err) {
					return err;
				}
			}
			async function run(task) {
				freeThreads--;
				results[task[1]] = await runTask(task);
				freeThreads++;
				let oldAnyResolved = anyResolved;
				anyResolved = PromiseExtension.empty();
				oldAnyResolved.r(undefined);
			}
			for (let task of tasks) {
				if (freeThreads == 0) {
					await anyResolved;
				}
				run(task);
			}
			while (freeThreads < threads) {
				await anyResolved;
			}
			return results;
		}

		export function map<T = number>(this: ArrayConstructor, length: number, mapper: (number) => T = i => i) {
			return this(length).fill(0).map((e, i, a) => mapper(i));
		}

		export function vsort<T>(this: T[], mapper: (e: T, i: number, a: T[]) => number, sorter?: ((a: number, b: number, ae: T, be: T) => number) | -1): T[];
		export function vsort<T, V>(this: T[], mapper: (e: T, i: number, a: T[]) => V, sorter: ((a: V, b: V, ae: T, be: T) => number) | -1): T[];
		export function vsort<T>(this: T[], mapper: (e: T, i: number, a: T[]) => number, sorter: ((a: number, b: number, ae: T, be: T) => number) | -1 = (a, b) => a - b): T[] {
			let theSorter = typeof sorter == 'function' ? sorter : (a, b) => b - a;
			return this
				.map((e, i, a) => ({ e, v: mapper(e, i, a) }))
				.sort((a, b) => theSorter(a.v, b.v, a.e, b.e))
				.map(e => e.e);
		}

		// export interface PMapData<T, V> {
		// 	source: T[],
		// 	result: (V | undefined)[],
		// 	threads: number,
		// 	window: number,
		// 	completed: number,
		// 	length: number,
		// }

		// export function pmap_v2<T, V>(this: T[], mapper: (e: T, i: number, source: T[], data: PMapData<T, V>) => V, data: Partial<PMapData<T, V>>): Promise<V[]> {
		// 	data = data as PMapData<T, V>;
		// 	let source: T[] = this;
		// 	let result: (V | undefined)[] = source.map(e => );
		// 	let threads: number = data.threads;
		// 	let window: number;
		// 	let completed: number = 0;
		// 	let length: number = this.length;

		// 	data.
		// }

		type ResolveablePromise<T> = PromiseLike<T> & {
			resolve(value: T): void;
		}

		export interface PMapData<T, V, E = never> extends PromiseLike<(V | E)[]> {
			/** Original array */
			source: T[],
			/** Async element converter function */
			mapper: (e: T, i: number, a: T[], data: PMapData<T, V, E>) => Promise<V | E>,
			/** Max number of requests at once.   
			 *  *May* be changed in runtime */
			threads: number,
			/** Max distance between the olders incomplete and newest active elements.   
			 *  *May* be changed in runtime */
			window: number,

			/** Unfinished result array */
			result: (V | Error | undefined)[],
			/** Promises for every element */
			requests: UnwrappedPromise<V | E>[],

			beforeStart(e: T, i: number, a: T[], data: PMapData<T, V, E>): void;
			afterComplete(e: T, i: number, a: T[], data: PMapData<T, V, E>): void;

			/** Length of the array */
			length: number,
			/** The number of elements finished converting */
			completed: number,
			/** Threads currently working   
			 *  in the mapper function: including the current one */
			activeThreads: number,
			lastStarted: number;
		}

		const empty = PromiseExtension.empty;
		type UnwrappedPromise<T> = PromiseExtension.UnwrappedPromise<T>;

		export interface PMapSource<T, V, E = never> extends PromiseLike<V[]> {
			/** Original array */
			source: T[],
			/** Async element converter function */
			mapper: (e: T, i: number, a: T[], data: PMapData<T, V, E>) => Promise<V | E>,
			/** Array to write to */
			result?: (V | Error | undefined)[],
			/** Max number of requests at once.  
			 *  Default: 5
			 *  *May* be changed in runtime */
			threads: number,
			/** Max distance between the olders incomplete and newest active elements.   
			 *  Default: unlimited   
			 *  *May* be changed in runtime */
			window?: number,
		}

		function pmap2raw<T, V, E = never>(data: PMapData<T, V, E>): PMapData<T, V, E> {
			data.result ??= Array(data.source.length);
			data.requests = data.result.map(() => empty());
			data.threads ??= 5;
			data.window ??= Infinity;

			data.completed = 0;
			data.length = data.source.length;
			data.activeThreads = 0;
			data.lastStarted = 0;

			if (data.threads <= 0) throw new Error();

			let allDone = empty();
			data.then = allDone.then.bind(allDone) as any;

			let anyResolved = empty();
			async function runOne(i: number) {
				data.activeThreads++;
				data.beforeStart?.(data.source[i], i, data.source, data);
				data.lastStarted = i;
				let v: V | E = await data.mapper(data.source[i], i, data.source, data).catch(e => e);
				data.afterComplete?.(data.source[i], i, data.source, data);
				data.activeThreads--;
				anyResolved.resolve(null);
			}

			async function run() {
				for (let i = 0; i < data.length; i++) {
					while (data.activeThreads < data.threads) await anyResolved;
					anyResolved = empty();
					runOne(i);
				}
			}


			return data;
		}

	}

}