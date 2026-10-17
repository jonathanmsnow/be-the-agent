import * as Tooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

type TooltipContentProps = {
  children: ReactNode;
  label?: string;
};

export function TooltipContent({
  children,
  label = "Explain this",
}: TooltipContentProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button type="button" className="hint-btn" aria-label={label}>
          ?
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="hint-pop"
          side="right"
          sideOffset={8}
          collisionPadding={8}
        >
          {children}
          <Tooltip.Arrow className="hint-arrow" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
