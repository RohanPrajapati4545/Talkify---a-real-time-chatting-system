import React from "react";

const ShinyText = ({
  text,
  disabled = false,
  speed = 4,
  className = "",
  color = "#ffffff",
  shineColor = "#6366f1",
  style = {},
}) => {
  return (
    <span
      className={`rb-shiny-text ${disabled ? "disabled" : ""} ${className}`}
      style={{
        display: "inline-block",
        backgroundImage: `linear-gradient(120deg, ${color} 0%, ${color} 40%, ${shineColor} 50%, ${color} 60%, ${color} 100%)`,
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        animation: !disabled ? `rb-shiny-sweep ${speed}s linear infinite` : "none",
        ...style,
      }}
    >
      {text}
    </span>
  );
};

export default ShinyText;
