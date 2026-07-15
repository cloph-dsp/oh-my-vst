# oh-my-vst

Progressive VST plugin development agents for [OpenCode](https://opencode.ai).
Spec -> Architect -> DSP -> GUI -> Validate.

## What it is

An OpenCode plugin that registers six specialized agents for VST3/AU/AAX
plugin development across iPlug2, JUCE, Faust, Cmajor, and Rust frameworks.
The plugin ships framework presets (per-agent MCP connections and prompt
additions) and a CLI installer.

## Agents

| Agent              | Mode     | Purpose                                                |
| ------------------ | -------- | ------------------------------------------------------ |
| `vst-orchestrator` | primary  | Workflow manager, phase gates, framework selection     |
| `vst-spec`         | subagent | Product brief, requirements, parameter contract        |
| `vst-architect`    | subagent | Framework choice, architecture layers, signal flow     |
| `vst-dsp`          | subagent | Algorithm implementation, real-time safety, validation |
| `vst-gui`          | subagent | UI design, responsive layout, parameter binding        |
| `vst-validate`     | subagent | QA, benchmarks, host compatibility, release checks     |

Mention an agent with `@vst-dsp`, etc.

## Framework presets

Each preset configures per-agent MCP connections and appends framework-specific
prompt additions:

- **iPlug2** - SVG UI, IControl, CMake+Ninja
- **JUCE** - AudioProcessor, WebView, Projucer
- **Faust** - `.dsp` + C++ wrapper
- **Cmajor** - Amorph MCP, single-file DSP+UI
- **Rust** - nih-plug, vst-rs

Select a preset by setting `framework` in `~/.config/opencode/oh-my-vst.json`:

```json
{ "framework": "cmajor" }
```

The Amorph MCPs (`amorph`, `amorph-instrument`, `amorph-midi`) are auto-attached
when `framework = "cmajor"`.

## Install (global)

Requires [Bun](https://bun.sh) >= 1.x.

```bash
bun install -g oh-my-vst
oh-my-vst install
```

The `install` command registers the plugin and its six agents in
`~/.config/opencode/opencode.json`. Restart OpenCode after install.

## Local development

```bash
git clone https://github.com/cloph-dsp/oh-my-vst
cd oh-my-vst
bun install
bun run build
bun link
oh-my-vst install
```

Edit prompts in `src/agents/*.ts`, presets in `src/presets.ts`. Rebuild
(`bun run build`) after source changes.

## Why agents (not skills)

OpenCode plugins cannot register subagents at runtime - agent definitions must
live in `opencode.json`'s `agent` field (per `@opencode-ai/plugin` v1/v2
limitations). The CLI bridges this gap: it copies the bundled agent prompts
into your global config so the agents become invokable.

## License

MIT
