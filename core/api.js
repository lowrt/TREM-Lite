/* eslint-disable no-undef */
const { shell } = require("@electron/remote");
const fs = require("fs");
const region = JSON.parse(fs.readFileSync("./resource/data/region.json").toString());

function Now() {
	return new Date(ServerTime + (Date.now() - ServerT));
}

function int_to_intensity(int) {
	const list = ["0", "1", "2", "3", "4", "5⁻", "5⁺", "6⁻", "6⁺", "7"];
	return list[int];
}

function refresh_report_list() {
	fetch("https://exptech.com.tw/api/v1/earthquake/reports?limit=50")
		.then((ans) => ans.json())
		.then((ans) => {
			const report_list = document.getElementById("report_list");
			report_list.innerHTML = "";
			for (let i = 0; i < ans.length; i++) {
				const intensity = ans[i].data[0]?.areaIntensity ?? 0;
				const time = ans[i].originTime.substring(0, 16);
				let loc = ans[i].location;
				loc = loc.substring(loc.indexOf("(") + 3, loc.indexOf(")"));
				const report = document.createElement("div");
				const resize = (intensity > 4 && intensity != 7) ? true : false;
				const intensity_level = (intensity == 0) ? "--" : int_to_intensity(intensity);
				if (i == 0)
					report.innerHTML = `<div class="report"><div class="report_text report_intensity intensity_${intensity}"style="font-size: ${(resize) ? "50" : "60"}px;">${intensity_level}</div><div class="report_text_box"><div class="report_text" style="font-size: 22px;"><b>${loc}</b></div><div class="report_text" style="font-size: 15px;">${time}</div><div style="display: flex;"><div class="report_text"><b>M&nbsp;${ans[i].magnitudeValue.toFixed(1)}</b></div><div class="report_text report_scale" style="width: 100%;text-align: right;">深度:&nbsp;<b>${ans[i].depth}</b>&nbsp;km</div></div></div></div>`;
				else
					report.innerHTML = `<div class="report"><div class="report_text report_intensity intensity_${intensity}"style="font-size: ${(resize) ? "35" : "40"}px;max-width: 55px;">${intensity_level}</div><div class="report_text_box"><div class="report_text"><b>${loc}</b></div><div class="report_text" style="font-size: 15px;">${time}</div></div><div class="report_text report_scale"><b>M&nbsp;${ans[i].magnitudeValue.toFixed(1)}</b></div></div>`;
				report.addEventListener("click", () => {
					if (ans[i].location.startsWith("TREM 人工定位")) return;
					const originTime = new Date((new Date(`${ans[i].originTime} GMT+08:00`)).toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
					const cwb_code = "EQ"
						+ ans[i].earthquakeNo
						+ "-"
						+ (originTime.getMonth() + 1 < 10 ? "0" : "") + (originTime.getMonth() + 1)
						+ (originTime.getDate() < 10 ? "0" : "") + originTime.getDate()
						+ "-"
						+ (originTime.getHours() < 10 ? "0" : "") + originTime.getHours()
						+ (originTime.getMinutes() < 10 ? "0" : "") + originTime.getMinutes()
						+ (originTime.getSeconds() < 10 ? "0" : "") + originTime.getSeconds();
					shell.openExternal(`https://www.cwb.gov.tw/V8/C/E/EQ/${cwb_code}.html`);
				});
				report_list.appendChild(report);
			}
		})
		.catch((err) => {
			setTimeout(() => refresh_report_list(), 5000);
		});
}

function eew_location_intensity(data) {
	const json = {};
	let eew_max_pga = 0;
	for (let i = 0; i < Object.keys(region).length; i++) {
		const city = Object.keys(region)[i];
		for (let index = 0; index < Object.keys(region[city]).length; index++) {
			const town = Object.keys(region[city])[index];
			const info = region[city][town];
			const dist_surface = Math.sqrt(pow((data.NorthLatitude - info.lat) * 111) + pow((data.EastLongitude - info.lon) * 101));
			const dist = Math.sqrt(pow(dist_surface) + pow(data.Depth));
			const pga = 12.44 * Math.exp(1.33 * data.Scale) * Math.pow(dist, -1.837) * 1;
			if (pga > eew_max_pga) eew_max_pga = pga;
			json[`${city} ${town}`] = {
				dist,
				pga,
			};
		}
	}
	json.max_pga = eew_max_pga;
	return json;
}

function pga_to_intensity(pga) {
	return (pga > 800) ? 9 : (pga > 440) ? 8 : (pga > 250) ? 7 : (pga > 140) ? 6 : (pga > 80) ? 5 : (pga > 25) ? 4 : (pga > 8) ? 3 : (pga > 2.5) ? 2 : (pga > 0.8) ? 1 : 0;
}

function pow(int) {
	return Math.pow(int, 2);
}

function int_to_color(int) {
	const list = ["#A6ADAD", "#6B7878", "#1E6EE6", "#32B464", "#FFE05D", "#FFAA13", "#EF700F", "#E60000", "#A00000", "#5D0090"];
	return list[int];
}