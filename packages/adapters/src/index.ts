export type {
  AdapterLogHandler,
  AdapterResult,
  AdapterStartInput,
  CliAdapter,
} from "./types.js";
export { FakeAdapter } from "./fake.js";
export { CursorAdapter } from "./cursor.js";
export { CodexAdapter, ClaudeAdapter } from "./stubs.js";

import type { CliAdapter } from "./types.js";
import { FakeAdapter } from "./fake.js";
import { CursorAdapter } from "./cursor.js";
import { CodexAdapter, ClaudeAdapter } from "./stubs.js";

export type AdapterId = CliAdapter["id"];

export function createAdapter(id: AdapterId = "cursor"): CliAdapter {
  switch (id) {
    case "fake":
      return new FakeAdapter();
    case "cursor":
      return new CursorAdapter();
    case "codex":
      return new CodexAdapter();
    case "claude":
      return new ClaudeAdapter();
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}
