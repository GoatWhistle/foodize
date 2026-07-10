import type { Dispatch, SetStateAction } from 'react';
import { DownloadSimple } from '@phosphor-icons/react';
import Pagination from '@shared/components/Pagination/Pagination';
import EmptyState from '@shared/components/EmptyState/EmptyState';
import type { adminService as adminServiceType } from '../../../services/adminService';
import type { AdminVendor, VendorFilters } from '../hooks/useAdminVendors';

interface AdminVendorsTabProps {
  vendors: AdminVendor[];
  vendorsLoading: boolean;
  vendorsTotal: number;
  vendorsPage: number;
  setVendorsPage: Dispatch<SetStateAction<number>>;
  vendorSearchRaw: string;
  setVendorSearchRaw: Dispatch<SetStateAction<string>>;
  vendorFilters: VendorFilters;
  setVendorFilters: Dispatch<SetStateAction<VendorFilters>>;
  selectedVendorIds: Set<string>;
  setSelectedVendorIds: Dispatch<SetStateAction<Set<string>>>;
  exportLoading: boolean;
  handleExport: (exportFn: () => Promise<{ data: Blob }>, filename: string) => void;
  loadVendorDetails: (id: string) => void;
  todayStr: string;
  adminService: typeof adminServiceType;
  PAGE_SIZE: number;
}

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  boxShadow: 'var(--shadow-sm)',
};

const wideFilterGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 8,
  alignItems: 'center',
};

const filterControlStyle = {
  minWidth: 0,
  height: 48,
  paddingTop: 11,
  paddingBottom: 11,
  fontSize: '0.86rem',
  lineHeight: 1.2,
};

const selectFilterStyle = {
  ...filterControlStyle,
  paddingRight: 34,
  backgroundPosition: 'right 10px center',
};

export default function AdminVendorsTab({
  vendors,
  vendorsLoading,
  vendorsTotal,
  vendorsPage,
  setVendorsPage,
  vendorSearchRaw,
  setVendorSearchRaw,
  vendorFilters,
  setVendorFilters,
  selectedVendorIds,
  setSelectedVendorIds,
  exportLoading,
  handleExport,
  loadVendorDetails,
  todayStr,
  adminService,
  PAGE_SIZE,
}: AdminVendorsTabProps) {
  const isEmpty = !Array.isArray(vendors) || vendors.length === 0;

  if (vendorsLoading && isEmpty) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: 16,
            }}
          >
            <div className="skeleton" style={{ width: '30%', height: 16, marginBottom: 8, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: '70%', height: 12, borderRadius: 4 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={vendorsLoading ? 'loading-dim' : undefined}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div style={wideFilterGridStyle}>
        <input
          className="form-input"
          style={filterControlStyle}
          placeholder="Вендор или телефон"
          value={vendorSearchRaw}
          onChange={(event) => {
            setVendorsPage(1);
            setVendorSearchRaw(event.target.value);
          }}
        />
        <select
          className="form-input"
          style={selectFilterStyle}
          value={vendorFilters.approval_status}
          onChange={(event) => {
            setVendorsPage(1);
            setVendorFilters((prev) => ({ ...prev, approval_status: event.target.value }));
          }}
        >
          <option value="">Все статусы</option>
          <option value="PENDING">На проверке</option>
          <option value="APPROVED">Одобрен</option>
          <option value="REJECTED">Отклонён</option>
        </select>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.82rem',
            color: 'var(--text-3)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={vendors.length > 0 && selectedVendorIds.size === vendors.length}
            onChange={(e) =>
              setSelectedVendorIds(
                e.target.checked ? new Set(vendors.map((v) => v.id)) : new Set()
              )
            }
          />
          Выбрать все
        </label>
        <button
          className="btn btn-secondary btn-sm"
          disabled={exportLoading}
          onClick={() =>
            handleExport(adminService.exportVendorsCSV, `вендоры_${todayStr}.csv`)
          }
        >
          {exportLoading ? '...' : <><DownloadSimple size={16} weight="bold" /> CSV</>}
        </button>
      </div>

      {vendors.map((vendor) => (
        <div key={vendor.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={selectedVendorIds.has(vendor.id)}
            onChange={(e) => {
              setSelectedVendorIds((prev) => {
                const next = new Set(prev);
                if (e.target.checked) next.add(vendor.id);
                else next.delete(vendor.id);
                return next;
              });
            }}
            style={{ flexShrink: 0 }}
          />
          <button
            type="button"
            onClick={() => loadVendorDetails(vendor.id)}
            style={{
              ...cardStyle,
              padding: 16,
              flex: 1,
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 14,
            }}
          >
            <div>
              <div style={{ color: 'var(--text-1)', fontWeight: 900 }}>
                {vendor.name || 'Вендор без имени'}
              </div>
              <div style={{ color: 'var(--text-3)', fontSize: '0.84rem', marginTop: 4 }}>
                {vendor.phone_number || 'Нет телефона'}
              </div>
            </div>
            <span className="order-status-badge pending">
              {vendor.restaurants_count || 0} заведений
            </span>
          </button>
        </div>
      ))}

      {isEmpty && (
        <EmptyState
          title="Вендоров пока нет"
          subtitle="Для выбранных фильтров нет результатов"
        />
      )}

      <Pagination
        page={vendorsPage}
        totalPages={Math.ceil(vendorsTotal / PAGE_SIZE)}
        onPageChange={setVendorsPage}
      />
    </div>
  );
}
