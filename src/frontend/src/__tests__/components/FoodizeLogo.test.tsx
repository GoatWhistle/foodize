import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FoodizeLogo } from '@shared/components/FoodizeLogo/FoodizeLogo';
describe('FoodizeLogo', () => {
  it('exposes an accessible logo label', () => {
    render(<FoodizeLogo />);
    expect(screen.getByRole('img', { name: 'Foodize' })).toBeInTheDocument();
  });

  it('renders the logo text', () => {
    render(<FoodizeLogo />);
    expect(screen.getByText('food')).toBeInTheDocument();
    expect(screen.getByText('ize')).toBeInTheDocument();
  });

  it('applies the correct font size from size prop', () => {
    render(<FoodizeLogo size={64} />);
    expect(screen.getByText('food').style.fontSize).toBe('64px');
  });

  it('uses custom color when provided', () => {
    render(<FoodizeLogo color="#FF4F1F" />);
    expect(screen.getByText('food').style.color).toBe('rgb(255, 79, 31)');
  });

  it('uses currentColor when no color prop provided', () => {
    render(<FoodizeLogo />);
    expect(screen.getByText('food').style.color).toBe('currentcolor');
  });
});
