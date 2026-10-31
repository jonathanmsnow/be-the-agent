import { useRef, useState, type Dispatch } from "react";
import { z } from "zod";
import { ActionType, type ToolCall, type ToolDef } from "../engine/types";

export type ToolAction = {
  type: ActionType;
  call?: ToolCall;
  text?: string;
};

type JsonSchema = {
  type?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  description?: string;
};

type RequestMode = "json" | "form";
type FormValues = Record<string, unknown>;
const BUTTON_DEBOUNCE_MS = 300;

function schemaFor(tool: ToolDef | undefined): JsonSchema | undefined {
  return tool ? (z.toJSONSchema(tool.schema) as JsonSchema) : undefined;
}

function emptyValues(schema: JsonSchema | undefined): FormValues {
  if (!schema?.properties) return {};
  const required = new Set(schema.required ?? []);
  return Object.fromEntries(
    Object.entries(schema.properties)
      .filter(([name]) => required.has(name))
      .map(([name, property]) => [name, emptyValue(property)]),
  );
}

function emptyValue(schema: JsonSchema): unknown {
  if (schema.type === "object") return emptyValues(schema);
  if (schema.type === "boolean") return false;
  if (schema.type === "number" || schema.type === "integer") return 0;
  if (schema.type === "array") return [];
  return "";
}

function formValuesFromRequest(rawRequest: string, tool: ToolDef) {
  const request = JSON.parse(rawRequest) as Partial<ToolCall>;
  if (
    request.tool !== tool.name ||
    !request.args ||
    typeof request.args !== "object" ||
    Array.isArray(request.args)
  ) {
    throw new Error('JSON must include matching "tool" and object "args".');
  }
  const parsed = tool.schema.safeParse(request.args);
  if (!parsed.success) {
    throw new Error("JSON arguments do not match this tool's schema.");
  }
  return parsed.data as FormValues;
}

function updateValue(
  values: FormValues,
  path: string[],
  value: unknown,
): FormValues {
  const next = { ...values };
  let target: FormValues = next;
  path.forEach((key, index) => {
    if (index === path.length - 1) {
      if (value === undefined) delete target[key];
      else target[key] = value;
      return;
    }
    const child = target[key];
    target[key] = { ...(typeof child === "object" && child ? child : {}) };
    target = target[key] as FormValues;
  });
  return next;
}

function FormField({
  name,
  schema,
  value,
  path,
  required,
  onChange,
  onFocus,
}: {
  name: string;
  schema: JsonSchema;
  value: unknown;
  path: string[];
  required: boolean;
  onChange: (path: string[], value: unknown) => void;
  onFocus?: (anchor: HTMLElement) => void;
}) {
  if (schema.type === "object" && schema.properties) {
    const objectValue =
      typeof value === "object" && value ? (value as FormValues) : {};
    return (
      <fieldset
        id={name === "view_range" ? "view-range" : undefined}
        className="form-fieldset"
        onFocus={onFocus ? (event) => onFocus(event.currentTarget) : undefined}
      >
        <legend>
          {name}
          <small> ({required ? "required" : "optional"})</small>
        </legend>
        {Object.entries(schema.properties).map(([childName, childSchema]) => (
          <FormField
            key={childName}
            name={childName}
            schema={childSchema}
            value={objectValue[childName]}
            path={[...path, childName]}
            required={required && (schema.required ?? []).includes(childName)}
            onChange={onChange}
            onFocus={onFocus}
          />
        ))}
      </fieldset>
    );
  }

  const id = `form-field-${path.join("-")}`;
  const isBoolean = schema.type === "boolean";
  const isNumber = schema.type === "number" || schema.type === "integer";
  return (
    <label className="form-field" htmlFor={id}>
      <span>
        {name}
        <small> ({required ? "required" : "optional"})</small>
      </span>
      {isBoolean ? (
        <input
          id={id}
          type="checkbox"
          aria-required={required}
          checked={value === true}
          onChange={(event) => onChange(path, event.target.checked)}
        />
      ) : (
        <input
          id={id}
          type={isNumber ? "number" : "text"}
          aria-required={required}
          value={value === undefined ? "" : String(value)}
          onChange={(event) => {
            const text = event.target.value;
            onChange(
              path,
              isNumber ? (text === "" ? undefined : Number(text)) : text,
            );
          }}
          placeholder={schema.description}
        />
      )}
    </label>
  );
}

