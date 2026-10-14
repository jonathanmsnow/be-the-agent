import z from "zod";
import { TOOL_REGISTRY } from "../tools/toolRegistry";
import type { Scenario, ToolResult } from "./types";

export function runTool(level: Scenario, name: string, rawArgs: unknown): ToolResult {
  const tool = TOOL_REGISTRY[name]
  if (!tool || !level.tools.includes(name)) {
    return { output: `Error: no such tool "${name}"`, cost: 15 }
  }
  const parsed = tool.schema.safeParse(rawArgs)
  if (!parsed.success) {
    return { output: `Error: invalid arguments\n${z.prettifyError(parsed.error)}`, cost: 30 }
  }
  return tool.run(level, parsed.data)
}