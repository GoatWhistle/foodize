import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SettingsPage } from '../../../pages/profile/SettingsPage';

interface SharedSettingsProps {
  routes: { profile: string; terms: string; privacy: string };
  showPasswordChange?: boolean;
}

vi.mock('@shared/pages/SettingsPage/SettingsPage', () => ({
  SettingsPage: ({ routes, showPasswordChange }: SharedSettingsProps) => (
    <div data-testid="shared-settings">
      {routes.profile}|{routes.terms}|{routes.privacy}|{String(showPasswordChange)}
    </div>
  ),
}));

describe('SettingsPage wrapper', () => {
  it('passes routes and showPasswordChange to shared settings', () => {
    render(<SettingsPage />);
    expect(screen.getByTestId('shared-settings')).toHaveTextContent(
      '/profile|/legal/terms|/legal/privacy|true',
    );
  });
});
