import { createContext, useContext, useEffect, useState } from "react";

export type ColorTheme = "default" | "ocean" | "forest" | "sunset" | "rose" | "midnight";
export type Theme = "light" | "dark";
export type BgTheme = "default" | "pure" | "soft" | "neutral" | "deep" | "warm" | "cool";

export interface ThemeConfig {
  id: ColorTheme;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface BgConfig {
  id: BgTheme;
  name: string;
  colors: {
    light: string;
    dark: string;
  };
}

export const themeConfigs: ThemeConfig[] = [
  { id: "default", name: "Purple", colors: { primary: "243 75% 59%", secondary: "270 60% 55%", accent: "173 80% 40%" } },
  { id: "ocean", name: "Ocean", colors: { primary: "200 80% 50%", secondary: "220 70% 55%", accent: "180 70% 45%" } },
  { id: "forest", name: "Forest", colors: { primary: "145 65% 42%", secondary: "160 55% 50%", accent: "80 60% 45%" } },
  { id: "sunset", name: "Sunset", colors: { primary: "25 95% 55%", secondary: "350 80% 55%", accent: "45 90% 50%" } },
  { id: "rose", name: "Rose", colors: { primary: "340 75% 55%", secondary: "320 65% 50%", accent: "280 60% 55%" } },
  { id: "midnight", name: "Midnight", colors: { primary: "260 70% 60%", secondary: "280 60% 55%", accent: "200 75% 50%" } },
];

export const bgConfigs: BgConfig[] = [
  { id: "default", name: "Modern", colors: { light: "220 20% 98%", dark: "222 47% 6%" } },
  { id: "pure", name: "Pure", colors: { light: "0 0% 100%", dark: "0 0% 0%" } },
  { id: "soft", name: "Soft", colors: { light: "210 20% 96%", dark: "222 47% 10%" } },
  { id: "neutral", name: "Neutral", colors: { light: "0 0% 95%", dark: "222 20% 12%" } },
  { id: "deep", name: "Deep", colors: { light: "222 20% 92%", dark: "222 47% 4%" } },
  { id: "warm", name: "Warm", colors: { light: "30 30% 96%", dark: "30 20% 10%" } },
  { id: "cool", name: "Cool", colors: { light: "200 30% 96%", dark: "210 30% 8%" } },
];

interface ThemeContextType {
  theme: Theme;
  colorTheme: ColorTheme;
  bgTheme: BgTheme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
  setBgTheme: (bgTheme: BgTheme) => void;
  themeConfigs: ThemeConfig[];
  bgConfigs: BgConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme") as Theme;
      if (saved) return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("colorTheme") as ColorTheme;
      if (saved && themeConfigs.find(t => t.id === saved)) return saved;
    }
    return "default";
  });

  const [bgTheme, setBgThemeState] = useState<BgTheme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bgTheme") as BgTheme;
      if (saved && bgConfigs.find(b => b.id === saved)) return saved;
    }
    return "default";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);

    // Re-apply background when theme switches
    const bgConfig = bgConfigs.find(b => b.id === bgTheme) || bgConfigs[0];
    root.style.setProperty("--background", theme === "light" ? bgConfig.colors.light : bgConfig.colors.dark);
  }, [theme, bgTheme]);

  useEffect(() => {
    const config = themeConfigs.find(t => t.id === colorTheme) || themeConfigs[0];
    const root = document.documentElement;

    // Apply color theme
    root.style.setProperty("--primary", config.colors.primary);
    root.style.setProperty("--secondary", config.colors.secondary);
    root.style.setProperty("--accent", config.colors.accent);

    // Update ring color to match primary
    root.style.setProperty("--ring", config.colors.primary);

    // Update gradient colors
    root.style.setProperty("--gradient-hero", `linear-gradient(135deg, hsl(${config.colors.primary}), hsl(${config.colors.secondary}))`);
    root.style.setProperty("--gradient-card", `linear-gradient(145deg, hsl(${config.colors.primary} / 0.02), hsl(${config.colors.secondary} / 0.02))`);

    localStorage.setItem("colorTheme", colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    localStorage.setItem("bgTheme", bgTheme);
  }, [bgTheme]);

  const toggleTheme = () => {
    setThemeState(prev => prev === "light" ? "dark" : "light");
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setColorTheme = (newColorTheme: ColorTheme) => {
    setColorThemeState(newColorTheme);
  };

  const setBgTheme = (newBgTheme: BgTheme) => {
    setBgThemeState(newBgTheme);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      colorTheme,
      bgTheme,
      toggleTheme,
      setTheme,
      setColorTheme,
      setBgTheme,
      themeConfigs,
      bgConfigs
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
