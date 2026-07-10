import { createPortal } from 'react-dom';
import ApplicationStatus from './components/ApplicationStatus';
import EtaModal from './components/EtaModal';
import StaffHeader from './components/StaffHeader';
import StaffOrdersTab from './components/StaffOrdersTab';
import StaffMenuTab from './components/StaffMenuTab';
import { useStaffDashboard } from './hooks/useStaffDashboard';

type StaffTab = 'orders' | 'menu';

const TABS: { id: StaffTab; label: string }[] = [
  { id: 'orders', label: 'Заказы' },
  { id: 'menu', label: 'Стоп-лист' },
];

const StaffDashboardPage = () => {
  const {
    profile,
    profileLoading,
    profileError,
    orders,
    ordersLoading,
    updating,
    activeTab,
    setActiveTab,
    newOrderAlert,
    setNewOrderAlert,
    menuItems,
    menuLoading,
    menuError,
    draggingOrderId,
    etaOrder,
    setEtaOrder,
    autoEta,
    setAutoEta,
    handleAdvance,
    handleCancelOrder,
    handleDrop,
    handleEtaConfirm,
    handleToggleAvailability,
    onDragStart,
    onDragEnd,
  } = useStaffDashboard();

  if (profileLoading) {
    return (
      <div className="loading-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (profileError || !profile) {
    return <ApplicationStatus />;
  }

  return (
    <div
      className="page-enter"
      style={{ padding: '24px 16px', maxWidth: 1100, margin: '0 auto' }}
    >
      <StaffHeader
        profile={profile}
        newOrderAlert={newOrderAlert}
        onDismissAlert={() => setNewOrderAlert(false)}
        autoEta={autoEta}
        onToggleAutoEta={(checked) => {
          setAutoEta(checked);
          localStorage.setItem('staff_auto_eta', String(checked));
        }}
      />

      <div
        style={{
          display: 'flex',
          gap: 16,
          borderBottom: '1px solid var(--border)',
          marginBottom: 20,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 4px',
              background: 'none',
              border: 'none',
              borderBottom:
                activeTab === tab.id ? '2px solid var(--fire)' : 'none',
              color: activeTab === tab.id ? 'var(--text-1)' : 'var(--text-3)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <StaffOrdersTab
          orders={orders}
          ordersLoading={ordersLoading}
          updating={updating}
          draggingOrderId={draggingOrderId}
          onAdvance={handleAdvance}
          onCancel={(orderId, reason) => {
            void handleCancelOrder(orderId, reason);
          }}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDrop={handleDrop}
        />
      )}

      {activeTab === 'menu' && (
        <StaffMenuTab
          menuItems={menuItems}
          menuLoading={menuLoading}
          menuError={menuError}
          onToggleAvailability={(item) => {
            void handleToggleAvailability(item);
          }}
        />
      )}

      {etaOrder &&
        createPortal(
          <EtaModal
            order={etaOrder}
            onConfirm={handleEtaConfirm}
            onCancel={() => setEtaOrder(null)}
            updating={updating === etaOrder.id}
          />,
          document.body
        )}
    </div>
  );
};

export default StaffDashboardPage;
