/* eslint-disable no-undef */
const Ver = "1.0.4";

let core_WS = false;
let core_ws;
let core_Reconnect = 0;
let core_ServerT = 0;
let core_ServerTime = 0;
let core_pcMap = {};
let core_ps = {};
let core_br = {};
let core_cs = {};
const core_clock = {};
let core_feedback_timestamp = 0;

const service_status = {
	websocket: {
		status: false,
	},
	p2p: {
		status     : false,
		upstream   : 0,
		downstream : 0,
	},
};
const raw_data = [];
let ready = false;

function md5cycle(x, k) {
	let a = x[0], b = x[1], c = x[2], d = x[3];
	a = ff(a, b, c, d, k[0], 7, -680876936);
	d = ff(d, a, b, c, k[1], 12, -389564586);
	c = ff(c, d, a, b, k[2], 17, 606105819);
	b = ff(b, c, d, a, k[3], 22, -1044525330);
	a = ff(a, b, c, d, k[4], 7, -176418897);
	d = ff(d, a, b, c, k[5], 12, 1200080426);
	c = ff(c, d, a, b, k[6], 17, -1473231341);
	b = ff(b, c, d, a, k[7], 22, -45705983);
	a = ff(a, b, c, d, k[8], 7, 1770035416);
	d = ff(d, a, b, c, k[9], 12, -1958414417);
	c = ff(c, d, a, b, k[10], 17, -42063);
	b = ff(b, c, d, a, k[11], 22, -1990404162);
	a = ff(a, b, c, d, k[12], 7, 1804603682);
	d = ff(d, a, b, c, k[13], 12, -40341101);
	c = ff(c, d, a, b, k[14], 17, -1502002290);
	b = ff(b, c, d, a, k[15], 22, 1236535329);
	a = gg(a, b, c, d, k[1], 5, -165796510);
	d = gg(d, a, b, c, k[6], 9, -1069501632);
	c = gg(c, d, a, b, k[11], 14, 643717713);
	b = gg(b, c, d, a, k[0], 20, -373897302);
	a = gg(a, b, c, d, k[5], 5, -701558691);
	d = gg(d, a, b, c, k[10], 9, 38016083);
	c = gg(c, d, a, b, k[15], 14, -660478335);
	b = gg(b, c, d, a, k[4], 20, -405537848);
	a = gg(a, b, c, d, k[9], 5, 568446438);
	d = gg(d, a, b, c, k[14], 9, -1019803690);
	c = gg(c, d, a, b, k[3], 14, -187363961);
	b = gg(b, c, d, a, k[8], 20, 1163531501);
	a = gg(a, b, c, d, k[13], 5, -1444681467);
	d = gg(d, a, b, c, k[2], 9, -51403784);
	c = gg(c, d, a, b, k[7], 14, 1735328473);
	b = gg(b, c, d, a, k[12], 20, -1926607734);
	a = hh(a, b, c, d, k[5], 4, -378558);
	d = hh(d, a, b, c, k[8], 11, -2022574463);
	c = hh(c, d, a, b, k[11], 16, 1839030562);
	b = hh(b, c, d, a, k[14], 23, -35309556);
	a = hh(a, b, c, d, k[1], 4, -1530992060);
	d = hh(d, a, b, c, k[4], 11, 1272893353);
	c = hh(c, d, a, b, k[7], 16, -155497632);
	b = hh(b, c, d, a, k[10], 23, -1094730640);
	a = hh(a, b, c, d, k[13], 4, 681279174);
	d = hh(d, a, b, c, k[0], 11, -358537222);
	c = hh(c, d, a, b, k[3], 16, -722521979);
	b = hh(b, c, d, a, k[6], 23, 76029189);
	a = hh(a, b, c, d, k[9], 4, -640364487);
	d = hh(d, a, b, c, k[12], 11, -421815835);
	c = hh(c, d, a, b, k[15], 16, 530742520);
	b = hh(b, c, d, a, k[2], 23, -995338651);
	a = ii(a, b, c, d, k[0], 6, -198630844);
	d = ii(d, a, b, c, k[7], 10, 1126891415);
	c = ii(c, d, a, b, k[14], 15, -1416354905);
	b = ii(b, c, d, a, k[5], 21, -57434055);
	a = ii(a, b, c, d, k[12], 6, 1700485571);
	d = ii(d, a, b, c, k[3], 10, -1894986606);
	c = ii(c, d, a, b, k[10], 15, -1051523);
	b = ii(b, c, d, a, k[1], 21, -2054922799);
	a = ii(a, b, c, d, k[8], 6, 1873313359);
	d = ii(d, a, b, c, k[15], 10, -30611744);
	c = ii(c, d, a, b, k[6], 15, -1560198380);
	b = ii(b, c, d, a, k[13], 21, 1309151649);
	a = ii(a, b, c, d, k[4], 6, -145523070);
	d = ii(d, a, b, c, k[11], 10, -1120210379);
	c = ii(c, d, a, b, k[2], 15, 718787259);
	b = ii(b, c, d, a, k[9], 21, -343485551);
	x[0] = add32(a, x[0]);
	x[1] = add32(b, x[1]);
	x[2] = add32(c, x[2]);
	x[3] = add32(d, x[3]);

}

