import { useState } from 'react';
import { downloadBlob } from '../../../utils/download';

export const useVendorExport = ({ setOrdersError }) => {
  const [exportLoading, setExportLoading] = useState(false);

  const handleVendorExport = async (exportFn, filename) => {
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
