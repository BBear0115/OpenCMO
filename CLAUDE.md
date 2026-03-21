# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenCMO is an open-source AI Chief Marketing Officer — a multi-agent system for indie hackers and startups. It monitors SEO/GEO/SERP/Community metrics, generates platform-specific content, and visualizes competitive landscapes via an interactive 3D knowledge graph.

## Architecture

**Full-stack: Python backend + React TypeScript frontend**

- **Backend** (`src/opencmo/`): FastAPI + openai-agents framework, SQLite storage
- **Frontend** (`frontend/`): React 19 SPA with Vite, Tailwind CSS 4, TanStack Query, Three.js
- **Entry points**: `opencmo` (CLI chatbot), `opencmo-web` (web dashboard on port 8080)

### Backend layers

- `agents/cmo.py` — Orchestrator that delegates to 25+ specialist agents exposed as tools via `agent.as_tool()`
- `agents/*.py` — Platform-specific content experts (twitter, reddit, linkedin, etc.) and market intelligence agents (seo, geo, community)
- `tools/*.py` — Python functions for crawling, search, SEO audit, SERP tracking, GEO detection, community scraping, publishing
- `service.py` — Business logic (monitor CRUD, keyword management, competitor discovery, reports)
- `storage.py` — Async SQLite with 15+ tables (projects, scans, discussions, competitors, chat sessions)
- `web/app.py` — FastAPI routes, SPA serving at `/app/`, REST API at `/api/v1/`, SSE streaming chat
- `config.py` — ENV-driven model resolution with per-agent overrides (`OPENCMO_MODEL_{AGENT}`)
- `scheduler.py` — APScheduler cron jobs for automated scans

### Frontend layers

- `pages/` — Route-level components (Dashboard, SEO, GEO, SERP, Community, Graph, Chat, etc.)
- `components/` — UI organized by domain (charts/, chat/, monitors/, auth/, layout/)
- `hooks/` — TanStack Query hooks per domain (useProjects, useSeoData, useGraphData, etc.)
- `api/` — HTTP client with Bearer token auth, one module per API domain
- `i18n/` — English + Chinese translations via React context

### Key patterns

- Frontend proxies `/api` to `http://127.0.0.1:8080` in dev (vite.config.ts)
- Frontend base path is `/app/` — all routes nest under this
- Chat uses SSE streaming (`POST /api/v1/chat` returns event stream)
- Agent framework is `openai-agents` (Anthropic's framework, import as `from agents import Agent`)
- Model config supports OpenAI, NVIDIA, DeepSeek, Ollama, or any OpenAI-compatible API via `OPENAI_BASE_URL`

## Commands

### Setup

```bash
pip install -e ".[all]"   # Install with all optional deps
crawl4ai-setup             # Initialize crawler (required once)
cp .env.example .env       # Configure API keys
```

### Backend

```bash
opencmo                    # Interactive CLI chatbot
opencmo-web                # Web dashboard (http://localhost:8080/app)
```

### Frontend

```bash
cd frontend
npm install
npm run dev                # Dev server at localhost:5173
npm run build              # Production build (tsc + vite)
```

### Tests

```bash
pytest tests/              # Run all tests
pytest tests/test_web.py   # Run single test file
pytest tests/ -k "test_seo" # Run tests matching pattern
```

## Environment Variables

Required: `OPENAI_API_KEY` (or equivalent for chosen provider)

Key optional variables — see `.env.example` for full list:
- `OPENCMO_MODEL_DEFAULT` / `OPENCMO_MODEL_{AGENT}` — model selection
- `OPENAI_BASE_URL` — custom API provider
- `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY` — extended GEO platforms
- `OPENCMO_WEB_TOKEN` — dashboard auth token
- `DATAFORSEO_LOGIN/PASSWORD` — SERP tracking
- `OPENCMO_AUTO_PUBLISH=1` + Reddit/Twitter credentials — auto-publishing
