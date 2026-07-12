import { useState, useRef, useEffect, useCallback } from 'react';
import { aiAdvisorService } from '../../services/aiAdvisorService';
import type { AdvisorChatMessage } from '../../services/aiAdvisorService';
import { AdvisorInsights } from './components/AdvisorInsights';
import { AdvisorChat } from './components/AdvisorChat';
import styles from './components/VendorAdvisor.module.css';

interface VendorAdvisorPanelProps {
  restaurantId: string;
}

export default function VendorAdvisorPanel({ restaurantId }: VendorAdvisorPanelProps) {
  const [messages, setMessages] = useState<AdvisorChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

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
      const history = [...messages, { role: 'user', content }];
      setMessages([...history, { role: 'assistant', content: '' }]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        await aiAdvisorService.streamChat(
          history.map((m) => ({ role: m.role, content: m.content })),
          {
            restaurantId,
            signal: controller.signal,
            onChunk: appendToLastAssistant,
          }
        );
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError(
            'Не удалось получить ответ. Проверьте подключение и ключ модели.'
          );
          setMessages((prev) => prev.slice(0, -1));
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [input, streaming, messages, restaurantId, appendToLastAssistant]
  );

  const loadInsights = useCallback(async (refresh = false) => {
    setInsightsLoading(true);
    setError(null);
    try {
      const res = await aiAdvisorService.getInsights(refresh);
      setInsights(res.data.data.insights);
    } catch {
      setError('Не удалось получить анализ бизнеса.');
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  return (
    <div className={styles.root}>
      <AdvisorInsights
        insights={insights}
        insightsLoading={insightsLoading}
        onLoad={() => {
          void loadInsights(Boolean(insights));
        }}
      />
      <AdvisorChat
        messages={messages}
        input={input}
        streaming={streaming}
        error={error}
        scrollRef={scrollRef}
        onInputChange={setInput}
        onSend={(text) => {
          void send(text);
        }}
      />
    </div>
  );
}
