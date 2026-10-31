import type { ToolDef } from "../engine/types";

export function ToolList({
  tools,
  selectedTool,
  disabled,
  onSelect,
}: {
  tools: ToolDef[];
  selectedTool: string;
  disabled: boolean;
  onSelect: (tool: ToolDef) => void;
}) {
  return (
    <div className="tool-list" role="listbox" aria-label="Available tools">
      {tools.map((tool) => (
        <button
          disabled={disabled}
          className={`tool-item${selectedTool === tool.name ? " selected" : ""}`}
          key={tool.name}
          role="option"
          aria-selected={selectedTool === tool.name}
          onClick={() => onSelect(tool)}
        >
          <span>{tool.name}</span>
        </button>
      ))}
    </div>
  );
}
