/**
 * @class
 * @template {number} [version = 2]
 * @template {string} [key = ""]
 */
class Route {
  /**
   * @typedef BaseUrl
   * @type {`https://lb-${number}.exptech.com.tw/api/v${version}`}
   */

  /**
   * @constructor
   * @param {{version: version, key: key}} options
   */
  constructor(options = { version: 2, key: "" }) {
    this.version = options.version;
    this.key = options.key;
  }

  /**
   * @returns {BaseUrl}
   */
  static randomBaseUrl() {
    return `https://lb-${Math.floor(Math.random() * 4)}.exptech.com.tw/api/v${this.version}`;
  }

  /**
   * @template {number} limit
   * @param {limit} [limit]
   * @returns {`${BaseUrl}/eq/report?limit=${limit}&key=${key}`}
   */
  earthquakeReportList(limit = "") {
    return Route.randomBaseUrl() + "/eq/report";
  }

  /**
   * @template {string} id
   * @param {id} id
   * @returns {`${BaseUrl}/eq/report/${id}`}
   */
  earthquakeReport(id) {
    return Route.randomBaseUrl() + `/eq/report/${id}`;
  }

  /**
   * @template {number} timestamp
   * @param {timestamp} timestamp
   * @returns {`${BaseUrl}/trem/rts?time=${timestamp}`}
   */
  rts(timestamp) {
    return Route.randomBaseUrl() + `/trem/rts?time=${timestamp}`;
  }
}

module.exports = Route;