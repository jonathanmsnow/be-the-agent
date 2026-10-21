import { ROLE, type Entry } from "../engine/types";

export function LogEntry({ entry }: { entry: Entry }) {
  const label = entry.role === ROLE.AGENT ? "agent (you)" : entry.role;
  return (
    <div className={`entry ${entry.role}`}>
      <span className="role">[{label}]</span>
      <span className="text">{entry.text}</span>
      <span className="tokens">+{entry.tokens} tokens</span>
    </div>
  );
}
