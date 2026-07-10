import { useState } from 'react';
import type { AxiosResponse } from 'axios';
import { downloadBlob } from '../../../utils/download';

interface UseVendorExportParams {
  setOrdersError: (message: string) => void;
}

export const useVendorExport = ({ setOrdersError }: UseVendorExportParams) => {
  const [exportLoading, setExportLoading] = useState(false);

  const handleVendorExport = async (
    exportFn: () => Promise<AxiosResponse<Blob>>,
    filename: string
  ) => {
    setExportLoading(true);
    try {
      const res = await exportFn();
      downloadBlob(res.data, filename);
    } catch {
      setOrdersError('Не удалось выполнить экспорт');
    } finally {
      setExportLoading(false);
    }
  };

  return { exportLoading, handleVendorExport };
};
