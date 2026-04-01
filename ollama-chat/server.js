const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL || "gpt-oss:120b-cloud";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Health check
app.get("/api/health", async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) throw new Error("Ollama not reachable");
    const data = await response.json();
    const models = data.models?.map((m) => m.name) || [];
    res.json({ status: "ok", ollamaUrl: OLLAMA_BASE_URL, model: MODEL, availableModels: models });
  } catch (err) {
    res.status(503).json({ status: "error", message: err.message });
  }
});

// Chat endpoint — streams Ollama response back to client
app.post("/api/chat", async (req, res) => {
  const { messages, model } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const selectedModel = model || MODEL;

  try {
    const ollamaRes = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        stream: true,
      }),
    });

    if (!ollamaRes.ok) {
      const errText = await ollamaRes.text();
      return res.status(ollamaRes.status).json({ error: errText });
    }

    // Set up SSE streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const reader = ollamaRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((l) => l.trim());

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            res.write(`data: ${JSON.stringify({ content: json.message.content })}\n\n`);
          }
          if (json.done) {
            res.write(`data: ${JSON.stringify({ done: true, stats: {
              total_duration: json.total_duration,
              eval_count: json.eval_count,
            }})}\n\n`);
          }
        } catch {
          // skip malformed lines
        }
      }
    }

    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

// List available models
app.get("/api/models", async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    const data = await response.json();
    res.json({ models: data.models?.map((m) => m.name) || [] });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Ollama Chat running at http://localhost:${PORT}`);
  console.log(`📡 Ollama URL: ${OLLAMA_BASE_URL}`);
  console.log(`🤖 Default model: ${MODEL}\n`);
});
