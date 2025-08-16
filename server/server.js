import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "500mb" }));

app.post("/api/transcribe", (req, res) => {
  const { url, language = "english" } = req.body || {};
  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: "Please provide a valid URL." });
  }

  const pythonPath = "C:\\Users\\adity\\AppData\\Local\\Programs\\Python\\Python313\\python.exe";
  const scriptPath = path.join(__dirname, "transcribe.py");

  const child = spawn(pythonPath, [scriptPath, url, language], {
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
    cwd: __dirname,
  });

  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (data) => {
    const msg = data.toString();
    stdout += msg;
    console.log("📄 STDOUT:", msg.trim());
  });

  child.stderr.on("data", (data) => {
    const msg = data.toString();
    stderr += msg;
    console.log("⚠️ STDERR:", msg.trim());
  });

  child.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({
        error: `Transcription failed (code ${code})`,
        stdout,
        stderr,
      });
    }

    try {
      const data = JSON.parse(stdout); // stdout should be pure JSON
      res.json(data);
    } catch (e) {
      res.status(500).json({
        error: "Invalid JSON from Python",
        stdout,
        stderr,
      });
    }
  });
});

app.listen(5000, () => console.log("🚀 Server running at http://localhost:5000"));
