import { z } from "zod";
import { defineTool } from "../engine/types";

export const editFile = defineTool({
  name: "edit_file",
  description:
    "Replace one exact text match in a file. Read the file first, then provide enough text to identify one location. Protected paths are blocked by the surrounding software.",
  schema: z.object({
    path: z.string().describe("Relative path to the file to edit"),
    find: z.string().describe("Exact text to replace, including whitespace"),
    replace: z.string().describe("Text to put in its place"),
  }),
  run(level, { path, find, replace }, fileSystem) {
    const protectedPath = level.protectedPaths?.some(
      (blockedPath) => path === blockedPath || path.endsWith(`/${blockedPath}`),
    );
    if (protectedPath) {
      return `Error: edit blocked for protected path "${path}"`;
    }
    const readOnlyPath = Object.entries(level.readOnlyPaths ?? {}).find(
      ([readOnly]) => path === readOnly || path.endsWith(`/${readOnly}`),
    );
    if (readOnlyPath) {
      return `Error: edit blocked. ${path} is read-only. ${readOnlyPath[1]}`;
    }
    return fileSystem.replaceInFile(path, find, replace);
  },
});
