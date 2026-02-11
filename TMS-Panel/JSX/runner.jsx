// jsx/runner.jsx
// Provides one function callable from CEP: TMSRunner_runFile(path)

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
