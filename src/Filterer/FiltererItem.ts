namespace PoopJs {
	export namespace EntryFiltererExtension {

		export class FiltererItem<Data> {
			id: string = "";
			name?: string;
			description?: string;
			threeWay: Wayness = false;
			mode: Mode = 'off';
			parent: EntryFilterer;
			button: HTMLButtonElement;
			incompatible?: string[];
			hidden = false;

			constructor(data: FiltererItemSource) {
				data.button ??= 'button.ef-item';
				Object.assign(this, data);

				this.button = elm(data.button,
					this.click.bind(this),
					this.contextmenu.bind(this),
				);
				this.parent.container.append(this.button);
				if (this.name) {
					this.button.append(this.name);
				}
				if (this.description) {
					this.button.title = this.description;
				}
				if (this.mode != 'off') {
					this.toggleMode(data.mode, true);
				}
				if (this.hidden) {
					this.hide();
				}
			}

			click(event: MouseEvent) {
				if (this.mode == 'off') {
					this.toggleMode('on');
					return;
				}
				if (event.target != this.button) return;
				if (this.mode == 'on') {
					this.toggleMode(this.threeWay ? 'opposite' : 'off');
				} else {
					this.toggleMode('off')
				}
			}

			contextmenu(event: MouseEvent) {
				event.preventDefault();
				if (this.mode != 'opposite') {
					this.toggleMode('opposite');
				} else {
					this.toggleMode('off');
				}
			}

			toggleMode(mode: Mode, force = false) {
				if (this.mode == mode && !force) return;
				this.mode = mode;
				this.button.setAttribute('ef-mode', mode);
				if (mode != 'off' && this.incompatible) {
					this.parent.offIncompatible(this.incompatible);
				}
				this.parent.requestUpdate();
			}

			remove() {
				this.button.remove();
				this.toggleMode('off');
			}

			show() {
				this.hidden = false;
				this.button.hidden = false;
			}
			hide() {
				this.hidden = true;
				this.button.hidden = true;
			}

		}

	}
}