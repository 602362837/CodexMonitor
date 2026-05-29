# Architecture Spine

CodexMonitor is a Tauri desktop/mobile app for orchestrating Codex agents across local and remote workspaces. The important architectural idea is that UI, app backend, and daemon are separate adapters around shared domain cores.

## Runtime Layers

1. Frontend React app
   - Lives in `src/`.
   - Owns layout, panels, thread rendering, composer behavior, settings UI, git UI, prompts UI, notifications, and local UI persistence.
   - Talks to native functionality only through `src/services/tauri.ts`.

2. Tauri app backend
   - Root command registry is `src-tauri/src/lib.rs`.
   - Loads process state through `src-tauri/src/state.rs`.
   - Adapters in `src-tauri/src/{codex,workspaces,git,settings,files,prompts}/*` translate commands into shared core calls.

3. Shared backend cores
   - Live under `src-tauri/src/shared/*`.
   - This is the source of truth for behavior that can run in both app and daemon.
   - New cross-runtime behavior should start here.

4. Remote daemon
   - Entry point is `src-tauri/src/bin/codex_monitor_daemon.rs`.
   - JSON-RPC routing starts at `src-tauri/src/bin/codex_monitor_daemon/rpc.rs`.
   - Domain handlers live in `src-tauri/src/bin/codex_monitor_daemon/rpc/*`.
   - Transport/auth/event forwarding lives in `src-tauri/src/bin/codex_monitor_daemon/transport.rs`.

5. Codex app-server process
   - CodexMonitor starts and resumes Codex app-server sessions per workspace.
   - App-server events are normalized and routed to the frontend thread state.

## Control Flow

### Frontend to Local Backend

`src/features/**` calls `src/services/tauri.ts`, which invokes command names registered in `src-tauri/src/lib.rs`. The command implementation should be a thin adapter into shared core logic when the behavior is not app-only.

### Frontend to Remote Backend

The same frontend IPC wrapper is responsible for keeping contracts stable. Remote-mode implementation routes through `src-tauri/src/remote_backend/*` and daemon RPC handlers. The method names and payloads must stay aligned with local Tauri commands.

### Backend Events to Frontend

Backend event payloads are emitted through `src-tauri/src/event_sink.rs` and received by `src/services/events.ts`. App-server events enter thread state through `src/features/app/hooks/useAppServerEvents.ts` and the thread hooks/reducer under `src/features/threads/hooks/*`.

## Domain Areas

### Threads And Messages

- Frontend orchestration: `src/features/threads/hooks/useThreads.ts`
- Reducer entry: `src/features/threads/hooks/useThreadsReducer.ts`
- Reducer slices: `src/features/threads/hooks/threadReducer/*`
- Event routing: `src/features/app/hooks/useAppServerEvents.ts`
- Message rendering: `src/features/messages/**`
- Codex backend core: `src-tauri/src/shared/codex_core.rs`

Main invariant: thread reconciliation must preserve incoming order while retaining required local anchors, and hidden threads must not reappear.

### Workspaces And Worktrees

- Frontend: `src/features/workspaces/**`, `src/features/app/hooks/useWorkspaceController.ts`
- App adapters: `src-tauri/src/workspaces/*`
- Shared core: `src-tauri/src/shared/workspaces_core.rs`, `src-tauri/src/shared/workspaces_core/*`, `src-tauri/src/shared/worktree_core.rs`
- RPC contracts: `src-tauri/src/shared/workspace_rpc.rs`

Main invariant: workspace/worktree behavior should be shared before app or daemon adapters diverge.

### Settings And Codex Config

- Frontend settings UI: `src/features/settings/components/SettingsView.tsx`
- Settings hooks: `src/features/settings/hooks/*`
- Frontend contracts: `src/types.ts`, `src/services/tauri.ts`
- Rust types and persistence: `src-tauri/src/types.rs`, `src-tauri/src/storage.rs`
- Shared settings core: `src-tauri/src/shared/settings_core.rs`
- Agents config core: `src-tauri/src/shared/agents_config_core.rs`

For multi-agent settings, compare with upstream Codex using `docs/multi-agent-sync-runbook.md`.

### Git And GitHub

- Frontend hooks/components: `src/features/git/**`
- IPC wrapper: `src/services/tauri.ts`
- App adapter: `src-tauri/src/git/mod.rs`
- Shared core: `src-tauri/src/shared/git_ui_core.rs`, `src-tauri/src/shared/git_ui_core/*`, `src-tauri/src/shared/git_core.rs`
- RPC contracts: `src-tauri/src/shared/git_rpc.rs`
- Daemon RPC: `src-tauri/src/bin/codex_monitor_daemon/rpc/git.rs`

Git/GitHub behavior has a wide surface; keep request/response structs centralized and avoid one-off daemon parsing when a shared RPC type exists.

### Design System

- Shared primitives: `src/features/design-system/components/**`
- Tokens and shell styles: `src/styles/ds-*.css`
- Feature styles: `src/styles/<area>.css`

Do not recreate modal, toast, panel, or popover shell styling in feature CSS when a design-system primitive exists.

## Architectural Risk Points

- `src/App.tsx` and `src/features/app/**` are high-churn wiring areas; keep feature logic out of the root.
- `src/services/tauri.ts` is the frontend contract boundary; changing names or shapes requires backend and daemon parity checks.
- `src-tauri/src/lib.rs` is the local command registry; new commands must be deliberately registered.
- `src-tauri/src/shared/*` should stay the domain source of truth; duplicated app/daemon logic is a bug magnet.
- `src-tauri/src/bin/codex_monitor_daemon/rpc.rs` and `rpc/*` must preserve JSON-RPC method compatibility.
- Event payload changes need parser/guard updates before reducer changes.

## What Good Changes Look Like

- The smallest owning feature folder changes first.
- Cross-runtime backend logic is implemented once in shared core.
- Adapters stay thin and mostly translate inputs/outputs.
- Frontend IPC, Rust command names, daemon method names, and tests move together.
- Validation is chosen from the touched surface, then run before claiming completion.
