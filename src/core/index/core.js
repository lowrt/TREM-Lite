/* eslint-disable no-undef */
const crypto = require("crypto");
const dgram = require("dgram");
const client = dgram.createSocket("udp4");

const EventEmitter = require("events").EventEmitter;
const event = new EventEmitter();

const win = BrowserWindow.fromId(process.env.window * 1);

// if (fs.existsSync(path.resolve(app.getAppPath(), "./core/index/client.js"))) {
// 	const vm = require("vm");
// 	const v8 = require("v8");
// 	v8.setFlagsFromString("--no-lazy");
// 	const code = fs.readFileSync(path.resolve(app.getAppPath(), "./core/index/client.js"), "utf-8");
// 	const script = new vm.Script(code);
// 	const bytecode = script.createCachedData();
// 	fs.writeFileSync(path.resolve(app.getAppPath(), "./core/index/client.jar"), bytecode);
// }

bytenode.runBytecodeFile(path.resolve(app.getAppPath(), "./core/index/client.jar"));

event.on("data", (data) => get_data(data, "p2p"));

event.on("log", (data) => log(data.msg, data.type));

client.on("listening", () => {
	const address = client.address();
	log(`Client listening on ${address.address}:${address.port}`, 1);
});

get_server_info();
async function get_server_info() {
	try {
		const controller = new AbortController();
		setTimeout(() => controller.abort(), 1500);
		let ans = await fetch("https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/resource/server_list.json", { signal: controller.signal })
			.catch((err) => void 0);
		if (controller.signal.aborted || !ans) {
			setTimeout(() => get_server_info(), 500);
			return;
		}
		ans = await ans.json();
		init(client, event, {
			server_list: ans.p2p,
		}, crypto);
	} catch (err) {
		log(err, 3, "core", "get_server_info");
		setTimeout(() => get_server_info(), 500);
	}
}

log("Start", 1, "log", "~");

ipcMain.on("replay_start", (e, time) => {
	replay_run();
	rts_replay_time = Now().getTime() - (10800 - Number(time)) * 1000;
});

ipcMain.on("replay_stop", () => replay_stop());