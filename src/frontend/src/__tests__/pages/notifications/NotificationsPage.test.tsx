import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NotificationsPage } from '../../../pages/notifications/NotificationsPage';
import { useNotificationStore } from '../../../store/useNotificationStore';

interface SharedNotificationsProps {
  useNotificationStore: unknown;
  stickyHeader?: boolean;
  markAllReadOnOpen?: boolean;
  pageClassName?: string;
  style?: React.CSSProperties;
}

vi.mock('@shared/pages/NotificationsPage/NotificationsPage', () => ({
  NotificationsPage: (props: SharedNotificationsProps) => (
    <div
      data-testid="shared-notifications"
      data-sticky={String(props.stickyHeader)}
      data-markall={String(props.markAllReadOnOpen)}
      data-class={props.pageClassName}
      data-samestore={String(props.useNotificationStore === useNotificationStore)}
    >
      notifications
    </div>
  ),
}));

describe('NotificationsPage wrapper', () => {
  it('renders shared notifications with configured props and store', () => {
    render(<NotificationsPage />);
    const el = screen.getByTestId('shared-notifications');
    expect(el).toHaveAttribute('data-sticky', 'false');
    expect(el).toHaveAttribute('data-markall', 'true');
    expect(el).toHaveAttribute('data-class', 'page-enter');
    expect(el).toHaveAttribute('data-samestore', 'true');
  });
});
