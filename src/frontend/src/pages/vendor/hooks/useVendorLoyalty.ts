import { useState, useEffect } from 'react';
import { translateApiError } from '@shared/utils/translateApiError';
import { loyaltyService } from '@shared/services/loyaltyService';
import { useTranslation } from '@shared/i18n/useTranslation';
import type {
  LoyaltyProgram,
  LoyaltyProgramType,
  LoyaltyProgramUpsert,
  LoyaltyRewardType,
  LoyaltyTierBasis,
  Restaurant,
} from '@shared/types/models';

export interface LoyaltyTierRow {
  name: string;
  threshold: string;
  cashback_percent: string;
}

export interface LoyaltyForm {
  type: LoyaltyProgramType;
  is_active: boolean;
  tier_basis: LoyaltyTierBasis;
  min_order_amount: string;
  punches_required: string;
  reward_type: LoyaltyRewardType;
  reward_value: string;
  reward_menu_item_id: string;
  max_redeem_percent: string;
  tiers: LoyaltyTierRow[];
}

export const EMPTY_LOYALTY_FORM: LoyaltyForm = {
  type: 'PUNCH_CARD',
  is_active: true,
  tier_basis: 'ORDERS',
  min_order_amount: '',
  punches_required: '',
  reward_type: 'FREE_ITEM',
  reward_value: '',
  reward_menu_item_id: '',
  max_redeem_percent: '100',
  tiers: [],
};

const isProgramNotFound = (error: unknown): boolean => {
  const detail = (
    error as { response?: { data?: { detail?: { code?: string } | string | null } } }
  ).response?.data?.detail;
  return (
    typeof detail === 'object' && detail !== null && detail.code === 'LOYALTY_PROGRAM_NOT_FOUND'
  );
};

const toForm = (program: LoyaltyProgram): LoyaltyForm => ({
  type: program.type,
  is_active: program.is_active,
  tier_basis: program.tier_basis,
  min_order_amount: program.min_order_amount != null ? String(program.min_order_amount) : '',
  punches_required: program.punches_required != null ? String(program.punches_required) : '',
  reward_type: program.reward_type ?? 'FREE_ITEM',
  reward_value: program.reward_value != null ? String(program.reward_value) : '',
  reward_menu_item_id: program.reward_menu_item_id ?? '',
  max_redeem_percent:
    program.max_redeem_percent != null ? String(program.max_redeem_percent) : '100',
  tiers: program.tiers.map((tier) => ({
    name: tier.name,
    threshold: String(tier.threshold),
    cashback_percent: String(tier.cashback_percent),
  })),
});

interface UseVendorLoyaltyParams {
  selectedRestaurant: Restaurant | null;
}

