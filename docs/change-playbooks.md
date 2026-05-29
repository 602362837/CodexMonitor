# Change Playbooks

Use these routes when changing the project. They are intentionally practical: read the listed files, make the change in the owning layer, then validate the touched surface.

## Frontend UI Or State

Read:

- `docs/codebase-map.md`
- `src/App.tsx`
- The target folder under `src/features/<feature>/**`
- Nearby `*.test.ts` or `*.test.tsx`

Change route:

1. Keep `src/App.tsx` as composition and global style wiring.
2. Put stateful orchestration in feature hooks or `src/features/app/hooks/*`.
3. Put presentational UI in feature components.
4. Use existing design-system primitives from `src/features/design-system/**` before adding new shell CSS.
5. Keep Tauri calls inside `src/services/tauri.ts`.

Validate:

```bash
npm run typecheck
npm run test -- <target-test-file>
```

## Tauri IPC Or Backend Command

Read:

- `src/services/tauri.ts`
- `src-tauri/src/lib.rs`
- The relevant adapter under `src-tauri/src/{codex,workspaces,git,settings,files,prompts}/*`
- Shared core under `src-tauri/src/shared/*`

Change route:

1. Add or update the shared core behavior first if the daemon also needs it.
2. Add or update the Tauri command adapter.
3. Register the command in `src-tauri/src/lib.rs`.
4. Update the typed frontend wrapper in `src/services/tauri.ts`.
5. Update `src/types.ts` and `src-tauri/src/types.rs` together when the contract changes.

Validate:

```bash
npm run typecheck
cd src-tauri && cargo check
```

## App/Daemon Parity

Read:

- `docs/architecture-spine.md`
- `src/services/tauri.ts`
- `src-tauri/src/lib.rs`
- `src-tauri/src/shared/*`
- `src-tauri/src/bin/codex_monitor_daemon/rpc.rs`
- `src-tauri/src/bin/codex_monitor_daemon/rpc/*`

Change route:

1. Put domain behavior in `src-tauri/src/shared/*`.
2. Keep local app adapter thin.
3. Add or update daemon RPC handler using shared request/response types where available.
4. Preserve JSON-RPC method names unless intentionally changing a contract.
5. Confirm frontend wrapper behavior is identical in local and remote modes.

Validate:

```bash
npm run typecheck
cd src-tauri && cargo check
```

## Thread And Event Behavior

Read:

- `docs/app-server-events.md`
- `src/services/events.ts`
- `src/utils/appServerEvents.ts`
- `src/features/app/hooks/useAppServerEvents.ts`
- `src/features/threads/hooks/useThreadsReducer.ts`
- `src/features/threads/hooks/threadReducer/*`

Change route:

1. Update event parsing/guards in `src/utils/appServerEvents.ts` before reducer logic.
2. Route backend events through `src/services/events.ts`.
3. Update thread event hooks and reducer slices.
4. Preserve thread hierarchy invariants from `AGENTS.md`.

Validate:

```bash
npm run typecheck
npm run test -- src/utils/appServerEvents.test.ts src/features/app/hooks/useAppServerEvents.test.tsx
```

## Workspace And Worktree

Read:

- `src/features/workspaces/**`
- `src/features/app/hooks/useWorkspaceController.ts`
- `src-tauri/src/workspaces/*`
- `src-tauri/src/shared/workspaces_core.rs`
- `src-tauri/src/shared/workspaces_core/*`
- `src-tauri/src/shared/worktree_core.rs`
- `src-tauri/src/shared/workspace_rpc.rs`

Change route:

1. Put persistence, path, and lifecycle behavior in shared workspace/worktree core.
2. Keep app commands and daemon RPC methods as adapters.
3. Update frontend workspace hooks and UI after backend contracts are stable.
4. Preserve app-data worktree location and legacy `.codex-worktrees` support unless intentionally migrating it.

Validate:

```bash
npm run typecheck
cd src-tauri && cargo check
```

## Settings And Codex Config

Read:

- `docs/multi-agent-sync-runbook.md` for agents/multi-agent settings
- `src/features/settings/components/SettingsView.tsx`
- `src/features/settings/hooks/*`
- `src/services/tauri.ts`
- `src/types.ts`
- `src-tauri/src/types.rs`
- `src-tauri/src/storage.rs`
- `src-tauri/src/shared/settings_core.rs`
- `src-tauri/src/shared/agents_config_core.rs`

Change route:

1. Update shared Rust settings/config logic first.
2. Update Rust and TypeScript types together.
3. Update the frontend settings hook and UI section.
4. For agents config behavior, compare upstream Codex using `docs/multi-agent-sync-runbook.md`.

Validate:

```bash
npm run typecheck
npm run test -- src/features/settings/components/SettingsView.test.tsx src/features/settings/hooks/useAppSettings.test.ts
cd src-tauri && cargo check
```

## Git And GitHub

Read:

- `src/features/git/**`
- `src/services/tauri.ts`
- `src-tauri/src/git/mod.rs`
- `src-tauri/src/shared/git_core.rs`
- `src-tauri/src/shared/git_ui_core.rs`
- `src-tauri/src/shared/git_ui_core/*`
- `src-tauri/src/shared/git_rpc.rs`
- `src-tauri/src/bin/codex_monitor_daemon/rpc/git.rs`

Change route:

1. Prefer shared request/response structs in `git_rpc.rs`.
2. Implement command behavior in `git_ui_core` or `git_core`.
3. Keep app adapter and daemon RPC in parity.
4. Update frontend hooks/components after the IPC contract is stable.

Validate:

```bash
npm run typecheck
npm run test -- src/features/git
cd src-tauri && cargo check
```

## Prompts And Files

Read:

- `src/features/prompts/**`
- `src/features/files/**`
- `src/services/tauri.ts`
- `src-tauri/src/prompts.rs`
- `src-tauri/src/files/*`
- `src-tauri/src/shared/prompts_core.rs`
- `src-tauri/src/shared/files_core.rs`
- `src-tauri/src/bin/codex_monitor_daemon/rpc/prompts.rs`
- `src-tauri/src/bin/codex_monitor_daemon/rpc/workspace.rs`

Change route:

1. Keep file policy and path handling in backend/shared code.
2. Keep prompt parsing and persistence in shared prompt core.
3. Update daemon RPC if remote mode must support the behavior.

Validate:

```bash
npm run typecheck
cd src-tauri && cargo check
```

## Docs-Only Changes

Read:

- `AGENTS.md`
- The specific document being changed

Validate:

```bash
git diff --check
```
