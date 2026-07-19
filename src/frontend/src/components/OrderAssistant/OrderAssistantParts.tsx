import type { CSSProperties, RefObject } from 'react';
import { SparkleIcon } from '@phosphor-icons/react';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const SUGGESTIONS = [
  'Где острая шаурма дешевле 350?',
  'Хочу два бургера и колу',
  'Что есть на десерт?',
];

const launcherStyle: CSSProperties = {
  position: 'fixed',
  right: 16,
  bottom: 80,
  zIndex: 'var(--z-banner)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 16px',
  borderRadius: 999,
  border: 'none',
  background: 'var(--fire)',
  color: 'var(--fire-text)',
  fontWeight: 700,
  boxShadow: '0 6px 16px var(--fire-glow)',
  cursor: 'pointer',
};

interface AssistantLauncherProps {
  triggerRef: RefObject<HTMLButtonElement | null>;
  onOpen: () => void;
}

export const AssistantLauncher = ({ triggerRef, onOpen }: AssistantLauncherProps) => (
  <button ref={triggerRef} onClick={onOpen} aria-label="Помощник заказа" style={launcherStyle}>
    <SparkleIcon size={18} weight="fill" />
    Помощник
  </button>
);

interface AssistantSuggestionsProps {
  streaming: boolean;
  onPick: (suggestion: string) => void;
}

const AssistantSuggestions = ({ streaming, onPick }: AssistantSuggestionsProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ fontSize: "var(--text-base)", color: 'var(--text-2)' }}>
      Спросите, что хотите заказать — найду и помогу оформить.
    </div>
    {SUGGESTIONS.map((suggestion) => (
      <button
        key={suggestion}
        className="btn btn-secondary"
        disabled={streaming}
        onClick={() => { onPick(suggestion); }}
        style={{ fontSize: "var(--text-base)", textAlign: 'left' }}
      >
        {suggestion}
      </button>
    ))}
  </div>
);

const messageBubbleStyle = (isUser: boolean): CSSProperties => ({
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  maxWidth: '85%',
  padding: '8px 12px',
  borderRadius: 'var(--radius-md)',
  background: isUser ? 'var(--fire)' : 'var(--bg-surface)',
  color: isUser ? 'var(--fire-text)' : 'var(--text-1)',
  border: isUser ? 'none' : '1px solid var(--border)',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  fontSize: "var(--text-base)",
  lineHeight: 1.5,
});

interface AssistantMessagesProps {
  messages: AssistantMessage[];
  streaming: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  onSuggestion: (suggestion: string) => void;
}

export const AssistantMessages = ({ messages, streaming, scrollRef, onSuggestion }: AssistantMessagesProps) => (
  <div
    ref={scrollRef}
    style={{
      flex: 1,
      overflowY: 'auto',
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}
  >
    {messages.length === 0 && (
      <AssistantSuggestions streaming={streaming} onPick={onSuggestion} />
    )}
    {messages.map((message, index) => (
      <div key={message.id} style={messageBubbleStyle(message.role === 'user')}>
        {message.content || (streaming && index === messages.length - 1 ? '…' : '')}
      </div>
    ))}
  </div>
);
