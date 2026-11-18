# Workflow Visualizer Launcher

Minimal Cursor/VS Code extension: **Workflow Visualizer: Open** opens Simple Browser to `http://127.0.0.1:5173` when the UI is already running. It does **not** start the server.

## Local install

From the factory repo root:

```bash
cd extensions/visualizer-launcher
pnpm install --ignore-workspace
pnpm compile
```

Then in Cursor/VS Code: **Extensions: Install from VSIX…** after `npx @vscode/vsce package` (optional), or use **Developer: Install Extension from Location…** pointing at this folder (depends on editor build).

Simplest for Cursor: open this folder as an extension development host (`F5` from the extension folder) or copy the folder under your user extensions directory after `pnpm compile`.

Command Palette → **Workflow Visualizer: Open**.

## Start the stack

From the Project Root (the workspace you want bound):

```bash
pnpm open:visualizer
```

That starts server (`--project` = cwd) + web if needed, then prints the URL. Use the palette command after the UI is up.
