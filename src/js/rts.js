/* eslint-disable no-undef */
get_station_info();
setInterval(get_station_info, constant.STATION_INFO_FETCH_TIME);

function get_station_info() {
	console.log("[Fetch] Fetching station data...");
	let retryCount = 0;
	const retryClock = setInterval(async () => {
		retryCount++;

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), constant.API_HTTP_TIMEOUT);
		try {
			const data = await api.getStations();

			if (data) {
				console.log("[Fetch] Got station data");
				variable.station_info = data;
				clearInterval(retryClock);
			}
		} catch (err) {
			console.error(`[Fetch] ${err} (Try #${retryCount})`);
		}

		if (retryCount >= 5) {
			console.warn("[Fetch] Given up retrying.");
			clearInterval(retryClock);
		}
	}, constant.API_HTTP_RETRY);
}

function show_rts_box(_colors) {
	const _colors_ = {};
	Object.keys(_colors).forEach(key => {
		if (_colors[key] > 3) _colors_[key] = "#FF0000";
		else if (_colors[key] > 1) _colors_[key] = "#F9F900";
		else _colors_[key] = "#28FF28";
	});
	constant.BOX_GEOJSON.features.sort((a, b) => {
		const colorA = _colors_[a.properties.id] || "other";
		const colorB = _colors_[b.properties.id] || "other";
		const priorityA = constant.COLOR_PRIORITY[colorA] != undefined ? constant.COLOR_PRIORITY[colorA] : 3;
		const priorityB = constant.COLOR_PRIORITY[colorB] != undefined ? constant.COLOR_PRIORITY[colorB] : 3;
		return priorityB - priorityA;
	});
	const geojsonLayer = L.geoJson.vt(constant.BOX_GEOJSON, {
		style : (properties) => ({ weight: 3, fillColor: "transparent", color: _colors_[properties.id] || "transparent" }),
		pane  : "detection",
	}).addTo(variable.map);
	setTimeout(() => geojsonLayer.remove(), 500);
}

function show_rts_dot(data) {
	if (!variable.station_info) return;

	const iconSize = [10, 10];

	for (const id of Object.keys(data.station)) {
		const intensityClass = `pga_dot pga_${data.station[id].i.toString().replace(".", "_")}`;
		const icon = L.divIcon({
			className : intensityClass,
			html      : "<span></span>",
			iconSize  : iconSize,
		});

		const info = variable.station_info[id].info[variable.station_info[id].info.length - 1];

		let loc = region_code_to_string(constant.REGION, info.code);

		if (!loc) loc = "未知區域";
		else loc = `${loc.city}${loc.town}`;

		const station_text = `<div class='report_station_box'><div><span class="tooltip-location">${loc}</span><span class="tooltip-uuid">${id} | ${variable.station_info[id].net}</span></div><div class="tooltip-fields"><div><span class="tooltip-field-name">加速度(cm/s²)</span><span class="tooltip-field-value">${data.station[id].pga.toFixed(1)}</span></div><div><span class="tooltip-field-name">速度(cm/s)</span><span class="tooltip-field-value">${data.station[id].pgv.toFixed(1)}</span></div><div><span class="tooltip-field-name">震度</span><span class="tooltip-field-value">${data.station[id].i.toFixed(1)}</span></div></div></div>`;

		if (!variable.station_icon[id])
			variable.station_icon[id] = L.marker([info.lat, info.lon], { icon: icon })
				.bindTooltip(station_text, { opacity: 1 })
				.addTo(variable.map);
		else
			if (variable.station_icon[id].options.icon.options.className != intensityClass) {
				variable.station_icon[id].setIcon(icon);
				variable.station_icon[id].setTooltipContent(station_text);
			}
	}
}