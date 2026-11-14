import { runTool } from "../engine/runTool";
import {
  type Entry,
  type Scenario,
  type ToolCall,
  ActionType,
  ROLE,
} from "../engine/types";
import { calculateTokens } from "../utils";
import type { VirtualFileSystem } from "../engine/virtualFileSystem";

export interface State {
  log: Entry[];
  hintIndex: number;
  toolRunCount: number;
  toolRunsAtLastWrongAnswer: number;
  pendingHint?: string;
  answerStepIndex: number;
  completed: boolean;
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
  fileSystem: VirtualFileSystem,
): State {
  switch (action.type) {
    case ActionType.PLAN: {
      const plan = action.text?.trim() || "";
      if (!plan) return state;

      const thinking = `Thinking: ${plan}`;
      return {
        ...state,
        log: [
          ...state.log,
          {
            role: ROLE.AGENT,
            text: thinking,
            tokens: calculateTokens(thinking),
          },
        ],
      };
    }
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
        fileSystem,
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
        toolRunCount: state.toolRunCount + 1,
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
      const keywords = step?.keywords ?? scenarioData.answerKeywords ?? [];
      const answer = action.text ?? "";
      const ok = keywords.every((k) => answer.includes(k));
      const canProgressHelp =
        state.hintIndex === 0 ||
        state.toolRunCount > state.toolRunsAtLastWrongAnswer;
      const response = ok
        ? (step?.response.correct ?? scenarioData.answerResponses?.correct ?? "")
        : (step?.response.incorrect ?? scenarioData.answerResponses?.incorrect ?? "");
      const help =
        !ok && scenarioData.hints[state.hintIndex] && canProgressHelp
          ? scenarioData.hints[state.hintIndex]
          : !ok && state.hintIndex > 0 && !canProgressHelp
            ? "Before asking for more help, use a tool to gather new evidence and revise your response."
            : undefined;
      return {
        ...state,
        pendingHint: help,
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
        ],
        hintIndex: ok || !canProgressHelp ? state.hintIndex : state.hintIndex + 1,
        toolRunsAtLastWrongAnswer: ok
          ? state.toolRunsAtLastWrongAnswer
          : canProgressHelp
            ? state.toolRunCount
            : state.toolRunsAtLastWrongAnswer,
        answerStepIndex:
          ok && step
            ? Math.min(state.answerStepIndex + 1, scenarioData.answerSteps!.length - 1)
            : state.answerStepIndex,
        completed:
          state.completed ||
          (ok &&
            (!scenarioData.answerSteps ||
              state.answerStepIndex === scenarioData.answerSteps.length - 1)),
      };
    }
    case ActionType.DISMISS_HINT:
      return {
        ...state,
        pendingHint: undefined,
      };
    case ActionType.SUMMARY: {
      const summary = action.text?.trim() || "";
      if (!summary) return state;

      return {
        ...state,
        log: [
          ...state.log.filter(
            (entry) => entry.role === ROLE.SYSTEM && !entry.isSummary,
          ),
          {
            role: ROLE.SYSTEM,
            text: summary,
            tokens: calculateTokens(summary),
            isSummary: true,
          },
        ],
      };
    }
  }
}
