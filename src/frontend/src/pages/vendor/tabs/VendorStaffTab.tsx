import type { Dispatch, SetStateAction } from 'react';
import { CheckIcon, TrashIcon, XIcon } from '@phosphor-icons/react';
import { EmptyState } from '@shared/components/EmptyState/EmptyState';
import { Pagination } from '@shared/components/Pagination/Pagination';
import { staffStatusLabel } from '@shared/utils/locales';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { StaffMember, StaffRequest, StaffRequestStatus } from '@shared/types/models';
import type { StaffSubTab } from '../hooks/useVendorStaff';

interface VendorStaffTabProps {
  staffSubTab: StaffSubTab;
  setStaffSubTab: Dispatch<SetStateAction<StaffSubTab>>;
  staffMembers: StaffMember[];
  staffMembersTotal: number;
  staffMembersPage: number;
  setStaffMembersPage: Dispatch<SetStateAction<number>>;
  staffMemberRemoving: string | null;
  handleRemoveStaffMember: (profileId: string) => void;
  staffRequests: StaffRequest[];
  staffTotal: number;
  staffPage: number;
  setStaffPage: Dispatch<SetStateAction<number>>;
  staffDecisionLoading: string | null;
  handleStaffDecision: (requestId: string, status: StaffRequestStatus) => void;
}

export function VendorStaffTab({
  staffSubTab,
  setStaffSubTab,
  staffMembers,
  staffMembersTotal,
  staffMembersPage,
  setStaffMembersPage,
  staffMemberRemoving,
  handleRemoveStaffMember,
  staffRequests,
  staffTotal,
  staffPage,
  setStaffPage,
  staffDecisionLoading,
  handleStaffDecision,
}: VendorStaffTabProps) {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
        <button
          className={`btn btn-sm ${staffSubTab === 'members' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setStaffSubTab('members'); }}
        >
          {t('vendor.staff.tabs.members')}
        </button>
        <button
          className={`btn btn-sm ${staffSubTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setStaffSubTab('requests'); }}
        >
          {t('vendor.staff.tabs.requests')}
        </button>
      </div>

      {staffSubTab === 'members' && (
        <>
          {staffMembers.length === 0 ? (
            <EmptyState title={t('vendor.staff.emptyMembersTitle')} subtitle={t('vendor.staff.emptyMembersSubtitle')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {staffMembers.map((m) => (
                <div key={m.id} className="staff-request-card">
                  <div className="staff-request-info">
                    <div style={{ fontWeight: 700 }}>
                      {m.user_name || t('vendor.staff.idFallback', { id: m.user_id.slice(0, 8) })}
                    </div>
                    <div style={{ fontSize: "var(--text-base)", color: 'var(--text-3)' }}>
                      {m.user_phone || t('vendor.staff.noPhone')}
                      {m.restaurant_name && ` · ${m.restaurant_name}`}
                    </div>
                  </div>
                  <div className="staff-request-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--error)' }}
                      disabled={staffMemberRemoving === m.id}
                      onClick={() => { handleRemoveStaffMember(m.id); }}
                    >
                      {staffMemberRemoving === m.id ? '...' : <TrashIcon size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {staffMembersTotal > 20 && (
            <Pagination
              page={staffMembersPage}
              totalPages={Math.ceil(staffMembersTotal / 20)}
              onPageChange={setStaffMembersPage}
            />
          )}
        </>
      )}

      {staffSubTab === 'requests' && (
        <>
          {!Array.isArray(staffRequests) || staffRequests.length === 0 ? (
            <EmptyState title={t('vendor.staff.emptyRequestsTitle')} subtitle={t('vendor.staff.emptyRequestsSubtitle')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {staffRequests.map((req) => (
                <div key={req.id} className="staff-request-card">
                  <div className="staff-request-info">
                    <div style={{ fontWeight: 700 }}>
                      {t('vendor.staff.requestUser', { id: req.user_id.slice(0, 8) })}
                    </div>
                    <span className="order-status-badge pending">
                      {staffStatusLabel(req.status)}
                    </span>
                  </div>
                  {req.status === 'PENDING' && (
                    <div className="staff-request-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={staffDecisionLoading === req.id}
                        onClick={() => { handleStaffDecision(req.id, 'ACCEPTED'); }}
                      >
                        <CheckIcon size={16} />
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={staffDecisionLoading === req.id}
                        onClick={() => { handleStaffDecision(req.id, 'REJECTED'); }}
                      >
                        <XIcon size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {staffTotal > 20 && (
            <Pagination
              page={staffPage}
              totalPages={Math.ceil(staffTotal / 20)}
              onPageChange={setStaffPage}
            />
          )}
        </>
      )}
    </div>
  );
}
