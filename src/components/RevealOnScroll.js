"use client";

import { useEffect, useRef, useState } from "react";

// RevealOnScroll is a small reusable animation helper.
// It watches one section with IntersectionObserver, then adds a class when
// that section first enters the screen. CSS handles the actual animation.
export default function RevealOnScroll({
  as: Tag = "div",
  children,
  className = "",
  stagger = false,
  ...props
}) {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        setIsVisible(true);
        observer.unobserve(entry.target);
      },
      { threshold: 0.16 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const revealClassName = [
    "reveal-on-scroll",
    stagger ? "reveal-stagger-group" : "",
    isVisible ? "is-visible" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={revealClassName} ref={elementRef} {...props}>
      {children}
    </Tag>
  );
}
