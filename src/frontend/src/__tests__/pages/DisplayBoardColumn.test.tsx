import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CookingPotIcon } from '@phosphor-icons/react';
import { DisplayBoardColumn } from '../../pages/display-board/DisplayBoardColumn';
import type { StatusStyle } from '../../pages/display-board/displayBoardStyles';
import { t } from '@shared/i18n/useTranslation';

const style: StatusStyle = {
  bg: '#111',
  solid: '#0f0',
  border: '#00ff0033',
} as unknown as StatusStyle;

describe('DisplayBoardColumn', () => {
  it('shows empty placeholder when there are no ids', () => {
    render(
      <DisplayBoardColumn
        title="Готовятся"
        Icon={CookingPotIcon}
        ids={[]}
        newIds={new Set()}
        style={style}
      />
    );
    expect(screen.getByText('Готовятся')).toBeInTheDocument();
    expect(screen.getByText(t('staff.displayBoard.empty'))).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders order cards and count', () => {
    render(
      <DisplayBoardColumn
        title="Готовы к выдаче"
        Icon={CookingPotIcon}
        ids={['A-1', 'A-2']}
        newIds={new Set()}
        style={style}
      />
    );
    expect(screen.getByText('A-1')).toBeInTheDocument();
    expect(screen.getByText('A-2')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.queryByText(t('staff.displayBoard.empty'))).toBeNull();
  });

  it('highlights only the cards present in newIds', () => {
    render(
      <DisplayBoardColumn
        title="Готовятся"
        Icon={CookingPotIcon}
        ids={['A-1', 'A-2']}
        newIds={new Set(['A-1'])}
        style={style}
      />
    );
    const highlighted = screen.getByText('A-1').parentElement as HTMLElement;
    const plain = screen.getByText('A-2').parentElement as HTMLElement;
    expect(highlighted.style.borderColor).toBe('rgb(0, 255, 0)');
    expect(highlighted.style.animation).not.toBe('');
    expect(plain.style.animation).toBe('');
    expect(plain.style.boxShadow).toBe('none');
  });
});
