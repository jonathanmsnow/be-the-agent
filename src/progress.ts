import type { State } from "./pages/reducer";
import type { VirtualFile } from "./engine/virtualFileSystem";

export interface ScenarioProgressSnapshot {
  scenarioId: string;
  state: State;
  toolsWidth: number;
  planning: {
    draft: string;
    history: string[];
  };
  reflection: {
    answered: boolean;
    choice: string;
    text: string;
  };
  completionDismissed: boolean;
  files: Record<string, VirtualFile>;
}

const PREFIX = "be-the-agent:progress:v1:";
const COMPLETED_PREFIX = "be-the-agent:completed:v1:";

export function loadScenarioProgress(
  scenarioId: string,
): ScenarioProgressSnapshot | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}${scenarioId}`);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as ScenarioProgressSnapshot;
    return snapshot.scenarioId === scenarioId ? snapshot : null;
  } catch {
    return null;
  }
}

export function saveScenarioProgress(snapshot: ScenarioProgressSnapshot): void {
  try {
    localStorage.setItem(
      `${PREFIX}${snapshot.scenarioId}`,
      JSON.stringify(snapshot),
    );
  } catch {
    // Storage can be unavailable or full; simulator remains usable.
  }
}

export function clearScenarioProgress(scenarioId: string): void {
  try {
    localStorage.removeItem(`${PREFIX}${scenarioId}`);
    localStorage.removeItem(`${COMPLETED_PREFIX}${scenarioId}`);
  } catch {
    // Storage can be unavailable; in-memory restart still resets state.
  }
}

export function isScenarioCompleted(scenarioId: string): boolean {
  try {
    if (localStorage.getItem(`${COMPLETED_PREFIX}${scenarioId}`) === "true") {
      return true;
    }
    return loadScenarioProgress(scenarioId)?.state.completed ?? false;
  } catch {
    return false;
  }
}

export function markScenarioCompleted(scenarioId: string): void {
  try {
    localStorage.setItem(`${COMPLETED_PREFIX}${scenarioId}`, "true");
  } catch {
    // Storage can be unavailable; UI state may still reflect this action.
  }
}

export function hasCompletedScenarioProgress(): boolean {
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(COMPLETED_PREFIX) && localStorage.getItem(key) === "true") {
        return true;
      }
    }

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(PREFIX)) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const snapshot = JSON.parse(raw) as Partial<ScenarioProgressSnapshot>;
      if (snapshot.state?.completed) return true;
    }
  } catch {
    // Storage can be unavailable or contain malformed data.
  }

  return false;
}
