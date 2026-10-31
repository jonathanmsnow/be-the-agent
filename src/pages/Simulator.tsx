import {
  useReducer,
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { LogEntry } from "../components/LogEntry";
import { HelpTip } from "../components/HelpTip";
import { TipsMenu } from "../components/TipsMenu";
import {
  isVisible,
  readSeen,
  shouldTriggerTip,
  tipForTarget,
  tipsForScenario,
  writeSeen,
} from "../components/helpTipState";
import { ContextIndicator } from "../components/ContextTracker";
import { ToolView } from "../components/ToolView";
import { SummaryPrompt } from "../components/SummaryPrompt";
import { ROLE, type Scenario } from "../engine/types";
import {
  TOOL_REGISTRY,
  prettyPrintToolRegistry as formattedToolRegistry,
} from "../tools/toolRegistry";
import { calculateTokens } from "../utils";
import { reducer, type Action, type State } from "./reducer";

const TOOL_CALL_TIP_INITIAL_DELAY_MS = 30_000;
const TOOL_CALL_TIP_MAX_DELAY_MS = 5 * 60_000;

const initial: State = {
  log: [],
  hintIndex: 0,
  answerStepIndex: 0,
  completed: false,
};

function createInitialState(scenarioData: Scenario): State {
  const tools = formattedToolRegistry();
  return {
    hintIndex: 0,
    answerStepIndex: 0,
    completed: false,
    log: [
      {
        role: ROLE.SYSTEM,
        text: scenarioData.system,
        tokens: calculateTokens(scenarioData.system),
      },
      {
        role: ROLE.SYSTEM,
        text: `Tools: ${tools}`,
        tokens: calculateTokens(tools),
      },
      {
        role: ROLE.USER,
        text: `${scenarioData.briefing.from}: ${scenarioData.briefing.message}`,
        tokens: calculateTokens(scenarioData.briefing.message),
      },
    ],
  };
}

export function Simulator({
  scenarioData,
  onBack,
  onRestart,
}: {
  scenarioData: Scenario;
  onBack: () => void;
  onRestart: () => void;
}) {
  const [state, dispatch] = useReducer(
    (currentState: State, action: Action) =>
      reducer(currentState, action, scenarioData),
    initial,
    () => createInitialState(scenarioData),
  );

  const [toolsWidth, setToolsWidth] = useState(38);
  const [completionDismissed, setCompletionDismissed] = useState(false);
  const [seenTips, setSeenTips] = useState(() => readSeen());
  const seenTipsRef = useRef(seenTips);
  const [activeTip, setActiveTip] = useState<{
    id: string;
    anchor: HTMLElement;
  } | null>(null);
  const [tipsAnchor, setTipsAnchor] = useState<HTMLElement | null>(null);
  const [activityVersion, setActivityVersion] = useState(0);
  const [idleTipAttempt, setIdleTipAttempt] = useState(0);
  const simulatorRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const toolRunCountRef = useRef(0);

  const used: number = state.log.reduce(
    (sum, e) => sum + (e.evicted ? 0 : e.tokens),
    0,
  );
  const contextTrackingEnabled =
    scenarioData.contextTracking !== false &&
    typeof scenarioData.contextLimit === "number" &&
    scenarioData.contextLimit > 0;
  const contextLimit = scenarioData.contextLimit ?? 0;
  const pct: number = contextTrackingEnabled
    ? Math.min(100, (used / contextLimit) * 100)
    : 0;
  const compactionRequired = contextTrackingEnabled && pct >= 85;
  const scenarioTips = useMemo(
    () => tipsForScenario(scenarioData.id),
    [scenarioData.id],
  );
  const openTip = useCallback(
    (
      targetId: string,
      fallbackAnchor: HTMLElement | undefined,
      force = false,
    ) => {
      const tip = tipForTarget(scenarioTips, targetId);
      const anchor =
        (tip?.targetId && document.getElementById(tip.targetId)) ||
        fallbackAnchor ||
        (tip?.fallbackTargetId &&
          document.getElementById(tip.fallbackTargetId));
      if (
        !tip ||
        !anchor ||
        (!force && (activeTip || seenTips.has(tip.id))) ||
        !isVisible(anchor)
      ) {
        return;
      }
      setTipsAnchor(null);
      setActiveTip({ id: tip.id, anchor });
    },
    [activeTip, seenTips, scenarioTips],
  );
  const openTipRef = useRef(openTip);

  useEffect(() => {
    openTipRef.current = openTip;
  }, [openTip]);

  useEffect(() => {
    seenTipsRef.current = seenTips;
  }, [seenTips]);

  const showTip = (targetId: string, anchor: HTMLElement) =>
    openTip(targetId, anchor);

  const toggleTipSeen = (id: string, checked: boolean) => {
    const nextSeen = new Set(seenTips);
    if (checked) nextSeen.add(id);
    else nextSeen.delete(id);
    setSeenTips(nextSeen);
    writeSeen(nextSeen);
  };

  const stopReminding = (id: string) => {
    const nextSeen = new Set(seenTips).add(id);
    setSeenTips(nextSeen);
    writeSeen(nextSeen);
    setActiveTip(null);
  };

  const markToolRun = () => {
    toolRunCountRef.current += 1;
    setActivityVersion((version) => version + 1);
  };

  const showLatestResultTip = () => {
    window.setTimeout(() => {
      const results = document.querySelectorAll<HTMLElement>(".entry.result");
      const result = results[results.length - 1];
      if (result) showTip("tool-result", result);
    }, 350);
  };

  const scrollToOriginalRequest = () => {
    const request = document.getElementById("original-user-request");
    const chatPane = document.querySelector<HTMLElement>(".chat-pane");
    if (!request || !chatPane) return;
    chatPane.scrollTo({
      top: Math.max(0, request.offsetTop - chatPane.clientHeight / 2),
      behavior: "auto",
    });
    return request;
  };

  const showOriginalRequestTip = () => {
    const request = scrollToOriginalRequest();
    if (!request || seenTips.has("original-user-request")) return;
    window.setTimeout(() => {
      setTipsAnchor(null);
      setActiveTip({ id: "original-user-request", anchor: request });
    }, 100);
  };

  const remindOriginalRequestAfterWrongAnswer = (answer: string) => {
    const step = scenarioData.answerSteps?.[state.answerStepIndex];
    const keywords = step?.keywords ?? scenarioData.answerKeywords;
    const tip = tipForTarget(scenarioTips, "original-user-request");
    if (
      tip &&
      shouldTriggerTip(tip, {
        elapsedMs: 0,
        toolRunCount: toolRunCountRef.current,
        wrongAnswer: !keywords.every((keyword) => answer.includes(keyword)),
      })
    ) {
      showOriginalRequestTip();
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.log.length]);

  useEffect(() => {
    const tipTimer = window.setTimeout(() => {
      const request = scrollToOriginalRequest();
      if (!request || seenTipsRef.current.has("original-user-request")) {
        return;
      }
      setActiveTip({ id: "original-user-request", anchor: request });
    }, 15_000);
    return () => window.clearTimeout(tipTimer);
  }, [scenarioData.id]);

  useEffect(() => {
    if (
      activeTip ||
      toolRunCountRef.current > 0 ||
      seenTips.has("tool-call-prompt")
    ) {
      return;
    }

    const delay = Math.min(
      TOOL_CALL_TIP_INITIAL_DELAY_MS * 2 ** idleTipAttempt,
      TOOL_CALL_TIP_MAX_DELAY_MS,
    );
    const timer = window.setTimeout(() => {
      const tip = tipForTarget(
        tipsForScenario(scenarioData.id),
        "tool-call-prompt",
      );
      if (
        tip &&
        shouldTriggerTip(tip, {
          elapsedMs: delay,
          toolRunCount: toolRunCountRef.current,
        })
      ) {
        setIdleTipAttempt((attempt) => attempt + 1);
        openTipRef.current(tip.id, undefined);
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [activeTip, activityVersion, idleTipAttempt, scenarioData.id, seenTips]);

  const resizeFromPointer = (clientX: number) => {
    const bounds = simulatorRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const nextWidth = ((clientX - bounds.left) / bounds.width) * 100;
    setToolsWidth(Math.min(65, Math.max(25, nextWidth)));
  };

  /* eslint-disable jsx-a11y-x/no-noninteractive-element-interactions, jsx-a11y-x/no-noninteractive-tabindex */
  return (
    <main
      ref={simulatorRef}
      className="simulator"
      style={{ gridTemplateColumns: `${toolsWidth}% 8px 1fr` }}
    >
      <aside className="tools-pane">
        <h1 className="sr-only">Agent simulator</h1>
        <div className="simulator-header">
          <div className="simulator-header-actions">
            <button
              className="back-button"
              disabled={compactionRequired}
              onClick={onBack}
            >
              ← All scenarios
            </button>
            <button
              className="back-button restart-button"
              onClick={() => {
                if (
                  window.confirm(
                    "Restart this scenario? Current progress will be lost.",
                  )
                ) {
                  onRestart();
                }
              }}
            >
              Restart scenario
            </button>
          </div>
          <button
            type="button"
            className="tips-button"
            aria-haspopup="dialog"
            aria-expanded={tipsAnchor !== null}
            onClick={(event) => {
              setActiveTip(null);
              setTipsAnchor(event.currentTarget);
            }}
          >
            Tips
          </button>
        </div>
        <ToolView
          tools={scenarioData.tools.flatMap((name) => {
            const tool = TOOL_REGISTRY[name];
            return tool ? [tool] : [];
          })}
          dispatch={dispatch}
          disabled={compactionRequired}
          onViewRangeFocus={(anchor) => showTip("view-range", anchor)}
          onModeSwitch={(anchor) => showTip("request-mode", anchor)}
          onEmptyAnswer={(anchor) => openTip("answer-required", anchor, true)}
          onAnswer={remindOriginalRequestAfterWrongAnswer}
          onToolRun={() => {
            markToolRun();
            showLatestResultTip();
          }}
        />
      </aside>

      <div
        className="pane-divider"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize tools pane"
        aria-valuemin={25}
        aria-valuemax={65}
        aria-valuenow={toolsWidth}
        tabIndex={0}
        onPointerDown={(event) => {
          if (compactionRequired) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          resizeFromPointer(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            resizeFromPointer(event.clientX);
          }
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onKeyDown={(event) => {
          if (compactionRequired) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            const delta = event.key === "ArrowLeft" ? -2 : 2;
            setToolsWidth((width) => Math.min(65, Math.max(25, width + delta)));
          }
        }}
      />
      <div
        className="chat-pane"
        role="region"
        aria-label="Context Window"
        tabIndex={0}
      >
        <div className="simulator-sticky">
          <div className="simulator-header">
            <span className="simulator-label">CONTEXT WINDOW</span>
          </div>
          {contextTrackingEnabled && (
            <ContextIndicator
              used={used}
              contextLimit={contextLimit}
              pct={pct}
              entries={state.log}
            />
          )}
        </div>

        <div className="log">
          {state.log.map((e, i) => (
            <LogEntry
              key={i}
              entry={e}
              id={i === 2 ? "original-user-request" : undefined}
              showTokens={contextTrackingEnabled}
            />
          ))}
          {compactionRequired && <SummaryPrompt dispatch={dispatch} />}
          <div ref={bottomRef} />
        </div>
      </div>
      {state.completed && !completionDismissed && (
        <div className="completion-backdrop">
          <section
            className="completion-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="completion-title"
          >
            <h2 id="completion-title">Scenario complete</h2>
            <p>
              You answered all questions correctly. You can continue to interact
              with the environment if you wish.
            </p>
            <button
              className="action-button"
              onClick={() => setCompletionDismissed(true)}
            >
              Continue exploring
            </button>
          </section>
        </div>
      )}
      {activeTip && (
        <HelpTip
          anchor={activeTip.anchor}
          title={
            scenarioTips.find((tip) => tip.id === activeTip.id)?.title ?? ""
          }
          body={scenarioTips.find((tip) => tip.id === activeTip.id)?.body ?? ""}
          onClose={() => setActiveTip(null)}
          onStopReminding={() => stopReminding(activeTip.id)}
        />
      )}
      {tipsAnchor && (
        <TipsMenu
          anchor={tipsAnchor}
          seen={seenTips}
          tips={scenarioTips}
          onShowTip={(tip) => {
            openTip(tip.id, undefined, true);
            setTipsAnchor(null);
          }}
          onToggleSeen={toggleTipSeen}
          onClose={() => setTipsAnchor(null)}
        />
      )}
    </main>
  );
  /* eslint-enable jsx-a11y-x/no-noninteractive-element-interactions, jsx-a11y-x/no-noninteractive-tabindex */
}
