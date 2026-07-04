---
name: oh-my-vst
description: Configure and improve oh-my-vst for VST plugin development. Progressive workflow with spec → architect → DSP → GUI → validate phases.
user-invocable: true
---

# oh-my-vst Configuration Skill

You help users configure, customize, and safely improve their
oh-my-vst VST plugin development system.

## What Is oh-my-vst

oh-my-vst is a progressive VST plugin development system with:
- **Phase-based workflow**: Spec → Architect → DSP → GUI → Validate
- **Agent orchestration**: Orchestrator manages specialized subagents per phase
- **Framework agnostic**: iPlug2, JUCE, Faust, Cmajor, VST3 SDK, Rust
- **Context7 integration**: Live framework documentation lookup
- **Quality standards**: Zero warnings, numerical validation, real-time safety

## When to Use

Use this skill when:

- User wants to start VST plugin development
- User needs to tune agent models or prompts
- User wants to add custom subagents for specific VST workflows
- User needs to configure MCP permissions for framework documentation
- Recurring workflow friction suggests a config improvement

## Development Workflow

VST plugins are developed in phases:

### Phase 1: Specification (`@spec`)
Define product brief, format decisions, constraints, implementation path
**Agent:** `@spec`
**Framework docs:** None (conceptual)

### Phase 2: Architecture (`@architect`)
Design plugin architecture, choose framework, define layer structure
**Agent:** `@architect`
**Framework docs:** Use context7 to compare frameworks

### Phase 3: DSP (`@dsp`)
Implement audio processing, parameter smoothing, state management
**Agent:** `@dsp`
**Framework docs:** Use context7 for framework-specific APIs

### Phase 4: GUI (`@gui`)
Design and implement user interface, responsive layout, parameter binding
**Agent:** `@gui`
**Framework docs:** Use context7 for UI APIs

### Phase 5: Validation (`@validate`)
Quality checks, performance testing, host integration
**Agent:** `@validate`
**Framework docs:** None (testing framework)

## Config Files

Concrete files oh-my-vst agents should know:

| Path | Use |
|---|---|
| `~/.config/opencode/oh-my-vst.json` | Main config with agents, models, skills, MCPs |
| `~/.config/opencode/oh-my-vst.jsonc` | JSONC version with comments |
| `~/.config/opencode/oh-my-vst/prompts/agent.md` | Full prompt replacement for built-in agent |
| `~/.config/opencode/oh-my-vst/prompts/agent_append.md` | Append-only prompt tuning |
| `~/.config/opencode/oh-my-vst/presets/framework.json` | Framework-specific presets |

Built-in agents:
- `orchestrator` - Main workflow coordinator
- `spec` - Specification phase
- `architect` - Architecture phase
- `dsp` - DSP implementation phase
- `gui` - GUI implementation phase
- `validate` - Validation phase

## Configuration Shapes

### Tune agent model/skills/MCPs

Edit config:

```jsonc
{
  "agents": {
    "orchestrator": {
      "model": "openai/gpt-4",
      "skills": ["vst-creation", "autoresearch"],
      "mcps": ["*", "!context7"]
    },
    "dsp": {
      "model": "openai/gpt-4",
      "skills": ["vst-creation"],
      "mcps": ["context7"]
    }
  }
}
```

### Append instructions to agent prompt

Create append file:

```text
~/.config/opencode/oh-my-vst/prompts/dsp_append.md
```

Content:

```markdown
## Local DSP Preference

- Always use SIMD when processing stereo
- Pre-allocate buffers to 4096 samples
- Use exponential smoothing for frequency parameters
```

### Replace agent prompt entirely

Create full replacement:

```text
~/.config/opencode/oh-my-vst/prompts/orchestrator.md
```

**Warning:** Full replacements must restate all essential agent behavior.

## Presets

Presets are framework-specific configurations:

| Preset | Framework | Agent Models |
|--------|-----------|--------------|
| `iplug2` | iPlug2 | Default models + SVG UI knowledge |
| `juce` | JUCE | Default models + WebView UI knowledge |
| `faust` | Faust | Fast models + rapid prototyping |
| `cmajor` | Cmajor | Default models + Amorph integration |
| `rust` | Rust | Default models + vst-rs knowledge |

Switch presets:

```jsonc
{
  "preset": "iplug2",
  "presets": {
    "iplug2": {
      "dsp": {
        "mcps": ["context7"]
      }
    },
    "juce": {
      "dsp": {
        "mcps": ["context7"]
      }
    }
  }
}
```

## Context7 Integration

Use context7 MCP for framework documentation:

```javascript
// Look up library ID
context7_resolve-library_id("juce")

// Query documentation
context7_query-docs("/juce", "How to create AudioProcessor?")
```

