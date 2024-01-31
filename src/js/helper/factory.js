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
    .addChildren(new ElementBuilder("span")
      .setClass(["report-intensity-group-collapse", "material-symbols-rounded"])
      .setContent("expand_more"));

  const member = new ElementBuilder()
    .setClass(["report-intensity-member"]);

  for (const station of area.town)
    member.addChildren(reportIntensityItem(station));

  return new ElementBuilder()
    .setClass(["report-intensity-group", "expanded"])
    .addChildren(item)
    .addChildren(member)
    .on("click", function() {
      if (this.classList.contains("expanded")) {
        this.style.height = this.scrollHeight + "px";
        setImmediate(() => this.style.height = "");
      } else
        this.style.height = this.scrollHeight + "px";

      this.classList.toggle("expanded");
    });
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

        document.getElementById("report-intensity").replaceChildren();

        if (!r) r = await api.getReport(this.id);

        const frag = new DocumentFragment();

        const list = [];
        for (const area in r.list) {
          const town = [];
          for (const station in r.list[area].town)
            town.push({ ...r.list[area].town[station], name: station });
          town.sort((a, b) => b.int - a.int);
          list.push({ ...r.list[area], name: area, town });
        }
        list.sort((a, b) => b.int - a.int);

        for (const area of list)
          frag.appendChild(reportIntensityItemGroup(area).toElement());

        document.getElementById("report-intensity").replaceChildren(frag);
      } catch (error) {
        document.getElementById("report-box").classList.remove("show");
      }
    };
  })());

module.exports = { reportListItem };