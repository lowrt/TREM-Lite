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