

	// async function pmap(mapper, threads = 5) {
	// 	if (!(threads > 0)) throw new Error();
	// 	let tasks = this.map((e, i, a) => [e, i, a]);
	// 	let results = this.map(e => e);
	// 	let anyResolved = empty();
	// 	let freeThreads = threads;
	// 	async function runTask(task) {
	// 		try {
	// 			return await mapper(...task);
	// 		} catch (err) {
	// 			return err;
	// 		}
	// 	}
	// 	async function run(task) {
	// 		freeThreads--;
	// 		results[task[1]] = runTask(task);
	// 		freeThreads++;
	// 		let oldAnyResolved = anyResolved;
	// 		anyResolved = empty();
	// 		oldAnyResolved.r();
	// 	}
	// 	for (let task of tasks) {
	// 		if (freeThreads == 0) {
	// 			await anyResolved;
	// 		}
	// 		runTask(task);
	// 	}
	// 	while (freeThreads < threads) {
	// 		await anyResolved;
	// 	}
	// 	return results;
	// }


	// function map(length, mapper = i => i) {
	// 	return Array(length).fill(0).map((e, i, a) => mapper(i));
	// }

	// function vsort(mapper, sorter = (a, b) => a - b) {
	// 	if (sorter == -1) {
	// 		sorter = (a, b) => b - a;
	// 	}
	// 	return this
	// 		.map((e, i, a) => ({ e, v: mapper(e, i, a) }))
	// 		.sort((a, b) => sorter(a.v, b.v, a.e, b.e))
	// 		.map(e => e.e);
	// }
