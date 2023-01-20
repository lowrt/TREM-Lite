/* eslint-disable no-undef */
let eew_number = 0;
let eew_timestamp = 0;

let show_eew_id = null;

function eew(_eew) {
	if (!_eew) eew_timestamp = 0;
	else if (Date.now() - eew_timestamp > 10000) {
		report_off();
		if (eew_timestamp == 0) $(".eew_hide").css("display", "inline");
		eew_timestamp = Date.now();
		eew_number++;
		const eew_list = Object.keys(TREM.EQ_list);
		if (!eew_list.length) return;
		if (eew_number >= eew_list.length) eew_number = 0;
		show_eew_id = eew_list[eew_number];
		const data = TREM.EQ_list[show_eew_id].data;
		const eew_max_intensity = TREM.EQ_list[show_eew_id].eew;
		document.getElementById("eew_title_text").innerHTML = `${get_lang_string("eew.title").replace("${type}", (data.cancel) ? get_lang_string("eew.cancel") : (data.Test) ? get_lang_string("eew.test") : (eew_max_intensity > 4) ? get_lang_string("eew.alert") : get_lang_string("eew.warn"))}${(eew_list.length == 1) ? "" : ` ${eew_number + 1}/${eew_list.length}`}`;
		document.getElementById("eew_title_text_number").innerHTML = `${get_lang_string("eew.number").replace("${number}", data.number)}`;
		document.getElementById("eew_box").style.backgroundColor = (data.cancel) ? "#333439" : (data.Test) ? "#0080FF" : (eew_max_intensity > 4) ? "red" : "#FF9224";
		document.getElementById("eew_body").style.backgroundColor = "#514339";
		const eew_intensity = document.getElementById("eew_intensity");
		eew_intensity.className = `intensity_${eew_max_intensity} intensity_center`;
		eew_intensity.innerHTML = int_to_intensity(eew_max_intensity);
		document.getElementById("eew_location").innerHTML = `${data.location}`;

		const now = new Date(data.time);
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

		let eew_scale = data.scale.toString();
		if (eew_scale.length == 1)
			eew_scale = eew_scale + ".0";


		document.getElementById("eew_time").innerHTML = get_lang_string("eew.time").replace("${time}", eew_time);
		document.getElementById("eew_scale").innerHTML = `M ${eew_scale}`;
		document.getElementById("eew_args").innerHTML = `${get_lang_string("word.depth")}:&nbsp;<b>${data.depth}</b>&nbsp;km`;
	}
}