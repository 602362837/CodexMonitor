# CodexMonitor

[![gitcgr](https://gitcgr.com/badge/Dimillian/CodexMonitor.svg)](https://gitcgr.com/Dimillian/CodexMonitor)

![CodexMonitor](screenshot.png)

CodexMonitor 是一个 Tauri 应用，用于在本地工作区中编排多个 Codex agent。它提供用于管理项目的侧边栏、用于快速操作的首页，以及基于 Codex app-server 协议的对话视图。

## 功能

### 工作区与线程

- 添加并持久化工作区，对工作区进行分组/排序，并从首页仪表盘快速进入最近的 agent 活动。
- 为每个工作区启动一个 `codex app-server`，恢复线程，并跟踪未读/运行中状态。
- 使用 worktree 和 clone agent 进行隔离工作；worktree 位于应用数据目录下（兼容旧版 `.codex-worktrees`）。
- 线程管理：置顶/重命名/归档/复制、按线程保存草稿，以及停止/中断进行中的 turn。
- 可选远程后端（daemon）模式，用于在另一台机器上运行 Codex。
- 用于自托管连接的远程设置辅助功能（TCP 模式下的 Tailscale 检测/主机引导）。

### Composer 与 Agent 控制

- 支持带图片附件的输入（选择器、拖放、粘贴），并可配置运行中后续消息行为（`Queue` vs `Steer`）。
- 使用 `Shift+Cmd+Enter`（macOS）或 `Shift+Ctrl+Enter`（Windows/Linux）为单条消息发送相反的后续操作。
- 支持技能（`$`）、prompt（`/prompts:`）、review（`/review`）和文件路径（`@`）自动补全。
- 模型选择器、协作模式（启用时）、推理强度、访问模式，以及上下文用量环。
- 支持按住说话快捷键和实时波形的听写（Whisper）。
- 渲染 reasoning/tool/diff 项，并处理审批提示。

### Git 与 GitHub

- Diff 统计、已暂存/未暂存文件 diff、revert/stage 控制，以及提交日志。
- 分支列表，支持 checkout/create，并显示 upstream ahead/behind 计数。
- 通过 `gh` 集成 GitHub Issues 和 Pull Requests（列表、diff、评论），并在浏览器中打开 commit/PR。
- PR composer："Ask PR" 可将 PR 上下文发送到新的 agent 线程。

### 文件与 Prompt

- 文件树支持搜索、文件类型图标，以及在 Finder/Explorer 中显示。
- 全局/工作区 prompt 库：创建/编辑/删除/移动，并可在当前线程或新线程中运行。

### UI 与体验

- 可调整大小的侧边栏/右侧/计划/终端/调试面板，并持久化尺寸。
- 响应式布局（桌面/平板/手机），带标签式导航。
- 侧边栏显示账户速率限制的 usage 和 credits meter，首页也显示 usage 快照。
- 带多个标签页的终端 dock，用于后台命令（实验性）。
- 应用内更新，支持 toast 驱动的下载/安装、调试面板复制/清空、声音通知，以及平台特定窗口效果（macOS overlay title bar + vibrancy）和降低透明度开关。

## 环境要求

- Node.js + npm
- Rust toolchain（stable）
- CMake（原生依赖需要；听写/Whisper 会使用）
- LLVM/Clang（Windows 上通过 bindgen 构建听写依赖需要）
- 已安装 Codex CLI，并可在 `PATH` 中以 `codex` 调用（或在应用/工作区设置中配置自定义 Codex 二进制文件）
- Git CLI（用于 worktree 操作）
- GitHub CLI（`gh`），用于 GitHub Issues/PR 集成（可选）

如果遇到原生构建错误，请运行：

```bash
npm run doctor
```

## 快速开始

安装依赖：

```bash
npm install
```

以开发模式运行：

```bash
npm run tauri:dev
```

## iOS 支持（WIP）

iOS 支持目前仍在进行中。

- 当前状态：移动端布局可以运行，远程后端流程已接入，且 iOS 默认使用远程后端模式。
- 当前限制：终端和听写在移动端构建中仍不可用。
- 桌面端行为不变：macOS/Linux/Windows 仍默认本地优先，除非明确选择远程模式。

### iOS + Tailscale 设置（TCP）

当你需要通过 Tailscale tailnet 将 iOS 应用连接到桌面托管的 daemon 时使用此流程。
规范 runbook：`docs/mobile-ios-tailscale-blueprint.md`。

1. 在桌面和 iPhone 上安装并登录 Tailscale（同一 tailnet）。
2. 在桌面端 CodexMonitor 中打开 `Settings > Server`。
3. 设置 `Remote backend token`。
4. 使用 `Start daemon`（位于 `Mobile access daemon`）启动桌面 daemon。
5. 在 `Tailscale helper` 中使用 `Detect Tailscale`，并记下建议的 host（例如 `your-mac.your-tailnet.ts.net:4732`）。
6. 在 iOS CodexMonitor 中打开 `Settings > Server`。
7. 输入桌面端 Tailscale host 和相同的 token。
8. 点击 `Connect & test` 并确认成功。

注意：

- iOS 连接期间，桌面 daemon 必须保持运行。
- 如果测试失败，请确认两台设备都在线于 Tailscale，且 host/token 与桌面端设置一致。

### 无界面 Daemon 管理（无桌面 UI）

如果希望在不保持桌面应用打开的情况下使用 iOS 远程模式，请使用独立 daemon 控制 CLI。

构建二进制文件：

```bash
cd src-tauri
cargo build --bin codex_monitor_daemon --bin codex_monitor_daemonctl
```

示例：

```bash
# 显示当前 daemon 状态
./target/debug/codex_monitor_daemonctl status

# 使用 settings.json 中的 host/token 启动 daemon
./target/debug/codex_monitor_daemonctl start

# 停止 daemon
./target/debug/codex_monitor_daemonctl stop

# 打印等价的 daemon 启动命令
./target/debug/codex_monitor_daemonctl command-preview
```

常用覆盖项：

- `--data-dir <path>`：包含 `settings.json` / `workspaces.json` 的应用数据目录
- `--listen <addr>`：绑定地址覆盖
- `--token <token>`：token 覆盖
- `--daemon-path <path>`：显式指定 `codex-monitor-daemon` 二进制路径
- `--json`：机器可读输出

### iOS 前置条件

- 已安装 Xcode + Command Line Tools。
- 已安装 Rust iOS targets：

```bash
rustup target add aarch64-apple-ios aarch64-apple-ios-sim
# 可选（Intel Mac 模拟器构建）：
rustup target add x86_64-apple-ios
```

- 已配置 Apple signing（development team）。
  - 在 `src-tauri/tauri.ios.local.conf.json` 中设置 `bundle.iOS.developmentTeam` 和 `identifier`（推荐用于本机设置），或
  - 在 `src-tauri/tauri.ios.conf.json` 中设置这些值，或
  - 向设备脚本传入 `--team <TEAM_ID>`。
  - 存在 `src-tauri/tauri.ios.local.conf.json` 时，`build_run_ios*.sh` 和 `release_testflight_ios.sh` 会自动合并它。

### 在 iOS 模拟器上运行

```bash
./scripts/build_run_ios.sh
```

选项：

- `--simulator "<name>"`：指定目标模拟器。
- `--target aarch64-sim|x86_64-sim`：覆盖架构。
- `--skip-build`：复用当前 app bundle。
- `--no-clean`：在构建之间保留 `src-tauri/gen/apple/build`。

### 在 USB 设备上运行

列出可发现设备：

```bash
./scripts/build_run_ios_device.sh --list-devices
```

在指定设备上构建、安装并启动：

```bash
./scripts/build_run_ios_device.sh --device "<device name or identifier>" --team <TEAM_ID>
```

其他选项：

- `--target aarch64`：覆盖架构。
- `--skip-build`：复用当前 app bundle。
- `--bundle-id <id>`：启动非默认 bundle identifier。

首次设备设置通常需要：

1. iPhone 已解锁并信任这台 Mac。
2. iPhone 已启用 Developer Mode。
3. 至少在 Xcode 中完成一次配对/signing 审批。

如果 signing 尚未准备好，可以从脚本流程打开 Xcode：

```bash
./scripts/build_run_ios_device.sh --open-xcode
```

### iOS TestFlight 发布（脚本化）

使用端到端脚本完成 archive、上传、配置合规信息、分配 beta group，并提交 beta review。

```bash
./scripts/release_testflight_ios.sh
```

脚本会自动从 `.testflight.local.env`（gitignored）加载发布元数据。
新环境请复制 `.testflight.local.env.example` 到 `.testflight.local.env` 并填写值。

## 发布构建

构建生产 Tauri bundle：

```bash
npm run tauri:build
```

产物将位于 `src-tauri/target/release/bundle/`（按平台分子目录）。

### Windows（可选）

Windows 构建为可选项，并使用单独的 Tauri 配置文件，以避免 macOS 专属窗口效果。

```bash
npm run tauri:build:win
```

产物将位于：

- `src-tauri/target/release/bundle/nsis/`（installer exe）
- `src-tauri/target/release/bundle/msi/`（msi）
 
注意：在 Windows 上从源码构建时，除了 CMake，还需要 LLVM/Clang（用于 `bindgen` / `libclang`）。

## 类型检查

运行 TypeScript checker（no emit）：

```bash
npm run typecheck
```

注意：`npm run build` 在打包前端前也会运行 `tsc`。

## 验证

推荐验证命令：

```bash
npm run lint
npm run test
npm run typecheck
cd src-tauri && cargo check
```

## 代码库导航

按任务查找文件（"if you need X, edit Y"）请使用：

- `docs/codebase-map.md`

## 项目结构

```
src/
  features/         feature-sliced UI + hooks
  features/app/bootstrap/      app bootstrap orchestration
  features/app/orchestration/  app layout/thread/workspace orchestration
  features/threads/hooks/threadReducer/  thread reducer slices
  services/         Tauri IPC wrapper
  styles/           split CSS by area
  types.ts          shared types
src-tauri/
  src/lib.rs        Tauri app backend command registry
  src/bin/codex_monitor_daemon.rs  remote daemon JSON-RPC process
  src/bin/codex_monitor_daemon/rpc/  daemon RPC domain handlers
  src/shared/       shared backend core used by app + daemon
  src/shared/git_ui_core/      git/github shared core modules
  src/shared/workspaces_core/  workspace/worktree shared core modules
  src/workspaces/   workspace/worktree adapters
  src/codex/        codex app-server adapters
  src/files/        file adapters
  tauri.conf.json   window configuration
```

## 备注

- 工作区会持久化到应用数据目录下的 `workspaces.json`。
- 应用设置会持久化到应用数据目录下的 `settings.json`（theme、backend mode/provider、remote endpoints/tokens、Codex path、default access mode、UI scale、follow-up message behavior）。
- Feature settings 可在 UI 中配置，并会在加载/保存时同步到 `$CODEX_HOME/config.toml`（或 `~/.codex/config.toml`）。稳定功能：Collaboration modes（`features.collaboration_modes`）、personality（`personality`）和 Background terminal（`features.unified_exec`）。实验功能：Apps（`features.apps`）。Steering 能力仍跟随 Codex `features.steer`，但后续消息默认行为由 Settings → Composer 控制。
- 应用启动和窗口获得焦点时，会为每个工作区重新连接并刷新线程列表。
- 线程通过使用工作区 `cwd` 过滤 `thread/list` 结果来恢复。
- 选择线程时始终调用 `thread/resume`，以从磁盘刷新消息。
- 如果 CLI session 的 `cwd` 与工作区路径匹配，它会显示出来；除非被恢复，否则不会实时流式传输。
- 应用通过 stdio 使用 `codex app-server`；见 `src-tauri/src/lib.rs` 和 `src-tauri/src/codex/`。
- 远程 daemon 入口点是 `src-tauri/src/bin/codex_monitor_daemon.rs`；RPC 路由位于 `src-tauri/src/bin/codex_monitor_daemon/rpc.rs`，领域处理器位于 `src-tauri/src/bin/codex_monitor_daemon/rpc/`。
- 共享领域逻辑位于 `src-tauri/src/shared/`（尤其是 `src-tauri/src/shared/git_ui_core/` 和 `src-tauri/src/shared/workspaces_core/`）。
- Codex home 按以下顺序解析：工作区设置（如果设置）、旧版 `.codexmonitor/`、然后 `$CODEX_HOME`/`~/.codex`。
- Worktree agent 位于应用数据目录下（`worktrees/<workspace-id>`）；旧版 `.codex-worktrees/` 路径仍受支持，且应用不再编辑仓库 `.gitignore` 文件。
- UI 状态（面板尺寸、降低透明度开关、最近线程活动）存储在 `localStorage`。
- 自定义 prompt 从 `$CODEX_HOME/prompts`（或 `~/.codex/prompts`）加载，并支持可选的 frontmatter description/argument hints。

## Tauri IPC Surface

前端调用位于 `src/services/tauri.ts`，并映射到 `src-tauri/src/lib.rs` 中的命令。当前 surface 包括：

- Settings/config/files：`get_app_settings`, `update_app_settings`, `get_codex_config_path`, `get_config_model`, `file_read`, `file_write`, `codex_doctor`, `menu_set_accelerators`。
- Workspaces/worktrees：`list_workspaces`, `is_workspace_path_dir`, `add_workspace`, `add_clone`, `add_worktree`, `worktree_setup_status`, `worktree_setup_mark_ran`, `rename_worktree`, `rename_worktree_upstream`, `apply_worktree_changes`, `update_workspace_settings`, `remove_workspace`, `remove_worktree`, `connect_workspace`, `list_workspace_files`, `read_workspace_file`, `open_workspace_in`, `get_open_app_icon`。
- Threads/turns/reviews：`start_thread`, `fork_thread`, `compact_thread`, `list_threads`, `resume_thread`, `archive_thread`, `set_thread_name`, `send_user_message`, `turn_interrupt`, `respond_to_server_request`, `start_review`, `remember_approval_rule`, `get_commit_message_prompt`, `generate_commit_message`, `generate_run_metadata`。
- Account/models/collaboration：`model_list`, `account_rate_limits`, `account_read`, `skills_list`, `apps_list`, `collaboration_mode_list`, `codex_login`, `codex_login_cancel`, `list_mcp_server_status`。
- Git/GitHub：`get_git_status`, `list_git_roots`, `get_git_diffs`, `get_git_log`, `get_git_commit_diff`, `get_git_remote`, `stage_git_file`, `stage_git_all`, `unstage_git_file`, `revert_git_file`, `revert_git_all`, `commit_git`, `push_git`, `pull_git`, `fetch_git`, `sync_git`, `list_git_branches`, `checkout_git_branch`, `create_git_branch`, `get_github_issues`, `get_github_pull_requests`, `get_github_pull_request_diff`, `get_github_pull_request_comments`。
- Prompts：`prompts_list`, `prompts_create`, `prompts_update`, `prompts_delete`, `prompts_move`, `prompts_workspace_dir`, `prompts_global_dir`。
- Terminal/dictation/notifications/usage：`terminal_open`, `terminal_write`, `terminal_resize`, `terminal_close`, `dictation_model_status`, `dictation_download_model`, `dictation_cancel_download`, `dictation_remove_model`, `dictation_request_permission`, `dictation_start`, `dictation_stop`, `dictation_cancel`, `send_notification_fallback`, `is_macos_debug_build`, `local_usage_snapshot`。
- Remote backend helpers：`tailscale_status`, `tailscale_daemon_command_preview`, `tailscale_daemon_start`, `tailscale_daemon_stop`, `tailscale_daemon_status`。
