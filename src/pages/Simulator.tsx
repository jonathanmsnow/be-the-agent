import {
  useReducer,
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { LogEntry } from "../components/LogEntry";
import { HelpTip, HelpTipTrigger } from "../components/HelpTip";
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
  const [activeTips, setActiveTips] = useState<
    Array<{
      id: string;
      anchor: HTMLElement;
      persistent: boolean;
      hoverOnly: boolean;
    }>
  >([]);
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
        (!force &&
          (activeTips.some((active) => active.id === tip.id) ||
            (!tip.contextual && seenTips.has(tip.id)))) ||
        !isVisible(anchor)
      ) {
        return;
      }
      setTipsAnchor(null);
      setActiveTips((current) => {
        const existing = current.find((active) => active.id === tip.id);
        if (existing) {
          return force && !existing.persistent
            ? current.map((active) =>
                active.id === tip.id ? { ...active, persistent: true } : active,
              )
            : current;
        }
        return [
          ...current,
          { id: tip.id, anchor, persistent: force, hoverOnly: tip.hoverOnly ?? false },
        ];
      });
    },
    [activeTips, seenTips, scenarioTips],
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
    setActiveTips((current) => current.filter((tip) => tip.id !== id));
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
      setActiveTips((current) =>
        current.some((tip) => tip.id === "original-user-request")
          ? current
          : [
              ...current,
              {
                id: "original-user-request",
                anchor: request,
                persistent: false,
                hoverOnly: false,
              },
            ],
      );
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
    const tip = tipForTarget(scenarioTips, "original-user-request");
    if (!tip || tip.initialDelayMs === undefined) return;
    const delay = tip.initialDelayMs;

    const tipTimer = window.setTimeout(() => {
      const request = scrollToOriginalRequest();
      if (
        !request ||
        seenTipsRef.current.has("original-user-request") ||
        !shouldTriggerTip(tip, {
          elapsedMs: delay,
          toolRunCount: toolRunCountRef.current,
        })
      ) {
        return;
      }
      setActiveTips((current) =>
        current.some((tip) => tip.id === "original-user-request")
          ? current
          : [
              ...current,
              {
                id: "original-user-request",
                anchor: request,
                persistent: false,
                hoverOnly: false,
              },
            ],
      );
    }, delay);
    return () => window.clearTimeout(tipTimer);
  }, [scenarioData.id, scenarioTips]);

  useEffect(() => {
    if (
      activeTips.length > 0 ||
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
  }, [activeTips, activityVersion, idleTipAttempt, scenarioData.id, seenTips]);

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
              onClick={() => {
                if (
                  window.confirm(
                    "Leave this simulator? Current progress will be lost.",
                  )
                ) {
                  onBack();
                }
              }}
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
              setActiveTips([]);
              setTipsAnchor(event.currentTarget);
            }}
          >
            <svg
              className="tips-button-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M9 18h6M10 22h4M8.7 14.5A6 6 0 1 1 15.3 14.5c-.8.6-1.3 1.4-1.3 2.5h-4c0-1.1-.5-1.9-1.3-2.5Z" />
            </svg>
            <span>Tips</span>
          </button>
        </div>
        <ToolView
          tools={scenarioData.tools.flatMap((name) => {
            const tool = TOOL_REGISTRY[name];
            return tool ? [tool] : [];
          })}
          dispatch={dispatch}
          disabled={compactionRequired}
          onToolsHelp={(persistent) =>
            openTip("tools", undefined, persistent)
          }
          onViewRangeFocus={(anchor) => showTip("view-range", anchor)}
          onModeSwitch={(anchor) => showTip("request-mode", anchor)}
          onAnswerFocus={(anchor) => showTip("answer-required", anchor)}
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
            <span className="simulator-label" id="context-window-heading">
              CONTEXT WINDOW
              <HelpTipTrigger
                id="context-window-help"
                label="Learn about context windows"
                onHover={() => openTip("context-window", undefined)}
                onClick={() => openTip("context-window", undefined, true)}
              />
            </span>
          </div>
          {contextTrackingEnabled && (
            <ContextIndicator
              used={used}
              contextLimit={contextLimit}
              pct={pct}
              entries={state.log}
              onTokensHelp={(persistent) =>
                openTip("tokens", undefined, persistent)
              }
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
      {activeTips.map((activeTip) => {
        const tip = scenarioTips.find((candidate) => candidate.id === activeTip.id);
        if (!tip) return null;
        return (
          <HelpTip
            key={activeTip.id}
            anchor={activeTip.anchor}
            title={tip.title}
            body={tip.body}
            learnMoreUrl={tip.learnMoreUrl}
            learnMoreLabel={tip.learnMoreLabel}
            persistent={activeTip.persistent}
            hoverOnly={activeTip.hoverOnly}
            contextual={tip.contextual}
            onClose={() =>
              setActiveTips((current) =>
                current.filter((active) => active.id !== activeTip.id),
              )
            }
            onStopReminding={() => stopReminding(activeTip.id)}
          />
        );
      })}
      {tipsAnchor && (
        <TipsMenu
          anchor={tipsAnchor}
          seen={seenTips}
          tips={scenarioTips}
          onShowTip={(tip) => {
            setTipsAnchor(null);
            const anchor: HTMLElement | null =
              (tip.targetId
                ? document.getElementById(tip.targetId)
                : null) ||
              (tip.fallbackTargetId
                ? document.getElementById(tip.fallbackTargetId)
                : null);
            anchor?.scrollIntoView({
              behavior: "auto",
              block: "center",
              inline: "nearest",
            });
            window.requestAnimationFrame(() => {
              openTip(tip.id, anchor ?? undefined, true);
            });
          }}
          onToggleSeen={toggleTipSeen}
          onClose={() => setTipsAnchor(null)}
        />
      )}
    </main>
  );
  /* eslint-enable jsx-a11y-x/no-noninteractive-element-interactions, jsx-a11y-x/no-noninteractive-tabindex */
}
