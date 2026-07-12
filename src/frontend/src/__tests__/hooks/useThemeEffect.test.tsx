import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useThemeEffect } from '@shared/hooks/useThemeEffect';
import { useThemeStore } from '@shared/store/useThemeStore';

describe('useThemeEffect', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'light' });
    document.documentElement.removeAttribute('data-theme');
  });

  it('applies the light theme to the document', () => {
    useThemeStore.setState({ theme: 'light' });
    renderHook(() => { useThemeEffect(); });
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('applies the dark theme to the document', () => {
    useThemeStore.setState({ theme: 'dark' });
    renderHook(() => { useThemeEffect(); });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('resolves system preference to light when not dark', () => {
    useThemeStore.setState({ theme: 'system' });
    renderHook(() => { useThemeEffect(); });
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
