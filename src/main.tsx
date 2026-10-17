import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./App.css";
import App from "./App.tsx";
import * as Tooltip from "@radix-ui/react-tooltip";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Tooltip.Provider delayDuration={200} skipDelayDuration={300}>
      <App />
    </Tooltip.Provider>
  </StrictMode>,
);
