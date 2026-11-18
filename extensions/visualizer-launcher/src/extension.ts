import * as http from "node:http";
import * as vscode from "vscode";

const VISUALIZER_URL = "http://127.0.0.1:5173";

function isReachable(url: string, timeoutMs = 800): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => resolve(false));
  });
}

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    "awf.visualizer.open",
    async () => {
      const up = await isReachable(VISUALIZER_URL);
      if (!up) {
        void vscode.window.showErrorMessage(
          `Workflow Visualizer is not reachable at ${VISUALIZER_URL}. From the Project Root (this workspace), run: pnpm open:visualizer — see README.`,
        );
        return;
      }
      await vscode.commands.executeCommand("simpleBrowser.show", VISUALIZER_URL);
    },
  );
  context.subscriptions.push(disposable);
}

export function deactivate(): void {}
