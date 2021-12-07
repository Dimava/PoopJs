/// <reference path="./FiltererItem.ts" />

namespace PoopJs {
	export namespace EntryFiltererExtension {

		export class Filter<Data> extends FiltererItem<Data> implements IFilter<Data> {
			declare filter: FilterFn<Data>;

			constructor(data: FilterSource<Data>) {
				data.button ??= 'button.ef-item.ef-filter[ef-mode="off"]';
				super(data);
			}

			/** returns if item should be visible */
			apply(data: Data, el: HTMLElement): boolean {
				if (this.mode == 'off') return true;
				let value = this.filter(data, el, this.mode);
				let result = typeof value == "number" ? value > 0 : value;
				if (this.mode == 'on') return result;
				if (this.mode == 'opposite') return !result;
			}
		}

		export class ValueFilter<Data, V extends string | number> extends FiltererItem<Data> implements IFilter<Data> {
			declare filter: ValueFilterFn<Data, V>;
			input: HTMLInputElement;
			lastValue: V;

			constructor(data: ValueFilterSource<Data, V>) {
				data.button ??= 'button.ef-item.ef-filter[ef-mode="off"]';
				super(data);
				let type = typeof data.input == 'number' ? 'number' : 'text';
				let value = JSON.stringify(data.input);
				let input = `input[type=${type}][value=${value}]`;
				this.input = elm<'input'>(input,
					input => this.change(),
				).appendTo(this.button);
			}

			change() {
				let value = this.getValue();
				if (this.lastValue != value) {
					this.lastValue = value;
					this.parent.requestUpdate();
				}
			}

			/** returns if item should be visible */
			apply(data: Data, el: HTMLElement): boolean {
				if (this.mode == 'off') return true;
				let value = this.filter(this.getValue(), data, el);
				let result = typeof value == "number" ? value > 0 : value;
				if (this.mode == 'on') return result;
				if (this.mode == 'opposite') return !result;
			}

			getValue(): V {
				let value: V = (this.input.type == 'text' ? this.input.value : this.input.valueAsNumber) as V;
				return value;
			}
		}

		export class MatchFilter<Data> extends FiltererItem<Data> implements IFilter<Data> {
			declare value: (data: Data, el: HTMLElement) => string;
			input: HTMLInputElement;
			lastValue: string;
			matcher: (input: string) => boolean;

			constructor(data: MatchFilterSource<Data>) {
				data.button ??= 'button.ef-item.ef-filter[ef-mode="off"]';
				data.value ??= data => JSON.stringify(data);
				super(data);
				let value = !data.input ? '' : JSON.stringify(data.input);
				let input = `input[type=text}][value=${value}]`;
				this.input = elm<'input'>(input,
					input => this.change(),
				).appendTo(this.button);
			}

			change() {
				if (this.lastValue != this.input.value) {
					this.lastValue = this.input.value;
					this.matcher = this.generateMatcher(this.lastValue);
				}
			}

			apply(data: Data, el: HTMLElement): boolean {
				if (this.mode == 'off') return true;
				let result = this.matcher(this.value(data, el));
				return this.mode == 'on' ? result : !result;
			}

			// matcherCache: Map<string, ((input: string) => boolean)> = new Map();
			// getMatcher(source: string): (input: string) => boolean {
			// 	if (this.matcherCache.has(source)) {
			// 		return this.matcherCache.get(source);
			// 	}
			// 	let matcher = this.generateMatcher(source);
			// 	this.matcherCache.set(source, matcher);
			// 	return matcher;
			// }
			generateMatcher(source: string): ((input: string) => boolean) {
				source = source.trim();
				if (source.length == 0) return () => true;
				if (source.includes(' ')) {
					let parts = source.split(' ').map(e => this.generateMatcher(e));
					return (input) => parts.every(m => m(input));
				}
				if (source.startsWith('-')) {
					if (source.length < 3) return () => true;
					let base = this.generateMatcher(source.slice(1));
					return (input) => !base(input);
				}
				try {
					let flags = source.toLowerCase() == source ? 'i' : '';
					let regex = new RegExp(source, flags);
					return (input) => !!input.match(regex);
				} catch (e) { };
				return (input) => input.includes(source);
			}
		}

