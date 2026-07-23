import type { ReactNode } from "react";
import { ForkKnifeIcon } from "@phosphor-icons/react";
import s from "./RestaurantHeroShell.module.css";

interface RestaurantHeroShellProps {
  name: string;
  photoUrl?: string | null | undefined;
  viewTransitionName?: string | undefined;
  children?: ReactNode;
  topRight?: ReactNode;
}

export const RestaurantHeroShell = ({
  name,
  photoUrl,
  viewTransitionName,
  children,
  topRight,
}: RestaurantHeroShellProps) => (
  <div className={s["hero"]}>
    {photoUrl ? (
      <img
        className={s["img"]}
        src={photoUrl}
        alt={name}
        style={viewTransitionName ? { viewTransitionName } : undefined}
      />
    ) : (
      <div className={s["placeholder"]}>
        <ForkKnifeIcon size={48} color="var(--on-photo-mute)" />
      </div>
    )}
    <div className={s["overlay"]} />
    <div className={s["info"]}>
      <h1 className={s["name"]}>{name}</h1>
      {children}
    </div>
    {topRight}
  </div>
);
