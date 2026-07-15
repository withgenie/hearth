import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { listen } from "@tauri-apps/api/event";
import { getLocaleSettings, setLocaleSettings } from "../api";
import {
  LOCALE_CACHE_KEY,
  LOCALE_EVENT,
  browserLanguages,
  initialLocaleSettings,
  resolveLocale,
  type LocalePreference,
  type LocaleSettings,
} from "./locale";

interface LocaleContextValue extends LocaleSettings {
  pending: boolean;
  error: string | null;
  setPreference: (preference: LocalePreference) => Promise<void>;
}

const fallback: LocaleContextValue = {
  preference: "system",
  effective: "ko",
  pending: false,
  error: null,
  setPreference: async () => {},
};

const LocaleContext = createContext<LocaleContextValue>(fallback);

function publish(settings: LocaleSettings) {
  document.documentElement.lang = settings.effective;
  localStorage.setItem(LOCALE_CACHE_KEY, JSON.stringify(settings));
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<LocaleSettings>(initialLocaleSettings);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commit = useCallback(async (preference: LocalePreference) => {
    const effective = resolveLocale(preference, browserLanguages());
    setPending(true);
    setError(null);
    try {
      const saved = await setLocaleSettings({ preference, effective });
      setSettings(saved);
      publish(saved);
    } catch (cause) {
      setError(String(cause));
      throw cause;
    } finally {
      setPending(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    let unlisten: (() => void) | undefined;

    void getLocaleSettings()
      .then(async (stored) => {
        if (!alive) return;
        const effective = resolveLocale(stored.preference, browserLanguages());
        if (effective !== stored.effective) {
          await commit(stored.preference);
          return;
        }
        setSettings(stored);
        publish(stored);
      })
      .catch((cause) => {
        if (alive) setError(String(cause));
      });

    void listen<LocaleSettings>(LOCALE_EVENT, (event) => {
      if (!alive) return;
      setSettings(event.payload);
      publish(event.payload);
    }).then((off) => {
      if (alive) unlisten = off;
      else off();
    });

    return () => {
      alive = false;
      unlisten?.();
    };
  }, [commit]);

  useEffect(() => {
    if (settings.preference !== "system") return;
    const onLanguageChange = () => {
      const next = resolveLocale("system", browserLanguages());
      if (next !== settings.effective) void commit("system").catch(() => {});
    };
    window.addEventListener("languagechange", onLanguageChange);
    return () => window.removeEventListener("languagechange", onLanguageChange);
  }, [commit, settings.effective, settings.preference]);

  useEffect(() => {
    document.documentElement.lang = settings.effective;
  }, [settings.effective]);

  const value = useMemo<LocaleContextValue>(
    () => ({ ...settings, pending, error, setPreference: commit }),
    [commit, error, pending, settings],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
