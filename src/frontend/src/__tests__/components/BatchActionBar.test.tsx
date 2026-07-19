import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { BatchActionBar } from '../../components/BatchActionBar/BatchActionBar';
type BatchProps = Omit<Partial<ComponentProps<typeof BatchActionBar>>, 'count'> & {
  count?: number | null;
};

const render$ = (props: BatchProps = {}) =>
  render(
    <BatchActionBar
      count={(props.count ?? 2)}
      label={props.label ?? 'элемента'}
      loading={props.loading ?? false}
      onClear={props.onClear ?? vi.fn()}
      actions={props.actions ?? []}
      {...(props as Partial<ComponentProps<typeof BatchActionBar>>)}
    />
  );

describe('BatchActionBar', () => {
  it('renders nothing when count is 0', () => {
    const { container } = render$({ count: 0 });
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when count is falsy', () => {
    const { container } = render$({ count: null });
    expect(container.firstChild).toBeNull();
  });

  it('shows selected count and label', () => {
    render$({ count: 3, label: 'товара' });
    expect(screen.getByText('Выбрано: 3 товара')).toBeInTheDocument();
  });

  it('calls onClear when "Снять выделение" clicked', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render$({ onClear });
    await user.click(screen.getByText('Снять выделение'));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('renders action buttons', () => {
    const actions = [
      { label: 'Удалить', onClick: vi.fn() },
      { label: 'Опубликовать', onClick: vi.fn() },
    ];
    render$({ actions });
    expect(screen.getByText('Удалить')).toBeInTheDocument();
    expect(screen.getByText('Опубликовать')).toBeInTheDocument();
  });

  it('calls action onClick when action button clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render$({ actions: [{ label: 'Действие', onClick }] });
    await user.click(screen.getByText('Действие'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('disables all buttons when loading=true', () => {
    const onClear = vi.fn();
    render$({
      loading: true,
      onClear,
      actions: [{ label: 'Удалить', onClick: vi.fn() }],
    });
    screen.getAllByRole('button').forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('shows "..." instead of label when loading', () => {
    render$({
      loading: true,
      actions: [{ label: 'Удалить', onClick: vi.fn() }],
    });
    expect(screen.getByText('...')).toBeInTheDocument();
    expect(screen.queryByText('Удалить')).not.toBeInTheDocument();
  });

  it('applies custom color style to action button', () => {
    render$({ actions: [{ label: 'Удалить', onClick: vi.fn(), color: 'red' }] });
    const btn = screen.getByText('Удалить');
    expect(btn.style.color).toBe('red');
  });

  it('does not apply style when action has no color', () => {
    render$({ actions: [{ label: 'Нейтрально', onClick: vi.fn() }] });
    const btn = screen.getByText('Нейтрально');
    expect(btn.getAttribute('style')).toBeFalsy();
  });
});
