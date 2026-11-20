import resources from "./resources.json";
import contextGrowthImage from "../assets/context-growth.jpg";
import tokenizationImage from "../assets/tokenization-comparison.png";
import agentHarnessImage from "../assets/agent-harness.png";

export interface ResourceLink {
  label: string;
  time?: string;
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

export type ResourceContentBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "image";
      src: string;
      alt: string;
      caption?: string;
      attribution?: ResourceImage["attribution"];
    };

export interface Resource {
  title: string;
  description?: string;
  links: ResourceLink[];
}

export interface ResourceTopic {
  id: string;
  title: string;
  description?: string;
  content?: ResourceContentBlock[];
  resources?: Resource[];
  image?: ResourceImage;
}

export interface ResourceSectionData {
  title?: string;
  topics: ResourceTopic[];
}

const bundledImages: Record<string, string> = {
  "/assets/context-growth.jpg": contextGrowthImage,
  "/assets/tokenization-comparison.png": tokenizationImage,
  "/assets/agent-harness.png": agentHarnessImage,
};

export const resourceSections = resources as Record<
  string,
  ResourceSectionData
>;

for (const section of Object.values(resourceSections)) {
  for (const topic of section.topics) {
    if (topic.image) {
      topic.image.src = bundledImages[topic.image.src] ?? topic.image.src;
    }
    for (const block of topic.content ?? []) {
      if (block.type === "image") {
        block.src = bundledImages[block.src] ?? block.src;
      }
    }
  }
}

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
