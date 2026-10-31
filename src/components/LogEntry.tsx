import type { Entry } from "../engine/types";

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
      <span className="text">{entry.text}</span>
      {showTokens && (
        <span className="tokens">
          {entry.evicted ? "compacted" : `+${entry.tokens} tokens`}
        </span>
      )}
    </div>
  );
}
