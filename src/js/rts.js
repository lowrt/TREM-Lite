/* eslint-disable no-undef */
const colors = {
	"1" : 1,
	"2" : 6,
	"3" : 3,
};

setInterval(() => show_rts_box(colors), 1000);

function show_rts_box(_colors) {
	const _colors_ = {};
	Object.keys(_colors).forEach(key => {
		if (_colors[key] > 3) _colors_[key] = "#FF0000";
		else if (_colors[key] > 1) _colors_[key] = "#F9F900";
		else _colors_[key] = "#28FF28";
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