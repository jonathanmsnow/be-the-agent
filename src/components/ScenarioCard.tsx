import type { Scenario } from "../engine/types";
import { Card } from "./Card";

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
    <Card
      className="scenario-card card--interactive"
      icon="✦"
      title={scenario.title}
      description={scenario.description}
      eyebrow={
        <div
          className="scenario-difficulty"
          aria-label={`Difficulty ${scenario.difficulty} of 4`}
        >
          <span>Difficulty {scenario.difficulty}</span>
          <span className="scenario-difficulty-separator" aria-hidden="true">
            /
          </span>
          <span>4</span>
        </div>
      }
    >
      <button
        className="start-button"
        onClick={(event) => {
          event.stopPropagation();
          onAction(scenario);
        }}
      >
        Open simulator <span>→</span>
      </button>
    </Card>
  );
}
