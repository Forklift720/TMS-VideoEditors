(function () {
  var STORE_KEY = "tms.runner.settings.v1";
  var cs;

  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function safeStr(v) { try { return String(v); } catch (e) { return ""; } }

  function toast(msg, ms) {
    ms = ms || 1500;
    var el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(function () { el.classList.remove("show"); }, ms);
  }

  function logBox(id, text) {
    var el = $(id);
    if (el) el.textContent = safeStr(text);
  }

  function normalizePath(p) {
    return safeStr(p || "").replace(/\\/g, "/").trim();
  }

  function escapeForEval(s) {
    return safeStr(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r/g, "\\r").replace(/\n/g, "\\n");
  }

  function switchTab(tabName) {
    $all(".tab").forEach(function (btn) {
      var active = btn.getAttribute("data-tab") === tabName;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    $all(".page").forEach(function (p) { p.classList.remove("active"); });
    var page = document.querySelector("#tab-" + tabName);
    if (page) page.classList.add("active");
  }

  function loadSettings() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); }
    catch (e) { return {}; }
  }

  function saveSettings(s) { localStorage.setItem(STORE_KEY, JSON.stringify(s)); }

  function setAccent(hex) {
    document.documentElement.style.setProperty("--accent", hex);
  }

  function applyCompact(compact) {
    document.documentElement.style.setProperty("--pad", compact ? "10px" : "12px");
  }

  function initTabs() {
    $all(".tab").forEach(function (btn) {
      btn.addEventListener("click", function () { switchTab(btn.getAttribute("data-tab")); });
    });
  }

  function initHostInfo() {
    try {
      var env = JSON.parse(cs.getHostEnvironment());
      $("#hostInfo").textContent = (env.appName || "Adobe Host") + " " + (env.appVersion || "");
      // Rough light/dark sync from skin if present
      try {
        var c = env.appSkinInfo.panelBackgroundColor; // {red,green,blue}
        var lum = (0.2126*c.red + 0.7152*c.green + 0.0722*c.blue);
        document.body.classList.toggle("light", lum > 160);
      } catch (e) {}
    } catch (e) {
      $("#hostInfo").textContent = "Could not read host environment";
    }
  }

  function initControls() {
    $("#rng").addEventListener("input", function (e) {
      $("#rngVal").textContent = e.target.value;
    });

    $("#btnThemeToggle").addEventListener("click", function () {
      document.body.classList.toggle("light");
    });

    $("#btnToast").addEventListener("click", function () { toast("Hello toast 👋"); });
  }

  // --- Original feature: run arbitrary JSX file ---
  function runExternalJSX() {
    var jsxPath = normalizePath($("#jsxPath").value);
    if (!jsxPath) {
      toast("Please enter a JSX path");
      return;
    }
    var call = 'TMSRunner_runFile("' + escapeForEval(jsxPath) + '")';
    cs.evalScript(call, function (res) {
      var msg = safeStr(res || "");
      if (msg.indexOf("ERROR:") === 0) {
        logBox("#jsxLog", msg);
        toast("JSX error");
      } else {
        logBox("#jsxLog", "✅ Success (empty result from JSX runner)");
        toast("JSX ran");
      }
    });
  }

  function browseForJSX() {
    // showOpenDialog(allowMultiple, canSelectFiles, canSelectFolders, title, initialPath, fileTypes)
    try {
      var r = cs.getSystemPath(SystemPath.USER_DESKTOP);
      var res = cs.showOpenDialog(false, true, false, "Select a JSX file", r, ["jsx"]);
      var paths = (res && res.data) ? res.data : [];
      if (paths.length) $("#jsxPath").value = normalizePath(paths[0]);
    } catch (e) {
      logBox("#jsxLog", "Open dialog failed: " + e);
    }
  }

  // --- Host demo calls (runner.jsx now includes a KitchenSink object too) ---
  function initHostDemos() {
    $("#btnHello").addEventListener("click", function () {
      cs.evalScript("KitchenSink.hello()", function (res) { logBox("#jsxLog", res); });
    });

    $("#btnProjectInfo").addEventListener("click", function () {
      cs.evalScript("KitchenSink.getProjectInfo()", function (res) { logBox("#jsxLog", res); });
    });

    $("#btnActiveSequence").addEventListener("click", function () {
      cs.evalScript("KitchenSink.getActiveSequenceName()", function (res) { logBox("#jsxLog", res); });
    });

    $("#btnAddMarker").addEventListener("click", function () {
      var note = $("#markerNote").value || "Marker from CEP";
      var call = 'KitchenSink.addMarkerAtPlayhead("' + escapeForEval(note) + '")';
      cs.evalScript(call, function (res) { logBox("#jsxLog", res); });
    });
  }

  function initSettings() {
    var s = loadSettings();

    $("#setDefaultTab").value = s.defaultTab || "main";
    $("#setAccent").value = s.accent || "#4a90e2";
    $("#setCompact").checked = !!s.compact;

    setAccent($("#setAccent").value);
    applyCompact($("#setCompact").checked);

    $("#btnSaveSettings").addEventListener("click", function () {
      var next = {
        defaultTab: $("#setDefaultTab").value,
        accent: $("#setAccent").value,
        compact: $("#setCompact").checked
      };
      saveSettings(next);
      setAccent(next.accent);
      applyCompact(next.compact);
      toast("Saved settings");
    });

    $("#btnResetSettings").addEventListener("click", function () {
      localStorage.removeItem(STORE_KEY);
      $("#setDefaultTab").value = "main";
      $("#setAccent").value = "#4a90e2";
      $("#setCompact").checked = false;
      setAccent("#4a90e2");
      applyCompact(false);
      toast("Reset settings");
    });

    $("#setAccent").addEventListener("input", function () { setAccent($("#setAccent").value); });
    $("#setCompact").addEventListener("change", function () { applyCompact($("#setCompact").checked); });
  }

  function initAbout() {
    $("#btnCopyDebug").addEventListener("click", function () {
      var s = loadSettings();
      var envText = "";
      try { envText = cs.getHostEnvironment(); } catch (e) { envText = String(e); }

      var txt =
        "=== TMS Runner Debug ===\n" +
        "HostEnvironment:\n" + envText + "\n\n" +
        "UserData: " + safeStr(cs.getSystemPath(SystemPath.USER_DATA)) + "\n" +
        "Extension: " + safeStr(cs.getSystemPath(SystemPath.EXTENSION)) + "\n\n" +
        "Settings:\n" + JSON.stringify(s, null, 2);

      logBox("#debugBox", txt);

      // Clipboard best-effort
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(function () {
            toast("Copied debug info");
          }, function () {
            toast("Clipboard blocked (shown below)");
          });
        } else {
          toast("Clipboard API unavailable (shown below)");
        }
      } catch (e) {
        toast("Clipboard failed (shown below)");
      }
    });

    // Explain the two concrete issues from your uploaded project
    $("#whyBox").textContent =
      "Your uploaded project likely didn't appear because:\n\n" +
      "1) manifest.xml ScriptPath pointed to ./jsx/runner.jsx but the file was in a folder named 'JSX/runner.jsx' (case + folder mismatch).\n" +
      "   Premiere won't load the extension if ScriptPath is invalid.\n\n" +
      "2) RequiredRuntime was fixed to CSXS 11.0. If your Premiere has CEP 10/9/etc, the extension is filtered out.\n" +
      "   Use a range like [6.0,99.9] so it shows up across versions.\n\n" +
      "This updated version fixes both.";
  }

  function boot() {
    try {
      cs = new CSInterface();
    } catch (e) {
      alert("CSInterface not available.\n\n" + e);
      return;
    }

    initTabs();
    initHostInfo();
    initControls();
    initSettings();
    initHostDemos();
    initAbout();

    $("#runBtn").addEventListener("click", runExternalJSX);
    $("#btnBrowse").addEventListener("click", browseForJSX);

    // default tab
    var s = loadSettings();
    switchTab(s.defaultTab || "main");
  }

  document.addEventListener("DOMContentLoaded", boot);
})();