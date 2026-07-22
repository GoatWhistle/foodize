import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ForkKnifeIcon, SparkleIcon, XIcon } from "@phosphor-icons/react";
import { useAuthStore } from "../../store/useAuthStore";
import { RestaurantCard } from "@shared/components/RestaurantCard/RestaurantCard";
import { EmptyState } from "@shared/components/EmptyState/EmptyState";
import { SearchFilterBar } from "@shared/components/SearchFilterBar/SearchFilterBar";
import { useHomePageLogic } from "@shared/hooks/useHomePageLogic";
import { getGreeting } from "@shared/utils/restaurant";
import { aiOrderService } from "@shared/services/aiOrderService";
import { refreshAccessToken } from "../../services/api";
import type { Restaurant } from "@shared/types/models";
import { useTranslation } from "@shared/i18n/useTranslation";
import styles from "./HomePage.module.css";

interface AiReplyState {
  text: string;
  error: boolean;
}

export const HomePage = () => {
  const { t } = useTranslation();
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

  const firstName = user?.first_name || user?.name.split(" ")[0] || "";

  const askAiAssistant = async (): Promise<void> => {
    setAiLoading(true);
    setAiReply({ text: "", error: false });
    let reply = "";
    try {
      await aiOrderService.streamChat(
        [{ role: "user", content: t("catalog.assistant.prompt") }],
        {
          onChunk: (chunk) => {
            reply += chunk;
            setAiReply({ text: reply, error: false });
          },
          refreshToken: refreshAccessToken,
          withCredentials: true,
        }
      );
      setAiReply({ text: reply || t("catalog.assistant.emptyReply"), error: false });
    } catch {
      setAiReply({ text: t("catalog.assistant.failed"), error: true });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className={styles['page']}>
      {firstName && (
        <div className={styles['greeting']}>
          <div className={styles['greetingLabel']}>
            {getGreeting()} <ForkKnifeIcon size={12} weight="fill" style={{ display: "inline", verticalAlign: "middle" }} />
          </div>
          <div className={styles['greetingName']}>{firstName}</div>
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
        placeholder={t("catalog.search.placeholderShort")}
        extraChips={(chipClass: string) => (
          <button
            type="button"
            className={chipClass}
            onClick={() => {
              void askAiAssistant();
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <SparkleIcon size={15} weight="fill" />
              {t("catalog.assistant.label")}
            </span>
          </button>
        )}
      />

      {aiReply && (
        <div className={styles['aiPanel']} role="status" aria-live="polite">
          <div className={styles['aiPanelHead']}>
            <span className={styles['aiPanelTitle']}>
              <SparkleIcon size={15} weight="fill" />
              {t("catalog.assistant.label")}
            </span>
            <button
              type="button"
              className={styles['aiPanelClose']}
              aria-label={t("common.actions.close")}
              onClick={() => { setAiReply(null); }}
            >
              <XIcon size={16} weight="bold" />
            </button>
          </div>
          <div
            className={`${styles['aiPanelBody']}${aiReply.error ? ` ${styles['aiPanelError']}` : ""}`}
          >
            {aiReply.text || (aiLoading ? t("catalog.assistant.thinking") : "")}
          </div>
        </div>
      )}

      <div className={styles['section']}>
        <div className={styles['sectionHeader']}>
          <h1 className={styles['sectionTitle']}>{t("catalog.home.venuesTitle")}</h1>
          {publicRestaurantsTotal > 0 && (
            <span style={{ fontSize: "var(--text-base)", color: "var(--text-3)", fontWeight: 600 }}>
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
            title={t("catalog.home.emptyTitle")}
            subtitle={t("catalog.home.emptySubtitleMiniapp")}
          />
        ) : (
          <>
            <div className={styles['grid']}>
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
