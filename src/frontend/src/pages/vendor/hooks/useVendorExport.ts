import { useState } from 'react';
import { downloadBlob } from '../../../utils/download';

interface UseVendorExportParams {
  setOrdersError: (message: string) => void;
}

export const useVendorExport = ({ setOrdersError }: UseVendorExportParams) => {
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
      setOrdersError('Не удалось выполнить экспорт');
    } finally {
      setExportLoading(false);
    }
  };

  return { exportLoading, handleVendorExport };
};
