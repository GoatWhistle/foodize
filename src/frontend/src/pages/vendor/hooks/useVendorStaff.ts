import { useState, useEffect } from 'react';
import { vendorService } from '@shared/services/vendorService';
import type { StaffMember, StaffRequest, StaffRequestStatus } from '@shared/types/models';

export type StaffSubTab = 'members' | 'requests';

export const useVendorStaff = () => {
  const [staffRequests, setStaffRequests] = useState<StaffRequest[]>([]);
  const [staffPage, setStaffPage] = useState(1);
  const [staffTotal, setStaffTotal] = useState(0);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [staffMembersPage, setStaffMembersPage] = useState(1);
  const [staffMembersTotal, setStaffMembersTotal] = useState(0);
  const [staffSubTab, setStaffSubTab] = useState<StaffSubTab>('members');
  const [staffMemberRemoving, setStaffMemberRemoving] = useState<string | null>(null);
  const [staffDecisionLoading, setStaffDecisionLoading] = useState<string | null>(null);

  useEffect(() => {
    vendorService
      .getStaffRequests({ page: staffPage, size: 20 })
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setStaffRequests(list);
        setStaffTotal(res.data?.pagination?.total || list.length);
      })
      .catch(() => {});
  }, [staffPage]);

  useEffect(() => {
    vendorService
      .getStaffMembers({ page: staffMembersPage, size: 20 })
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setStaffMembers(list);
        setStaffMembersTotal(res.data?.pagination?.total || list.length);
      })
      .catch(() => {});
  }, [staffMembersPage]);

  const handleStaffDecision = async (requestId: string, status: StaffRequestStatus) => {
    setStaffDecisionLoading(requestId);
    try {
      await vendorService.updateStaffStatus(requestId, status);
      setStaffRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status } : r))
      );
      if (status === 'ACCEPTED') {
        vendorService
          .getStaffMembers({ page: 1, size: 20 })
          .then((res) => {
            const list = Array.isArray(res.data?.data) ? res.data.data : [];
            setStaffMembers(list);
            setStaffMembersTotal(res.data?.pagination?.total || list.length);
          })
          .catch(() => {});
      }
    } catch {
    } finally {
      setStaffDecisionLoading(null);
    }
  };

  const handleRemoveStaffMember = async (profileId: string) => {
    if (!window.confirm('Уволить сотрудника?')) return;
    setStaffMemberRemoving(profileId);
    try {
      await vendorService.removeStaffMember(profileId);
      setStaffMembers((prev) => prev.filter((m) => m.id !== profileId));
      setStaffMembersTotal((t) => t - 1);
    } catch {
    } finally {
      setStaffMemberRemoving(null);
    }
  };

  return {
    staffRequests,
    staffPage, setStaffPage,
    staffTotal,
    staffMembers,
    staffMembersPage, setStaffMembersPage,
    staffMembersTotal,
    staffSubTab, setStaffSubTab,
    staffMemberRemoving,
    staffDecisionLoading,
    handleStaffDecision,
    handleRemoveStaffMember,
  };
};
