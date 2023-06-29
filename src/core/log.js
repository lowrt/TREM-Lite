/* eslint-disable no-undef */
function now_time() {
	const utc = new Date();
	const now = new Date(utc.getTime() + utc.getTimezoneOffset() * 60000 + 28800000);
	return now.getTime();
}

clear();
setInterval(() => clear(), 3600 * 1000);
function clear() {
	const list = fs.readdirSync(app.getPath("logs"));
	for (let i = 0; i < list.length; i++) {
		const date = fs.statSync(`${app.getPath("logs")}/${list[i]}`);
		if (Date.now() - date.ctimeMs > 86400 * 1000 * 7) fs.unlinkSync(`${app.getPath("logs")}/${list[i]}`);
	}
}

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
	let _Now = now.getFullYear();
	_Now += "-";
	if ((now.getMonth() + 1) < 10) _Now += "0" + (now.getMonth() + 1);
	else _Now += (now.getMonth() + 1);
	_Now += "-";
	if (now.getDate() < 10) _Now += "0" + now.getDate();
	else _Now += now.getDate();
	_Now += "_";
	if (now.getHours() < 10) _Now += "0" + now.getHours();
	else _Now += now.getHours();
	return _Now;
}

function time_to_string(date) {
	const utc = new Date(date ?? now_time());
	const now = new Date(utc.getTime() + utc.getTimezoneOffset() * 60000 + 28800000);
	let _Now = now.getFullYear();
	_Now += "/";
	if ((now.getMonth() + 1) < 10) _Now += "0" + (now.getMonth() + 1);
	else _Now += (now.getMonth() + 1);
	_Now += "/";
	if (now.getDate() < 10) _Now += "0" + now.getDate();
	else _Now += now.getDate();
	_Now += " ";
	if (now.getHours() < 10) _Now += "0" + now.getHours();
	else _Now += now.getHours();
	_Now += ":";
	if (now.getMinutes() < 10) _Now += "0" + now.getMinutes();
	else _Now += now.getMinutes();
	_Now += ":";
	if (now.getSeconds() < 10) _Now += "0" + now.getSeconds();
	else _Now += now.getSeconds();
	return _Now;
}