"use client";

import { useEffect, useRef, useState } from "react";

function getSafeRating(rating) {
  const numericRating = Number(rating) || 5;
  return Math.min(Math.max(numericRating, 1), 5);
}

// This component is a Client Component because the review row moves
// automatically every few seconds.
export default function ReviewsSection({ content }) {
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cardStep, setCardStep] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const reviews = content.reviews;

  // Duplicating the review list lets the row loop smoothly.
  // The duplicate cards are only for animation, not new content.
  const loopingReviews = [...reviews, ...reviews];

  useEffect(() => {
    function measureCardStep() {
      const trackElement = trackRef.current;
      const firstCard = trackElement?.querySelector(".review-card");

      if (!trackElement || !firstCard) {
        return;
      }

      const cardWidth = firstCard.getBoundingClientRect().width;
      const trackStyles = getComputedStyle(trackElement);
      const cardGap = parseFloat(trackStyles.columnGap) || 0;

      // One carousel step equals one card plus the visible space between cards.
      setCardStep(cardWidth + cardGap);
    }

    measureCardStep();
    window.addEventListener("resize", measureCardStep);

    return () => window.removeEventListener("resize", measureCardStep);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((currentIndex) => currentIndex + 1);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  function showReview(nextIndex) {
    const normalizedIndex = activeIndex % reviews.length;

    if (nextIndex === normalizedIndex) {
      return;
    }

    setIsResetting(false);
    setActiveIndex(nextIndex);
  }

  useEffect(() => {
    if (activeIndex !== reviews.length) {
      return;
    }

    // After the last real review slides out, jump back to the matching
    // first review without a transition. This keeps the loop seamless.
    const resetTimer = setTimeout(() => {
      setIsResetting(true);
      setActiveIndex(0);
    }, 650);

    return () => clearTimeout(resetTimer);
  }, [activeIndex, reviews.length]);

  useEffect(() => {
    if (!isResetting) {
      return;
    }

    // Re-enable transitions on the next browser paint after the hidden reset.
    const animationFrameId = requestAnimationFrame(() => {
      setIsResetting(false);
    });

    return () => cancelAnimationFrame(animationFrameId);
  }, [isResetting]);

  return (
    <section className="reviews-section" aria-labelledby="reviews-heading">
      <div className="reviews-inner">
        <h2 id="reviews-heading">{content.heading}</h2>

        <div className="reviews-window" aria-live="polite">
          <div
            className={`reviews-track${isResetting ? " is-resetting" : ""}`}
            ref={trackRef}
            style={{
              transform: `translateX(-${activeIndex * cardStep}px)`,
            }}
          >
            {loopingReviews.map((review, index) => (
              <article
                className="review-card reveal-stagger-item"
                key={`${review.id}-${index}`}
                style={{ "--reveal-index": index % reviews.length }}
              >
                <div
                  className="review-stars"
                  aria-label={`${getSafeRating(review.rating)} out of 5 stars`}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      aria-hidden="true"
                      className={star > getSafeRating(review.rating) ? "review-star-empty" : ""}
                      key={star}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p>{review.text}</p>
                <strong>-{review.name}</strong>
              </article>
            ))}
          </div>
        </div>

        <div className="review-dots" aria-label="Choose a client review">
          {reviews.map((review, index) => (
            <button
              aria-label={`Show review from ${review.name}`}
              aria-pressed={activeIndex % reviews.length === index}
              className={activeIndex % reviews.length === index ? "is-active" : ""}
              key={review.id}
              onClick={() => showReview(index)}
              type="button"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
