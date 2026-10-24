import { Link } from "./Link";

interface ResourceLink {
  label: string;
  href: string;
}

interface Resource {
  title: string;
  description?: string;
  links: ResourceLink[];
}

interface ResourceTopic {
  title: string;
  description?: string;
  resources?: Resource[];
}

export interface ResourceSectionData {
  title?: string;
  topics: ResourceTopic[];
}

export function ResourceSection({ section }: { section: ResourceSectionData }) {
  return (
    <section className="resource-section">
      {section.title && <h2>{section.title}</h2>}
      {section.topics.map((topic) => (
        <div className="resource-topic" key={topic.title}>
          <h3>{topic.title}</h3>
          {topic.description && <p>{topic.description}</p>}
          {topic.resources && (
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
          )}
        </div>
      ))}
    </section>
  );
}
