import type { KeyboardEvent } from "react";

export const activateOnKey =
  (action: () => void) =>
  (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  };
