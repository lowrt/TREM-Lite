const { BrowserWindow, app:TREM, ipcMain } = require("electron");
const path = require("path");
const pushReceiver = require("electron-fcm-push-receiver");

let MainWindow;
let SettingWindow;

let _devMode = false;

if (process.argv.includes("--dev")) {
	_devMode = true;
}else{
	_devMode = false;
}

function createWindow() {
	MainWindow = new BrowserWindow({
		title          : "TREM-Lite",
		width          : 1280,
		height         : 720,
		icon           : "TREM.ico",
		resizable      : false,
		webPreferences : {
			preload          : path.join(__dirname, "preload.js"),
			nodeIntegration  : true,
			contextIsolation : false,
		},
	});
	process.env.window = MainWindow.id;
	require("@electron/remote/main").initialize();
	require("@electron/remote/main").enable(MainWindow.webContents);
	MainWindow.loadFile("./view/index.html");
	MainWindow.setAspectRatio(16 / 9);
	MainWindow.setMenu(null);
	pushReceiver.setup(MainWindow.webContents);
	MainWindow.on("close", (event) => {
		if (!TREM.isQuiting) {
			event.preventDefault();
			MainWindow.hide();
			if (SettingWindow)
				SettingWindow.close();
			event.returnValue = false;
		} else
			TREM.quit();
	});
}

const shouldQuit = TREM.requestSingleInstanceLock();

if (!shouldQuit)
	TREM.quit();
else {
	TREM.on("second-instance", (event, argv, cwd) => {
		if (MainWindow != null) MainWindow.show();
	});
	TREM.whenReady().then(() => {
		// trayIcon();
		createWindow();
	});
}

ipcMain.on("toggleFullscreen", () => {
	if (MainWindow) {
		MainWindow.setFullScreen(!MainWindow.isFullScreen());
	}
});

ipcMain.on("openDevtool", () => {
	if (_devMode) {
		if (MainWindow) {
			MainWindow.webContents.openDevTools({ mode: "detach" });
		}
	}
});
ipcMain.on("reloadpage", () => {
	if (MainWindow) {
		MainWindow.webContents.reload();
	}
});