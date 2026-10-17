import { useEffect, useReducer, useRef, useState } from "react";
import scenario from "./scenarios/scenario1.json";
import { runTool } from "./engine/runTool";
import type { Entry, Scenario, ToolCall } from "./engine/types";
import { LogEntry } from "./components/LogEntry";
import { prettyPrintToolRegistry as formattedToolRegistry } from "./tools/toolRegistry";
import { calculateTokens } from "./utils";

const scenarioData = scenario as Scenario;

interface State {
  log: Entry[];
  verdict: string | null;
}
type Action =
  | { type: "RUN"; call: ToolCall }
  | { type: "ANSWER"; text: string };

const initial: State = {
  verdict: null,
  log: [
    {
      role: "system",
      text: scenarioData.system,
      tokens: calculateTokens(scenarioData.system),
    },
    {
      role: "system",
      text: `Tools: ${formattedToolRegistry()}`,
      tokens: calculateTokens(formattedToolRegistry()),
    },
    {
      role: "user",
      text: `${scenarioData.briefing.from}: ${scenarioData.briefing.message}`,
      tokens: calculateTokens(scenarioData.briefing.message),
    },
  ],
};

function reducer(state: State, action: Action): State {
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

export default function App() {
  const [state, dispatch] = useReducer(reducer, initial);
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
    <div
      style={{
        maxWidth: 700,
        margin: "0 auto",
        textAlign: "left",
        fontFamily: "monospace",
      }}
    >
      {/* Header: label + meter */}
      <div
        style={{
          position: "sticky",
          top: 0,
          padding: "8px 0",
          background: "Canvas",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
          }}
        >
          <b>CONTEXT</b>
          <span>
            {used} / {scenarioData.contextLimit} tokens
          </span>
        </div>

        <div
          style={{
            background: "rgba(150,150,150,0.3)",
            height: 10,
            borderRadius: 5,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              borderRadius: 5,
              background: pct > 85 ? "#d55" : "#4a8",
              transition: "width .6s",
            }}
          />
        </div>
      </div>

      {/* The log: one flat buffer, role-tagged blocks */}
      <div style={{ paddingBottom: 140 }}>
        {state.log.map((e, i) => (
          // Use LogEntry component to replace div
          <LogEntry key={i} entry={e} />
        ))}
        {state.verdict && (
          <p>
            <b>{state.verdict}</b>
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Your turn: pinned composer */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "Canvas",
          borderTop: "1px solid rgba(150,150,150,0.4)",
          padding: 12,
        }}
      >
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>
            YOUR TURN: emit one tool call, or answer
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
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
              style={{ flex: 1 }}
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="path"
            />
            <button
              onClick={() =>
                dispatch({ type: "RUN", call: { tool: tool, args: { path } } })
              }
            >
              Run
            </button>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              style={{ flex: 1 }}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="your answer to the user"
            />
            <button onClick={() => dispatch({ type: "ANSWER", text: answer })}>
              Answer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
