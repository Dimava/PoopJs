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

		export function at<T>(this: T[], index: number): T {
			return index >= 0 ? this[index] : this[this.length + index];
		}

		export function findLast<T, S extends T>(this: T[], predicate: (this: void, value: T, index: number, obj: T[]) => value is S, thisArg?: any): S | undefined;
		export function findLast<T>(predicate: (this: T[], value: T, index: number, obj: T[]) => unknown, thisArg?: any): T | undefined;
		export function findLast<T, S extends T>(this: T[], predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): T | S | undefined {
			for (let i = this.length - 1; i >= 0; i--) {
				if (predicate(this[i], i, this)) return this[i];
			}
		}


		export class PMap<T, V, E = never> {
			/** Original array */
			source: T[] = [];
			/** Async element converter function */
			mapper: (e: T, i: number, a: T[], pmap: PMap<T, V, E>) => Promise<V | E> = (e: T) => e as any as Promise<V>;
			/** Max number of requests at once.   
			 *  *May* be changed in runtime */
			threads: number = 5;
			/** Max distance between the olders incomplete and newest active elements.   
			 *  *May* be changed in runtime */
			window: number = Infinity;

			/** Unfinished result array */
			results: (V | E | undefined)[] = [];
			/** Promises for every element */
			requests: Deferred<V | E>[] = [];

			beforeStart: (data: {
				e: T, i: number, a: T[], v?: V | E, r: (V | E)[], pmap: PMap<T, V, E>
			}) => Promise<void> | void = () => { };
			afterComplete: (data: {
				e: T, i: number, a: T[], v: V | E, r: (V | E)[], pmap: PMap<T, V, E>
			}) => Promise<void> | void = () => { };

			/** Length of the array */
			length: number = -1;
			/** The number of elements finished converting */
			completed: number = -1;
			/** Threads currently working   
			 *  in the mapper function: including the current one */
			activeThreads: number = -1;
			lastStarted: number = -1;

			allTasksDone: Deferred<(V | E)[]> & { pmap: PMap<T, V, E> };
			anyTaskResolved: Deferred<void>;

			constructor(source: Partial<PMap<T, V, E>>) {
				this.allTasksDone = Object.assign(this.emptyResult<(V | E)[]>(), { pmap: this });
				this.anyTaskResolved = this.emptyResult();
				for (let k of Object.keys(this) as (keyof PMap<T, V, E>)[]) {
					if (typeof source[k] == typeof this[k]) {
						this[k] = source[k] as any;
					} else if (source[k]) {
						throw new Error(`PMap: invalid constructor parameter: property ${k}: expected ${typeof this[k]}, but got ${typeof source[k]}`);
					}
				}
			}

			async startTask(arrayIndex: number) {
				this.activeThreads++;
				let e = this.source[arrayIndex];
				await this.beforeStart({
					e: this.source[arrayIndex],
					i: arrayIndex,
					a: this.source,
					v: undefined,
					r: this.results,
					pmap: this,
				});
				this.lastStarted = arrayIndex;
				let v: V | E;
				try {
					v = await this.mapper(this.source[arrayIndex], arrayIndex, this.source, this);
				} catch (e) {
					v = e as E;
				}
				this.results[arrayIndex] = v;
				this.requests[arrayIndex].resolve(v);
				this.completed++;
				await this.afterComplete({
					e: this.source[arrayIndex],
					i: arrayIndex,
					a: this.source,
					v: v,
					r: this.results,
					pmap: this,
				});
				this.activeThreads--;
				this.anyTaskResolved.resolve();
			}
			async run_internal() {
				for (let arrayIndex = 0; arrayIndex < this.length; arrayIndex++) {
					while (this.activeThreads >= this.threads) {
						await this.anyTaskResolved;
						this.anyTaskResolved = this.emptyResult();
					}

					await this.requests[arrayIndex - this.window];
					this.startTask(arrayIndex);
				}
				while (this.activeThreads > 0) {
					await this.anyTaskResolved;
					this.anyTaskResolved = this.emptyResult();
				}
				this.allTasksDone.resolve(this.results as (V | E)[]);
				return this.allTasksDone;
			}
			run() {
				this.prepare();
				this.run_internal();
				return this.allTasksDone;
			}

			pause() {
				if (this.activeThreads < this.length + this.threads)
					this.activeThreads += this.length + this.threads;
			}
			unpause() {
				if (this.activeThreads >= this.length + this.threads)
					this.activeThreads -= this.length + this.threads;
				this.anyTaskResolved.r();
			}
			cancel() {
				this.mapper = (() => { }) as any;
				this.beforeStart = () => { };
				this.afterComplete = () => { };
			}

			prepare() {
				if (this.length == -1) this.length = this.source.length;
				if (this.results.length == 0) {
					this.results = Array(this.length);
				}
				if (this.requests.length == 0) {
					this.requests = this.source.map(e => this.emptyResult());
				}
				if (this.completed < 0) this.completed = 0;
				if (this.activeThreads < 0) this.activeThreads = 0;
				if (this.lastStarted < -1) this.lastStarted = -1;
				this.anyTaskResolved = this.emptyResult();
				Object.assign(this.allTasksDone, { pmap: this });
				return this;
			}

			emptyResult<T = V | E>(): Deferred<T> {
				let resolve!: (value: T) => void;
				let reject!: (reason?: any) => void;
				let p = new Promise<T>((r, j) => {
					resolve = r;
					reject = j;
				});
				return Object.assign(p, { resolve, reject, r: resolve, j: reject });
			}

			static this_pmap<T, V, E = never>(this: T[], mapper: PMap<T, V, E>['mapper'], options: Partial<PMap<T, V, E>> | number | true = {}) {
				if (options == true) options = Infinity;
				if (typeof options == 'number') options = { threads: options };
				let pmap = new PMap({ source: this, mapper, ...options });
				return pmap.run();
			}
			static pmap<T, V, E = never>(array: T[], mapper: PMap<T, V, E>['mapper'], options: Partial<PMap<T, V, E>> | number | true = {}) {
				if (options == true) options = Infinity;
				if (typeof options == 'number') options = { threads: options };
				let pmap = new PMap({ source: array, mapper, ...options });
				return pmap.run();
			}
		}

	}

}