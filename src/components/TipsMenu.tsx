import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { TipDefinition } from "./helpTips";

export function TipsMenu({
  anchor,
  seen,
  tips,
  onShowTip,
  onToggleSeen,
  onClose,
}: {
  anchor: HTMLElement;
  seen: Set<string>;
  tips: TipDefinition[];
  onShowTip: (tip: TipDefinition, anchor: HTMLElement) => void;
  onToggleSeen: (id: string, checked: boolean) => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !anchor.contains(target)) {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    menuRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [anchor, onClose]);

  const rect = anchor.getBoundingClientRect();
  return createPortal(
    <div
      ref={menuRef}
      className="help-tip tips-menu"
      role="dialog"
      aria-label="Tips"
      style={{ top: rect.bottom + 8, right: window.innerWidth - rect.right }}
    >
      <strong>Tips</strong>
      <ul>
        {tips.map((tip) => (
          <li key={tip.id}>
            <label className="tips-checkbox">
              <input
                type="checkbox"
                aria-label={`Stop reminding me about ${tip.label}`}
                checked={seen.has(tip.id)}
                onChange={(event) =>
                  onToggleSeen(tip.id, event.currentTarget.checked)
                }
              />
            </label>
            <button
              type="button"
              className="tips-item"
              onClick={(event) => onShowTip(tip, event.currentTarget)}
            >
              {tip.title}
            </button>
          </li>
        ))}
      </ul>
    </div>,
    document.body,
  );
}
