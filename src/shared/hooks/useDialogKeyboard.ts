import { useEffect } from "react";

export interface UseDialogKeyboardOptions {
  active: boolean;
  onEscape: () => void;
}

export function useDialogKeyboard({
  active,
  onEscape,
}: UseDialogKeyboardOptions): void {
  useEffect(() => {
    if (!active) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onEscape();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [active, onEscape]);
}
