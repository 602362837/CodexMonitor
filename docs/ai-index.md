# AI Index

This is the repository lookup table for AI agents. Use it to decide which documents and source files to read before changing code.

## First Decision

| Task shape | Read first | Then inspect |
| --- | --- | --- |
| Any code change | `AGENTS.md`, `docs/ai-index.md`, `docs/codebase-map.md` | The touched feature/backend files and nearby tests |
| Unsure where logic lives | `docs/architecture-spine.md`, `docs/codebase-map.md` | `src/features/**`, `src/services/tauri.ts`, `src-tauri/src/shared/*` |
| Frontend UI/state work | `docs/change-playbooks.md#frontend-ui-or-state` | `src/App.tsx`, `src/features/app/**`, target feature folder |
| Tauri command or IPC work | `docs/change-playbooks.md#tauri-ipc-or-backend-command` | `src/services/tauri.ts`, `src-tauri/src/lib.rs`, backend adapter |
| App + daemon parity work | `docs/change-playbooks.md#appdaemon-parity` | `src-tauri/src/shared/*`, `src-tauri/src/bin/codex_monitor_daemon/rpc*` |
| Thread/event behavior | `docs/app-server-events.md`, `docs/codebase-map.md` | `src/services/events.ts`, `src/features/app/hooks/useAppServerEvents.ts`, thread reducer hooks |
| Workspace/worktree behavior | `docs/codebase-map.md`, `docs/change-playbooks.md#workspace-and-worktree` | `src/features/workspaces/**`, `src-tauri/src/shared/workspaces_core*` |
| Git/GitHub behavior | `docs/change-playbooks.md#git-and-github` | `src/features/git/**`, `src-tauri/src/shared/git_ui_core*` |
| Settings/config/agents behavior | `docs/multi-agent-sync-runbook.md`, `docs/change-playbooks.md#settings-and-codex-config` | `src/features/settings/**`, `src-tauri/src/shared/settings_core.rs`, `src-tauri/src/shared/agents_config_core.rs` |
| Mobile/iOS remote work | `docs/mobile-ios-tailscale-blueprint.md`, `README.md` | `src/features/mobile/**`, `src-tauri/src/tailscale/**`, daemon files |
| Release/build/setup | `README.md` | `package.json`, `src-tauri/Cargo.toml`, scripts under `scripts/` |

## Source Of Truth By Layer

### Product Behavior

- High-level app capabilities and run commands: `README.md`
- Current agent contract and invariants: `AGENTS.md`
- AI root soul file and repo contract: `AGENTS.md`

### Frontend

- Composition root: `src/App.tsx`
- Main app wiring: `src/features/app/components/MainApp.tsx`
- App layout shell: `src/features/app/components/AppLayout.tsx`
- Bootstrap and orchestration: `src/features/app/bootstrap/*`, `src/features/app/orchestration/*`
- Feature UI and hooks: `src/features/<feature>/**`
- Shared frontend types: `src/types.ts`
- Tauri IPC wrapper: `src/services/tauri.ts`
- Tauri event subscription hub: `src/services/events.ts`
- Styles and tokens: `src/styles/*`, `src/features/design-system/**`

### Backend App

- Tauri command registry: `src-tauri/src/lib.rs`
- App state loading: `src-tauri/src/state.rs`
- App storage: `src-tauri/src/storage.rs`
- App adapters: `src-tauri/src/codex/*`, `src-tauri/src/workspaces/*`, `src-tauri/src/git/*`, `src-tauri/src/settings/*`, `src-tauri/src/files/*`

### Shared Backend Cores

Use these before duplicating backend logic in adapters:

- Codex app-server and thread behavior: `src-tauri/src/shared/codex_core.rs`
- Codex auxiliary/config/update behavior: `src-tauri/src/shared/codex_aux_core.rs`, `src-tauri/src/shared/config_toml_core.rs`, `src-tauri/src/shared/codex_update_core.rs`
- Workspaces and worktrees: `src-tauri/src/shared/workspaces_core.rs`, `src-tauri/src/shared/workspaces_core/*`, `src-tauri/src/shared/worktree_core.rs`
- Git/GitHub: `src-tauri/src/shared/git_core.rs`, `src-tauri/src/shared/git_ui_core.rs`, `src-tauri/src/shared/git_ui_core/*`, `src-tauri/src/shared/git_rpc.rs`
- Settings/config/agents: `src-tauri/src/shared/settings_core.rs`, `src-tauri/src/shared/agents_config_core.rs`
- Files and prompts: `src-tauri/src/shared/files_core.rs`, `src-tauri/src/shared/prompts_core.rs`
- Usage and processes: `src-tauri/src/shared/local_usage_core.rs`, `src-tauri/src/shared/process_core.rs`

### Daemon

- Daemon entrypoint: `src-tauri/src/bin/codex_monitor_daemon.rs`
- Transport/auth/event forwarding: `src-tauri/src/bin/codex_monitor_daemon/transport.rs`, `src-tauri/src/bin/codex_monitor_daemon/rpc.rs`
- RPC dispatcher: `src-tauri/src/bin/codex_monitor_daemon/rpc/dispatcher.rs`
- Domain RPC handlers: `src-tauri/src/bin/codex_monitor_daemon/rpc/*`
- Daemon lifecycle CLI: `src-tauri/src/bin/codex_monitor_daemonctl.rs`
- Remote backend client/protocol: `src-tauri/src/remote_backend/*`

## Validation Lookup

- Always run for code changes: `npm run typecheck`
- Frontend behavior/hooks/components: `npm run test`
- Rust backend changes: `cd src-tauri && cargo check`
- Targeted frontend test: `npm run test -- <path-to-test-file>`
- Environment checks before dev/build: `npm run doctor:strict`

For docs-only changes, validate links and changed files with `git diff --check`.
