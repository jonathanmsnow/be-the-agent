import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

  // Handle closing the help tip when clicking outside or pressing Escape
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
        <button
          type="button"
          className="help-tip-stop"
          onClick={onStopReminding}
        >
          Stop reminding me
        </button>
      </div>
      <button type="button" className="help-tip-close" onClick={onClose}>
        <span className="sr-only">Dismiss tip</span>×
      </button>
    </div>,
    document.body,
  );
}
