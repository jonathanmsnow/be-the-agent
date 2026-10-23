import type { Entry } from "../engine/types";

export function LogEntry({ entry }: { entry: Entry }) {
  return (
    <div className={`entry ${entry.role}${entry.evicted ? " evicted" : ""}`}>
      <span className="role">[{entry.role}]</span>
      <span className="text">{entry.text}</span>
      <span className="tokens">
        {entry.evicted ? "compacted" : `+${entry.tokens} tokens`}
      </span>
    </div>
  );
}
