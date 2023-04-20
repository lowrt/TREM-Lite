/* eslint-disable no-undef */
// const v8 = require("v8");
// const vm = require("vm");
// v8.setFlagsFromString("--no-lazy");
// const code = fs.readFileSync(path.resolve(app.getAppPath(), "../p2p.js"), "utf-8");
// const script = new vm.Script(code);
// const bytecode = script.createCachedData();
// fs.writeFileSync(path.resolve(app.getAppPath(), "./core/server.jar"), bytecode);

bytenode.runBytecodeFile(path.resolve(app.getAppPath(), "./core/server.jar"));

(async () => {
	const ans = await init({
		WebSocket,
		fetch,
		nodeDataChannel,
		config: {
			uuid: localStorage.UUID ?? null,
		},
	});
	localStorage.UUID = ans.uuid;
	_server_init();
})();
log("Start", 1, "log", "~");