import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { PlusIcon, TagIcon } from '@phosphor-icons/react';
import { EmptyState } from '@shared/components/EmptyState/EmptyState';
import type { Promo, Restaurant } from '@shared/types/models';
import type { PromoForm as PromoFormValues } from '../hooks/useVendorPromos';
import { PromoForm } from './components/PromoForm';
import { PromoCard } from './components/PromoCard';

interface ListSkeletonProps {
  rows?: number;
}

interface VendorPromosTabProps {
  selectedRestaurant: Restaurant | null;
  promosList: Promo[];
  promosLoading: boolean;
  promosError: string;
  promosSuccess: string;
  showPromoForm: boolean;
  setShowPromoForm: Dispatch<SetStateAction<boolean>>;
  promoForm: PromoFormValues;
  setPromoForm: Dispatch<SetStateAction<PromoFormValues>>;
  promoFormLoading: boolean;
  deactivatingPromo: string | null;
  handleCreatePromo: (e: FormEvent<HTMLFormElement>) => void;
  handleDeactivatePromo: (code: string) => void;
}

const ListSkeleton = ({ rows = 3 }: ListSkeletonProps) => (
  <div style={{ display: 'grid', gap: 10 }}>
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={index}
        className="skeleton"
        style={{ height: 64, borderRadius: 'var(--radius-md)' }}
      />
    ))}
  </div>
);

export function VendorPromosTab({
  selectedRestaurant,
  promosList,
  promosLoading,
  promosError,
  promosSuccess,
  showPromoForm,
  setShowPromoForm,
  promoForm,
  setPromoForm,
  promoFormLoading,
  deactivatingPromo,
  handleCreatePromo,
  handleDeactivatePromo,
}: VendorPromosTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "var(--text-base)" }}>Промокоды</span>
        {selectedRestaurant && (
          <button
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32 }}
            onClick={() => { setShowPromoForm((v) => !v); }}
          >
            <PlusIcon size={14} />
            Создать
          </button>
        )}
      </div>

      {promosError && <div className="form-error">{promosError}</div>}
      {promosSuccess && (
        <div style={{ color: 'var(--color-success)', marginBottom: 8 }}>{promosSuccess}</div>
      )}

      {showPromoForm && selectedRestaurant && (
        <PromoForm
          promoForm={promoForm}
          setPromoForm={setPromoForm}
          promoFormLoading={promoFormLoading}
          onSubmit={handleCreatePromo}
          onCancel={() => { setShowPromoForm(false); }}
        />
      )}

      {promosLoading && promosList.length === 0 ? (
        <ListSkeleton rows={3} />
      ) : promosList.length === 0 ? (
        <EmptyState
          icon={<TagIcon size={36} />}
          title="Нет промокодов"
          subtitle="Создайте первый промокод для скидки клиентам"
        />
      ) : (
        <div className={promosLoading ? 'loading-dim' : undefined}>
          {promosList.map((promo) => (
            <PromoCard
              key={promo.id}
              promo={promo}
              deactivating={deactivatingPromo === promo.code}
              onDeactivate={handleDeactivatePromo}
            />
          ))}
        </div>
      )}
    </div>
  );
}
