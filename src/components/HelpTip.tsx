import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const [positioned, setPositioned] = useState(false);
  const tipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
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
      setPositioned(true);
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchor]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    tipRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [anchor, onClose]);

  return createPortal(
    <div
      ref={tipRef}
      className={`help-tip ${position.placement}`}
      role="status"
      tabIndex={-1}
      style={{
        top: position.top,
        left: position.left,
        visibility: positioned ? "visible" : "hidden",
      }}
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
