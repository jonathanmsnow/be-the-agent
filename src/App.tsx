import { useEffect, useReducer, useRef, useState } from "react";
import { runTool } from "./engine/runTool";
import type { Entry, Scenario, ToolCall } from "./engine/types";
import { LogEntry } from "./components/LogEntry";
import { prettyPrintToolRegistry as formattedToolRegistry } from "./tools/toolRegistry";
import { calculateTokens } from "./utils";
import { LandingPage } from "./pages/LandingPage";

interface ScenarioCard {
  id: string;
  title: string;
  description: string;
  scenario: Scenario;
}

interface State {
  log: Entry[];
  verdict: string | null;
}
type Action =
  | { type: "RUN"; call: ToolCall }
  | { type: "ANSWER"; text: string };

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
    case "RUN": {
      const callText = `${action.call.tool} ${action.call.args ? JSON.stringify(action.call.args) : ""}`;
      const { output, cost } = runTool(
        scenarioData,
        action.call.tool,
        action.call.args,
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
    case "ANSWER": {
      const ok = scenarioData.answerKeywords.every((k) =>
        action.text.includes(k),
      );
      return {
        ...state,
        verdict: ok ? "Correct!" : "Not quite.",
        log: [
          ...state.log,
          {
            role: "you",
            text: `answer: ${action.text}`,
            tokens: calculateTokens(action.text),
          },
        ],
      };
    }
  }
}

function Simulator({
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
  const bottomRef = useRef<HTMLDivElement>(null);

  const used = state.log.reduce((sum, e) => sum + e.tokens, 0);
  const pct = Math.min(100, (used / scenarioData.contextLimit) * 100);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.log.length]);

  return (
    <div className="simulator">
      <header className="simulator-header">
        <button className="back-button" onClick={onBack}>
          ← All scenarios
        </button>
        <span className="simulator-label">LIVE SIMULATOR</span>
      </header>
      <div className="context-meter">
        <div className="context-meter-label">
          <b>CONTEXT</b>
          <span>
            {used} / {scenarioData.contextLimit} tokens
          </span>
        </div>

        <div className="context-meter-track">
          <div
            className={`context-meter-fill ${pct > 85 ? "danger" : ""}`}
            style={{ width: `${pct}%` }}
          />
        </div>
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

      <div className="composer">
        <div className="composer-inner">
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
      </div>
    </div>
  );
}

export default function App() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioCard | null>(
    null,
  );

  if (selectedScenario) {
    return (
      <Simulator
        scenarioData={selectedScenario.scenario}
        onBack={() => setSelectedScenario(null)}
      />
    );
  }

  return <LandingPage />;
}
