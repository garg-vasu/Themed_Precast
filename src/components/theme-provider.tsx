import { createContext, useContext, useState, useEffect } from "react";

type Theme = "dark" | "light" | "system";

type AccentColor = "blue" | "green" | "purple" | "red" | "orange" | "yellow";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultAccentColor?: AccentColor;
  storageKey?: string;
  accentStorageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  accentColor: AccentColor;
  setTheme: (theme: Theme) => void;
  setAccentColor: (accentColor: AccentColor) => void;
};

const initialState: ThemeProviderState = {
  theme: "light",
  accentColor: "blue",
  setTheme: () => null,
  setAccentColor: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultAccentColor = "blue",
  storageKey = "theme-precast",
  accentStorageKey = "accent-color-precast",
}: ThemeProviderProps) {
  // theme
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  const [accentColor, setAccentColor] = useState<AccentColor>(
    () =>
      (localStorage.getItem(accentStorageKey) as AccentColor) ||
      defaultAccentColor
  );

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all theme classes
    root.classList.remove("light", "dark");
    
    // Remove all accent color classes
    root.classList.remove(
      "accent-blue",
      "accent-green",
      "accent-purple",
      "accent-red",
      "accent-orange",
      "accent-yellow"
    );
    
    // Apply accent color (including blue for consistency)
    root.classList.add(`accent-${accentColor}`);
    
    // Apply theme
    const applyTheme = () => {
      root.classList.remove("light", "dark");
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    };
    
    applyTheme();
    
    // Listen for system theme changes when theme is "system"
    let mediaQuery: MediaQueryList | null = null;
    let cleanup: (() => void) | null = null;
    
    if (theme === "system") {
      mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        applyTheme();
      };
      
      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleChange);
        cleanup = () => mediaQuery?.removeEventListener("change", handleChange);
      }
      // Fallback for older browsers
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
        cleanup = () => mediaQuery?.removeListener(handleChange);
      }
    }
    
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [theme, accentColor]);

  const value = {
    theme,
    accentColor,
    setTheme: (theme: Theme) => {
      setTheme(theme);
      localStorage.setItem(storageKey, theme);
    },
    setAccentColor: (accentColor: AccentColor) => {
      setAccentColor(accentColor);
      localStorage.setItem(accentStorageKey, accentColor);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
