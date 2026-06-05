"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Language = "en" | "ar";
type Theme = "light" | "dark";

type AppContextValue = {
  theme: Theme;
  language: Language;
  /** False until client preferences are read from localStorage (avoids hydration mismatch). */
  ready: boolean;
  toggleTheme: () => void;
  toggleLanguage: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [language, setLanguage] = useState<Language>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    if (storedTheme === "light" || storedTheme === "dark") setTheme(storedTheme);

    const storedLang = localStorage.getItem("language") as Language | null;
    if (storedLang === "en" || storedLang === "ar") setLanguage(storedLang);

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme, ready]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    localStorage.setItem("language", language);
  }, [language, ready]);

  const value = useMemo(
    () => ({
      theme,
      language,
      ready,
      toggleTheme: () => setTheme((prev) => (prev === "dark" ? "light" : "dark")),
      toggleLanguage: () => setLanguage((prev) => (prev === "en" ? "ar" : "en")),
    }),
    [theme, language, ready],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppPreferences() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppPreferences must be used within ThemeProvider");
  return context;
}
