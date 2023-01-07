/* eslint-disable no-undef */
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
		const time = document.getElementById("time");
		if (WS) time.innerHTML = `<b>${_Now}</b>`;

		if (!Object.keys(TREM.EQ_list)) return;
		$(".flash").css("visibility", "visible");
		setTimeout(() => $(".flash").css("visibility", "hidden"), 500);
	}, 1000 - Now().getMilliseconds());
}, 1000);