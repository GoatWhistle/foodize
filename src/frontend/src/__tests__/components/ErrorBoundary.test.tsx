import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '@shared/components/ErrorBoundary/ErrorBoundary';
import { t } from '@shared/i18n/useTranslation';
let shouldThrow = false;

const ConditionalBroken = () => {
  if (shouldThrow) throw new Error('Boom');
  return <div>Recovered</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Healthy child</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Healthy child')).toBeInTheDocument();
  });

  it('shows fallback and can retry after an error', async () => {
    const user = userEvent.setup();
    shouldThrow = true;
    render(
      <ErrorBoundary>
        <ConditionalBroken />
      </ErrorBoundary>
    );

    expect(screen.getByText('Boom')).toBeInTheDocument();
    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: t('common.actions.retry') }));

    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
});
