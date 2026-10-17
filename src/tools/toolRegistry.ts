import type { ToolDef } from "../engine/types";
import { listFiles } from "./listFiles";
import { readFile } from "./readFile";
import { z } from "zod";

export const TOOL_REGISTRY: Record<
  string,
  ToolDef<z.ZodObject<any>>
> = Object.fromEntries([readFile, listFiles].map((t) => [t.name, t]));

export const prettyPrintToolRegistry = () => {
  return JSON.stringify(
    Object.values(TOOL_REGISTRY).map((t) => {
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
