import type { JSX } from "react/jsx-runtime";
import { Card } from "../components/Card";
import { ScenarioCard } from "../components/ScenarioCard";
import { scenarios } from "../scenarios/scenarios";
import type { Scenario } from "../engine/types";
import { ResourceContent } from "../components/ResourceContent";
import { resourceSections } from "../resources/resourceData";

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
          Agents are AI systems are systems that interact with and observe their
          environment. Just like a developer might use the terminal to run the
          right command, inspect the output, and decide what to do next agents
          follow a similar process.
        </p>
        <p>
          <b>Be the Agent</b> puts you in the role of one of these agents. Use
          skills you already have to see what happens under the hood of agentic
          coding tools.
        </p>
      </section>
      <section
        className="assessment-prompt"
        aria-labelledby="assessment-heading"
      >
        <div className="assessment-prompt-content">
          <div className="eyebrow">START HERE</div>
          <h1 id="assessment-heading">Take the pre-assessment</h1>
          <p>
            Help us understand how effective "Be The Agent" is by completing a
            short diagnostic assessment before you begin.
          </p>
        </div>
        <div className="assessment-prompt-actions">
          <a
            className="assessment-button"
            href="https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=u5ghSHuuJUuLem1_Mvqgg83cgJRvn8ZBjbFo9mhnAv9UMVJHSDNNOFlZS0hMQjVFWTVUWjk5UDdYMC4u"
            target="_blank"
            rel="noreferrer"
          >
            Fill out pre-assessment <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
      <section className="intro-section" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="sr-only">
          How it works
        </h2>
        <div className="intro-grid">
          <Card
            icon="◎"
            title="See the loop"
            description="Watch context, tool calls, results, and compaction change as you work."
          />
          <Card
            icon="↗"
            title="Work like you already do"
            description="Apply terminal and debugging habits to realistic engineering tasks."
          />
          <Card
            icon="✓"
            title="Make one decision at a time"
            description="Choose tools, inspect evidence, and recover when your first step is wrong."
          />
          <Card
            icon="↗"
            title="Take the insight with you"
            description="Finish with a clearer mental model for using agentic coding tools."
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
        {Object.entries(resourceSections).map(([sectionId, section]) => (
          <ResourceContent key={sectionId} section={section} />
        ))}
      </section>
    </main>
  );
}
