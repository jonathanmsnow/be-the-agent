import { useState } from "react";
import type { Scenario } from "../engine/types";
import {
  clearScenarioProgress,
  isScenarioCompleted,
  loadScenarioProgress,
  markScenarioCompleted,
} from "../progress";
import { Card } from "./Card";

export interface ScenarioCard {
  scenario: Scenario;
  onAction: (scenario: Scenario) => void;
  onReset: () => void;
}

/**
 * Component that renders a card for a given scenario.
 * @param {ScenarioCard} props - The scenario card data.
 * @returns {JSX.Element} The rendered scenario card component.
 */
export function ScenarioCard({ scenario, onAction, onReset }: ScenarioCard) {
  const [progress, setProgress] = useState(() =>
    loadScenarioProgress(scenario.id),
  );
  const [completed, setCompleted] = useState(() =>
    isScenarioCompleted(scenario.id),
  );
  const status = completed
    ? "Completed"
    : progress
      ? "In progress"
      : "ToDo";

  return (
    <Card
      className="scenario-card card--interactive"
      icon="✦"
      title={scenario.title}
      description={scenario.description}
      eyebrow={
        <div className="scenario-eyebrow">
          <label className="scenario-status scenario-status-toggle">
            <input
              type="checkbox"
              checked={completed}
              aria-label={`Mark ${scenario.title} as completed`}
              onChange={(event) => {
                if (event.target.checked) {
                  markScenarioCompleted(scenario.id);
                  setCompleted(true);
                  setProgress(loadScenarioProgress(scenario.id));
                } else {
                  clearScenarioProgress(scenario.id);
                  setCompleted(false);
                  setProgress(null);
                }
                onReset();
              }}
            />
            <span>{status}</span>
          </label>
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
        </div>
      }
    >
      <p className="scenario-transfer">
        <strong>Practice:</strong> {scenario.transfer}
      </p>
      <button
        className="start-button"
        onClick={(event) => {
          event.stopPropagation();
          onAction(scenario);
        }}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {progress?.state.completed
          ? "Review scenario"
          : progress
            ? "Resume scenario"
            : "Open simulator"}{" "}
        <span>→</span>
      </button>
    </Card>
  );
}
