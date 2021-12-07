namespace PoopJs {

	export namespace DateNowHack {

		export let speedMultiplier = 1;
		export let deltaOffset = 0;
		export let startRealtime = 0;
		export let startTime = 0;

		export function toFakeTime(time: number) {
			return Math.floor(
				(time - startRealtime) * speedMultiplier + startTime + deltaOffset
			);
		}

		export let bracketSpeeds = [0.05, 0.25, 1, 2, 5, 10, 20, 60, 120];
		export function speedhack(speed: number) {
			activate();
			speedMultiplier = speed;
			location.hash = speed + '';
		}
		export function timejump(seconds: number) {
			activate();
			deltaOffset += seconds * 1000;
		}
		export function switchSpeedhack(dir: number) {
			let currentIndex = bracketSpeeds.indexOf(speedMultiplier);
			if (currentIndex == -1) currentIndex = bracketSpeeds.indexOf(1);
			let newSpeed = bracketSpeeds[currentIndex + dir];
			if (newSpeed == undefined) return false;
			speedhack(newSpeed);
		}
		function onkeydown(event: KeyboardEvent) {
			if (event.code == 'BracketLeft') {
				switchSpeedhack(-1);
			}
			if (event.code == 'BracketRight') {
				switchSpeedhack(1);
			}
		}
		export function bindBrackets(mode = 'on') {
			removeEventListener('keydown', onkeydown);
			if (mode == 'on') {
				addEventListener('keydown', onkeydown);
			}
		}

		export let activated = false;
		function activate() {
			Date._now ??= Date.now;
			Date.prototype._getTime ??= Date.prototype.getTime;
			startTime = Date.now();
			startRealtime = Date._now();
			deltaOffset = 0;
			// console.log(Date.now(), )
			// debugger;
			Date.now = () => toFakeTime(Date._now());
			Date.prototype.getTime = function (this: Date & { _t?: number }) {
				return this._t ??= toFakeTime(this._getTime());
			}
			Date.prototype.valueOf = function (this: Date) {
				return this.getTime();
			}
			activated = true;
		}

	}


}