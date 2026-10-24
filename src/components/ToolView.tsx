import { useState, type Dispatch } from "react";
import type { ToolDef } from "../engine/types";
import { ToolExecution, type ToolAction } from "./ToolExecution";
import { ToolList } from "./ToolList";
import { requestTemplate } from "./requestTemplate";

export function ToolView({
  tools,
  dispatch,
  disabled = false,
}: {
  tools: ToolDef[];
  dispatch: Dispatch<ToolAction>;
  disabled?: boolean;
}) {
  const [selectedTool, setSelectedTool] = useState(tools[0]);
  const [rawRequest, setRawRequest] = useState(() =>
    tools[0] ? requestTemplate(tools[0]) : "",
  );

  const selectTool = (tool: ToolDef) => {
    setSelectedTool(tool);
    setRawRequest(requestTemplate(tool));
  };

  return (
    <div className="tool-client">
      <div className="tool-section-label">COLLECTION / TOOLS</div>
      <ToolList
        tools={tools}
        selectedTool={selectedTool?.name ?? ""}
        disabled={disabled}
        onSelect={selectTool}
      />
      <ToolExecution
        key={selectedTool?.name}
        tool={selectedTool}
        dispatch={dispatch}
        disabled={disabled}
        rawRequest={rawRequest}
        setRawRequest={setRawRequest}
      />
    </div>
  );
}
