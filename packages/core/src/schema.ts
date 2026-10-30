import { z } from "zod";

export const StepStatusSchema = z.enum([
  "pending",
  "running",
  "succeeded",
  "failed",
  "stopped",
  "ignored",
  "blocked",
]);
export type StepStatus = z.infer<typeof StepStatusSchema>;

export const StepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  skillId: z.string().min(1),
  ticked: z.boolean(),
  status: StepStatusSchema,
  prompt: z.string().optional(),
});
export type Step = z.infer<typeof StepSchema>;

export const WorkflowSchema = z.object({
  id: z.string().min(1),
  goal: z.string(),
  steps: z.array(StepSchema),
  updatedAt: z.string(),
});
export type Workflow = z.infer<typeof WorkflowSchema>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["system", "assistant", "user"]),
  content: z.string(),
  createdAt: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const WorkflowEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("workflow"),
    workflow: WorkflowSchema,
    kind: z.enum(["draft", "current"]),
  }),
  z.object({
    type: z.literal("step"),
    stepId: z.string(),
    status: StepStatusSchema,
  }),
  z.object({
    type: z.literal("log"),
    stepId: z.string().optional(),
    stream: z.enum(["stdout", "stderr", "system"]),
    line: z.string(),
  }),
  z.object({
    type: z.literal("chat"),
    message: ChatMessageSchema,
  }),
  z.object({
    type: z.literal("run"),
    state: z.enum(["idle", "running", "stopped"]),
    activeStepId: z.string().nullable(),
  }),
]);
export type WorkflowEvent = z.infer<typeof WorkflowEventSchema>;
