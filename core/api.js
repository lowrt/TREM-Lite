/* eslint-disable no-undef */
const win = BrowserWindow.fromId(process.env.window * 1);
let replay = 0;
let replayT = 0;
const PostAddressIP = "https://exptech.com.tw/api/v1/trem/replay";

let report_data = {};

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
			console.log(err);
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
			setTimeout(() => refresh_report_list(true), 3000);
			return;
		}
	}
	if (data.Function == "report") {
		report_data.unshift(data.raw);
		if (TREM.report_time != 0) {
			const epicenterIcon = L.icon({
				iconUrl   : "../resource/images/cross.png",
				iconSize  : [30, 30],
			});
			if (TREM.report_epicenterIcon) TREM.report_epicenterIcon.remove();
			TREM.report_epicenterIcon = L.marker([data.NorthLatitude, data.EastLongitude], { icon: epicenterIcon, zIndexOffset: 6000 }).addTo(TREM.Maps.main);
		}
	}
	const report_list = document.getElementById("report_list");
	report_list.innerHTML = "";
	const IsPalert = (data.Function == "palert") ? true : false;
	for (let i = (IsPalert) ? -1 : 0; i < report_data.length; i++) {
		if (replay != 0 && new Date(report_data[i].originTime).getTime() > new Date(replay + (NOW.getTime() - replayT)).getTime()) return;
		const report = document.createElement("div");
		report.className = "report";
		report.id = i;
		if (i == -1) {
			const report_text_intensity = document.createElement("div");
			report_text_intensity.className = `report_text report_intensity intensity_${data.Data.data[0].intensity}`;
			report_text_intensity.style = `font-size: ${(data.Data.data[0].intensity > 4 && data.Data.data[0].intensity != 7) ? "50" : "60"}px;`;
			report_text_intensity.innerHTML = `${data.Data.data[0].intensity}`;
			const report_text_box = document.createElement("div");
			report_text_box.className = "report_text_box";
			const report_text = document.createElement("div");
			report_text.className = "report_text";
			report_text.style = "font-size: 22px;";
			report_text.innerHTML = "<b>震源 調查中</b>";
			const report_text_time = document.createElement("div");
			report_text_time.className = "report_text";
			report_text_time.style = "font-size: 15px;";
			report_text_time.innerHTML = `${data.Data.time}`;
			report_text_box.append(report_text, report_text_time);
			report.append(report_text_intensity, report_text_box);
		} else {
			const originTime = new Date((new Date(`${report_data[i].originTime} GMT+08:00`)).toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
			const intensity = report_data[i].data[0]?.areaIntensity ?? 0;
			const time = report_data[i].originTime.substring(0, 16);
			const cwb_code = "EQ"
				+ report_data[i].earthquakeNo
				+ "-"
				+ (originTime.getMonth() + 1 < 10 ? "0" : "") + (originTime.getMonth() + 1)
				+ (originTime.getDate() < 10 ? "0" : "") + originTime.getDate()
				+ "-"
				+ (originTime.getHours() < 10 ? "0" : "") + originTime.getHours()
				+ (originTime.getMinutes() < 10 ? "0" : "") + originTime.getMinutes()
				+ (originTime.getSeconds() < 10 ? "0" : "") + originTime.getSeconds();
			let loc = report_data[i].location;
			loc = loc.substring(loc.indexOf("(") + 3, loc.indexOf(")"));
			const resize = (intensity > 4 && intensity != 7) ? true : false;
			const intensity_level = (intensity == 0) ? "--" : int_to_intensity(intensity);
			if (i == 0 && !IsPalert) {
				const report_info = document.createElement("div");
				report_info.className = "report_item";
				report_info.id = `${originTime.getTime()}_info`;
				const report_text = document.createElement("div");
				report_text.className = `report_text report_intensity intensity_${intensity}`;
				report_text.style = `font-size: ${(resize) ? "50" : "60"}px;`;
				report_text.innerHTML = `${intensity_level}`;
				const report_text_box = document.createElement("div");
				report_text_box.className = "report_text_box";
				const report_text_loc = document.createElement("div");
				report_text_loc.className = "report_text";
				report_text_loc.style = "font-size: 22px;";
				report_text_loc.innerHTML = `<b>${loc}</b>`;
				const report_text_time = document.createElement("div");
				report_text_time.className = "report_text";
				report_text_time.style = "font-size: 15px;";
				report_text_time.innerHTML = `${time}`;
				const report_text_magnitudeValue_depth = document.createElement("div");
				report_text_magnitudeValue_depth.style = "display: flex;";
				const report_text_magnitudeValue = document.createElement("div");
				report_text_magnitudeValue.className = "report_text";
				report_text_magnitudeValue.innerHTML = `<b>M&nbsp;${report_data[i].magnitudeValue.toFixed(1)}</b>`;
				const report_text_depth = document.createElement("div");
				report_text_depth.className = "report_text report_scale";
				report_text_depth.style = "width: 100%;text-align: right;";
				report_text_depth.innerHTML = `${get_lang_string("word.depth")}:&nbsp;<b>${report_data[i].depth}</b>&nbsp;km`;
				report_text_magnitudeValue_depth.append(report_text_magnitudeValue, report_text_depth);
				report_text_box.append(report_text_loc, report_text_time, report_text_magnitudeValue_depth);
				report_info.append(report_text, report_text_box);
				const report_click_box = document.createElement("div");
				report_click_box.className = "report_click hide";
				report_click_box.id = `${originTime.getTime()}_click_box`;
				const report_click_replay = document.createElement("i");
				report_click_replay.className = "report_click_text fa-regular fa-circle-play fa-2x";
				report_click_replay.id = `${originTime.getTime()}_click_replay`;
				report_click_replay.style = "color: red;";
				const report_click_web = document.createElement("i");
				report_click_web.className = "report_click_text fa fa-globe fa-2x";
				report_click_web.id = `${originTime.getTime()}_click_web`;
				if (!report_data[i].location.startsWith("TREM 人工定位"))
					report_click_web.addEventListener("click", () => {
						shell.openExternal(`https://www.cwb.gov.tw/V8/C/E/EQ/${cwb_code}.html`);
					});
				else report_click_web.style = "color: red;";
				report_click_box.append(report_click_replay, report_click_web);
				report.append(report_info, report_click_box);
			} else {
				const report_info = document.createElement("div");
				report_info.className = "report_item";
				report_info.id = `${originTime.getTime()}_info`;
				const report_text = document.createElement("div");
				report_text.className = `report_text report_intensity intensity_${intensity}`;
				report_text.style = `font-size: ${(resize) ? "35" : "40"}px;max-width: 55px;`;
				report_text.innerHTML = `${intensity_level}`;
				const report_text_box = document.createElement("div");
				report_text_box.className = "report_text_box";
				const report_text_loc = document.createElement("div");
				report_text_loc.className = "report_text";
				report_text_loc.innerHTML = `<b>${loc}</b>`;
				const report_text_time = document.createElement("div");
				report_text_time.className = "report_text";
				report_text_time.style = "font-size: 15px;";
				report_text_time.innerHTML = `${time}`;
				const report_text_magnitudeValue = document.createElement("div");
				report_text_magnitudeValue.className = "report_text report_scale";
				report_text_magnitudeValue.innerHTML = `<b>M&nbsp;${report_data[i].magnitudeValue.toFixed(1)}</b>`;
				report_text_box.append(report_text_loc, report_text_time);
				report_info.append(report_text, report_text_box, report_text_magnitudeValue);
				const report_click_box = document.createElement("div");
				report_click_box.className = "report_click hide";
				report_click_box.id = `${originTime.getTime()}_click_box`;
				const report_click_replay = document.createElement("i");
				report_click_replay.className = "report_click_text fa-regular fa-circle-play fa-2x";
				report_click_replay.id = `${originTime.getTime()}_click_replay`;
				if (report_data[i].ID.length != 0)
					report_click_replay.addEventListener("click", () => {
						localStorage.TestID = report_data[i].ID;
						testEEW();
					});
				else report_click_replay.style = "color: red;";
				const report_click_web = document.createElement("i");
				report_click_web.className = "report_click_text fa fa-globe fa-2x";
				report_click_web.id = `${originTime.getTime()}_click_web`;
				if (!report_data[i].location.startsWith("TREM 人工定位"))
					report_click_web.addEventListener("click", () => {
						shell.openExternal(`https://www.cwb.gov.tw/V8/C/E/EQ/${cwb_code}.html`);
					});
				else report_click_web.style = "color: red;";
				report_click_box.append(report_click_replay, report_click_web);
				report.append(report_info, report_click_box);
			}
			report.addEventListener("mouseenter", () => {
				document.getElementById(`${originTime.getTime()}_click_box`).style.height = $(`#${originTime.getTime()}_info`).height();
				document.getElementById(`${originTime.getTime()}_info`).className = "hide";
				document.getElementById(`${originTime.getTime()}_click_box`).className = "report_click";
			});
			report.addEventListener("mouseleave", () => {
				document.getElementById(`${originTime.getTime()}_info`).className = "report_item";
				document.getElementById(`${originTime.getTime()}_click_box`).className = "report_click hide";
			});
		}
		report_list.appendChild(report);
	}
}

function testEEW(){
	if (localStorage.TestID != undefined) {
		const list = localStorage.TestID.split(",");
		for (let index = 0; index < list.length; index++)
			setTimeout(() => {
				const data = {
					method  : "POST",
					headers : { "content-type": "application/json" },
					body    : JSON.stringify({
						UUID : localStorage.UUID,
						ID   : list[index],
					}),
				};
				fetch(PostAddressIP, data)
					.then((ans) => console.log(ans))
					.catch((err) => {
						console.error(err);
					});
			}, 100);
		delete localStorage.TestID;
		console.log("testEEW OK");
	} else {
		const data = {
			method  : "POST",
			headers : { "content-type": "application/json" },
			body    : JSON.stringify({
				UUID   : localStorage.UUID,
			}),
		};
		fetch(PostAddressIP, data)
			.catch((err) => {
				console.error(err);
			});
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