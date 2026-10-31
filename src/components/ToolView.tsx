import { useState, type Dispatch } from "react";
import type { ToolDef } from "../engine/types";
import { ToolExecution, type ToolAction } from "./ToolExecution";
import { ToolList } from "./ToolList";
import { requestTemplate } from "./requestTemplate";
import { HelpTipTrigger } from "./HelpTip";

export function ToolView({
  tools,
  dispatch,
  disabled = false,
  onViewRangeFocus,
  onModeSwitch,
  onToolsHelp,
  onToolRun,
  onAnswerFocus,
  onEmptyAnswer,
  onAnswer,
}: {
  tools: ToolDef[];
  dispatch: Dispatch<ToolAction>;
  disabled?: boolean;
  onViewRangeFocus?: (anchor: HTMLElement) => void;
  onModeSwitch?: (anchor: HTMLElement) => void;
  onToolsHelp?: (persistent: boolean) => void;
  onToolRun?: () => void;
  onAnswerFocus?: (anchor: HTMLElement) => void;
  onEmptyAnswer?: (anchor: HTMLElement) => void;
  onAnswer?: (text: string) => void;
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
      <div className="tool-section-label">
        <span>TOOLS</span>
        <HelpTipTrigger
          id="tools-help"
          label="Learn about tools"
          onHover={() => onToolsHelp?.(false)}
          onClick={() => onToolsHelp?.(true)}
        />
      </div>
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
        onViewRangeFocus={onViewRangeFocus}
        onModeSwitch={onModeSwitch}
        onToolRun={onToolRun}
        onAnswerFocus={onAnswerFocus}
        onEmptyAnswer={onEmptyAnswer}
        onAnswer={onAnswer}
      />
    </div>
  );
}
