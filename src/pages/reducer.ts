import { runTool } from "../engine/runTool";
import { type Scenario, ActionType } from "../engine/types";
import { calculateTokens } from "../utils";
import type { State, Action } from "./Simulator";

export function reducer(
  state: State,
  action: Action,
  scenarioData: Scenario,
): State {
  switch (action.type) {
    case ActionType.RUN: {
      const callText = `${action.call?.tool} ${
        typeof action.call?.args === "string"
          ? action.call.args
          : action.call?.args
            ? JSON.stringify(action.call.args)
            : ""
      }`;
      const { output, cost } = runTool(
        scenarioData,
        action.call?.tool,
        action.call?.args,
      );
      return {
        ...state,
        log: [
          ...state.log,
          { role: "you", text: callText, tokens: calculateTokens(callText) },
          { role: "result", text: output, tokens: cost },
        ],
      };
    }
    case ActionType.ANSWER: {
      const ok = scenarioData.answerKeywords.every((k) =>
        action.text?.includes(k),
      );
      return {
        ...state,
        verdict: ok ? "Correct!" : "Not quite.",
        log: [
          ...state.log,
          {
            role: "you",
            text: `answer: ${action.text}`,
            tokens: calculateTokens(action.text || ""),
          },
        ],
      };
    }
  }
}
