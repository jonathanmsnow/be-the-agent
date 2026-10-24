import { useReducer, useState, useRef, useEffect } from "react";
import { LogEntry } from "../components/LogEntry";
import { ContextIndicator } from "../components/ContextTracker";
import { ToolView } from "../components/ToolView";
import { SummaryPrompt } from "../components/SummaryPrompt";
import { ROLE, type Scenario } from "../engine/types";
import {
  TOOL_REGISTRY,
  prettyPrintToolRegistry as formattedToolRegistry,
} from "../tools/toolRegistry";
import { calculateTokens } from "../utils";
import { reducer, type Action, type State } from "./reducer";

const initial: State = {
  log: [],
  hintIndex: 0,
  answerStepIndex: 0,
  completed: false,
};

function createInitialState(scenarioData: Scenario): State {
  const tools = formattedToolRegistry();
  return {
    hintIndex: 0,
    answerStepIndex: 0,
    completed: false,
    log: [
      {
        role: ROLE.SYSTEM,
        text: scenarioData.system,
        tokens: calculateTokens(scenarioData.system),
      },
      {
        role: ROLE.SYSTEM,
        text: `Tools: ${tools}`,
        tokens: calculateTokens(tools),
      },
      {
        role: ROLE.USER,
        text: `${scenarioData.briefing.from}: ${scenarioData.briefing.message}`,
        tokens: calculateTokens(scenarioData.briefing.message),
      },
    ],
  };
}

export function Simulator({
  scenarioData,
  onBack,
  onRestart,
}: {
  scenarioData: Scenario;
  onBack: () => void;
  onRestart: () => void;
}) {
  const [state, dispatch] = useReducer(
    (currentState: State, action: Action) =>
      reducer(currentState, action, scenarioData),
    initial,
    () => createInitialState(scenarioData),
  );

  const [toolsWidth, setToolsWidth] = useState(38);
  const [completionDismissed, setCompletionDismissed] = useState(false);
  const simulatorRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const used: number = state.log.reduce(
    (sum, e) => sum + (e.evicted ? 0 : e.tokens),
    0,
  );
  const pct: number = Math.min(100, (used / scenarioData.contextLimit) * 100);
  const compactionRequired = pct >= 85;

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
    <main
      ref={simulatorRef}
      className="simulator"
      style={{ gridTemplateColumns: `${toolsWidth}% 8px 1fr` }}
    >
      <aside className="tools-pane">
        <h1 className="sr-only">Agent simulator</h1>
        <div className="simulator-header">
          <div className="simulator-header-actions">
            <button
              className="back-button"
              disabled={compactionRequired}
              onClick={onBack}
            >
              ← All scenarios
            </button>
            <button
              className="back-button restart-button"
              onClick={() => {
                if (
                  window.confirm(
                    "Restart this scenario? Current progress will be lost.",
                  )
                ) {
                  onRestart();
                }
              }}
            >
              Restart scenario
            </button>
          </div>
          <span className="simulator-label">Agent Tools</span>
        </div>
        <ToolView
          tools={scenarioData.tools.flatMap((name) => {
            const tool = TOOL_REGISTRY[name];
            return tool ? [tool] : [];
          })}
          dispatch={dispatch}
          disabled={compactionRequired}
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
          if (compactionRequired) return;
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
          if (compactionRequired) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            const delta = event.key === "ArrowLeft" ? -2 : 2;
            setToolsWidth((width) => Math.min(65, Math.max(25, width + delta)));
          }
        }}
      />
      <div className="chat-pane" role="region" aria-label="Live simulator">
        <div className="simulator-sticky">
          <div className="simulator-header">
            <span className="simulator-label">LIVE SIMULATOR</span>
          </div>
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
          {compactionRequired && <SummaryPrompt dispatch={dispatch} />}
          <div ref={bottomRef} />
        </div>
      </div>
      {state.completed && !completionDismissed && (
        <div className="completion-backdrop">
          <section
            className="completion-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="completion-title"
          >
            <h2 id="completion-title">Scenario complete</h2>
            <p>
              You answered all questions correctly. You can continue to
              interact with the environment if you wish.
            </p>
            <button
              className="action-button"
              onClick={() => setCompletionDismissed(true)}
            >
              Continue exploring
            </button>
          </section>
        </div>
      )}
    </main>
  );
  /* eslint-enable jsx-a11y-x/no-noninteractive-element-interactions, jsx-a11y-x/no-noninteractive-tabindex */
}
