const { BrowserWindow, app:TREM } = require("electron");
const path = require("path");
const pushReceiver = require("electron-fcm-push-receiver");

let MainWindow;
let SettingWindow;

function createWindow() {
	MainWindow = new BrowserWindow({
		title          : "TREM-Plus",
		width          : 1280,
		minWidth       : 1280,
		height         : 720,
		minHeight      : 720,
		resizable      : true,
		icon           : "TREM.ico",
		webPreferences : {
			preload          : path.join(__dirname, "preload.js"),
			nodeIntegration  : true,
			contextIsolation : false,
		},
	});
	require("@electron/remote/main").initialize();
	require("@electron/remote/main").enable(MainWindow.webContents);
	MainWindow.loadFile("./view/index.html");
	MainWindow.setAspectRatio(16 / 9);
	// MainWindow.setMenu(null);
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