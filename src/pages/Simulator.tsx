import { useReducer, useState, useRef, useEffect } from "react";
import { LogEntry } from "../components/LogEntry";
import { ContextIndicator } from "../components/ContextTracker";
import { ToolView } from "../components/ToolView";
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
import { reducer } from "./reducer";

export interface State {
  log: Entry[];
  verdict: string | null;
}

export type Action = {
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
        <ToolView
          tools={scenarioData.tools.flatMap((name) => {
            const tool = TOOL_REGISTRY[name];
            return tool ? [tool] : [];
          })}
          dispatch={dispatch}
        />
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
          <ContextIndicator
            used={used}
            scenarioData={scenarioData}
            pct={pct}
            entries={state.log}
          />
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
