/* eslint-disable no-undef */
setInterval(() => get_station_info(), 300000);

get_station_info();

async function get_station_info() {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 1500);
	try {
		const response = await fetch("https://data.exptech.com.tw/file/resource/station.json", { signal: controller.signal });
		clearTimeout(timeoutId);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		variable.station_info = await response.json();
	} catch (err) {
		clearTimeout(timeoutId);
		setTimeout(() => get_station_info(), 500);
	}
}

function show_rts_box(_colors) {
	const _colors_ = {};
	Object.keys(_colors).forEach(key => {
		if (_colors[key] > 3) _colors_[key] = "#FF0000";
		else if (_colors[key] > 1) _colors_[key] = "#F9F900";
		else _colors_[key] = "#28FF28";
	});
	box_geojson.features.forEach(feature => feature.properties = {
		id: feature.id,
	});
	box_geojson.features.sort((a, b) => {
		const colorA = _colors_[a.properties.id] || "other";
		const colorB = _colors_[b.properties.id] || "other";
		const priorityA = constant.COLOR_PRIORITY[colorA] != undefined ? constant.COLOR_PRIORITY[colorA] : 3;
		const priorityB = constant.COLOR_PRIORITY[colorB] != undefined ? constant.COLOR_PRIORITY[colorB] : 3;
		return priorityB - priorityA;
	});
	const geojsonLayer = L.geoJson.vt(box_geojson, {
		style: (properties) => ({ weight: 3, fillColor: "transparent", color: _colors_[properties.id] || "transparent" }),
	}).addTo(variable.map);
	setTimeout(() => geojsonLayer.remove(), 500);
}

function show_rts_dot(data) {
	console.log(data);
	const iconSize = [10, 10];

	for (const id of Object.keys(data.station)) {
		const intensityClass = `pga_dot pga_${data.station[id].i.toString().replace(".", "_")}`;
		const icon = L.divIcon({
			className : intensityClass,
			html      : "<span></span>",
			iconSize  : iconSize,
		});

		const info = variable.station_info[id].info[variable.station_info[id].info.length - 1];

		const station_text = `<div class='report_station_box'><div><span class="tooltip-location">臺南</span><span class="tooltip-uuid">${id} | ${variable.station_info[id].net}</span></div><div class="tooltip-fields"><div><span class="tooltip-field-name">加速度(cm/s²)</span><span class="tooltip-field-value">${data.station[id].pga.toFixed(1)}</span></div><div><span class="tooltip-field-name">速度(cm/s)</span><span class="tooltip-field-value">${data.station[id].pgv.toFixed(1)}</span></div><div><span class="tooltip-field-name">震度</span><span class="tooltip-field-value">${data.station[id].i.toFixed(1)}</span></div></div></div>`;

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

// L.GradientCircle = L.Circle.extend({
// 	options: {
// 		gradientColors: ["rgba(255, 0, 0, 1)", "rgba(255, 0, 0, 0)"],
// 	},

// 	_updatePath: function() {
// 		if (this._renderer && this._renderer._updateGradientCircle)
// 			this._renderer._updateGradientCircle(this);

// 	},
// });

// L.gradientCircle = function(latlng, options) {
// 	return new L.GradientCircle(latlng, options);
// };

// L.Canvas.include({
// 	_updateGradientCircle: function(layer) {
// 		if (!this._drawing || layer._empty()) return;

// 		const p = layer._point,
// 			ctx = this._ctx,
// 			r = Math.max(Math.round(layer._radius), 1),
// 			s = (Math.max(Math.round(layer._radiusY), 1) || r) / r;

// 		if (s != 1) {
// 			ctx.save();
// 			ctx.scale(1, s);
// 		}

// 		ctx.beginPath();
// 		ctx.arc(p.x, p.y / s, r, 0, Math.PI * 2, false);

// 		const gradient = ctx.createRadialGradient(p.x, p.y / s, r * 0.3, p.x, p.y / s, r);
// 		gradient.addColorStop(0, layer.options.gradientColors[0]);
// 		gradient.addColorStop(1, layer.options.gradientColors[1]);

// 		ctx.fillStyle = gradient;
// 		ctx.fill();
// 		if (s != 1) ctx.restore();
// 	},
// });

// let dist = 0;
// const time = Date.now();
// let lock = false;

// const c_l = L.gradientCircle([22, 121], {
// 	radius         : dist,
// 	gradientColors : ["rgba(255, 0, 0, 0)", "rgba(255, 0, 0, 0.6)"],
// 	pane           : "circlePane",
// }).addTo(variable.map);

// const c = L.circle([22, 121], {
// 	color     : "red",
// 	fillColor : "transparent",
// 	radius    : dist,
// 	weight    : 2,
// }).addTo(variable.map);

// const c_l_2 = L.gradientCircle([21, 120], {
// 	radius         : dist,
// 	gradientColors : ["rgba(255, 0, 0, 0)", "rgba(255, 0, 0, 0.6)"],
// 	pane           : "circlePane",
// }).addTo(variable.map);

// const c_2 = L.circle([21, 120], {
// 	color     : "red",
// 	fillColor : "transparent",
// 	radius    : dist,
// 	weight    : 2,
// }).addTo(variable.map);

// setInterval(() => {
// 	if (lock) return;
// 	lock = true;
// 	dist = (Date.now() - time) * 4;
// 	c.setRadius(dist);
// 	c_l.setRadius(dist);
// 	c_2.setRadius(dist);
// 	c_l_2.setRadius(dist);
// 	lock = false;
// }, 0);