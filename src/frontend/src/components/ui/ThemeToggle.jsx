import { useThemeStore } from "../../store/useThemeStore";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();
  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={
        theme === "light" ? "Включить тёмную тему" : "Включить светлую тему"
      }
      title={theme === "light" ? "Тёмная тема" : "Светлая тема"}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
};

export default ThemeToggle;
