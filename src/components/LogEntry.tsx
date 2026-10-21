import { ROLE, type Entry } from "../engine/types";

export function LogEntry({ entry }: { entry: Entry }) {
  return (
    <div className={`entry ${entry.role}`}>
      <span className="role">[{entry.role}]</span>
      <span className="text">{entry.text}</span>
      <span className="tokens">+{entry.tokens} tokens</span>
    </div>
  );
}