		type TagGetterFn<Data> = selector | ((data: Data, el: HTMLElement, mode: Mode) => (HTMLElement[] | string[]));
		export interface TagFilterSource<Data> extends FiltererItemSource {
			tags: TagGetterFn<Data>;
			input?: string;
			highightClass?: string;
		}
		type TagMatcher = { positive: boolean, matches: (s: string) => boolean };

		export class TagFilter<Data> extends FiltererItem<Data> implements IFilter<Data> {
			tags: TagGetterFn<Data>;
			input: HTMLInputElement;
			highightClass: string;

			lastValue: string = '';
			cachedMatcher: TagMatcher[];


			constructor(data: TagFilterSource<Data>) {
				data.button ??= 'button.ef-item.ef-filter[ef-mode="off"]';
				super(data);
				this.input = elm<'input'>(`input[type=text}]`,
					input => this.change(),
				).appendTo(this.button);
				this.input.value = data.input || '';
				this.tags = data.tags;
				this.cachedMatcher = [];

				this.highightClass = data.highightClass ?? 'ef-tag-highlisht';
			}

			apply(data: Data, el: HTMLElement): boolean {
				let tags = this.getTags(data, el);
				tags.map(tag => this.resetHighlight(tag));

				let results = this.cachedMatcher.map(m => {
					let r = { positive: m.positive, count: 0 };
					for (let tag of tags) {
						let str = typeof tag == 'string' ? tag : tag.innerText;
						let val = m.matches(str);
						if (val) {
							r.count++;
							this.highlightTag(tag, m.positive);
						}
					}
					return r;
				});
				return results.every(r => r.positive ? r.count > 0 : r.count == 0);
			}
			resetHighlight(tag: string | HTMLElement) {
				if (typeof tag == 'string') return;
				tag.classList.remove(this.highightClass);
			}
			highlightTag(tag: string | HTMLElement, positive: boolean) {
				if (typeof tag == 'string') return;
				// FIXME
				tag.classList.add(this.highightClass);
			}

			getTags(data: Data, el: HTMLElement): HTMLElement[] | string[] {
				if (typeof this.tags == 'string') return el.qq<HTMLElement>(this.tags);
				return this.tags(data, el, this.mode);
			}
			getTagStrings(data: Data, el: HTMLElement): string[] {
				let tags = this.getTags(data, el);
				if (typeof tags[0] == 'string') return tags as string[];
				return tags.map((e) => e.innerText);
			}

			change() {
				if (this.lastValue == this.input.value) return;
				this.lastValue = this.input.value;
				this.cachedMatcher = this.parseMatcher(this.lastValue);
				this.parent.requestUpdate();
			}

			parseMatcher(matcher: string): TagMatcher[] {
				matcher.trim();
				if (!matcher) return [];

				if (matcher.includes(' ')) {
					let parts = matcher.match(/"[^"]*"|\S+/g) || [];
					return parts.flatMap(e => this.parseMatcher(e));
				}
				if (matcher.startsWith('-')) {
					let parts = this.parseMatcher(matcher.slice(1));
					return parts.map(e => ({ positive: !e.positive, matches: e.matches }));
				}
				if (matcher.match(/"^[^"]*"$/)) {
					matcher = matcher.slice(1, -1);
					return [{ positive: true, matches: tag => tag == matcher }];
				}
				if (matcher.length < 3) return [];
				if (matcher.match(/"/)?.length == 1) return [];
				try {
					let g = new RegExp(matcher, 'i');
					return [{ positive: true, matches: tag => !!tag.match(g) }];
				} catch (e) { }
				return [{ positive: true, matches: tag => tag.includes(matcher) }];
			}

		}

	}
}
