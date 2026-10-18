import type { Scenario } from "../engine/types";

export function contextIndicator(
  used: number,
  scenarioData: Scenario,
  pct: number,
) {
  return (
    <div className="context-meter">
      <div className="context-meter-label">
        <b>CONTEXT</b>
        <span>
          {used} / {scenarioData.contextLimit} tokens
        </span>
      </div>

      <div className="context-meter-track">
        <div
          className={`context-meter-fill ${pct > 85 ? "danger" : ""}`}
          role="progressbar"
          aria-label="Context usage"
          aria-valuemin={0}
          aria-valuemax={scenarioData.contextLimit}
          aria-valuenow={used}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
