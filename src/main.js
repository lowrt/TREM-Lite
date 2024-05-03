const { BrowserWindow, Menu, Notification, app:TREM, Tray, ipcMain, nativeImage, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("fs");
const path = require("path");
const pushReceiver = require("electron-fcm-push-receiver");
const remote = require("@electron/remote/main");

autoUpdater.autoDownload = true;
autoUpdater.requestHeaders = { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" };

let MainWindow;
let SettingWindow;
let tray = null;
const _hide = (process.argv.includes("--start")) ? true : false;
let reload = false;
let UPDATE = false;

Object.defineProperty(TREM, "isPackaged", {
	get() {
		return true;
	},
});

function createWindow() {
	MainWindow = new BrowserWindow({
		title          : "TREM-Lite",
		minHeight      : 650,
		minWidth       : 950,
		width          : 1280,
		height         : 720,
		icon           : "TREM.ico",
		show           : false,
		webPreferences : {
			nodeIntegration      : true,
			contextIsolation     : false,
			backgroundThrottling : false,
			enableRemoteModule   : true,
			nativeWindowOpen     : true,
		},
	});
	process.env.window = MainWindow.id;
	remote.initialize();
	remote.enable(MainWindow.webContents);
	// MainWindow.webContents.openDevTools();
	MainWindow.loadFile("./view/index.html");
	MainWindow.setMenu(null);
	MainWindow.webContents.on("did-finish-load", () => {
		if (!_hide) {
			MainWindow.show();
		}
		checkForUpdates();
		setInterval(() => checkForUpdates(), 600_000);
	});
	MainWindow.webContents.executeJavaScript("localStorage.getItem(\"init\")").then(value => {
		if (!value) {
			MainWindow.webContents.executeJavaScript("localStorage.setItem(\"init\",true)").then(v => {
				TREM.setLoginItemSettings({
					openAtLogin : true,
					name        : "TREM-Lite",
					args        : ["--start"],
				});
			});
		}
	});
	MainWindow.webContents.executeJavaScript("localStorage.getItem(\"Config\")").then(value => {
		const _value = JSON.parse(value);
		if ((_value.start_up ?? true)) {
			TREM.setLoginItemSettings({
				openAtLogin : true,
				name        : "TREM-Lite",
				args        : ["--start"],
			});
		} else {
			TREM.setLoginItemSettings({
				openAtLogin : false,
				name        : "TREM-Lite",
				args        : ["--start"],
			});
		}
	});
	pushReceiver.setup(MainWindow.webContents);
	if (process.platform === "win32") {
		TREM.setAppUserModelId("TREM-Lite | 臺灣即時地震監測");
	}
	MainWindow.on("close", (event) => {
		if (!TREM.isQuiting) {
			event.preventDefault();
			MainWindow.hide();
			if (SettingWindow) {
				SettingWindow.close();
			}
			event.returnValue = false;
		} else {
			TREM.quit();
		}
	});
	TREM.on("activate", () => {
		if (MainWindow === null) {
			createWindow();
		} else if (MainWindow.isMinimized()) {
			MainWindow.restore();
		} else if (!MainWindow.isVisible()) {
			MainWindow.show();
		}
	});
	MainWindow.webContents.on("render-process-gone", () => {
		if (!reload) {
			TREM.quit();
		} else {
			reload = false;
		}
	});
}

function createSettingWindow() {
	if (SettingWindow instanceof BrowserWindow) {
		return SettingWindow.focus();
	}
	SettingWindow = new BrowserWindow({
		title          : "TREM-Lite Setting",
		height         : 600,
		width          : 1000,
		show           : false,
		icon           : "TREM.ico",
		webPreferences : {
			nodeIntegration      : true,
			contextIsolation     : false,
			enableRemoteModule   : true,
			backgroundThrottling : false,
			nativeWindowOpen     : true,
		},
	});
	remote.enable(SettingWindow.webContents);
	SettingWindow.loadFile("./view/setting.html");
	SettingWindow.setMenu(null);
	SettingWindow.webContents.on("did-finish-load", () => SettingWindow.show());
	SettingWindow.on("close", () => {
		SettingWindow = null;
		if (MainWindow) {
			MainWindow.webContents.executeJavaScript("close()");
			MainWindow.webContents.reload();
		}
	});
}

function trayIcon() {
	if (tray) {
		tray.destroy();
		tray = null;
	}

	const iconPath = path.join(__dirname, "TREM.ico");
	tray = new Tray(nativeImage.createFromPath(iconPath));
	tray.setIgnoreDoubleClickEvents(true);
	tray.on("click", (e) => {
		if (MainWindow != null) {
			if (MainWindow.isVisible()) {
				MainWindow.hide();
			} else {
				MainWindow.show();
			}
		}
	});
	const contextMenu = Menu.buildFromTemplate([
		{
			label : `TREM v${TREM.getVersion()}`,
			type  : "normal",
			click : () => shell.openExternal("https://github.com/ExpTechTW/TREM-Lite"),
		},
		{
			type: "separator",
		},
		{
			label : "重新啟動",
			type  : "normal",
			click : () => restart(),
		},
		{
			label : "強制關閉",
			type  : "normal",
			click : () => {
				TREM.isQuiting = true;
				TREM.exit(0);
			},
		},
	]);
	tray.setToolTip(`TREM Lite v${TREM.getVersion()}`);
	tray.setContextMenu(contextMenu);
}

function restart() {
	if (MainWindow) {
		MainWindow.webContents.executeJavaScript("close()");
	}
	TREM.relaunch();
	TREM.isQuiting = true;
	TREM.quit();
}

const shouldQuit = TREM.requestSingleInstanceLock();

if (!shouldQuit) {
	TREM.quit();
} else {
	TREM.on("second-instance", (event, argv, cwd) => {
		if (MainWindow != null) {
			MainWindow.show();
		}
	});
	TREM.whenReady().then(() => {
		trayIcon();
		createWindow();
	});
}

ipcMain.on("reload", () => {
	reload = true;
	const currentWindow = BrowserWindow.getFocusedWindow();
	if (currentWindow) {
		currentWindow.webContents.reload();
	}
});

ipcMain.on("restart", () => restart());

ipcMain.on("hide", () => {
	if (MainWindow) {
		MainWindow.hide();
	}
});

TREM.on("before-quit", () => {
	TREM.isQuiting = true;
	if (MainWindow) {
		MainWindow.webContents.executeJavaScript("close()");
	}
	if (tray) {
		tray.destroy();
	}
	if (UPDATE) {
		autoUpdater.quitAndInstall();
	}
});

ipcMain.on("toggleFullscreen", () => {
	if (MainWindow) {
		MainWindow.setFullScreen(!MainWindow.isFullScreen());
	}
});
ipcMain.on("openDevtool", () => {
	const currentWindow = BrowserWindow.getFocusedWindow();
	if (currentWindow) {
		currentWindow.webContents.openDevTools({ mode: "detach" });
	}
});
ipcMain.on("openChildWindow", (event, arg) => createSettingWindow());

ipcMain.on("screenshot_auto", async (event, data) => {
	const folder = path.join(TREM.getPath("userData"), "screenshot_auto");
	if (!fs.existsSync(folder)) {
		fs.mkdirSync(folder);
	}
	const list = fs.readdirSync(folder);
	for (let i = 0; i < list.length; i++) {
		const date = fs.statSync(`${folder}/${list[i]}`);
		if (Date.now() - date.ctimeMs > 3600000) {
			fs.unlinkSync(`${folder}/${list[i]}`);
		}
	}
	fs.writeFileSync(path.join(folder, `${data.id}.png`), (await MainWindow.webContents.capturePage()).toPNG());
});

function checkForUpdates() {
	if (!UPDATE) {
		autoUpdater.checkForUpdates().catch((err) => void 0);
	}
}

function downloadUpdate(cancellationToken) {
	if (!UPDATE) {
		autoUpdater.downloadUpdate(cancellationToken).catch((err) => void 0);
	}
}

autoUpdater.on("update-available", (info) => {
	new Notification({
		title : "🆙 OTA 更新",
		body  : `${TREM.getVersion()} => ${info.version}`,
		icon  : "TREM.ico",
	}).on("click", () => {
		shell.openExternal(`https://github.com/ExpTechTW/TREM-Lite/releases/tag/v${info.version}`);
	}).show();
	downloadUpdate(info.cancellationToken);
});

autoUpdater.on("download-progress", (progressObj) => {
	if (MainWindow) {
		MainWindow.setProgressBar(progressObj.percent / 100);
	}
});

autoUpdater.on("update-downloaded", (info) => {
	if (MainWindow) {
		MainWindow.setProgressBar(0);
		MainWindow.setClosable(true);
	}
	if (SettingWindow) {
		SettingWindow.setClosable(true);
	}
	UPDATE = true;
});