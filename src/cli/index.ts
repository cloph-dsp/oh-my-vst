#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createAgentDefs } from "../agents/index.js";
import { presets } from "../presets.js";
import type { AgentConfig } from "../types.js";

const CONFIG_DIR = join(homedir(), ".config", "opencode");
const VST_CONFIG_PATH = join(CONFIG_DIR, "oh-my-vst.json");
const CONFIG_CANDIDATES = [
  join(CONFIG_DIR, "opencode.jsonc"),
  join(CONFIG_DIR, "opencode.json"),
];

const HELP = `
oh-my-vst - VST plugin development agents for OpenCode

Usage:
  oh-my-vst install   Install agents into opencode.json[c]
  oh-my-vst help      Show this help

The plugin adds 6 specialized agents:
  vst-orchestrator  - workflow manager
  vst-spec          - product brief & requirements
  vst-architect     - framework selection & architecture
  vst-dsp           - DSP algorithm implementation
  vst-gui           - UI design & implementation
  vst-validate      - quality validation

Configure the active framework preset in:
  ~/.config/opencode/oh-my-vst.json

Example:
  { "framework": "cmajor" }

Available frameworks: ${Object.keys(presets).join(", ")}
`.trim();

interface VSTConfig extends Record<string, unknown> {
  model?: string;
  framework?: string;
}

// Strip // and /* */ comments while preserving string contents.
function stripJSONCComments(text: string): string {
  let out = "";
  let i = 0;
  let inString = false;
  let escape = false;
  while (i < text.length) {
    const ch = text[i];
    if (inString) {
      out += ch;
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      i++;
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      i++;
      continue;
    }
    if (ch === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function writeJSON(path: string, data: Record<string, unknown>): void {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

function pickConfig(): { path: string; content: string; strippedComments: boolean } | null {
  for (const p of CONFIG_CANDIDATES) {
    if (existsSync(p)) {
      const raw = readFileSync(p, "utf-8");
      const stripped = stripJSONCComments(raw);
      const strippedFlag = stripped !== raw;
      return { path: p, content: stripped, strippedComments: strippedFlag };
    }
  }
  return null;
}

function applyPreset(
  agents: Record<string, AgentConfig>,
  framework: string,
): void {
  const preset = presets[framework];
  if (!preset) {
    console.error(`  Warning: unknown framework '${framework}' - skipping preset.`);
    return;
  }
  for (const [agentId, override] of Object.entries(preset.agents)) {
    const agent = agents[agentId];
    if (!agent) continue;
    if (override.skills) agent.skills = override.skills;
    if (override.mcps) agent.mcps = override.mcps;
  }
  for (const [agentId, addition] of Object.entries(preset.prompts)) {
    const agent = agents[agentId];
    if (!agent) continue;
    agent.prompt = (agent.prompt ?? "") + "\n\n## Framework: " + preset.name + "\n\n" + addition;
  }
}

async function install(): Promise<void> {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }

  // Read or initialize VST config
  let vstConfig: VSTConfig = {};
  if (existsSync(VST_CONFIG_PATH)) {
    try {
      const existingVST = JSON.parse(readFileSync(VST_CONFIG_PATH, "utf-8"));
      if (existingVST && typeof existingVST === "object") {
        vstConfig = existingVST as VSTConfig;
      }
    } catch (err) {
      console.error(`Warning: ${VST_CONFIG_PATH} is invalid JSON - using defaults.`);
      console.error(`  ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  writeJSON(VST_CONFIG_PATH, vstConfig);

  // Read existing opencode config - prefer .jsonc, fallback to .json
  const existing = pickConfig();
  let configPath: string;
  let configContent: string;
  if (existing) {
    configPath = existing.path;
    configContent = existing.content;
    if (existing.strippedComments) {
      console.log(`Note: stripped comments from ${configPath} (rewrite loses inline comments).`);
    }
  } else {
    configPath = CONFIG_CANDIDATES[1]; // opencode.json
    configContent = "{}";
  }

  let config: Record<string, unknown>;
  try {
    config = JSON.parse(configContent);
  } catch (err) {
    console.error(`x ${configPath} is invalid JSON. Fix it manually before installing.`);
    console.error(`  ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  // Register plugin reference (idempotent)
  const plugins = (config.plugin as Array<string | [string, unknown]>) ?? [];
  const hasPlugin = plugins.some((p) => {
    const name = typeof p === "string" ? p : p[0];
    return name === "oh-my-vst";
  });
  if (!hasPlugin) {
    plugins.push("oh-my-vst");
  }
  config.plugin = plugins;

  // Register agents (merge with existing; never overwrite user-customized)
  const existingAgents = (config.agent as Record<string, AgentConfig>) ?? {};
  const defs = createAgentDefs();
  const agents: Record<string, AgentConfig> = { ...existingAgents };
  let addedCount = 0;
  let keptCount = 0;
  for (const def of defs) {
    if (agents[def.id]) {
      keptCount++;
      continue;
    }
    agents[def.id] = {
      prompt: def.prompt,
      description: def.description,
      mode: def.mode,
      temperature: def.temperature,
    };
    addedCount++;
  }
  config.agent = agents;

  // Apply preset if specified
  if (vstConfig.framework) {
    applyPreset(agents, vstConfig.framework);
  }

  writeJSON(configPath, config);

  // If we wrote to .jsonc, also remove the orphan .json (if any) to prevent divergence.
  if (configPath.endsWith(".jsonc")) {
    const orphanJson = CONFIG_CANDIDATES[1];
    if (existsSync(orphanJson)) {
      try {
        unlinkSync(orphanJson);
        console.log(`Note: removed orphan ${orphanJson} (merged into ${configPath}).`);
      } catch (err) {
        console.warn(`Warning: could not remove orphan ${orphanJson}:`);
        console.warn(`  ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  console.log("\nv oh-my-vst installed!");
  console.log(`  Config written to: ${configPath}`);
  console.log(`  VST preset config: ${VST_CONFIG_PATH}`);
  console.log("  Restart OpenCode to activate the VST agents.");
  if (vstConfig.framework) {
    console.log(`\n  Active framework preset: ${vstConfig.framework}`);
  }
  console.log(`\n  Agents (${addedCount} new, ${keptCount} already present):`);
  for (const def of defs) {
    const isNew = !existingAgents[def.id];
    const status = isNew ? "(new)" : "(kept)";
    console.log(`    - ${def.id} (${def.mode}) ${status}`);
  }
}

async function main(): Promise<void> {
  const cmd = process.argv[2]?.toLowerCase();

  switch (cmd) {
    case "install":
      await install();
      break;
    case "help":
    case "--help":
    case "-h":
    case undefined:
      console.log(HELP);
      break;
    default:
      console.error(`Unknown command: ${cmd}\n`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Install failed:", err);
  process.exit(1);
});
