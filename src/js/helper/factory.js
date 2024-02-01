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
    .setAttribute("data-area", area.name)
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
    .setContent(report.mag.toFixed(1)));

module.exports = { reportListItem, reportIntensityItem, reportIntensityItemGroup, reportIntensityCapsule };