import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useRestaurantStore } from '../../../store/useRestaurantStore';
import { vendorService } from '../../../services/vendorService';
import { restaurantService } from '../../../services/restaurantService';
import { translateApiError } from '../../../utils/translateApiError';

const fromDateTimeLocalValue = (value) =>
  value ? new Date(value).toISOString() : null;

const buildDefaultHours = () =>
  ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((_, i) => ({
    day_of_week: i,
    open_time: '09:00',
    close_time: '22:00',
    is_closed: false,
  }));

export const useVendorRestaurants = ({ activeTab, setFormLoading, setFormError }) => {
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

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [vendorProfile, setVendorProfile] = useState(null);

  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    address: '',
    avg_prep_time_minutes: 15,
    max_active_orders: '',
  });
  const [editRestaurant, setEditRestaurant] = useState(null);

  const [workingHours, setWorkingHours] = useState([]);
  const [workingHoursLoading, setWorkingHoursLoading] = useState(false);
  const [workingHoursSaved, setWorkingHoursSaved] = useState(false);
  const [workingHoursError, setWorkingHoursError] = useState('');

  useEffect(() => {
    fetchMyRestaurants();
    vendorService
      .getMyProfile()
      .then((res) => setVendorProfile(res.data?.data || null))
      .catch(() => {});
  }, [fetchMyRestaurants]);

  useEffect(() => {
    if (selectedRestaurant) {
      fetchMenu(selectedRestaurant.id);
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
        .catch((err) => {
          if (err?.response?.status !== 404) {
            setWorkingHoursError('Не удалось загрузить расписание');
          }
          setWorkingHours(buildDefaultHours());
        })
        .finally(() => setWorkingHoursLoading(false));
    }
  }, [activeTab, selectedRestaurant]);

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const r = await createRestaurant({
        ...newRestaurant,
        avg_prep_time_minutes: Number(newRestaurant.avg_prep_time_minutes) || 15,
        max_active_orders: newRestaurant.max_active_orders
          ? Number(newRestaurant.max_active_orders)
          : null,
      });
      setSelectedRestaurant(r);
      setShowAddRestaurant(false);
      setNewRestaurant({ name: '', address: '', avg_prep_time_minutes: 15, max_active_orders: '' });
    } catch (err) {
      setFormError(translateApiError(err, 'Ошибка создания'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateRestaurant = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    const patch = editRestaurant ?? selectedRestaurant;
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
    const payload = {
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
    try {
      await restaurantService.update(selectedRestaurant.id, payload);
      await fetchMyRestaurants();
      setSelectedRestaurant({ ...selectedRestaurant, ...payload });
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
    const toHHMM = (t) => (t ? t.slice(0, 5) : '00:00');
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
