import { useLanguageStore, SUPPORTED_LANGUAGES } from "@shared/store/useLanguageStore";
import { useTranslation } from "@shared/i18n/useTranslation";

export const LanguageSwitcher = () => {
  const { t } = useTranslation();
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

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
        {t("profile.language.label")}
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
        {SUPPORTED_LANGUAGES.map((value) => (
          <button
            key={value}
            onClick={() => { setLanguage(value); }}
            style={{
              padding: "5px 10px",
              borderRadius: "calc(var(--r-sm) - 2px)",
              fontSize: "var(--text-sm)",
              fontWeight: 700,
              color: language === value ? "var(--text-1)" : "var(--text-3)",
              background: language === value ? "var(--bg-card)" : "transparent",
              border: "none",
              cursor: "pointer",
              transition: "all var(--dur-sm) var(--ease-out)",
              whiteSpace: "nowrap",
              boxShadow: language === value ? "var(--shadow-sm)" : "none",
            }}
          >
            {t(`profile.language.${value}`)}
          </button>
        ))}
      </div>
    </div>
  );
};
