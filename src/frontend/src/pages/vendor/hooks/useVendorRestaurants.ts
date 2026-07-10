import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useRestaurantStore } from '@shared/store/useRestaurantStore';
import { vendorService } from '@shared/services/vendorService';
import { restaurantService } from '@shared/services/restaurantService';
import { translateApiError } from '@shared/utils/translateApiError';
import { WEEKDAYS_SHORT_RU } from '@shared/utils/datetime';
import type {
  Restaurant,
  RestaurantCreate,
  RestaurantUpdate,
  Schemas,
} from '@shared/types/models';

export type VendorProfile = Schemas['VendorResponse'];

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

const buildDefaultHours = (): WorkingHoursRow[] =>
  WEEKDAYS_SHORT_RU.map((_, i) => ({
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
      loading: s.loading,
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
    avg_prep_time_minutes: 15,
    max_active_orders: '',
  });
  const [editRestaurant, setEditRestaurant] = useState<Restaurant | null>(null);

  const [workingHours, setWorkingHours] = useState<WorkingHoursRow[]>([]);
  const [workingHoursLoading, setWorkingHoursLoading] = useState(false);
  const [workingHoursSaved, setWorkingHoursSaved] = useState(false);
  const [workingHoursError, setWorkingHoursError] = useState('');

  useEffect(() => {
    void fetchMyRestaurants();
    vendorService
      .getMyProfile()
      .then((res) => setVendorProfile(res.data?.data || null))
      .catch(() => {});
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
      restaurantService
        .getWorkingHours(selectedRestaurant.id)
        .then((res) => {
          const data = Array.isArray(res.data?.data) ? res.data.data : [];
          setWorkingHours(
            data.length === 0
              ? buildDefaultHours()
              : [...data].sort((a, b) => a.day_of_week - b.day_of_week)
          );
        })
        .catch((err: unknown) => {
          if (getErrorStatus(err) !== 404) {
            setWorkingHoursError('Не удалось загрузить расписание');
          }
          setWorkingHours(buildDefaultHours());
        })
        .finally(() => setWorkingHoursLoading(false));
    }
  }, [activeTab, selectedRestaurant]);

  const handleCreateRestaurant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const payload: RestaurantCreate = {
        name: newRestaurant.name,
        address: newRestaurant.address,
        is_hiring: true,
        is_open: true,
        avg_prep_time_minutes: Number(newRestaurant.avg_prep_time_minutes) || 15,
        max_active_orders: newRestaurant.max_active_orders
          ? Number(newRestaurant.max_active_orders)
          : null,
      };
      const r = await createRestaurant(payload);
      setSelectedRestaurant(r);
      setShowAddRestaurant(false);
      setNewRestaurant({ name: '', address: '', avg_prep_time_minutes: 15, max_active_orders: '' });
    } catch (err) {
      setFormError(translateApiError(err, 'Ошибка создания'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateRestaurant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    const patch = editRestaurant ?? selectedRestaurant;
    if (!patch) {
      setFormLoading(false);
      return;
    }
    if (!patch.name?.trim()) {
      setFormError('Укажите название заведения');
      setFormLoading(false);
      return;
    }
    if (!patch.address?.trim()) {
      setFormError('Укажите адрес заведения');
      setFormLoading(false);
      return;
    }
    const payload: RestaurantUpdate = {
      name: patch.name.trim(),
      address: patch.address.trim(),
      description: patch.description?.trim() || null,
      is_open: patch.is_open ?? false,
      is_hiring: patch.is_hiring ?? false,
      is_ordering_paused: patch.is_ordering_paused ?? false,
      ordering_paused_until: patch.ordering_paused_until
        ? fromDateTimeLocalValue(patch.ordering_paused_until)
        : null,
      avg_prep_time_minutes: Number(patch.avg_prep_time_minutes) || 15,
      max_active_orders: patch.max_active_orders ? Number(patch.max_active_orders) : null,
      ...(patch.photo_url != null ? { photo_url: patch.photo_url } : {}),
    };
    if (!selectedRestaurant) {
      setFormLoading(false);
      return;
    }
    try {
      await restaurantService.update(selectedRestaurant.id, payload);
      await fetchMyRestaurants();
      setSelectedRestaurant({ ...selectedRestaurant, ...payload } as Restaurant);
      setEditRestaurant(null);
    } catch (err) {
      setFormError(translateApiError(err, 'Ошибка обновления'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveWorkingHours = async () => {
    if (!selectedRestaurant) return;
    setWorkingHoursLoading(true);
    setWorkingHoursError('');
    setWorkingHoursSaved(false);
    const toHHMM = (t: string | null | undefined) => (t ? t.slice(0, 5) : '00:00');
    const payload = workingHours.map((r) => ({
      day_of_week: r.day_of_week,
      open_time: toHHMM(r.open_time),
      close_time: toHHMM(r.close_time),
      is_closed: r.is_closed,
    }));
    try {
      const res = await restaurantService.setWorkingHours(selectedRestaurant.id, payload);
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      if (data.length > 0) {
        setWorkingHours([...data].sort((a, b) => a.day_of_week - b.day_of_week));
      }
      setWorkingHoursSaved(true);
      setTimeout(() => setWorkingHoursSaved(false), 2000);
    } catch (err) {
      setWorkingHoursError(translateApiError(err, 'Не удалось сохранить расписание'));
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
