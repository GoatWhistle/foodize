import type { VendorProfile } from './hooks/useVendorRestaurants';

interface VendorApprovalBannerProps {
  vendorProfile: VendorProfile | null;
}

export default function VendorApprovalBanner({ vendorProfile }: VendorApprovalBannerProps) {
  if (!vendorProfile || vendorProfile.approval_status === 'APPROVED') return null;

  const isPending = vendorProfile.approval_status === 'PENDING';

  return (
    <div
      style={{
        padding: 16,
        background: isPending ? 'var(--bg-card)' : 'var(--color-error-bg)',
        border: `1px solid ${isPending ? 'var(--border)' : 'var(--error)'}`,
        borderRadius: 'var(--radius-md)',
        marginBottom: 28,
      }}
    >
      <div style={{ fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>
        {isPending ? 'Профиль на модерации' : 'Профиль отклонён'}
      </div>
      <div
        style={{
          fontSize: '0.85rem',
          color: 'var(--text-3)',
          marginBottom: vendorProfile.rejection_reason ? 8 : 0,
        }}
      >
        {isPending
          ? 'Ваш профиль проверяется администратором. Ваши заведения пока не видны покупателям.'
          : 'К сожалению, ваш профиль не прошел модерацию.'}
      </div>
      {vendorProfile.rejection_reason && (
        <div style={{ fontSize: '0.85rem', color: 'var(--error)', fontWeight: 500 }}>
          Причина: {vendorProfile.rejection_reason}
        </div>
      )}
    </div>
  );
}
