import { useEffect, useState } from "react";
import { loyaltyService } from "@shared/services/loyaltyService";
import { useTranslation } from "@shared/i18n/useTranslation";
import { formatPrice } from "@shared/utils/price";
import type { LoyaltyReward, LoyaltyStatus } from "@shared/types/models";
import type { CartLine } from "@shared/utils/cartLine";

interface UseCartLoyaltyParams {
  cartRestaurantId: string | null;
  canLoyalty: boolean;
  cart: CartLine[];
  finalTotal: number;
}

export interface CartLoyaltyState {
  loyaltyStatus: LoyaltyStatus | null;
  loyaltyProgram: LoyaltyStatus["program"] | null;
  maxRedeemPoints: number;
  redeemInput: string;
  setRedeemInput: (value: string) => void;
  redeemPoints: number;
  availableRewards: LoyaltyReward[];
  isRewardApplicable: (reward: LoyaltyReward) => boolean;
  selectedRewardId: string;
  setSelectedRewardId: (value: string) => void;
  effectiveRewardId: string | null;
  rewardLabel: (reward: LoyaltyReward) => string;
}

export const useCartLoyalty = ({
  cartRestaurantId,
  canLoyalty,
  cart,
  finalTotal,
}: UseCartLoyaltyParams): CartLoyaltyState => {
  const { t } = useTranslation();
  const [loyaltyStatus, setLoyaltyStatus] = useState<LoyaltyStatus | null>(null);
  const [redeemInput, setRedeemInput] = useState("");
  const [selectedRewardId, setSelectedRewardId] = useState("");

  useEffect(() => {
    setRedeemInput("");
    setSelectedRewardId("");
  }, [cartRestaurantId]);

  useEffect(() => {
    if (!cartRestaurantId || !canLoyalty) {
      setLoyaltyStatus(null);
      return;
    }
    const state = { cancelled: false };
    void (async () => {
      try {
        const response = await loyaltyService.getStatus(cartRestaurantId);
        if (!state.cancelled) setLoyaltyStatus(response.data.data);
      } catch {
        if (!state.cancelled) setLoyaltyStatus(null);
      }
    })();
    return () => { state.cancelled = true; };
  }, [cartRestaurantId, canLoyalty]);

  const loyaltyProgram = loyaltyStatus?.program ?? null;
  const maxRedeemPoints =
    loyaltyProgram?.type === "CASHBACK" && loyaltyStatus
      ? Math.min(
          loyaltyStatus.points_balance,
          Math.floor((finalTotal * (loyaltyProgram.max_redeem_percent ?? 100)) / 100),
        )
      : 0;
  const redeemPoints = Math.min(Math.max(parseInt(redeemInput, 10) || 0, 0), maxRedeemPoints);
  const availableRewards =
    loyaltyProgram?.type === "PUNCH_CARD" && loyaltyStatus
      ? loyaltyStatus.rewards.filter((reward) => reward.status === "AVAILABLE")
      : [];
  const isRewardApplicable = (reward: LoyaltyReward): boolean =>
    reward.reward_type !== "FREE_ITEM" ||
    cart.some((line) => line.menuItem.id === reward.reward_menu_item_id);
  const selectedReward = availableRewards.find((reward) => reward.id === selectedRewardId) ?? null;
  const effectiveRewardId =
    selectedReward && isRewardApplicable(selectedReward) ? selectedReward.id : null;
  const rewardLabel = (reward: LoyaltyReward): string => {
    if (reward.reward_type === "DISCOUNT_PERCENT") {
      return t("loyalty.rewardDescription.DISCOUNT_PERCENT", { value: reward.reward_value ?? 0 });
    }
    if (reward.reward_type === "DISCOUNT_FIXED") {
      return t("loyalty.rewardDescription.DISCOUNT_FIXED", {
        value: formatPrice(reward.reward_value ?? 0),
      });
    }
    const cartLine = cart.find((line) => line.menuItem.id === reward.reward_menu_item_id);
    return cartLine
      ? t("loyalty.rewardDescription.FREE_ITEM", { item: cartLine.menuItem.name })
      : t("loyalty.rewardType.FREE_ITEM");
  };

  return {
    loyaltyStatus,
    loyaltyProgram,
    maxRedeemPoints,
    redeemInput,
    setRedeemInput,
    redeemPoints,
    availableRewards,
    isRewardApplicable,
    selectedRewardId,
    setSelectedRewardId,
    effectiveRewardId,
    rewardLabel,
  };
};

export const CartLoyaltySections = ({ loyalty }: { loyalty: CartLoyaltyState }) => {
  const { t } = useTranslation();
  const {
    loyaltyStatus,
    loyaltyProgram,
    maxRedeemPoints,
    redeemInput,
    setRedeemInput,
    redeemPoints,
    availableRewards,
    isRewardApplicable,
    selectedRewardId,
    setSelectedRewardId,
    rewardLabel,
  } = loyalty;
  return (
    <>
      {loyaltyProgram?.type === "CASHBACK" && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          {maxRedeemPoints > 0 && (
            <>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "var(--text-base)" }}>
                <span>{t("loyalty.checkout.redeemLabel")}</span>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  max={maxRedeemPoints}
                  value={redeemInput}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    if (Number.isNaN(parsed)) { setRedeemInput(""); return; }
                    setRedeemInput(String(Math.min(Math.max(parsed, 0), maxRedeemPoints)));
                  }}
                  style={{ height: 44, fontSize: "var(--text-md)", borderRadius: "var(--r-md)" }}
                />
              </label>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--text-3)" }}>
                {t("loyalty.checkout.maxHint", { max: formatPrice(maxRedeemPoints) })}
              </div>
              {redeemPoints > 0 && (
                <div style={{ fontSize: "var(--text-sm)", color: "var(--color-success)" }}>
                  {t("loyalty.checkout.pointsWillBeDeducted")}
                </div>
              )}
            </>
          )}
          {loyaltyStatus?.current_tier && (
            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-3)" }}>
              {t("loyalty.checkout.cashbackHint", {
                percent: loyaltyStatus.current_tier.cashback_percent,
              })}
            </div>
          )}
        </div>
      )}
      {loyaltyProgram?.type === "PUNCH_CARD" && availableRewards.length > 0 && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "var(--text-base)" }}>
            <span>{t("loyalty.checkout.applyReward")}</span>
            <select
              className="form-input"
              value={selectedRewardId}
              onChange={(e) => { setSelectedRewardId(e.target.value); }}
              style={{ height: 44, fontSize: "var(--text-md)", borderRadius: "var(--r-md)" }}
            >
              <option value="">{t("loyalty.checkout.noReward")}</option>
              {availableRewards.map((reward) => (
                <option key={reward.id} value={reward.id} disabled={!isRewardApplicable(reward)}>
                  {rewardLabel(reward)}
                </option>
              ))}
            </select>
          </label>
          {availableRewards.some((reward) => !isRewardApplicable(reward)) && (
            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-3)" }}>
              {t("loyalty.checkout.rewardItemNotInCart")}
            </div>
          )}
        </div>
      )}
    </>
  );
};
