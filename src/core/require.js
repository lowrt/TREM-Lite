const { BrowserWindow, app, shell } = require("@electron/remote");
const fetch = require("node-fetch");
const fs = require("fs");
const { ipcRenderer } = require("electron");
const path = require("path");
const region = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), "./resource/data/region.json")).toString());