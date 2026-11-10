import { Link } from "./Link";
import type {
  ResourceSectionData,
  ResourceTopic,
} from "../resources/resourceData";

export function ResourceContent({
  section,
  openTopicTitle,
  title,
  intro,
  image,
  collapsible = true,
}: {
  section: ResourceSectionData;
  openTopicTitle?: string;
  title?: string;
  intro?: string;
  image?: ResourceTopic["image"];
  collapsible?: boolean;
}) {
  return (
    <section className="resource-section">
      {(title ?? section.title) && <h2>{title ?? section.title}</h2>}
      {intro && <p className="resource-content-intro">{intro}</p>}
      {section.topics.map((topic) => (
        <ResourceTopicDetails
          key={topic.title}
          topic={image ? { ...topic, image } : topic}
          open={topic.title === openTopicTitle}
          collapsible={collapsible}
        />
      ))}
    </section>
  );
}

function ResourceTopicDetails({
  topic,
  open,
  collapsible,
}: {
  topic: ResourceTopic;
  open: boolean;
  collapsible: boolean;
}) {
  const content = (
    <div className="resource-topic-content">
      {topic.description && <p>{topic.description}</p>}
      {topic.image && (
        <figure className="resource-figure">
          <img src={topic.image.src} alt={topic.image.alt} />
          {topic.image.caption && <figcaption>{topic.image.caption}</figcaption>}
          {topic.image.attribution && (
            <figcaption>
              Image:{" "}
              <a
                href={topic.image.attribution.href}
                target="_blank"
                rel="noreferrer"
              >
                {topic.image.attribution.label}
              </a>
            </figcaption>
          )}
        </figure>
      )}
      {topic.resources && (
        <>
          <h4>Further reading</h4>
          <ul className="resource-list">
            {topic.resources.map((resource) => (
              <li key={resource.title}>
                <strong>{resource.title}</strong>
                {resource.description && <span>{resource.description}</span>}
                <span className="resource-links">
                  {resource.links.map((link, index) => (
                    <span key={link.href}>
                      {index > 0 && " or "}
                      <Link href={link.href}>{link.label}</Link>
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );

  if (!collapsible) {
    return (
      <div className="resource-topic resource-topic-expanded">
        <h3>{topic.title}</h3>
        {content}
      </div>
    );
  }

  return (
    <details className="resource-topic" open={open}>
      <summary>{topic.title}</summary>
      {content}
    </details>
  );
}
