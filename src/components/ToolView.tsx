import { useState, type Dispatch } from "react";
import { ActionType, type ToolCall } from "../engine/types";
import type { ToolDef } from "../engine/types";
import { TOOL_REGISTRY } from "../tools/toolRegistry";

type ToolAction = {
  type: ActionType;
  call?: ToolCall;
  text?: string;
};

// TODO: Actually return a valid request template based on the tool's input schema.
function requestTemplate(toolName: string) {
  return JSON.stringify({ tool: toolName, args: { path: "" } }, null, 2);
}
/**
 * A component that displays the available tools for the user to interact with.
 */
export function ToolView({
  tools,
  dispatch,
}: {
  tools: ToolDef[];
  dispatch: Dispatch<ToolAction>;
}) {
  const [selectedTool, setSelectedTool] = useState(tools[0]?.name || "");
  const [rawRequest, setRawRequest] = useState(() =>
    requestTemplate(tools[0]?.name || ""),
  );
  const [requestError, setRequestError] = useState("");
  const [answer, setAnswer] = useState("");
  return (
    <div className="tool-client">
      <div className="tool-section-label">COLLECTION / TOOLS</div>
      <div className="tool-list" role="listbox" aria-label="Available tools">
        {tools.map((tool) => {
          return (
            <button
              className={`tool-item${selectedTool === tool.name ? " selected" : ""}`}
              key={tool.name}
              role="option"
              aria-selected={selectedTool === tool.name}
              onClick={() => {
                setSelectedTool(tool.name);
                setRawRequest(requestTemplate(tool.name));
                setRequestError("");
              }}
            >
              <span className="tool-method">POST</span>
              <span>{tool.name}</span>
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
          onClick={() => dispatch({ type: ActionType.ANSWER, text: answer })}
        >
          Submit answer
        </button>
      </div>
    </div>
  );
}