export const useVendorLoyalty = ({ selectedRestaurant }: UseVendorLoyaltyParams) => {
  const { t } = useTranslation();
  const [loyaltyForm, setLoyaltyForm] = useState<LoyaltyForm>(EMPTY_LOYALTY_FORM);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [loyaltySaving, setLoyaltySaving] = useState(false);
  const [loyaltyError, setLoyaltyError] = useState('');
  const [loyaltySuccess, setLoyaltySuccess] = useState('');

  const restaurantId = selectedRestaurant?.id ?? null;

  useEffect(() => {
    if (!restaurantId) return;
    const state = { cancelled: false };
    setLoyaltyLoading(true);
    setLoyaltyError('');
    setLoyaltySuccess('');
    setLoyaltyForm(EMPTY_LOYALTY_FORM);
    void (async () => {
      try {
        const response = await loyaltyService.getProgram(restaurantId);
        if (!state.cancelled) setLoyaltyForm(toForm(response.data.data));
      } catch (error) {
        if (!state.cancelled && !isProgramNotFound(error)) {
          setLoyaltyError(translateApiError(error, t('loyalty.vendor.errors.loadFailed')));
        }
      } finally {
        if (!state.cancelled) setLoyaltyLoading(false);
      }
    })();
    return () => {
      state.cancelled = true;
    };
  }, [restaurantId, t]);

  const validateForm = (): string => {
    if (loyaltyForm.type === 'PUNCH_CARD') {
      if (!loyaltyForm.punches_required) {
        return t('apiErrors.byCode.LOYALTY_PUNCHES_REQUIRED_MISSING');
      }
      if (loyaltyForm.reward_type === 'FREE_ITEM' && !loyaltyForm.reward_menu_item_id) {
        return t('apiErrors.byCode.LOYALTY_REWARD_ITEM_REQUIRED');
      }
      if (loyaltyForm.reward_type !== 'FREE_ITEM' && !loyaltyForm.reward_value) {
        return t('apiErrors.byCode.LOYALTY_REWARD_VALUE_REQUIRED');
      }
      if (
        loyaltyForm.reward_type === 'DISCOUNT_PERCENT' &&
        (parseInt(loyaltyForm.reward_value, 10) < 1 || parseInt(loyaltyForm.reward_value, 10) > 100)
      ) {
        return t('apiErrors.byCode.LOYALTY_REWARD_PERCENT_OUT_OF_RANGE');
      }
      return '';
    }
    if (loyaltyForm.tiers.length === 0) {
      return t('apiErrors.byCode.LOYALTY_TIERS_REQUIRED');
    }
    const thresholds = loyaltyForm.tiers.map((tier) => parseInt(tier.threshold || '0', 10));
    if (!thresholds.includes(0)) {
      return t('apiErrors.byCode.LOYALTY_BASE_TIER_REQUIRED');
    }
    if (new Set(thresholds).size !== thresholds.length) {
      return t('apiErrors.byCode.LOYALTY_TIER_THRESHOLDS_DUPLICATE');
    }
    return '';
  };

  const handleSaveLoyalty = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!restaurantId) return;
    setLoyaltySuccess('');
    const validationError = validateForm();
    if (validationError) {
      setLoyaltyError(validationError);
      return;
    }
    setLoyaltyError('');
    setLoyaltySaving(true);
    try {
      const isPunchCard = loyaltyForm.type === 'PUNCH_CARD';
      const payload: LoyaltyProgramUpsert = {
        type: loyaltyForm.type,
        is_active: loyaltyForm.is_active,
        tier_basis: loyaltyForm.tier_basis,
        max_redeem_percent: parseInt(loyaltyForm.max_redeem_percent, 10) || 100,
        ...(isPunchCard && loyaltyForm.min_order_amount
          ? { min_order_amount: parseInt(loyaltyForm.min_order_amount, 10) }
          : {}),
        ...(isPunchCard
          ? {
              punches_required: parseInt(loyaltyForm.punches_required, 10),
              reward_type: loyaltyForm.reward_type,
              ...(loyaltyForm.reward_type === 'FREE_ITEM'
                ? { reward_menu_item_id: loyaltyForm.reward_menu_item_id }
                : { reward_value: parseInt(loyaltyForm.reward_value, 10) }),
            }
          : {
              tiers: loyaltyForm.tiers.map((tier) => ({
                name: tier.name,
                threshold: parseInt(tier.threshold || '0', 10),
                cashback_percent: parseInt(tier.cashback_percent || '0', 10),
              })),
            }),
      };
      const response = await loyaltyService.upsertProgram(restaurantId, payload);
      setLoyaltyForm(toForm(response.data.data));
      setLoyaltySuccess(t('loyalty.vendor.saved'));
      setTimeout(() => {
        setLoyaltySuccess('');
      }, 2000);
    } catch (error) {
      setLoyaltyError(translateApiError(error, t('loyalty.vendor.errors.saveFailed')));
    } finally {
      setLoyaltySaving(false);
    }
  };

  return {
    loyaltyForm,
    setLoyaltyForm,
    loyaltyLoading,
    loyaltySaving,
    loyaltyError,
    loyaltySuccess,
    handleSaveLoyalty,
  };
};
