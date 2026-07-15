#[cfg(test)]
mod tests {
    use super::super::*;

    fn settings_db() -> rusqlite::Connection {
        let db = rusqlite::Connection::open_in_memory().unwrap();
        db.execute_batch(
            "CREATE TABLE settings (\
            key TEXT PRIMARY KEY, \
            value TEXT NOT NULL\
        );",
        )
        .unwrap();
        db
    }

    #[test]
    fn read_returns_empty_when_setting_is_missing() {
        // Given
        let db = settings_db();

        // When
        let value = read(&db, "missing.key").unwrap();

        // Then
        assert_eq!(value, "");
    }

    #[test]
    fn write_updates_an_existing_setting() {
        // Given
        let db = settings_db();
        write(&db, "pinned.key", "before").unwrap();

        // When
        write(&db, "pinned.key", "after").unwrap();

        // Then
        assert_eq!(read(&db, "pinned.key").unwrap(), "after");
    }

    #[test]
    fn ui_preferences_default_to_current_ui_behavior_when_missing() {
        // Given
        let db = settings_db();

        // When
        let preferences = load_ui_preferences(&db).unwrap();

        // Then
        assert_eq!(
            serde_json::to_value(preferences).unwrap(),
            serde_json::json!({"memoView": "list", "activeTab": "projects"})
        );
    }

    #[test]
    fn ui_preferences_load_supported_stored_values() {
        // Given
        let db = settings_db();
        write(&db, K_MEMO_VIEW, "journal").unwrap();
        write(&db, K_ACTIVE_TAB, "memos").unwrap();

        // When
        let preferences = load_ui_preferences(&db).unwrap();

        // Then
        assert_eq!(
            preferences,
            UiPreferences {
                memo_view: MemoView::Journal,
                active_tab: ActiveTab::Memos,
            }
        );
    }

    #[test]
    fn ui_preferences_reject_a_corrupted_stored_value() {
        // Given
        let db = settings_db();
        write(&db, K_MEMO_VIEW, "grid").unwrap();

        // When
        let error = load_ui_preferences(&db).unwrap_err();

        // Then
        assert_eq!(
            serde_json::to_value(error).unwrap(),
            serde_json::json!({
                "kind": "invalidStoredValue",
                "key": "ui.memo_view",
                "value": "grid"
            })
        );
    }

    #[test]
    fn ui_preferences_reject_an_empty_stored_value() {
        // Given
        let db = settings_db();
        write(&db, K_ACTIVE_TAB, "").unwrap();

        // When
        let error = load_ui_preferences(&db).unwrap_err();

        // Then
        assert_eq!(
            error,
            UiPreferencesError::InvalidStoredValue {
                key: K_ACTIVE_TAB,
                value: String::new(),
            }
        );
    }

    #[test]
    fn saving_memo_view_preserves_and_persists_active_tab() {
        // Given
        let db = settings_db();
        write(&db, K_MEMO_VIEW, "matrix").unwrap();
        write(&db, K_ACTIVE_TAB, "calendar").unwrap();
        let input = SaveUiPreferencesInput {
            memo_view: Some(MemoView::Journal),
            active_tab: None,
        };

        // When
        persist_ui_preferences(&db, input).unwrap();

        // Then
        assert_eq!(
            load_ui_preferences(&db).unwrap(),
            UiPreferences {
                memo_view: MemoView::Journal,
                active_tab: ActiveTab::Calendar,
            }
        );
    }

    #[test]
    fn saving_active_tab_preserves_and_persists_memo_view() {
        // Given
        let db = settings_db();
        write(&db, K_MEMO_VIEW, "focus").unwrap();
        write(&db, K_ACTIVE_TAB, "projects").unwrap();
        let input = SaveUiPreferencesInput {
            memo_view: None,
            active_tab: Some(ActiveTab::Memos),
        };

        // When
        persist_ui_preferences(&db, input).unwrap();

        // Then
        assert_eq!(
            load_ui_preferences(&db).unwrap(),
            UiPreferences {
                memo_view: MemoView::Focus,
                active_tab: ActiveTab::Memos,
            }
        );
    }

    #[test]
    fn save_input_rejects_malformed_fields_before_persistence() {
        // Given
        let db = settings_db();
        write(&db, K_MEMO_VIEW, "matrix").unwrap();
        write(&db, K_ACTIVE_TAB, "calendar").unwrap();
        let malformed_inputs = [
            serde_json::json!({"memoView": "grid"}),
            serde_json::json!({"activeTab": null}),
            serde_json::json!({"arbitrarySetting": "value"}),
        ];

        // When
        let results = malformed_inputs.map(serde_json::from_value::<SaveUiPreferencesInput>);

        // Then
        assert!(results.into_iter().all(|result| result.is_err()));
        assert_eq!(
            load_ui_preferences(&db).unwrap(),
            UiPreferences {
                memo_view: MemoView::Matrix,
                active_tab: ActiveTab::Calendar,
            }
        );
    }

    #[test]
    fn locale_settings_default_to_system_english_without_repairing_storage() {
        let db = settings_db();
        write(&db, K_LOCALE_PREFERENCE, "broken").unwrap();
        write(&db, K_LOCALE_EFFECTIVE, "broken").unwrap();

        assert_eq!(
            load_locale_settings(&db).unwrap(),
            LocaleSettings {
                preference: LocalePreference::System,
                effective: AppLocale::En,
            }
        );
        assert_eq!(read(&db, K_LOCALE_PREFERENCE).unwrap(), "broken");
        assert_eq!(read(&db, K_LOCALE_EFFECTIVE).unwrap(), "broken");
    }

    #[test]
    fn locale_settings_persist_preference_and_effective_together() {
        let mut db = settings_db();
        let expected = LocaleSettings {
            preference: LocalePreference::System,
            effective: AppLocale::Ko,
        };

        assert_eq!(
            persist_locale_settings(&mut db, expected).unwrap(),
            expected
        );
        assert_eq!(read(&db, K_LOCALE_PREFERENCE).unwrap(), "system");
        assert_eq!(read(&db, K_LOCALE_EFFECTIVE).unwrap(), "ko");
    }

    #[test]
    fn explicit_locale_must_match_effective_locale() {
        let mut db = settings_db();
        let error = persist_locale_settings(
            &mut db,
            LocaleSettings {
                preference: LocalePreference::Ko,
                effective: AppLocale::En,
            },
        )
        .unwrap_err();

        assert!(error.contains("must match"));
        assert_eq!(read(&db, K_LOCALE_PREFERENCE).unwrap(), "");
        assert_eq!(read(&db, K_LOCALE_EFFECTIVE).unwrap(), "");
    }

    #[test]
    fn redact_hides_the_key_but_reports_presence() {
        let with_key = AiSettingsFull {
            openai_api_key: Some("sk-abc".into()),
        };
        let view = with_key.redact();
        assert!(view.has_openai_key);
    }

    #[test]
    fn redact_reports_absence_when_key_is_none_or_empty() {
        let none = AiSettingsFull {
            openai_api_key: None,
        };
        assert!(!none.redact().has_openai_key);

        let empty = AiSettingsFull {
            openai_api_key: Some(String::new()),
        };
        assert!(!empty.redact().has_openai_key);
    }
}
