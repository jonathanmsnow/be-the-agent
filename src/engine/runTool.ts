import z from "zod";
import { TOOL_REGISTRY } from "../tools/toolRegistry";
import type { Scenario, ToolResult } from "./types";
import { calculateTokens } from "../utils";

export function runTool(
  level: Scenario,
  name: string | undefined,
  rawArgs: unknown,
): ToolResult {
  if (!name) {
    return { output: "Error: no tool specified", cost: 15 };
  }
  const tool = TOOL_REGISTRY[name];
  if (!tool || !level.tools.includes(name)) {
    return { output: `Error: no such tool "${name}"`, cost: 15 };
  }
  let args = rawArgs;
  if (typeof rawArgs === "string") {
    try {
      args = JSON.parse(rawArgs);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid JSON body";
      const output = `Error: invalid JSON body\n${message}`;
      return { output, cost: calculateTokens(output) };
    }
  }
  const parsed = tool.schema.safeParse(args);
  if (!parsed.success) {
    return {
      output: `Error: invalid arguments\n${z.prettifyError(parsed.error)}`,
      cost: calculateTokens(z.prettifyError(parsed.error)),
    };
  }
  const result = tool.run(level, parsed.data);
  return { output: result, cost: calculateTokens(result) };
}
