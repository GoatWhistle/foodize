import { useState, useEffect } from "react";
import FoodizeLogo from "./FoodizeLogo";

const SplashScreen = ({ onDone }) => {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHidden(true);
      setTimeout(onDone, 400);
    }, 1600);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className={`splash-screen${hidden ? " hidden" : ""}`}>
      <FoodizeLogo size={44} animated color="#FFFFFF" />
    </div>
  );
};

export default SplashScreen;
