import type { ComponentType } from 'react';
import type { IconProps } from '@phosphor-icons/react';
import { styles, type StatusStyle } from './displayBoardStyles';

type OrderId = string | number;

interface DisplayBoardColumnProps {
  title: string;
  Icon: ComponentType<IconProps>;
  ids: OrderId[];
  newIds: Set<OrderId>;
  style: StatusStyle;
}

export function DisplayBoardColumn({ title, Icon, ids, newIds, style }: DisplayBoardColumnProps) {
  return (
    <div style={{ ...styles['column'], background: style.bg }}>
      <div style={{ ...styles['columnHeader'], color: style.solid }}>
        <Icon size={30} weight="fill" />
        <span>{title}</span>
        <span style={styles['columnCount']}>{ids.length}</span>
      </div>
      <div style={styles['grid']}>
        {ids.length === 0 ? (
          <div style={styles['empty']}>
            <Icon size={48} weight="light" />
            <span style={styles['emptyText']}>Пусто</span>
          </div>
        ) : (
          ids.map((id) => (
            <div
              key={id}
              style={{
                ...styles['card'],
                borderColor: newIds.has(id) ? style.solid : 'var(--border)',
                boxShadow: newIds.has(id)
                  ? `0 0 32px ${style.border}`
                  : 'none',
                animation: newIds.has(id)
                  ? 'orderSlideIn 0.4s cubic-bezier(0.22,1,0.36,1)'
                  : undefined,
              }}
            >
              <span style={styles['cardNumber']}>{id}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
