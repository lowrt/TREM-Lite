/* eslint-disable no-undef */
const unzipper = require("unzipper");

function downloadOTAFile(Url) {
	fetch(Url)
		.then(res => {
			const writer = fs.createWriteStream("./trem.zip");
			res.body.pipe(writer);
			writer.on("finish", () => {
				fs.createReadStream("./trem.zip")
					.pipe(unzipper.Extract({ path: "./" }))
					.on("finish", () => {
						setTimeout(() => ipcRenderer.send("restart"));
					}, 1500);
			});
		});
}

function check_ota() {
	const controller = new AbortController();
	setTimeout(() => {
		controller.abort();
	}, 2500);
	fetch("https://exptech.com.tw/api/v1/file/trem-lite-info.json", { signal: controller.signal })
		.then((ans) => ans.json())
		.then((ans) => {
			if (ver_string_to_int(ans.ver) > ver_string_to_int(app.getVersion()))
				if (ans[app.getVersion()] == undefined) downloadOTAFile("https://exptech.com.tw/api/v1/file/trem.zip");
				else if (ans[app.getVersion()] != false) downloadOTAFile(`https://exptech.com.tw/api/v1/file/trem-${ans[app.getVersion()]}.zip`);
		})
		.catch((err) => {
			log(err, 3, "api", "check_ota");
		});
}

function ver_string_to_int(ver) {
	if (ver.includes("-")) ver = ver.split("-")[0].replaceAll(".", "");
	else ver = ver.replaceAll(".", "");
	return Number(ver);
}

check_ota();