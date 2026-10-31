import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

export function HelpTip({
  anchor,
  title,
  body,
  learnMoreUrl,
  learnMoreLabel = "Learn more",
  persistent = false,
  hoverOnly = false,
  contextual = false,
  onClose,
  onStopReminding,
}: {
  anchor: HTMLElement;
  title: string;
  body: string;
  learnMoreUrl?: string;
  learnMoreLabel?: string;
  persistent?: boolean;
  hoverOnly?: boolean;
  contextual?: boolean;
  onClose: () => void;
  onStopReminding: () => void;
}) {
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    arrowLeft: 18,
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
      const left = Math.min(
        Math.max(8, rect.left),
        window.innerWidth - tipWidth - 8,
      );
      setPosition({
        top: below ? rect.bottom + 8 : Math.max(8, rect.top - tipHeight - 8),
        left,
        arrowLeft: Math.min(
          Math.max(12, rect.left + rect.width / 2 - left - 5),
          tipWidth - 22,
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
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        target instanceof Element &&
        target.closest(".help-tip, .help-tip-trigger")
      ) {
        return;
      }
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

  useEffect(() => {
    if (persistent || !hoverOnly) return;
    let closeTimer: number | undefined;
    const closeIfUnhovered = () => {
      closeTimer = window.setTimeout(() => {
        if (!anchor.matches(":hover") && !tipRef.current?.matches(":hover")) {
          onClose();
        }
      }, 120);
    };
    const cancelClose = () => {
      if (closeTimer !== undefined) window.clearTimeout(closeTimer);
    };
    anchor.addEventListener("pointerleave", closeIfUnhovered);
    tipRef.current?.addEventListener("pointerenter", cancelClose);
    tipRef.current?.addEventListener("pointerleave", closeIfUnhovered);
    return () => {
      if (closeTimer !== undefined) window.clearTimeout(closeTimer);
      anchor.removeEventListener("pointerleave", closeIfUnhovered);
      tipRef.current?.removeEventListener("pointerenter", cancelClose);
      tipRef.current?.removeEventListener("pointerleave", closeIfUnhovered);
    };
  }, [anchor, hoverOnly, onClose, persistent, positioned]);

  return createPortal(
    <div
      ref={tipRef}
      className={`help-tip ${position.placement}`}
      role="status"
      tabIndex={-1}
      style={
        {
          top: position.top,
          left: position.left,
          "--help-tip-arrow-left": `${position.arrowLeft}px`,
          visibility: positioned ? "visible" : "hidden",
        } as CSSProperties
      }
    >
      <span className="help-tip-arrow" aria-hidden="true" />
      <div className="help-tip-content">
        <strong className="help-tip-title">{title}</strong>
        <span>{body}</span>
        {learnMoreUrl && (
          <a
            href={learnMoreUrl}
            target="_blank"
            rel="noreferrer"
            className="help-tip-link"
          >
            {learnMoreLabel}
          </a>
        )}
        {!contextual && (
          <button
            type="button"
            className="help-tip-stop"
            onClick={onStopReminding}
          >
            Stop showing this tip
          </button>
        )}
      </div>
      <button type="button" className="help-tip-close" onClick={onClose}>
        <span className="sr-only">Dismiss tip</span>×
      </button>
    </div>,
    document.body,
  );
}

export function HelpTipTrigger({
  id,
  label = "Show help",
  onHover,
  onClick,
}: {
  id?: string;
  label?: string;
  onHover: () => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      id={id}
      className="help-tip-trigger"
      aria-label={label}
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onClick}
    >
      <span aria-hidden="true">?</span>
    </button>
  );
}
