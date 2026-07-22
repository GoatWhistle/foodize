import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { StaffRequest } from '@shared/types/models';
import { t } from '@shared/i18n/useTranslation';

vi.mock('@shared/services/staffService', () => ({
  staffService: {
    getMyApplication: vi.fn(),
  },
}));

const { staffService } = await import('@shared/services/staffService');
const { ApplicationStatus } = await import(
  '../../../../pages/staff/components/ApplicationStatus'
);

const makeApp = (status: string): StaffRequest =>
  ({ id: 'abcdef1234567890', status }) as unknown as StaffRequest;

const resolveApp = (app: StaffRequest | null) =>
  vi.mocked(staffService.getMyApplication).mockResolvedValue({
    data: { data: app },
  } as unknown as Awaited<ReturnType<typeof staffService.getMyApplication>>);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ApplicationStatus', () => {
  it('shows spinner while loading', () => {
    vi.mocked(staffService.getMyApplication).mockReturnValue(new Promise(() => {}) as never);
    const { container } = render(<ApplicationStatus />);
    expect(container.querySelector('.spinner')).not.toBeNull();
  });

  it('renders PENDING status config', async () => {
    resolveApp(makeApp('PENDING'));
    render(<ApplicationStatus />);
    expect(await screen.findByText(t('staff.application.pending.title'))).toBeInTheDocument();
    expect(screen.getByText(t('staff.application.number', { id: 'abcdef12' }))).toBeInTheDocument();
  });

  it('renders ACCEPTED status config', async () => {
    resolveApp(makeApp('ACCEPTED'));
    render(<ApplicationStatus />);
    expect(await screen.findByText(t('staff.application.accepted.title'))).toBeInTheDocument();
  });

  it('renders REJECTED status config', async () => {
    resolveApp(makeApp('REJECTED'));
    render(<ApplicationStatus />);
    expect(await screen.findByText(t('staff.application.rejected.title'))).toBeInTheDocument();
  });

  it('renders empty state when no application', async () => {
    resolveApp(null);
    render(<ApplicationStatus />);
    expect(await screen.findByText(t('staff.application.noProfileTitle'))).toBeInTheDocument();
  });

  it('renders empty state when request fails', async () => {
    vi.mocked(staffService.getMyApplication).mockRejectedValue(new Error('boom'));
    render(<ApplicationStatus />);
    expect(await screen.findByText(t('staff.application.noProfileTitle'))).toBeInTheDocument();
  });
});
