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
import { prettyPrintToolRegistry as formattedToolRegistry } from "../tools/toolRegistry";
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
      const callText = `${action.call?.tool} ${action.call?.args ? JSON.stringify(action.call.args) : ""}`;
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
  const [path, setPath] = useState("");
  const [tool, setTool] = useState<"read_file" | "list_files">("read_file");
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
          <span className="simulator-label">TOOLS</span>
        </header>
        <div className="composer">
          <div className="composer-label">
            YOUR TURN: emit one tool call, or answer
          </div>
          <div className="composer-row">
            <select
              onChange={(e) =>
                setTool(e.target.value as "read_file" | "list_files")
              }
            >
              {scenarioData.tools.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              className="composer-input"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="path"
            />
            <button
              className="action-button"
              onClick={() =>
                dispatch({ type: "RUN", call: { tool, args: { path } } })
              }
            >
              Run
            </button>
          </div>
          <div className="composer-row">
            <input
              className="composer-input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="your answer to the user"
            />
            <button
              className="action-button"
              onClick={() => dispatch({ type: "ANSWER", text: answer })}
            >
              Answer
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
