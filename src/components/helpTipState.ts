import tipDefinitions from "./helpTips.json";

export type TipDefinition = {
  id: string;
  label: string;
  title: string;
  body: string;
  targetId?: string;
  fallbackTargetId?: string;
  triggerId?: string;
  scenarioId?: string | null;
};

export const TIP_DEFINITIONS = tipDefinitions as TipDefinition[];

export function tipsForScenario(scenarioId: string) {
  return TIP_DEFINITIONS.filter(
    (tip) => !tip.scenarioId || tip.scenarioId === scenarioId,
  );
}

export function tipForTarget(tips: TipDefinition[], targetId: string) {
  return tips.find((tip) => tip.targetId === targetId || tip.id === targetId);
}

export type TipTriggerContext = {
  elapsedMs: number;
  toolRunCount: number;
};

type TipTrigger = (context: TipTriggerContext) => boolean;

const TIP_TRIGGERS: Record<string, TipTrigger> = {
  idleBeforeTool: ({ elapsedMs, toolRunCount }) =>
    toolRunCount === 0 && elapsedMs >= 10_000,
};

export function shouldTriggerTip(
  tip: TipDefinition,
  context: TipTriggerContext,
) {
  return tip.triggerId ? TIP_TRIGGERS[tip.triggerId]?.(context) ?? false : false;
}

const STORAGE_KEY = "be-the-agent-seen-tips";
let memorySeen = new Set<string>();

export function readSeen(): Set<string> {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored
      ? new Set<string>(JSON.parse(stored) as string[])
      : new Set(memorySeen);
  } catch {
    return new Set(memorySeen);
  }
}

export function writeSeen(seen: Set<string>) {
  memorySeen = new Set(seen);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  } catch {
    // In-memory state keeps tips working when storage is unavailable.
  }
}

export function isVisible(anchor: HTMLElement) {
  const rect = anchor.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  );
}
