/* eslint-disable no-undef */
function parseJSON(jsonString) {
	try {
		return JSON.parse(jsonString);
	} catch (err) {
		return null;
	}
}

function getRandomElement(arr) {
	const randomIndex = Math.floor(Math.random() * arr.length);
	return arr[randomIndex];
}

function now() {
	return Date.now() + variable.time_offset;
}

function formatTwoDigits(n) {
	return n < 10 ? "0" + n : n;
}

function generateMD5(input) {
	return crypto.createHash("md5").update(input).digest("hex");
}

function region_code_to_string(region, code) {
	for (const city of Object.keys(region))
		for (const town of Object.keys(region[city]))
			if (region[city][town].code == code)
				return { city, town };
	return null;
}

function region_string_to_code(region, city, town) {
	if (region[city][town]) return region[city][town].code;
	return null;
}

function formatTime(timestamp) {
	const date = new Date(timestamp);
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");
	const seconds = date.getSeconds().toString().padStart(2, "0");

	return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

function findClosest(arr, target) {
	return arr.reduce((prev, curr) => (Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev));
}

function pow(num) {
	return Math.pow(num, 2);
}

function eew_area_pga(lat, lon, depth, mag) {
	const json = {};
	let eew_max_i = 0;
	for (const city of Object.keys(constant.REGION))
		for (const town of Object.keys(constant.REGION[city])) {
			const info = constant.REGION[city][town];
			const dist_surface = dis(lat, lon, info.lat, info.lon);
			const dist = Math.sqrt(pow(dist_surface) + pow(depth));
			const pga = 1.657 * Math.pow(Math.E, (1.533 * mag)) * Math.pow(dist, -1.607);
			let i = pga_to_float(pga);
			if (i > 3) i = eew_area_pgv([lat, lon], [lat, lon], depth, mag);
			if (i > eew_max_i) eew_max_i = i;
			json[`${city} ${town}`] = { dist, i };
		}
	json.max_i = eew_max_i;
	return json;
}

function eew_location_info(data) {
	const dist_surface = dis(data.lat, data.lon, TREM.user.lat, TREM.user.lon);
	const dist = Math.sqrt(pow(dist_surface) + pow(data.depth));
	const pga = 1.657 * Math.pow(Math.E, (1.533 * data.scale)) * Math.pow(dist, -1.607) * (storage.getItem("site") ?? 1.751);
	let i = pga_to_float(pga);
	if (i > 3) i = eew_i([data.lat, data.lon], [TREM.user.lat, TREM.user.lon], data.depth, data.scale);
	return { dist, i };
}

function eew_area_pgv(epicenterLocaltion, pointLocaltion, depth, magW) {
	const long = 10 ** (0.5 * magW - 1.85) / 2;
	const epicenterDistance = dis(epicenterLocaltion[0], epicenterLocaltion[1], pointLocaltion[0], pointLocaltion[1]);
	const hypocenterDistance = (depth ** 2 + epicenterDistance ** 2) ** 0.5 - long;
	const x = Math.max(hypocenterDistance, 3);
	const gpv600 = 10 ** (0.58 * magW + 0.0038 * depth - 1.29 - Math.log10(x + 0.0028 * (10 ** (0.5 * magW))) - 0.002 * x);
	const pgv400 = gpv600 * 1.31;
	const pgv = pgv400 * 1.0;
	return 2.68 + 1.72 * Math.log10(pgv);
}

function dis(latA, lngA, latB, lngB) {
	latA = latA * Math.PI / 180;
	lngA = lngA * Math.PI / 180;
	latB = latB * Math.PI / 180;
	lngB = lngB * Math.PI / 180;
	const sin_latA = Math.sin(Math.atan(Math.tan(latA)));
	const sin_latB = Math.sin(Math.atan(Math.tan(latB)));
	const cos_latA = Math.cos(Math.atan(Math.tan(latA)));
	const cos_latB = Math.cos(Math.atan(Math.tan(latB)));
	return Math.acos(sin_latA * sin_latB + cos_latA * cos_latB * Math.cos(lngA - lngB)) * 6371.008;
}

function pga_to_float(pga) {
	return 2 * Math.log10(pga) + 0.7;
}

function pga_to_intensity(pga) {
	return intensity_float_to_int(pga_to_float(pga));
}

function intensity_float_to_int(float) {
	return (float < 0) ? 0 : (float < 4.5) ? Math.round(float) : (float < 5) ? 5 : (float < 5.5) ? 6 : (float < 6) ? 7 : (float < 6.5) ? 8 : 9;
}

function int_to_color(int) {
	const list = ["#202020", "#003264", "#0064C8", "#1E9632", "#FFC800", "#FF9600", "#FF6400", "#FF0000", "#C00000", "#9600C8"];
	return list[int];
}

class ElementBuilder {
	constructor(data = {}) {
		if (typeof data == "string") this.element = document.createElement(data);
		else {
			this.element = document.createElement(data.tag ?? "div");

			if ("id" in data) this.element.id = data.id;

			if ("class" in data)
				if (Array.isArray(data.class))
					for (const className of data.class) this.element.classList.add(className);
				else if (typeof data.class == "string") this.element.className = data.class;

			if ("attributes" in data)
				for (const key in data.attributes) this.element.setAttribute(key, data.attributes[key]);
		}
	}

	setId(id) {
		this.element.id = id;
		return this;
	}

	setClass(data) {
		if (Array.isArray(data)) this.element.className = data.join(" ");
		else if (typeof data == "string") this.element.className = data;
		return this;
	}

	addClass(data) {
		if (Array.isArray(data))
			for (const className of data) this.element.classList.add(className);
		else if (typeof data == "string") this.element.classList.add(data);
		return this;
	}

	removeClass(data) {
		if (Array.isArray(data))
			for (const className of data) this.element.classList.remove(className);
		else if (typeof data == "string") this.element.classList.remove(data);
		return this;
	}

	hasClass(className) {
		return this.element.classList.contains(className);
	}

	setContent(content) {
		this.element.textContent = content;
		return this;
	}

	setAttribute(key, value) {
		this.element.setAttribute(key, value);
		return this;
	}

	setDisabled(state) {
		this.element.disabled = state;
		return this;
	}

	setRequired(required) {
		this.element.required = required;
		return this;
	}

	setStyle(rule, value) {
		this.element.style[rule] = value;
		return this;
	}

	addChildren(children) {
		if (children)
			if (Array.isArray(children))
				for (const child of children)
					if (child instanceof ElementBuilder) this.element.append(child.toElement());
					else this.element.append(child);
			else if (children instanceof ElementBuilder) this.element.append(children.toElement());
			else this.element.append(children);
		return this;
	}

	setChildren(children) {
		this.element.setChildren(children);
	}

	on(eventName, callback, ...args) {
		this.element.addEventListener(eventName, callback.bind(this.element, ...args));
		return this;
	}

	once(eventName, callback, ...args) {
		this.element.addEventListener(eventName, callback.bind(this.element, ...args), { once: true });
		return this;
	}

	toElement() {
		return this.element;
	}
}