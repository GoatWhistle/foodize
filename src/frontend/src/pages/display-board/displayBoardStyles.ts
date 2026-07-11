import type { CSSProperties } from 'react';

export interface StatusStyle {
  color: string;
  bg: string;
  border: string;
  solid: string;
}

export const NEW_HIGHLIGHT_MS = 1500;

export const KEYFRAMES = `
@keyframes orderSlideIn {
  from {
    opacity: 0;
    transform: scale(0.6) translateY(-16px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
`;

export const styles: Record<string, CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    background: 'var(--bg)',
    color: 'var(--text-1)',
    overflow: 'hidden',
    fontFamily: 'var(--font-sans)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 40px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    flexShrink: 0,
  },
  headerName: {
    color: 'var(--text-1)',
    fontSize: 'clamp(1.4rem, 2vw, 2rem)',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  headerTime: {
    color: 'var(--text-3)',
    fontSize: 'clamp(1.2rem, 1.6vw, 1.6rem)',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.04em',
  },
  columns: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  column: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '32px 32px 28px',
    overflow: 'hidden',
  },
  columnHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 28,
    fontSize: 'clamp(1.3rem, 1.8vw, 1.9rem)',
    fontWeight: 800,
    letterSpacing: '-0.01em',
    textTransform: 'uppercase',
  },
  columnCount: {
    marginLeft: 'auto',
    fontSize: 'clamp(1.8rem, 2.4vw, 2.6rem)',
    fontWeight: 900,
    letterSpacing: '-0.03em',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap',
    gap: 20,
    alignContent: 'flex-start',
    overflowX: 'auto',
    overflowY: 'hidden',
    flex: 1,
  },
  card: {
    width: 'clamp(150px, 15vw, 200px)',
    height: 'clamp(150px, 15vw, 200px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: 24,
    border: '3px solid',
    background: 'var(--bg-card)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    cursor: 'default',
  },
  cardNumber: {
    fontSize: 'clamp(3rem, 5vw, 5rem)',
    fontWeight: 900,
    color: 'var(--text-1)',
    lineHeight: 1,
    letterSpacing: '-0.04em',
    fontVariantNumeric: 'tabular-nums',
  },
  divider: {
    width: 1,
    background: 'var(--border)',
    margin: '24px 0',
    flexShrink: 0,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    color: 'var(--text-3)',
    marginTop: 56,
    width: '100%',
  },
  emptyText: {
    fontSize: '1.5rem',
    fontWeight: 700,
  },
  errorScreen: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
  },
  errorText: {
    color: 'var(--color-error)',
    fontSize: '1.5rem',
    fontWeight: 700,
    fontFamily: 'var(--font-sans)',
  },
};
