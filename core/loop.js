/* eslint-disable no-undef */
const audioDOM_1 = new Audio();
const audioDOM_2 = new Audio();
let player_1 = false;
let player_2 = false;
audioDOM_1.addEventListener("ended", () => {
	player_1 = false;
});
audioDOM_2.addEventListener("ended", () => {
	player_2 = false;
});

setInterval(() => {
	setTimeout(() => {
		const now = Now();
		let _Now = now.getFullYear().toString();
		_Now += "/";
		if ((now.getMonth() + 1) < 10) _Now += "0" + (now.getMonth() + 1).toString();
		else _Now += (now.getMonth() + 1).toString();
		_Now += "/";
		if (now.getDate() < 10) _Now += "0" + now.getDate().toString();
		else _Now += now.getDate().toString();
		_Now += " ";
		if (now.getHours() < 10) _Now += "0" + now.getHours().toString();
		else _Now += now.getHours().toString();
		_Now += ":";
		if (now.getMinutes() < 10) _Now += "0" + now.getMinutes().toString();
		else _Now += now.getMinutes().toString();
		_Now += ":";
		if (now.getSeconds() < 10) _Now += "0" + now.getSeconds().toString();
		else _Now += now.getSeconds().toString();
		if (WS) document.getElementById("time").innerHTML = `<b>${_Now}</b>`;

		if (Object.keys(TREM.EQ_list).length) {
			$(".flash").css("visibility", "hidden");
			setTimeout(() => $(".flash").css("visibility", "visible"), 500);
		}

		if (Object.keys(detection_box).length) {
			for (let i = 0; i < Object.keys(detection_box).length; i++) {
				const key = Object.keys(detection_box)[i];
				detection_box[key].options.color = "transparent";
				detection_box[key].redraw();
			}
			setTimeout(() => {
				for (let i = 0; i < Object.keys(detection_box).length; i++) {
					const key = Object.keys(detection_box)[i];
					detection_box[key].options.color = detection_box[key].options._color;
					detection_box[key].redraw();
				}
			}, 500);
		}
	}, 1000 - Now().getMilliseconds());
}, 1_000);

setInterval(() => {
	get_station_info();
	refresh_report_list();
}, 600_000);

setInterval(() => {
	if (!Object.keys(TREM.EQ_list).length) return;
	eew();
}, 500);

setInterval(() => {
	if (TREM.audio.main.length) {
		if (player_1) return;
		player_1 = true;
		const nextAudioPath = TREM.audio.main.shift();
		audioDOM_1.src = `../resource/audios/${nextAudioPath}.wav`;
		audioDOM_1.play();
	}
	if (TREM.audio.minor.length) {
		if (player_2) return;
		player_2 = true;
		const nextAudioPath = TREM.audio.minor.shift();
		audioDOM_2.src = `../resource/audios/${nextAudioPath}.wav`;
		audioDOM_2.play();
	}
}, 0);