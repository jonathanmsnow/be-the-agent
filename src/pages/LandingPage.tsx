import type { JSX } from "react/jsx-runtime";
import { ScenarioCard } from "../components/ScenarioCard";
import { scenarios } from "../scenarios/scenarios";
import type { Scenario } from "../engine/types";

export function LandingPage({
  setSelectedScenario,
}: {
  setSelectedScenario: (scenario: Scenario) => void;
}): JSX.Element {
  return (
    <main className="landing">
      <section className="hero">
        <div className="eyebrow">BE THE AGENT</div>
        <h1>Think like an agent.</h1>
        <p>
          Practice navigating messy context, choosing the right tools, and
          finding the answer before your context window runs out.
        </p>
      </section>
      <section className="scenario-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">CHOOSE YOUR MISSION</div>
            <h2>Available scenarios</h2>
          </div>
          <span className="scenario-count">
            {scenarios.length} scenario{scenarios.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="scenario-grid">
          {scenarios.map((scenario) =>
            ScenarioCard({
              scenario: scenario,
              onAction: () => {
                setSelectedScenario(scenario);
              },
            }),
          )}
        </div>
      </section>
    </main>
  );
}
