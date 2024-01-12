/* eslint-disable no-undef */
const API = require("../js/class/api");

setInterval(() => {
	const _now = now();
	if (variable.replay) {
		doc_time.style.color = "yellow";
		doc_time.textContent = formatTime(variable.replay);
	} else
		if (_now - variable.last_get_data_time > 5000) doc_time.style.color = "red";
		else {
			doc_time.style.color = "white";
			doc_time.textContent = formatTime(_now);
		}
}, 1000);

const api = new API();

api.on(API.Events.Ntp, (data) => {
	variable.time_offset = Date.now() - data.time;
});

api.on(API.Events.Rts, (rts) => {
	if (variable.replay) return;

	variable.last_get_data_time = now();
	show_rts_dot(rts.data);
	if (Object.keys(rts.data.box).length) show_rts_box(rts.data.box);
});

api.on(API.Events.Eew, (eew) => {
	show_eew(eew.data);
});