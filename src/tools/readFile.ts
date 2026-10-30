import { z } from "zod";
import { defineTool } from "../engine/types";

export const readFile = defineTool({
  name: "read_file",
  description: "Return the contents of a file.",
  schema: z.object({
    path: z.string().describe("Relative path to the file, e.g. src/hello.txt"),
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
      .refine(({ start, end }) => end > start, {
        message: "End index must be greater than start index",
        path: ["end"],
      })
      .optional()
      .describe("Optional view range to limit the content returned"),
  }),
  run(level, { path, view_range }) {
    const f = level.files[path];
    if (!f) {
      return `Error: ${path} not found`;
    }
    if (view_range) {
      const { start, end } = view_range;
      return f.content.slice(start, end);
    }
    return f.content;
  },
});
