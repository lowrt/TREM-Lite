const WebSocket = require("ws");
const EventEmitter = require("node:events");
const { sampleArray } = require("../helper/utils.js");
const Route = require("./route.js");

/**
 * @typedef {Object} PartialReport
 * @property {string} id Report id
 * @property {number} no Report number
 * @property {number} lon Epicenter longitude
 * @property {number} lat Epicenter latitude
 * @property {string} loc Epicenter location
 * @property {number} depth Earthquake depth
 * @property {number} mag Earthquake magnitude
 * @property {number} int Earthquake max intensity
 * @property {number} time Event time in UNIX timestamp
 * @property {number} trem TREM report id
 * @property {string} md5 MD4 Hash
 */

/**
 * @typedef Report
 * @property {string} id Report id
 * @property {number} no Report number
 * @property {number} lon Epicenter longitude
 * @property {number} lat Epicenter latitude
 * @property {string} loc Epicenter location
 * @property {number} depth Earthquake depth
 * @property {number} mag Earthquake magnitude
 * @property {number} time Event time in UNIX timestamp
 * @property {number} trem TREM report id
 * @property {Record<string, AreaIntensity>} list
 */

/**
 * @typedef StationIntensity
 * @property {number} lat
 * @property {number} lon
 * @property {number} int
 */

/**
 * @typedef AreaIntensity
 * @property {number} int
 * @property {Record<string, StationIntensity>} town
 */

/**
 * @typedef Station
 * @property {number} lat Station latitude
 * @property {number} lon Station longitude
 * @property {number} int Observerd max intensity for this station
 */

/**
 * @typedef Area
 * @property {number} int Max intensity in this area
 * @property {Record<string, Station>} list List of all observed stations
 */

/**
 * @typedef RtsStation
 * @property {number} pga
 * @property {number} pgv
 * @property {number} i
 * @property {number} I
 */

/**
 * @typedef Rts
 * @property {Record<string, RtsStation>} station Station data
 * @property {Record<string, number[][]>} box Triggered station area
 * @property {number} time Time in UNIX timestamp
 */

class API extends EventEmitter {
  /**
   * @param {string} key
   */
  constructor(key) {
    super();
    this.key = key;
    this.route = new Route({ key });
    this.#initWebSocket();
  }

  get key() {
    return this._key ?? "";
  }

  set key(val) {
    this._key = val;
  }

  /**
   * @typedef Events
   * @property {"eew"} Eew
   * @property {"info"} Info
   * @property {"ntp"} Ntp
   * @property {"report"} Report
   * @property {"rts"} Rts
   * @property {"verify"} Verify
   */

  /**
   * @enum {Events}
   */
  static Events = Object.freeze({
    Close  : "close",
    Eew    : "eew",
    Info   : "info",
    Ntp    : "ntp",
    Report : "report",
    Rts    : "rts",
    Verify : "verify",
  });

  #initWebSocket() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.close();

    logger.info("[WebSocket] Initializing connection");
    this.ws = new WebSocket(sampleArray(constant.WEBSOCKET_URL));

    this.ws.on("open", () => {
      logger.info("[WebSocket] Socket opened");
      this.ws.send(JSON.stringify(constant.WS_CONFIG));
    });

    this.ws.on("message", (raw) => {
      try {
        const data = JSON.parse(raw);

        if (data)
          switch (data.type) {
            case API.Events.Verify: {
              this.ws.send(JSON.stringify(constant.WS_CONFIG));
              break;
            }

            case API.Events.Info: {
              switch (data.data.code) {
                case 200:
                  if (!data.data.list.length) {
                    variable.ws_reconnect = false;
                    this.ws.close(1008);
                    break;
                  }
                  variable.ws_connected = true;
                  variable.subscripted_list = data.data.list;
                  break;
                case 503:
                  setTimeout(() => this.ws.send(JSON.stringify(constant.WS_CONFIG)), constant.API_WEBSOCKET_VERIFY);
                  break;
              }
              break;
            }

            case "data": {
              switch (data.data.type) {
                case API.Events.Rts:
                  this.emit(API.Events.Rts, data.data);
                  break;
                case API.Events.Eew:
                  this.emit(API.Events.Eew, data.data);
                  break;
              }
              break;
            }

            case API.Events.Ntp: {
              this.emit(API.Events.Ntp, data);
              break;
            }
          }
      } catch (error) {
        logger.error("[WebSocket]", error);
      }
    });

    this.ws.on("close", (code) => {
      logger.info("[WebSocket] Socket closed");
      this.emit(API.Events.Close);
      variable.ws_connected = false;
      if (code != 1008) setTimeout(this.#initWebSocket.bind(this), constant.API_WEBSOCKET_RETRY);
    });

    this.ws.on("error", (err) => {
      logger.error("[WebSocket]", err);
    });
  }

  /**
   * Inner get request wrapper
   * @param {string} url
   * @returns {Promise<any>}
   */
  async #get(url) {
    try {
      const ac = new AbortController();
      const request = new Request(url, {
        method  : "GET",
        cache   : "default",
        signal  : ac.signal,
        headers : {
          // TODO: Replace User-Agent with a variable
          "User-Agent" : "TREM-Lite/v2.0.0",
          "Accept"     : "application/json",
        },
      });

      const abortTimer = setTimeout(() => ac.abort(), constant.API_HTTP_TIMEOUT);
      const res = await fetch(request);
      clearTimeout(abortTimer);

      if (!res.ok)
        throw new Error(`Server returned ${res.status}`);

      return await res.json();
    } catch (error) {
      throw new Error(`Request timed out after ${constant.API_HTTP_TIMEOUT}ms`);
    }
  }

  async getStations() {
    const url = "https://data.exptech.com.tw/file/resource/station.json";

    try {
      return await this.#get(url);
    } catch (error) {
      throw new Error(`Failed to get station data. ${error}`);
    }
  }

  /**
   * Get list of earthquake reports.
   * @param {number} [limit=50]
   * @returns {Promise<PartialReport[]>}
   */
  async getReports(limit = 50) {
    const url = this.route.earthquakeReportList(limit);

    try {
      const data = await this.#get(url);

      for (const report of data)
        report.no = +report.id.split("-")[0];

      return data;
    } catch (error) {
      throw new Error(`Failed to get reports. ${error}`);
    }
  }

  /**
   * Get a specific earthquake report.
   * @param {number} id Report number
   * @returns {Promise<Report>}
   */
  async getReport(id) {
    const url = this.route.earthquakeReport(id);

    try {
      const data = await this.#get(url);
      data.no = +data.id.split("-")[0];

      return data;
    } catch (error) {
      throw new Error(`Failed to get report ${id}. ${error}`);
    }
  }

  /**
   * Get realtime station data.
   * @param {number} [time=Date.now()] Specify ime
   * @returns {Promise<Rts>}
   */
  async getRts(time = Date.now()) {
    const url = this.route.rts(time);

    try {
      return await this.#get(url);
    } catch (error) {
      throw new Error(`Failed to fetch rts data. ${error}`);
    }
  }
}

module.exports = API;