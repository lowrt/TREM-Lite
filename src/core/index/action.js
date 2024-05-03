/* eslint-disable no-undef */
const report_list = document.getElementById("report_list");
document.onreadystatechange = () => {
	report_list.onmouseenter = () => {
		report_list.style.overflow = "auto";
		for (const item of document.getElementsByClassName("report")) {
			item.style.marginRight = "0px";
		}
	};
	report_list.onmouseleave = () => {
		report_list.style.overflow = "hidden";
		for (const item of document.getElementsByClassName("report")) {
			item.style.marginRight = "5px";
		}
	};
};

document.getElementById("setting_button").onclick = () => {
	ipcRenderer.send("openChildWindow");
};

document.getElementById("refresh_button").onclick = () => {
	close();
	setTimeout(() => ipcMain.emit("reload"), 500);
};

const location_button = document.getElementById("location_button");
location_button.style.border = "1px solid white";
location_button.onclick = () => {
	if (location_button.style.color == "grey") {
		location_button.style.color = "white";
		location_button.style.border = "1px solid white";
		focus_lock = false;
		TREM.Maps.main.setView([23.6, 120.4], 7.8);
		refresh_report_list();
	}
};

const webscoket_button = document.getElementById("webscoket_button");
if(storage.getItem("key")){
	webscoket_button.style.color = "grey";
	webscoket_button.style.border = "1px solid red";
} else {
	webscoket_button.style.display = "none";
	document.getElementsByClassName("version_text")[0].style.right = "432px";
}
webscoket_button.onclick = () => {
	if (ws == null) {
		reconnect(true);
	} else {
		add_info("fa-solid fa-network-wired fa-2x info_icon", "#00AA00", "已關閉 WebSocket 連線", "#00BB00", "正在使用 HTTP 連線", 5000);
		ws_auth = false;
		ws.close();
		ws = null;
	}
};