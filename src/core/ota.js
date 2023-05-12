/* eslint-disable no-undef */
let OTA = false;
const unzipper = require("unzipper");

function downloadOTAFile(Url) {
	fetch(Url)
		.then(res => {
			const writer = fs.createWriteStream("./resources/app/trem.zip");
			res.body.pipe(writer);
			writer.on("finish", () => {
				fs.createReadStream("./resources/app/trem.zip")
					.pipe(unzipper.Extract({ path: "./resources/app/" }))
					.on("finish", () => {
						OTA = true;
						fs.unlinkSync("./resources/app/trem.zip");
						setTimeout(() => {
							if ((localStorage.getItem("ota_restart") ?? false)) {
								new Notification("⬆️ OTA 更新", {
									body : "已完成 OTA 更新!",
									icon : "../TREM.ico",
								});
								ipcRenderer.send("restart");
							} else new Notification("⬆️ OTA 下載", {
								body : "已完成 OTA 檔案下載!\n重新啟動完成更新",
								icon : "../TREM.ico",
							});
						}, 1500);
					});
			});
		});
}

function check_ota() {
	if (OTA) return;
	const controller = new AbortController();
	setTimeout(() => {
		controller.abort();
	}, 2500);
	fetch("https://exptech.com.tw/api/v1/file/trem-lite-info.json", { signal: controller.signal })
		.then((ans) => ans.json())
		.then((ans) => {
			if (ans.ver != app.getVersion())
				if (ans[app.getVersion()]) downloadOTAFile(`https://exptech.com.tw/api/v1/file/trem-ota-${ans[app.getVersion()]}.zip`);
		})
		.catch((err) => {
			log(err, 3, "api", "check_ota");
		});
}

check_ota();