import type { ReactNode } from 'react';
import { useTranslation } from '@shared/i18n/useTranslation';

interface AuthVisualProps {
  title: ReactNode;
  subtitle: string;
}

export const AuthVisual = ({ title, subtitle }: AuthVisualProps) => {
  const { t } = useTranslation();
  return (
  <div className="auth-visual">
    <div className="auth-visual-pattern" />
    <div className="auth-visual-orbs">
      <div className="auth-visual-orb auth-visual-orb--1" />
      <div className="auth-visual-orb auth-visual-orb--2" />
    </div>
    <div className="auth-visual-content">
      <span className="auth-visual-eyebrow">{t('auth.visual.eyebrow')}</span>
      <div className="auth-visual-title">{title}</div>
      <p className="auth-visual-sub">{subtitle}</p>
    </div>
  </div>
  );
};
