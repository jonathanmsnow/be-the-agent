import { useState } from "react";
import { ROLE, type Entry } from "../engine/types";
import { HelpTipTrigger } from "./HelpTip";

const resourceLabels = {
  [ROLE.RESULT]: "Tools",
  [ROLE.AGENT]: "Agent output",
  [ROLE.USER]: "User",
  [ROLE.SYSTEM]: "System",
} as const;

type ResourceRole = keyof typeof resourceLabels;

export function ContextIndicator({
  used,
  contextLimit,
  pct,
  entries,
  onTokensHelp,
}: {
  used: number;
  contextLimit: number;
  pct: number;
  entries: Entry[];
  onTokensHelp?: (persistent: boolean) => void;
}) {
  const [highlightedRole, setHighlightedRole] = useState<ResourceRole | null>(
    null,
  );
  const activeEntries = entries.filter((entry) => !entry.evicted);
  const breakdown = (Object.keys(resourceLabels) as ResourceRole[]).map(
    (role) => ({
      role,
      label: resourceLabels[role],
      tokens: activeEntries
        .filter((entry) => entry.role === role)
        .reduce((sum, entry) => sum + entry.tokens, 0),
      percent:
        (activeEntries
          .filter((entry) => entry.role === role)
          .reduce((sum, entry) => sum + entry.tokens, 0) /
          contextLimit) *
        100,
    }),
  );

  return (
    <div className="context-meter">
      <div className="context-meter-label">
        <b>CONTEXT</b>
        <span>
          {used} / {contextLimit} tokens
          <HelpTipTrigger
            id="tokens-help"
            label="Learn about tokens"
            onHover={() => onTokensHelp?.(false)}
            onClick={() => onTokensHelp?.(true)}
          />
        </span>
      </div>

      <div
        className={`context-meter-track ${pct >= 85 ? "danger" : ""}`}
        role="progressbar"
        aria-label="Context usage"
        aria-valuemin={0}
        aria-valuemax={contextLimit}
        aria-valuenow={used}
      >
        {activeEntries.map((entry, index) => (
          <div
            className={`context-meter-segment ${entry.role} ${
              highlightedRole === entry.role ? "highlighted" : ""
            }`}
            key={`${entry.role}-${index}`}
            title={`${resourceLabels[entry.role]}: ${entry.tokens} tokens`}
            onMouseEnter={() => setHighlightedRole(entry.role)}
            onMouseLeave={() => setHighlightedRole(null)}
            style={{
              flexBasis: `${(entry.tokens / contextLimit) * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="context-meter-breakdown" aria-label="Context breakdown">
        {breakdown.map(({ role, label, tokens, percent }) => (
          <button
            className={`context-meter-breakdown-item ${
              highlightedRole === role ? "highlighted" : ""
            }`}
            key={role}
            type="button"
            aria-label={`${label}: ${tokens} tokens, ${percent.toFixed(1)} percent of context`}
            onMouseEnter={() => setHighlightedRole(role)}
            onMouseLeave={() => setHighlightedRole(null)}
            onFocus={() => setHighlightedRole(role)}
            onBlur={() => setHighlightedRole(null)}
          >
            {label} ({percent.toFixed(1)}%)
          </button>
        ))}
      </div>
    </div>
  );
}
