namespace PoopJs {
	export namespace EntryFiltererExtension {

		export class Modifier<Data> extends FiltererItem<Data> implements IModifier<Data> {
			declare modifier: ModifierFn<Data>;
			declare runOnNoChange?: boolean;

			constructor(data: ModifierSource<Data>) {
				data.button ??= 'button.ef-item.ef-modifier[ef-mode="off"]';
				super(data);
			}

			toggleMode(mode: Mode, force = false) {
				if (this.mode == mode && !force) return;
				this.parent.moveToTop(this);
				super.toggleMode(mode, force);
			}

			apply(data: Data, el: HTMLElement) {
				let oldMode: Mode | null = el.getAttribute(`ef-modifier-${this.id}-mode`) as (Mode | null);
				if (oldMode == this.mode && !this.runOnNoChange) return;
				this.modifier(data, el, this.mode, null);
				el.setAttribute(`ef-modifier-${this.id}-mode`, this.mode);
			}
		}

		export class Prefixer<Data> extends FiltererItem<Data> implements IModifier<Data> {
			declare target: selector | ((e: HTMLElement, data: Data, mode: Mode) => (HTMLElement | HTMLElement[]));
			declare prefix?: (data: Data, el: HTMLElement, mode: Mode) => string;
			declare postfix?: (data: Data, el: HTMLElement, mode: Mode) => string;
			declare prefixAttribute: string;
			declare postfixAttribute: string;
			declare all: boolean;

			constructor(data: PrefixerSource<Data>) {
				data.button ??= 'button.ef-item.ef-modifier[ef-mode="off"]';
				data.target ??= e => e;
				data.prefixAttribute ??= 'ef-prefix';
				data.postfixAttribute ??= 'ef-postfix';
				data.all ??= false;
				super(data);
			}

			apply(data: Data, el: HTMLElement) {
				let targets = this.getTargets(el, data);
				if (this.prefix) {
					if (this.mode == 'off') {
						targets.map(e => e.removeAttribute(this.prefixAttribute));
					} else {
						let value = this.prefix(data, el, this.mode);
						targets.map(e => e.setAttribute(this.prefixAttribute, value));
					}
				}
				if (this.postfix) {
					if (this.mode == 'off') {
						targets.map(e => e.removeAttribute(this.postfixAttribute));
					} else {
						let value = this.postfix(data, el, this.mode);
						targets.map(e => e.setAttribute(this.postfixAttribute, value));
					}
				}
			}

			getTargets(el: HTMLElement, data: Data): HTMLElement[] {
				if (typeof this.target == 'string') {
					if (this.all) return el.qq(this.target);
					return [el.q(this.target)];
				} else {
					let targets = this.target(el, data, this.mode);
					return Array.isArray(targets) ? targets : [targets];
				}
			}
		}

	}
}