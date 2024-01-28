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
   * @template {number} version
   * @param {version} version
   * @returns {BaseUrl}
   */
  randomBaseUrl(version = this.version) {
    return `https://lb-${Math.ceil(Math.random() * 4)}.exptech.com.tw/api/v${version}`;
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
   * @template {number} version
   * @param {version} version
   * @template {number} timestamp
   * @param {timestamp} timestamp
   * @returns {`${BaseUrl}/trem/rts?time=${timestamp}`}
   */
  rts(version, timestamp) {
    return this.randomBaseUrl(version) + `/trem/rts?time=${timestamp}`;
  }
}

module.exports = Route;