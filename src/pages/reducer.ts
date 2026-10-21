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
        ],
      };
    }
    case ActionType.ANSWER: {
      const ok = scenarioData.answerKeywords.every((k) =>
        action.text?.includes(k),
      );
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
            text: ok
              ? scenarioData.answerResponses.correct
              : scenarioData.answerResponses.incorrect,
            tokens: calculateTokens(
              ok
                ? scenarioData.answerResponses.correct
                : scenarioData.answerResponses.incorrect,
            ),
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
      };
    }
  }
}
