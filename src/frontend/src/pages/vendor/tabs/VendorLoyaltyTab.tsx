import { useTranslation } from '@shared/i18n/useTranslation';
import type { MenuItem, Restaurant } from '@shared/types/models';
import { useVendorLoyalty } from '../hooks/useVendorLoyalty';
import {
  VendorLoyaltyPunchCardFields,
  VendorLoyaltyCashbackFields,
} from './VendorLoyaltyFormSections';
import styles from './components/VendorLoyalty.module.css';

const PROGRAM_TYPES = ['PUNCH_CARD', 'CASHBACK'] as const;

interface VendorLoyaltyTabProps {
  selectedRestaurant: Restaurant | null;
  selectedMenu: MenuItem[];
}

export function VendorLoyaltyTab({ selectedRestaurant, selectedMenu }: VendorLoyaltyTabProps) {
  const { t } = useTranslation();
  const {
    loyaltyForm,
    setLoyaltyForm,
    loyaltyLoading,
    loyaltySaving,
    loyaltyError,
    loyaltySuccess,
    handleSaveLoyalty,
  } = useVendorLoyalty({ selectedRestaurant });

  if (!selectedRestaurant) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>
        {t('loyalty.vendor.sectionTitle')}
      </span>

      {loyaltyError && <div className="form-error">{loyaltyError}</div>}
      {loyaltySuccess && (
        <div style={{ color: 'var(--color-success)', marginBottom: 8 }}>{loyaltySuccess}</div>
      )}

      {loyaltyLoading ? (
        <div className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-md)' }} />
      ) : (
        <form onSubmit={(e) => { void handleSaveLoyalty(e); }} className={styles['form']}>
          <div className={styles['field']}>
            <span>{t('loyalty.vendor.typeLabel')}</span>
            <div className={styles['typeToggle']} role="radiogroup" aria-label={t('loyalty.vendor.typeLabel')}>
              {PROGRAM_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={loyaltyForm.type === type}
                  className={`${styles['typeBtn']} ${loyaltyForm.type === type ? styles['typeBtnActive'] : ''}`}
                  onClick={() => { setLoyaltyForm((f) => ({ ...f, type })); }}
                >
                  {t(`loyalty.programType.${type}`)}
                </button>
              ))}
            </div>
          </div>

          {loyaltyForm.type === 'PUNCH_CARD' ? (
            <VendorLoyaltyPunchCardFields
              loyaltyForm={loyaltyForm}
              setLoyaltyForm={setLoyaltyForm}
              selectedMenu={selectedMenu}
            />
          ) : (
            <VendorLoyaltyCashbackFields
              loyaltyForm={loyaltyForm}
              setLoyaltyForm={setLoyaltyForm}
            />
          )}

          <label className={styles['checkboxRow']}>
            <input
              type="checkbox"
              checked={loyaltyForm.is_active}
              onChange={(e) => { setLoyaltyForm((f) => ({ ...f, is_active: e.target.checked })); }}
            />
            {t('loyalty.vendor.isActive')}
          </label>

          <div className={styles['formActions']}>
            <button
              className={`btn btn-primary btn-sm ${styles['submitBtn']}`}
              type="submit"
              disabled={loyaltySaving}
            >
              {loyaltySaving ? t('common.actions.saving') : t('common.actions.save')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
