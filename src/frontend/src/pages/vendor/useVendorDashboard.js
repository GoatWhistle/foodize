import { useState, useEffect, useCallback } from 'react';
import { translateApiError } from '../../utils/translateApiError';
import { useRestaurantStore } from '../../store/useRestaurantStore';
import { useModalStore } from '../../store/useModalStore';
import { useShallow } from 'zustand/react/shallow';
import { vendorService } from '../../services/vendorService';
import { orderService } from '../../services/orderService';
import { menuService } from '../../services/menuService';
import { promoService } from '../../services/promoService';
import { restaurantService } from '../../services/restaurantService';
import { useVendorOrdersWebSocket } from '../../hooks/useVendorOrdersWebSocket';
import { downloadBlob } from '../../utils/download';

const fromDateTimeLocalValue = (value) =>
  value ? new Date(value).toISOString() : null;

const buildDefaultHours = () =>
  ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((_, i) => ({
    day_of_week: i,
    open_time: '09:00',
    close_time: '22:00',
    is_closed: false,
  }));

export const useVendorDashboard = () => {
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
  const requestConfirm = useModalStore((s) => s.requestConfirm);

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [vendorProfile, setVendorProfile] = useState(null);
  const [showQr, setShowQr] = useState(false);
  const [qrType, setQrType] = useState('site');

  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    address: '',
    avg_prep_time_minutes: 15,
    max_active_orders: '',
  });
  const [editRestaurant, setEditRestaurant] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [menuItemForm, setMenuItemForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'SHAURMA',
    prep_time_minutes: 15,
    option_groups: [],
  });
  const [menuError, setMenuError] = useState('');
  const [menuSuccess, setMenuSuccess] = useState('');

  const [restaurantOrders, setRestaurantOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersStatusFilter, setOrdersStatusFilter] = useState('');
  const [ordersDateFromFilter, setOrdersDateFromFilter] = useState('');
  const [ordersDateToFilter, setOrdersDateToFilter] = useState('');
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [ordersError, setOrdersError] = useState('');

  const [workingHours, setWorkingHours] = useState([]);
  const [workingHoursLoading, setWorkingHoursLoading] = useState(false);
  const [workingHoursSaved, setWorkingHoursSaved] = useState(false);
  const [workingHoursError, setWorkingHoursError] = useState('');

  const [promosList, setPromosList] = useState([]);
  const [promosLoading, setPromosLoading] = useState(false);
  const [promosError, setPromosError] = useState('');
  const [promosSuccess, setPromosSuccess] = useState('');
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: '',
    discount_type: 'PERCENT',
    discount_value: '',
    max_uses: '',
    expires_at: '',
    first_order_only: false,
    min_order_amount: '',
    menu_category: '',
  });
  const [promoFormLoading, setPromoFormLoading] = useState(false);
  const [deactivatingPromo, setDeactivatingPromo] = useState(null);

  const [staffRequests, setStaffRequests] = useState([]);
  const [staffPage, setStaffPage] = useState(1);
  const [staffTotal, setStaffTotal] = useState(0);
  const [staffMembers, setStaffMembers] = useState([]);
  const [staffMembersPage, setStaffMembersPage] = useState(1);
  const [staffMembersTotal, setStaffMembersTotal] = useState(0);
  const [staffSubTab, setStaffSubTab] = useState('members');
  const [staffMemberRemoving, setStaffMemberRemoving] = useState(null);
  const [staffDecisionLoading, setStaffDecisionLoading] = useState(null);

  const [finance, setFinance] = useState(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [financeFilters, setFinanceFilters] = useState({ date_from: '', date_to: '' });
  const [activePreset, setActivePreset] = useState(null);

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
    vendorService
      .getStaffRequests({ page: staffPage, size: 20 })
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setStaffRequests(list);
        setStaffTotal(res.data?.pagination?.total || list.length);
      })
      .catch(() => {});
  }, [staffPage]);

  useEffect(() => {
    vendorService
      .getStaffMembers({ page: staffMembersPage, size: 20 })
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setStaffMembers(list);
        setStaffMembersTotal(res.data?.pagination?.total || list.length);
      })
      .catch(() => {});
  }, [staffMembersPage]);

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

  useEffect(() => {
    if (activeTab === 'promos') {
      setPromosLoading(true);
      setPromosError('');
      promoService
        .list()
        .then((res) => {
          const list = Array.isArray(res.data?.data) ? res.data.data : [];
          setPromosList(list);
        })
        .catch(() => setPromosError('Не удалось загрузить промокоды'))
        .finally(() => setPromosLoading(false));
    }
  }, [activeTab]);

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
      setFormError(err.response?.data?.detail || 'Ошибка обновления');
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
      const detail = err?.response?.data?.detail;
      setWorkingHoursError(
        typeof detail === 'string' ? detail : 'Не удалось сохранить расписание'
      );
    } finally {
      setWorkingHoursLoading(false);
    }
  };

  const syncOptionGroups = async (item, groups) => {
    if (!item?.id) return;
    if (editingItem?.option_groups?.length) {
      await Promise.all(
        editingItem.option_groups.map((group) =>
          menuService.deleteOptionGroup(selectedRestaurant.id, item.id, group.id)
        )
      );
    }
    const cleanGroups = groups
      .map((group, groupIndex) => {
        const cleanOptions = (group.options || [])
          .filter((option) => option.name.trim())
          .map((option, optionIndex) => ({
            name: option.name.trim(),
            price_delta: parseInt(option.price_delta, 10) || 0,
            sort_order: optionIndex,
          }));
        if (!group.name.trim() || cleanOptions.length === 0) return null;
        const maxSelected =
          group.selection_type === 'single'
            ? 1
            : group.max_selected
              ? parseInt(group.max_selected, 10)
              : null;
        return {
          name: group.name.trim(),
          selection_type: group.selection_type,
          is_required: Boolean(group.is_required),
          min_selected: group.is_required
            ? Math.max(1, parseInt(group.min_selected, 10) || 1)
            : parseInt(group.min_selected, 10) || 0,
          max_selected: maxSelected,
          sort_order: groupIndex,
          options: cleanOptions,
        };
      })
      .filter(Boolean);
    for (const group of cleanGroups) {
      await menuService.createOptionGroup(selectedRestaurant.id, item.id, group);
    }
  };

  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    setFormLoading(true);
    setFormError('');
    try {
      const { option_groups: optionGroups, ...baseForm } = menuItemForm;
      const payload = {
        ...baseForm,
        price: parseInt(baseForm.price, 10),
        prep_time_minutes: parseInt(baseForm.prep_time_minutes, 10) || 15,
      };
      let savedItem = editingItem;
      if (editingItem) {
        const res = await menuService.updateItem(selectedRestaurant.id, editingItem.id, payload);
        savedItem = res.data.data;
        setEditingItem(null);
      } else {
        savedItem = await addMenuItem(selectedRestaurant.id, payload);
        setShowAddItem(false);
      }
      await syncOptionGroups(savedItem, optionGroups);
      fetchMenu(selectedRestaurant.id, { force: true });
      setMenuItemForm({
        name: '',
        description: '',
        price: '',
        category: 'SHAURMA',
        prep_time_minutes: 15,
        option_groups: [],
      });
      setMenuSuccess(editingItem ? 'Позиция обновлена' : 'Позиция добавлена');
      setTimeout(() => setMenuSuccess(''), 2000);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Ошибка сохранения');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    requestConfirm({
      title: 'Удалить позицию?',
      message: 'Вы уверены, что хотите удалить эту позицию из меню?',
      confirmLabel: 'Удалить',
      danger: true,
      onConfirm: async () => {
        setMenuError('');
        try {
          await menuService.deleteItem(selectedRestaurant.id, itemId);
          fetchMenu(selectedRestaurant.id, { force: true });
        } catch {
          setMenuError('Не удалось удалить позицию');
        }
      },
    });
  };

  const fetchVendorOrders = useCallback(
    async ({ silent = false } = {}) => {
      if (!selectedRestaurant) return;
      if (!silent) setOrdersLoading(true);
      setOrdersError('');
      try {
        const res = await orderService.getByRestaurant(selectedRestaurant.id, {
          page: ordersPage,
          size: 20,
          status: ordersStatusFilter || undefined,
          date_from: ordersDateFromFilter || undefined,
          date_to: ordersDateToFilter || undefined,
        });
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setRestaurantOrders(list);
        setOrdersTotal(res.data?.pagination?.total || list.length);
      } catch (err) {
        setRestaurantOrders([]);
        setOrdersTotal(0);
        setOrdersError(
          translateApiError(
            err,
            'Не удалось загрузить заказы. Проверьте, что аккаунт вендора имеет доступ к этому заведению.'
          )
        );
      } finally {
        if (!silent) setOrdersLoading(false);
      }
    },
    [selectedRestaurant, ordersPage, ordersStatusFilter, ordersDateFromFilter, ordersDateToFilter]
  );

  useEffect(() => {
    if (selectedRestaurant && activeTab === 'orders') {
      fetchVendorOrders();
    }
  }, [selectedRestaurant, activeTab, ordersPage, ordersStatusFilter, ordersDateFromFilter, ordersDateToFilter, fetchVendorOrders]);

  const handleWsMessage = useCallback(() => {
    fetchVendorOrders({ silent: true });
  }, [fetchVendorOrders]);

  useVendorOrdersWebSocket(selectedRestaurant?.id, activeTab, handleWsMessage);

  const handleOrderChange = async (orderId, status, data = {}) => {
    setOrdersError('');
    setUpdatingOrderId(orderId);
    try {
      await orderService.updateStatus(orderId, status, data);
      setSelectedOrder((current) =>
        current?.id === orderId
          ? {
              ...current,
              status,
              ...(data.estimated_ready_in_minutes
                ? {
                    estimated_ready_at: new Date(
                      Date.now() + data.estimated_ready_in_minutes * 60000
                    ).toISOString(),
                  }
                : {}),
              ...(data.estimated_ready_at ? { estimated_ready_at: data.estimated_ready_at } : {}),
            }
          : current
      );
      await fetchVendorOrders({ silent: true });
    } catch (err) {
      setOrdersError(translateApiError(err, 'Не удалось изменить статус заказа'));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId, reason) => {
    setOrdersError('');
    setUpdatingOrderId(orderId);
    try {
      await orderService.cancelOrder(orderId, reason);
      setSelectedOrder((current) =>
        current?.id === orderId
          ? { ...current, status: 'CANCELLED', cancellation_reason: reason }
          : current
      );
      await fetchVendorOrders({ silent: true });
    } catch (err) {
      setOrdersError(translateApiError(err, 'Не удалось отменить заказ'));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    setPromoFormLoading(true);
    setPromosError('');
    try {
      const payload = {
        code: promoForm.code,
        discount_type: promoForm.discount_type,
        discount_value: parseInt(promoForm.discount_value, 10),
        restaurant_id: selectedRestaurant.id,
        ...(promoForm.max_uses ? { max_uses: parseInt(promoForm.max_uses, 10) } : {}),
        ...(promoForm.expires_at
          ? { expires_at: new Date(promoForm.expires_at).toISOString() }
          : {}),
        first_order_only: promoForm.first_order_only,
        ...(promoForm.min_order_amount
          ? { min_order_amount: parseInt(promoForm.min_order_amount, 10) }
          : {}),
        ...(promoForm.menu_category ? { menu_category: promoForm.menu_category } : {}),
      };
      await promoService.create(payload);
      setPromoForm({
        code: '',
        discount_type: 'PERCENT',
        discount_value: '',
        max_uses: '',
        expires_at: '',
        first_order_only: false,
        min_order_amount: '',
        menu_category: '',
      });
      setShowPromoForm(false);
      setPromosSuccess('Промокод создан');
      setTimeout(() => setPromosSuccess(''), 2000);
      const res = await promoService.list();
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setPromosList(list);
    } catch (err) {
      setPromosError(translateApiError(err, 'Ошибка создания промокода'));
    } finally {
      setPromoFormLoading(false);
    }
  };

  const handleDeactivatePromo = async (code) => {
    setPromosError('');
    setDeactivatingPromo(code);
    try {
      await promoService.deactivate(code);
      setPromosList((prev) => prev.filter((p) => p.code !== code));
    } catch {
      setPromosError('Не удалось деактивировать промокод');
    } finally {
      setDeactivatingPromo(null);
    }
  };

  const handleStaffDecision = async (requestId, status) => {
    setStaffDecisionLoading(requestId);
    try {
      await vendorService.updateStaffStatus(requestId, status);
      setStaffRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status } : r))
      );
      if (status === 'ACCEPTED') {
        vendorService
          .getStaffMembers({ page: 1, size: 20 })
          .then((res) => {
            const list = Array.isArray(res.data?.data) ? res.data.data : [];
            setStaffMembers(list);
            setStaffMembersTotal(res.data?.pagination?.total || list.length);
          })
          .catch(() => {});
      }
    } catch {
    } finally {
      setStaffDecisionLoading(null);
    }
  };

  const handleRemoveStaffMember = async (profileId) => {
    if (!window.confirm('Уволить сотрудника?')) return;
    setStaffMemberRemoving(profileId);
    try {
      await vendorService.removeStaffMember(profileId);
      setStaffMembers((prev) => prev.filter((m) => m.id !== profileId));
      setStaffMembersTotal((t) => t - 1);
    } catch {
    } finally {
      setStaffMemberRemoving(null);
    }
  };

  const fetchAnalytics = useCallback(async () => {
    if (!selectedRestaurant) return;
    setFinanceLoading(true);
    setAnalyticsLoading(true);
    try {
      const rawParams = { ...financeFilters, restaurant_id: selectedRestaurant.id };
      const params = Object.fromEntries(
        Object.entries(rawParams).filter(([, v]) => v !== '' && v != null)
      );
      const [finRes, advRes] = await Promise.all([
        vendorService.getFinance(params),
        vendorService.getAdvancedAnalytics(params),
      ]);
      setFinance(finRes.data.data);
      setAdvancedAnalytics(advRes.data.data);
    } catch {
    } finally {
      setFinanceLoading(false);
      setAnalyticsLoading(false);
    }
  }, [selectedRestaurant, financeFilters]);

  useEffect(() => {
    if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab, fetchAnalytics]);

  const handleVendorExport = async (exportFn, filename) => {
    setExportLoading(true);
    try {
      const res = await exportFn();
      downloadBlob(res.data, filename);
    } catch {
      setOrdersError('Не удалось выполнить экспорт');
    } finally {
      setExportLoading(false);
    }
  };

  const selectedMenu = selectedRestaurant ? menus[selectedRestaurant.id] || [] : [];

  return {
    restaurants,
    loading,
    selectedRestaurant, setSelectedRestaurant,
    activeTab, setActiveTab,
    vendorProfile,
    showQr, setShowQr,
    qrType, setQrType,

    showAddRestaurant, setShowAddRestaurant,
    newRestaurant, setNewRestaurant,
    editRestaurant, setEditRestaurant,
    formLoading,
    formError,
    exportLoading,
    handleCreateRestaurant,
    handleUpdateRestaurant,

    showAddItem, setShowAddItem,
    editingItem, setEditingItem,
    menuItemForm, setMenuItemForm,
    menuError,
    menuSuccess,
    handleSaveMenuItem,
    handleDeleteMenuItem,

    restaurantOrders,
    ordersPage, setOrdersPage,
    ordersTotal,
    ordersStatusFilter, setOrdersStatusFilter,
    ordersDateFromFilter, setOrdersDateFromFilter,
    ordersDateToFilter, setOrdersDateToFilter,
    ordersLoading,
    updatingOrderId,
    selectedOrder, setSelectedOrder,
    ordersError,
    fetchVendorOrders,
    handleOrderChange,
    handleCancelOrder,

    workingHours, setWorkingHours,
    workingHoursLoading,
    workingHoursSaved,
    workingHoursError,
    handleSaveWorkingHours,

    promosList,
    promosLoading,
    promosError,
    promosSuccess,
    showPromoForm, setShowPromoForm,
    promoForm, setPromoForm,
    promoFormLoading,
    deactivatingPromo,
    handleCreatePromo,
    handleDeactivatePromo,

    staffRequests,
    staffPage, setStaffPage,
    staffTotal,
    staffMembers,
    staffMembersPage, setStaffMembersPage,
    staffMembersTotal,
    staffSubTab, setStaffSubTab,
    staffMemberRemoving,
    staffDecisionLoading,
    handleStaffDecision,
    handleRemoveStaffMember,

    finance,
    financeLoading,
    advancedAnalytics,
    analyticsLoading,
    financeFilters, setFinanceFilters,
    activePreset, setActivePreset,

    selectedMenu,
    handleVendorExport,
  };
};
