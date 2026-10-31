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
          id={tool.name === "read_file" ? "read-file-tool" : undefined}
          className={`tool-item${selectedTool === tool.name ? " selected" : ""}`}
          key={tool.name}
          role="option"
          aria-selected={selectedTool === tool.name}
          onClick={() => onSelect(tool)}
        >
          <span className="tool-name">{tool.name}</span>
          <span className="tool-summary" title={tool.description}>
            {tool.description}
          </span>
        </button>
      ))}
    </div>
  );
}
