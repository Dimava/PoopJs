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

	}
}
