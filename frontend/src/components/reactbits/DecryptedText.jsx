import React, { useState, useEffect, useRef } from "react";

const CHARS = "ABCDEF0123456789!@#$%^&*~<>?/\\|{}[]+-=_";

const DecryptedText = ({
  text = "",
  speed = 40,
  maxIterations = 10,
  sequential = true,
  revealDirection = "start",
  useOriginalCharsOnly = false,
  className = "",
  parentClassName = "",
  animateOn = "view",
  encryptedClassName = "",
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    let interval;
    let iteration = 0;

    const startAnimation = () => {
      setIsScrambling(true);
      const originalText = text || "";
      const textLength = originalText.length;

      interval = setInterval(() => {
        setDisplayText((prev) => {
          return originalText
            .split("")
            .map((char, index) => {
              if (char === " " || char === "\n") return char;

              if (sequential) {
                const progress = iteration / maxIterations;
                const charThreshold =
                  revealDirection === "start"
                    ? index / textLength
                    : (textLength - index) / textLength;

                if (progress > charThreshold) {
                  return originalText[index];
                }
              } else {
                if (iteration >= maxIterations) {
                  return originalText[index];
                }
              }

              const availableChars = useOriginalCharsOnly
                ? Array.from(new Set(originalText.split(""))).filter(
                    (c) => c !== " "
                  )
                : CHARS;
              return availableChars[
                Math.floor(Math.random() * availableChars.length)
              ];
            })
            .join("");
        });

        iteration += 1;
        if (iteration > maxIterations + (sequential ? textLength : 0)) {
          clearInterval(interval);
          setDisplayText(originalText);
          setIsScrambling(false);
        }
      }, speed);
    };

    if (animateOn === "view" && !hasAnimated) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimated) {
              setHasAnimated(true);
              startAnimation();
            }
          });
        },
        { threshold: 0.1 }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => {
        clearInterval(interval);
        observer.disconnect();
      };
    } else if (animateOn === "hover" && isHovering) {
      startAnimation();
    } else if (animateOn === "mount") {
      startAnimation();
    }

    return () => clearInterval(interval);
  }, [
    text,
    speed,
    maxIterations,
    sequential,
    revealDirection,
    useOriginalCharsOnly,
    animateOn,
    isHovering,
    hasAnimated,
  ]);

  return (
    <span
      ref={containerRef}
      className={`rb-decrypted-text ${parentClassName}`}
      onMouseEnter={() => animateOn === "hover" && setIsHovering(true)}
      onMouseLeave={() => animateOn === "hover" && setIsHovering(false)}
      style={{ display: "inline-block" }}
    >
      <span className={className}>
        {displayText.split("").map((char, i) => {
          const isDecrypted = char === text[i];
          return (
            <span
              key={i}
              className={!isDecrypted && isScrambling ? encryptedClassName : ""}
              style={{
                color: !isDecrypted && isScrambling ? "#38bdf8" : "inherit",
                opacity: !isDecrypted && isScrambling ? 0.85 : 1,
              }}
            >
              {char}
            </span>
          );
        })}
      </span>
    </span>
  );
};

export default DecryptedText;
