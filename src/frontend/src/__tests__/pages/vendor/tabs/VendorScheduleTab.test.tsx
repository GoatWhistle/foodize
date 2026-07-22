import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { VendorScheduleTab } from '../../../../pages/vendor/tabs/VendorScheduleTab';
import type { WorkingHoursRow } from '../../../../pages/vendor/hooks/useVendorRestaurants';
import { at } from '../../../testUtils';
import { t } from '@shared/i18n/useTranslation';

const makeRows = (): WorkingHoursRow[] =>
  Array.from({ length: 7 }, (_, i) => ({
    day_of_week: i,
    open_time: '09:00',
    close_time: '22:00',
    is_closed: i === 6,
  }));

const Harness = ({
  loading = false,
  saved = false,
  error = '',
  onSave = vi.fn(),
  rows = makeRows(),
}: {
  loading?: boolean;
  saved?: boolean;
  error?: string;
  onSave?: () => void;
  rows?: WorkingHoursRow[];
}) => {
  const [workingHours, setWorkingHours] = useState<WorkingHoursRow[]>(rows);
  return (
    <VendorScheduleTab
      workingHours={workingHours}
      setWorkingHours={setWorkingHours}
      workingHoursLoading={loading}
      workingHoursSaved={saved}
      workingHoursError={error}
      handleSaveWorkingHours={onSave}
    />
  );
};

describe('VendorScheduleTab', () => {
  it('renders 7 rows and title', () => {
    render(<Harness />);
    expect(screen.getByText(t('vendor.schedule.sectionTitle'))).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('09:00')).toHaveLength(7);
  });

  it('shows skeleton while loading with no rows', () => {
    render(<Harness loading rows={[]} />);
    expect(screen.queryAllByDisplayValue('09:00')).toHaveLength(0);
  });

  it('shows error message', () => {
    render(<Harness error="Ошибка расписания" />);
    expect(screen.getByText('Ошибка расписания')).toBeInTheDocument();
  });

  it('edits open and close time', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const openInputs = screen.getAllByDisplayValue('09:00');
    await user.clear(at(openInputs, 0));
    await user.type(at(openInputs, 0), '10:00');
    expect((openInputs[0] as HTMLInputElement).value).toBe('10:00');

    const closeInputs = screen.getAllByDisplayValue('22:00');
    await user.clear(at(closeInputs, 0));
    await user.type(at(closeInputs, 0), '23:00');
    expect((closeInputs[0] as HTMLInputElement).value).toBe('23:00');
  });

  it('toggles is_closed disabling the row time inputs', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(at(checkboxes, 0));
    expect(checkboxes[0]).toBeChecked();
  });

  it('calls save handler', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<Harness onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: t('common.actions.save') }));
    expect(onSave).toHaveBeenCalled();
  });

  it('shows saved state', () => {
    render(<Harness saved />);
    expect(screen.getByRole('button', { name: t('common.states.saved') })).toBeInTheDocument();
  });

  it('shows saving state and disables button', () => {
    render(<Harness loading />);
    expect(screen.getByRole('button', { name: t('vendor.schedule.saving') })).toBeDisabled();
  });
});