export function ToolExecution({
  tool,
  dispatch,
  disabled,
  rawRequest,
  setRawRequest,
  onViewRangeFocus,
  onModeSwitch,
  onToolRun,
  onEmptyAnswer,
  onAnswer,
}: {
  tool: ToolDef | undefined;
  dispatch: Dispatch<ToolAction>;
  disabled: boolean;
  rawRequest: string;
  setRawRequest: (value: string) => void;
  onViewRangeFocus?: (anchor: HTMLElement) => void;
  onModeSwitch?: (anchor: HTMLElement) => void;
  onToolRun?: () => void;
  onEmptyAnswer?: (anchor: HTMLElement) => void;
  onAnswer?: (text: string) => void;
}) {
  const [mode, setMode] = useState<RequestMode>("form");
  const [formValues, setFormValues] = useState<FormValues>(() =>
    emptyValues(schemaFor(tool)),
  );
  const [requestError, setRequestError] = useState("");
  const [answer, setAnswer] = useState("");
  const lastButtonClickRef = useRef(0);
  const answerInputRef = useRef<HTMLInputElement>(null);
  const selectedSchema = schemaFor(tool);

  if (!tool) return null;

  const buttonClickIsDebounced = () => {
    const now = Date.now();
    if (now - lastButtonClickRef.current < BUTTON_DEBOUNCE_MS) {
      return true;
    }
    lastButtonClickRef.current = now;
    return false;
  };

  return (
    <>
      <div className="tool-request">
        <div className="tool-request-heading">
          <strong>{tool.name}</strong>
        </div>
        <p className="tool-description">{tool.description}</p>
        <div
          id="request-mode"
          className="request-mode-toggle"
          role="tablist"
          aria-label="Request body representation"
        >
          {(["form", "json"] as const).map((nextMode) => (
            <button
              key={nextMode}
              type="button"
              className={`mode-button${mode === nextMode ? " selected" : ""}`}
              disabled={disabled || mode === nextMode}
              role="tab"
              aria-selected={mode === nextMode}
              onClick={(event) => {
                if (nextMode !== mode) {
                  onModeSwitch?.(
                    event.currentTarget.parentElement ?? event.currentTarget,
                  );
                }
                if (nextMode === "form") {
                  try {
                    setFormValues(formValuesFromRequest(rawRequest, tool));
                    setRequestError("");
                  } catch (error) {
                    setRequestError(
                      error instanceof Error
                        ? error.message
                        : "Invalid JSON request.",
                    );
                    return;
                  }
                } else {
                  setRawRequest(
                    JSON.stringify(
                      { tool: tool.name, args: formValues },
                      null,
                      2,
                    ),
                  );
                  setRequestError("");
                }
                setMode(nextMode);
              }}
            >
              {nextMode === "json" ? "JSON" : "Form"}
            </button>
          ))}
        </div>
        {mode === "json" ? (
          <>
            <label className="request-label" htmlFor="raw-tool-request">
              Request body · JSON
            </label>
            <textarea
              disabled={disabled}
              id="raw-tool-request"
              className="request-editor"
              value={rawRequest}
              onChange={(event) => {
                setRawRequest(event.target.value);
                setRequestError("");
              }}
              spellCheck={false}
              aria-describedby={requestError ? "request-error" : undefined}
            />
          </>
        ) : (
          <div className="request-form">
            {Object.entries(selectedSchema?.properties ?? {}).map(
              ([name, fieldSchema]) => (
                <FormField
                  key={name}
                  name={name}
                  schema={fieldSchema}
                  value={formValues[name]}
                  path={[name]}
                  required={(selectedSchema?.required ?? []).includes(name)}
                  onFocus={name === "view_range" ? onViewRangeFocus : undefined}
                  onChange={(path, value) => {
                    const nextValues = updateValue(formValues, path, value);
                    setFormValues(nextValues);
                    setRawRequest(
                      JSON.stringify(
                        { tool: tool.name, args: nextValues },
                        null,
                        2,
                      ),
                    );
                    setRequestError("");
                  }}
                />
              ),
            )}
          </div>
        )}
        {requestError && (
          <p className="request-error" id="request-error" role="alert">
            {requestError}
          </p>
        )}
        <button
          disabled={disabled}
          id="tool-run"
          className="action-button send-button"
          onClick={() => {
            if (buttonClickIsDebounced()) return;
            try {
              const request = JSON.parse(
                mode === "form"
                  ? JSON.stringify({ tool: tool.name, args: formValues })
                  : rawRequest,
              ) as ToolCall;
              if (
                typeof request.tool !== "string" ||
                !Object.prototype.hasOwnProperty.call(request, "args")
              ) {
                throw new Error('JSON must include "tool" and "args".');
              }
              setRequestError("");
              dispatch({ type: ActionType.RUN, call: request });
              onToolRun?.();
            } catch (error) {
              if (error instanceof SyntaxError) {
                setRequestError("");
                dispatch({
                  type: ActionType.RUN,
                  call: { tool: tool.name, args: rawRequest },
                });
                onToolRun?.();
                return;
              }
              setRequestError(
                error instanceof Error
                  ? error.message
                  : "Could not send request.",
              );
            }
          }}
        >
          Send request
        </button>
      </div>

      <div className="answer-section">
        <label className="request-label" htmlFor="answer-input">
          Respond to user
        </label>
        <input
          ref={answerInputRef}
          disabled={disabled}
          id="answer-input"
          className="composer-input"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="write your response"
        />
        <button
          disabled={disabled}
          className="action-button"
          onClick={() => {
            if (buttonClickIsDebounced()) return;
            if (!answer.trim()) {
              if (answerInputRef.current) onEmptyAnswer?.(answerInputRef.current);
              return;
            }
            dispatch({ type: ActionType.ANSWER, text: answer });
            onAnswer?.(answer);
          }}
        >
          Send response
        </button>
      </div>
    </>
  );
}
