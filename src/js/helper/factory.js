const ElementBuilder = require("../class/elementbuilder");
const { extractLocationFromString, toFormattedTimeString } = require("./utils");

/**
 * @param {number} intensity
 */
const intensityBox = (intensity) => new ElementBuilder()
  .setClass(["intensity-box", `intensity-${intensity}`]);

/**
 * @param {import("../class/api").PartialReport} report
 */
const reportListItem = (report) => new ElementBuilder()
  .setId(report.id)
  .setClass(report.no ? ["report-list-item", "numbered"] : ["report-list-item"])
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

module.exports = { reportListItem };