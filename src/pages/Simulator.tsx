import { useReducer, useState, useRef, useEffect } from "react";
import { LogEntry } from "../components/LogEntry";
import { contextIndicator } from "../components/contextIndicator";
import { runTool } from "../engine/runTool";
import {
  ActionType,
  type Entry,
  type Scenario,
  type ToolCall,
} from "../engine/types";
import {
  TOOL_REGISTRY,
  prettyPrintToolRegistry as formattedToolRegistry,
} from "../tools/toolRegistry";
import { calculateTokens } from "../utils";

interface State {
  log: Entry[];
  verdict: string | null;
}

type Action = {
  type: ActionType;
  call?: ToolCall;
  text?: string;
};

function requestTemplate(toolName: string) {
  return JSON.stringify({ tool: toolName, args: { path: "" } }, null, 2);
}

const initial: State = {
  verdict: null,
  log: [],
};

function createInitialState(scenarioData: Scenario): State {
  const tools = formattedToolRegistry();
  return {
    verdict: null,
    log: [
      {
        role: "system",
        text: scenarioData.system,
        tokens: calculateTokens(scenarioData.system),
      },
      {
        role: "system",
        text: `Tools: ${tools}`,
        tokens: calculateTokens(tools),
      },
      {
        role: "user",
        text: `${scenarioData.briefing.from}: ${scenarioData.briefing.message}`,
        tokens: calculateTokens(scenarioData.briefing.message),
      },
    ],
  };
}

function reducer(state: State, action: Action, scenarioData: Scenario): State {
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

export function Simulator({
  scenarioData,
  onBack,
}: {
  scenarioData: Scenario;
  onBack: () => void;
}) {
  const [state, dispatch] = useReducer(
    (currentState: State, action: Action) =>
      reducer(currentState, action, scenarioData),
    initial,
    () => createInitialState(scenarioData),
  );
  const [selectedTool, setSelectedTool] = useState(scenarioData.tools[0] || "");
  const [rawRequest, setRawRequest] = useState(() =>
    requestTemplate(scenarioData.tools[0] || ""),
  );
  const [requestError, setRequestError] = useState("");
  const [answer, setAnswer] = useState("");
  const [toolsWidth, setToolsWidth] = useState(38);
  const simulatorRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const used: number = state.log.reduce((sum, e) => sum + e.tokens, 0);
  const pct: number = Math.min(100, (used / scenarioData.contextLimit) * 100);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.log.length]);

  const resizeFromPointer = (clientX: number) => {
    const bounds = simulatorRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const nextWidth = ((clientX - bounds.left) / bounds.width) * 100;
    setToolsWidth(Math.min(65, Math.max(25, nextWidth)));
  };

  /* eslint-disable jsx-a11y-x/no-noninteractive-element-interactions, jsx-a11y-x/no-noninteractive-tabindex */
  return (
    <div
      ref={simulatorRef}
      className="simulator"
      style={{ gridTemplateColumns: `${toolsWidth}% 8px 1fr` }}
    >
      <aside className="tools-pane">
        <header className="simulator-header">
          <button className="back-button" onClick={onBack}>
            ← All scenarios
          </button>
          <span className="simulator-label">Agent Tools</span>
        </header>
        <div className="tool-client">
          <div className="tool-section-label">COLLECTION / TOOLS</div>
          <div
            className="tool-list"
            role="listbox"
            aria-label="Available tools"
          >
            {scenarioData.tools.map((toolName) => {
              return (
                <button
                  className={`tool-item${selectedTool === toolName ? " selected" : ""}`}
                  key={toolName}
                  role="option"
                  aria-selected={selectedTool === toolName}
                  onClick={() => {
                    setSelectedTool(toolName);
                    setRawRequest(requestTemplate(toolName));
                    setRequestError("");
                  }}
                >
                  <span className="tool-method">POST</span>
                  <span>{toolName}</span>
                </button>
              );
            })}
          </div>

          <div className="tool-request">
            <div className="tool-request-heading">
              <span className="tool-method">POST</span>
              <strong>{selectedTool || "Select a tool"}</strong>
            </div>
            <p className="tool-description">
              {TOOL_REGISTRY[selectedTool]?.description}
            </p>
            <label className="request-label" htmlFor="raw-tool-request">
              Request body · JSON
            </label>
            <textarea
              id="raw-tool-request"
              className="request-editor"
              value={rawRequest}
              onChange={(event) => {
                setRawRequest(event.target.value);
                setRequestError("");
              }}
              spellCheck={false}
              aria-describedby={requestError ? "request-error" : undefined}
            />
            {requestError && (
              <p className="request-error" id="request-error" role="alert">
                {requestError}
              </p>
            )}
            <button
              className="action-button send-button"
              onClick={() => {
                try {
                  const request = JSON.parse(rawRequest) as ToolCall;
                  if (
                    typeof request.tool !== "string" ||
                    !Object.prototype.hasOwnProperty.call(request, "args")
                  ) {
                    throw new Error('JSON must include "tool" and "args".');
                  }
                  setRequestError("");
                  dispatch({ type: ActionType.RUN, call: request });
                } catch (error) {
                  if (error instanceof SyntaxError) {
                    setRequestError("");
                    dispatch({
                      type: ActionType.RUN,
                      call: { tool: selectedTool, args: rawRequest },
                    });
                    return;
                  }
                  setRequestError(
                    error instanceof Error
                      ? error.message
                      : "Could not send request.",
                  );
                }
              }}
            >
              Send request
            </button>
          </div>

          <div className="answer-section">
            <label className="request-label" htmlFor="answer-input">
              Final answer
            </label>
            <input
              id="answer-input"
              className="composer-input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="your answer to the user"
            />
            <button
              className="action-button"
              onClick={() =>
                dispatch({ type: ActionType.ANSWER, text: answer })
              }
            >
              Submit answer
            </button>
          </div>
        </div>
      </aside>

      <div
        className="pane-divider"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize tools pane"
        aria-valuemin={25}
        aria-valuemax={65}
        aria-valuenow={toolsWidth}
        tabIndex={0}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          resizeFromPointer(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            resizeFromPointer(event.clientX);
          }
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            const delta = event.key === "ArrowLeft" ? -2 : 2;
            setToolsWidth((width) => Math.min(65, Math.max(25, width + delta)));
          }
        }}
      />
      <main className="chat-pane">
        <div className="simulator-sticky">
          <header className="simulator-header">
            <span className="simulator-label">LIVE SIMULATOR</span>
          </header>
          {contextIndicator(used, scenarioData, pct)}
        </div>

        <div className="log">
          {state.log.map((e, i) => (
            <LogEntry key={i} entry={e} />
          ))}
          {state.verdict && (
            <p>
              <b>{state.verdict}</b>
            </p>
          )}
          <div ref={bottomRef} />
        </div>
      </main>
    </div>
  );
  /* eslint-enable jsx-a11y-x/no-noninteractive-element-interactions, jsx-a11y-x/no-noninteractive-tabindex */
}
