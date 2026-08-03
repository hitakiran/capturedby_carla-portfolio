"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// This component is a Client Component because it uses state and a timer.
// The homepage sends it placeholder categories from src/data/homepage.js.
export default function CategoryShowcase({ categories }) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Every 8 seconds, move to the next category.
  // The modulo (%) makes the slideshow loop back to the first category.
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((currentIndex) => {
        return (currentIndex + 1) % categories.length;
      });
    }, 8000);

    // Cleanup stops the old timer if this component ever unmounts.
    return () => clearInterval(timer);
  }, [categories.length]);

  const activeCategory = categories[activeIndex];
  // This collage has four designed photo positions. If the database has more
  // photos in a category, show only the first four here so the layout stays tight.
  const visiblePhotos = activeCategory.photos.slice(0, 4);

  function showCategory(nextIndex) {
    // This helper makes tab clicks easy to read and avoids repeating setActiveIndex.
    setActiveIndex(nextIndex);
  }

  return (
    <section className="showcase-section" id="styles" aria-labelledby="showcase-heading">
      {/* The tabs sit in their own solid bar, separate from the striped collage. */}
      <div className="showcase-tab-bar">
        <div className="showcase-tabs" role="tablist" aria-label="Photography styles">
          {categories.map((category, index) => (
            <button
              aria-selected={activeIndex === index}
              className={activeIndex === index ? "is-active" : ""}
              key={category.id}
              onClick={() => showCategory(index)}
              role="tab"
              type="button"
            >
              {category.category}
            </button>
          ))}
        </div>
      </div>

      {/* This patterned area holds the rotating photos, text frame, and dots. */}
      <div className="showcase-pattern-area">
        <div
          className={`showcase-collage ${activeCategory.layoutVariant} showcase-category-${activeCategory.id}`}
          key={activeCategory.id}
        >
          {/* Decorative placeholder photos around the center callout. */}
          {visiblePhotos.map((photoUrl, photoIndex) => (
            <div
              className={`showcase-photo showcase-photo-${photoIndex + 1}`}
              key={`${activeCategory.id}-${photoUrl}`}
              style={{ "--reveal-index": photoIndex }}
            >
              <Image
                src={photoUrl}
                alt={`${activeCategory.category} placeholder photo`}
                fill
                // These images are displayed as decorative collage photos.
                // A larger sizes value + higher quality keeps uploaded photos crisp.
                sizes="(max-width: 768px) 48vw, (max-width: 1100px) 280px, 380px"
                quality={92}
                className="object-cover"
              />
            </div>
          ))}

          {/* The text box uses the lace frame as the same decorative frame for every category. */}
          <div className="showcase-card-block" style={{ "--reveal-index": 4 }}>
            <div className="showcase-card-frame">
              <div className="showcase-card">
                <p className="section-eyebrow">Featured Stories</p>
                <h2 className="showcase-category-title" id="showcase-heading">
                  {activeCategory.category}
                </h2>
                <p>{activeCategory.label}</p>
              </div>
            </div>

            {/* The buttons sit below the rounded rectangle, as separate actions. */}
            <div className="showcase-actions">
              <Link href={activeCategory.investmentHref}>See Packages</Link>
              <Link href="/inquiry">Inquiry</Link>
            </div>

          </div>
        </div>

        {/* Small dots mirror the tab state and give a subtle slideshow indicator. */}
        <div className="showcase-dots" aria-label="Choose a photo category">
          {categories.map((category, index) => (
            <button
              aria-label={`Show ${category.category}`}
              aria-pressed={activeIndex === index}
              className={activeIndex === index ? "is-active" : ""}
              key={category.id}
              onClick={() => showCategory(index)}
              type="button"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
