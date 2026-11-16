import { Link } from "./Link";
import type {
  ResourceContentBlock,
  ResourceImage,
  ResourceSectionData,
  ResourceTopic,
} from "../resources/resourceData";
import { Disclosure } from "./Disclosure";

export function ResourceContent({
  section,
  openTopicTitle,
  image,
  collapsible = true,
}: {
  section: ResourceSectionData;
  openTopicTitle?: string;
  image?: ResourceTopic["image"];
  collapsible?: boolean;
}) {
  return (
    <section className="resource-section">
      {section.title && <h2>{section.title}</h2>}
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
      {topic.content
        ? topic.content.map((block, index) => (
            <ResourceContentBlockView
              key={`${block.type}-${index}`}
              block={block}
            />
          ))
        : topic.description && <p>{topic.description}</p>}
      {!topic.content && topic.image && <ResourceImageView image={topic.image} />}
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
                      <Link href={link.href}>
                        {link.label}
                        {link.time && ` (${link.time})`}
                      </Link>
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

  function ResourceContentBlockView({ block }: { block: ResourceContentBlock }) {
    if (block.type === "paragraph") return <p>{block.text}</p>;
    return <ResourceImageView image={block} />;
  }

  function ResourceImageView({ image }: { image: ResourceImage }) {
    return (
      <figure className="resource-figure">
        <img src={image.src} alt={image.alt} />
        {image.caption && <figcaption>{image.caption}</figcaption>}
        {image.attribution && (
          <figcaption>
            Image:{" "}
            <a
              href={image.attribution.href}
              target="_blank"
              rel="noreferrer"
            >
              {image.attribution.label}
            </a>
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <Disclosure className="resource-topic" title={topic.title} open={open}>
      {content}
    </Disclosure>
  );
}
