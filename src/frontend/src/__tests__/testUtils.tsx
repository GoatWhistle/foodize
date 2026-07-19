import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions, RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

interface ProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  initialEntries?: string[];
}

export const renderWithProviders = (
  ui: ReactElement,
  { route = '/', initialEntries, ...options }: ProvidersOptions = {},
): RenderResult => {
  const entries = initialEntries ?? [route];
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={entries}>{children}</MemoryRouter>
  );
  return render(ui, { wrapper: Wrapper, ...options });
};

export const req = <T,>(value: T | null | undefined): T => {
  if (value === null || value === undefined) {
    throw new Error('Expected value to be defined');
  }
  return value;
};

export const at = <T,>(items: ArrayLike<T>, index: number): T => req(items[index]);

type Selector<S> = (state: S) => unknown;

export const mockZustandStore = <S,>(getState: () => S) => {
  return vi.fn((selector?: Selector<S>) => {
    const state = getState();
    return selector ? selector(state) : state;
  });
};
