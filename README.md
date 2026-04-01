# Ollama Chat — gpt-oss:120b-cloud

A lightweight Node.js web app for chatting with your local Ollama model.

## Requirements

- Node.js 18+
- [Ollama](https://ollama.com) running locally
- `gpt-oss:120b-cloud` model pulled: `ollama pull gpt-oss:120b-cloud`

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in browser
open http://localhost:3000
```

## Dev mode (auto-restart on file change)

```bash
npm run dev
```

## Environment Variables

| Variable       | Default                   | Description                  |
|----------------|---------------------------|------------------------------|
| `PORT`         | `3000`                    | HTTP port for the web server |
| `OLLAMA_URL`   | `http://localhost:11434`  | Ollama API base URL          |
| `OLLAMA_MODEL` | `gpt-oss:120b-cloud`      | Default model to use         |

Copy `.env.example` to `.env` to override defaults.

## Features

- 🔄 Streaming responses (token by token)
- 🤖 Model switcher (auto-detects available models)
- 📊 Token count + latency stats per response
- 🧹 Clear chat button
- ✅ Ollama connection health indicator
- 💻 Inline code highlighting
