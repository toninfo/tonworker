<p align="center">
<details>
<summary><b>🌐 Language / 语言: English ▾</b></summary>

- [简体中文](README.md) (default)
- [English](README.en.md)

</details>
</p>

# TonWorker

[Download](#download) · [Issues](https://github.com/toninfo/tonworker/issues) · [Releases](https://github.com/toninfo/tonworker/releases)

**AI that gets your everyday tasks done.** TonWorker is an open-source AI coworker that lives on your desktop and delivers **finished work**, not just chat: a polished document, a Slack reply with the numbers, an updated calendar, a triaged inbox.

It runs on your machine and doesn't lock you into any model: bring your own API key for OpenAI, Anthropic, Google, or an open-weight provider, or run fully local with Ollama. Your data leaves your machine only through the model and integrations *you* choose.

[![How TonWorker works](docs/assets/how-it-works.png)](https://github.com/toninfo/tonworker)

## Download

Builds from this fork ([toninfo/tonworker](https://github.com/toninfo/tonworker)); Chinese UI by default:

[**⬇ macOS (Apple Silicon)**](https://github.com/toninfo/tonworker/releases/latest/download/TonWorker-macos-arm64.dmg)
<sub>macOS 12+ · Release artifacts from this fork</sub>

[**⬇ macOS (Intel)**](https://github.com/toninfo/tonworker/releases/latest/download/TonWorker-macos-x64.dmg)
<sub>macOS 12+ · Intel / x86_64</sub>

[**⬇ Windows 10/11 (x64)**](https://github.com/toninfo/tonworker/releases/latest/download/TonWorker-windows-setup.exe)
<sub>SmartScreen may warn when the build is not Authenticode-signed</sub>

See all assets (including `.msi`) on the [Releases](https://github.com/toninfo/tonworker/releases) page.

Open the app, add a model key (or point it at Ollama), and ask for something real.

## How it works

1. Tell TonWorker the outcome you want - "prepare a customer brief," "untangle my calendar," "draft a report," "check where the release stands across Jira and GitHub."
2. It breaks the task into steps and works across your desktop, files, and connected apps.
3. Before anything consequential - sending a message, changing a calendar, running a command - it checks in and you approve or redirect.
4. You get the finished deliverable, not a to-do list.

Under the hood:

```text
┌────────────────────────────────────────────────┐
│              TonWorker desktop app            │  native shell + GUI
├────────────────────────────────────────────────┤
│           local agent server (Python)          │  engine · tools · connectors - built on aisuite
├───────────────┬────────────────┬───────────────┤
│  your files   │   your tools   │  your model   │  everything runs with your keys,
│  & terminal   │ 25+ connectors │  any provider │  on your machine
└───────────────┴────────────────┴───────────────┘
```

## What it can do

- **Produce real deliverables** - documents, spreadsheets, reports, and web pages land as files you can open and share.
- **Use your everyday tools** - connect GitHub, Slack, Notion, HubSpot, Outlook, etc. via **manually pasted credentials**, plus your **terminal and local files**. Tools over [MCP](https://modelcontextprotocol.io/) still work (local MCP OAuth included). This fork has **no** managed `@TonWorker` Slack/GitHub message relay.
- **Run on a schedule** - automations for recurring work: a morning brief, a weekly report, and similar. Runs land in the app with full transcripts.
- **Ask before acting** - writes, sends, and shell commands are approval-gated. Unattended runs park their asks in an inbox instead of acting on their own.

## Bring your own model

Model access is yours: pick a provider, paste your key, switch anytime. Supported out of the box:

**OpenAI · Anthropic · Google Gemini · Inkling (Thinking Machines) · GLM (Z.ai) · DeepSeek · Kimi (Moonshot) · Qwen · MiniMax · Mistral · Grok (xAI)** - plus open-weight models via **Together** and **Fireworks**, and fully local models via **Ollama**.

A curated model list marks what we've verified for tool-calling work. Adding any model string works at your own risk.

## Privacy

TonWorker is local-first. Everything lives on your machine: the agent loop, your conversations, connector tokens, and model keys - all in the app's local secret store.

**This fork removes** cloud sign-in, managed one-click OAuth, and Slack/GitHub message relay. It does not call external cloud APIs, Auth0, or the relay WebSocket. Use **manually pasted connector credentials** (or local MCP); no cloud account is required.

## Run from source

Prerequisites: Python 3.10+, Node 20+, and (for the desktop shell) the Rust toolchain via [rustup](https://rustup.rs/).

> **Note:** `tomllib` requires Python 3.11+. If your default is 3.10, create the venv with 3.12, e.g.  
> `/usr/bin/python3.12 -m venv .venv`, then run the bootstrap / `pip install` steps below.

```shell
git clone https://github.com/toninfo/tonworker
cd tonworker

# 1. One-time bootstrap - creates the Python venv at .venv
#    (on Windows, run from Git Bash or WSL)
bash packaging/setup_dev_env.sh

# 2. Start the local agent server
.venv/bin/tonworker-server --cwd ~/some/project --port 8765
#    (Windows: .venv\Scripts\tonworker-server.exe)

# 3. In a second terminal, start the UI
cd surfaces/gui
npm install
npm run dev        # browser UI on the Vite dev port
```

The standalone server creates a per-launch token at
`<state-dir>/sidecar-8765.token`; Vite reads that user-only file when it starts.
For direct API calls, send its value in the `X-TonWorker-Token` header. The
desktop app uses an in-memory launch token instead and never writes it to disk.

To run the full desktop app instead of the browser UI, replace step 3 with `npm run tauri dev` (from `surfaces/gui/`) - the Tauri shell launches the window and supervises the server itself.

Tests: `.venv/bin/pytest` (server), `npm test` and `npm run e2e` in `surfaces/gui` (GUI unit + hermetic end-to-end). Desktop bundles are built with `packaging/build_dmg.sh` / `packaging/build_windows.ps1`.

## Repository layout

| Directory | What's in it |
|---|---|
| `coworker/` | Python backend - agent engine, model providers, connectors, MCP client, memory, automations |
| `surfaces/gui/` | Desktop app - React UI + Tauri shell that supervises the server |
| `stt/` | Speech-to-text sidecar (Rust) for voice input |
| `packaging/` | Installer builds (macOS DMG, Windows), auto-update manifest, dev bootstrap |
| `docs/` | Design specs and decision logs |
| `tests/` | Backend test suite |

## Built on aisuite

TonWorker's engine is built on [**aisuite**](https://github.com/andrewyng/aisuite), a lightweight Python library providing a unified chat-completions API across LLM providers and an agents layer with tools, toolkits, and MCP support. If you want to build your own agent harness rather than use ours, start there; this repo is a working reference for what aisuite can carry.

TonWorker was originally developed inside the aisuite repository before moving to its own home here; thanks to the aisuite contributors whose work it builds on.

## Contributing

Contributions and bug reports are welcome - open an [issue](https://github.com/toninfo/tonworker/issues) or a pull request. The app updates itself, so fixes reach installs quickly.
For any PR, please attach screenshots of what was broken and how it is fixed now. We will shortly add features that you can contribute to.
Please note that we are actively developing based off a internal list and goal, so we may not approve PRs that add features that are already under-development or deviates from our vision.

## License

MIT - see [LICENSE](LICENSE).
