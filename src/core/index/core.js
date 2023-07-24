/* eslint-disable no-undef */
const crypto = require("crypto");
const dgram = require("dgram");
const client = dgram.createSocket("udp4");

// const v8 = require("v8");
// const vm = require("vm");
// v8.setFlagsFromString("--no-lazy");
// const code = fs.readFileSync(path.resolve(app.getAppPath(), "../p2p.js"), "utf-8");
// const script = new vm.Script(code);
// const bytecode = script.createCachedData();
// fs.writeFileSync(path.resolve(app.getAppPath(), "./core/index/server.jar"), bytecode);

const win = BrowserWindow.fromId(process.env.window * 1);

bytenode.runBytecodeFile(path.resolve(app.getAppPath(), "./core/index/server.jar"));

let ans;

function _sleep(e) {
	ans.sleep(e);
}

(async () => {
	const start = (process.argv.includes("--start")) ? true : false;
	ans = await init({
		WebSocket,
		fetch,
		crypto,
		client,
		config: {
			uuid     : localStorage.UUID ?? null,
			key      : storage.getItem("key") ?? "",
			value    : ["trem-rts-v2", "trem-eew-v1", "report-trem-v1"],
			addition : { "trem-rts-v2": { sleep: start } },
		},
	});
	localStorage.UUID = ans.uuid;
	_server_init();
})();
log("Start", 1, "log", "~");

ipcMain.on("replay_start", (e, time) => {
	replay_run();
	rts_replay_time = Now().getTime() - (10800 - Number(time)) * 1000;
});

ipcMain.on("replay_stop", () => replay_stop());