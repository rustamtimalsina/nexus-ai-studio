# NexusAI Studio - AI Chat & Workspace Dashboard 🚀

A modern, full-stack AI workspace and chat dashboard built with **React**, **Vite**, **Tailwind CSS**, **Node.js**, **Express**, and **TypeScript**.

Featuring real-time Server-Sent Events (SSE) streaming, specialized workspace personas, prompt template library, syntax-highlighted code blocks with one-click copying, and zero-configuration offline simulation with optional live Google Gemini API connectivity.

---

## ✨ Key Features

- 💬 **Real-time AI Chat & SSE Streaming**: Fluid token-by-token streaming responses with typing animation.
- 📂 **Multi-Persona Workspaces**: Switch context and system instructions between:
  - *Full-Stack Architect* (clean code, SOLID principles, scalable systems)
  - *Research & Synthesis* (in-depth analysis, executive summaries)
  - *General Assistant* (brainstorming, Q&A)
  - *Custom Workspaces* (define your own role, tone, and system prompts)
- 📚 **Prompt Template Library**: Categorized prompt templates for Coding, Productivity, Architecture, and Testing with instant one-click execution.
- 💻 **Syntax-Highlighted Code Blocks**: Clean code presentation with language badges and instant clipboard copying.
- ⚡ **Dual AI Engine**:
  - **Smart Built-in Simulator**: Runs 100% locally out of the box with realistic code generation and responses—no API key needed!
  - **Google Gemini Integration**: Connect your real Gemini API key in Settings to tap into live `gemini-1.5-pro` and `gemini-1.5-flash` models.
- 💾 **Automatic Persistence**: Conversations, messages, custom workspaces, and prompt templates persist automatically to the server's local JSON database.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, Server-Sent Events (SSE) |
| **Tooling** | Concurrently, TSX (hot reload), PostCSS, Autoprefixer |

---

## 🚀 Quick Start

### 1. Install Dependencies
From the project root:
```bash
npm run install:all
```
*(Or install in `server` and `client` individually via `cd server && npm install` and `cd ../client && npm install`)*

### 2. Run Both Server & Client Concurrently
```bash
npm run dev
```

- **Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Healthcheck and service status |
| `GET` | `/api/workspaces` | Retrieve all workspace personas |
| `POST` | `/api/workspaces` | Create a new custom workspace |
| `GET` | `/api/chats` | List all chat sessions |
| `POST` | `/api/chats` | Create a new conversation session |
| `DELETE` | `/api/chats/:id` | Delete a chat session and its messages |
| `GET` | `/api/chats/:id/messages` | Retrieve conversation history |
| `POST` | `/api/chats/:id/messages/stream` | Stream user message and AI SSE response |
| `GET` | `/api/prompts` | Retrieve prompt templates |
| `POST` | `/api/prompts` | Create custom prompt template |
| `DELETE` | `/api/prompts/:id` | Delete prompt template |
| `GET` | `/api/settings` | Read current engine configuration |
| `PATCH` | `/api/settings` | Update provider, API key, and temperature |

---

## ⚙️ Configuration & Environment

You can configure settings directly through the UI modal (**Settings & API** in the sidebar) or via environment variables in `server/.env`:

```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
```
