import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { AdminSidebar } from '../../../../pages/admin/components/AdminSidebar';
import { t } from '@shared/i18n/useTranslation';

const Harness = ({
  setActiveTab = vi.fn(),
  initialActive = 'stats',
  initialOpen = true,
}: {
  setActiveTab?: (id: string) => void;
  initialActive?: string;
  initialOpen?: boolean;
}) => {
  const [activeTab, setTab] = useState(initialActive);
  const [entitiesOpen, setEntitiesOpen] = useState(initialOpen);
  return (
    <AdminSidebar
      activeTab={activeTab}
      setActiveTab={(id) => {
        setTab(id);
        setActiveTab(id);
      }}
      entitiesOpen={entitiesOpen}
      setEntitiesOpen={setEntitiesOpen}
    />
  );
};

describe('AdminSidebar', () => {
  it('renders sidebar heading and entity toggle', () => {
    render(<Harness />);
    expect(screen.getByText(t('admin.sidebar.title'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(t('admin.sidebar.entities')) })).toBeInTheDocument();
  });

  it('marks the active tab as selected', () => {
    render(<Harness initialActive="stats" />);
    const stats = screen.getByRole('tab', { name: t('admin.sidebar.tabs.stats') });
    expect(stats).toHaveAttribute('aria-selected', 'true');
  });

  it('calls setActiveTab when a tab button is clicked', async () => {
    const user = userEvent.setup();
    const setActiveTab = vi.fn();
    render(<Harness setActiveTab={setActiveTab} />);
    await user.click(screen.getByRole('tab', { name: t('admin.sidebar.tabs.users') }));
    expect(setActiveTab).toHaveBeenCalledWith('users');
  });

  it('activates a non-entity tab', async () => {
    const user = userEvent.setup();
    const setActiveTab = vi.fn();
    render(<Harness setActiveTab={setActiveTab} />);
    await user.click(screen.getByRole('tab', { name: t('admin.sidebar.tabs.finance') }));
    expect(setActiveTab).toHaveBeenCalledWith('finance');
  });

  it('collapses and expands the entities group', async () => {
    const user = userEvent.setup();
    render(<Harness initialOpen />);
    expect(screen.getByRole('tab', { name: t('admin.sidebar.tabs.users') })).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: new RegExp(t('admin.sidebar.entities')) });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('tab', { name: t('admin.sidebar.tabs.users') })).toBeNull();
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('tab', { name: t('admin.sidebar.tabs.users') })).toBeInTheDocument();
  });
});
