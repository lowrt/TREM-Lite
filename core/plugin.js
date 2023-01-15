/* eslint-disable no-undef */
if (localStorage.plugin != "off")
	fs.readdirSync(path.join(app.getAppPath(), "./resource/plugin/")).forEach((file, i, arr) => {
		try {
			dynamicLoadJs(path.parse(file).name, () => {console.log(`${path.parse(file).name}加載成功`);});
		} catch (err) {
			console.error(err);
		}
	});