import type { Dispatch, SetStateAction } from 'react';
import { PlusIcon, XIcon } from '@phosphor-icons/react';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { MenuItem } from '@shared/types/models';
import type { LoyaltyForm, LoyaltyTierRow } from '../hooks/useVendorLoyalty';
import styles from './components/VendorLoyalty.module.css';

const REWARD_TYPES = ['FREE_ITEM', 'DISCOUNT_PERCENT', 'DISCOUNT_FIXED'] as const;
const TIER_BASES = ['ORDERS', 'SPENT'] as const;

const EMPTY_TIER: LoyaltyTierRow = { name: '', threshold: '', cashback_percent: '' };

interface SectionProps {
  loyaltyForm: LoyaltyForm;
  setLoyaltyForm: Dispatch<SetStateAction<LoyaltyForm>>;
}

export function VendorLoyaltyPunchCardFields({
  loyaltyForm,
  setLoyaltyForm,
  selectedMenu,
}: SectionProps & { selectedMenu: MenuItem[] }) {
  const { t } = useTranslation();
  return (
    <>
      <div className={styles['grid2']}>
        <label className={styles['field']}>
          <span>{t('loyalty.vendor.punchesRequired')}</span>
          <input
            className="form-input"
            type="number"
            min={1}
            max={100}
            value={loyaltyForm.punches_required}
            onChange={(e) => { setLoyaltyForm((f) => ({ ...f, punches_required: e.target.value })); }}
          />
        </label>
        <label className={styles['field']}>
          <span>{t('loyalty.vendor.minOrderAmount')}</span>
          <input
            className="form-input"
            type="number"
            min={0}
            value={loyaltyForm.min_order_amount}
            onChange={(e) => { setLoyaltyForm((f) => ({ ...f, min_order_amount: e.target.value })); }}
          />
        </label>
      </div>
      <div className={styles['grid2']}>
        <label className={styles['field']}>
          <span>{t('loyalty.vendor.rewardTypeLabel')}</span>
          <select
            className="form-input"
            value={loyaltyForm.reward_type}
            onChange={(e) => {
              setLoyaltyForm((f) => ({
                ...f,
                reward_type: e.target.value as (typeof REWARD_TYPES)[number],
              }));
            }}
          >
            {REWARD_TYPES.map((rewardType) => (
              <option key={rewardType} value={rewardType}>
                {t(`loyalty.rewardType.${rewardType}`)}
              </option>
            ))}
          </select>
        </label>
        {loyaltyForm.reward_type === 'FREE_ITEM' ? (
          <label className={styles['field']}>
            <span>{t('loyalty.vendor.freeItemLabel')}</span>
            <select
              className="form-input"
              value={loyaltyForm.reward_menu_item_id}
              onChange={(e) => { setLoyaltyForm((f) => ({ ...f, reward_menu_item_id: e.target.value })); }}
            >
              <option value="">{t('loyalty.vendor.freeItemPlaceholder')}</option>
              {selectedMenu.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className={styles['field']}>
            <span>
              {loyaltyForm.reward_type === 'DISCOUNT_PERCENT'
                ? t('loyalty.vendor.rewardValuePercent')
                : t('loyalty.vendor.rewardValueFixed')}
            </span>
            <input
              className="form-input"
              type="number"
              min={1}
              value={loyaltyForm.reward_value}
              onChange={(e) => { setLoyaltyForm((f) => ({ ...f, reward_value: e.target.value })); }}
            />
          </label>
        )}
      </div>
    </>
  );
}

export function VendorLoyaltyCashbackFields({ loyaltyForm, setLoyaltyForm }: SectionProps) {
  const { t } = useTranslation();
  const updateTier = (index: number, patch: Partial<LoyaltyTierRow>) => {
    setLoyaltyForm((f) => ({
      ...f,
      tiers: f.tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)),
    }));
  };
  return (
    <>
      <div className={styles['grid2']}>
        <label className={styles['field']}>
          <span>{t('loyalty.vendor.tierBasisLabel')}</span>
          <select
            className="form-input"
            value={loyaltyForm.tier_basis}
            onChange={(e) => {
              setLoyaltyForm((f) => ({
                ...f,
                tier_basis: e.target.value as (typeof TIER_BASES)[number],
              }));
            }}
          >
            {TIER_BASES.map((basis) => (
              <option key={basis} value={basis}>
                {t(`loyalty.tierBasis.${basis}`)}
              </option>
            ))}
          </select>
        </label>
        <label className={styles['field']}>
          <span>{t('loyalty.vendor.maxRedeemPercent')}</span>
          <input
            className="form-input"
            type="number"
            min={1}
            max={100}
            value={loyaltyForm.max_redeem_percent}
            onChange={(e) => { setLoyaltyForm((f) => ({ ...f, max_redeem_percent: e.target.value })); }}
          />
        </label>
      </div>
      <div className={styles['tiersTitle']}>{t('loyalty.vendor.tiers.title')}</div>
      {loyaltyForm.tiers.map((tier, index) => (
        <div key={index} className={styles['tierRow']}>
          <label className={styles['field']}>
            <span>{t('loyalty.vendor.tiers.name')}</span>
            <input
              className="form-input"
              value={tier.name}
              onChange={(e) => { updateTier(index, { name: e.target.value }); }}
              required
            />
          </label>
          <label className={styles['field']}>
            <span>{t('loyalty.vendor.tiers.threshold')}</span>
            <input
              className="form-input"
              type="number"
              min={0}
              value={tier.threshold}
              onChange={(e) => { updateTier(index, { threshold: e.target.value }); }}
            />
          </label>
          <label className={styles['field']}>
            <span>{t('loyalty.vendor.tiers.cashbackPercent')}</span>
            <input
              className="form-input"
              type="number"
              min={0}
              max={100}
              value={tier.cashback_percent}
              onChange={(e) => { updateTier(index, { cashback_percent: e.target.value }); }}
            />
          </label>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            aria-label={t('loyalty.vendor.tiers.remove')}
            title={t('loyalty.vendor.tiers.remove')}
            onClick={() => {
              setLoyaltyForm((f) => ({
                ...f,
                tiers: f.tiers.filter((_, i) => i !== index),
              }));
            }}
          >
            <XIcon size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        style={{ display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
        onClick={() => {
          setLoyaltyForm((f) => ({ ...f, tiers: [...f.tiers, { ...EMPTY_TIER }] }));
        }}
      >
        <PlusIcon size={14} />
        {t('loyalty.vendor.tiers.add')}
      </button>
    </>
  );
}
