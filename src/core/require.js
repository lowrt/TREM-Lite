const { BrowserWindow, app, ipcMain, shell } = require("@electron/remote");
const fetch = require("node-fetch");
const fs = require("fs");
const { ipcRenderer } = require("electron");
const path = require("path");
const region = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), "./resource/data/region.json")).toString());
const time_table = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), "./resource/data/time.json")).toString());
const time_table_list = Object.keys(time_table);

const replayPath = path.join(app.getPath("userData"), "replay");
if (!fs.existsSync(replayPath)) {
	fs.mkdirSync(replayPath);
}
const replay_list = fs.readdirSync(replayPath);