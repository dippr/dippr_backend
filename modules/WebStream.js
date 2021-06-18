const Utils = include('$modules/Utils');

class WebStream {
	constructor({
		title,
		streamerID
	}) {
		this.id = Utils.makeID(7);
		this.streamerID = streamerID;
		this.title = String(title).slice(0, 30);
		this._streamKey = Utils.makeID(25);
		this.startDate = Date.now();
		this.lastActiveDate = Date.now();
		this.active = false;
	}

	setActive() {
		this.active = true;
		this.lastActiveDate = Date.now();
	}

	getStreamKey() {
		return String(this._streamKey);
	}

	matchStreamKey(value) {
		return this._streamKey === value;
	}

	sendable() {
		return {
			id: this.id,
			streamerID: this.streamerID,
			title: this.title
		};
	}
}

module.exports = WebStream;