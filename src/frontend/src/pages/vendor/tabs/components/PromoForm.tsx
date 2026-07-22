import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { XIcon } from '@phosphor-icons/react';
import { categoryLabel } from '@shared/utils/locales';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { Category } from '@shared/types/models';
import type { PromoForm as PromoFormValues } from '../../hooks/useVendorPromos';
import styles from './VendorPromos.module.css';

const CATEGORY_KEYS: Category[] = ['SHAURMA', 'BURGER', 'DRINK', 'PIZZA', 'SUSHI', 'DESSERT', 'SNACK', 'SALAD', 'OTHER'];

interface PromoFormProps {
  promoForm: PromoFormValues;
  setPromoForm: Dispatch<SetStateAction<PromoFormValues>>;
  promoFormLoading: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export function PromoForm({
  promoForm,
  setPromoForm,
  promoFormLoading,
  onSubmit,
  onCancel,
}: PromoFormProps) {
  const { t } = useTranslation();
  return (
    <form onSubmit={onSubmit} className={styles['form']}>
      <div className={styles['formTitle']}>{t('vendor.promos.formTitle')}</div>
      <input
        className="form-input"
        placeholder={t('vendor.promos.placeholders.code')}
        value={promoForm.code}
        onChange={(e) => { setPromoForm((f) => ({ ...f, code: e.target.value.toUpperCase() })); }}
        required
      />
      <div className={styles['grid2']}>
        <select
          className="form-input"
          value={promoForm.discount_type}
          onChange={(e) =>
            { setPromoForm((f) => ({
              ...f,
              discount_type: e.target.value as PromoFormValues['discount_type'],
            })); }
          }
        >
          <option value="PERCENT">{t('vendor.promos.discountTypePercent')}</option>
          <option value="FIXED">{t('vendor.promos.discountTypeFixed')}</option>
        </select>
        <input
          className="form-input"
          type="number"
          placeholder={promoForm.discount_type === 'PERCENT' ? t('vendor.promos.placeholders.discountPercent') : t('vendor.promos.placeholders.discountFixed')}
          min={1}
          value={promoForm.discount_value}
          onChange={(e) => { setPromoForm((f) => ({ ...f, discount_value: e.target.value })); }}
          required
        />
      </div>
      <div className={styles['grid2']}>
        <input
          className="form-input"
          type="number"
          placeholder={t('vendor.promos.placeholders.maxUses')}
          min={1}
          value={promoForm.max_uses}
          onChange={(e) => { setPromoForm((f) => ({ ...f, max_uses: e.target.value })); }}
        />
        <input
          className="form-input"
          type="datetime-local"
          placeholder={t('vendor.promos.placeholders.expiresAt')}
          value={promoForm.expires_at}
          onChange={(e) => { setPromoForm((f) => ({ ...f, expires_at: e.target.value })); }}
        />
      </div>
      <div className={styles['grid2']}>
        <input
          className="form-input"
          type="number"
          placeholder={t('vendor.promos.placeholders.minAmount')}
          min={1}
          value={promoForm.min_order_amount}
          onChange={(e) => { setPromoForm((f) => ({ ...f, min_order_amount: e.target.value })); }}
        />
        <select
          className="form-input"
          value={promoForm.menu_category}
          onChange={(e) => { setPromoForm((f) => ({ ...f, menu_category: e.target.value })); }}
        >
          <option value="">{t('vendor.promos.placeholders.allCategories')}</option>
          {CATEGORY_KEYS.map((category) => (
            <option key={category} value={category}>
              {categoryLabel(category)}
            </option>
          ))}
        </select>
      </div>
      <label className={styles['checkboxRow']}>
        <input
          type="checkbox"
          checked={promoForm.first_order_only}
          onChange={(e) => { setPromoForm((f) => ({ ...f, first_order_only: e.target.checked })); }}
        />
        {t('vendor.promos.firstOrderOnlyCheckbox')}
      </label>
      <div className={styles['formActions']}>
        <button
          className={`btn btn-primary btn-sm ${styles['submitBtn']}`}
          type="submit"
          disabled={promoFormLoading}
        >
          {promoFormLoading ? t('vendor.promos.creating') : t('common.actions.create')}
        </button>
        <button className="btn btn-secondary btn-sm" type="button" onClick={onCancel}>
          <XIcon size={14} />
        </button>
      </div>
    </form>
  );
}
