use std::collections::HashMap;
use std::env;
use std::ffi::OsString;
use std::path::{Path, PathBuf};

pub(crate) fn normalize_git_path(path: &str) -> String {
    path.replace('\\', "/")
}

pub(crate) fn normalize_windows_namespace_path(path: &str) -> String {
    if path.is_empty() {
        return String::new();
    }

    fn strip_prefix_ascii_case<'a>(value: &'a str, prefix: &str) -> Option<&'a str> {
        value
            .get(..prefix.len())
            .filter(|candidate| candidate.eq_ignore_ascii_case(prefix))
            .map(|_| &value[prefix.len()..])
    }

    fn starts_with_drive_path(value: &str) -> bool {
        let bytes = value.as_bytes();
        bytes.len() >= 3
            && bytes[0].is_ascii_alphabetic()
            && bytes[1] == b':'
            && (bytes[2] == b'\\' || bytes[2] == b'/')
    }

    if let Some(rest) = strip_prefix_ascii_case(path, r"\\?\UNC\") {
        return format!(r"\\{rest}");
    }
    if let Some(rest) = strip_prefix_ascii_case(path, "//?/UNC/") {
        return format!("//{rest}");
    }
    if let Some(rest) =
        strip_prefix_ascii_case(path, r"\\?\").filter(|rest| starts_with_drive_path(rest))
    {
        return rest.to_string();
    }
    if let Some(rest) =
        strip_prefix_ascii_case(path, "//?/").filter(|rest| starts_with_drive_path(rest))
    {
        return rest.to_string();
    }
    if let Some(rest) =
        strip_prefix_ascii_case(path, r"\\.\").filter(|rest| starts_with_drive_path(rest))
    {
        return rest.to_string();
    }
    if let Some(rest) =
        strip_prefix_ascii_case(path, "//./").filter(|rest| starts_with_drive_path(rest))
    {
        return rest.to_string();
    }

    path.to_string()
}

fn find_in_path(binary: &str) -> Option<PathBuf> {
    let path_var = env::var_os("PATH")?;
    for dir in env::split_paths(&path_var) {
        let candidate = dir.join(binary);
        if candidate.is_file() {
            return Some(candidate);
        }
    }
    None
}

pub(crate) fn resolve_git_binary() -> Result<PathBuf, String> {
    if let Some(path) = find_in_path("git") {
        return Ok(path);
    }
    if cfg!(windows) {
        if let Some(path) = find_in_path("git.exe") {
            return Ok(path);
        }
    }

    let candidates: &[&str] = if cfg!(windows) {
        &[
            "C:\\Program Files\\Git\\bin\\git.exe",
            "C:\\Program Files (x86)\\Git\\bin\\git.exe",
        ]
    } else {
        &[
            "/opt/homebrew/bin/git",
            "/usr/local/bin/git",
            "/usr/bin/git",
            "/opt/local/bin/git",
            "/run/current-system/sw/bin/git",
        ]
    };

    for candidate in candidates {
        let path = PathBuf::from(candidate);
        if path.exists() {
            return Ok(path);
        }
    }

    Err(format!(
        "Git not found. Install Git or ensure it is on PATH. Tried: {}",
        candidates.join(", ")
    ))
}

pub(crate) fn git_env_path() -> String {
    let mut paths: Vec<PathBuf> = env::var_os("PATH")
        .map(|value| env::split_paths(&value).collect())
        .unwrap_or_default();

    let defaults: &[&str] = if cfg!(windows) {
        &["C:\\Windows\\System32"]
    } else {
        &[
            "/usr/bin",
            "/bin",
            "/usr/local/bin",
            "/opt/homebrew/bin",
            "/opt/local/bin",
            "/run/current-system/sw/bin",
        ]
    };

    for candidate in defaults {
        let path = PathBuf::from(candidate);
        if !paths.contains(&path) {
            paths.push(path);
        }
    }

    let joined = env::join_paths(paths).unwrap_or_else(|_| OsString::new());
    joined.to_string_lossy().to_string()
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct SystemProxy {
    host: String,
    port: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
struct SystemProxyConfig {
    http: Option<SystemProxy>,
    https: Option<SystemProxy>,
    socks: Option<SystemProxy>,
}

fn proxy_url(scheme: &str, proxy: &SystemProxy) -> String {
    format!("{scheme}://{}:{}", proxy.host, proxy.port)
}

fn parse_bool_flag(value: Option<&str>) -> bool {
    matches!(value.map(str::trim), Some("1"))
}

fn parse_system_proxy_config(output: &str) -> SystemProxyConfig {
    let mut values = HashMap::new();
    for line in output.lines() {
        let Some((key, value)) = line.split_once(':') else {
            continue;
        };
        values.insert(key.trim().to_string(), value.trim().to_string());
    }

    let proxy = |enable_key: &str, host_key: &str, port_key: &str| -> Option<SystemProxy> {
        if !parse_bool_flag(values.get(enable_key).map(String::as_str)) {
            return None;
        }
        let host = values.get(host_key)?.trim();
        let port = values.get(port_key)?.trim();
        if host.is_empty() || port.is_empty() {
            return None;
        }
        Some(SystemProxy {
            host: host.to_string(),
            port: port.to_string(),
        })
    };

    SystemProxyConfig {
        http: proxy("HTTPEnable", "HTTPProxy", "HTTPPort"),
        https: proxy("HTTPSEnable", "HTTPSProxy", "HTTPSPort"),
        socks: proxy("SOCKSEnable", "SOCKSProxy", "SOCKSPort"),
    }
}

#[cfg(target_os = "macos")]
fn system_proxy_config() -> Option<SystemProxyConfig> {
    let output = std::process::Command::new("/usr/sbin/scutil")
        .arg("--proxy")
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    Some(parse_system_proxy_config(&stdout))
}

#[cfg(not(target_os = "macos"))]
fn system_proxy_config() -> Option<SystemProxyConfig> {
    None
}

fn has_env_var(name: &str) -> bool {
    env::var_os(name).is_some()
}

fn value_mentions_github(value: &str) -> bool {
    let lower = value.to_ascii_lowercase();
    lower.contains("github.com")
}

fn resolve_gitdir(repo_path: &Path) -> PathBuf {
    let dot_git = repo_path.join(".git");
    if dot_git.is_dir() {
        return dot_git;
    }

    let Ok(contents) = std::fs::read_to_string(&dot_git) else {
        return dot_git;
    };
    let Some(gitdir) = contents
        .trim()
        .strip_prefix("gitdir:")
        .map(str::trim)
        .filter(|value| !value.is_empty())
    else {
        return dot_git;
    };

    let gitdir_path = PathBuf::from(gitdir);
    if gitdir_path.is_absolute() {
        gitdir_path
    } else {
        repo_path.join(gitdir_path)
    }
}

fn git_config_mentions_github(repo_path: &Path) -> bool {
    let gitdir = resolve_gitdir(repo_path);
    let config_mentions_github = |path: PathBuf| {
        std::fs::read_to_string(path)
            .map(|config| value_mentions_github(&config))
            .unwrap_or(false)
    };

    if config_mentions_github(gitdir.join("config")) {
        return true;
    }

    let Ok(common_dir) = std::fs::read_to_string(gitdir.join("commondir")) else {
        return false;
    };
    let common_dir = common_dir.trim();
    if common_dir.is_empty() {
        return false;
    }
    let common_dir_path = PathBuf::from(common_dir);
    let common_dir_path = if common_dir_path.is_absolute() {
        common_dir_path
    } else {
        gitdir.join(common_dir_path)
    };
    config_mentions_github(common_dir_path.join("config"))
}

pub(crate) fn git_should_use_system_proxy(repo_path: Option<&Path>, args: &[&str]) -> bool {
    args.iter().any(|arg| value_mentions_github(arg))
        || repo_path.is_some_and(git_config_mentions_github)
}

pub(crate) fn apply_git_system_proxy_env(command: &mut tokio::process::Command) {
    let Some(config) = system_proxy_config() else {
        return;
    };

    if !has_env_var("HTTP_PROXY") && !has_env_var("http_proxy") {
        if let Some(proxy) = config.http.as_ref() {
            command.env("HTTP_PROXY", proxy_url("http", proxy));
        }
    }
    if !has_env_var("HTTPS_PROXY") && !has_env_var("https_proxy") {
        if let Some(proxy) = config.https.as_ref().or(config.http.as_ref()) {
            command.env("HTTPS_PROXY", proxy_url("http", proxy));
        }
    }
    if !has_env_var("ALL_PROXY") && !has_env_var("all_proxy") {
        if let Some(proxy) = config.socks.as_ref() {
            command.env("ALL_PROXY", proxy_url("socks5h", proxy));
        }
    }
    if has_env_var("GIT_SSH_COMMAND") {
        return;
    }

    let ssh_proxy_command = if let Some(proxy) = config.socks.as_ref() {
        Some(format!("nc -X 5 -x {}:{} %h %p", proxy.host, proxy.port))
    } else {
        config
            .https
            .as_ref()
            .or(config.http.as_ref())
            .map(|proxy| format!("nc -X connect -x {}:{} %h %p", proxy.host, proxy.port))
    };

    if let Some(proxy_command) = ssh_proxy_command {
        command.env(
            "GIT_SSH_COMMAND",
            format!("ssh -o 'ProxyCommand={proxy_command}'"),
        );
    }
}

#[cfg(test)]
mod tests {
    use super::{
        git_should_use_system_proxy, normalize_git_path, normalize_windows_namespace_path,
        parse_system_proxy_config,
    };

    #[test]
    fn normalize_git_path_replaces_backslashes() {
        assert_eq!(normalize_git_path("foo\\bar\\baz"), "foo/bar/baz");
    }

    #[test]
    fn normalize_windows_namespace_path_strips_drive_prefix() {
        assert_eq!(
            normalize_windows_namespace_path(r"\\?\I:\gpt-projects\json-composer"),
            r"I:\gpt-projects\json-composer"
        );
        assert_eq!(
            normalize_windows_namespace_path("//?/I:/gpt-projects/json-composer"),
            "I:/gpt-projects/json-composer"
        );
    }

    #[test]
    fn normalize_windows_namespace_path_strips_unc_prefix() {
        assert_eq!(
            normalize_windows_namespace_path(r"\\?\UNC\SERVER\Share\Repo"),
            r"\\SERVER\Share\Repo"
        );
        assert_eq!(
            normalize_windows_namespace_path("//?/UNC/SERVER/Share/Repo"),
            "//SERVER/Share/Repo"
        );
        assert_eq!(
            normalize_windows_namespace_path(r"\\?\unc\SERVER\Share\Repo"),
            r"\\SERVER\Share\Repo"
        );
        assert_eq!(
            normalize_windows_namespace_path("//?/unc/SERVER/Share/Repo"),
            "//SERVER/Share/Repo"
        );
    }

    #[test]
    fn normalize_windows_namespace_path_preserves_whitespace_for_plain_paths() {
        assert_eq!(
            normalize_windows_namespace_path("  /tmp/workspace  "),
            "  /tmp/workspace  "
        );
    }

    #[test]
    fn normalize_windows_namespace_path_preserves_other_namespace_forms() {
        assert_eq!(
            normalize_windows_namespace_path(
                r"\\?\Volume{01234567-89ab-cdef-0123-456789abcdef}\repo"
            ),
            r"\\?\Volume{01234567-89ab-cdef-0123-456789abcdef}\repo"
        );
        assert_eq!(
            normalize_windows_namespace_path(r"\\.\pipe\codex-monitor"),
            r"\\.\pipe\codex-monitor"
        );
    }

    #[test]
    fn parse_system_proxy_config_reads_enabled_macos_proxies() {
        let config = parse_system_proxy_config(
            r#"<dictionary> {
  HTTPEnable : 1
  HTTPPort : 7897
  HTTPProxy : 127.0.0.1
  HTTPSEnable : 1
  HTTPSPort : 7897
  HTTPSProxy : 127.0.0.1
  SOCKSEnable : 1
  SOCKSPort : 7897
  SOCKSProxy : 127.0.0.1
}"#,
        );

        assert_eq!(
            config.http.as_ref().map(|proxy| proxy.port.as_str()),
            Some("7897")
        );
        assert_eq!(
            config.https.as_ref().map(|proxy| proxy.host.as_str()),
            Some("127.0.0.1")
        );
        assert_eq!(
            config.socks.as_ref().map(|proxy| proxy.port.as_str()),
            Some("7897")
        );
    }

    #[test]
    fn parse_system_proxy_config_ignores_disabled_proxies() {
        let config = parse_system_proxy_config(
            r#"<dictionary> {
  HTTPEnable : 0
  HTTPPort : 7897
  HTTPProxy : 127.0.0.1
  SOCKSEnable : 0
  SOCKSPort : 7897
  SOCKSProxy : 127.0.0.1
}"#,
        );

        assert!(config.http.is_none());
        assert!(config.socks.is_none());
    }

    #[test]
    fn git_should_use_system_proxy_when_args_reference_github() {
        assert!(git_should_use_system_proxy(
            None,
            &["clone", "git@github.com:owner/repo.git"]
        ));
        assert!(git_should_use_system_proxy(
            None,
            &["ls-remote", "https://github.com/owner/repo.git"]
        ));
        assert!(!git_should_use_system_proxy(
            None,
            &["clone", "git@gitlab.example.com:owner/repo.git"]
        ));
    }

    #[test]
    fn git_should_use_system_proxy_when_repo_config_references_github() {
        let root =
            std::env::temp_dir().join(format!("codex-monitor-proxy-test-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(root.join(".git")).expect("create git dir");
        std::fs::write(
            root.join(".git").join("config"),
            "[remote \"origin\"]\nurl = git@github.com:owner/repo.git\n",
        )
        .expect("write git config");

        assert!(git_should_use_system_proxy(Some(&root), &["fetch"]));

        std::fs::remove_dir_all(root).expect("cleanup git config test");
    }

    #[test]
    fn git_should_use_system_proxy_when_worktree_common_config_references_github() {
        let root = std::env::temp_dir().join(format!(
            "codex-monitor-worktree-proxy-test-{}",
            std::process::id()
        ));
        let worktree = root.join("worktree");
        let gitdir = root
            .join("main")
            .join(".git")
            .join("worktrees")
            .join("worktree");
        let common = root.join("main").join(".git");
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(&worktree).expect("create worktree");
        std::fs::create_dir_all(&gitdir).expect("create gitdir");
        std::fs::create_dir_all(&common).expect("create common gitdir");
        std::fs::write(
            worktree.join(".git"),
            format!("gitdir: {}\n", gitdir.display()),
        )
        .expect("write gitdir file");
        std::fs::write(gitdir.join("commondir"), "../..\n").expect("write commondir");
        std::fs::write(
            common.join("config"),
            "[remote \"origin\"]\nurl = https://github.com/owner/repo.git\n",
        )
        .expect("write common config");

        assert!(git_should_use_system_proxy(Some(&worktree), &["push"]));

        std::fs::remove_dir_all(root).expect("cleanup worktree git config test");
    }
}
