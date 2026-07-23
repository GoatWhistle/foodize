import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { StaffDashboardPage } from '../../pages/staff/StaffDashboardPage';
import type { Order, StaffProfile } from '@shared/types/models';

export const APPROVED_PROFILE = {
  id: 'staff-1',
  restaurant_id: 'resto-1',
  restaurant_name: 'Test Cafe',
  status: 'APPROVED',
  role: 'COOK',
} as unknown as StaffProfile;

export const MOCK_ORDER = {
  id: 'order-1',
  display_id: 1001,
  status: 'PENDING',
  items: [{ name: 'Shaurma', quantity: 1, price: 300, options: [] }],
  total_price: 300,
  comment: '',
  created_at: new Date().toISOString(),
} as unknown as Order;

export const renderStaffPage = () =>
  render(
    <BrowserRouter>
      <StaffDashboardPage />
    </BrowserRouter>
  );
