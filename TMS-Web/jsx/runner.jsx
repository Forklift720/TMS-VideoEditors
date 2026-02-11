// jsx/runner.jsx
// Provides one function callable from CEP: TMSRunner_runFile(path)
// Plus: KitchenSink demos for Premiere Pro.

function TMSRunner_runFile(filePath) {
    try {
        if (!filePath || filePath === "") {
            return "ERROR: Empty filePath";
        }

        // Normalize slashes just in case
        filePath = String(filePath).replace(/\\/g, "/");

        var f = new File(filePath);
        if (!f.exists) {
            return "ERROR: JSX not found: " + filePath;
        }

        $.evalFile(f);

        // ✅ SUCCESS: return empty string (no alert)
        return "";
    } catch (e) {
        return "ERROR: " + e;
    }
}

// ------------------------------
// KitchenSink: Premiere demos
// ------------------------------
var KitchenSink = (function () {
  function _safeString(v) {
    try { return String(v); } catch (e) { return "[unprintable]"; }
  }

  function _json(obj) {
    try { return JSON.stringify(obj, null, 2); } catch (e) { return _safeString(obj); }
  }

  function hello() {
    return "Hello from ExtendScript ✅\napp.name: " + _safeString(app.name);
  }

  function getProjectInfo() {
    try {
      var p = app.project;
      if (!p) return "No project object.";
      var info = {
        name: p.name,
        path: p.path || "(unsaved project)",
        sequenceCount: (p.sequences && p.sequences.numSequences !== undefined) ? p.sequences.numSequences : "(unknown)"
      };
      return _json(info);
    } catch (e) {
      return "Error: " + e;
    }
  }

  function getActiveSequenceName() {
    try {
      var seq = app.project.activeSequence;
      if (!seq) return "(No active sequence)";
      return "Active sequence: " + seq.name;
    } catch (e) {
      return "Error: " + e;
    }
  }

  function addMarkerAtPlayhead(note) {
    try {
      var seq = app.project.activeSequence;
      if (!seq) return "No active sequence to add marker.";
      var t = seq.getPlayerPosition(); // Time object
      var m = seq.markers.createMarker(t.ticks);
      m.name = "CEP Marker";
      m.comments = note || "";
      return "Marker added at ticks: " + t.ticks;
    } catch (e) {
      return "Error: " + e;
    }
  }

  return {
    hello: hello,
    getProjectInfo: getProjectInfo,
    getActiveSequenceName: getActiveSequenceName,
    addMarkerAtPlayhead: addMarkerAtPlayhead
  };
})();