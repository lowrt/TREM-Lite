// 返回地震列表
document.getElementById("report-back-btn").addEventListener("click", () => {
  document.getElementById("report-box").classList.remove("show");
});

// 重播地震
document.getElementById("report-action-replay").addEventListener("click", (e) => {

});

// 開取地震報告連結
document.getElementById("report-action-open").addEventListener("click", (e) => {
  const id = document.getElementById("report-box").getAttribute("data-report-id").split("-");
  id.splice(1, 1);

  const url = `https://www.cwa.gov.tw/V8/C/E/EQ/EQ${id.join("-")}.html`;

  if (localStorage.getItem("openExternalUrl") == "true")
    ipcRenderer.send("openUrl", url);
  else
    window.open(url, "_blank", "width=1080,height=720,nodeIntegration=no,contextIsolation=yes");
});

// 複製地震報告
document.getElementById("report-action-copy").addEventListener("click", (() => {
  let timeout;
  return function(e) {
    try {
      // TODO: Implement copy functionality when report caching is done
      navigator.clipboard.writeText("owo");

      if (timeout) clearTimeout(timeout);

      this.querySelector(".chip-leading-icon").textContent = "check";
      timeout = setTimeout(() => {
        this.querySelector(".chip-leading-icon").textContent = "content_copy";
        timeout = null;
      }, 1000);
    } catch (error) {
      console.error(error);
    }
  };
})());

document.getElementById("report-intensity-sort-group").addEventListener("click", function() {
  this;
});

document.getElementById("report-intensity-sort-intensity").addEventListener("click", function() {
  this;
});