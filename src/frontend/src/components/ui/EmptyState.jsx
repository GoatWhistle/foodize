import { useEffect, useRef } from "react";

const EmptyState = ({ title = "Здесь пусто", subtitle, action }) => {
  const pinRef = useRef(null);

  useEffect(() => {
    const el = pinRef.current;
    if (!el) return;

    const hop = () => {
      el.classList.remove("empty-pin");
      void el.offsetWidth; // reflow
      el.classList.add("empty-pin");
    };

    hop();
    const interval = setInterval(hop, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="empty-state page-enter">
      <span ref={pinRef} style={{ fontSize: "3rem", display: "inline-block" }}>
        📍
      </span>
      <p className="empty-title">{title}</p>
      {subtitle && <p className="empty-subtitle">{subtitle}</p>}
      {action && (
        <button
          className="btn btn-primary"
          style={{ marginTop: 8 }}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
