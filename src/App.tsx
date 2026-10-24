import { useState } from "react";
import { LandingPage } from "./pages/LandingPage";
import { Simulator } from "./pages/Simulator";
import type { Scenario } from "./engine/types";

export default function App() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(
    null,
  );
  const [scenarioKey, setScenarioKey] = useState(0);

  if (selectedScenario) {
    return (
      <Simulator
        key={scenarioKey}
        scenarioData={selectedScenario}
        onBack={() => setSelectedScenario(null)}
        onRestart={() => setScenarioKey((key) => key + 1)}
      />
    );
  }

  return <LandingPage setSelectedScenario={setSelectedScenario} />;
}
