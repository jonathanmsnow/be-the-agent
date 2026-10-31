import { useEffect, useState } from "react";
import { LandingPage } from "./pages/LandingPage";
import { Simulator } from "./pages/Simulator";
import { scenarios } from "./scenarios/scenarios";
import type { Scenario } from "./engine/types";

const SIMULATOR_ROUTE_PREFIX = "#/simulator/";

function scenarioIdFromHash(hash: string): string | null {
  if (!hash.startsWith(SIMULATOR_ROUTE_PREFIX)) {
    return null;
  }

  try {
    const scenarioId = decodeURIComponent(
      hash.slice(SIMULATOR_ROUTE_PREFIX.length),
    );
    return scenarios.some((scenario) => scenario.id === scenarioId)
      ? scenarioId
      : null;
  } catch {
    return null;
  }
}

function simulatorHash(scenario: Scenario): string {
  return `${SIMULATOR_ROUTE_PREFIX}${encodeURIComponent(scenario.id)}`;
}

export default function App() {
  const [selectedScenarioId, setSelectedScenarioId] = useState(() =>
    scenarioIdFromHash(window.location.hash),
  );
  const [scenarioKey, setScenarioKey] = useState(0);

  useEffect(() => {
    const handleHashChange = () => {
      setSelectedScenarioId(scenarioIdFromHash(window.location.hash));
      setScenarioKey((key) => key + 1);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? null;

  const selectScenario = (scenario: Scenario) => {
    window.location.hash = simulatorHash(scenario);
  };

  const leaveSimulator = () => {
    window.location.hash = "";
  };

  if (selectedScenario) {
    return (
      <Simulator
        key={scenarioKey}
        scenarioData={selectedScenario}
        onBack={leaveSimulator}
        onRestart={() => setScenarioKey((key) => key + 1)}
      />
    );
  }

  return <LandingPage setSelectedScenario={selectScenario} />;
}
