import { useEffect, useReducer, useRef, useState } from 'react'
import levelData from './levels/level1.json'
import { runTool } from './engine/runTool'
import type { Level, ToolCall } from './engine/types'

const level = levelData as Level

type Role = 'system' | 'user' | 'you' | 'result'
interface Entry {
  role: Role
  text: string
  tokens: number
}
interface State {
  log: Entry[]
  verdict: string | null
}
type Action =
  | { type: 'RUN'; call: ToolCall }
  | { type: 'ANSWER'; text: string }

const estimate = (text: string) => Math.ceil(text.length / 4)

const initial: State = {
  verdict: null,
  log: [
    { role: 'system', text: level.system, tokens: estimate(level.system) },
    {
      role: 'user',
      text: `${level.briefing.from}: ${level.briefing.message}`,
      tokens: estimate(level.briefing.message),
    },
  ],
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'RUN': {
      const callText = `${action.call.tool} ${action.call.args ? JSON.stringify(action.call.args) : ''}`
      const { output, cost } = runTool(level, action.call.tool, action.call.args)
      return {
        ...state,
        log: [
          ...state.log,
          { role: 'you', text: callText, tokens: estimate(callText) },
          { role: 'result', text: output, tokens: cost },
        ],
      }
    }
    case 'ANSWER': {
      const ok = level.answerKeywords.every(k => action.text.includes(k))
      return {
        ...state,
        verdict: ok ? 'Correct!' : 'Not quite.',
        log: [
          ...state.log,
          { role: 'you', text: `answer: ${action.text}`, tokens: estimate(action.text) },
        ],
      }
    }
  }
}

const ROLE_STYLE: Record<Role, { label: string; tint: string }> = {
  system: { label: 'system', tint: 'rgba(150,150,150,0.15)' },
  user: { label: 'user', tint: 'rgba(80,140,255,0.15)' },
  you: { label: 'you', tint: 'rgba(80,190,120,0.15)' },
  result: { label: 'result', tint: 'rgba(240,180,60,0.15)' },
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initial)
  const [path, setPath] = useState('')
  const [tool, setTool] = useState<'read_file' | 'list_files'>('read_file')
  const [answer, setAnswer] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const used = state.log.reduce((sum, e) => sum + e.tokens, 0)
  const pct = Math.min(100, (used / level.contextLimit) * 100)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.log.length])

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'left', fontFamily: 'monospace' }}>
      {/* Header: label + meter */}
      <div style={{ position: 'sticky', top: 0, padding: '8px 0', background: 'Canvas' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <b>CONTEXT</b>
          <span>{used} / {level.contextLimit} tokens</span>
        </div>
        <div style={{ background: 'rgba(150,150,150,0.3)', height: 10, borderRadius: 5 }}>
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: 5,
              background: pct > 85 ? '#d55' : '#4a8',
              transition: 'width .3s',
            }}
          />
        </div>
      </div>

      {/* The log: one flat buffer, role-tagged blocks */}
      <div style={{ paddingBottom: 140 }}>
        {state.log.map((e, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '70px 1fr 60px',
              gap: 8,
              padding: '6px 8px',
              marginBottom: 2,
              background: ROLE_STYLE[e.role].tint,
              fontSize: 14,
            }}
          >
            <span style={{ opacity: 0.6 }}>[{ROLE_STYLE[e.role].label}]</span>
            <span style={{ whiteSpace: 'pre-wrap' }}>{e.text}</span>
            <span style={{ opacity: 0.5, textAlign: 'right' }}>{e.tokens}t</span>
          </div>
        ))}
        {state.verdict && <p><b>{state.verdict}</b></p>}
        <div ref={bottomRef} />
      </div>

      {/* Your turn: pinned composer */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'Canvas',
          borderTop: '1px solid rgba(150,150,150,0.4)',
          padding: 12,
        }}
      >
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>
            YOUR TURN: emit one tool call, or answer
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <select
              onChange={e => setTool(e.target.value as 'read_file' | 'list_files')}
            >
              {level.tools.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
              <input
                style={{ flex: 1 }}
                value={path}
                onChange={e => setPath(e.target.value)}
                placeholder="path"
              />
            <button onClick={() => dispatch({ type: 'RUN', call: { tool: tool, args: { path } } })}>
              Run
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              style={{ flex: 1 }}
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="your answer to the user"
            />
            <button onClick={() => dispatch({ type: 'ANSWER', text: answer })}>Answer</button>
          </div>
        </div>
      </div>
    </div>
  )
}