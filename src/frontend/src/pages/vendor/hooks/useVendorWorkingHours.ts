import { useState, useEffect } from 'react';
import { restaurantService } from '@shared/services/restaurantService';
import { translateApiError } from '@shared/utils/translateApiError';
import { weekdaysShort } from '@shared/utils/datetime';
import { t } from '@shared/i18n/useTranslation';
import type { Restaurant } from '@shared/types/models';

export interface WorkingHoursRow {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

const getErrorStatus = (err: unknown): number | undefined => {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const { response } = err as { response?: unknown };
    if (typeof response === 'object' && response !== null && 'status' in response) {
      const { status } = response as { status?: unknown };
      if (typeof status === 'number') return status;
    }
  }
  return undefined;
};

const toHHMM = (time: string | null | undefined): string => (time ? time.slice(0, 5) : '00:00');

const sortByWeekday = <T extends { day_of_week: number }>(rows: readonly T[]): T[] =>
  [...rows].sort((a, b) => a.day_of_week - b.day_of_week);

const buildDefaultHours = (): WorkingHoursRow[] =>
  weekdaysShort().map((_, i: number) => ({
    day_of_week: i,
    open_time: '09:00',
    close_time: '22:00',
    is_closed: false,
  }));

interface UseVendorWorkingHoursParams {
  activeTab: string;
  selectedRestaurant: Restaurant | null;
}

export const useVendorWorkingHours = ({ activeTab, selectedRestaurant }: UseVendorWorkingHoursParams) => {
  const [workingHours, setWorkingHours] = useState<WorkingHoursRow[]>([]);
  const [workingHoursLoading, setWorkingHoursLoading] = useState(false);
  const [workingHoursSaved, setWorkingHoursSaved] = useState(false);
  const [workingHoursError, setWorkingHoursError] = useState('');

  useEffect(() => {
    if (activeTab === 'schedule' && selectedRestaurant) {
      setWorkingHoursLoading(true);
      setWorkingHoursError('');
      void (async () => {
        try {
          const response = await restaurantService.getWorkingHours(selectedRestaurant.id);
          const savedHours = Array.isArray(response.data.data) ? response.data.data : [];
          setWorkingHours(savedHours.length === 0 ? buildDefaultHours() : sortByWeekday(savedHours));
        } catch (error) {
          if (getErrorStatus(error) !== 404) {
            setWorkingHoursError(t('vendor.schedule.errors.loadFailed'));
          }
          setWorkingHours(buildDefaultHours());
        } finally {
          setWorkingHoursLoading(false);
        }
      })();
    }
  }, [activeTab, selectedRestaurant]);

  const handleSaveWorkingHours = async () => {
    if (!selectedRestaurant) return;
    setWorkingHoursLoading(true);
    setWorkingHoursError('');
    setWorkingHoursSaved(false);
    const payload = workingHours.map((row) => ({
      day_of_week: row.day_of_week,
      open_time: toHHMM(row.open_time),
      close_time: toHHMM(row.close_time),
      is_closed: row.is_closed,
    }));
    try {
      const response = await restaurantService.setWorkingHours(selectedRestaurant.id, payload);
      const savedHours = Array.isArray(response.data.data) ? response.data.data : [];
      if (savedHours.length > 0) {
        setWorkingHours(sortByWeekday(savedHours));
      }
      setWorkingHoursSaved(true);
      setTimeout(() => { setWorkingHoursSaved(false); }, 2000);
    } catch (err) {
      setWorkingHoursError(translateApiError(err, t('vendor.schedule.errors.saveFailed')));
    } finally {
      setWorkingHoursLoading(false);
    }
  };

  return {
    workingHours,
    setWorkingHours,
    workingHoursLoading,
    workingHoursSaved,
    workingHoursError,
    handleSaveWorkingHours,
  };
};
