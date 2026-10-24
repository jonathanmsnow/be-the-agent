import type { JSX } from "react/jsx-runtime";
import { Card } from "../components/Card";
import { ScenarioCard } from "../components/ScenarioCard";
import { scenarios } from "../scenarios/scenarios";
import type { Scenario } from "../engine/types";
import { ResourceSection } from "../components/ResourceSection";
import resources from "../resources/resources.json";

export function LandingPage({
  setSelectedScenario,
}: {
  setSelectedScenario: (scenario: Scenario) => void;
}): JSX.Element {
  return (
    <main className="landing">
      <section className="hero">
        <h1>Think like an agent.</h1>
        <p>
          Practice navigating messy context, choosing the right tools, and
          finding the answer before your context window runs out.
        </p>
      </section>
      <section className="intro-section" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="sr-only">
          How it works
        </h2>
        <div className="intro-grid">
          <Card
            icon="◎"
            title="Explore context"
            description="Learn to find the details that matter in a messy information space."
          />
          <Card
            icon="↗"
            title="Choose your tools"
            description="Practice deciding which action will move your investigation forward."
          />
          <Card
            icon="✓"
            title="Make the call"
            description="Build confidence turning evidence into a clear, useful answer."
          />
        </div>
      </section>
      <section className="scenario-section" aria-labelledby="missions-heading">
        <div className="section-heading">
          <div>
            <div className="eyebrow">CHOOSE YOUR MISSION</div>
            <h2 id="missions-heading">Available scenarios</h2>
          </div>
          <span className="scenario-count">
            {scenarios.length} scenario{scenarios.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="scenario-grid">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onAction={() => {
                setSelectedScenario(scenario);
              }}
            />
          ))}
        </div>
      </section>
      <section className="hero" aria-labelledby="resources-heading">
        <div className="section-heading">
          <div>
            <div className="eyebrow">NEED SOME BACKGROUND?</div>
            <h2 id="resources-heading">Resources</h2>
          </div>
        </div>
        {Object.entries(resources).map(([sectionId, section]) => (
          <ResourceSection key={sectionId} section={section} />
        ))}
      </section>
    </main>
  );
}
