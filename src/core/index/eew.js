/* eslint-disable no-undef */
let eew_number = 0;
let eew_timestamp = 0;

let show_eew_id = null;

function eew(_eew) {
	if (!_eew) {
		eew_timestamp = 0;
	} else if (now_time() - eew_timestamp > 10000) {
		TREM.eew_info_clear = true;
		if (eew_timestamp == 0) {
			document.getElementById("detection_location_1").style.display = "none";
			document.getElementById("detection_location_2").style.display = "none";
			for (const item of document.getElementsByClassName("eew_hide"))
				item.style.display = "inline";
		}
		eew_timestamp = now_time();
		eew_number++;
		const eew_list = Object.keys(TREM.EQ_list);
		if (!eew_list.length) return;
		if (eew_number >= eew_list.length) eew_number = 0;
		show_eew_id = eew_list[eew_number];
		const data = TREM.EQ_list[show_eew_id].data;
		const eew_max_intensity = TREM.EQ_list[show_eew_id].eew;
		const alert = TREM.EQ_list[show_eew_id].alert;
		const unit = (data.type == "eew-jma") ? "JMA" : (data.type == "eew-nied") ? "NIED" : (data.type == "eew-kma") ? "KMA" : (data.type == "eew-scdzj") ? "SCDZJ" : (data.type == "eew-cwb") ? "CWB" : "TREM";
		document.getElementById("eew_title_text").innerHTML = `${unit} ${get_lang_string("eew.title").replace("${type}", (data.cancel) ? get_lang_string("eew.cancel") : (data.Test) ? get_lang_string("eew.test") : (alert) ? get_lang_string("eew.alert") : get_lang_string("eew.warn"))}${(eew_list.length == 1) ? "" : ` ${eew_number + 1}/${eew_list.length}`}`;
		document.getElementById("eew_title_text_number").innerHTML = `${get_lang_string("eew.number").replace("${number}", data.number)}${(data.final) ? `(${get_lang_string("eew.final")})` : ""}`;
		document.getElementById("eew_box").style.backgroundColor = (data.cancel) ? "#333439" : (data.Test) ? "#0080FF" : (alert) ? "red" : "#FF9224";
		const eew_body = document.getElementById("eew_body");
		eew_body.style.backgroundColor = "#514339";
		eew_body.style.border = "2px solid black";
		const eew_intensity = document.getElementById("eew_intensity");
		eew_intensity.className = `intensity_${eew_max_intensity} intensity_center`;
		eew_intensity.innerHTML = int_to_intensity(eew_max_intensity);
		const eew_location = document.getElementById("eew_location");
		eew_location.style.fontSize = (data.location.length > 10) ? "16px" : (data.location.length > 7) ? "20px" : "24px";
		eew_location.innerHTML = `${data.location}`;

		const now = new Date((data.replay_time) ? data.replay_time : data.time);
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
		const text_title = document.getElementById("eew_scale");
		const text_body = document.getElementById("eew_args");
		if (data.scale == 1) {
			text_title.style.fontSize = 18;
			text_title.innerHTML = "PLUM";
			text_body.style.fontSize = 12;
			text_body.style.textAlign = "start";
			text_body.innerHTML = "局部無阻尼運動傳播法";
		} else if (data.model == "nsspe") {
			text_title.style.fontSize = 18;
			text_title.innerHTML = "NSSPE";
			text_body.style.fontSize = 14;
			text_body.style.textAlign = "start";
			text_body.innerHTML = "無震源參數推算";
		} else {
			text_title.style.fontSize = 26;
			text_body.style.fontSize = 18;
			text_body.style.textAlign = "right";
			text_title.innerHTML = `M ${eew_scale}`;
			text_body.innerHTML = `${get_lang_string("word.depth")}:&nbsp;<b>${data.depth}</b>&nbsp;km`;
		}
	}
}