export interface AgentDef {
    id: string;
    prompt: string;
    description: string;
    mode: "primary" | "subagent" | "all";
    temperature?: number;
}
/**
 * Create all VST development agent definitions for oh-my-vst plugin.
 */
export declare function createAgentDefs(): AgentDef[];
