/* eslint-disable no-undef */
document.getElementById("setting_message").innerHTML = get_lang_string("setting.message");
document.getElementById("setting_graphics").innerHTML = get_lang_string("setting.graphics");
document.getElementById("setting_sound_effects").innerHTML = get_lang_string("setting.sound-effects");
document.getElementById("setting_language").innerHTML = get_lang_string("setting.language");
document.getElementById("setting_plug_in").innerHTML = get_lang_string("setting.plug-in");
document.getElementById("setting_about").innerHTML = get_lang_string("setting.about");
document.getElementById("client-version").innerHTML = app.getVersion();
document.getElementById("client-uuid").title = `${localStorage.UUID}`;
document.getElementById("client-uuid").addEventListener("click", () => {
    navigator.clipboard.writeText(localStorage.UUID).then(() => {
        console.log(localStorage.UUID);
        console.log("複製成功");
    });
});