/// <reference path="./report.js" />

/**
 * @param {string} view
 */
const switchView = (view) => {
  let panel, button;
  let isShown = false;

  if (view) {
    panel = document.getElementById(`${view}-panel`);
    button = document.getElementById(`nav-${view}-panel`);
    isShown = panel.classList.contains("show");
  }

  for (const p of document.querySelectorAll(".panel"))
    p.classList.remove("show");

  for (const btn of document.querySelectorAll("nav > .nav-item > button"))
    btn.classList.remove("active");

  if (panel)
    if (!isShown) {
      // from other view
      console.debug(`[View] Switching to ${view}.`);
      panel.classList.add("show");
      button.classList.add("active");

      // behaviour for each view on shown
      switch (view) {
        case "report": {
          variable.map.fitBounds(constant.TAIWAN_BOUNDS, { paddingBottomRight: [200, 0] });
          reportMarkers.reportLayer.addTo(variable.map);
          break;
        }

        case "setting": {
          break;
        }

        default: break;
      }
    } else {
      // toggle view
      console.debug("[View] Toogle view.");
      panel.classList.remove("show");
      button.classList.remove("active");
      hideReportBox();
      variable.map.fitBounds(constant.TAIWAN_BOUNDS);
      reportMarkers.reportLayer.remove();
    }
  else {
    // home
    console.debug("[View] Switching to None.");
    for (const p of document.querySelectorAll(".panel"))
      p.classList.remove("show");

    for (const btn of document.querySelectorAll("nav > .nav-item > button"))
      btn.classList.remove("active");

    ipcRenderer.emit("report:unhide.marker");
  }

};


for (const btn of document.querySelectorAll("nav > .nav-item > button"))
  btn.addEventListener("click", function() {
    switchView(this.getAttribute("data-panel"));
  });