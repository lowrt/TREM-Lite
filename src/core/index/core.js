/* eslint-disable no-undef */
const win = BrowserWindow.fromId(process.env.window * 1);

log("Start", 1, "log", "~");

ipcMain.on("replay_start", (e, time) => {
	replay_run();
	rts_replay_time = Now().getTime() - (10800 - Number(time)) * 1000;
});

ipcMain.on("replay_stop", () => replay_stop());