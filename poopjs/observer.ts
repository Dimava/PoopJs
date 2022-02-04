namespace PoopJs {
	export class Observer {
		
	}
}

/*

function observeClassAdd(cls, cb) {
	let queued = false;
	async function run() {
		if (queued) return;
		queued = true;
		await Promise.frame();
		queued = false;
		cb();
	}
	new MutationObserver(list => {
		for (let mr of list) {
			if (mr.type == 'attributes' && mr.attributeName == 'class') {
				if (mr.target.classList.contains(cls)) {
					run();
				}
			}
			if (mr.type == 'childList') {
				for (let ch of mr.addedNodes) {
					if (ch.classList?.contains(cls)) {
						run();
					}
				}
			}
		}
	}).observe(document.body, {
		childList: true,
		attributes: true,
		subtree: true,
	});
}

*/