import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ForkKnife, Sparkle, X } from "@phosphor-icons/react";
import { useAuthStore } from "../../store/useAuthStore";
import RestaurantCard from "@shared/components/RestaurantCard/RestaurantCard";
import EmptyState from "@shared/components/EmptyState/EmptyState";
import SearchFilterBar from "@shared/components/SearchFilterBar/SearchFilterBar";
import { useHomePageLogic } from "@shared/hooks/useHomePageLogic";
import { getGreeting } from "@shared/utils/restaurant";
import { aiOrderService } from "@shared/services/aiOrderService";
import { refreshAccessToken } from "../../services/api";
import type { Restaurant } from "@shared/types/models";
import s from "./HomePage.module.css";

interface AiReplyState {
  text: string;
  error: boolean;
}

const HomePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [aiReply, setAiReply] = useState<AiReplyState | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const {
    search, setSearch,
    searching,
    onlyOpen, setOnlyOpen,
    sort, setSort,
    direction, setDirection,
    allRestaurants,
    loading,
    publicRestaurantsTotal,
    sentinelRef,
  } = useHomePageLogic({ pageSize: 20, infiniteScroll: true });

  const firstName = user?.first_name || user?.name?.split(" ")[0] || "";

  const askAiAssistant = async (): Promise<void> => {
    setAiLoading(true);
    setAiReply({ text: "", error: false });
    let reply = "";
    try {
      await aiOrderService.streamChat(
        [{ role: "user", content: "Что можно заказать быстро и недорого?" }],
        {
          onChunk: (chunk) => {
            reply += chunk;
            setAiReply({ text: reply, error: false });
          },
          refreshToken: refreshAccessToken,
          withCredentials: true,
        }
      );
      setAiReply({ text: reply || "Ответ пуст", error: false });
    } catch {
      setAiReply({ text: "Не удалось получить ответ ассистента", error: true });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className={s.page}>
      {firstName && (
        <div className={s.greeting}>
          <div className={s.greetingLabel}>
            {getGreeting()} <ForkKnife size={12} weight="fill" style={{ display: "inline", verticalAlign: "middle" }} />
          </div>
          <div className={s.greetingName}>{firstName}</div>
        </div>
      )}

      <SearchFilterBar
        search={search}
        setSearch={setSearch}
        onlyOpen={onlyOpen}
        setOnlyOpen={setOnlyOpen}
        sort={sort}
        setSort={setSort}
        direction={direction}
        setDirection={setDirection}
        searching={searching}
        placeholder="Поиск заведения..."
        extraChips={(chipClass: string) => (
          <button
            type="button"
            className={chipClass}
            onClick={() => {
              void askAiAssistant();
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <Sparkle size={15} weight="fill" />
              AI-помощник
            </span>
          </button>
        )}
      />

      {aiReply && (
        <div className={s.aiPanel} role="status" aria-live="polite">
          <div className={s.aiPanelHead}>
            <span className={s.aiPanelTitle}>
              <Sparkle size={15} weight="fill" />
              AI-помощник
            </span>
            <button
              type="button"
              className={s.aiPanelClose}
              aria-label="Закрыть"
              onClick={() => setAiReply(null)}
            >
              <X size={16} weight="bold" />
            </button>
          </div>
          <div
            className={`${s.aiPanelBody}${aiReply.error ? ` ${s.aiPanelError}` : ""}`}
          >
            {aiReply.text || (aiLoading ? "Думаю…" : "")}
          </div>
        </div>
      )}

      <div className={s.section}>
        <div className={s.sectionHeader}>
          <h1 className={s.sectionTitle}>Заведения</h1>
          {publicRestaurantsTotal > 0 && (
            <span style={{ fontSize: "0.82rem", color: "var(--text-3)", fontWeight: 600 }}>
              {publicRestaurantsTotal}
            </span>
          )}
        </div>

        {loading && allRestaurants.length === 0 ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : allRestaurants.length === 0 ? (
          <EmptyState
            title="Ничего не найдено"
            subtitle="Попробуйте другой запрос или уберите фильтры"
          />
        ) : (
          <>
            <div className={s.grid}>
              {allRestaurants.map((r: Restaurant) => (
                <RestaurantCard
                  key={r.id}
                  restaurant={r}
                  onClick={() => {
                    void navigate(`/restaurant/${r.display_id}`, {
                      state: { restaurant: r },
                    });
                  }}
                  viewTransition={false}
                />
              ))}
            </div>

            <div ref={sentinelRef} style={{ height: 1, marginTop: 8 }} />

            {loading && allRestaurants.length > 0 && (
              <div className="loading-center" style={{ minHeight: 64 }}>
                <div className="spinner" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
