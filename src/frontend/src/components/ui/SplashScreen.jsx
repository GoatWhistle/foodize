import { useState, useEffect } from "react";
import FoodizeLogo from "./FoodizeLogo";

const SplashScreen = ({ onDone }) => {
  const [phase, setPhase] = useState("in");
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("out"), 1400);
    const t2 = setTimeout(() => {
      setHidden(true);
      onDone();
    }, 1900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      className={`splash-screen${hidden ? " hidden" : ""}`}
      style={{
        flexDirection: "column",
        gap: "32px",
        background: "var(--ink, #0d0d0d)",
        transition: "opacity 500ms cubic-bezier(0.16,1,0.3,1)",
        opacity: phase === "out" ? 0 : 1,
      }}
    >
      <div
        style={{
          animation: "splash-logo-in 700ms cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        <FoodizeLogo size={44} color="#ffffff" />
      </div>

      <div
        style={{
          width: 32,
          height: 2,
          borderRadius: 2,
          background: "rgba(255,255,255,0.15)",
          overflow: "hidden",
          animation:
            "splash-logo-in 700ms 200ms cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "var(--fire, #ff4520)",
            animation:
              "splash-bar 1000ms 300ms cubic-bezier(0.16,1,0.3,1) forwards",
            width: "0%",
          }}
        />
      </div>

      <style>{`
        @keyframes splash-logo-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splash-bar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
