function pow(int) {
	return Math.pow(int, 2);
}

function ver_string_to_int(ver) {
	if (ver.includes("-")) ver = ver.split("-")[0].replaceAll(".", "");
	else ver = ver.replaceAll(".", "");
	return Number(ver);
}