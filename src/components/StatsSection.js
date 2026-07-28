"use client";

import { useEffect, useRef, useState } from "react";

// This component is a Client Component because it watches scroll position
// and animates the numbers after the section enters the viewport.
export default function StatsSection({ content }) {
  const sectionRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [visibleNumbers, setVisibleNumbers] = useState(() => {
    return content.stats.map(() => 0);
  });

  useEffect(() => {
    const sectionElement = sectionRef.current;

    if (!sectionElement || hasAnimated) {
      return;
    }

    // IntersectionObserver tells us when the stats section scrolls into view.
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (firstEntry.isIntersecting) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(sectionElement);

    // Cleanup removes the observer if the component ever unmounts.
    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) {
      return;
    }

    const animationDuration = 1800;
    const startTime = performance.now();
    let animationFrameId;

    function animate(currentTime) {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / animationDuration, 1);

      // Ease-out makes the number move quickly at first, then settle softly.
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setVisibleNumbers(
        content.stats.map((stat) => {
          return Math.round(stat.value * easedProgress);
        }),
      );

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    }

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [content.stats, hasAnimated]);

  function getDisplayNumber(stat, index) {
    const currentNumber = visibleNumbers[index];

    // Once complete, show the exact final formatting written in homepage.js.
    if (hasAnimated && visibleNumbers[index] === stat.value) {
      return stat.displayValue;
    }

    // While counting, keep helpful suffixes visible so numbers with +
    // visibly animate with the same final style.
    if (stat.displayValue.includes("K")) {
      return `${currentNumber}K`;
    }

    if (stat.displayValue.includes("+")) {
      return `${currentNumber.toLocaleString()}+`;
    }

    return currentNumber.toLocaleString();
  }

  return (
    <section
      className={`stats-section reveal-stagger-group${hasAnimated ? " is-visible" : ""}`}
      ref={sectionRef}
      aria-labelledby="stats-heading"
    >
      <div className="stats-inner">
        {/* The heading now stands alone, with no eyebrow text above it. */}
        <h2 id="stats-heading">{content.heading}</h2>

        <div className="stats-grid">
          {content.stats.map((stat, index) => (
            <article
              className="stat-card reveal-stagger-item"
              key={stat.id}
              style={{ "--reveal-index": index }}
            >
              <strong>{getDisplayNumber(stat, index)}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
