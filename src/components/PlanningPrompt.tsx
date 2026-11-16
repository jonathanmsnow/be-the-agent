import { useRef, useState, type FormEvent } from "react";

export function PlanningPrompt({
  prompt,
}: {
  prompt?: string;
}) {
  const [plan, setPlan] = useState("");
  const [error, setError] = useState("");
  const [planHistory, setPlanHistory] = useState<string[]>([]);
  const [skipped, setSkipped] = useState(false);
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
    setSkipped(false);
    setPlan("");
  };

  return (
    <details className="planning-prompt" ref={detailsRef}>
      <summary className="planning-prompt-heading">
        <strong>Plan before acting</strong>
        <span>{planHistory.length ? "history saved privately" : "optional and private"}</span>
      </summary>
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
        <button
          className="planning-skip"
          type="button"
          onClick={() => {
            setSkipped(true);
            detailsRef.current?.removeAttribute("open");
          }}
        >
          Skip for now
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
      {skipped && (
        <p className="planning-status" role="status">
          Planning skipped. Reopen this panel if you want to make a plan.
        </p>
      )}
    </details>
  );
}
