import React, { useRef, useState } from "react";

const SpotlightCard = ({
  children,
  className = "",
  spotlightColor = "rgba(99, 102, 241, 0.18)",
  borderColor = "rgba(99, 102, 241, 0.4)",
  radius = 300,
  onClick,
  style = {},
}) => {
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current || isFocused) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`rb-spotlight-card ${className}`}
      style={{
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        className="rb-spotlight-glow"
        style={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          opacity: opacity,
          transition: "opacity 300ms ease",
          background: `radial-gradient(${radius}px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
          zIndex: 1,
        }}
      />
      <div
        className="rb-spotlight-border-glow"
        style={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          opacity: opacity,
          transition: "opacity 300ms ease",
          borderRadius: "inherit",
          border: `1px solid ${borderColor}`,
          zIndex: 2,
        }}
      />
      <div style={{ position: "relative", zIndex: 3, width: "100%", height: "100%" }}>
        {children}
      </div>
    </div>
  );
};

export default SpotlightCard;
