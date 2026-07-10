import { Package } from '@phosphor-icons/react';
import { CATEGORY_RU, translate } from '@shared/utils/locales';
import type { Order } from '@shared/types/models';

import { optionLabel } from './orderDetails.helpers';

export const OrderItemsList = ({ order }: { order: Order }) => (
  <div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontWeight: 800,
        marginBottom: 10,
      }}
    >
      <Package size={18} color="var(--fire)" />
      Состав заказа
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {order.items?.map((item) => (
        <div
          key={item.id}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 800 }}>
                {item.menu_item_name ?? 'Позиция'}
              </div>
              <div
                style={{
                  color: 'var(--text-3)',
                  fontSize: '0.74rem',
                  marginTop: 2,
                }}
              >
                {item.menu_item_category
                  ? translate(CATEGORY_RU, item.menu_item_category)
                  : '—'}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontWeight: 800 }}>
              ×{item.quantity}
              <div
                style={{
                  color: 'var(--text-3)',
                  fontSize: '0.74rem',
                  marginTop: 2,
                }}
              >
                {item.price_at_purchase} ₽
              </div>
            </div>
          </div>
          {item.selected_options?.length > 0 && (
            <div
              style={{
                marginTop: 8,
                color: 'var(--text-3)',
                fontSize: '0.78rem',
                lineHeight: 1.45,
              }}
            >
              {item.selected_options.map(optionLabel).join(', ')}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);
