/* eslint-disable no-undef */
const Speech = require("speak-tts");
const WebSocket = require("ws");
const bytenode = require("bytenode");
const reload = require("require-reload")(require);
const events = require("events");
const plugin = new events.EventEmitter();

const speecd_use = storage.getItem("speecd_use") ?? false;
const speech = new Speech.default();
(async () => {
	await speech.init();
	speech.setLanguage("zh-TW");
	speech.setVoice("Microsoft Zhiwei - Chinese (Traditional, Taiwan)");
	// speech.setLanguage("ja-JP");
	// speech.setVoice("Microsoft Sayaka - Japanese (Japan)");
	speech.setRate(1.8);
})();