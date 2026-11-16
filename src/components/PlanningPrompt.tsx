import { useRef, useState, type FormEvent } from "react";
import { Disclosure } from "./Disclosure";

export function PlanningPrompt({ prompt }: { prompt?: string }) {
  const [plan, setPlan] = useState("");
  const [error, setError] = useState("");
  const [planHistory, setPlanHistory] = useState<string[]>([]);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedPlan = plan.trim();

    if (trimmedPlan.length < 10) {
      setError("Add a little more detail so your intention is clear.");
      return;
    }
    setError("");
    setPlanHistory((history) => [...history, trimmedPlan]);
    setPlan("");
  };

  return (
    <Disclosure
      className="planning-prompt"
      title={<strong>Plan before acting</strong>}
      detailsRef={detailsRef}
    >
      <form onSubmit={submit}>
        <p>
          {prompt ??
            "Predict your next step and what evidence would confirm it. This private note will not be added to your context window."}
        </p>
        <textarea
          className="planning-editor"
          value={plan}
          onChange={(event) => {
            setPlan(event.target.value);
            setError("");
          }}
          placeholder="Example: I will gather evidence before responding."
          aria-label="One sentence plan"
          minLength={10}
          rows={2}
        />
        {error && (
          <p className="planning-error" role="alert">
            {error}
          </p>
        )}
        <button className="action-button" type="submit" disabled={!plan.trim()}>
          Save plan
        </button>
      </form>
      {planHistory.length > 0 && (
        <div className="planning-history" aria-label="Plan history">
          <strong>Plan history</strong>
          <ol>
            {planHistory.map((savedPlan, index) => (
              <li key={`${savedPlan}-${index}`}>{savedPlan}</li>
            ))}
          </ol>
        </div>
      )}
    </Disclosure>
  );
}
