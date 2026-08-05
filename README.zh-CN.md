<p align="center">
<details>
<summary><b>🌐 语言 / Language: 简体中文 ▾</b></summary>

- [English](README.md)
- [简体中文](README.zh-CN.md)

</details>
</p>

# OpenWorker

**[openworker.com](https://openworker.com)** · [下载](#下载) · [Issues](https://github.com/andrewyng/openworker/issues)

<a href="https://trendshift.io/repositories/91434?utm_source=trendshift-badge&amp;utm_medium=badge&amp;utm_campaign=badge-trendshift-91434" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/trendshift/repositories/91434/daily?language=Python" alt="andrewyng%2Fopenworker | Trendshift" width="250" height="55"/></a>

> **Beta** - OpenWorker 目前处于公开测试阶段:功能完整可用、可自动更新,我们正在积极打磨细节。[Issues](https://github.com/andrewyng/openworker/issues) 欢迎反馈。

**帮你搞定日常事务的 AI。** OpenWorker 是一款开源 AI 同事,常驻你的桌面,交付的是**完成的工作成果**,而不只是对话:一份精修过的文档、一条带数据的 Slack 回复、一条已更新的日历日程、一个已分诊的收件箱。

它运行在你自己的机器上,不绑定任何模型:自带 OpenAI、Anthropic、Google 或开源权重提供商的 API key,或者用 Ollama 完全本地运行。你的数据只通过*你选择*的模型和集成离开你的机器。

[![OpenWorker 工作原理](docs/assets/how-it-works.png)](https://openworker.com)

## 下载

[**⬇ macOS(Apple Silicon)**](https://download.openworker.com/mac)
<sub>macOS 12+ · 已签名并公证 · 自动更新</sub>

[**⬇ Windows 10/11 (x64)**](https://download.openworker.com/windows)
<sub>构建包尚未代码签名,SmartScreen 会弹出警告;签名工作正在进行中</sub>

打开应用,添加模型 key(或指向 Ollama),然后提出一个真实需求。

## 工作原理

1. 告诉 OpenWorker 你想要的结果——"准备一份客户简报"、"理清我的日历"、"起草一份报告"、"检查发布在 Jira 和 GitHub 上的进展"。
2. 它会将任务拆解为步骤,在你的桌面、文件和已连接的应用之间协同完成。
3. 在做出任何有影响的动作之前——发送消息、修改日历、运行命令——它会先征询你的意见,由你批准或调整。
4. 你拿到的是完成的交付物,而不是一张待办清单。

底层架构:

```text
┌────────────────────────────────────────────────┐
│              OpenWorker desktop app            │  native shell + GUI
├────────────────────────────────────────────────┤
│           local agent server (Python)          │  engine · tools · connectors - built on aisuite
├───────────────┬────────────────┬───────────────┤
│  your files   │   your tools   │  your model   │  everything runs with your keys,
│  & terminal   │ 25+ connectors │  any provider │  on your machine
└───────────────┴────────────────┴───────────────┘
```

(图中注释:原生外壳 + GUI / 引擎 · 工具 · 连接器——基于 aisuite / 一切使用你的 key,运行在你的机器上)

## 它能做什么

- **产出真实的交付物**——文档、电子表格、报告和网页,以文件形式落地,你可以打开、分享。
- **从 Slack 使用**——在频道里提及 `@OpenWorker`,你的桌面上会开启一个会话,工作使用你的工具完成,答案以主题回复的形式返回。
- **使用你的日常工具**——25+ 集成,包括 GitHub、Slack、Jira、Notion、Linear、HubSpot、Outlook、monday.com、Gmail 和 Google Calendar,外加你的**终端和本地文件**。任何可通过 [MCP](https://modelcontextprotocol.io/) 触达的工具也能接入,并支持按工具控制权限。
- **按计划运行**——为重复性工作设置自动化:晨间简报、周报、对某个频道的持续监控。每次运行都会以完整记录的形式落在应用中。
- **行动前先征询**——写入、发送和 shell 命令都需要审批。无人值守的运行会把待办事项放进收件箱,而不是自行行动。

## 自带模型

模型访问权属于你:选择提供商、粘贴 key、随时切换。开箱即支持:

**OpenAI · Anthropic · Google Gemini · Inkling (Thinking Machines) · GLM (Z.ai) · DeepSeek · Kimi (Moonshot) · Qwen · MiniMax · Mistral · Grok (xAI)**——以及通过 **Together** 和 **Fireworks** 使用的开源权重模型,还有通过 **Ollama** 完全本地运行的模型。

精选模型列表会标注我们已针对工具调用场景验证过的模型。添加任意模型字符串,后果自负。

## 隐私

OpenWorker 是本地优先的。一切都在你的机器上:智能体循环、你的对话、连接器令牌和模型 key——全部存放在应用的本地密钥存储中。唯一的云端组件是一个为连接器协调 OAuth 握手的小型服务。你完全可以不登录使用应用——通过手动创建的凭据/API key 使用连接器。

## 从源码运行

前置条件:Python 3.10+、Node 20+,以及(桌面外壳需要)Rust 工具链(通过 [rustup](https://rustup.rs/) 安装)。

```shell
git clone https://github.com/andrewyng/openworker
cd openworker

# 1. 一次性引导 - 在 .venv 创建 Python 虚拟环境
#    (Windows 上请从 Git Bash 或 WSL 运行)
bash packaging/setup_dev_env.sh

# 2. 启动本地 agent 服务
.venv/bin/openworker-server --cwd ~/some/project --port 8765
#    (Windows: .venv\Scripts\openworker-server.exe)

# 3. 另开一个终端,启动 UI
cd surfaces/gui
npm install
npm run dev        # 浏览器 UI,运行在 Vite 开发端口
```

独立服务器会在启动时于
`<state-dir>/sidecar-8765.token` 生成一次性令牌;Vite 启动时会读取这个仅当前用户可读的文件。
直接调用 API 时,请将该值放入 `X-OpenWorker-Token` 请求头。桌面应用
使用内存中的启动令牌,从不写入磁盘。

如果想运行完整桌面应用而不是浏览器 UI,把第 3 步换成 `npm run tauri dev`(在 `surfaces/gui/` 下执行)——Tauri 外壳会启动窗口并自行监管服务器。

测试:`.venv/bin/pytest`(后端)、`surfaces/gui` 下的 `npm test` 和 `npm run e2e`(GUI 单元测试 + 封闭式端到端测试)。桌面安装包通过 `packaging/build_dmg.sh` / `packaging/build_windows.ps1` 构建。

## 仓库结构

| 目录 | 内容 |
|---|---|
| `coworker/` | Python 后端 - 智能体引擎、模型提供商、连接器、MCP 客户端、记忆、自动化 |
| `surfaces/gui/` | 桌面应用 - React UI + 负责监管服务器的 Tauri 外壳 |
| `stt/` | 语音输入的语音转文字旁路组件(Rust) |
| `packaging/` | 安装包构建(macOS DMG、Windows)、自动更新清单、开发引导 |
| `docs/` | 设计规格与决策记录 |
| `tests/` | 后端测试套件 |

## 基于 aisuite 构建

OpenWorker 的引擎构建于 [**aisuite**](https://github.com/andrewyng/aisuite) 之上,这是一个轻量级 Python 库,为各家 LLM 提供商提供统一的 chat-completions API,并带有支持工具、工具包和 MCP 的 agents 层。如果你想构建自己的 agent 框架而不是使用我们的,可以从那里开始;本仓库正是 aisuite 能力的活参考。

OpenWorker 最初在 aisuite 仓库内开发,后来才迁到现在的独立仓库;感谢 aisuite 贡献者们的成果,OpenWorker 正是基于它们构建的。

## 参与贡献

欢迎提交贡献和 bug 报告——开一个 [issue](https://github.com/andrewyng/openworker/issues) 或 pull request。应用会自动更新,因此修复能很快到达用户手中。
提交 PR 时,请附上"修复前损坏状态"和"修复后效果"的截图。我们很快会添加可供你贡献的功能。
请注意,我们是根据内部列表和目标积极开发的,因此可能不会批准那些添加已在开发中功能、或偏离我们愿景的 PR。

## 许可证

MIT - 参见 [LICENSE](LICENSE)。
