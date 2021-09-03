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

		export function vsort<T>(this: T[], mapper: (e: T, i: number, a: T[]) => number, sorter: ((a: number, b: number, ae: T, be: T) => number) | -1 = (a, b) => a - b) {
			let theSorter = typeof sorter == 'function' ? sorter : (a, b) => b - a;
			return this
				.map((e, i, a) => ({ e, v: mapper(e, i, a) }))
				.sort((a, b) => theSorter(a.v, b.v, a.e, b.e))
				.map(e => e.e);
		}

	}

}