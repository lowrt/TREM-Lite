const currentWindow = BrowserWindow.getFocusedWindow();
if (currentWindow.title == "TREM-Lite")
    setInterval(() => {
        document.getElementById("version").innerHTML = app.getVersion() + " " + (Date.now() - ServerT) + "ms";
    }, 500);
console.log("OK");