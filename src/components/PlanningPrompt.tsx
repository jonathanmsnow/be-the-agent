import { useState, type FormEvent } from "react";
import { ActionType } from "../engine/types";
import type { Action } from "../pages/reducer";

export function PlanningPrompt({
  prompt,
  dispatch,
  onComplete,
}: {
  prompt?: string;
  dispatch: React.Dispatch<Action>;
  onComplete: () => void;
}) {
  const [plan, setPlan] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedPlan = plan.trim();

    if (trimmedPlan.length < 10) {
      setError("Add a little more detail so your intention is clear.");
      return;
    }

    setError("");
    dispatch({ type: ActionType.PLAN, text: trimmedPlan });
    onComplete();
  };

  return (
    <form className="planning-prompt" onSubmit={submit}>
      <div className="planning-prompt-heading">
        <strong>Plan before acting</strong>
        <span>adds to context</span>
      </div>
      <p>
        {prompt ??
          "Write one short sentence about what you need to do before you act. This thinking note will be added to your context window; tools are one way to carry out your plan."}
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
        Add thinking and start
      </button>
    </form>
  );
}
