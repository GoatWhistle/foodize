import { useState } from 'react';
import { downloadBlob } from '../../../utils/download';
import { useTranslation } from '@shared/i18n/useTranslation';

interface UseVendorExportParams {
  setOrdersError: (message: string) => void;
}

export const useVendorExport = ({ setOrdersError }: UseVendorExportParams) => {
  const { t } = useTranslation();
  const [exportLoading, setExportLoading] = useState(false);

  const handleVendorExport = async (
    exportFn: () => Promise<Blob>,
    filename: string
  ) => {
    setExportLoading(true);
    try {
      const blob = await exportFn();
      downloadBlob(blob, filename);
    } catch {
      setOrdersError(t('vendor.errors.exportFailed'));
    } finally {
      setExportLoading(false);
    }
  };

  return { exportLoading, handleVendorExport };
};
