/* eslint-disable no-undef */
let eew_number = 0;
let eew_timestamp = 0;

let show_eew_id = null;

function eew(_eew) {
	if (!_eew) eew_timestamp = 0;
	else
	if (Date.now() - eew_timestamp > 5000) {
		if (eew_timestamp == 0) $(".eew_hide").css("display", "inline");
		eew_timestamp = Date.now();
		eew_number++;
		const eew_list = Object.keys(TREM.EQ_list);
		if (!eew_list.length) return;
		if (eew_number >= eew_list.length) eew_number = 0;
		show_eew_id = eew_list[eew_number];
		const data = TREM.EQ_list[show_eew_id].data;
		const eew_max_intensity = TREM.EQ_list[show_eew_id].eew;
		document.getElementById("eew_title_text").innerHTML = `<b>地震預警 (${(data.Cancel) ? "取消" : (eew_max_intensity > 4) ? "警報" : "注意"})${(eew_list.length == 1) ? "" : ` ${eew_number + 1}/${eew_list.length}`}</b>`;
		document.getElementById("eew_title_text_number").innerHTML = `<b>第${data.Version}報</b>`;
		document.getElementById("eew_box").style.backgroundColor = (data.Cancel) ? "#333439" : (eew_max_intensity > 4) ? "red" : "#FF9224";
		document.getElementById("eew_body").style.backgroundColor = "#514339";
		const eew_intensity = document.getElementById("eew_intensity");
		eew_intensity.className = `intensity_${eew_max_intensity} intensity_center`;
		eew_intensity.innerHTML = int_to_intensity(eew_max_intensity);
		document.getElementById("eew_location").innerHTML = `<b>${data.Location}</b>`;

		const now = new Date(data.Time);
		let eew_time = now.getFullYear().toString();
		eew_time += "/";
		if ((now.getMonth() + 1) < 10) eew_time += "0" + (now.getMonth() + 1).toString();
		else eew_time += (now.getMonth() + 1).toString();
		eew_time += "/";
		if (now.getDate() < 10) eew_time += "0" + now.getDate().toString();
		else eew_time += now.getDate().toString();
		eew_time += " ";
		if (now.getHours() < 10) eew_time += "0" + now.getHours().toString();
		else eew_time += now.getHours().toString();
		eew_time += ":";
		if (now.getMinutes() < 10) eew_time += "0" + now.getMinutes().toString();
		else eew_time += now.getMinutes().toString();
		eew_time += ":";
		if (now.getSeconds() < 10) eew_time += "0" + now.getSeconds().toString();
		else eew_time += now.getSeconds().toString();

		document.getElementById("eew_time").innerHTML = `${eew_time} 發震`;
		document.getElementById("eew_scale").innerHTML = `<b>M ${data.Scale.toFixed(1)}</b>`;
		document.getElementById("eew_args").innerHTML = `深度:&nbsp;<b>${data.Depth}</b>&nbsp;km`;
	}
}