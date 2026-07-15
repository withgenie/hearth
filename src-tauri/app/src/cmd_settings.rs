// Settings store for AI configuration.
//
// AI is OpenAI-only as of 0.3.0. The local MLX backend was removed because
// it hard-coded a path that only worked on the original developer's machine.
//
// The OpenAI key is stored plaintext in the same SQLite DB as the rest of the
// user's data. We do not use Keychain: this is a single-user desktop tool and
// the DB already lives in the user's private app data dir. If that threat
// model tightens later, swap to `tauri-plugin-keyring`.
//
// The key is *never* returned to the frontend — `get_ai_settings` returns a
// `has_openai_key` boolean instead. Saving with `openai_api_key: Some("")`
// clears it; `None` leaves it untouched.
//
// Model selection is intentionally NOT exposed here: OpenAI uses the
// `OPENAI_MODEL` constant in `cmd_ai`. Keeping a single source of truth
// avoids the "wrong ID → 404 / HF 401" failure mode a UI picker used to create.

use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

/// Keys used in the `settings` KV table. Centralized so any rename happens in
/// one place and we don't typo the string at a read site.
const K_OPENAI_KEY: &str = "ai.openai_api_key";
const K_UI_SCALE: &str = "ui.scale";
const K_MEMO_VIEW: &str = "ui.memo_view";
const K_ACTIVE_TAB: &str = "ui.active_tab";
const K_LOCALE_PREFERENCE: &str = "ui.locale.preference";
const K_LOCALE_EFFECTIVE: &str = "ui.locale.effective";
pub(crate) const K_BACKUP_DIR: &str = "backup.dir";
pub(crate) const K_THEME: &str = "ui.theme";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum LocalePreference {
    System,
    Ko,
    En,
}

