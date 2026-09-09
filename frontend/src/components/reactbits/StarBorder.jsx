import React from "react";

const StarBorder = ({
  as: Component = "button",
  className = "",
  color = "#6366f1",
  speed = "4s",
  thickness = 1,
  children,
  onClick,
  style = {},
  ...rest
}) => {
  return (
    <Component
      className={`rb-star-border-container ${className}`}
      onClick={onClick}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "inherit",
        padding: `${thickness}px`,
        overflow: "hidden",
        background: "transparent",
        border: "none",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
      {...rest}
    >
      <div
        className="rb-star-border-beam"
        style={{
          position: "absolute",
          width: "300%",
          height: "300%",
          top: "-100%",
          left: "-100%",
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${color} 60deg, transparent 120deg)`,
          animation: `rb-star-spin ${speed} linear infinite`,
          zIndex: 1,
        }}
      />
      <div
        className="rb-star-border-inner"
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          height: "100%",
          borderRadius: "inherit",
        }}
      >
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
