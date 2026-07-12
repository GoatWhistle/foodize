import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ page, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        marginTop: 32,
        padding: "16px 0",
      }}
    >
      <button
        className="btn btn-secondary btn-sm"
        disabled={page <= 1}
        onClick={() => { onPageChange(page - 1); }}
        aria-label={`Перейти на страницу ${page - 1}`}
        style={{ borderRadius: "100px", padding: "8px 20px", display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        <CaretLeftIcon size={14} weight="bold" /> Назад
      </button>

      <span
        aria-live="polite"
        style={{
          fontSize: "0.85rem",
          fontWeight: 800,
          color: "var(--text-3)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          minWidth: 100,
          textAlign: "center",
        }}
      >
        {page} / {totalPages}
      </span>

      <button
        className="btn btn-secondary btn-sm"
        disabled={page >= totalPages}
        onClick={() => { onPageChange(page + 1); }}
        aria-label={`Перейти на страницу ${page + 1}`}
        style={{ borderRadius: "100px", padding: "8px 20px", display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        Вперед <CaretRightIcon size={14} weight="bold" />
      </button>
    </div>
  );
};

export default Pagination;
