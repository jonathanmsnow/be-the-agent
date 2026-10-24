import { z } from "zod";
import { defineTool } from "../engine/types";

export const listFiles = defineTool({
  name: "list_files",
  description:
    "List the files in the current working directory or a specified directory.",
  schema: z.object({
    path: z
      .string()
      .default(".")
      .describe(
        "Optional path to the directory. Defaults to the current working directory, e.g. src/",
      ),
  }),
  run(level, { path }) {
    const directory = path === "." ? "" : path;
    const files = Object.keys(level.files).filter((p) =>
      p.startsWith(directory),
    );
    return files.length > 0 ? files.join("\n") : `Error: ${path} not found`;
  },
});
