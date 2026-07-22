import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useRestaurantStore } from '@shared/store/useRestaurantStore';
import { vendorService } from '@shared/services/vendorService';
import { restaurantService } from '@shared/services/restaurantService';
import { translateApiError } from '@shared/utils/translateApiError';
import { logError } from '@shared/utils/logError';
import { weekdaysShort } from '@shared/utils/datetime';
import { t } from '@shared/i18n/useTranslation';
import type {
  Restaurant,
  RestaurantCreate,
  RestaurantUpdate,
  Schemas,
} from '@shared/types/models';

export type VendorProfile = Schemas['VendorResponse'];

const DEFAULT_PREP_MINUTES = 15;

export interface WorkingHoursRow {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface NewRestaurantForm {
  name: string;
  address: string;
  avg_prep_time_minutes: number | string;
  max_active_orders: number | string;
}

interface UseVendorRestaurantsParams {
  activeTab: string;
  setFormLoading: (loading: boolean) => void;
  setFormError: (error: string) => void;
}

const fromDateTimeLocalValue = (value: string | null | undefined): string | null =>
  value ? new Date(value).toISOString() : null;

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

const validateRestaurantPatch = (patch: Restaurant): string => {
  if (!patch.name.trim()) return t('vendor.settings.errors.nameRequired');
  if (!patch.address.trim()) return t('vendor.settings.errors.addressRequired');
  return '';
};

const buildRestaurantUpdatePayload = (patch: Restaurant): RestaurantUpdate => ({
  name: patch.name.trim(),
  address: patch.address.trim(),
  description: patch.description?.trim() || null,
  is_open: patch.is_open,
  is_hiring: patch.is_hiring,
  is_ordering_paused: patch.is_ordering_paused,
  ordering_paused_until: patch.ordering_paused_until
    ? fromDateTimeLocalValue(patch.ordering_paused_until)
    : null,
  avg_prep_time_minutes: patch.avg_prep_time_minutes || DEFAULT_PREP_MINUTES,
  max_active_orders: patch.max_active_orders ? patch.max_active_orders : null,
  ...(patch.photo_url != null ? { photo_url: patch.photo_url } : {}),
});

const buildDefaultHours = (): WorkingHoursRow[] =>
  weekdaysShort().map((_, i: number) => ({
    day_of_week: i,
    open_time: '09:00',
    close_time: '22:00',
    is_closed: false,
  }));

export const useVendorRestaurants = ({ activeTab, setFormLoading, setFormError }: UseVendorRestaurantsParams) => {
  const {
    restaurants,
    fetchMyRestaurants,
    fetchMenu,
    loading,
    addMenuItem,
    menus,
  } = useRestaurantStore(
    useShallow((s) => ({
      restaurants: s.restaurants,
      fetchMyRestaurants: s.fetchMyRestaurants,
      fetchMenu: s.fetchMenu,
      loading: s.myLoading,
      addMenuItem: s.addMenuItem,
      menus: s.menus,
    }))
  );

  const { createRestaurant } = useRestaurantStore(
    useShallow((s) => ({ createRestaurant: s.createRestaurant }))
  );

  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);

  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState<NewRestaurantForm>({
    name: '',
    address: '',
    avg_prep_time_minutes: DEFAULT_PREP_MINUTES,
    max_active_orders: '',
  });
  const [editRestaurant, setEditRestaurant] = useState<Restaurant | null>(null);

  const [workingHours, setWorkingHours] = useState<WorkingHoursRow[]>([]);
  const [workingHoursLoading, setWorkingHoursLoading] = useState(false);
  const [workingHoursSaved, setWorkingHoursSaved] = useState(false);
  const [workingHoursError, setWorkingHoursError] = useState('');

  useEffect(() => {
    void fetchMyRestaurants();
    void (async () => {
      try {
        const response = await vendorService.getMyProfile();
        setVendorProfile(response.data.data);
      } catch (error) {
        logError('useVendorRestaurants.getMyProfile', error);
      }
    })();
  }, [fetchMyRestaurants]);

  useEffect(() => {
    if (selectedRestaurant) {
      void fetchMenu(selectedRestaurant.id);
      setEditRestaurant(null);
    }
  }, [selectedRestaurant, fetchMenu]);

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

  const handleCreateRestaurant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const payload: RestaurantCreate = {
        name: newRestaurant.name,
        address: newRestaurant.address,
        is_hiring: true,
        is_open: true,
        avg_prep_time_minutes: Number(newRestaurant.avg_prep_time_minutes) || DEFAULT_PREP_MINUTES,
        max_active_orders: newRestaurant.max_active_orders
          ? Number(newRestaurant.max_active_orders)
          : null,
      };
      const created = await createRestaurant(payload);
      setSelectedRestaurant(created);
      setShowAddRestaurant(false);
      setNewRestaurant({ name: '', address: '', avg_prep_time_minutes: DEFAULT_PREP_MINUTES, max_active_orders: '' });
    } catch (error) {
      setFormError(translateApiError(error, t('vendor.settings.errors.createFailed')));
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateRestaurant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormLoading(true);
    setFormError('');
    const patch = editRestaurant ?? selectedRestaurant;
    if (!patch || !selectedRestaurant) {
      setFormLoading(false);
      return;
    }
    const validationError = validateRestaurantPatch(patch);
    if (validationError) {
      setFormError(validationError);
      setFormLoading(false);
      return;
    }
    const payload = buildRestaurantUpdatePayload(patch);
    try {
      await restaurantService.update(selectedRestaurant.id, payload);
      await fetchMyRestaurants();
      setSelectedRestaurant({ ...selectedRestaurant, ...payload } as Restaurant);
      setEditRestaurant(null);
    } catch (err) {
      setFormError(translateApiError(err, t('vendor.settings.errors.updateFailed')));
    } finally {
      setFormLoading(false);
    }
  };

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
    restaurants,
    loading,
    selectedRestaurant, setSelectedRestaurant,
    vendorProfile,

    showAddRestaurant, setShowAddRestaurant,
    newRestaurant, setNewRestaurant,
    editRestaurant, setEditRestaurant,
    handleCreateRestaurant,
    handleUpdateRestaurant,

    workingHours, setWorkingHours,
    workingHoursLoading,
    workingHoursSaved,
    workingHoursError,
    handleSaveWorkingHours,

    fetchMenu,
    addMenuItem,
    menus,
  };
};
