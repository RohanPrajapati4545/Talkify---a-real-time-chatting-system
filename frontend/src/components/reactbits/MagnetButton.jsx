import React, { useRef, useState } from "react";

const MagnetButton = ({
  children,
  className = "",
  magneticStrength = 0.25,
  onClick,
  style = {},
  ...props
}) => {
  const btnRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!btnRef.current) return;
    const { left, top, width, height } = btnRef.current.getBoundingClientRect();
    const x = (e.clientX - (left + width / 2)) * magneticStrength;
    const y = (e.clientY - (top + height / 2)) * magneticStrength;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <button
      ref={btnRef}
      className={`rb-magnet-btn ${className}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: position.x === 0 && position.y === 0 ? "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)" : "transform 0.1s ease-out",
        willChange: "transform",
        ...style,
      }}
      {...props}
    >
      <span className="rb-magnet-content">{children}</span>
    </button>
  );
};

export default MagnetButton;
