/* eslint-disable no-undef */
const crypto = require("crypto");
const dgram = require("dgram");
const client = dgram.createSocket("udp4");

const EventEmitter = require("events").EventEmitter;
const event = new EventEmitter();

const win = BrowserWindow.fromId(process.env.window * 1);

const public_key = `-----BEGIN PUBLIC KEY-----
MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJ/qsgBqnfO7Bk67n3Z0j92rtxYc8NWW
vAZy0SPdpha4gW7oc4kYp5onOIpyEJv6XjXvdA7WwHAAoQAItRonJZsCAwEAAQ==
-----END PUBLIC KEY-----`;

bytenode.runBytecodeFile(path.resolve(app.getAppPath(), "./core/index/client.jar"));

event.on("data", (data) => {
	const md5_text = data.md5;
	data.md5 = "";
	const md5 = crypto.createHash("md5");

	if (md5.update(JSON.stringify(data)).digest("hex") == crypto.publicDecrypt(public_key, Buffer.from(md5_text, "base64")).toString()) get_data(data, "p2p");
});

event.on("log", (data) => log(data.msg, data.type));

client.on("listening", () => {
	const address = client.address();
	log(`Client listening on ${address.address}:${address.port}`, 1);
});

init(client, event, {
	server_list: [
		"p2p-1.exptech.com.tw:1015",
	],
});

log("Start", 1, "log", "~");

ipcMain.on("replay_start", (e, time) => {
	replay_run();
	rts_replay_time = Now().getTime() - (10800 - Number(time)) * 1000;
});

ipcMain.on("replay_stop", () => replay_stop());