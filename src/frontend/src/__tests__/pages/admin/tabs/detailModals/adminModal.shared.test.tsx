import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import {
  DetailField,
  DetailModal,
  formatDateTime,
} from '../../../../../pages/admin/tabs/detailModals/adminModal.shared';
import { t } from '@shared/i18n/useTranslation';

describe('adminModal.shared', () => {
  describe('formatDateTime', () => {
    it('returns dash for empty', () => {
      expect(formatDateTime()).toBe('—');
      expect(formatDateTime(null)).toBe('—');
    });

    it('formats a date string', () => {
      const out = formatDateTime('2026-01-15T10:30:00Z');
      expect(out).toMatch(/2026/);
      expect(out).not.toBe('—');
    });
  });

  describe('DetailField', () => {
    it('renders label and children', () => {
      render(<DetailField label="Имя">Иван</DetailField>);
      expect(screen.getByText('Имя')).toBeInTheDocument();
      expect(screen.getByText('Иван')).toBeInTheDocument();
    });

    it('renders dash placeholder when no children', () => {
      render(<DetailField label="Пусто" />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('renders mono variant', () => {
      render(
        <DetailField label="ID" mono>
          abc
        </DetailField>,
      );
      expect(screen.getByText('abc')).toBeInTheDocument();
    });
  });

  describe('DetailModal', () => {
    it('renders title, subtitle and content', () => {
      render(
        <DetailModal title="Заголовок" subtitle="Подзаголовок" onClose={vi.fn()}>
          <div>Тело</div>
        </DetailModal>,
      );
      expect(screen.getByText('Заголовок')).toBeInTheDocument();
      expect(screen.getByText('Подзаголовок')).toBeInTheDocument();
      expect(screen.getByText('Тело')).toBeInTheDocument();
    });

    it('renders skeleton when loading', () => {
      render(
        <DetailModal title="T" onClose={vi.fn()} loading>
          <div>Тело</div>
        </DetailModal>,
      );
      expect(screen.queryByText('Тело')).not.toBeInTheDocument();
    });

    it('closes via button', async () => {
      const onClose = vi.fn();
      render(
        <DetailModal title="T" onClose={onClose}>
          <div>x</div>
        </DetailModal>,
      );
      await userEvent.click(screen.getByLabelText(t('common.actions.close')));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes on overlay mousedown but not inner click', async () => {
      const onClose = vi.fn();
      const { container } = render(
        <DetailModal title="T" onClose={onClose}>
          <div>inner</div>
        </DetailModal>,
      );
      await userEvent.click(screen.getByText('inner'));
      expect(onClose).not.toHaveBeenCalled();
      const overlay = container.querySelector('.modal-overlay') as HTMLElement;
      await userEvent.pointer({ target: overlay, keys: '[MouseLeft>]' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
