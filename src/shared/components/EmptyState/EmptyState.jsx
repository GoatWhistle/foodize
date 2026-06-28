import { CookingPot } from "@phosphor-icons/react";

const EmptyState = ({ title = "Здесь пусто", subtitle, action, icon }) => {
  return (
    <div className="empty-state page-enter">
      {icon !== false && (
        <div className="empty-icon" aria-hidden="true">
          {icon ?? <CookingPot size={32} weight="bold" />}
        </div>
      )}
      <p className="empty-title">{title}</p>
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

export default EmptyState;
