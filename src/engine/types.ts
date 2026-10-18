import { z } from "zod";
export interface Scenario {
  id: string;
  title: string;
  description: string;
  system: string;
  briefing: { from: string; message: string };
  contextLimit: number;
  files: Record<string, { content: string; tokens: number }>;
  answerKeywords: string[];
  tools: string[];
}
export type Role = "system" | "user" | "you" | "result";

export interface Entry {
  role: Role;
  text: string;
  tokens: number;
  evicted?: boolean;
}

export interface ToolCall {
  tool: string;
  args: unknown;
}

export const ActionType = {
  RUN: "RUN",
  ANSWER: "ANSWER",
} as const;

export type ActionType = (typeof ActionType)[keyof typeof ActionType];

export interface ToolResult {
  output: string;
  cost: number;
}

export interface ToolDef<S extends z.ZodObject = z.ZodObject> {
  name: string;
  description: string;
  schema: S;
  run(level: Scenario, args: z.infer<S>): string;
  terminal?: boolean;
}

// helper so each tool file gets its args inferred without annotations
export const defineTool = <S extends z.ZodObject>(t: ToolDef<S>) => t;
