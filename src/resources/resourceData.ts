import resources from "./resources.json";

export interface ResourceLink {
  label: string;
  href: string;
}

export interface ResourceImage {
  src: string;
  alt: string;
  caption?: string;
  attribution?: {
    label: string;
    href: string;
  };
}

export interface Resource {
  title: string;
  description?: string;
  links: ResourceLink[];
}

export interface ResourceTopic {
  id: string;
  title: string;
  description?: string;
  resources?: Resource[];
  image?: ResourceImage;
}

export interface ResourceSectionData {
  title?: string;
  topics: ResourceTopic[];
}

export const resourceSections = resources as Record<
  string,
  ResourceSectionData
>;

export function resourceTopicForId(id: string): ResourceTopic | null {
  for (const section of Object.values(resourceSections)) {
    const topic = section.topics.find((candidate) => candidate.id === id);
    if (topic) return topic;
  }
  return null;
}

export function resourceLinkForId(id: string): ResourceLink | null {
  const topic = resourceTopicForId(id);
  return topic?.resources?.[0]?.links[0] ?? null;
}
