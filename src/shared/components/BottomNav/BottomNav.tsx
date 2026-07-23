import type { Icon } from "@phosphor-icons/react";
import s from "./BottomNav.module.css";

export interface BottomNavTab {
  key: string;
  icon: Icon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  badge?: string;
  showDot?: boolean;
  dotTitle?: string;
  onSelect: () => void;
}

interface BottomNavProps {
  tabs: BottomNavTab[];
  constrained?: boolean;
  hideOnDesktop?: boolean;
}

export const BottomNav = ({ tabs, constrained = false, hideOnDesktop = false }: BottomNavProps) => (
  <nav
    className={`${s["bar"]}${constrained ? ` ${s["constrained"]}` : ""}${
      hideOnDesktop ? ` ${s["mobileOnly"]}` : ""
    }`}
  >
    {tabs.map(({ key, icon: TabIcon, label, active, disabled, badge, showDot, dotTitle, onSelect }) => (
      <button
        key={key}
        className={`${s["tab"]}${active ? ` ${s["active"]}` : ""}`}
        disabled={disabled}
        onClick={onSelect}
      >
        <span className={s["icon"]}>
          <TabIcon size={22} weight={active ? "fill" : "regular"} />
          {badge && <span className={s["badge"]}>{badge}</span>}
          {showDot && !badge && <span className={s["dot"]} title={dotTitle} />}
        </span>
        <span className={s["pill"]} aria-hidden="true" />
        <span className={s["label"]}>{label}</span>
      </button>
    ))}
  </nav>
);
