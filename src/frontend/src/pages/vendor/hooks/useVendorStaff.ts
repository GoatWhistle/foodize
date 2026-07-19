import { useState, useEffect } from 'react';
import { vendorService } from '@shared/services/vendorService';
import { logError } from '@shared/utils/logError';
import type { StaffMember, StaffRequest, StaffRequestStatus } from '@shared/types/models';

export type StaffSubTab = 'members' | 'requests';

const readTotal = (body: { pagination?: { total?: number } }, fallback: number): number =>
  body.pagination?.total ?? fallback;

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
    void (async () => {
      try {
        const response = await vendorService.getStaffRequests({ page: staffPage, size: 20 });
        const list = Array.isArray(response.data.data) ? response.data.data : [];
        setStaffRequests(list);
        setStaffTotal(readTotal(response.data, list.length));
      } catch (error) {
        logError('useVendorStaff.getStaffRequests', error);
      }
    })();
  }, [staffPage]);

  useEffect(() => {
    void (async () => {
      try {
        const response = await vendorService.getStaffMembers({ page: staffMembersPage, size: 20 });
        const list = Array.isArray(response.data.data) ? response.data.data : [];
        setStaffMembers(list);
        setStaffMembersTotal(readTotal(response.data, list.length));
      } catch (error) {
        logError('useVendorStaff.getStaffMembers', error);
      }
    })();
  }, [staffMembersPage]);

  const handleStaffDecision = async (requestId: string, status: StaffRequestStatus) => {
    setStaffDecisionLoading(requestId);
    try {
      await vendorService.updateStaffStatus(requestId, status);
      setStaffRequests((prev) =>
        prev.map((request) => (request.id === requestId ? { ...request, status } : request))
      );
      if (status === 'ACCEPTED') {
        try {
          const response = await vendorService.getStaffMembers({ page: 1, size: 20 });
          const list = Array.isArray(response.data.data) ? response.data.data : [];
          setStaffMembers(list);
          setStaffMembersTotal(readTotal(response.data, list.length));
        } catch (error) {
          logError('useVendorStaff.refreshMembers', error);
        }
      }
    } catch (error) {
      logError('useVendorStaff.handleStaffDecision', error);
    } finally {
      setStaffDecisionLoading(null);
    }
  };

  const handleRemoveStaffMember = async (profileId: string) => {
    if (!window.confirm('Уволить сотрудника?')) return;
    setStaffMemberRemoving(profileId);
    try {
      await vendorService.removeStaffMember(profileId);
      setStaffMembers((prev) => prev.filter((member) => member.id !== profileId));
      setStaffMembersTotal((total) => total - 1);
    } catch (error) {
      logError('useVendorStaff.handleRemoveStaffMember', error);
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
