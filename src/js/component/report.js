const reportMarkers = {
  intensityLayer : L.featureGroup(),
  reportLayer    : L.featureGroup(),
  report         : [],
  epicenter      : null,
  intensity      : null,
};

const showReportBox = () => document.getElementById("report-box").classList.add("show");

const hideReportBox = () => {
  document.getElementById("report-box").classList.remove("show");

  variable.map.fitBounds(constant.TAIWAN_BOUNDS, { paddingBottomRight: [200, 0] });

  reportMarkers.intensityLayer.remove();
  reportMarkers.intensityLayer.clearLayers();

  if (reportMarkers.epicenter)
    delete reportMarkers.epicenter;

  if (reportMarkers.epicenter)
    delete reportMarkers.intensity;
};

const updateReports = async () => {
  const { reportListItem, reportIntensityItem, reportIntensityItemGroup } = require("../js/helper/factory");
  const { extractLocationFromString, toFormattedTimeString } = require("../js/helper/utils");
  const ElementBuilder = require("../js/class/elementbuilder");

  const reports = await api.getReports(20);

  const reportList = document.getElementById("list-box");

  const frag = new DocumentFragment();
  for (const report of reports) {
    frag.appendChild(
      reportListItem(report)
        .on("click", (() => {
          /**
           * @type {import("../class/api").Report}
           */
          // TODO: Move cache to other place
          let r;

          const updateReportBox = () => {
            document.getElementById("report-box").setAttribute("data-report-id", report.id);
            document.getElementById("report-max-intensity").className = `report-max-intensity intensity-${report.int}`;
            document.getElementById("report-subtitle").textContent = report.no % 1000 ? `編號 ${report.no}` : "小區域有感地震";
            document.getElementById("report-title").textContent = extractLocationFromString(report.loc);
            document.getElementById("report-time").textContent = toFormattedTimeString(report.time);
            document.getElementById("report-location").textContent = report.loc.substring(0, report.loc.indexOf("(")).trim();
            document.getElementById("report-longitude").textContent = report.lon;
            document.getElementById("report-latitude").textContent = report.lat;
            document.getElementById("report-magnitude").textContent = report.mag;
            document.getElementById("report-depth").textContent = report.depth;
            document.getElementById("report-intensity-grouped").replaceChildren();
            document.getElementById("report-intensity-all").replaceChildren();
          };

          const convertIntensityList = () => {
            const intList = [];
            for (const area in r.list) {
              const town = [];
              for (const station in r.list[area].town)
                town.push({ ...r.list[area].town[station], name: station });
              town.sort((a, b) => b.int - a.int);
              intList.push({ ...r.list[area], name: area, town });
            }

            r.list = intList.sort((a, b) => b.int - a.int);
          };

          const updateReportIntensityList = () => {
            const grouped = new DocumentFragment();

            for (const area of r.list)
              grouped.appendChild(reportIntensityItemGroup(area)
                .on("click", function() {
                  const isCollapsed = !this.classList.contains("expanded");
                  for (const station in reportMarkers.intensity[this.getAttribute("data-area")]) {
                    const marker = reportMarkers.intensity[this.getAttribute("data-area")][station];
                    if (isCollapsed)
                      marker._icon.classList.add("collapsed");
                    else
                      marker._icon.classList.remove("collapsed");
                  }
                }).toElement());

            document.getElementById("report-intensity-grouped").replaceChildren(grouped);

            // -- all intensity

            const intListAll = r.list.reduce((acc, area) => (acc.push(...area.town.map(t => ({ ...t, station: t.name, name: area.name }))), acc), []).sort((a, b) => b.int - a.int);
            const all = new DocumentFragment();

            for (const station of intListAll)
              all.appendChild(reportIntensityItem(station)
                .addChildren(new ElementBuilder("span")
                  .setClass(["report-intensity-item-station"])
                  .setContent(station.station))
                .toElement());

            document.getElementById("report-intensity-all").replaceChildren(all);
          };

          const addMapMarkers = () => {
            reportMarkers.epicenter = L.marker([report.lat, report.lon], {
              icon: L.icon({
                iconUrl  : "../resource/image/cross.png",
                iconSize : [40 + variable.icon_size * 3, 40 + variable.icon_size * 3],
              }),
              zIndexOffset: 2000,
            });

            reportMarkers.intensity = {};
            for (const area of r.list) {
              reportMarkers.intensity[area.name] = {};

              for (const station of area.town) {
                reportMarkers.intensity[area.name][station.name] = L.marker([station.lat, station.lon], {
                  icon: L.divIcon({
                    className : `report-intensity-marker intensity-${station.int}`,
                    iconSize  : [16, 16],
                  }),
                  zIndexOffset: 1500 + station.int,
                });
                reportMarkers.intensityLayer.addLayer(reportMarkers.intensity[area.name][station.name]);
              }
            }

            reportMarkers.intensityLayer.addLayer(reportMarkers.epicenter).addTo(variable.map);

            const bounds = reportMarkers.intensityLayer.getBounds();
            const zoom = variable.map.getBoundsZoom(bounds);
            variable.map.fitBounds(bounds.pad(zoom ** 2 / 800), { paddingBottomRight: [200, 0] });
          };

          return async function() {
            try {
              updateReportBox();
              showReportBox();

              if (!r) {
                r = await api.getReport(this.id);
                convertIntensityList();
              }

              addMapMarkers();
              updateReportIntensityList();

            } catch (error) {
              console.error(error);
              hideReportBox();
            }
          };
        })())
        .toElement());


    if (!(report.id in reportMarkers.report)) {
      reportMarkers.report[report.id] = L.marker([report.lat, report.lon], {
        icon: L.icon({
          iconUrl   : "../resource/image/cross.png",
          iconSize  : [24 * (report.int / 2), 24 * (report.int / 2)],
          className : "report-marker",
        }),
        zIndexOffset: 2000,
      });
      reportMarkers.reportLayer.addLayer(reportMarkers.report[report.id]);
    }
  }

  reportList.replaceChildren(frag);
};

updateReports();

// 返回地震列表
document.getElementById("report-back-btn").addEventListener("click", hideReportBox);

// 重播地震
document.getElementById("report-action-replay").addEventListener("click", (e) => {

});

// 開取地震報告連結
document.getElementById("report-action-open").addEventListener("click", (e) => {
  const id = document.getElementById("report-box").getAttribute("data-report-id").split("-");
  id.splice(1, 1);

  const url = `https://www.cwa.gov.tw/V8/C/E/EQ/EQ${id.join("-")}.html`;

  if (localStorage.getItem("openExternalUrl") == "true")
    ipcRenderer.send("openUrl", url);
  else
    window.open(url, "_blank", "width=1080,height=720,nodeIntegration=no,contextIsolation=yes");
});

// 複製地震報告
document.getElementById("report-action-copy").addEventListener("click", (() => {
  let timeout;
  return function(e) {
    try {
      // TODO: Implement copy functionality when report caching is done
      navigator.clipboard.writeText("owo");

      if (timeout) clearTimeout(timeout);

      this.querySelector(".chip-leading-icon").textContent = "check";
      timeout = setTimeout(() => {
        this.querySelector(".chip-leading-icon").textContent = "content_copy";
        timeout = null;
      }, 1000);
    } catch (error) {
      console.error(error);
    }
  };
})());

document.getElementById("report-intensity-sort-group").addEventListener("click", function() {
  this;
});

document.getElementById("report-intensity-sort-intensity").addEventListener("click", function() {
  this;
});