**Agents with context7:**
- `@architect`: Compare frameworks, choose implementation path
- `@dsp`: Look up framework-specific DSP APIs
- `@gui`: Look up UI framework APIs

## Quality Standards

oh-my-vst enforces these standards:

- **Zero-warning builds**: `/WX` or `-Werror`
- **Numerical validation**: Measured dB targets (±0.1 dB level matching)
- **Real-time safety**: No allocations in audio thread
- **Parameter smoothing**: No zipper noise (light: 1-10ms, strong: 10-100ms)
- **Performance**: CPU < budget at 44.1/48/96 kHz

## Custom Agents

Add custom VST subagents:

```jsonc
{
  "agents": {
    "spectral": {
      "model": "openai/gpt-4",
      "prompt": "You implement spectral audio processing algorithms (FFT, STFT, phase vocoder). Return numerical validation results.",
      "orchestratorPrompt": "Delegate to @spectral for spectral analysis, FFT-based processing, phase vocoder, or STFT effects. Do not use it for time-domain processing.",
      "skills": ["vst-creation"],
      "mcps": ["context7"]
    }
  }
}
```

## Safe Improvement Rules

Configuration changes affect future agent behavior, so treat them as user-owned.

1. **Ask before changing config or prompts.**
   - Explain the proposed improvement briefly.
   - State which file would change.
   - Ask for confirmation unless the user explicitly requested the exact edit.
2. **Prefer narrow changes.**
   - Do not rewrite large prompts when a small rule solves the problem.
   - Do not add custom agents for one-off tasks.
3. **Preserve existing user settings.**
   - Merge with current config rather than regenerating from scratch.
   - Keep comments and formatting where practical for JSONC files.
4. **Avoid hidden behavior changes.**
   - Mention cost, permissions, or delegation changes before applying them.
   - Be explicit if a model/provider change may increase spend.
5. **Tell the user about restart requirements.**
   - OpenCode may need a restart for config, prompt, agent, skill, MCP, or plugin
     changes to take effect.

## Workflow Examples

### Start a new VST plugin

```
User: Make a vintage lowpass filter
Orchestrator: Starting Specification Phase... (delegates to @spec)
Spec: Product intent, format decisions, constraints complete. Framework?
User: iPlug2
Orchestrator: Starting Architecture Phase with iPlug2... (delegates to @architect)
Architect: Architecture complete. Proceeding to DSP implementation... (delegates to @dsp)
DSP: DSP implementation complete. Proceeding to GUI... (delegates to @gui)
GUI: GUI implementation complete. Proceeding to validation... (delegates to @validate)
Validate: All tests pass. Plugin ready for release.
```

### Framework comparison

```
User: Compare iPlug2 vs JUCE for a simple effect
Orchestrator: (delegates to @architect)
Architect: Using context7 for framework comparison...
[Shows matrix: iPlug2 has SVG UI, JUCE has WebView UI]
```

### Performance issue

```
User: CPU usage too high
Orchestrator: (delegates to @validate)
Validate: CPU profiling shows bottleneck in filter function...
[Optimization suggestions: use SIMD, reduce filter order]
```

## Examples

### Add context7 to DSP agent

Proposal:

```text
I can add context7 to the @dsp agent so it can look up framework-specific
DSP APIs. Target: ~/.config/opencode/oh-my-vst.json. Apply it?
```

### Add spectral processing agent

Proposal:

```text
This looks repeatable enough for a custom spectral processing agent. I can add
`@spectral` with vst-creation skill and context7 MCP. Orchestrator will delegate
FFT-based processing to it. Apply to your oh-my-vst config?
```

### Warn about restart

After editing:

```text
Updated the config. This should apply on the next OpenCode run; restart
OpenCode if you need it immediately.
```

## Final Checklist

- [ ] Did the user confirm config/prompt edits, unless explicitly requested?
- [ ] Did the edit preserve existing settings?
- [ ] Is the active preset still valid?
- [ ] Are skill/MCP/tool permissions intentional and minimal?
- [ ] Did you mention OpenCode restart/next-run behavior?

## Phase Gates

Do not advance to next phase until current phase completion:

**Spec → Architect:**
- Product intent is one sentence and specific
- Implementation path is chosen and justified
- Constraints are explicit and measurable
- Parameter contract is complete
- Acceptance tests are written

**Architect → DSP:**
- Framework is chosen
- Architecture layers are defined (DSP, UI, Host)
- State management approach is defined
- Buffer sizes and memory layout are planned

**DSP → GUI:**
- Core algorithms are implemented
- Parameter smoothing is done
- State management is working
- No NaN/Inf at control extremes

**GUI → Validate:**
- Controls are implemented
- Parameter binding works
- Layout is responsive
- No UI threading issues

**Validate → Complete:**
- All acceptance tests pass
- Performance meets targets
- No known bugs or crashes