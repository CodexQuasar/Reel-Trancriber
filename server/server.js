import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());

app.use(express.json({ limit: "50mb" }));

app.use(express.static(path.join(__dirname, "client")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});
app.post("/api/transcribe", async (req, res) => {
  try {
    const { url, language = "auto" } = req.body || {};
    if (!url || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: "Please provide a valid URL." });
    }

    // Use raw string paths or double backslashes for Windows
    const pythonPath = path.join(__dirname, ".venv", "Scripts", "python.exe"); // Use venv
    const scriptPath = path.join(__dirname, "transcribe.py");

    const child = spawn(pythonPath, [scriptPath, url, language], {
      env: { ...process.env, PYTHONUNBUFFERED: "1", PYTHONUTF8: "1" },
      cwd: __dirname,
      shell: true, // important on Windows to resolve paths
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => {
      return res.status(500).json({ error: "Failed to start Python: " + err.message });
    });

    child.on("close", (code) => {
       console.log("Python exited with code:", code);
       console.log("stdout:", stdout);
       console.log("stderr:", stderr);

      if (code !== 0) {
        return res.status(500).json({
          error: `Transcription failed (code ${code})`,
          stderr,
          stdout,
        });
      }
      try {
        const data = JSON.parse(stdout);
        return res.json(data);
      } catch (e) {
        return res.status(500).json({
          error: "Invalid JSON from Python",
          stdout,
          stderr,
        });
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unknown server error" });
  }
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
