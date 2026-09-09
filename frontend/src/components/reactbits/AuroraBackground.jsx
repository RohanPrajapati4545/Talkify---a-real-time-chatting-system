import React from "react";

const AuroraBackground = ({ children, className = "", showRadialGradient = true }) => {
  return (
    <div className={`rb-aurora-wrapper ${className}`}>
      <div className="rb-aurora-layer">
        <div className="rb-aurora-blob rb-aurora-blob-1" />
        <div className="rb-aurora-blob rb-aurora-blob-2" />
        <div className="rb-aurora-blob rb-aurora-blob-3" />
      </div>
      {showRadialGradient && <div className="rb-aurora-mask" />}
      <div className="rb-aurora-content">{children}</div>
    </div>
  );
};

export default AuroraBackground;
