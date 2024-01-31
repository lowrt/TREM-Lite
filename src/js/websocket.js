/* eslint-disable no-undef */
const API = require("../js/class/api");

const api = new API();

api.on(API.Events.Ntp, (data) => {
  variable.time_offset = Date.now() - data.time;
});

api.on(API.Events.Rts, (rts) => {
  if (variable.replay) return;

  variable.last_get_data_time = now();
  show_rts_dot(rts.data);
  if (Object.keys(rts.data.box).length) show_rts_box(rts.data.box);
});

api.on(API.Events.Eew, (eew) => {
  show_eew(eew.data);
});


const updateReports = async () => {
  const { reportListItem, reportIntensityItem, reportIntensityItemGroup } = require("../js/helper/factory");
  const { extractLocationFromString, toFormattedTimeString } = require("../js/helper/utils");
  const ElementBuilder = require("../js/class/elementbuilder");

  const reports = await api.getReports(20);

  const reportList = document.getElementById("list-box");

  const frag = new DocumentFragment();
  for (const report of reports)
    frag.appendChild(
      reportListItem(report)
        .on("click", (() => {
          /**
           * @type {import("../class/api").Report}
           */
          // TODO: Move cache to other place
          let r;

          const updateReportBox = () => {
            document.getElementById("report-box").setAttribute("data-report-id", this.id);
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

          const updateReportIntensityList = () => {
            const intList = [];
            for (const area in r.list) {
              const town = [];
              for (const station in r.list[area].town)
                town.push({ ...r.list[area].town[station], name: station });
              town.sort((a, b) => b.int - a.int);
              intList.push({ ...r.list[area], name: area, town });
            }

            // -- grouped intensity

            intList.sort((a, b) => b.int - a.int);
            const grouped = new DocumentFragment();

            for (const area of intList)
              grouped.appendChild(reportIntensityItemGroup(area).toElement());

            document.getElementById("report-intensity-grouped").replaceChildren(grouped);

            // -- all intensity

            const intListAll = intList.reduce((acc, area) => (acc.push(...area.town.map(t => (t.station = t.name, t.name = area.name, t))), acc), []).sort((a, b) => b.int - a.int);
            const all = new DocumentFragment();

            for (const station of intListAll)
              all.appendChild(reportIntensityItem(station)
                .addChildren(new ElementBuilder("span")
                  .setClass(["report-intensity-item-station"])
                  .setContent(station.station))
                .toElement());

            document.getElementById("report-intensity-all").replaceChildren(all);
          };

          return async function() {
            try {
              document.getElementById("report-box").classList.add("show");

              updateReportBox();

              if (!r) r = await api.getReport(this.id);

              updateReportIntensityList();

            } catch (error) {
              console.error(error);
              document.getElementById("report-box").classList.remove("show");
            }
          };
        })())
        .toElement());


  reportList.replaceChildren(frag);
};

updateReports();
setInterval(() => {
  const _now = now();
  if (new Date(_now).getSeconds() == 0)
    if (!variable.subscripted_list.includes("websocket.report")) updateReports();
  if (variable.replay) {
    doc_time.style.color = "yellow";
    doc_time.textContent = formatTime(variable.replay);
  } else
    if (_now - variable.last_get_data_time > 5000) doc_time.style.color = "red";
    else {
      doc_time.style.color = "white";
      doc_time.textContent = formatTime(_now);
    }
}, 1000);