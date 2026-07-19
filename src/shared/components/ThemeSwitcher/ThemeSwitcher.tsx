import { useThemeStore } from "@shared/store/useThemeStore";
import type { ThemePreference } from "@shared/store/useThemeStore";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Светлая" },
  { value: "system", label: "Системная" },
  { value: "dark", label: "Тёмная" },
];

export const ThemeSwitcher = () => {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 0",
      }}
    >
      <span
        style={{
          fontSize: "var(--text-base)",
          fontWeight: 600,
          color: "var(--text-1)",
        }}
      >
        Тема
      </span>
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-sm)",
          padding: 3,
        }}
      >
        {OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setTheme(value); }}
            style={{
              padding: "5px 10px",
              borderRadius: "calc(var(--r-sm) - 2px)",
              fontSize: "var(--text-sm)",
              fontWeight: 700,
              color: theme === value ? "var(--text-1)" : "var(--text-3)",
              background: theme === value ? "var(--bg-card)" : "transparent",
              border: "none",
              cursor: "pointer",
              transition: "all var(--dur-sm) var(--ease-out)",
              whiteSpace: "nowrap",
              boxShadow: theme === value ? "var(--shadow-sm)" : "none",
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
