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