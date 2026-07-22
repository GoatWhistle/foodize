import type { RefObject } from 'react';
import { CaretRightIcon } from '@phosphor-icons/react';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { AdvisorChatMessage } from '../../../services/aiAdvisorService';
import styles from './VendorAdvisor.module.css';

const SUGGESTION_KEYS = [
  'vendor.advisor.suggestions.whatToAdd',
  'vendor.advisor.suggestions.peakHours',
  'vendor.advisor.suggestions.unpopularItems',
  'vendor.advisor.suggestions.raiseAov',
];

interface AdvisorChatProps {
  messages: AdvisorChatMessage[];
  input: string;
  streaming: boolean;
  error: string | null;
  scrollRef: RefObject<HTMLDivElement | null>;
  onInputChange: (value: string) => void;
  onSend: (text?: string) => void;
}

export function AdvisorChat({
  messages,
  input,
  streaming,
  error,
  scrollRef,
  onInputChange,
  onSend,
}: AdvisorChatProps) {
  const { t } = useTranslation();
  const suggestions = SUGGESTION_KEYS.map((key) => t(key));
  return (
    <div className={`${styles['card']} ${styles['chatCard']}`}>
      <h3 className={styles['chatTitle']}>{t('vendor.advisor.chatTitle')}</h3>

      <div ref={scrollRef} className={styles['scroll']}>
        {messages.length === 0 && (
          <div className={styles['suggestions']}>
            {suggestions.map((s) => (
              <button
                key={s}
                className={`btn btn-secondary ${styles['suggestion']}`}
                disabled={streaming}
                onClick={() => { onSend(s); }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={`${styles['bubble']} ${m.role === 'user' ? styles['bubbleUser'] : styles['bubbleAssistant']}`}
          >
            {m.content || (streaming && i === messages.length - 1 ? '…' : '')}
          </div>
        ))}
      </div>

      {error && <div className="form-error">{error}</div>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        className={styles['form']}
      >
        <input
          className={`form-input ${styles['input']}`}
          placeholder={t('vendor.advisor.inputPlaceholder')}
          value={input}
          disabled={streaming}
          onChange={(e) => { onInputChange(e.target.value); }}
        />
        <button
          type="submit"
          className={`btn btn-primary ${styles['sendBtn']}`}
          disabled={streaming || !input.trim()}
        >
          <CaretRightIcon size={16} />
        </button>
      </form>
    </div>
  );
}
