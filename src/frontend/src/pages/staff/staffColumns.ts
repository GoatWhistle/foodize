import { CookingPotIcon, CheckCircleIcon, ClockIcon } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { getOrderStatusStyle } from '@shared/utils/orderStatus';
import type { OrderStatus } from '@shared/types/models';

export interface StaffColumnDef {
  id: 'pending' | 'accepted' | 'ready';
  label: string;
  statuses: OrderStatus[];
  color: string;
  Icon: Icon;
}

export const COLUMN_DEFS: StaffColumnDef[] = [
  { id: 'pending', label: 'Новые', statuses: ['PENDING'], color: getOrderStatusStyle('PENDING').solid, Icon: ClockIcon },
  { id: 'accepted', label: 'Принято', statuses: ['ACCEPTED'], color: getOrderStatusStyle('ACCEPTED').solid, Icon: CookingPotIcon },
  { id: 'ready', label: 'Готово', statuses: ['READY'], color: getOrderStatusStyle('READY').solid, Icon: CheckCircleIcon },
];
