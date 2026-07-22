import { useTranslation } from '@shared/i18n/useTranslation';
import type { VendorProfile } from './hooks/useVendorRestaurants';

interface VendorApprovalBannerProps {
  vendorProfile: VendorProfile | null;
}

export function VendorApprovalBanner({ vendorProfile }: VendorApprovalBannerProps) {
  const { t } = useTranslation();
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
        {isPending ? t('vendor.approvalBanner.pendingTitle') : t('vendor.approvalBanner.rejectedTitle')}
      </div>
      <div
        style={{
          fontSize: "var(--text-base)",
          color: 'var(--text-3)',
          marginBottom: vendorProfile.rejection_reason ? 8 : 0,
        }}
      >
        {isPending
          ? t('vendor.approvalBanner.pendingText')
          : t('vendor.approvalBanner.rejectedText')}
      </div>
      {vendorProfile.rejection_reason && (
        <div style={{ fontSize: "var(--text-base)", color: 'var(--error)', fontWeight: 500 }}>
          {t('vendor.approvalBanner.reason', { reason: vendorProfile.rejection_reason })}
        </div>
      )}
    </div>
  );
}
