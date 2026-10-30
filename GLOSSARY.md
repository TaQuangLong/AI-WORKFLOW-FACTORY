# Workflow Visualizer

Local control surface for drafting and running Skill-aligned agent workflows via AI CLIs.

## Language

**Workflow**:
An ordered list of Steps that pursues one developer goal in a project.
_Avoid_: Pipeline, job, playbook

**Draft**:
A Workflow that has been proposed but not yet accepted for execution.
_Avoid_: Plan, proposal (when meaning the editable pre-run Workflow)

**Step**:
One unit in a Workflow, aligned to a single Skill, that may be included, ignored, run, stopped, or re-run.
_Avoid_: Task, node, stage

**Skill**:
A named local agent capability (folder with `SKILL.md`) that a Step invokes through an Adapter.
_Avoid_: Prompt, command (when meaning the Skill itself)

**Adapter**:
A pluggable integration that starts, streams, and kills one AI CLI (Cursor, Codex, Claude, …) for a Step.
_Avoid_: Provider, driver, connector

**Run**:
The execution of the accepted Workflow, advancing at most one Step at a time.
_Avoid_: Session, job

**Tick**:
Developer choice to include a Step in the Run.
_Avoid_: Enable, select (prefer Tick in UI copy)

**Ignore**:
Developer choice to exclude a Step from the Run without deleting it from the Draft.
_Avoid_: Skip (reserve Skip for advancing past a Step during a Run), disable

**Accept Draft**:
The explicit action that copies a Draft into the current Workflow and allows a Run to start.
_Avoid_: Save, publish, confirm (when meaning the draft→run gate)

**Stop**:
Killing the active Adapter CLI process for the running Step; that Step becomes `stopped`.
_Avoid_: Cancel, abort (prefer Stop in UI)

**Continue**:
After a Stop, starting the next Ticked `pending` Step (does not resume the stopped Step).
_Avoid_: Resume (resume implies the same Step)

**Re-run**:
Starting a chosen Step again without automatically resetting or re-running downstream Steps.
_Avoid_: Retry (ok in copy; Re-run is canonical)

**Chat**:
The suggest / Q&A thread between developer and agent that precedes and informs Drafting.
_Avoid_: Conversation, thread (alone)

**Project Root**:
The single local directory the server is bound to; `.workflow/` and Skill lookups are resolved from here.
_Avoid_: Workspace (unless meaning the editor workspace that happens to match), repo (when meaning the bound path)
