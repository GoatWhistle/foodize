import { useState } from "react";
import { Check } from "@phosphor-icons/react";

const OrderButton = ({
  onClick,
  children,
  isLoading,
  isSuccess,
  disabled,
  className = "",
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      className={`btn btn-primary ${className} ${isLoading ? "loading" : ""} ${isSuccess ? "success" : ""}`}
      onClick={onClick}
      disabled={disabled || isLoading}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={{
        transform: isPressed ? "scale(0.96)" : "scale(1)",
        transition: "transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s",
        ...props.style,
      }}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="spinner" style={{ width: "18px", height: "18px" }} />
          Оформление...
        </span>
      ) : isSuccess ? (
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Check size={20} weight="bold" />
          Готово!
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default OrderButton;
