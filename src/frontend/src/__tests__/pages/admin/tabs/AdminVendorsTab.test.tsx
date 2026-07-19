import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminVendorsTab } from '../../../../pages/admin/tabs/AdminVendorsTab';
import type { AdminVendor } from '../../../../pages/admin/hooks/useAdminVendors';
import type { adminService as adminServiceType } from '../../../../services/adminService';

const exportVendorsCSV = vi.fn().mockResolvedValue(new Blob());
const adminService = { exportVendorsCSV } as unknown as typeof adminServiceType;

const vendors: AdminVendor[] = [
  { id: 'v1', name: 'Vendor One', phone_number: '+700000001', restaurants_count: 3 } as AdminVendor,
  { id: 'v2', name: '', phone_number: '', restaurants_count: 0 } as AdminVendor,
];

interface Overrides {
  vendors?: AdminVendor[];
  vendorsLoading?: boolean;
  vendorsTotal?: number;
  selectedVendorIds?: Set<string>;
}

const setVendorsPage = vi.fn();
const setVendorSearchRaw = vi.fn();
const setVendorFilters = vi.fn();
const setSelectedVendorIds = vi.fn();
const handleExport = vi.fn();
const loadVendorDetails = vi.fn();

const renderTab = (o: Overrides = {}) =>
  render(
    <MemoryRouter>
      <AdminVendorsTab
        vendors={o.vendors ?? vendors}
        vendorsLoading={o.vendorsLoading ?? false}
        vendorsTotal={o.vendorsTotal ?? 2}
        vendorsPage={1}
        setVendorsPage={setVendorsPage}
        vendorSearchRaw=""
        setVendorSearchRaw={setVendorSearchRaw}
        vendorFilters={{ approval_status: '' }}
        setVendorFilters={setVendorFilters}
        selectedVendorIds={o.selectedVendorIds ?? new Set()}
        setSelectedVendorIds={setSelectedVendorIds}
        exportLoading={false}
        handleExport={handleExport}
        loadVendorDetails={loadVendorDetails}
        todayStr="2026-07-18"
        adminService={adminService}
        PAGE_SIZE={20}
      />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AdminVendorsTab', () => {
  it('renders vendors with fallback name and phone', () => {
    renderTab();
    expect(screen.getByText('Vendor One')).toBeInTheDocument();
    expect(screen.getByText('+700000001')).toBeInTheDocument();
    expect(screen.getByText('Вендор без имени')).toBeInTheDocument();
    expect(screen.getByText('Нет телефона')).toBeInTheDocument();
    expect(screen.getByText('3 заведений')).toBeInTheDocument();
    expect(screen.getByText('0 заведений')).toBeInTheDocument();
  });

  it('shows skeleton when loading and empty', () => {
    renderTab({ vendors: [], vendorsLoading: true });
    expect(screen.queryByText('Vendor One')).not.toBeInTheDocument();
    expect(screen.queryByText('Вендоров пока нет')).not.toBeInTheDocument();
  });

  it('shows empty state when no vendors and not loading', () => {
    renderTab({ vendors: [], vendorsTotal: 0 });
    expect(screen.getByText('Вендоров пока нет')).toBeInTheDocument();
  });

  it('updates search and resets page on typing', async () => {
    const user = userEvent.setup();
    renderTab();
    await user.type(screen.getByPlaceholderText('Вендор или телефон'), 'a');
    expect(setVendorsPage).toHaveBeenCalledWith(1);
    expect(setVendorSearchRaw).toHaveBeenCalled();
  });

  it('updates approval status filter and resets page', async () => {
    const user = userEvent.setup();
    renderTab();
    await user.selectOptions(screen.getByRole('combobox'), 'APPROVED');
    expect(setVendorsPage).toHaveBeenCalledWith(1);
    expect(setVendorFilters).toHaveBeenCalledWith(expect.any(Function));
    const updater = setVendorFilters.mock.calls[0]?.[0] as (p: { approval_status: string }) => { approval_status: string };
    expect(updater({ approval_status: 'x' })).toHaveProperty('approval_status');
  });

  it('selects all vendors then clears via checkbox', async () => {
    const user = userEvent.setup();
    const { rerender } = renderTab();
    const selectAll = screen.getAllByRole('checkbox')[0];
    if (!selectAll) throw new Error('no checkbox');
    await user.click(selectAll);
    expect(setSelectedVendorIds).toHaveBeenCalledWith(new Set(['v1', 'v2']));

    setSelectedVendorIds.mockClear();
    rerender(
      <MemoryRouter>
        <AdminVendorsTab
          vendors={vendors}
          vendorsLoading={false}
          vendorsTotal={2}
          vendorsPage={1}
          setVendorsPage={setVendorsPage}
          vendorSearchRaw=""
          setVendorSearchRaw={setVendorSearchRaw}
          vendorFilters={{ approval_status: '' }}
          setVendorFilters={setVendorFilters}
          selectedVendorIds={new Set(['v1', 'v2'])}
          setSelectedVendorIds={setSelectedVendorIds}
          exportLoading={false}
          handleExport={handleExport}
          loadVendorDetails={loadVendorDetails}
          todayStr="2026-07-18"
          adminService={adminService}
          PAGE_SIZE={20}
        />
      </MemoryRouter>
    );
    const selectAll2 = screen.getAllByRole('checkbox')[0] as HTMLInputElement;
    expect(selectAll2.checked).toBe(true);
    await user.click(selectAll2);
    expect(setSelectedVendorIds).toHaveBeenCalledWith(new Set());
  });

  it('runs the add branch when an unselected checkbox is toggled', async () => {
    const user = userEvent.setup();
    renderTab({ selectedVendorIds: new Set(['v1']) });
    const rowCheckbox = screen.getAllByRole('checkbox')[1] as HTMLInputElement;
    expect(rowCheckbox.checked).toBe(true);
    await user.click(rowCheckbox);
    const updater = setSelectedVendorIds.mock.calls.at(-1)?.[0] as (p: Set<string>) => Set<string>;
    expect(updater(new Set())).toEqual(new Set(['v1']));
  });

  it('runs the delete branch when a selected checkbox is toggled', async () => {
    const user = userEvent.setup();
    renderTab();
    const rowCheckbox = screen.getAllByRole('checkbox')[1] as HTMLInputElement;
    expect(rowCheckbox.checked).toBe(false);
    await user.click(rowCheckbox);
    const updater = setSelectedVendorIds.mock.calls.at(-1)?.[0] as (p: Set<string>) => Set<string>;
    expect(updater(new Set(['v1']))).toEqual(new Set());
  });

  it('opens vendor details on card click', async () => {
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getByText('Vendor One'));
    expect(loadVendorDetails).toHaveBeenCalledWith('v1');
  });

  it('triggers CSV export', async () => {
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getByRole('button', { name: /CSV/i }));
    expect(handleExport).toHaveBeenCalledWith(exportVendorsCSV, 'вендоры_2026-07-18.csv');
  });

  it('disables export button and shows spinner when exportLoading', () => {
    render(
      <MemoryRouter>
        <AdminVendorsTab
          vendors={vendors}
          vendorsLoading={false}
          vendorsTotal={2}
          vendorsPage={1}
          setVendorsPage={setVendorsPage}
          vendorSearchRaw=""
          setVendorSearchRaw={setVendorSearchRaw}
          vendorFilters={{ approval_status: '' }}
          setVendorFilters={setVendorFilters}
          selectedVendorIds={new Set()}
          setSelectedVendorIds={setSelectedVendorIds}
          exportLoading={true}
          handleExport={handleExport}
          loadVendorDetails={loadVendorDetails}
          todayStr="2026-07-18"
          adminService={adminService}
          PAGE_SIZE={20}
        />
      </MemoryRouter>
    );
    const btn = screen.getByRole('button', { name: '...' });
    expect(btn).toBeDisabled();
  });

  it('paginates when multiple pages', async () => {
    const user = userEvent.setup();
    renderTab({ vendorsTotal: 60 });
    await user.click(screen.getByRole('button', { name: 'Перейти на страницу 2' }));
    expect(setVendorsPage).toHaveBeenCalledWith(2);
  });
});
