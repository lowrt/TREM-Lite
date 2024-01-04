function parseJSON(jsonString) {
	try {
		return JSON.parse(jsonString);
	} catch (err) {
		return null;
	}
}