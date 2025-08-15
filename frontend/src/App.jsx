import { useState } from "react";

export default function App() {
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("http://localhost:5000/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, language }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unknown error occurred");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text);
      alert("Copied to clipboard!");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to right, #667eea, #764ba2)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem",
        color: "#fff",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "1.5rem", textShadow: "1px 1px 4px #000" }}>
        Instagram Reel Transcription
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 500,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <input
          type="text"
          placeholder="Enter Instagram reel URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            padding: "0.7rem",
            borderRadius: "8px",
            border: "none",
            fontSize: "1rem",
          }}
        />
        <input
          type="text"
          placeholder="Language (optional, default auto)"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{
            padding: "0.7rem",
            borderRadius: "8px",
            border: "none",
            fontSize: "1rem",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.7rem",
            borderRadius: "8px",
            border: "none",
            fontSize: "1rem",
            background: "linear-gradient(to right, #e3166fff, #0f5ddbff)",
            color: "#fff",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "0.3s all",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          }}
        >
          {loading ? "Transcribing..." : "Transcribe"}
        </button>
      </form>

      {loading && (
        <div
          style={{
            marginBottom: "1rem",
            fontSize: "1.1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {/* Animated bouncing dots */}
          <div style={{ display: "flex", gap: "4px" }}>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: "10px",
                  height: "10px",
                  backgroundColor: "#fff",
                  borderRadius: "50%",
                  animation: `bounce 0.6s infinite ${i * 0.2}s`,
                }}
              ></div>
            ))}
          </div>
          Transcription in progress...
        </div>
      )}

      {error && (
        <div
          style={{
            background: "rgba(255, 0, 0, 0.2)",
            color: "#ffcccc",
            padding: "0.8rem 1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
            fontWeight: "bold",
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div
          style={{
            background: "rgba(255,255,255,0.1)",
            padding: "1rem 1.2rem",
            borderRadius: "12px",
            width: "100%",
            maxWidth: 500,
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <h2 style={{ marginBottom: "0.5rem", color: "#fff" }}>Transcription Result</h2>
          <p><strong>Detected Language:</strong> {result.detected_language}</p>
          <p style={{ marginTop: "0.5rem" }}><strong>Text:</strong></p>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: "0.3rem" }}>
            {result.text}
          </div>
          <button
            onClick={copyToClipboard}
            style={{
              alignSelf: "flex-end",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#00c3ff",
              color: "#000",
              fontWeight: "bold",
              cursor: "pointer",
              marginTop: "0.5rem",
              transition: "0.2s",
            }}
          >
            Copy
          </button>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
