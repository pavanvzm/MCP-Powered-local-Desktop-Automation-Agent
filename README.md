# 🤖 AI Agent Production System

> **Intelligent Automation Platform** — A production-grade AI agent with natural language understanding, multi-tool orchestration, persistent memory, and real-time streaming.

[![CI/CD](https://github.com/pavanvzm/MCP-Powered-local-Desktop-Automation-Agent/actions/workflows/ci.yml/badge.svg)](https://github.com/pavanvzm/MCP-Powered-local-Desktop-Automation-Agent/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.11+-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🧠 **Multi-LLM Support** | OpenAI GPT-4, Anthropic Claude, or local models (Llama 3.2, Mistral) |
| 🔧 **7+ Built-in Tools** | Web search, calculator, datetime, summarization, file ops, API calls, code execution |
| 💾 **Dual Memory** | Short-term conversation buffer + ChromaDB vector-based long-term memory |
| ⚡ **Real-time Streaming** | WebSocket-powered streaming responses with live tool execution visualization |
| 🔒 **Enterprise Security** | API key auth, rate limiting, input validation, CORS, env var management |
| 🐳 **Containerized** | Multi-stage Docker builds with Docker Compose for dev & production |
| 📊 **Performance Dashboard** | Live metrics, session management, API playground |
| 🌙 **Dark/Light Theme** | Full theme support with persistent preferences |

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.11+, FastAPI, LangChain, SQLAlchemy |
| **Frontend** | React 18, TypeScript, TailwindCSS, Zustand, Framer Motion |
| **Databases** | PostgreSQL (structured), ChromaDB (vectors) |
| **LLM Providers** | OpenAI, Anthropic, Ollama (local) |
| **Infrastructure** | Docker, Docker Compose, GitHub Actions |
| **Testing** | Pytest, Vitest, Playwright |

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone the repo
git clone https://github.com/pavanvzm/MCP-Powered-local-Desktop-Automation-Agent.git
cd MCP-Powered-local-Desktop-Automation-Agent

# Copy environment config
cp .env.example .env
# Edit .env and add your API keys (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)

# Start all services
docker compose -f docker/docker-compose.yml up -d --build

# Access the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

## 📋 API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/chat` | Send message to AI agent (streaming support) |
| `GET` | `/api/v1/chat/{session_id}` | Get conversation history |
| `DELETE` | `/api/v1/chat/{session_id}` | Clear session |
| `POST` | `/api/v1/tasks` | Create scheduled task |
| `GET` | `/api/v1/tasks/{task_id}` | Check task status |
| `GET` | `/api/v1/memory/{session_id}` | Inspect agent memory |
| `GET` | `/api/v1/metrics` | Get performance metrics |
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/tools` | List available tools |
| `POST` | `/api/v1/tools/execute` | Direct tool execution |

### Example: Chat Request

```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"message": "What is 25 * 4 + 10?", "stream": true}'
```

## 🧰 Available Tools

| Tool | Description |
|------|-------------|
| 🌐 **web_search** | Search the web for current information |
| 🔢 **calculator** | Evaluate mathematical expressions |
| ⏰ **datetime** | Get current date and time |
| 📝 **summarize** | Summarize text content |
| 📁 **file_operations** | Read, write, list files |
| 🔌 **api_call** | Make HTTP API requests |
| 💻 **execute_code** | Run Python code in sandbox |

## ⚙️ Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes* | - | OpenAI API key |
| `ANTHROPIC_API_KEY` | Yes* | - | Anthropic API key |
| `API_KEY` | Yes* | - | API authentication key |
| `DATABASE_URL` | No | PostgreSQL URL | Database connection |
| `LLM_PROVIDER` | No | `openai` | LLM provider to use |
| `LOG_LEVEL` | No | `INFO` | Logging level |
| `ENVIRONMENT` | No | `development` | Runtime environment |

*\* At least one LLM API key is required for full functionality*

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v --cov=app

# Frontend tests
cd frontend
npm test -- --run

# E2E tests
npx playwright test
```

## 📦 Project Structure

```
ai-agent-production-system/
├── backend/           # Python FastAPI backend
│   ├── app/
│   │   ├── core/      # Agent, memory, tools, config
│   │   ├── api/       # API routes & middleware
│   │   ├── models/    # Schemas & database
│   │   └── utils/     # Logger, helpers
│   └── tests/         # Backend test suite
├── frontend/          # React TypeScript frontend
│   └── src/
│       ├── components/ # React components
│       ├── hooks/      # Custom hooks
│       ├── services/   # API & WebSocket services
│       ├── store/      # Zustand state management
│       └── types/      # TypeScript definitions
├── docker/            # Docker configuration
├── scripts/           # Utility scripts
└── .github/           # GitHub Actions CI/CD
```

## 🔒 Security

- All secrets managed via environment variables
- API key authentication for all endpoints
- Rate limiting: 100 req/min per client
- Input validation & sanitization
- CORS configured for frontend access
- Code execution in sandboxed environment
- SQL injection prevention via SQLAlchemy

## 🚢 Deployment

### Production Checklist

1. Set `ENVIRONMENT=production`
2. Generate strong `API_KEY` and `SECRET_KEY`
3. Configure production PostgreSQL database
4. Set up HTTPS with reverse proxy
5. Enable monitoring and logging
6. Run database migrations

```bash
# Production deployment
bash scripts/deploy.sh production
```

## 🗺️ Roadmap

- [ ] Voice interface integration
- [ ] Custom tool creation UI
- [ ] Multi-agent orchestration
- [ ] Agent memory visualization
- [ ] Plugin system for extensions
- [ ] Mobile app (React Native)

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

## 👨‍💻 Author

Built with ❤️ by [pavanvzm](https://github.com/pavanvzm)

---

<p align="center">
  <strong>Star ⭐ this repo if you find it useful!</strong>
</p>
