/* eslint-disable no-undef */
const report_list = document.getElementById("report_list");
document.onreadystatechange = () => {
	report_list.onmouseenter = () => {
		report_list.style.overflow = "auto";
		for (const item of document.getElementsByClassName("report"))
			item.style.marginRight = "0px";
	};
	report_list.onmouseleave = () => {
		report_list.style.overflow = "hidden";
		for (const item of document.getElementsByClassName("report"))
			item.style.marginRight = "5px";
	};
};

document.getElementById("setting_button").onclick = () => {
	ipcRenderer.send("openChildWindow");
};

const location_button = document.getElementById("location_button");
location_button.style.border = "1px solid white";
location_button.onclick = () => {
	if (location_button.style.color == "white") {
		location_button.style.color = "grey";
		location_button.style.border = "1px solid white";
		focus_lock = false;
		TREM.Maps.main.setView([23.7, 120.4], 7.8);
		refresh_report_list();
	}
};