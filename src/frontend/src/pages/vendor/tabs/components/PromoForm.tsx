import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { XIcon } from '@phosphor-icons/react';
import { CATEGORY_RU } from '@shared/utils/locales';
import type { PromoForm as PromoFormValues } from '../../hooks/useVendorPromos';
import styles from './VendorPromos.module.css';

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
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <div className={styles.formTitle}>Новый промокод</div>
      <input
        className="form-input"
        placeholder="Код (напр. SAVE20)"
        value={promoForm.code}
        onChange={(e) => { setPromoForm((f) => ({ ...f, code: e.target.value.toUpperCase() })); }}
        required
      />
      <div className={styles.grid2}>
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
          <option value="PERCENT">% Процент</option>
          <option value="FIXED">₽ Фиксированный</option>
        </select>
        <input
          className="form-input"
          type="number"
          placeholder={promoForm.discount_type === 'PERCENT' ? 'Скидка %' : 'Сумма ₽'}
          min={1}
          value={promoForm.discount_value}
          onChange={(e) => { setPromoForm((f) => ({ ...f, discount_value: e.target.value })); }}
          required
        />
      </div>
      <div className={styles.grid2}>
        <input
          className="form-input"
          type="number"
          placeholder="Макс. использований (не обяз.)"
          min={1}
          value={promoForm.max_uses}
          onChange={(e) => { setPromoForm((f) => ({ ...f, max_uses: e.target.value })); }}
        />
        <input
          className="form-input"
          type="datetime-local"
          placeholder="Истекает (не обяз.)"
          value={promoForm.expires_at}
          onChange={(e) => { setPromoForm((f) => ({ ...f, expires_at: e.target.value })); }}
        />
      </div>
      <div className={styles.grid2}>
        <input
          className="form-input"
          type="number"
          placeholder="Мин. сумма (не обяз.)"
          min={1}
          value={promoForm.min_order_amount}
          onChange={(e) => { setPromoForm((f) => ({ ...f, min_order_amount: e.target.value })); }}
        />
        <select
          className="form-input"
          value={promoForm.menu_category}
          onChange={(e) => { setPromoForm((f) => ({ ...f, menu_category: e.target.value })); }}
        >
          <option value="">Все категории</option>
          {Object.entries(CATEGORY_RU).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={promoForm.first_order_only}
          onChange={(e) => { setPromoForm((f) => ({ ...f, first_order_only: e.target.checked })); }}
        />
        Только для первого заказа
      </label>
      <div className={styles.formActions}>
        <button
          className={`btn btn-primary btn-sm ${styles.submitBtn}`}
          type="submit"
          disabled={promoFormLoading}
        >
          {promoFormLoading ? 'Создаю...' : 'Создать'}
        </button>
        <button className="btn btn-secondary btn-sm" type="button" onClick={onCancel}>
          <XIcon size={14} />
        </button>
      </div>
    </form>
  );
}
