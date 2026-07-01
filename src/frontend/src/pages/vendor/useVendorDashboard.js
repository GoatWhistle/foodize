import { useState } from 'react';
import { useVendorFormState } from './hooks/useVendorFormState';
import { useVendorRestaurants } from './hooks/useVendorRestaurants';
import { useVendorMenu } from './hooks/useVendorMenu';
import { useVendorOrders } from './hooks/useVendorOrders';
import { useVendorPromos } from './hooks/useVendorPromos';
import { useVendorStaff } from './hooks/useVendorStaff';
import { useVendorFinance } from './hooks/useVendorFinance';
import { useVendorExport } from './hooks/useVendorExport';

export const useVendorDashboard = () => {
  const [activeTab, setActiveTab] = useState('menu');
  const [showQr, setShowQr] = useState(false);
  const [qrType, setQrType] = useState('site');

  const { formLoading, setFormLoading, formError, setFormError } = useVendorFormState();

  const restaurants = useVendorRestaurants({ activeTab, setFormLoading, setFormError });
  const { selectedRestaurant, fetchMenu, addMenuItem, menus } = restaurants;

  const menu = useVendorMenu({
    selectedRestaurant,
    fetchMenu,
    addMenuItem,
    setFormLoading,
    setFormError,
  });

  const orders = useVendorOrders({ selectedRestaurant, activeTab });
  const promos = useVendorPromos({ selectedRestaurant, activeTab });
  const staff = useVendorStaff();
  const finance = useVendorFinance({ selectedRestaurant, activeTab });
  const { exportLoading, handleVendorExport } = useVendorExport({
    setOrdersError: orders.setOrdersError,
  });

  const selectedMenu = selectedRestaurant ? menus[selectedRestaurant.id] || [] : [];

  return {
    restaurants: restaurants.restaurants,
    loading: restaurants.loading,
    selectedRestaurant,
    setSelectedRestaurant: restaurants.setSelectedRestaurant,
    activeTab, setActiveTab,
    vendorProfile: restaurants.vendorProfile,
    showQr, setShowQr,
    qrType, setQrType,

    showAddRestaurant: restaurants.showAddRestaurant,
    setShowAddRestaurant: restaurants.setShowAddRestaurant,
    newRestaurant: restaurants.newRestaurant,
    setNewRestaurant: restaurants.setNewRestaurant,
    editRestaurant: restaurants.editRestaurant,
    setEditRestaurant: restaurants.setEditRestaurant,
    formLoading,
    formError,
    exportLoading,
    handleCreateRestaurant: restaurants.handleCreateRestaurant,
    handleUpdateRestaurant: restaurants.handleUpdateRestaurant,

    showAddItem: menu.showAddItem,
    setShowAddItem: menu.setShowAddItem,
    editingItem: menu.editingItem,
    setEditingItem: menu.setEditingItem,
    menuItemForm: menu.menuItemForm,
    setMenuItemForm: menu.setMenuItemForm,
    menuError: menu.menuError,
    menuSuccess: menu.menuSuccess,
    handleSaveMenuItem: menu.handleSaveMenuItem,
    handleDeleteMenuItem: menu.handleDeleteMenuItem,

    restaurantOrders: orders.restaurantOrders,
    ordersPage: orders.ordersPage,
    setOrdersPage: orders.setOrdersPage,
    ordersTotal: orders.ordersTotal,
    ordersStatusFilter: orders.ordersStatusFilter,
    setOrdersStatusFilter: orders.setOrdersStatusFilter,
    ordersDateFromFilter: orders.ordersDateFromFilter,
    setOrdersDateFromFilter: orders.setOrdersDateFromFilter,
    ordersDateToFilter: orders.ordersDateToFilter,
    setOrdersDateToFilter: orders.setOrdersDateToFilter,
    ordersLoading: orders.ordersLoading,
    updatingOrderId: orders.updatingOrderId,
    selectedOrder: orders.selectedOrder,
    setSelectedOrder: orders.setSelectedOrder,
    ordersError: orders.ordersError,
    fetchVendorOrders: orders.fetchVendorOrders,
    handleOrderChange: orders.handleOrderChange,
    handleCancelOrder: orders.handleCancelOrder,

    workingHours: restaurants.workingHours,
    setWorkingHours: restaurants.setWorkingHours,
    workingHoursLoading: restaurants.workingHoursLoading,
    workingHoursSaved: restaurants.workingHoursSaved,
    workingHoursError: restaurants.workingHoursError,
    handleSaveWorkingHours: restaurants.handleSaveWorkingHours,

    promosList: promos.promosList,
    promosLoading: promos.promosLoading,
    promosError: promos.promosError,
    promosSuccess: promos.promosSuccess,
    showPromoForm: promos.showPromoForm,
    setShowPromoForm: promos.setShowPromoForm,
    promoForm: promos.promoForm,
    setPromoForm: promos.setPromoForm,
    promoFormLoading: promos.promoFormLoading,
    deactivatingPromo: promos.deactivatingPromo,
    handleCreatePromo: promos.handleCreatePromo,
    handleDeactivatePromo: promos.handleDeactivatePromo,

    staffRequests: staff.staffRequests,
    staffPage: staff.staffPage,
    setStaffPage: staff.setStaffPage,
    staffTotal: staff.staffTotal,
    staffMembers: staff.staffMembers,
    staffMembersPage: staff.staffMembersPage,
    setStaffMembersPage: staff.setStaffMembersPage,
    staffMembersTotal: staff.staffMembersTotal,
    staffSubTab: staff.staffSubTab,
    setStaffSubTab: staff.setStaffSubTab,
    staffMemberRemoving: staff.staffMemberRemoving,
    staffDecisionLoading: staff.staffDecisionLoading,
    handleStaffDecision: staff.handleStaffDecision,
    handleRemoveStaffMember: staff.handleRemoveStaffMember,

    finance: finance.finance,
    financeLoading: finance.financeLoading,
    advancedAnalytics: finance.advancedAnalytics,
    analyticsLoading: finance.analyticsLoading,
    financeFilters: finance.financeFilters,
    setFinanceFilters: finance.setFinanceFilters,
    activePreset: finance.activePreset,
    setActivePreset: finance.setActivePreset,

    selectedMenu,
    handleVendorExport,
  };
};