function cmn(q, a, b, x, s, t) {
	a = add32(add32(a, q), add32(x, t));
	return add32((a << s) | (a >>> (32 - s)), b);
}

function ff(a, b, c, d, x, s, t) {
	return cmn((b & c) | ((~b) & d), a, b, x, s, t);
}

function gg(a, b, c, d, x, s, t) {
	return cmn((b & d) | (c & (~d)), a, b, x, s, t);
}

function hh(a, b, c, d, x, s, t) {
	return cmn(b ^ c ^ d, a, b, x, s, t);
}

function ii(a, b, c, d, x, s, t) {
	return cmn(c ^ (b | (~d)), a, b, x, s, t);
}

function md51(s) {
	const n = s.length;
	const state = [1732584193, -271733879, -1732584194, 271733878];
	let i;
	for (i = 64; i <= s.length; i += 64)
		md5cycle(state, md5blk(s.substring(i - 64, i)));

	s = s.substring(i - 64);
	const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	for (i = 0; i < s.length; i++)
		tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
	tail[i >> 2] |= 0x80 << ((i % 4) << 3);
	if (i > 55) {
		md5cycle(state, tail);
		for (i = 0; i < 16; i++) tail[i] = 0;
	}
	tail[14] = n * 8;
	md5cycle(state, tail);
	return state;
}

function md5blk(s) {
	const md5blks = [];
	let i;
	for (i = 0; i < 64; i += 4)
		md5blks[i >> 2] = s.charCodeAt(i)
	+ (s.charCodeAt(i + 1) << 8)
	+ (s.charCodeAt(i + 2) << 16)
	+ (s.charCodeAt(i + 3) << 24);

	return md5blks;
}

const hex_chr = "0123456789abcdef".split("");

function rhex(n) {
	let s = "", j = 0;
	for (; j < 4; j++)
		s += hex_chr[(n >> (j * 8 + 4)) & 0x0F]
	+ hex_chr[(n >> (j * 8)) & 0x0F];
	return s;
}

function hex(x) {
	for (let i = 0; i < x.length; i++)
		x[i] = rhex(x[i]);
	return x.join("");
}

function md5(s) {
	return hex(md51(s));
}

function add32(a, b) {
	return (a + b) & 0xFFFFFFFF;
}

function close() {
	core_ws.close();
}

