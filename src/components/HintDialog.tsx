import { useEffect, useRef } from "react";

export function HintDialog({
  sender,
  hint,
  onClose,
}: {
  sender: string;
  hint: string;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="hint-dialog-backdrop" role="presentation">
      <section
        className="hint-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hint-dialog-title"
      >
        <h2 id="hint-dialog-title">{sender}</h2>
        <p>{hint}</p>
        <button
          ref={closeButtonRef}
          className="action-button"
          type="button"
          onClick={onClose}
        >
          Back to task
        </button>
      </section>
    </div>
  );
}
