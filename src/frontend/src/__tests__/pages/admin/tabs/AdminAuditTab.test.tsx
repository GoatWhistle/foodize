import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { AdminAuditTab } from '../../../../pages/admin/tabs/AdminAuditTab';
import type { AuditLog, AuditFilters } from '../../../../pages/admin/hooks/useAdminAudit';
import { t } from '@shared/i18n/useTranslation';
import { at, req } from '../../../testUtils';

const baseFilters: AuditFilters = { action: '', entity_type: '', date_from: '', date_to: '' };

const logs: AuditLog[] = [
  {
    id: 'l1',
    action: 'APPROVE_VENDOR',
    entity_type: 'vendor',
    entity_id: 'v1',
    created_at: '2026-01-01T10:00:00Z',
    details: { foo: 'bar' },
  },
  {
    id: 'l2',
    action: 'UNKNOWN_ACTION',
    entity_type: 'restaurant',
    entity_id: null,
    created_at: '2026-01-02T10:00:00Z',
  },
];

const baseProps = (over: Partial<Parameters<typeof AdminAuditTab>[0]> = {}) => ({
  auditLogs: logs,
  auditLoading: false,
  auditTotal: 2,
  auditPage: 1,
  setAuditPage: vi.fn(),
  auditFilters: baseFilters,
  setAuditFilters: vi.fn(),
  expandedAuditId: null as string | null,
  setExpandedAuditId: vi.fn(),
  PAGE_SIZE: 20,
  ...over,
});

describe('AdminAuditTab', () => {
  it('shows skeleton when loading with no logs', () => {
    render(<AdminAuditTab {...baseProps({ auditLogs: [], auditLoading: true })} />);
    expect(screen.queryByText(t('admin.audit.emptyTitle'))).not.toBeInTheDocument();
    expect(screen.queryAllByRole('combobox')).toHaveLength(0);
  });

  it('renders logs with known and fallback labels', () => {
    render(<AdminAuditTab {...baseProps()} />);
    expect(screen.getAllByText(t('admin.audit.actions.APPROVE_VENDOR')).length).toBeGreaterThan(0);
    expect(screen.getByText('UNKNOWN_ACTION')).toBeInTheDocument();
    expect(screen.getByText(t('admin.audit.entity', { id: 'v1' }))).toBeInTheDocument();
    expect(
      screen.getByText(t('admin.audit.entity', { id: t('common.states.dash') })),
    ).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<AdminAuditTab {...baseProps({ auditLogs: [] })} />);
    expect(screen.getByText(t('admin.audit.emptyTitle'))).toBeInTheDocument();
  });

  it('toggles expansion showing details JSON', async () => {
    const setExpandedAuditId = vi.fn();
    render(<AdminAuditTab {...baseProps({ setExpandedAuditId })} />);
    await userEvent.click(screen.getByText(t('admin.audit.entity', { id: 'v1' })));
    expect(setExpandedAuditId).toHaveBeenCalledWith('l1');
  });

  it('shows details JSON when expanded and collapses on second click', async () => {
    const setExpandedAuditId = vi.fn();
    render(
      <AdminAuditTab {...baseProps({ expandedAuditId: 'l1', setExpandedAuditId })} />,
    );
    expect(screen.getByText(/"foo": "bar"/)).toBeInTheDocument();
    await userEvent.click(screen.getByText(t('admin.audit.entity', { id: 'v1' })));
    expect(setExpandedAuditId).toHaveBeenCalledWith(null);
  });

  it('updates action, entity and date filters resetting page', async () => {
    const onFilters = vi.fn();
    const setAuditPage = vi.fn();
    const Harness = () => {
      const [filters, setFilters] = useState<AuditFilters>(baseFilters);
      return (
        <AdminAuditTab
          {...baseProps({ setAuditPage })}
          auditFilters={filters}
          setAuditFilters={(u) => {
            setFilters((prev) => {
              const next = typeof u === 'function' ? u(prev) : u;
              onFilters(next);
              return next;
            });
          }}
        />
      );
    };
    const { container } = render(<Harness />);
    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(at(selects, 0), 'APPROVE_VENDOR');
    await userEvent.selectOptions(at(selects, 1), 'vendor');
    const dateInputs = container.querySelectorAll('input[type="date"]');
    await userEvent.type(dateInputs[0] as HTMLInputElement, '2026-01-01');
    await userEvent.type(dateInputs[1] as HTMLInputElement, '2026-02-01');
    expect(setAuditPage).toHaveBeenCalledWith(1);
    const last = req(onFilters.mock.calls.at(-1))[0] as AuditFilters;
    expect(last).toEqual({
      action: 'APPROVE_VENDOR',
      entity_type: 'vendor',
      date_from: '2026-01-01',
      date_to: '2026-02-01',
    });
  });
});
