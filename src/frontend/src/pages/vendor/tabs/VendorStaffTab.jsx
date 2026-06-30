import { Check, Trash, X } from '@phosphor-icons/react';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import { STAFF_STATUS_RU, translate } from '../../../utils/locales';

export default function VendorStaffTab({
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
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
        <button
          className={`btn btn-sm ${staffSubTab === 'members' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStaffSubTab('members')}
        >
          Сотрудники
        </button>
        <button
          className={`btn btn-sm ${staffSubTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStaffSubTab('requests')}
        >
          Заявки
        </button>
      </div>

      {staffSubTab === 'members' && (
        <>
          {staffMembers.length === 0 ? (
            <EmptyState title="Нет сотрудников" subtitle="Принятые сотрудники появятся здесь" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {staffMembers.map((m) => (
                <div key={m.id} className="staff-request-card">
                  <div className="staff-request-info">
                    <div style={{ fontWeight: 700 }}>
                      {m.user_name || `ID: ${m.user_id.slice(0, 8)}`}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                      {m.user_phone || 'Нет телефона'}
                      {m.restaurant_name && ` · ${m.restaurant_name}`}
                    </div>
                  </div>
                  <div className="staff-request-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--error)' }}
                      disabled={staffMemberRemoving === m.id}
                      onClick={() => handleRemoveStaffMember(m.id)}
                    >
                      {staffMemberRemoving === m.id ? '...' : <Trash size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {staffMembersTotal > 20 && (
            <Pagination
              total={staffMembersTotal}
              page={staffMembersPage}
              size={20}
              onChange={setStaffMembersPage}
            />
          )}
        </>
      )}

      {staffSubTab === 'requests' && (
        <>
          {!Array.isArray(staffRequests) || staffRequests.length === 0 ? (
            <EmptyState title="Нет заявок" subtitle="Заявки появятся здесь" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {staffRequests.map((req) => (
                <div key={req.id} className="staff-request-card">
                  <div className="staff-request-info">
                    <div style={{ fontWeight: 700 }}>
                      Пользователь #{req.user_id.slice(0, 8)}
                    </div>
                    <span className="order-status-badge pending">
                      {translate(STAFF_STATUS_RU, req.status)}
                    </span>
                  </div>
                  {req.status === 'PENDING' && (
                    <div className="staff-request-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={staffDecisionLoading === req.id}
                        onClick={() => handleStaffDecision(req.id, 'ACCEPTED')}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={staffDecisionLoading === req.id}
                        onClick={() => handleStaffDecision(req.id, 'REJECTED')}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {staffTotal > 20 && (
            <Pagination
              total={staffTotal}
              page={staffPage}
              size={20}
              onChange={setStaffPage}
            />
          )}
        </>
      )}
    </div>
  );
}
