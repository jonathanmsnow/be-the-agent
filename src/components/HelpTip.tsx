import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TipDefinition } from "./helpTipState";

export function HelpTip({
  anchor,
  title,
  body,
  onClose,
  onStopReminding,
}: {
  anchor: HTMLElement;
  title: string;
  body: string;
  onClose: () => void;
  onStopReminding: () => void;
}) {
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    placement: "below" as "above" | "below",
  });
  const tipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      const rect = anchor.getBoundingClientRect();
      const tipHeight = tipRef.current?.offsetHeight ?? 90;
      const tipWidth = tipRef.current?.offsetWidth ?? 280;
      const below = rect.bottom + 8 + tipHeight <= window.innerHeight;
      setPosition({
        top: below ? rect.bottom + 8 : Math.max(8, rect.top - tipHeight - 8),
        left: Math.min(
          Math.max(8, rect.left),
          window.innerWidth - tipWidth - 8,
        ),
        placement: below ? "below" : "above",
      });
    };
    const frame = requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchor]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!tipRef.current?.contains(target) && !anchor.contains(target)) {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    tipRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [anchor, onClose]);

  return createPortal(
    <div
      ref={tipRef}
      className={`help-tip ${position.placement}`}
      role="status"
      tabIndex={-1}
      style={{ top: position.top, left: position.left }}
    >
      <span className="help-tip-arrow" aria-hidden="true" />
      <div className="help-tip-content">
        <strong className="help-tip-title">{title}</strong>
        <span>{body}</span>
        <button type="button" className="help-tip-stop" onClick={onStopReminding}>
          Stop reminding me
        </button>
      </div>
      <button type="button" className="help-tip-close" onClick={onClose}>
        <span className="sr-only">Dismiss tip</span>
        ×
      </button>
    </div>,
    document.body,
  );
}

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
              {tip.label}
            </button>
          </li>
        ))}
      </ul>
    </div>,
    document.body,
  );
}
