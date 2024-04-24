/* eslint-disable no-undef */
const {
	NOTIFICATION_RECEIVED,
	NOTIFICATION_SERVICE_STARTED,
	START_NOTIFICATION_SERVICE,
} = require("electron-fcm-push-receiver/src/constants");

let WS = false;
let FCM = false;
let ws;
let ServerT = 0;
let Reconnect = 0;
let disconnect_info = 0;
let init_ = false;
let sleep_state = false;
let time_ntp = 0;
let time_local = 0;
let last_get_data_time = Date.now();

let rts_clock = null;

function _server_init() {
	if (init_) {
		return;
	}
	init_ = true;
	createWebSocket();
}

function close() {
	ws.close();
}

function reconnect() {
	if (now_time() - Reconnect < 5000) {
		return;
	}
	Reconnect = now_time();
	if (ws != null) {
		ws.close();
		ws = null;
	}
	createWebSocket();
}

function createWebSocket() {
	try {
		ws = new WebSocket("wss://lb-4.exptech.com.tw/websocket");
		initEventHandle();
	} catch (e) {
		reconnect();
	}
}

function sleep(_state = null) {
	if (!WS) {
		return;
	}
	if (_state != null) {
		if (_state == sleep_state) {
			return;
		}
		sleep_state = _state;
		if (sleep_state) {
			plugin.emit("trem.core.sleep");
			setTimeout(() => document.getElementById("status").textContent = "💤 睡眠模式", 1000);
		} else {
			plugin.emit("trem.core.awake");
		}
	}
	if (!_state) {
		last_get_data_time = Date.now();
	}
	ws.send(JSON.stringify({
		uuid     : localStorage.UUID,
		function : "subscriptionService",
		value    : ["trem-rts-v2", "trem-eew-v1", "report-trem-v1", "eew-v1", "report-v1"],
		key      : storage.getItem("key") ?? "",
		addition : { "trem-rts-v2": { sleep: (_state == null) ? sleep_state : _state } },
	}));
}

function initEventHandle() {
	ws.onclose = () => {
		void 0;
	};
	ws.onerror = () => {
		void 0;
	};
	ws.onopen = () => {
		const config = {
			type : "start",
			service : ["trem.rts", "trem.eew", "websocket.eew", "websocket.report"],
			key : storage.getItem("key") ?? "",
			// addition : { "trem-rts-v2": { sleep: !win.isVisible() } },
		};
		console.log(config)
		ws.send(JSON.stringify(config));
		// sleep_state = config.addition["trem-rts-v2"].sleep;
		plugin.emit("trem.core.websocket-connect");
		if (!FCM) {
			ipcRenderer.send(START_NOTIFICATION_SERVICE, "583094702393");
		}
	};
	ws.onmessage = (evt) => {
		if (!WS) {
			time.style.color = "white";
		}
		WS = true;
		ServerT = now_time();
		const json = JSON.parse(evt.data);
		if (json.type != "data" && json.type != "ntp") {
			console.log(json)
		}
		if (json.type == "info" && json.data.message == "Subscription Succeeded") {
			if (rts_clock) {
				clearInterval(rts_clock);
				rts_clock = null;
			}
		} else if (json.type == "data" && json.data.type == "rts") {
			get_data({
				type : "trem-rts",
				raw  : json.data.data,
			});
		} else if (json.type == "ntp") {
			time_ntp = json.time;
			time_local = Date.now();
		} else if (json.response == undefined) {
			get_data(json);
		}
	};
}

async function fetchDataWithRetry(url, maxRetries = 3, delay = 1000) {
	for (let i = 0; i < maxRetries; i++) {
		try {
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), delay);
			const res = await fetch(url, { signal: controller.signal });
			clearTimeout(timer);
			if (res.ok) {
				return await res.json();
			} else {
				throw new Error("Server error");
			}
		} catch (err) {
			if (i === maxRetries - 1) {
				throw err;
			}
			await new Promise(res => setTimeout(res, delay));
			delay *= 2;
		}
	}
}

function Now() {
	return new Date(time_ntp + (Date.now() - time_local));
}

setInterval(() => {
	if (now_time() - ServerT > 15_000) {
		plugin.emit("trem.core.websocket-disconnect");
		WS = false;
		time.style.color = "red";
		reconnect();
		if (now_time() - disconnect_info > 60_000) {
			disconnect_info = now_time();
			add_info("fa-solid fa-satellite-dish fa-2x info_icon", "#FF0000", "網路異常", "#00BB00", "客戶端無法與伺服器建立連線<br>請檢查網路狀態或稍後重試", 30000);
		}
	}
}, 3000);

function _speed(depth, distance) {
	const Za = 1 * depth;
	let G0, G;
	const Xb = distance;
	if (depth <= 40) {
		G0 = 5.10298;
		G = 0.06659;
	} else {
		G0 = 7.804799;
		G = 0.004573;
	}
	const Zc = -1 * (G0 / G);
	const Xc = (Math.pow(Xb, 2) - 2 * (G0 / G) * Za - Math.pow(Za, 2)) / (2 * Xb);
	let Theta_A = Math.atan((Za - Zc) / Xc);
	if (Theta_A < 0) {
		Theta_A = Theta_A + Math.PI;
	}
	Theta_A = Math.PI - Theta_A;
	const Theta_B = Math.atan(-1 * Zc / (Xb - Xc));
	let Ptime = (1 / G) * Math.log(Math.tan((Theta_A / 2)) / Math.tan((Theta_B / 2)));
	const G0_ = G0 / 1.732;
	const G_ = G / 1.732;
	const Zc_ = -1 * (G0_ / G_);
	const Xc_ = (Math.pow(Xb, 2) - 2 * (G0_ / G_) * Za - Math.pow(Za, 2)) / (2 * Xb);
	let Theta_A_ = Math.atan((Za - Zc_) / Xc_);
	if (Theta_A_ < 0) {
		Theta_A_ = Theta_A_ + Math.PI;
	}
	Theta_A_ = Math.PI - Theta_A_;
	const Theta_B_ = Math.atan(-1 * Zc_ / (Xb - Xc_));
	let Stime = (1 / G_) * Math.log(Math.tan(Theta_A_ / 2) / Math.tan(Theta_B_ / 2));
	if (distance / Ptime > 7) {
		Ptime = distance / 7;
	}
	if (distance / Stime > 4) {
		Stime = distance / 4;
	}
	return { Ptime: Ptime, Stime: Stime };
}

ipcRenderer.on(NOTIFICATION_SERVICE_STARTED, (_, token) => {
	FCM = true;
	localStorage.UUID = token;
});

ipcRenderer.on(NOTIFICATION_RECEIVED, (_, Notification) => {
	FCM = true;
	if (Notification.data.Data != undefined) {
		get_data(JSON.parse(Notification.data.Data), "fcm");
	}
});