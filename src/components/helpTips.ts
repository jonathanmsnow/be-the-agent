export type TipTriggerContext = {
  elapsedMs: number;
  toolRunCount: number;
  wrongAnswer?: boolean;
};

export type TipDefinition = {
  id: string;
  label: string;
  title: string;
  body: string;
  learnMoreUrl?: string;
  learnMoreLabel?: string;
  hoverOnly?: boolean;
  contextual?: boolean;
  targetId?: string;
  fallbackTargetId?: string;
  initialDelayMs?: number;
  trigger?: (context: TipTriggerContext) => boolean;
  scenarioId?: string | null;
};

export const TIP_DEFINITIONS: TipDefinition[] = [
  {
    id: "tokens",
    label: "Tokens",
    title: "Tokens",
    body: "Tokens are small pieces of text that an AI model reads and generates. Words, punctuation, and spaces can each use one or more tokens depending on the tokenization method used. The token count shows how much of the context window is currently in use.",
    targetId: "tokens-help",
    learnMoreUrl:
      "https://learn.microsoft.com/en-us/dotnet/ai/conceptual/understanding-tokens",
    hoverOnly: true,
    contextual: true,
    scenarioId: null,
  },
  {
    id: "tools",
    label: "Tools",
    title: "Agent Tools",
    body: "Tools let an agent inspect context and take actions in the environment. Choose the tool that gathers the evidence or makes the change needed for the user's request.",
    learnMoreUrl: "https://www.ibm.com/think/topics/tool-calling",
    targetId: "tools-help",
    hoverOnly: true,
    contextual: true,
    scenarioId: null,
  },
  {
    id: "context-window",
    label: "Context windows",
    title: "Context Window",
    body: "The Context Window is the amount of input (like text) that an AI system can process at one time during a task. Think of it as a model’s short-term memory. A model can only consider so much text when generating its next response, and once the conversation exceeds its context window, the model starts “forgetting” prior responses. (Stanford University, Human-Centered Artificial Intelligence)",
    learnMoreUrl:
      "https://docs.github.com/en/copilot/concepts/prompting-and-context/context-management",
    hoverOnly: true,
    contextual: true,
    targetId: "context-window-help",
    scenarioId: null,
  },
  {
    id: "tool-call-prompt",
    label: "Call a tool",
    title: "Using Tools as an Agent",
    body: "Choose a tool, run it, and use the results to move the investigation forward.",
    targetId: "tool-run",
    trigger: ({ elapsedMs, toolRunCount }) =>
      toolRunCount === 0 && elapsedMs >= 30_000,
    scenarioId: null,
  },
  {
    id: "view-range",
    label: "Read file slices",
    title: "Read A Section of a File",
    body: "Read a limited section of a long file instead of all of it. This helps reduce context window usage!",
    targetId: "view-range",
    fallbackTargetId: "read-file-tool",
    scenarioId: null,
  },
  {
    id: "request-mode",
    label: "Switch request views",
    title: "Switch Tool Request Views",
    body: "These are the two ways to visualize the same tool call. The JSON view shows the raw data like an agent might see it, while the form view makes it easier to fill in.",
    targetId: "request-mode",
    scenarioId: null,
  },
  {
    id: "tool-result",
    label: "Read tool results",
    title: "Tool Call Result Output",
    body: "When you are acting as the agent and make a tool call, you will see the result here. Tools help you gather information and perform actions to solve the user's request.",
    targetId: "tool-result",
    fallbackTargetId: "tool-run",
    scenarioId: null,
  },
  {
    id: "answer-required",
    label: "Answer the user",
    title: "Responding to the User",
    body: "This is how you send a response to the user to answer their request. The user will respond to let you know if you provided the correct information.",
    targetId: "answer-input",
    scenarioId: null,
  },
  {
    id: "original-user-request",
    label: "Read the user's request",
    title: "User Prompts and Requests",
    body: "This is what the user wants you to accomplish. Use this original user request to guide your investigation and response.",
    targetId: "original-user-request",
    initialDelayMs: 0,
    trigger: ({ elapsedMs, wrongAnswer }) =>
      wrongAnswer === true || elapsedMs >= 0,
    scenarioId: null,
  },
];

export function tipsForScenario(scenarioId: string) {
  return TIP_DEFINITIONS.filter(
    (tip) => !tip.scenarioId || tip.scenarioId === scenarioId,
  );
}

export function tipForTarget(tips: TipDefinition[], targetId: string) {
  return tips.find((tip) => tip.targetId === targetId || tip.id === targetId);
}

export function shouldTriggerTip(
  tip: TipDefinition,
  context: TipTriggerContext,
) {
  return tip.trigger?.(context) ?? false;
}
