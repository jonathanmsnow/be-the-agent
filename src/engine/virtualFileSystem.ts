export interface VirtualFile {
  content: string;
}

function normalizePath(path: string): string {
  const parts: string[] = [];

  for (const part of path.replaceAll("\\", "/").split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (parts.length === 0) throw new Error("Path escapes workspace");
      parts.pop();
    } else {
      parts.push(part);
    }
  }

  return parts.join("/");
}

export class VirtualFileSystem {
  private readonly files: Map<string, VirtualFile>;

  constructor(files: Record<string, VirtualFile>) {
    this.files = new Map(
      Object.entries(files).map(([path, file]) => [
        normalizePath(path),
        { ...file },
      ]),
    );
  }

  listDirectory(path = "."): string[] {
    const directory = normalizePath(path);
    const prefix = directory ? `${directory}/` : "";
    const entries = new Map<string, boolean>();

    for (const filePath of this.files.keys()) {
      if (!filePath.startsWith(prefix)) continue;
      const remainder = filePath.slice(prefix.length);
      const [entry, ...nestedParts] = remainder.split("/");
      if (entry) entries.set(entry, nestedParts.length > 0);
    }

    return [...entries.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([entry, isDirectory]) => {
        const fullPath = `${prefix}${entry}`;
        return isDirectory ? `${fullPath}/` : fullPath;
      });
  }

  readFile(path: string, viewRange?: { start: number; end: number }): string {
    const normalizedPath = normalizePath(path);
    const file = this.files.get(normalizedPath);
    if (!file) {
      if (this.listDirectory(normalizedPath).length > 0) {
        return `Error: ${path} is a directory`;
      }
      return `Error: ${path} not found`;
    }

    return viewRange
      ? file.content.slice(viewRange.start, viewRange.end)
      : file.content;
  }

  writeFile(path: string, content: string): string {
    const normalizedPath = normalizePath(path);
    this.files.set(normalizedPath, { content });
    return `Updated ${normalizedPath}`;
  }

  replaceInFile(path: string, find: string, replace: string): string {
    const normalizedPath = normalizePath(path);
    const file = this.files.get(normalizedPath);
    if (!file) {
      if (this.listDirectory(normalizedPath).length > 0) {
        return `Error: ${path} is a directory`;
      }
      return `Error: ${path} not found`;
    }

    const matches = file.content.split(find).length - 1;
    if (matches === 0) {
      return `Error: edit not applied. The requested text was not found in ${path}. Read the current file before trying again.`;
    }
    if (matches > 1) {
      return `Error: edit not applied. The requested text matched ${matches} locations in ${path}. Provide more surrounding text so the edit is unambiguous.`;
    }

    const content = file.content.replace(find, replace);
    this.files.set(normalizedPath, { content });
    return [
      `Updated ${normalizedPath}`,
      "",
      `- ${find.replaceAll("\n", "\n- ")}`,
      `+ ${replace.replaceAll("\n", "\n+ ")}`,
    ].join("\n");
  }
}