async function init(args) {
	return await new Promise((c) => {
		log(`Start Version => ${Ver}`, 1, "p2p", "init");
		core_uuid();

		function core_uuid() {
			try {
				if (!args.config.uuid) {
					const controller = new AbortController();
					setTimeout(() => controller.abort(), 2500);
					fetch("https://exptech.com.tw/api/v1/et/uuid", { signal: controller.signal })
						.then((ans) => ans.text())
						.then((ans) => {
							args.config.uuid = ans;
							core_main();
						})
						.catch((err) => {
							log(`Http UUID Error => ${err}`, 3, "p2p", "uuid");
							setTimeout(() => core_uuid(), 3000);
						});
				} else core_main();
			} catch (err) {
				log(`Init Error => ${err}`, 3, "p2p", "uuid");
				setTimeout(() => core_uuid(), 500);
			}
		}

		function core_main() {
			log(`UUID => ${args.config.uuid}`, 1);
			try {
				const controller = new AbortController();
				setTimeout(() => controller.abort(), 2500);
				fetch("https://exptech.com.tw/api/v1/et/ntp", { signal: controller.signal })
					.then((ans) => ans.json())
					.then((ans) => {
						core_TimeNow(ans.time);
						core_createWebSocket();
					})
					.catch((err) => {
						log(`Http NTP Error => ${err}`, 3, "p2p", "ntp");
						setTimeout(() => core_main(), 3000);
					});
			} catch (err) {
				log(`Init Error => ${err}`, 3, "p2p", "ntp");
				setTimeout(() => core_main(), 500);
			}
		}

		function core_reconnect() {
			if (Date.now() - core_Reconnect < 5000) return;
			core_Reconnect = Date.now();
			if (core_ws != null) {
				core_ws.close();
				core_ws = null;
			}
			log("WebSocket Reconnecting", 2, "p2p", "ws");
			core_createWebSocket();
		}

		function core_createWebSocket() {
			try {
				core_ws = new args.WebSocket("wss://exptech.com.tw/api/v1");
				core_initEventHandle();
			} catch (e) {
				core_reconnect();
			}
		}

		function core_initEventHandle() {
			core_ws.onclose = () => { void 0;};
			core_ws.onerror = (err) => {
				log(`WebSocket Error => ${err.message}`, 3, "p2p", "ws");
			};
			core_ws.onopen = () => {
				const _config = {
					uuid     : args.config.uuid,
					function : "subscriptionService",
					value    : ["eew-v1", "palert-v1", "report-v1", "intensity-v1", "tsunami-v1"],
					key      : args.config.key ?? "",
				};
				core_ws.send(JSON.stringify(_config));
				ready = true;
				c({ uuid: args.config.uuid });
			};
			core_ws.onmessage = (evt) => {
				if (!core_WS) log("WebSocket Connected", 1, "p2p", "ws");
				service_status.websocket.status = true;
				core_WS = true;
				const json = JSON.parse(evt.data);
				if (json.response != undefined) {
					if (json.response == "Connection Succeeded") core_TimeNow(json.time);
					feedback();
				} else if (json.type == "ntp") core_TimeNow(json.time);
				else if (json.type == "p2p_connect") {
					if (core_ps[json.ID] == undefined) readUserInput(json.id);
				} else if (json.type == "p2p")
					try {
						switch (json.p2p_type) {
							case "offer":
								createPeerConnection(json.id);
								core_pcMap[json.id].setRemoteDescription(json.description, json.type);
								break;
							case "answer":
								core_pcMap[json.id].setRemoteDescription(json.description, json.type);
								break;
							case "candidate":
								core_pcMap[json.id].addRemoteCandidate(json.candidate, json.mid);
								break;
							default:
								break;
						}
					} catch (err) {void 0;}
				else {
					const MD5 = json.md5 ?? "";
					const md5_json = json;
					delete md5_json.md5;
					const now = Math.round(Now().getTime() / 1000);
					let __verify_ = false;
					for (let i = 0; i < 5; i++)
						if (MD5 == md5(`${JSON.stringify(md5_json)}-whes1015-${now - i}`)) {
							__verify_ = true;
							break;
						}
					raw_data.push({
						type      : "websocket",
						verify    : __verify_,
						timestamp : Now().getTime(),
						data      : json,
					});
					if (!json.replay_timestamp)
						if (__verify_ && (json.type.startsWith("eew") || json.type == "palert" || json.type == "report" || json.type == "intensity" || json.type == "tsunami"))
							for (let index = 0; index < Object.keys(core_br).length; index++)
								try {
									core_br[Object.keys(core_br)[index]].sendMessage(evt.data);
								} catch (err) { void 0;}
				}
			};
		}

		function core_TimeNow(now) {
			if (!core_ServerT) log("Time Synchronization Complete", 1, "p2p", "ws-ntp");
			core_ServerT = Date.now();
			core_ServerTime = now;
		}

		setInterval(() => {
			if (Date.now() - core_ServerT > 15_000 && core_ServerT) {
				if (core_WS) log("WebSocket Disconnected", 2, "p2p", "ws-heart");
				service_status.websocket.status = false;
				p2p_clear();
				core_reconnect();
				core_WS = false;
			}

			for (let index = 0; index < Object.keys(core_ps).length; index++)
				try {
					if (Date.now() - core_ps[Object.keys(core_ps)[index]].time > 25000) {
						core_ps[Object.keys(core_ps)[index]].client.close();
						delete core_ps[Object.keys(core_ps)[index]];
						log(`A p2p node is Disconnected (upstream) { up:${Object.keys(core_ps).length} down:${Object.keys(core_cs).length} }`, 2, "p2p", "upstream");
						break;
					}
				} catch (err) { void 0;}
			service_status.p2p.upstream = Object.keys(core_ps).length;
			service_status.p2p.downstream = Object.keys(core_cs).length;
			if (Object.keys(core_ps).length) service_status.p2p.status = true;
			else service_status.p2p.status = false;
			feedback();
		}, 3000);

		function p2p_clear() {
			args.nodeDataChannel.cleanup();

			for (let index = 0; index < Object.keys(core_clock).length; index++) {
				clearInterval(core_clock[Object.keys(core_clock)[index]]);
				delete core_clock[Object.keys(core_clock)[index]];
			}

			core_ps = {};
			core_br = {};
			core_cs = {};
			core_pcMap = {};
		}

		function readUserInput(peerId) {
			try {
				createPeerConnection(peerId);
				const dc = core_pcMap[peerId].createDataChannel("main");
				dc.onOpen(() => {
					if (Object.keys(core_ps).length < 5)
						try {
							dc.sendMessage(JSON.stringify({}));
							if (core_ps[peerId] == undefined) core_ps[peerId] = { time: Date.now() };
							core_ps[peerId].client = dc;
							log(`A p2p node is Connected (upstream) { up:${Object.keys(core_ps).length} down:${Object.keys(core_cs).length} }`, 1, "p2p", "upstream");
						} catch (err) {void 0;}
					else
						try {
							dc.close();
						} catch (err) {void 0;}
				});
				dc.onMessage((msg) => {
					try {
						const json = JSON.parse(msg);
						if (json.type == "p2p_ntp")
							core_ps[peerId].time = Date.now();
						else {
							const MD5 = json.md5 ?? "";
							const md5_json = json;
							delete md5_json.md5;
							const now = Math.round(Now().getTime() / 1000);
							let __verify_ = false;
							for (let i = 0; i < 5; i++)
								if (MD5 == md5(`${JSON.stringify(md5_json)}-whes1015-${now - i}`)) {
									__verify_ = true;
									break;
								}
							raw_data.push({
								type      : "p2p",
								verify    : __verify_,
								timestamp : Now().getTime(),
								data      : json,
							});
							if (__verify_ && (json.type.startsWith("eew") || json.type == "palert" || json.type == "report" || json.type == "intensity" || json.type == "tsunami"))
								for (let index = 0; index < Object.keys(core_br).length; index++)
									try {
										core_br[Object.keys(core_br)[index]].sendMessage(msg);
									} catch (err) { void 0;}
						}
					} catch (err) {void 0;}
				});
			} catch (err) { void 0;}
		}

		function createPeerConnection(peerId) {
			try {
				const peerConnection = new args.nodeDataChannel.PeerConnection("pc", { iceServers: [
					"stun:stun.l.google.com:19302",
					"stun:stunserver.org",
					"stun:stun.miwifi.com",
				] });
				peerConnection.onLocalDescription((description, type) => {
					try {
						core_ws.send(JSON.stringify({ function: "p2p", id: peerId, p2p_type: type, description, uuid: args.config.uuid }));
					} catch (err) { void 0;}
				});
				peerConnection.onLocalCandidate((candidate, mid) => {
					try {
						core_ws.send(JSON.stringify({ function: "p2p", id: peerId, p2p_type: "candidate", candidate, mid, uuid: args.config.uuid }));
					} catch (err) { void 0;}
				});
				peerConnection.onDataChannel((dc) => {
					core_br[peerId] = dc;
					if (core_clock[peerId] != undefined) clearInterval(core_clock[peerId]);
					core_cs[peerId] = Now().getTime();
					core_clock[peerId] = setInterval(() => {
						try {
							dc.sendMessage(JSON.stringify({ type: "p2p_ntp" }));
							core_cs[peerId] = Now().getTime();
						} catch (err) {
							if (Now().getTime() - (core_cs[peerId] ?? 0) > 25_000) {
								clearInterval(core_clock[peerId]);
								delete core_clock[peerId];
								delete core_pcMap[peerId];
								delete core_br[peerId];
								delete core_cs[peerId];
								dc.close();
								peerConnection.close();
								log(`A p2p node is Disconnected (downstream) { up:${Object.keys(core_ps).length} down:${Object.keys(core_cs).length} }`, 2, "p2p", "downstream");
							}
						}
					}, 10000);
					log(`A p2p node is Connected (downstream) { up:${Object.keys(core_ps).length} down:${Object.keys(core_cs).length} }`, 1, "p2p", "downstream");
					feedback();
				});
				core_pcMap[peerId] = peerConnection;
			} catch (err) { void 0;}
		}

		function feedback() {
			if (!core_WS) return;
			if (Now().getTime() - core_feedback_timestamp < 90000) return;
			core_feedback_timestamp = Now().getTime();
			core_ws.send(JSON.stringify({
				uuid     : args.config.uuid,
				function : "p2p_info",
				info     : {
					version        : Ver,
					server_connect : Object.keys(core_ps),
					client_connect : Object.keys(core_br),
				},
			}));
		}
	});
}

function Now() {
	return new Date(core_ServerTime + (Date.now() - core_ServerT));
}