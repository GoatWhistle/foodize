import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVendorExport } from '../../../../pages/vendor/hooks/useVendorExport';
import { downloadBlob } from '../../../../utils/download';
import { t } from '@shared/i18n/useTranslation';

vi.mock('../../../../utils/download', () => ({ downloadBlob: vi.fn() }));

describe('useVendorExport', () => {
  beforeEach(() => vi.clearAllMocks());

  it('downloads the blob on success and toggles loading', async () => {
    const setOrdersError = vi.fn();
    const { result } = renderHook(() => useVendorExport({ setOrdersError }));
    expect(result.current.exportLoading).toBe(false);

    const blob = new Blob(['x']);
    await act(async () => {
      await result.current.handleVendorExport(() => Promise.resolve(blob), 'file.csv');
    });

    expect(downloadBlob).toHaveBeenCalledWith(blob, 'file.csv');
    expect(setOrdersError).not.toHaveBeenCalled();
    expect(result.current.exportLoading).toBe(false);
  });

  it('sets error when export fails', async () => {
    const setOrdersError = vi.fn();
    const { result } = renderHook(() => useVendorExport({ setOrdersError }));

    await act(async () => {
      await result.current.handleVendorExport(
        () => Promise.reject(new Error('nope')),
        'file.csv'
      );
    });

    expect(setOrdersError).toHaveBeenCalledWith(t('vendor.errors.exportFailed'));
    expect(downloadBlob).not.toHaveBeenCalled();
    expect(result.current.exportLoading).toBe(false);
  });
});
