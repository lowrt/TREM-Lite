const WebSocket = require("ws");
const fetch = require("node-fetch");

const ServerVer = "4.2.0";

let WS = false;
let ws;
let Reconnect = 0;
let ServerT = 0;
let ServerTime = 0;

let IsGetData = false;
let Data = {};

let init_ = false;

_uuid();

function _uuid() {
	try {
		if (!localStorage.UUID) {
			const controller = new AbortController();
			setTimeout(() => {
				controller.abort();
			}, 2500);
			fetch("https://exptech.com.tw/api/v1/et/uuid", { signal: controller.signal })
				.then((ans) => ans.json())
				.then((ans) => {
					localStorage.UUID = ans;
					_main();
				})
				.catch((err) => {
					setTimeout(() => _uuid(), 3000);
				});
		} else
			_main();
	} catch (err) {
		console.log(err);
		setTimeout(() => _uuid(), 500);
	}
}

function _main() {
	try {
		const controller = new AbortController();
		setTimeout(() => {
			controller.abort();
		}, 2500);
		fetch("https://exptech.com.tw/api/v1/et/ntp", { signal: controller.signal })
			.then((ans) => ans.json())
			.then((ans) => {
				TimeNow(ans.time);
				_server_init();
			})
			.catch((err) => {
				setTimeout(() => _main(), 3000);
			});
	} catch (err) {
		console.log(err);
		setTimeout(() => _main(), 500);
	}
}

function _server_init() {
	if (init_) return;
	init_ = true;
	createWebSocket();
}

function close() {
	ws.close();
}

function reconnect() {
	if (Date.now() - Reconnect < 5000) return;
	Reconnect = Date.now();
	if (ws != null) {
		ws.close();
		ws = null;
	}
	createWebSocket();
}

function createWebSocket() {
	try {
		ws = new WebSocket("wss://exptech.com.tw/api");
		initEventHandle();
	} catch (e) {
		reconnect();
	}
}

function initEventHandle() {
	ws.onclose = function() {
		void 0;
	};
	ws.onerror = function(err) {
		console.log(err);
	};
	ws.onopen = function() {
		ws.send(JSON.stringify({
			uuid     : localStorage.UUID,
			function : "subscriptionService",
			value    : ["earthquake-v3", "rts-v2"],
			key      : "",
		}));
	};
	ws.onmessage = function(evt) {
		const json = JSON.parse(evt.data);
		if (json.response != undefined) {
			if (json.response == "Connection Succeeded") TimeNow(json.time);
		} else
		if (json.Function == "NTP") {
			if (!WS) $(".time").css("color", "white");
			WS = true;
			TimeNow(json.Full);
		} else {
			Data = json;
			IsGetData = true;
		}
	};
}

function TimeNow(now) {
	ServerT = Date.now();
	ServerTime = now;
}

setInterval(() => {
	if ((Date.now() - ServerT > 15_000 && ServerT != 0)) {
		WS = false;
		$(".time").css("color", "red");
		reconnect();
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

	if (Theta_A < 0) Theta_A = Theta_A + Math.PI;
	Theta_A = Math.PI - Theta_A;
	const Theta_B = Math.atan(-1 * Zc / (Xb - Xc));
	let Ptime = (1 / G) * Math.log(Math.tan((Theta_A / 2)) / Math.tan((Theta_B / 2)));
	const G0_ = G0 / 1.732;
	const G_ = G / 1.732;
	const Zc_ = -1 * (G0_ / G_);
	const Xc_ = (Math.pow(Xb, 2) - 2 * (G0_ / G_) * Za - Math.pow(Za, 2)) / (2 * Xb);
	let Theta_A_ = Math.atan((Za - Zc_) / Xc_);

	if (Theta_A_ < 0) Theta_A_ = Theta_A_ + Math.PI;
	Theta_A_ = Math.PI - Theta_A_;
	const Theta_B_ = Math.atan(-1 * Zc_ / (Xb - Xc_));
	let Stime = (1 / G_) * Math.log(Math.tan(Theta_A_ / 2) / Math.tan(Theta_B_ / 2));

	if (distance / Ptime > 7) Ptime = distance / 7;

	if (distance / Stime > 4) Stime = distance / 4;
	return { Ptime: Ptime, Stime: Stime };
}