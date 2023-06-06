/* eslint-disable no-undef */
const unzipper = require("unzipper");
let ota_ver = app.getVersion();

function downloadOTAFile(Url, ver) {
	fetch(Url)
		.then(res => {
			const writer = fs.createWriteStream("./resources/app/trem.zip");
			res.body.pipe(writer);
			writer.on("finish", () => {
				fs.createReadStream("./resources/app/trem.zip")
					.pipe(unzipper.Extract({ path: "./resources/app/" }))
					.on("finish", () => {
						fs.unlinkSync("./resources/app/trem.zip");
						const info = JSON.parse(fs.readFileSync("./resources/app/package.json"));
						if (info.version == ver) {
							if ((localStorage.getItem("ota_restart") ?? false)) {
								new Notification("⬆️ OTA 更新", {
									body : "已完成 OTA 更新!",
									icon : "../TREM.ico",
								});
								setTimeout(() => ipcRenderer.send("restart"), 1500);
							} else {
								new Notification("⬆️ OTA 下載", {
									body : "已完成 OTA 檔案下載!\n重新啟動完成更新",
									icon : "../TREM.ico",
								});
							}
						} else {
							ota_ver = info.version;
							check_ota();
						}
					});
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
			if (ans.ver != ota_ver && ans[ota_ver]) downloadOTAFile(`https://exptech.com.tw/api/v1/file/trem-ota-${ans[ota_ver]}.zip`, ans.ver);
		})
		.catch((err) => {
			log(err, 3, "api", "check_ota");
		});
}

check_ota();