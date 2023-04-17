const { BrowserWindow, Menu, app:TREM, Tray, ipcMain, nativeImage, shell } = require("electron");
const fs = require("fs");
const path = require("path");
const pushReceiver = require("electron-fcm-push-receiver");

let MainWindow;
let SettingWindow;
let tray = null;
let toggleFullscreen = false;
const _hide = (process.argv.includes("--start")) ? true : false;

function createWindow() {
	MainWindow = new BrowserWindow({
		title          : "TREM-Lite",
		minHeight      : 720,
		minWidth       : 1280,
		width          : 1280,
		height         : 720,
		icon           : "TREM.ico",
		show           : false,
		webPreferences : {
			preload              : path.join(__dirname, "preload.js"),
			nodeIntegration      : true,
			contextIsolation     : false,
			backgroundThrottling : false,
			enableRemoteModule   : true,
			nativeWindowOpen     : true,
		},
	});
	process.env.window = MainWindow.id;
	require("@electron/remote/main").initialize();
	require("@electron/remote/main").enable(MainWindow.webContents);
	MainWindow.loadFile("./view/index.html");
	MainWindow.setMenu(null);
	MainWindow.webContents.on("did-finish-load", () => {if (!_hide) MainWindow.show();});
	MainWindow.on("resize", () => {
		if (!toggleFullscreen)
			MainWindow.webContents.executeJavaScript("localStorage.getItem(\"Config\")").then(value => {
				const _value = JSON.parse(value);
				if ((_value.focus_resize ?? true)) MainWindow.setSize(1280, 720);
			});
		toggleFullscreen = false;
	});
	MainWindow.webContents.executeJavaScript("localStorage.getItem(\"init\")").then(value => {
		if (!value)
			MainWindow.webContents.executeJavaScript("localStorage.setItem(\"init\",true)").then(v => {
				TREM.setLoginItemSettings({
					openAtLogin : true,
					name        : "TREM-Lite",
					args        : ["--start"],
				});
			});
	});
	MainWindow.webContents.executeJavaScript("localStorage.getItem(\"Config\")").then(value => {
		const _value = JSON.parse(value);
		if ((_value.start_up ?? true)) TREM.setLoginItemSettings({
			openAtLogin : true,
			name        : "TREM-Lite",
			args        : ["--start"],
		});
		else TREM.setLoginItemSettings({
			openAtLogin : false,
			name        : "TREM-Lite",
			args        : ["--start"],
		});
	});
	pushReceiver.setup(MainWindow.webContents);
	if (process.platform === "win32") TREM.setAppUserModelId("TREM-Lite | 臺灣即時地震監測");
	MainWindow.on("close", (event) => {
		if (!TREM.isQuiting) {
			event.preventDefault();
			MainWindow.hide();
			if (SettingWindow) SettingWindow.close();
			event.returnValue = false;
		} else TREM.quit();
	});
}

function createSettingWindow() {
	if (SettingWindow instanceof BrowserWindow) return SettingWindow.focus();
	SettingWindow = new BrowserWindow({
		title          : "TREM-Lite Setting",
		height         : 600,
		width          : 1000,
		resizable      : false,
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
	require("@electron/remote/main").enable(SettingWindow.webContents);
	SettingWindow.loadFile("./view/setting.html");
	SettingWindow.setMenu(null);
	SettingWindow.webContents.on("did-finish-load", () => SettingWindow.show());
	SettingWindow.on("close", () => SettingWindow = null);
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
		if (MainWindow != null)
			if (MainWindow.isVisible()) MainWindow.hide();
			else MainWindow.show();
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
	TREM.relaunch();
	TREM.isQuiting = true;
	TREM.quit();
}

const shouldQuit = TREM.requestSingleInstanceLock();

if (!shouldQuit) TREM.quit();
else {
	TREM.on("second-instance", (event, argv, cwd) => {
		if (MainWindow != null) MainWindow.show();
	});
	TREM.whenReady().then(() => {
		trayIcon();
		createWindow();
	});
}

ipcMain.on("restart", () => restart());

TREM.on("before-quit", () => {
	TREM.isQuiting = true;
	if (tray) tray.destroy();
});

ipcMain.on("toggleFullscreen", () => {
	toggleFullscreen = true;
	if (MainWindow) MainWindow.setFullScreen(!MainWindow.isFullScreen());
});
ipcMain.on("openDevtool", () => {
	const currentWindow = BrowserWindow.getFocusedWindow();
	if (currentWindow) currentWindow.webContents.openDevTools({ mode: "detach" });
});
ipcMain.on("openChildWindow", (event, arg) => createSettingWindow());

ipcMain.on("screenshot_auto", async (event, data) => {
	const folder = path.join(TREM.getPath("userData"), "screenshot_auto");
	if (!fs.existsSync(folder)) fs.mkdirSync(folder);
	const list = fs.readdirSync(folder);
	for (let index = 0; index < list.length; index++) {
		const date = fs.statSync(`${folder}/${list[index]}`);
		if (Date.now() - date.ctimeMs > 3600000) fs.unlinkSync(`${folder}/${list[index]}`);
	}
	fs.writeFileSync(path.join(folder, `${data.id}.png`), (await MainWindow.webContents.capturePage()).toPNG());
});
