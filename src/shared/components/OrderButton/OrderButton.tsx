import type { ButtonHTMLAttributes, ReactNode } from "react";
import { CheckIcon } from "@phosphor-icons/react";

interface OrderButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  isSuccess?: boolean;
  children?: ReactNode;
}

export const OrderButton = ({
  onClick,
  children,
  isLoading,
  isSuccess,
  disabled,
  className = "",
  ...props
}: OrderButtonProps) => {
  return (
    <button
      className={`btn btn-primary order-btn ${className} ${isLoading ? "loading" : ""} ${isSuccess ? "success" : ""}`}
      onClick={onClick}
      disabled={disabled || isLoading}
      style={{
        transition: "transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s",
        ...props.style,
      }}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }} role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" style={{ width: "18px", height: "18px" }} />
          Оформление...
        </span>
      ) : isSuccess ? (
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckIcon size={20} weight="bold" />
          Готово!
        </span>
      ) : (
        children
      )}
    </button>
  );
};
