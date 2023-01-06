/* eslint-disable no-undef */
function Now() {
	return new Date(ServerTime + (Date.now() - ServerT));
}

function int_to_intensity(int) {
	const list = ["?", "1", "2", "3", "4", "5⁻", "5⁺", "6⁻", "6⁺", "7"];
	return list[int];
}

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