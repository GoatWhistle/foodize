import type { Order, OrderItem } from '@shared/types/models';

export interface EtaPayload {
  estimated_ready_at?: string;
  estimated_ready_in_minutes?: number;
}

export type StaffOrderItem = OrderItem & { name?: string };

export type StaffOrder = Omit<Order, 'items'> & { items: StaffOrderItem[] };
