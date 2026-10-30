export type StepStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "stopped"
  | "ignored"
  | "blocked";

export interface Step {
  id: string;
  title: string;
  skillId: string;
  ticked: boolean;
  status: StepStatus;
  prompt?: string;
}

export interface Workflow {
  id: string;
  goal: string;
  steps: Step[];
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "system" | "assistant" | "user";
  content: string;
  createdAt: string;
}

export interface Snapshot {
  projectRoot: string;
  adapterId: string;
  draft: Workflow | null;
  current: Workflow | null;
  chat: ChatMessage[];
  run: { state: string; activeStepId: string | null };
}
