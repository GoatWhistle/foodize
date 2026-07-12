import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '@shared/store/useThemeStore.js';

describe('useThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'light' });
  });

  it('initial state is light', () => {
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('toggleTheme switches between light and dark', () => {
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('setTheme updates the preference', () => {
    useThemeStore.getState().setTheme('system');
    expect(useThemeStore.getState().theme).toBe('system');
  });
});
