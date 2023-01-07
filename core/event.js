/* eslint-disable no-undef */
const tw_geojson = JSON.parse(fs.readFileSync("./resource/data/tw_town.json").toString());

function get_data(data) {
	if (data.Function == "RTS")
		on_rts_data(data);
	else
		console.log(data);
}

function on_eew(data) {
	if (!Object.keys(TREM.EQ_list).length) $(".rts_hide").css("visibility", "hidden");
	if (TREM.EQ_list[data.ID]?.epicenterIcon) TREM.EQ_list[data.ID].epicenterIcon.remove();
	if (!TREM.EQ_list[data.ID]) {
		TREM.EQ_list[data.ID] = {
			data,
			eew   : {},
			alert : false,
		};
		TREM.audio.main.push("EEW");
	} else TREM.EQ_list[data.ID].data = data;
	TREM.EQ_list[data.ID].eew = eew_location_intensity(data);
	if (pga_to_intensity(TREM.EQ_list[data.ID].eew.max_pga) > 4 && !TREM.EQ_list[data.ID].alert) {
		TREM.EQ_list[data.ID].alert = true;
		TREM.audio.main.push("EEW2");
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
				TREM.EQ_list[_data.ID].epicenterIcon.setLatLng([+_data.NorthLatitude + offsetY, +_data.EastLongitude + offsetX]);
			} else
				TREM.EQ_list[_data.ID].epicenterIcon = L.marker([+_data.NorthLatitude + offsetY, +_data.EastLongitude + offsetX], { icon: epicenterIcon, zIndexOffset: 6000 }).addTo(TREM.Maps.main);
		}
	} else {
		epicenterIcon = L.icon({
			iconUrl   : "../resource/images/cross.png",
			iconSize  : [30, 30],
			className : "flash",
		});
		TREM.EQ_list[data.ID].epicenterIcon = L.marker([data.NorthLatitude, data.EastLongitude], { icon: epicenterIcon, zIndexOffset: 6000 }).addTo(TREM.Maps.main);
	}

	TREM.EQ_list[data.ID].geojson = L.geoJson.vt(tw_geojson, {
		minZoom   : 4,
		maxZoom   : 12,
		tolerance : 20,
		buffer    : 256,
		debug     : 0,
		zIndex    : 5,
		style     : (args) => {
			const name = args.COUNTYNAME + " " + args.TOWNNAME;
			return {
				color       : "#6A6F75",
				weight      : 0.6,
				fillColor   : int_to_color(pga_to_intensity(TREM.EQ_list[data.ID].eew[name].pga)),
				fillOpacity : 1,
			};
		},
	}).addTo(TREM.Maps.main);
	// setTimeout(() => TREM.EQ_list[data.ID].geojson.remove(), 3000);
}