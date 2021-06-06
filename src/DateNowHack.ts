namespace PoopJs {

	export namespace DateNowHack {
		

		export function DateNowHack(n = 5) {
			Date._now ??= Date.now;
			let _start = Date._now();
			let start = Date.now();
			Date.now = function() {
				return (this._now() - _start) * n + start;
			}

			Date.prototype._getTime ??= Date.prototype.getTime;
			let _gt_start = new Date()._getTime();
			let gt_start = new Date().getTime();
			Date.prototype.getTime = function() {
				return (this._getTime() - _gt_start) * n + gt_start;
			}

			console.log(`DateNowHack:`, n);

		}

	}


}