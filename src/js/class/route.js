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
  constructor(options = {}) {
    this.version = options.version ?? 2;
    this.key = options.key ?? "";
  }

  /**
   * @template {string} key
   * @param {key} key
   */
  setkey(key) {
    this.key = key;
  }

  /**
   * @returns {BaseUrl}
   */
  randomBaseUrl() {
    return `https://lb-${Math.ceil(Math.random() * 4)}.exptech.com.tw/api/v${this.version}`;
  }

  /**
   * @template {number} limit
   * @param {limit} [limit]
   * @returns {`${BaseUrl}/eq/report?limit=${limit}&key=${key}`}
   */
  earthquakeReportList(limit = "") {
    return this.randomBaseUrl() + `/eq/report?limit=${limit}&key=${this.key}`;
  }

  /**
   * @template {string} id
   * @param {id} id
   * @returns {`${BaseUrl}/eq/report/${id}`}
   */
  earthquakeReport(id) {
    return this.randomBaseUrl() + `/eq/report/${id}`;
  }

  /**
   * @template {number} timestamp
   * @param {timestamp} timestamp
   * @returns {`${BaseUrl}/trem/rts?time=${timestamp}`}
   */
  rts(timestamp) {
    return this.randomBaseUrl() + `/trem/rts?time=${timestamp}`;
  }
}

module.exports = Route;