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

		console.log("[WebSocket] Initializing connection");
		this.ws = new WebSocket(getRandomElement(constant.WEBSOCKET_URL));

		this.ws.on("open", () => {
			console.log("[WebSocket] Socket opened");
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
				console.error("[WebSocket]", error);
			}
		});

		this.ws.on("close", () => {
			console.log("[WebSocket] Socket closed");
			this.emit(API.Events.Close);
			variable.ws_connected = false;
			if (variable.ws_reconnect) setTimeout(this.#initWebSocket.bind(this), constant.API_WEBSOCKET_RETRY);
		});

		this.ws.on("error", (err) => {
			console.error("[WebSocket]", err);
		});
	}

	async getStations() {
		try {

			const ac = new AbortController();
			const abortTimer = setTimeout(() => ac.abort(), constant.API_HTTP_TIMEOUT);
			const res = await fetch("https://data.exptech.com.tw/file/resource/station.json", { signal: ac.signal });
			clearTimeout(abortTimer);

			if (!res.ok)
				throw new Error(`Failed to get station data. Server returned ${res.status}`);

			return await res.json();
		} catch (error) {
			throw new Error(`Failed to get station data. Request timed out after ${constant.API_HTTP_TIMEOUT}ms`);
		}
	}

	async getReports(limit = 50) {
		const res = await fetch("https://data.exptech.com.tw/api/v1/eq/report?" + new URLSearchParams({ limit }));

		if (!res.ok)
			throw new Error(`Failed to get reports. Server returned ${res.status}`);

		return await res.json();
	}

	async getReport(id) {
		const res = await fetch(`https://data.exptech.com.tw/api/v1/eq/report/${id}`);

		if (!res.ok)
			throw new Error(`Failed to get report ${id}. Server returned ${res.status}`);

		return await res.json();
	}
}