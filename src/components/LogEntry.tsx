import type { Entry } from "../engine/types";

function JsonValue({
  value,
  label,
  depth = 0,
}: {
  value: unknown;
  label?: string;
  depth?: number;
}) {
  if (value !== null && typeof value === "object") {
    const entries = Array.isArray(value)
      ? value.map((item, index) => [String(index), item] as const)
      : Object.entries(value);
    const kind = Array.isArray(value) ? "array" : "object";

    return (
      <details className="json-node" open={depth <= 1}>
        <summary>
          {label && <span className="json-key">{label}: </span>}
          <span className="json-summary">
            {kind} ({entries.length})
          </span>
        </summary>
        <div className="json-children">
          {entries.map(([key, child]) => (
            <JsonValue key={key} value={child} label={key} depth={depth + 1} />
          ))}
        </div>
      </details>
    );
  }

  return (
    <div className="json-value">
      {label && <span className="json-key">{label}: </span>}
      <span className={`json-primitive json-${typeof value}`}>
        {JSON.stringify(value)}
      </span>
    </div>
  );
}

function parseToolDefinitions(text: string): unknown | null {
  try {
    return JSON.parse(text.slice("Tools: ".length));
  } catch {
    return null;
  }
}

function ToolDefinitions({ text }: { text: string }) {
  const value = parseToolDefinitions(text);

  if (value === null) {
    return <span>{text}</span>;
  }

  return (
    <div className="tool-definitions">
      <span>Tools:</span>
      <JsonValue value={value} />
    </div>
  );
}

export function LogEntry({
  entry,
  id,
  showTokens = true,
}: {
  entry: Entry;
  id?: string;
  showTokens?: boolean;
}) {
  return (
    <div
      id={id}
      className={`entry ${entry.role}${entry.evicted ? " evicted" : ""}${
        showTokens ? "" : " no-tokens"
      }`}
    >
      <span className="role">[{entry.role}]</span>
      <span className="text">
        {entry.role === "system" && entry.text.startsWith("Tools: ")
          ? <ToolDefinitions text={entry.text} />
          : entry.text}
      </span>
      {showTokens && (
        <span className="tokens">
          {entry.evicted ? "compacted" : `+${entry.tokens} tokens`}
        </span>
      )}
    </div>
  );
}
