import { useEffect, useState } from "react";
import { TagIcon, XIcon } from "@phosphor-icons/react";
import { promoService } from "@shared/services/promoService";
import { translateApiError } from "@shared/utils/translateApiError";
import { useTranslation } from "@shared/i18n/useTranslation";
import type { PromoValidate } from "@shared/types/models";
import type { CartLine } from "@shared/utils/cartLine";

export type AppliedPromo = PromoValidate & { originalTotal: number };

interface UseCartPromoParams {
  cartRestaurantId: string | null;
  cart: CartLine[];
  total: number;
  isFirstOrder: boolean;
}

export interface CartPromoState {
  promoCode: string;
  setPromoCode: (value: string) => void;
  appliedPromo: AppliedPromo | null;
  promoError: string;
  promoLoading: boolean;
  applyPromo: () => Promise<void>;
  removePromo: () => void;
}

export const useCartPromo = ({
  cartRestaurantId,
  cart,
  total,
  isFirstOrder,
}: UseCartPromoParams): CartPromoState => {
  const { t } = useTranslation();
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoError("");
  }, [cartRestaurantId]);

  useEffect(() => {
    if (appliedPromo) setAppliedPromo(null);
  }, [cart, appliedPromo]);

  const applyPromo = async () => {
    if (!promoCode.trim() || !cartRestaurantId) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const response = await promoService.validate(promoCode.trim(), cartRestaurantId, total, isFirstOrder);
      setAppliedPromo({ ...response.data.data, originalTotal: total });
    } catch (err) {
      setPromoError(translateApiError(err, t("order.cart.promoInvalid")));
      setAppliedPromo(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => { setAppliedPromo(null); setPromoCode(""); setPromoError(""); };

  return { promoCode, setPromoCode, appliedPromo, promoError, promoLoading, applyPromo, removePromo };
};

export const CartPromoSection = ({ promo }: { promo: CartPromoState }) => {
  const { t } = useTranslation();
  const { promoCode, setPromoCode, appliedPromo, promoError, promoLoading, applyPromo, removePromo } = promo;
  if (!appliedPromo) {
    return (
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="form-input"
            placeholder={t("order.cart.promoPlaceholder")}
            value={promoCode}
            onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); }}
            onKeyDown={(e) => { if (e.key === "Enter") void applyPromo(); }}
            style={{ flex: 1, height: 44, fontSize: "var(--text-md)", borderRadius: "var(--r-md)", letterSpacing: "0.05em" }}
          />
          <button
            className="btn btn-secondary"
            onClick={() => { void applyPromo(); }}
            disabled={promoLoading || !promoCode.trim()}
            style={{ height: 44, padding: "0 14px", fontSize: "var(--text-base)" }}
          >
            {promoLoading ? "..." : t("common.actions.apply")}
          </button>
        </div>
        {promoError && <div className="form-error" style={{ marginTop: 6, fontSize: "var(--text-base)" }}>{promoError}</div>}
      </div>
    );
  }
  return (
    <div style={{ marginTop: 16, padding: "10px 14px", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", borderRadius: "var(--r-md)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--text-base)", color: "var(--color-success)", fontWeight: 700 }}>
        <TagIcon size={14} weight="fill" />
        {appliedPromo.code}
        {appliedPromo.discount_type === "PERCENT" ? ` −${appliedPromo.discount_value}%` : ` −${appliedPromo.discount_value} ₽`}
      </div>
      <button onClick={removePromo} aria-label={t("common.actions.close")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-success)", display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, margin: "-15px -14px -15px 0", flexShrink: 0 }}>
        <XIcon size={14} weight="bold" />
      </button>
    </div>
  );
};
