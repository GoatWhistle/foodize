import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { t } from "@shared/i18n/useTranslation";
import { CartDrawer } from "@shared/components/CartDrawer/CartDrawer";

export const minimumMatcher = (content: string): boolean =>
  content.trim().startsWith(t("order.pickup.minimum", { time: "" }).trim());

export const renderDrawer = (props: Partial<React.ComponentProps<typeof CartDrawer>> = {}) =>
  render(
    <MemoryRouter>
      <CartDrawer onClose={vi.fn()} {...props} />
    </MemoryRouter>,
  );
