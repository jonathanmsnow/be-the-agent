import type { Scenario } from "../engine/types";

export function contextIndicator(
  used: any,
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
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
