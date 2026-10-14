import type { ToolDef } from "../engine/types";
import { listFiles } from "./listFiles";
import { readFile } from "./readFile";

export const TOOL_REGISTRY: Record<string, ToolDef<any>> = Object.fromEntries(
  [readFile, listFiles].map(t => [t.name, t])
)