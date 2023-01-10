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

document.getElementById("version").innerHTML = app.getVersion();

document.getElementById("setting_button")
	.addEventListener("click", () => {
		ipcRenderer.send("openChildWindow");
	});

document.getElementById("location_button")
	.addEventListener("click", () => {
		document.getElementById("location_button").style.color = "grey";
		focus_lock = false;
		TREM.Maps.main.setView([23.7, 120.4], 7.8);
	});