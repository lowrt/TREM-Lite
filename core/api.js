/* eslint-disable no-undef */
const { BrowserWindow, shell } = require("@electron/remote");
const fs = require("fs");
const path = require("path");
const region = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), "./resource/data/region.json")).toString());
const win = BrowserWindow.fromId(process.env.window * 1);

let report_data = {};

const tw_lang_data = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), `./resource/lang/${localStorage.lang ?? "zh-Hant"}.json`)).toString());
let lang_data = {};
try {
	lang_data = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), `./resource/lang/${localStorage.lang ?? "zh-Hant"}.json`)).toString());
	console.log(lang_data);
} catch (err) {
	console.log(err);
}

function get_lang_string(id) {
	return lang_data[id] ?? tw_lang_data[id] ?? "";
}

function Now() {
	return new Date(ServerTime + (Date.now() - ServerT));
}

function int_to_intensity(int) {
	const list = ["0", "1", "2", "3", "4", "5⁻", "5⁺", "6⁻", "6⁺", "7"];
	return list[int];
}

function fetch_eew() {
	const controller = new AbortController();
	setTimeout(() => {
		controller.abort();
	}, 2500);
	fetch("https://exptech.com.tw/api/v1/earthquake/eew?type=earthquake", { signal: controller.signal })
		.then((ans) => ans.json())
		.then((ans) => {
			get_data(ans, "http");
		})
		.catch((err) => {
			setTimeout(() => fetch_eew(), 3000);
		});
}

async function fetch_report() {
	return await new Promise((c) => {
		const controller = new AbortController();
		setTimeout(() => {
			controller.abort();
		}, 2500);
		fetch("https://exptech.com.tw/api/v1/earthquake/reports?limit=50", { signal: controller.signal })
			.then((ans) => ans.json())
			.then((ans) => {
				report_data = ans;
				c(true);
			})
			.catch((err) => {
				console.log(err);
				c(false);
			});
	});
}

async function refresh_report_list(_fetch = false, data = {}) {
	if (_fetch) {
		const ans = await fetch_report();
		if (!ans) {
			setTimeout(() => refresh_report_list(), 3000);
			return;
		}
	}
	if (data.Function == "report") report_data.unshift(data.raw);
	const report_list = document.getElementById("report_list");
	report_list.innerHTML = "";
	const IsPalert = (data.Function == "palert") ? true : false;
	for (let i = (IsPalert) ? -1 : 0; i < report_data.length; i++) {
		const report = document.createElement("div");
		if (i == -1)
			report.innerHTML = `<div class="report"><div class="report_text report_intensity intensity_${data.Data.data[0].intensity}"style="font-size: ${(data.Data.data[0].intensity > 4 && data.Data.data[0].intensity != 7) ? "50" : "60"}px;">${data.Data.data[0].intensity}</div><div class="report_text_box"><div class="report_text" style="font-size: 22px;"><b>震源 調查中</b></div><div class="report_text" style="font-size: 15px;">${data.Data.time}</div></div>`;
		else {
			const originTime = new Date((new Date(`${report_data[i].originTime} GMT+08:00`)).toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
			const intensity = report_data[i].data[0]?.areaIntensity ?? 0;
			const time = report_data[i].originTime.substring(0, 16);
			let loc = report_data[i].location;
			loc = loc.substring(loc.indexOf("(") + 3, loc.indexOf(")"));
			const resize = (intensity > 4 && intensity != 7) ? true : false;
			const intensity_level = (intensity == 0) ? "--" : int_to_intensity(intensity);
			if (i == 0 && !IsPalert)
				report.innerHTML = `<div class="report"><div id="${originTime}_info" class="report_item"><div class="report_text report_intensity intensity_${intensity}"style="font-size: ${(resize) ? "50" : "60"}px;">${intensity_level}</div><div class="report_text_box"><div class="report_text" style="font-size: 22px;"><b>${loc}</b></div><div class="report_text" style="font-size: 15px;">${time}</div><div style="display: flex;"><div class="report_text"><b>M&nbsp;${report_data[i].magnitudeValue.toFixed(1)}</b></div><div class="report_text report_scale" style="width: 100%;text-align: right;">${get_lang_string("word.depth")}:&nbsp;<b>${report_data[i].depth}</b>&nbsp;km</div></div></div></div><div id="${originTime}_click_box" class="report_click hide"><i id="${originTime}_click_replay" style="color: red;" class="report_click_text fa-regular fa-circle-play fa-2x"></i><i id="${originTime}_click_web" style="${report_data[i].location.startsWith("TREM 人工定位") ? "color: red;" : ""}" class="report_click_text fa fa-globe fa-2x"></i></div></div>`;
			else
				report.innerHTML = `<div class="report"><div id="${originTime}_info" class="report_item"><div class="report_text report_intensity intensity_${intensity}" style="font-size: ${(resize) ? "35" : "40"}px;max-width: 55px;">${intensity_level}</div><div class="report_text_box"><div class="report_text"><b>${loc}</b></div><div class="report_text" style="font-size: 15px;">${time}</div></div><div class="report_text report_scale"><b>M&nbsp;${report_data[i].magnitudeValue.toFixed(1)}</b></div></div><div id="${originTime}_click_box" class="report_click hide"><i id="${originTime}_click_replay" style="color: red;" class="report_click_text fa-regular fa-circle-play fa-2x"></i><i id="${originTime}_click_web" style="${report_data[i].location.startsWith("TREM 人工定位") ? "color: red;" : ""}" class="report_click_text fa fa-globe fa-2x"></i></div></div>`;

			report.addEventListener("mouseenter", () => {
				document.getElementById(`${originTime}_info`).style.visibility = "hidden";
				document.getElementById(`${originTime}_click_box`).className = "report_click";
			});
			report.addEventListener("mouseleave", () => {
				document.getElementById(`${originTime}_info`).style.visibility = "visible";
				document.getElementById(`${originTime}_click_box`).className = "report_click hide";
			});
			if (!report_data[i].location.startsWith("TREM 人工定位")) {
				const cwb_code = "EQ"
						+ report_data[i].earthquakeNo
						+ "-"
						+ (originTime.getMonth() + 1 < 10 ? "0" : "") + (originTime.getMonth() + 1)
						+ (originTime.getDate() < 10 ? "0" : "") + originTime.getDate()
						+ "-"
						+ (originTime.getHours() < 10 ? "0" : "") + originTime.getHours()
						+ (originTime.getMinutes() < 10 ? "0" : "") + originTime.getMinutes()
						+ (originTime.getSeconds() < 10 ? "0" : "") + originTime.getSeconds();
				report.addEventListener("click", () => {
					shell.openExternal(`https://www.cwb.gov.tw/V8/C/E/EQ/${cwb_code}.html`);
				});
			}
		}
		report_list.appendChild(report);
	}
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
			const pga = 12.44 * Math.exp(1.33 * data.Scale) * Math.pow(dist, -1.837) * info.site;
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