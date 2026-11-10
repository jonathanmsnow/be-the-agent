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
      .map(([entry, isDirectory]) => (isDirectory ? `${entry}/` : entry));
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
}
