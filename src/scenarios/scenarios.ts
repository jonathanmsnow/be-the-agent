import type { Scenario } from "../engine/types";
import scenario1 from "./scenario1.json";
import contextCompaction from "./context-compaction.json";

function scenarioDifficulty(value: number): Scenario["difficulty"] {
  if (Number.isInteger(value) && value >= 1 && value <= 4) {
    return value as Scenario["difficulty"];
  }
  throw new Error(`Scenario difficulty must be an integer from 1 to 4: ${value}`);
}

// export array of json scenario files that are loaded in
export const scenarios: Scenario[] = [scenario1, contextCompaction].map(
  (scenario) => ({
    ...scenario,
    difficulty: scenarioDifficulty(scenario.difficulty),
  }),
);
