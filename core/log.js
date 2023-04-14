/* eslint-disable prefer-const */
const { BrowserWindow, app, shell } = require("@electron/remote");
const fs = require("fs");
const path = require("path");

let LastTime = log_time_string();
let log_cache = "";
const LogPath = () => path.join(app.getPath("logs"), `${log_time_string()}.log`);

if (!fs.existsSync(LogPath())) fs.writeFileSync(LogPath(), "");
else log_cache = fs.readFileSync(LogPath()).toString();

function log(msg, type = 1, sender = "main", fun = "unknow") {
	const _type = (type == 3) ? "Error" : (type == 2) ? "Warn" : "Info";
	const _msg = `[${_type}][${time_to_string()}][${sender}/${fun}]: ${msg}`;
	log_cache = `${_msg}\n` + log_cache;
	try {
		if (type == 3)
			console.log("\x1b[31m" + _msg + "\x1b[0m");
		else if (type == 2)
			console.log("\x1b[33m" + _msg + "\x1b[0m");
		else if (type == 1)
			console.log("\x1b[32m" + _msg + "\x1b[0m");
	} catch (err) {
		console.log("\x1b[31m" + _msg + "\x1b[0m");
	}
	fs.writeFile(LogPath(), log_cache, () => {
		if (LastTime != log_time_string()) {
			LastTime = log_time_string();
			log_cache = "";
		}
	});
}

function log_time_string() {
	const now = new Date();
	let _Now = now.getFullYear().toString();
	_Now += "-";
	if ((now.getMonth() + 1) < 10) _Now += "0" + (now.getMonth() + 1).toString();
	else _Now += (now.getMonth() + 1).toString();
	_Now += "-";
	if (now.getDate() < 10) _Now += "0" + now.getDate().toString();
	else _Now += now.getDate().toString();
	_Now += "_";
	if (now.getHours() < 10) _Now += "0" + now.getHours().toString();
	else _Now += now.getHours().toString();
	return _Now;
}

function time_to_string(date) {
	const now = new Date(date ?? Date.now());
	let _Now = now.getFullYear().toString();
	_Now += "/";
	if ((now.getMonth() + 1) < 10) _Now += "0" + (now.getMonth() + 1).toString();
	else _Now += (now.getMonth() + 1).toString();
	_Now += "/";
	if (now.getDate() < 10) _Now += "0" + now.getDate().toString();
	else _Now += now.getDate().toString();
	_Now += " ";
	if (now.getHours() < 10) _Now += "0" + now.getHours().toString();
	else _Now += now.getHours().toString();
	_Now += ":";
	if (now.getMinutes() < 10) _Now += "0" + now.getMinutes().toString();
	else _Now += now.getMinutes().toString();
	_Now += ":";
	if (now.getSeconds() < 10) _Now += "0" + now.getSeconds().toString();
	else _Now += now.getSeconds().toString();
	return _Now;
}

log("Start", 1, "log", "~");