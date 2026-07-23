import { vi } from 'vitest';
import type { Restaurant } from '@shared/types/models';

export const fetchMyRestaurants = vi.fn(() => Promise.resolve(undefined));
export const fetchMenu = vi.fn(() => Promise.resolve(undefined));
export const addMenuItem = vi.fn();
export const createRestaurant = vi.fn();

export const storeState = {
  restaurants: [{ id: 'r1', name: 'R1', address: 'A1' }] as unknown as Restaurant[],
  fetchMyRestaurants,
  fetchMenu,
  myLoading: false,
  addMenuItem,
  menus: { r1: [] },
  createRestaurant,
};

export const dataResp = (data: unknown) => ({ data: { data } }) as never;

export const submitEvent = () =>
  ({ preventDefault: vi.fn() }) as unknown as React.FormEvent<HTMLFormElement>;

export const makeParams = (activeTab = 'menu') => ({
  activeTab,
  setFormLoading: vi.fn(),
  setFormError: vi.fn(),
});
