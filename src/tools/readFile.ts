import { z } from "zod";
import { defineTool } from "../engine/types";

export const readFile = defineTool({
  name: "read_file",
  description: "Return the contents of a file.",
  schema: z.object({
    path: z.string().describe("Absolute path to the file, e.g. src/hello.txt"),
    view_range: z
      .object({
        start: z
          .number()
          .int()
          .nonnegative()
          .describe("Start index of the view range"),
        end: z
          .number()
          .int()
          .nonnegative()
          .describe("End index of the view range"),
      })
      .optional()
      .describe("Optional view range to limit the content returned"),
  }),
  run(level, { path }) {
    const f = level.files[path];
    return f ? f.content : `Error: ${path} not found`;
  },
});
