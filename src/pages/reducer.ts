import { runTool } from "../engine/runTool";
import {
  type Entry,
  type Scenario,
  type ToolCall,
  ActionType,
  ROLE,
} from "../engine/types";
import { calculateTokens } from "../utils";

export interface State {
  log: Entry[];
  hintIndex: number;
  answerStepIndex: number;
}

export type Action = {
  type: ActionType;
  call?: ToolCall;
  text?: string;
};
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
      const path =
        typeof action.call?.args === "object" &&
        action.call.args !== null &&
        "path" in action.call.args &&
        typeof action.call.args.path === "string"
          ? action.call.args.path
          : undefined;
      const interruption = path
        ? Object.entries(scenarioData.toolInterrupts ?? {}).find(
            ([blockedPath]) =>
              path === blockedPath ||
              path.endsWith(`/${blockedPath}`),
          )?.[1]
        : undefined;
      return {
        ...state,
        log: [
          ...state.log,
          {
            role: ROLE.AGENT,
            text: callText,
            tokens: calculateTokens(callText),
          },
          { role: ROLE.RESULT, text: output, tokens: cost },
          ...(interruption
            ? [
                {
                  role: ROLE.USER,
                  text: interruption,
                  tokens: calculateTokens(interruption),
                },
              ]
            : []),
        ],
      };
    }
    case ActionType.ANSWER: {
      const step = scenarioData.answerSteps?.[state.answerStepIndex];
      const keywords = step?.keywords ?? scenarioData.answerKeywords;
      const ok = keywords.every((k) =>
        action.text?.includes(k),
      );
      const response = ok
        ? (step?.response ?? scenarioData.answerResponses.correct)
        : scenarioData.answerResponses.incorrect;
      return {
        ...state,
        log: [
          ...state.log,
          {
            role: ROLE.AGENT,
            text: `${action.text}`,
            tokens: calculateTokens(action.text || ""),
          },
          {
            role: ROLE.USER,
            text: response,
            tokens: calculateTokens(response),
          },
          ...(!ok && scenarioData.hints[state.hintIndex]
            ? [
                {
                  role: ROLE.USER,
                  text: scenarioData.hints[state.hintIndex],
                  tokens: calculateTokens(scenarioData.hints[state.hintIndex]),
                },
              ]
            : []),
        ],
        hintIndex: ok ? state.hintIndex : state.hintIndex + 1,
        answerStepIndex:
          ok && step
            ? Math.min(state.answerStepIndex + 1, scenarioData.answerSteps!.length - 1)
            : state.answerStepIndex,
      };
    }
    case ActionType.SUMMARY: {
      const summary = action.text?.trim() || "";
      if (!summary) return state;

      return {
        ...state,
        log: [
          ...state.log.filter((entry) => entry.role === ROLE.SYSTEM),
          {
            role: ROLE.SYSTEM,
            text: summary,
            tokens: calculateTokens(summary),
          },
        ],
      };
    }
  }
}
