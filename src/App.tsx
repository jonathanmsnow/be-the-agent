import { useState } from "react";
import { LandingPage } from "./pages/LandingPage";
import { Simulator } from "./pages/Simulator";
import type { Scenario } from "./engine/types";

export default function App() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(
    null,
  );

  if (selectedScenario) {
    return (
      <Simulator
        scenarioData={selectedScenario}
        onBack={() => setSelectedScenario(null)}
      />
    );
  }

  return <LandingPage setSelectedScenario={setSelectedScenario} />;
}
