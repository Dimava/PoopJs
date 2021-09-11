namespace PoopJs {

	export namespace PaginateExtension {

		export type PRequestEvent = CustomEvent<{
			reason?: Event,
			count: number,
			consumed: number;
			_event?: 'paginationrequest',
		}>;
		export type PStartEvent = CustomEvent<{
			paginate: Paginate,
			_event?: 'paginationstart',
		}>;
		export type PEndEvent = CustomEvent<{
			paginate: Paginate,
			_event?: 'paginationend',
		}>;
		export type PModifyEvent = CustomEvent<{
			paginate: Paginate,
			added: HTMLElement[],
			removed: HTMLElement[],
			selector: selector,
			_event?: 'paginationmodify',
		}>;

		export class Paginate {
			doc: Document;

			enabled = true;
			condition: selector | (() => boolean);
			queued = 0;
			running = false;
			_inited = false;

			static shiftRequestCount = 10;
			static _inited = false;
			static removeDefaultRunBindings: () => void;
			static addDefaultRunBindings() {
				Paginate.removeDefaultRunBindings?.();
				function onmousedown(event: MouseEvent) {
					if (event.button != 1) return;
					let target = event.target as Element;
					if (target?.closest('a')) return;
					event.preventDefault();
					let count = event.shiftKey ? Paginate.shiftRequestCount : 1;
					Paginate.requestPagination(count, event, target);
				}
				function onkeydown(event: KeyboardEvent) {
					if (event.code != 'AltRight') return;
					event.preventDefault();
					let count = event.shiftKey ? Paginate.shiftRequestCount : 1;
					let target = event.target as Element;
					Paginate.requestPagination(count, event, target);
				}
				document.addEventListener('mousedown', onmousedown);
				document.addEventListener('keydown', onkeydown);
				Paginate.removeDefaultRunBindings = () => {
					document.removeEventListener('mousedown', onmousedown);
					document.removeEventListener('keydown', onkeydown);
				}
			}


			// listeners
			init() {
				if (!Paginate.removeDefaultRunBindings) {
					Paginate.addDefaultRunBindings();
				}
				if (this._inited) return;
				document.addEventListener<PRequestEvent>('paginationrequest', this.onPaginationRequest.bind(this));
				document.addEventListener<PEndEvent>('paginationend', this.onPaginationEnd.bind(this));
			}
			onPaginationRequest(event: PRequestEvent) {
				if (this.canConsumeRequest()) {
					event.detail.consumed++;
					this.queued += event.detail.count;
				}
				if (!this.running && this.queued) {
					this.consumeRequest();
				}
			};
			onPaginationEnd(event: PEndEvent) {
				if (this.queued && this.canConsumeRequest()) {
					requestAnimationFrame(() => {
						if (!this.canConsumeRequest()) {
							console.warn(`this paginate can not work anymore`);
							this.queued = 0;
						} else {
							this.consumeRequest();
						}
					});
				}
			}
			canConsumeRequest() {
				if (!this.enabled) return false;
				if (this.running) return true;
				if (this.condition) {
					if (typeof this.condition == 'function') {
						if (!this.condition()) return false;
					} else {
						if (!document.q(this.condition)) return false;
					}
				}
				return true;
			}
			async consumeRequest() {
				if (this.running) return;
				this.queued--;
				this.running = true;
				this.emitStart();
				await this.onrun?.();
				this.running = false;
				this.emitEnd();
			}
			onrun: () => Promise<void>;


			// emitters
			static requestPagination(count = 1, reason?: Event, target: Element = document.body) {
				let detail: PRequestEvent['detail'] = { count, reason, consumed: 0 };
				function fail(event: PRequestEvent) {
					if (event.detail.consumed == 0) {
						console.warn(`Pagination request failed: no listeners`);
					}
					removeEventListener('paginationrequest', fail);
				}
				addEventListener('paginationrequest', fail);
				target.emit<PRequestEvent>('paginationrequest', { count, reason, consumed: 0 });
			}
			emitStart() {
				document.body.emit<PStartEvent>('paginationstart', { paginate: this });
			}
			emitModify(added, removed, selector) {
				document.body.emit<PModifyEvent>('paginationmodify', { paginate: this, added, removed, selector });
			}
			emitEnd() {
				document.body.emit<PEndEvent>('paginationend', { paginate: this });
			}


			// fetching: 
			async fetchDocument(link: Link, spinner = true): Promise<Document> {
				this.doc = null;
				let a = spinner && Paginate.linkToAnchor(link);
				a?.classList.add('paginate-spin');
				link = Paginate.linkToUrl(link);
				this.doc = await fetch.doc(link);
				a?.classList.remove('paginate-spin');
				return this.doc;
			}
			async fetchCachedDocument(link: Link, spinner = true): Promise<Document> {
				this.doc = null;
				let a = spinner && Paginate.linkToAnchor(link);
				a?.classList.add('paginate-spin');
				link = Paginate.linkToUrl(link);
				this.doc = await fetch.cached.doc(link);
				a?.classList.remove('paginate-spin');
				return this.doc;
			}
			prefetch(source: selector) {
				document.qq<'a'>(source).map(e => {
					if (e.href) {
						elm(`link[rel="prefetch"][href="${e.href}"]`).appendTo('head');
					}
					// TODO: if e.src
				});
			}


			// modification: 
			after(source: selector, target: selector = source) {
				let added = this.doc.qq(source);
				if (!added.length) return;
				let found = document.qq(target);
				if (found.length == 0) throw new Error(`failed to find where to append`);
				found.pop().after(...added);
				this.emitModify(added, [], source);
			}
			replaceEach(source: selector, target: selector = source) {
				let added = this.doc.qq(source);
				let removed = document.qq(target);
				if (added.length != removed.length) throw new Error(`added/removed count mismatch`);
				removed.map((e, i) => e.replaceWith(added[i]));
				this.emitModify(added, removed, source);
			}
			replace(source: selector, target: selector = source) {
				let added = this.doc.qq(source);
				let removed = document.qq(target);
				if (added.length != removed.length) throw new Error(`not implemented`);
				return this.replaceEach(source, target);
			}


			// util
			static linkToUrl(link: Link): url {
				if (typeof link == 'string') {
					if (link.startsWith('http')) return link as url;
					link = document.q<'a'>(link);
				}
				return (link as HTMLAnchorElement).href as url;
			}
			static linkToAnchor(link: Link): HTMLAnchorElement {
				if (typeof link == 'string') {
					if (link.startsWith('http')) return null;
					return document.q<'a'>(link);
				}
				return link;
			}

			static staticCall<T>(data: {
				condition?: selector | (() => boolean),
				prefetch?: selector | selector[],
				click?: selector | selector[],
				doc?: selector | selector[],
				after?: selector | selector[],
				replace?: selector | selector[],
				start?: () => void;
				end?: () => void;
			}) {
				let p = new Paginate();
				p.staticCall(data);
				return p;
			}

			staticCall(data: {
				condition?: selector | (() => boolean),
				prefetch?: selector | selector[],
				click?: selector | selector[],
				doc?: selector | selector[],
				after?: selector | selector[],
				replace?: selector | selector[],
				start?: () => void;
				end?: () => void;
			}) {
				function toArray<T>(v?: T | T[] | undefined): T[] {
					if (Array.isArray(v)) return v;
					if (v == null) return [];
					return [v];
				}
				function toCondition(s?: selector | (() => boolean) | undefined): () => boolean {
					if (!s) return () => true;
					if (typeof s == 'string') return () => !!document.q(s);
					return s;
				}
				function canFind(a: selector[]) {
					if (a.length == 0) return true;
					return a.some(s => !!document.q(s));
				}
				function findOne(a: selector[]) {
					return a.find(s => document.q(s));
				}
				let fixedData = {
					condition: toCondition(data.condition),
					prefetch: toArray(data.prefetch)
						.flatMap(e => toArray(data[e] ?? e)),
					doc: toArray(data.doc),
					click: toArray(data.click),
					after: toArray(data.after),
					replace: toArray(data.replace),
				};
				this.condition = () => {
					if (!fixedData.condition()) return false;
					if (!canFind(fixedData.doc)) return false;
					if (!canFind(fixedData.click)) return false;
					return true;
				};
				this.init();
				if (fixedData.condition()) {
					fixedData.prefetch.map(s => this.prefetch(s));
				}
				this.onrun = async () => {
					// if (!fixedData.condition()) return;
					await data.start?.();
					fixedData.click.map(e => document.q(e)?.click());
					let doc = findOne(fixedData.doc);
					if (doc) await this.fetchDocument(doc);
					fixedData.after.map(s => this.after(s));
					fixedData.replace.map(s => this.replace(s));
					await data.end?.();
				}
			}


		}
		type SelOrEl = selector | HTMLElement;
		type Somehow<T> = null | T | T[] | (() => (null | T | T[]));
		type SomehowAsync<T> = null | T | T[] | (() => (null | T | T[] | Promise<null | T | T[]>));

		export const paginate = Object.setPrototypeOf(Paginate.staticCall.bind(Paginate), new Paginate());
	}

	export const paginate = PaginateExtension.paginate;

}