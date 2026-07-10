import type { MouseEventHandler, ReactNode } from "react";
import { ShoppingBag, Trash } from "@phosphor-icons/react";
import { formatReviewTime } from "@shared/utils/formatReviewTime";
import StarRatingInput from "@shared/components/StarRatingInput/StarRatingInput";
import type { Review } from "@shared/types/models";
import s from "./ReviewCard.module.css";

interface ReviewCardProps {
  review: Review;
  canDelete?: boolean;
  onDelete?: MouseEventHandler<HTMLButtonElement>;
  showAvatar?: boolean;
  showVerifiedBadge?: boolean;
  className?: string;
  headerExtra?: ReactNode;
  actionsExtra?: ReactNode;
}

const ReviewCard = ({
  review,
  canDelete = false,
  onDelete,
  showAvatar = false,
  showVerifiedBadge = false,
  className,
  headerExtra,
  actionsExtra,
}: ReviewCardProps) => {
  const time = formatReviewTime(review.created_at);
  return (
    <div className={`${s.card}${className ? ` ${className}` : ""}`}>
      <div className={s.header}>
        <div className={s.identity}>
          {showAvatar && (
            <div className={s.avatar}>
              {review.user_id?.slice(0, 1).toUpperCase() || "U"}
            </div>
          )}
          <div>
            <div className={s.name}>
              {review.user_name || "Клиент"}
              {headerExtra}
            </div>
            <div className={s.meta}>
              <StarRatingInput value={review.rating} readOnly size={12} gap={1} />
              {time && <span className={s.time}>{time}</span>}
            </div>
            {showVerifiedBadge && review.is_verified_purchase && (
              <span className="verified-purchase-badge" style={{ marginTop: 3 }}>
                <ShoppingBag size={10} weight="fill" />
                Подтверждённый заказ
              </span>
            )}
          </div>
        </div>
        {(canDelete || actionsExtra) && (
          <div className={s.actions}>
            {actionsExtra}
            {canDelete && (
              <button
                type="button"
                aria-label="Удалить отзыв"
                onClick={onDelete}
                className={s.deleteBtn}
              >
                <Trash size={13} weight="bold" />
              </button>
            )}
          </div>
        )}
      </div>
      {review.text && <p className={s.text}>{review.text}</p>}
    </div>
  );
};

export default ReviewCard;
