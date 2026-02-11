(function () {
  var cs;
  try {
    cs = new CSInterface();
  } catch (e) {
    alert("CSInterface not available.\n\n" + e);
    return;
  }

  var mode = "manual";
  try { mode = localStorage.getItem("tms_mode") || "manual"; } catch (e) {}

  var modeLabel = document.getElementById("modeLabel");
  if (modeLabel) modeLabel.textContent = "Mode: " + mode.toUpperCase();

  var backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      window.location.href = "start.html";
    });
  }

  function normalizePath(p) {
    return String(p || "").replace(/\\/g, "/").trim();
  }

  function run() {
    var inp = document.getElementById("jsxPath");
    var jsxPath = normalizePath(inp.value);

    if (!jsxPath) {
      alert("Please enter a JSX path.");
      return;
    }

    var esc = jsxPath.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    var ext = 'TMSRunner_runFile("' + esc + '")';

    cs.evalScript(ext, function (res) {
      var msg = String(res || "");

      if (msg.indexOf("ERROR:") === 0) {
        alert(msg);
      }

      try { console.log(msg || "JSX executed successfully"); } catch (e) {}
    });
  }

  document.getElementById("runBtn").addEventListener("click", run);
})();
