/* eslint-disable no-undef */
const API = require("../js/class/api");
const { reportListItem } = require("../js/helper/factory");

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
  const reports = await api.getReports(20);

  const list = document.getElementById("list-box");

  const frag = new DocumentFragment();
  for (const report of reports)
    frag.appendChild(reportListItem(report).toElement());

  list.replaceChildren(frag);
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