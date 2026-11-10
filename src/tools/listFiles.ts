import { z } from "zod";
import { defineTool } from "../engine/types";

export const listFiles = defineTool({
  name: "list_files",
  description:
    "List files and directories in the current working directory or a specified directory. Directory names end with /.",
  schema: z.object({
    path: z
      .string()
      .default(".")
      .describe(
        "Optional path to the directory. Defaults to the current working directory, e.g. src/",
      ),
  }),
  run(_level, { path }, fileSystem) {
    const files = fileSystem.listDirectory(path);
    return files.length > 0 ? files.join("\n") : `Error: ${path} not found`;
  },
});
