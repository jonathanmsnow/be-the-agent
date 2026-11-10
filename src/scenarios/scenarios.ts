import type { Scenario } from "../engine/types";
import portInquiry from "./port-inquiry.json";
import contextCompaction from "./context-compaction.json";
import guardrailUpdate from "./guardrail-update.json";

const workspaceFiles = import.meta.glob("./workspaces/**/*", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;
const hiddenWorkspaceFiles = import.meta.glob("./workspaces/**/.*", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

function filesForScenario(id: string): Record<string, { content: string }> {
  const prefix = `./workspaces/${id}/`;
  return Object.fromEntries(
    Object.entries({ ...workspaceFiles, ...hiddenWorkspaceFiles })
      .filter(([path]) => path.startsWith(prefix))
      .map(([path, content]) => [path.slice(prefix.length), { content }]),
  );
}

function scenarioDifficulty(value: number): Scenario["difficulty"] {
  if (Number.isInteger(value) && value >= 1 && value <= 4) {
    return value as Scenario["difficulty"];
  }
  throw new Error(
    `Scenario difficulty must be an integer from 1 to 4: ${value}`,
  );
}

// export array of json scenario files that are loaded in
export const scenarios: Scenario[] = [
  portInquiry,
  contextCompaction,
  guardrailUpdate,
].map(
  (scenario) => ({
    ...scenario,
    files: filesForScenario(scenario.id),
    difficulty: scenarioDifficulty(scenario.difficulty),
  }),
);
