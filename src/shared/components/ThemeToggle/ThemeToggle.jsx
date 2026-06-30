import { Moon, Sun } from "@phosphor-icons/react";
import { useThemeStore } from "@shared/store/useThemeStore.js";

const ThemeToggle = ({ size = 20, className = "theme-toggle" }) => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      className={className}
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Включить тёмную тему" : "Включить светлую тему"}
      title={theme === "light" ? "Тёмная тема" : "Светлая тема"}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--border)", background: "var(--bg-card)", cursor: "pointer", transition: "all 0.2s ease" }}
    >
      {theme === "light" ? (
        <Moon size={size} weight="fill" color="var(--text-3)" />
      ) : (
        <Sun size={size} weight="bold" color="var(--amber)" />
      )}
    </button>
  );
};

export default ThemeToggle;
