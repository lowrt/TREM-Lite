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
location_button.addEventListener("click", () => {
	if (location_button.style.color == "white") {
		location_button.style.color = "grey";
		focus_lock = false;
		TREM.Maps.main.setView([23.7, 120.4], 7.8);
	}
});