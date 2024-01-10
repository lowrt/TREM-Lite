const WebSocket = require("ws");
const EventEmitter = require("node:events");

class API extends EventEmitter {
	constructor(key) {
		super();
		this.key = key;

		this.#initWebSocket();
	}

	get key() {
		return this._key;
	}

	set key(val) {
		this._key = val;
	}

	/**
   * @typedef Events
   * @property {"eew"} Eew
   * @property {"info"} Info
   * @property {"ntp"} Ntp
   * @property {"report"} Report
   * @property {"rts"} Rts
   * @property {"verify"} Verify
   */

	/**
   * @enum {Events}
   */
	static Events = Object.freeze({
		Close  : "close",
		Eew    : "eew",
		Info   : "info",
		Ntp    : "ntp",
		Report : "report",
		Rts    : "rts",
		Verify : "verify",
	});

	#initWebSocket() {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.close();

		this.ws = new WebSocket(getRandomElement(constant.WEBSOCKET_URL));

		this.ws.on("open", () => {
			console.log("websocket open");
			this.ws.send(JSON.stringify(constant.WS_CONFIG));
		});
		this.ws.on("message", (raw) => {
			try {
				const data = JSON.parse(raw);

				if (data)
					switch (data.type) {
						case API.Events.Verify: {
							this.ws.send(JSON.stringify(constant.WS_CONFIG));
							break;
						}

						case API.Events.Info: {
							switch (data.data.code) {
								case 200:
									if (!data.data.list.length) {
										this.ws_reconnect = false;
										this.ws.close();
										break;
									}
									variable.ws_connected = true;
									variable.subscripted_list = data.data.list;
									break;
								case 503:
									setTimeout(() => this.ws.send(JSON.stringify(constant.WS_CONFIG)), constant.API_WEBSOCKET_VERIFY);
									break;
							}

							break;
						}

						case "data": {
							switch (data.data.type) {
								case "rts":
									this.emit(API.Events.Rts, data.data);
									break;
								case "eew":
									this.emit(API.Events.Eew, data.data);
									break;
							}

							break;
						}

						case "ntp": {
							this.emit(API.Events.Ntp, data);
							break;
						}
					}
			} catch (error) {
				console.error(error);
			}
		});

		this.ws.on("close", () => {
			this.emit(API.Events.Close);
			variable.ws_connected = false;
			if (variable.ws_reconnect) setTimeout(this.#initWebSocket(), constant.API_WEBSOCKET_RETRY);
		});

		this.ws.on("error", (err) => {
			console.log("websocket error ", err);
		});
	}

	async getReports(limit = 50) {

	}
}