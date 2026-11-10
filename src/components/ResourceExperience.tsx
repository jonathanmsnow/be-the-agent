import { useEffect, useRef } from "react";
import { ResourceContent } from "./ResourceContent";
import type { ResourceImage, ResourceTopic } from "../resources/resourceData";

export function ResourceExperience({
  title,
  body,
  topic,
  image,
  onClose,
}: {
  title: string;
  body: string;
  topic: ResourceTopic;
  image?: ResourceImage;
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
    <div
      className="resource-experience-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="resource-experience-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="resource-experience-header">
          <div className="eyebrow">LEARN IN CONTEXT</div>
          <button
            ref={closeButtonRef}
            type="button"
            className="help-tip-close"
            onClick={onClose}
          >
            <span className="sr-only">Close resource</span>×
          </button>
        </div>
        <ResourceContent
          section={{
            topics: [image ? { ...topic, image } : topic],
          }}
          title={title}
          intro={body}
          collapsible={false}
        />
      </section>
    </div>
  );
}
