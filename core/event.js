/* eslint-disable no-undef */
function on_eew(data) {
	TREM.EQ_list[data.ID] = { data };

	let epicenterIcon;

	if (Object.keys(TREM.EQ_list).length > 1) {
		const cursor = Object.keys(TREM.EQ_list);
		for (let i = 0; i < cursor.length; i++) {
			const num = i + 1;
			const _data = TREM.EQ_list[cursor[i]].data;
			epicenterIcon = L.icon({
				iconUrl   : `../resource/images/cross${num}.png`,
				iconSize  : [40, 40],
				className : "epicenterIcon",
			});
			let offsetX = 0;
			let offsetY = 0;
			if (num == 1) offsetY = 0.03;
			else if (num == 2) offsetX = 0.03;
			else if (num == 3) offsetY = -0.03;
			else if (num == 4) offsetX = -0.03;
			console.log(TREM.EQ_list[_data.ID]?.epicenterIcon != undefined);
			if (TREM.EQ_list[_data.ID]?.epicenterIcon != undefined) {
				console.log(_data.ID);
				TREM.EQ_list[_data.ID].epicenterIcon.setIcon(epicenterIcon);
				TREM.EQ_list[_data.ID].epicenterIcon.setLatLng([+_data.NorthLatitude + offsetY, +_data.EastLongitude + offsetX]);
			} else
				TREM.EQ_list[_data.ID].epicenterIcon = L.marker([+_data.NorthLatitude + offsetY, +_data.EastLongitude + offsetX], { icon: epicenterIcon, zIndexOffset: 6000 }).addTo(TREM.Maps.main);
		}
	} else {
		epicenterIcon = L.icon({
			iconUrl   : "../resource/images/cross.png",
			iconSize  : [30, 30],
			className : "epicenterIcon",
		});
		TREM.EQ_list[data.ID].epicenterIcon = L.marker([data.NorthLatitude, data.EastLongitude], { icon: epicenterIcon, zIndexOffset: 6000 }).addTo(TREM.Maps.main);
	}
}

// setInterval(() => {
// 	console.log(TREM.EQ_list);
// }, 1000);