import { useState, useRef, useEffect, useCallback } from 'react';
import { XIcon, CaretRightIcon, SparkleIcon } from '@phosphor-icons/react';
import { aiOrderService } from '@shared/services/aiOrderService';
import { useDialogKeyboard } from '@shared/hooks/useDialogKeyboard';
import { makeId } from '@shared/utils/id';
import { useCartStore } from '../../store/useCartStore';
import { useTranslation } from '@shared/i18n/useTranslation';

import { AssistantLauncher, AssistantMessages } from './OrderAssistantParts';
import type { AssistantMessage } from './OrderAssistantParts';

export function OrderAssistant() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fetchCart = useCartStore((s) => s.fetchCart);

  const close = useCallback(() => { setOpen(false); }, []);
  useDialogKeyboard({ active: open, onEscape: close });

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      wasOpenRef.current = true;
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);

  const appendToLastAssistant = useCallback((text: string) => {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (!last) return prev;
      next[next.length - 1] = { ...last, content: last.content + text };
      return next;
    });
  }, []);

  const send = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || streaming) return;

      setError(null);
      setInput('');
      const history: AssistantMessage[] = [
        ...messages,
        { id: makeId(), role: 'user', content },
      ];
      setMessages([...history, { id: makeId(), role: 'assistant', content: '' }]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        await aiOrderService.streamChat(
          history.map((m) => ({ role: m.role, content: m.content })),
          { signal: controller.signal, onChunk: appendToLastAssistant }
        );
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError(t('vendor.assistant.errors.requestFailed'));
          setMessages((prev) => prev.slice(0, -1));
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
        void fetchCart();
      }
    },
    [input, streaming, messages, appendToLastAssistant, fetchCart, t]
  );

  if (!open) {
    return <AssistantLauncher triggerRef={triggerRef} onOpen={() => { setOpen(true); }} />;
  }

  return (
    <div
      role="dialog"
      aria-label={t('vendor.assistant.ariaLabel')}
      style={{
        position: 'fixed',
        right: 16,
        bottom: 'calc(var(--bottom-tab-h, 68px) + env(safe-area-inset-bottom, 0px) + 12px)',
        zIndex: 'var(--z-banner)',
        width: 'min(380px, calc(100vw - 32px))',
        maxHeight: 'min(70vh, calc(100dvh - var(--nav-h, 64px) - var(--bottom-tab-h, 68px) - 32px))',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <SparkleIcon size={16} weight="fill" color="var(--fire)" />
          {t('vendor.assistant.title')}
        </strong>
        <button
          onClick={close}
          aria-label={t('common.actions.close')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            margin: -13,
            flexShrink: 0,
          }}
        >
          <XIcon size={18} />
        </button>
      </div>

      <AssistantMessages
        messages={messages}
        streaming={streaming}
        scrollRef={scrollRef}
        onSuggestion={(suggestion) => { void send(suggestion); }}
      />

      {error && (
        <div className="form-error" style={{ margin: '0 14px' }}>
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        style={{
          display: 'flex',
          gap: 8,
          padding: 12,
          borderTop: '1px solid var(--border)',
        }}
      >
        <input
          ref={inputRef}
          className="form-input"
          placeholder={t('vendor.assistant.inputPlaceholder')}
          value={input}
          disabled={streaming}
          onChange={(e) => { setInput(e.target.value); }}
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          aria-label={t('vendor.assistant.sendAriaLabel')}
          className="btn btn-primary"
          disabled={streaming || !input.trim()}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <CaretRightIcon size={16} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
