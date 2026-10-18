import scenario1 from "./scenario1.json";
import type { Scenario } from "../engine/types";

export interface ScenarioCard {
  id: string;
  title: string;
  description: string;
  scenario: Scenario;
}

export const scenarios: ScenarioCard[] = [
  {
    id: "scenario1",
    title: "Find the server port",
    description:
      "Inspect an unfamiliar project, use the right tools, and answer a question hidden in its configuration.",
    scenario: scenario1 as Scenario,
  },
];
