/* eslint-disable no-undef */
let ws;
function connect() {
	if (ws && ws.readyState === WebSocket.OPEN) ws.close();

	ws = new WebSocket(getRandomElement(constant.WEBSOCKET_URL));

	ws.onopen = () => {
		console.log("websocket open");
	};

	ws.onmessage = (e) => {
		const data = parseJSON(e.data.toString());
		if (data)
			console.log(data);
	};

	ws.onclose = () => {
		setTimeout(connect, 5000);
	};

	ws.onerror = (err) => {
		console.log("websocket error ", err);
	};
}

connect();