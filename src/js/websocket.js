/* eslint-disable no-undef */
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
							show_rts_dot(data.data.data);
							if (Object.keys(data.data.data.box).length) show_rts_box(data.data.data.box);
							break;
					}
					break;
				case "ntp":
					variable.time_offset = Date.now() - data.time;
					break;
			}
	};

	ws.onclose = () => {
		setTimeout(connect, constant.API_WEBSOCKET_RETRY);
	};

	ws.onerror = (err) => {
		console.log("websocket error ", err);
	};
}

connect();