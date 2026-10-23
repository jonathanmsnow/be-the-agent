import { useState, type FormEvent } from "react";
import { ActionType } from "../engine/types";
import type { Action } from "../pages/reducer";

export function SummaryPrompt({
  dispatch,
}: {
  dispatch: React.Dispatch<Action>;
}) {
  const [notes, setNotes] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!notes.trim()) return;
    dispatch({ type: ActionType.SUMMARY, text: notes });
    setNotes("");
  };

  return (
    <form className="summary-prompt" onSubmit={submit}>
      <div className="summary-prompt-heading">
        <strong>Context checkpoint</strong>
        <span>85% full</span>
      </div>
      <p>
        Your context window is nearly full. Capture your current findings,
        open questions, and next step. Saving notes demonstrates compaction:
        older entries leave active context while your concise working state
        remains.
      </p>
      <textarea
        className="summary-editor"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Working state: findings, evidence, open questions, next step"
        aria-label="Compaction notes"
        rows={4}
      />
      <button className="action-button" type="submit" disabled={!notes.trim()}>
        Save notes and compact
      </button>
    </form>
  );
}
