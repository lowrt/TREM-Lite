const { extractLocationFromString, toFormattedTimeString } = require("./utils");
const ElementBuilder = require("../class/elementbuilder");

/**
 * @param {number} intensity
 */
const intensityBox = (intensity) => new ElementBuilder()
  .setClass(["intensity-box", `intensity-${intensity}`]);

/**
 * @param {number} intensity
 */
const reportIntensityCapsule = (intensity) => new ElementBuilder()
  .setClass(["report-intensity-item-intensity", `intensity-${intensity}`]);

/**
 * @param {import("../class/api").StationIntensity} station
 */
const reportIntensityItem = (station, collapse = false) => new ElementBuilder()
  .setClass(["report-intensity-item"])
  .addChildren(reportIntensityCapsule(station.int))
  .addChildren(new ElementBuilder("span")
    .setClass(["report-intensity-item-location"])
    .setContent(station.name));

/**
 * @param {import("../class/api").AreaIntensity} area
 */
const reportIntensityItemGroup = (area) => {
  const item = reportIntensityItem(area)
    .addClass(["collapsible"])
    .addChildren(new ElementBuilder("span")
      .setClass(["report-intensity-group-collapse", "material-symbols-rounded"])
      .setContent("expand_more"))
    .on("click", function() {
      if (this.parentElement.classList.contains("expanded")) {
        this.parentElement.style.height = this.parentElement.scrollHeight + "px";
        requestAnimationFrame(() => this.parentElement.style.height = "");
      } else
        this.parentElement.style.height = this.parentElement.scrollHeight + "px";

      this.parentElement.classList.toggle("expanded");
    });

  const member = new ElementBuilder()
    .setClass(["report-intensity-member"]);

  for (const station of area.town)
    member.addChildren(reportIntensityItem(station));

  return new ElementBuilder()
    .setClass(["report-intensity-group", "expanded"])
    .addChildren(item)
    .addChildren(member);
};

/**
 * @param {import("../class/api").PartialReport} report
 */
const reportListItem = (report) => new ElementBuilder()
  .setId(report.id)
  .setClass(report.no % 1000 ? ["report-list-item", "numbered"] : ["report-list-item"])
  .addChildren(intensityBox(report.int))
  .addChildren(new ElementBuilder()
    .setClass(["report-list-item-content"])
    .addChildren(new ElementBuilder("span")
      .setClass(["report-list-item-location"])
      .setContent(extractLocationFromString(report.loc)))
    .addChildren(new ElementBuilder("span")
      .setClass(["report-list-item-time"])
      .setContent(toFormattedTimeString(report.time))))
  .addChildren(new ElementBuilder()
    .setClass(["report-list-item-magnitude"])
    .setContent(report.mag.toFixed(1)))
  .on("click", (() => {
    /**
     * @type {import("../class/api").Report}
     */
    // TODO: Move cache to other place
    let r;
    return async function() {
      try {
        document.getElementById("report-box").classList.add("show");
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

        if (!r) r = await api.getReport(this.id);

        const list = [];
        for (const area in r.list) {
          const town = [];
          for (const station in r.list[area].town)
            town.push({ ...r.list[area].town[station], name: station });
          town.sort((a, b) => b.int - a.int);
          list.push({ ...r.list[area], name: area, town });
        }
        list.sort((a, b) => b.int - a.int);

        const grouped = new DocumentFragment();

        for (const area of list)
          grouped.appendChild(reportIntensityItemGroup(area).toElement());

        document.getElementById("report-intensity-grouped").replaceChildren(grouped);

        // -- all intensity

        const allList = list.reduce((acc, area) => (acc.push(...area.town.map(t => (t.station = t.name, t.name = area.name, t))), acc), []).sort((a, b) => b.int - a.int);

        const all = new DocumentFragment();

        for (const station of allList)
          all.appendChild(reportIntensityItem(station)
            .addChildren(new ElementBuilder("span")
              .setClass(["report-intensity-item-station"])
              .setContent(station.station))
            .toElement());

        document.getElementById("report-intensity-all").replaceChildren(all);
      } catch (error) {
        console.error(error);
        document.getElementById("report-box").classList.remove("show");
      }
    };
  })());

module.exports = { reportListItem };