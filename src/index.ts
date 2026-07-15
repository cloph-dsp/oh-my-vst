import { define } from "@opencode-ai/plugin/v2/promise";
import type { Plugin } from "@opencode-ai/plugin/v2/promise";

/**
 * oh-my-vst - VST/Audio plugin development tools for OpenCode.
 *
 * Provides:
 * - Framework presets (iPlug2, JUCE, Faust, Cmajor, Rust)
 * - CLI installer for workspace configuration
 *
 * Note: VST subagents (vst-spec, vst-architect, vst-dsp, vst-gui, vst-validate)
 * are registered via .opencode/opencode.json (config-based), not via plugin hooks.
 * Plugin hooks (@opencode-ai/plugin v1/v2) do not register agents at runtime.
 */
const plugin: Plugin = define({
  id: "oh-my-vst",
  setup: async () => {
    // No-op: subagents are registered via the CLI installer (src/cli/index.ts).
    // @opencode-ai/plugin cannot register subagents at runtime; the CLI bridges
    // the gap by writing prompts into opencode.json's agent field.
  },
});

export default plugin;
export { presets } from "./presets.js";
