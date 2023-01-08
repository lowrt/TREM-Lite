/* eslint-disable no-undef */
const tw_geojson = JSON.parse(fs.readFileSync("./resource/data/tw_town.json").toString());

function get_data(data) {
	if (data.Function == "RTS")
		on_rts_data(data);
	else
		console.log(data);
}

function on_eew(data) {
	if (!Object.keys(TREM.EQ_list).length) {
		document.getElementById("detection_location_1").innerHTML = "";
		document.getElementById("detection_location_2").innerHTML = "";
		$(".rts_hide").css("visibility", "hidden");
	}
	const _distance = [];
	for (let index = 0; index < 1002; index++)
		_distance[index] = _speed(data.Depth, index);
	if (!TREM.EQ_list[data.ID]) {
		TREM.EQ_list[data.ID] = {
			data,
			eew   : {},
			alert : false,
			wave  : _distance,
		};
		TREM.audio.main.push("EEW");
	} else {
		TREM.EQ_list[data.ID].data = data;
		TREM.EQ_list[data.ID].wave = _distance;
		TREM.EQ_list[data.ID].p_wave.setLatLng([data.NorthLatitude, data.EastLongitude]);
		TREM.EQ_list[data.ID].s_wave.setLatLng([data.NorthLatitude, data.EastLongitude]);
		TREM.audio.minor.push("Update");
	}
	TREM.EQ_list[data.ID].data.NorthLatitude = Number(TREM.EQ_list[data.ID].data.NorthLatitude);
	TREM.EQ_list[data.ID].data.EastLongitude = Number(TREM.EQ_list[data.ID].data.EastLongitude);
	const location_intensity = {};
	for (let _i = 0; _i < Object.keys(TREM.EQ_list).length; _i++) {
		const _key = Object.keys(TREM.EQ_list)[_i];
		const eew = eew_location_intensity(TREM.EQ_list[_key].data);
		for (let i = 0; i < Object.keys(eew).length; i++) {
			const key = Object.keys(eew)[i];
			if (key != "max_pga") {
				const intensity = pga_to_intensity(eew[key].pga);
				if ((location_intensity[key] ?? 0) < intensity) location_intensity[key] = intensity;
			}
		}
		if (pga_to_intensity(eew.max_pga) > 4 && !TREM.alert) {
			TREM.alert = true;
			TREM.audio.main.push("EEW2");
		}
	}
	eew_timestamp = 0;

	let epicenterIcon;

	if (Object.keys(TREM.EQ_list).length > 1) {
		const cursor = Object.keys(TREM.EQ_list);
		for (let i = 0; i < cursor.length; i++) {
			const num = i + 1;
			const _data = TREM.EQ_list[cursor[i]].data;
			epicenterIcon = L.icon({
				iconUrl   : `../resource/images/cross${num}.png`,
				iconSize  : [40, 40],
				className : "flash",
			});
			let offsetX = 0;
			let offsetY = 0;
			if (num == 1) offsetY = 0.03;
			else if (num == 2) offsetX = 0.03;
			else if (num == 3) offsetY = -0.03;
			else if (num == 4) offsetX = -0.03;
			if (TREM.EQ_list[_data.ID].epicenterIcon) {
				TREM.EQ_list[_data.ID].epicenterIcon.setIcon(epicenterIcon);
				TREM.EQ_list[_data.ID].epicenterIcon.setLatLng([_data.NorthLatitude + offsetY, _data.EastLongitude + offsetX]);
			} else
				TREM.EQ_list[_data.ID].epicenterIcon = L.marker([_data.NorthLatitude + offsetY, _data.EastLongitude + offsetX], { icon: epicenterIcon, zIndexOffset: 6000 }).addTo(TREM.Maps.main);
		}
	} else
	if (TREM.EQ_list[data.ID].epicenterIcon)
		TREM.EQ_list[data.ID].epicenterIcon.setLatLng([data.NorthLatitude, data.EastLongitude ]);
	else {
		epicenterIcon = L.icon({
			iconUrl   : "../resource/images/cross.png",
			iconSize  : [30, 30],
			className : "flash",
		});
		TREM.EQ_list[data.ID].epicenterIcon = L.marker([data.NorthLatitude, data.EastLongitude], { icon: epicenterIcon, zIndexOffset: 6000 }).addTo(TREM.Maps.main);
	}

	if (TREM.geojson) TREM.geojson.remove();
	TREM.geojson = L.geoJson.vt(tw_geojson, {
		minZoom   : 4,
		maxZoom   : 12,
		tolerance : 20,
		buffer    : 256,
		debug     : 0,
		zIndex    : 5,
		style     : (args) => {
			const name = args.COUNTYNAME + " " + args.TOWNNAME;
			const intensity = location_intensity[name];
			const color = (!intensity) ? "transparent" : int_to_color(intensity);
			return {
				color       : "#6A6F75",
				weight      : 0.4,
				fillColor   : color,
				fillOpacity : 1,
			};
		},
	}).addTo(TREM.Maps.main);
}