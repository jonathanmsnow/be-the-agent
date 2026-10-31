import {
  shouldTriggerTip,
  tipForTarget,
  tipsForScenario,
  TIP_DEFINITIONS,
  type TipDefinition,
  type TipTriggerContext,
} from "./helpTips";

export {
  shouldTriggerTip,
  tipForTarget,
  tipsForScenario,
  TIP_DEFINITIONS,
  type TipDefinition,
  type TipTriggerContext,
};

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
