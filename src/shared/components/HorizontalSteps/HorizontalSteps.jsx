import { Fragment } from "react";
import { ORDER_STATUS_RU } from "@shared/utils/locales.js";

const STATUS_FLOW = ["PENDING", "ACCEPTED", "READY", "COMPLETED"];

const HorizontalSteps = ({ order }) => {
  const currentIndex = order.status === "CANCELLED" ? -1 : STATUS_FLOW.indexOf(order.status);

  return (
    <div style={{ width: "100%", maxWidth: 380, marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        {STATUS_FLOW.map((status, i) => {
          const state =
            order.status === "CANCELLED" ? "next"
            : i < currentIndex ? "done"
            : i === currentIndex ? "current"
            : "next";

          const dotColor =
            state === "done" ? "var(--color-success)"
            : state === "current" ? "var(--accent)"
            : "var(--border)";

          const isActiveLine =
            i === currentIndex + 1 &&
            order.status !== "CANCELLED" &&
            order.status !== "COMPLETED";

          const lineColor =
            i <= currentIndex && order.status !== "CANCELLED"
              ? "var(--color-success)"
              : "var(--border)";

          return (
            <Fragment key={status}>
              {i > 0 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background: isActiveLine ? "linear-gradient(90deg, var(--color-success), var(--accent))" : lineColor,
                    marginTop: 5,
                    transition: "background 0.4s",
                    borderRadius: 2,
                  }}
                />
              )}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: dotColor,
                    flexShrink: 0,
                    transition: "background 0.4s",
                    boxShadow:
                      state === "done" ? "0 0 0 3px var(--color-success-bg)"
                      : state === "current" ? "0 0 0 3px var(--accent-subtle)"
                      : "none",
                  }}
                />
                <div
                  style={{
                    fontSize: "0.64rem",
                    fontWeight: state === "current" ? 800 : 500,
                    color:
                      state === "next" ? "var(--text-3)"
                      : state === "current" ? "var(--accent)"
                      : "var(--color-success)",
                    textAlign: "center",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                  }}
                >
                  {ORDER_STATUS_RU[status] ?? status}
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default HorizontalSteps;