impl LocalePreference {
    const fn as_str(self) -> &'static str {
        match self {
            Self::System => "system",
            Self::Ko => "ko",
            Self::En => "en",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum AppLocale {
    Ko,
    En,
}

impl AppLocale {
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::Ko => "ko",
            Self::En => "en",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LocaleSettings {
    pub preference: LocalePreference,
    pub effective: AppLocale,
}

pub(crate) fn load_locale_settings(db: &rusqlite::Connection) -> Result<LocaleSettings, String> {
    let preference = match read(db, K_LOCALE_PREFERENCE)?.as_str() {
        "ko" => LocalePreference::Ko,
        "en" => LocalePreference::En,
        _ => LocalePreference::System,
    };
    let stored_effective = match read(db, K_LOCALE_EFFECTIVE)?.as_str() {
        "ko" => AppLocale::Ko,
        _ => AppLocale::En,
    };
    let effective = match preference {
        LocalePreference::Ko => AppLocale::Ko,
        LocalePreference::En => AppLocale::En,
        LocalePreference::System => stored_effective,
    };
    Ok(LocaleSettings {
        preference,
        effective,
    })
}

pub(crate) fn load_app_locale(state: &State<'_, AppState>) -> Result<AppLocale, String> {
    let db = state.db.lock().map_err(|error| error.to_string())?;
    Ok(load_locale_settings(&db)?.effective)
}

pub(crate) fn persist_locale_settings(
    db: &mut rusqlite::Connection,
    input: LocaleSettings,
) -> Result<LocaleSettings, String> {
    if (matches!(input.preference, LocalePreference::Ko) && input.effective != AppLocale::Ko)
        || (matches!(input.preference, LocalePreference::En) && input.effective != AppLocale::En)
    {
        return Err("explicit locale preference must match effective locale".into());
    }

    let tx = db.transaction().map_err(|error| error.to_string())?;
    write(&tx, K_LOCALE_PREFERENCE, input.preference.as_str())?;
    write(&tx, K_LOCALE_EFFECTIVE, input.effective.as_str())?;
    tx.commit().map_err(|error| error.to_string())?;
    Ok(input)
}

#[tauri::command]
pub fn get_locale_settings(state: State<'_, AppState>) -> Result<LocaleSettings, String> {
    let db = state.db.lock().map_err(|error| error.to_string())?;
    load_locale_settings(&db)
}

#[tauri::command]
pub fn set_locale_settings(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    input: LocaleSettings,
) -> Result<LocaleSettings, String> {
    let saved = {
        let mut db = state.db.lock().map_err(|error| error.to_string())?;
        persist_locale_settings(&mut db, input)?
    };
    if let Err(error) = crate::cmd_notify::reschedule_all_future(&app) {
        eprintln!("notification locale reschedule failed: {error}");
    }
    let _ = tauri::Emitter::emit(&app, "locale:changed", saved);
    Ok(saved)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum MemoView {
    List,
    Matrix,
    Focus,
    Journal,
}

impl MemoView {
    const fn as_str(self) -> &'static str {
        match self {
            Self::List => "list",
            Self::Matrix => "matrix",
            Self::Focus => "focus",
            Self::Journal => "journal",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ActiveTab {
    Projects,
    Calendar,
    Memos,
}

impl ActiveTab {
    const fn as_str(self) -> &'static str {
        match self {
            Self::Projects => "projects",
            Self::Calendar => "calendar",
            Self::Memos => "memos",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UiPreferences {
    pub memo_view: MemoView,
    pub active_tab: ActiveTab,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum UiPreferencesError {
    Database { message: String },
    InvalidStoredValue { key: &'static str, value: String },
}

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SaveUiPreferencesInput {
    #[serde(default, deserialize_with = "deserialize_present")]
    pub memo_view: Option<MemoView>,
    #[serde(default, deserialize_with = "deserialize_present")]
    pub active_tab: Option<ActiveTab>,
}

fn deserialize_present<'de, D, T>(deserializer: D) -> Result<Option<T>, D::Error>
where
    D: serde::Deserializer<'de>,
    T: Deserialize<'de>,
{
    T::deserialize(deserializer).map(Some)
}

fn read_optional(
    db: &rusqlite::Connection,
    key: &'static str,
) -> Result<Option<String>, UiPreferencesError> {
    db.query_row("SELECT value FROM settings WHERE key = ?1", [key], |row| {
        row.get::<_, String>(0)
    })
    .map(Some)
    .or_else(|error| match error {
        rusqlite::Error::QueryReturnedNoRows => Ok(None),
        other => Err(UiPreferencesError::Database {
            message: other.to_string(),
        }),
    })
}

pub(crate) fn load_ui_preferences(
    db: &rusqlite::Connection,
) -> Result<UiPreferences, UiPreferencesError> {
    let memo_view_raw = read_optional(db, K_MEMO_VIEW)?;
    let memo_view = match memo_view_raw.as_deref() {
        None | Some("list") => MemoView::List,
        Some("matrix") => MemoView::Matrix,
        Some("focus") => MemoView::Focus,
        Some("journal") => MemoView::Journal,
        Some(value) => {
            return Err(UiPreferencesError::InvalidStoredValue {
                key: K_MEMO_VIEW,
                value: value.to_owned(),
            })
        }
    };

    let active_tab_raw = read_optional(db, K_ACTIVE_TAB)?;
    let active_tab = match active_tab_raw.as_deref() {
        None | Some("projects") => ActiveTab::Projects,
        Some("calendar") => ActiveTab::Calendar,
        Some("memos") => ActiveTab::Memos,
        Some(value) => {
            return Err(UiPreferencesError::InvalidStoredValue {
                key: K_ACTIVE_TAB,
                value: value.to_owned(),
            })
        }
    };

    Ok(UiPreferences {
        memo_view,
        active_tab,
    })
}

pub(crate) fn persist_ui_preferences(
    db: &rusqlite::Connection,
    input: SaveUiPreferencesInput,
) -> Result<UiPreferences, UiPreferencesError> {
    let current = load_ui_preferences(db)?;
    let memo_view = match input.memo_view {
        Some(value) => {
            write(db, K_MEMO_VIEW, value.as_str())
                .map_err(|message| UiPreferencesError::Database { message })?;
            value
        }
        None => current.memo_view,
    };
    let active_tab = match input.active_tab {
        Some(value) => {
            write(db, K_ACTIVE_TAB, value.as_str())
                .map_err(|message| UiPreferencesError::Database { message })?;
            value
        }
        None => current.active_tab,
    };

    Ok(UiPreferences {
        memo_view,
        active_tab,
    })
}

/// Shape safe to expose over IPC — the raw API key never crosses this
/// boundary. The UI only needs to know whether one is on file.
#[derive(Debug, Clone, Serialize)]
pub struct AiSettingsView {
    pub has_openai_key: bool,
}

/// Internal-only view that includes the decrypted key, consumed by `cmd_ai`
/// when it needs to authorize an OpenAI request.
#[derive(Debug, Clone)]
pub struct AiSettingsFull {
    pub openai_api_key: Option<String>,
}

impl AiSettingsFull {
    /// Convert to the IPC-safe view, stripping the secret.
    pub fn redact(&self) -> AiSettingsView {
        AiSettingsView {
            has_openai_key: self
                .openai_api_key
                .as_deref()
                .map(|s| !s.is_empty())
                .unwrap_or(false),
        }
    }
}

/// Read a single KV entry, returning an owned string (possibly empty).
pub(crate) fn read(db: &rusqlite::Connection, key: &str) -> Result<String, String> {
    db.query_row("SELECT value FROM settings WHERE key = ?1", [key], |row| {
        row.get::<_, String>(0)
    })
    .or_else(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => Ok(String::new()),
        other => Err(other.to_string()),
    })
}

/// Upsert a KV entry.
pub(crate) fn write(db: &rusqlite::Connection, key: &str, value: &str) -> Result<(), String> {
    db.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2) \
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Read the full settings (including the API key) for backend use. Consumers
/// outside this module should only use this to make privileged API calls —
/// never hand the key back to the frontend.
pub fn load_full(state: &State<'_, AppState>) -> Result<AiSettingsFull, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let key_raw = read(&db, K_OPENAI_KEY)?;
    let openai_api_key = if key_raw.is_empty() {
        None
    } else {
        Some(key_raw)
    };
    Ok(AiSettingsFull { openai_api_key })
}

#[tauri::command]
pub fn get_ai_settings(state: State<'_, AppState>) -> Result<AiSettingsView, String> {
    Ok(load_full(&state)?.redact())
}

#[derive(Debug, Deserialize)]
pub struct SaveAiSettingsInput {
    /// - `Some("")` → clear the stored key
    /// - `Some("sk-...")` → overwrite
    /// - `None` → keep whatever is already stored
    #[serde(default)]
    pub openai_api_key: Option<String>,
}

#[tauri::command]
pub fn save_ai_settings(
    state: State<'_, AppState>,
    input: SaveAiSettingsInput,
) -> Result<AiSettingsView, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    if let Some(key) = input.openai_api_key {
        // Trim incidental whitespace — copy-paste commonly carries a newline.
        write(&db, K_OPENAI_KEY, key.trim())?;
    }

    // Re-read to build the canonical view.
    drop(db);
    Ok(load_full(&state)?.redact())
}

#[tauri::command]
pub fn get_ui_preferences(state: State<'_, AppState>) -> Result<UiPreferences, UiPreferencesError> {
    let db = state
        .db
        .lock()
        .map_err(|error| UiPreferencesError::Database {
            message: error.to_string(),
        })?;
    load_ui_preferences(&db)
}

#[tauri::command]
pub fn save_ui_preferences(
    state: State<'_, AppState>,
    input: SaveUiPreferencesInput,
) -> Result<UiPreferences, UiPreferencesError> {
    let db = state
        .db
        .lock()
        .map_err(|error| UiPreferencesError::Database {
            message: error.to_string(),
        })?;
    persist_ui_preferences(&db, input)
}

#[tauri::command]
pub fn get_ui_scale(state: State<'_, AppState>) -> Result<f64, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let raw = read(&db, K_UI_SCALE)?;
    if raw.is_empty() {
        return Ok(1.0);
    }
    raw.parse::<f64>()
        .map_err(|e| format!("invalid ui.scale value: {e}"))
}

#[tauri::command]
pub fn set_ui_scale(state: State<'_, AppState>, scale: f64) -> Result<(), String> {
    if !scale.is_finite() || scale <= 0.0 {
        return Err(format!("invalid scale: {scale}"));
    }
    let db = state.db.lock().map_err(|e| e.to_string())?;
    write(&db, K_UI_SCALE, &scale.to_string())
}

/// Theme is stored as an opaque JSON blob because its shape is a tagged union
/// — either `{"kind":"preset","id":"midnight"}` or
/// `{"kind":"custom","baseMode":"dark","brandHex":"#ff8000"}`. We don't parse
/// it on the Rust side; the frontend owns the schema and we just round-trip
/// the string. Empty → frontend falls back to DEFAULT_THEME.
#[tauri::command]
pub fn get_theme(state: State<'_, AppState>) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    read(&db, K_THEME)
}

#[tauri::command]
pub fn set_theme(state: State<'_, AppState>, theme: String) -> Result<(), String> {
    // Minimal validation: must be valid JSON so we don't persist garbage.
    serde_json::from_str::<serde_json::Value>(&theme)
        .map_err(|e| format!("invalid theme json: {e}"))?;
    let db = state.db.lock().map_err(|e| e.to_string())?;
    write(&db, K_THEME, &theme)
}

#[cfg(test)]
#[path = "cmd_settings_ui_tests.rs"]
mod ui_tests;
