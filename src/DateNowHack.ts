namespace PoopJs {

	export namespace DateNowHack {

		export let speedMultiplier = 1;
		export let deltaOffset = 0;
		export let startRealtime = 0;
		export let startTime = 0;

		// export let speedMultiplier = 1;
		export let performanceDeltaOffset = 0;
		export let performanceStartRealtime = 0;
		export let performanceStartTime = 0;

		export let usedMethods = {
			date: true,
			performance: true,
		}

		export function toFakeTime(realtime: number) {
			if (!usedMethods.date) return realtime;
			return Math.floor(
				(realtime - startRealtime) * speedMultiplier + startTime + deltaOffset
			);
		}
		export function toPerformanceFakeTime(realtime: number) {
			if (!usedMethods.performance) return realtime;
			return (realtime - performanceStartRealtime) * speedMultiplier
				+ performanceStartTime + performanceDeltaOffset;
		}

		export let bracketSpeeds = [0.05, 0.25, 1, 2, 5, 10, 20, 60, 120];
		export function speedhack(speed: number = 1) {
			if (typeof speed != 'number') {
				throw new Error(`DateNowHack: invalid speed: ${speed}`);
			}
			activate();
			activatePerformance();
			speedMultiplier = speed;
			location.hash = speed + '';
		}
		export function timejump(seconds: number) {
			activate();
			activatePerformance();
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
		export let performanceActivated = false;
		function activatePerformance() {
			performance._now ??= performance.now;
			performanceStartTime = performance.now();
			performanceStartRealtime = performance._now();
			performanceDeltaOffset = 0;
			performance.now = () => toPerformanceFakeTime(performance._now());
			performanceActivated = true;
		}

	}


}