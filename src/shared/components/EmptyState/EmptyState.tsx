import type { ReactNode } from "react";
import { CookingPotIcon } from "@phosphor-icons/react";
import { useTranslation } from "@shared/i18n/useTranslation";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  action?: EmptyStateAction;
  icon?: ReactNode | false;
}

export const EmptyState = ({
  title,
  subtitle,
  action,
  icon,
}: EmptyStateProps) => {
  const { t } = useTranslation();
  return (
    <div className="empty-state page-enter">
      {icon !== false && (
        <div className="empty-icon" aria-hidden="true">
          {icon ?? <CookingPotIcon size={32} weight="bold" />}
        </div>
      )}
      <p className="empty-title">{title ?? t("common.states.empty")}</p>
      {subtitle && <p className="empty-subtitle">{subtitle}</p>}
      {action && (
        <button
          className="btn btn-primary"
          style={{ marginTop: 8 }}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
