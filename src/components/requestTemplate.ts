import { z } from "zod";
import type { ToolDef } from "../engine/types";

type JsonSchema = {
  type?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
};

function schemaFor(tool: ToolDef): JsonSchema {
  return z.toJSONSchema(tool.schema) as JsonSchema;
}

function emptyValues(schema: JsonSchema): Record<string, unknown> {
  const required = new Set(schema.required ?? []);
  return Object.fromEntries(
    Object.entries(schema.properties ?? {})
      .filter(([name]) => required.has(name))
      .map(([name, property]) => [name, emptyValue(property)]),
  );
}

function emptyValue(schema: JsonSchema): unknown {
  if (schema.type === "object") return emptyValues(schema);
  if (schema.type === "boolean") return false;
  if (schema.type === "number" || schema.type === "integer") return 0;
  if (schema.type === "array") return [];
  return "";
}

export function requestTemplate(tool: ToolDef) {
  return JSON.stringify(
    { tool: tool.name, args: emptyValues(schemaFor(tool)) },
    null,
    2,
  );
}
