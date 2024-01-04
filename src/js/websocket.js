/* eslint-disable no-undef */
function connect() {
	const ws = new WebSocket(config.url);

	ws.onopen = () => {
		void 0;
	};

	ws.onmessage = (e) => {
		const data = parseJSON(e.data.toString());
		if (data)
			void 0;
	};

	ws.onclose = () => {
		setTimeout(connect, 3000);
	};

	ws.onerror = (err) => {
		void 0;
	};
}

connect();