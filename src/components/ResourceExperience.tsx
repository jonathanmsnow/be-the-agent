import { useEffect, useRef } from "react";
import {
  ResourceSection,
  type ResourceImage,
  type ResourceTopic,
} from "./ResourceSection";

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
        aria-labelledby="resource-experience-title"
      >
        <div className="resource-experience-header">
          <div>
            <div className="eyebrow">LEARN IN CONTEXT</div>
            <h2 id="resource-experience-title">{title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="help-tip-close"
            onClick={onClose}
          >
            <span className="sr-only">Close resource</span>×
          </button>
        </div>
        <p className="resource-experience-body">{body}</p>
        {(image ?? topic.image) && (
          <figure className="resource-experience-figure">
            <img
              src={(image ?? topic.image)!.src}
              alt={(image ?? topic.image)!.alt}
            />
            {(image ?? topic.image)!.caption && (
              <figcaption>{(image ?? topic.image)!.caption}</figcaption>
            )}
            {(image ?? topic.image)!.attribution && (
              <figcaption>
                Image:{" "}
                <a
                  href={(image ?? topic.image)!.attribution!.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {(image ?? topic.image)!.attribution!.label}
                </a>
              </figcaption>
            )}
          </figure>
        )}
        <ResourceSection
          section={{
            topics: [topic],
          }}
        />
      </section>
    </div>
  );
}
