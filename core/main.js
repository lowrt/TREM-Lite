require("leaflet");
require("leaflet-edgebuffer");
require("leaflet-geojson-vt");
const path = require("path");

const Maps = { main: null };

Maps.main = L.map("map", {
	edgeBufferTiles    : 1,
	attributionControl : false,
	closePopupOnClick  : false,
	maxBounds          : [[60, 50], [10, 180]],
	preferCanvas       : true,
	zoomSnap           : 0.25,
	zoomDelta          : 0.5,
	doubleClickZoom    : false,
	zoomControl        : false,
}).setView([23, 121], 7.5);
L.geoJson.vt(require(path.join(__dirname, "../resource/maps", "tw_county.json")), {
	edgeBufferTiles : 2,
	minZoom         : 4,
	maxZoom         : 12,
	tolerance       : 20,
	buffer          : 256,
	debug           : 0,
	style           : {
		weight      : 0.8,
		color       : "#6A6F75",
		fillColor   : "#3F4045",
		fillOpacity : 0.5,
	},
}).addTo(Maps.main);

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
		time.innerHTML = `<b>${_Now}</b>`;
	}, 1000 - Now().getMilliseconds());
}, 1000);

refresh_report_list();
function refresh_report_list() {
	fetch("https://exptech.com.tw/api/v1/earthquake/reports?limit=50")
		.then((ans) => ans.json())
		.then((ans) => {
			const report_list = document.getElementById("report_list");
			for (let i = 0; i < ans.length; i++) {
				const intensity = ans[i].data[0]?.areaIntensity ?? 0;
				const time = ans[i].originTime.substring(0, 16);
				let loc = ans[i].location;
				loc = loc.substring(loc.indexOf("(") + 3, loc.indexOf(")"));
				const report = document.createElement("div");
				const resize = (intensity > 4 && intensity != 7) ? true : false;
				if (i == 0)
					report.innerHTML = `<div class="report"><div class="report_text report_intensity intensity_${intensity}"style="font-size: ${(resize) ? "50" : "60"}px;">${int_to_intensity(intensity)}</div><div class="report_text_box"><div class="report_text" style="font-size: 22px;"><b>${loc}</b></div><div class="report_text" style="font-size: 15px;">${time}</div><div style="display: flex;"><div class="report_text"><b>M&nbsp;${ans[i].magnitudeValue.toFixed(1)}</b></div><div class="report_text report_scale" style="width: 100%;text-align: right;">深度:&nbsp;<b>${ans[i].depth}</b>&nbsp;km</div></div></div></div>`;
				else
					report.innerHTML = `<div class="report"><div class="report_text report_intensity intensity_${intensity}"style="font-size: ${(resize) ? "35" : "40"}px;max-width: 55px;">${int_to_intensity(intensity)}</div><div class="report_text_box"><div class="report_text"><b>${loc}</b></div><div class="report_text" style="font-size: 15px;">${time}</div></div><div class="report_text report_scale"><b>M&nbsp;${ans[i].magnitudeValue.toFixed(1)}</b></div></div>`;
				report_list.appendChild(report);
			}
		})
		.catch((err) => {
			setTimeout(() => refresh_report_list(), 5000);
		});
}

function int_to_intensity(int) {
	const list = ["?", "1", "2", "3", "4", "5⁻", "5⁺", "6⁻", "6⁺", "7"];
	return list[int];
}

function Now() {
	return new Date();
}