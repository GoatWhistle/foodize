import type { Order, OrderItem, OrderItemOption } from '@shared/types/models';

export interface EtaPayload {
  estimated_ready_at?: string;
  estimated_ready_in_minutes?: number;
}

export type StaffOrderItem = Omit<OrderItem, 'selected_options'> & {
  name?: string;
  selected_options?: OrderItemOption[];
};

export type StaffOrder = Omit<Order, 'items'> & { items: StaffOrderItem[] };
