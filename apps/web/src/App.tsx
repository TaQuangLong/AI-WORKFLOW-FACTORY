import { useCallback, useEffect, useMemo, useState } from "react";
import * as api from "./api";
import type { ChatMessage, Snapshot, Step, Workflow } from "./types";

function newStep(): Step {
  return {
    id: `step_${crypto.randomUUID().slice(0, 8)}`,
    title: "New step",
    skillId: "my-skill",
    ticked: true,
    status: "pending",
  };
}

export function App() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [draft, setDraft] = useState<Workflow | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [skillForm, setSkillForm] = useState({
    skillId: "",
    description: "",
  });

  const refresh = useCallback(async () => {
    const s = await api.fetchSnapshot();
    setSnap(s);
    setDraft(s.draft);
    setChat(s.chat);
  }, []);

  useEffect(() => {
    void refresh();
    return api.connectEvents((raw) => {
      const e = raw as {
        type: string;
        message?: ChatMessage;
        workflow?: Workflow;
        kind?: string;
        stepId?: string;
        status?: string;
        line?: string;
        stream?: string;
        state?: string;
      };
      if (e.type === "chat" && e.message) {
        setChat((c) => [...c, e.message!]);
      }
      if (e.type === "workflow" && e.workflow) {
        if (e.kind === "draft") setDraft(e.workflow);
        void refresh();
      }
      if (e.type === "step") {
        void refresh();
      }
      if (e.type === "log" && e.line) {
        setLogs((l) => [...l.slice(-200), `[${e.stream}] ${e.line}`]);
      }
      if (e.type === "run") {
        void refresh();
      }
    });
  }, [refresh]);

  const viewWorkflow = draft ?? snap?.current ?? null;

  const blocked = useMemo(
    () => viewWorkflow?.steps.filter((s) => s.status === "blocked") ?? [],
    [viewWorkflow],
  );

  const running = snap?.run.state === "running";
  const canEditDraft = Boolean(draft);

  async function sendChat() {
    if (!input.trim()) return;
    setBusy(true);
    try {
      await api.postChat(input.trim());
      setInput("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function persistDraft(next: Workflow) {
    setDraft(next);
    await api.saveDraft(next);
  }

  function patchStep(id: string, patch: Partial<Step>) {
    if (!draft) return;
    const next = {
      ...draft,
      steps: draft.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    };
    void persistDraft(next);
  }

  function moveStep(id: string, dir: -1 | 1) {
    if (!draft) return;
    const idx = draft.steps.findIndex((s) => s.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= draft.steps.length) return;
    const steps = [...draft.steps];
    const tmp = steps[idx]!;
    steps[idx] = steps[j]!;
    steps[j] = tmp;
    void persistDraft({ ...draft, steps });
  }

  async function onAccept() {
    setBusy(true);
    try {
      await api.acceptDraft();
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onCreateSkill() {
    if (!skillForm.skillId.trim()) return;
    setBusy(true);
    try {
      await api.createSkill(
        skillForm.skillId.trim(),
        skillForm.description.trim() || skillForm.skillId.trim(),
      );
      setSkillForm({ skillId: "", description: "" });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          Workflow <span>Visualizer</span>
        </div>
        <div className="meta">
          {snap?.projectRoot ?? "…"} · adapter={snap?.adapterId ?? "…"} · run=
          {snap?.run.state ?? "idle"}
        </div>
      </header>

      <section className="panel">
        <h2>Chat</h2>
        <p className="hint">
          Say what you want to do. A Draft Workflow appears for editing — nothing
          runs until you Accept.
        </p>
        <div className="chat-log">
          {chat.map((m) => (
            <div key={m.id} className={`msg ${m.role}`}>
              <div className="role">{m.role}</div>
              <div className="bubble">{m.content}</div>
            </div>
          ))}
        </div>
        <div className="composer">
          <input
            value={input}
            placeholder="Describe the goal…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void sendChat();
            }}
            disabled={busy}
          />
          <button className="primary" disabled={busy} onClick={() => void sendChat()}>
            Send
          </button>
        </div>
        {blocked.length > 0 && (
          <div className="create-skill">
            <strong>Blocked skills — create with me</strong>
            <input
              placeholder="skill id (e.g. grill-with-docs)"
              value={skillForm.skillId}
              onChange={(e) =>
                setSkillForm((s) => ({ ...s, skillId: e.target.value }))
              }
            />
            <input
              placeholder="short description"
              value={skillForm.description}
              onChange={(e) =>
                setSkillForm((s) => ({ ...s, description: e.target.value }))
              }
            />
            <button disabled={busy} onClick={() => void onCreateSkill()}>
              Create Skill
            </button>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Workflow steps</h2>
        <div className="controls">
          <button
            disabled={!canEditDraft || busy}
            onClick={() => draft && void persistDraft({ ...draft, steps: [...draft.steps, newStep()] })}
          >
            Add step
          </button>
          <button className="primary" disabled={!canEditDraft || busy} onClick={() => void onAccept()}>
            Accept draft
          </button>
          <button disabled={busy || running || !snap?.current} onClick={() => void api.runWorkflow()}>
            Run
          </button>
          <button disabled={!running} onClick={() => void api.stopWorkflow()}>
            Stop
          </button>
          <button
            disabled={busy || running || !snap?.current}
            onClick={() => void api.continueWorkflow()}
          >
            Continue
          </button>
          <select
            value={snap?.adapterId ?? "fake"}
            onChange={(e) => {
              void api.setAdapter(e.target.value).then(refresh);
            }}
            style={{
              background: "var(--bg2)",
              color: "var(--text)",
              border: "1px solid var(--line)",
              borderRadius: 6,
              padding: "0.35rem 0.5rem",
            }}
          >
            <option value="fake">fake</option>
            <option value="cursor">cursor</option>
            <option value="codex">codex</option>
            <option value="claude">claude</option>
          </select>
        </div>
        <div className="step-list">
          {!viewWorkflow && <p className="hint">No draft yet — chat a goal first.</p>}
          {viewWorkflow && !draft && (
            <p className="hint">Showing accepted Workflow (chat again to create a new Draft).</p>
          )}
          {viewWorkflow?.steps.map((s) => (
            <div key={s.id} className="step">
              <div className="step-head">
                <label>
                  <input
                    type="checkbox"
                    checked={s.ticked}
                    disabled={!canEditDraft}
                    onChange={(e) =>
                      patchStep(s.id, {
                        ticked: e.target.checked,
                        status: e.target.checked ? "pending" : "ignored",
                      })
                    }
                  />{" "}
                  Tick
                </label>
                <input
                  type="text"
                  value={s.title}
                  disabled={!canEditDraft}
                  onChange={(e) => patchStep(s.id, { title: e.target.value })}
                />
                <span className={`status ${s.status}`}>{s.status}</span>
              </div>
              <div className="step-meta">
                <input
                  value={s.skillId}
                  disabled={!canEditDraft}
                  onChange={(e) => patchStep(s.id, { skillId: e.target.value })}
                  title="skillId"
                />
                <button type="button" disabled={!canEditDraft} onClick={() => moveStep(s.id, -1)}>
                  Up
                </button>
                <button type="button" disabled={!canEditDraft} onClick={() => moveStep(s.id, 1)}>
                  Down
                </button>
                <button
                  type="button"
                  disabled={!canEditDraft}
                  onClick={() => {
                    if (!draft) return;
                    void persistDraft({
                      ...draft,
                      steps: draft.steps.filter((x) => x.id !== s.id),
                    });
                  }}
                >
                  Remove
                </button>
                <button
                  type="button"
                  disabled={running || !snap?.current}
                  onClick={() => void api.rerunStep(s.id)}
                >
                  Re-run
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="log-view">
          {logs.length === 0 ? (
            <div>Logs will stream here during a Run.</div>
          ) : (
            logs.map((l, i) => <div key={i}>{l}</div>)
          )}
        </div>
      </section>
    </div>
  );
}
