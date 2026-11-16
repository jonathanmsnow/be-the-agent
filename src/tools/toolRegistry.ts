import type { ToolDef } from "../engine/types";
import { listFiles } from "./listFiles";
import { readFile } from "./readFile";
import { editFile } from "./editFile";
import { z } from "zod";

export const TOOL_REGISTRY: Record<
  string,
  ToolDef<z.ZodObject<any>>
> = Object.fromEntries([readFile, listFiles, editFile].map((t) => [t.name, t]));

export const prettyPrintToolRegistry = (toolNames?: string[]) => {
  const tools = toolNames
    ? toolNames.flatMap((name) => {
        const tool = TOOL_REGISTRY[name];
        return tool ? [tool] : [];
      })
    : Object.values(TOOL_REGISTRY);

  return JSON.stringify(
    tools.map((t) => {
      return {
        name: t.name,
        description: t.description,
        input_schema: {
          type: z.toJSONSchema(t.schema).type,
          properties: z.toJSONSchema(t.schema).properties,
          required: z.toJSONSchema(t.schema).required,
        },
      };
    }),
    null,
    2,
  );
};
