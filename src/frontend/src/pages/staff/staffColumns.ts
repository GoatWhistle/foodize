import { CookingPotIcon, CheckCircleIcon, ClockIcon } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { getOrderStatusStyle } from '@shared/utils/orderStatus';
import type { OrderStatus } from '@shared/types/models';

export interface StaffColumnDef {
  id: 'pending' | 'accepted' | 'ready';
  labelKey: string;
  statuses: OrderStatus[];
  color: string;
  Icon: Icon;
}

export const COLUMN_DEFS: StaffColumnDef[] = [
  { id: 'pending', labelKey: 'staff.columns.pending', statuses: ['PENDING'], color: getOrderStatusStyle('PENDING').solid, Icon: ClockIcon },
  { id: 'accepted', labelKey: 'staff.columns.accepted', statuses: ['ACCEPTED'], color: getOrderStatusStyle('ACCEPTED').solid, Icon: CookingPotIcon },
  { id: 'ready', labelKey: 'staff.columns.ready', statuses: ['READY'], color: getOrderStatusStyle('READY').solid, Icon: CheckCircleIcon },
];
