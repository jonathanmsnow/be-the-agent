import { z } from 'zod'
export interface Level {
  system: string
  briefing: { from: string; message: string }
  contextLimit: number
  files: Record<string, { content: string; tokens: number }>
  answerKeywords: string[],
  tools: string[]
}

export interface ToolCall {
  tool: string,
  args: unknown
}

export interface ToolResult { output: string; cost: number }

export interface ToolDef<S extends z.ZodObject = z.ZodObject> {
  name: string
  description: string
  schema: S
  run(level: Level, args: z.infer<S>): ToolResult
  terminal?: boolean
}

// helper so each tool file gets its args inferred without annotations
export const defineTool = <S extends z.ZodObject>(t: ToolDef<S>) => t