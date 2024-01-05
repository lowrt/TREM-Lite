/* eslint-disable no-undef */
let ws;
function connect() {
	if (ws && ws.readyState === WebSocket.OPEN) ws.close();

	ws = new WebSocket(getRandomElement(constant.WEBSOCKET_URL));

	ws.onopen = () => {
		console.log("websocket open");
		ws.send(JSON.stringify({
			type    : "start",
			key     : "K0Q9Z4BJ23YVGNM7Q0G6D10V5QLFX4",
			service : ["trem.rts"],
			// config  : {
			// 	"eew.cwa": {
			// 		"loc-to-int": false,
			// 	},
			// },
		}));
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