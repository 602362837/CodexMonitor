use std::path::PathBuf;

use reqwest::header::HeaderValue;
use tokio::sync::Mutex;

use crate::codex::config as codex_config;
use crate::storage::write_settings;
use crate::types::AppSettings;
use crate::utils::normalize_windows_namespace_path;

const CURRENT_APP_SERVER_CLIENT_NAME: &str = "codex_monitor";
const CURRENT_APP_SERVER_CLIENT_TITLE: &str = "Codex Monitor";

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct ResolvedAppServerClientInfo {
    pub(crate) name: String,
    pub(crate) title: Option<String>,
    pub(crate) version: String,
}

fn normalize_personality(value: &str) -> Option<&'static str> {
    match value.trim() {
        "friendly" => Some("friendly"),
        "pragmatic" => Some("pragmatic"),
        _ => None,
    }
}

pub(crate) async fn get_app_settings_core(app_settings: &Mutex<AppSettings>) -> AppSettings {
    let mut settings = app_settings.lock().await.clone();
    if let Ok(Some(collaboration_modes_enabled)) = codex_config::read_collaboration_modes_enabled()
    {
        settings.collaboration_modes_enabled = collaboration_modes_enabled;
    }
    if let Ok(Some(steer_enabled)) = codex_config::read_steer_enabled() {
        settings.steer_enabled = steer_enabled;
    }
    if let Ok(Some(unified_exec_enabled)) = codex_config::read_unified_exec_enabled() {
        settings.unified_exec_enabled = unified_exec_enabled;
    }
    if let Ok(Some(apps_enabled)) = codex_config::read_apps_enabled() {
        settings.experimental_apps_enabled = apps_enabled;
    }
    if let Ok(personality) = codex_config::read_personality() {
        settings.personality = personality
            .as_deref()
            .and_then(normalize_personality)
            .unwrap_or("friendly")
            .to_string();
    }
    settings
}

pub(crate) fn resolve_app_server_client_info(
    settings: &AppSettings,
    client_version: &str,
) -> ResolvedAppServerClientInfo {
    let name = settings
        .app_server_client_name
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or(CURRENT_APP_SERVER_CLIENT_NAME)
        .to_string();
    let title = settings
        .app_server_client_title
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
        .or_else(|| Some(CURRENT_APP_SERVER_CLIENT_TITLE.to_string()));
    let version = settings
        .app_server_client_version
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or(client_version)
        .to_string();

    ResolvedAppServerClientInfo {
        name,
        title,
        version,
    }
}

fn validate_app_server_client_settings(settings: &AppSettings) -> Result<(), String> {
    let Some(name) = settings
        .app_server_client_name
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
    else {
        return Ok(());
    };

    HeaderValue::from_str(name)
        .map(|_| ())
        .map_err(|_| "App-server client name 必须是合法的 HTTP header 值。".to_string())
}

pub(crate) async fn update_app_settings_core(
    mut settings: AppSettings,
    app_settings: &Mutex<AppSettings>,
    settings_path: &PathBuf,
) -> Result<AppSettings, String> {
    validate_app_server_client_settings(&settings)?;
    settings.global_worktrees_folder = settings
        .global_worktrees_folder
        .map(|path| normalize_windows_namespace_path(&path));
    let _ = codex_config::write_collaboration_modes_enabled(settings.collaboration_modes_enabled);
    let _ = codex_config::write_steer_enabled(settings.steer_enabled);
    let _ = codex_config::write_unified_exec_enabled(settings.unified_exec_enabled);
    let _ = codex_config::write_apps_enabled(settings.experimental_apps_enabled);
    let _ = codex_config::write_personality(settings.personality.as_str());
    write_settings(settings_path, &settings)?;
    let mut current = app_settings.lock().await;
    *current = settings.clone();
    Ok(settings)
}

pub(crate) fn get_codex_config_path_core() -> Result<String, String> {
    codex_config::config_toml_path()
        .ok_or_else(|| "Unable to resolve CODEX_HOME".to_string())
        .and_then(|path| {
            path.to_str()
                .map(|value| value.to_string())
                .ok_or_else(|| "Unable to resolve CODEX_HOME".to_string())
        })
}

#[cfg(test)]
mod tests {
    use super::{resolve_app_server_client_info, update_app_settings_core};
    use crate::types::AppSettings;
    use tokio::sync::Mutex;

    #[test]
    fn resolve_app_server_client_info_uses_configured_values() {
        let settings = AppSettings {
            app_server_client_name: Some("codex_cli_rs".to_string()),
            app_server_client_title: Some("codex_cli_rs".to_string()),
            app_server_client_version: Some("0.140.0".to_string()),
            ..AppSettings::default()
        };

        let resolved = resolve_app_server_client_info(&settings, "1.2.3");
        assert_eq!(resolved.name, "codex_cli_rs");
        assert_eq!(resolved.title.as_deref(), Some("codex_cli_rs"));
        assert_eq!(resolved.version, "0.140.0");
    }

    #[test]
    fn resolve_app_server_client_info_falls_back_to_current_values_for_empty_fields() {
        let settings = AppSettings {
            app_server_client_name: Some("  ".to_string()),
            app_server_client_title: Some("".to_string()),
            app_server_client_version: None,
            ..AppSettings::default()
        };

        let resolved = resolve_app_server_client_info(&settings, "1.2.3");
        assert_eq!(resolved.name, "codex_monitor");
        assert_eq!(resolved.title.as_deref(), Some("Codex Monitor"));
        assert_eq!(resolved.version, "1.2.3");
    }

    #[test]
    fn update_app_settings_rejects_invalid_client_name() {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            let settings = AppSettings {
                app_server_client_name: Some("bad\r\nvalue".to_string()),
                ..AppSettings::default()
            };
            let app_settings = Mutex::new(AppSettings::default());
            let settings_path = std::env::temp_dir().join("codex-monitor-invalid-client-name.json");

            let result = update_app_settings_core(settings, &app_settings, &settings_path).await;
            assert!(result.is_err());
            let _ = std::fs::remove_file(&settings_path);
        });
    }
}
