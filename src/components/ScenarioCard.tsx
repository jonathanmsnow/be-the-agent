import type { Scenario } from "../engine/types";

export interface ScenarioCard {
  scenario: Scenario;
  onAction: (scenario: Scenario) => void;
}

/**
 * Component that renders a card for a given scenario.
 * @param {ScenarioCard} props - The scenario card data.
 * @returns {JSX.Element} The rendered scenario card component.
 */
export function ScenarioCard({ scenario, onAction }: ScenarioCard) {
  return (
    <article className="scenario-card" key={scenario.id}>
      <div className="scenario-icon" aria-hidden="true">
        ✦
      </div>
      <div className="scenario-card-content">
        <div className="scenario-difficulty" aria-label={`Level ${scenario.difficulty} of 4`}>
          <span>Level {scenario.difficulty}</span>
          <span className="scenario-difficulty-separator" aria-hidden="true">
            /
          </span>
          <span>4</span>
        </div>
        <h3>{scenario.title}</h3>
        <p>{scenario.description}</p>
        <button className="start-button" onClick={() => onAction(scenario)}>
          Open simulator <span>→</span>
        </button>
      </div>
    </article>
  );
}
