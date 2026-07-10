import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { downloadBlob } from '../../utils/download';

describe('downloadBlob', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('creates a temporary link, clicks it and revokes the object URL', () => {
    const link = document.createElement('a');
    const click = vi.spyOn(link, 'click').mockImplementation(() => {});
    const appendChild = vi.spyOn(document.body, 'appendChild');
    const removeChild = vi.spyOn(document.body, 'removeChild');
    vi.spyOn(document, 'createElement').mockReturnValue(link);

    const createObjectURL = vi.fn(() => 'blob:test');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    const blob = new Blob(['hello']);
    downloadBlob(blob, 'report.pdf');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(appendChild).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(removeChild).toHaveBeenCalled();

    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });
});
