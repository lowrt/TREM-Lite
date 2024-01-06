/* eslint-disable no-undef */
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

let ws;
function connect() {
	if (ws && ws.readyState === WebSocket.OPEN) ws.close();

	ws = new WebSocket(getRandomElement(constant.WEBSOCKET_URL));

	ws.onopen = () => {
		console.log("websocket open");
		ws.send(JSON.stringify(constant.WS_CONFIG));
	};

	ws.onmessage = (e) => {
		const data = parseJSON(e.data.toString());
		if (data)
			switch (data.type) {
				case "verify":
					ws.send(JSON.stringify(constant.WS_CONFIG));
					break;
				case "info":
					switch (data.data.code) {
						case 200:
							if (!data.data.list.length) {
								ws_reconnect = false;
								ws.close();
								break;
							}
							variable.ws_connected = true;
							variable.subscripted_list = data.data.list;
							break;
						case 503:
							setTimeout(() => ws.send(JSON.stringify(constant.WS_CONFIG)), constant.API_WEBSOCKET_VERIFY);
							break;
					}
					break;
				case "data":
					switch (data.data.type) {
						case "rts":
							if (variable.replay) break;
							variable.last_get_data_time = now();
							show_rts_dot(data.data.data);
							if (Object.keys(data.data.data.box).length) show_rts_box(data.data.data.box);
							break;
						case "eew":
							show_eew(data.data);
							break;
					}
					break;
				case "ntp":
					variable.time_offset = Date.now() - data.time;
					break;
			}
	};

	ws.onclose = () => {
		variable.ws_connected = false;
		if (variable.ws_reconnect) setTimeout(connect, constant.API_WEBSOCKET_RETRY);
	};

	ws.onerror = (err) => {
		console.log("websocket error ", err);
	};
}

connect();