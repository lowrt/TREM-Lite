/* eslint-disable no-undef */
$(document).ready(() => {
	$("#report_list").mouseenter(() => {
		$("#report_list").css("overflow", "auto");
		$(".report").css("margin-right", "0px");
	});
	$("#report_list").mouseleave(() => {
		$("#report_list").css("overflow", "hidden");
		$(".report").css("margin-right", "5px");
	});
});

document.getElementById("setting_button")
	.addEventListener("click", () => {
		ipcRenderer.send("openChildWindow");
	});

const location_button = document.getElementById("location_button");
location_button.style.border = "1px solid white";
location_button.addEventListener("click", () => {
	if (location_button.style.color == "white") {
		location_button.style.color = "grey";
		location_button.style.border = "1px solid white";
		focus_lock = false;
		TREM.Maps.main.setView([23.7, 120.4], 7.8);
		refresh_report_list();
	}
});