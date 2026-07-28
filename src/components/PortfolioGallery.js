"use client";

import { useMemo, useState } from "react";
import GalleryGrid from "@/components/portfolio/GalleryGrid";
import RevealOnScroll from "@/components/RevealOnScroll";
import Sidebar from "@/components/portfolio/Sidebar";

// PortfolioGallery controls which category is selected and passes the filtered
// image list down to the masonry gallery.
export default function PortfolioGallery({ categories, heading, intro, photos }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasIntroHeader = heading || intro;

  const filteredPhotos = useMemo(() => {
    if (activeCategory === "All") {
      return photos;
    }

    return photos.filter((photo) => photo.category === activeCategory);
  }, [activeCategory, photos]);

  function chooseCategory(category) {
    setActiveCategory(category);
    setIsMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-[var(--sand)] text-[var(--walnut)] lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <Sidebar
        activeCategory={activeCategory}
        categories={categories}
        isMenuOpen={isMenuOpen}
        onCategoryChange={chooseCategory}
        onMenuToggle={() => setIsMenuOpen((currentValue) => !currentValue)}
      />

      <main className="px-5 py-12 sm:px-8 lg:col-start-2 lg:px-12 lg:py-16 xl:px-16">
        {hasIntroHeader && (
          <header className="mb-12 max-w-4xl">
            <p className="section-eyebrow">Portfolio</p>
            {heading && (
              <h1 className="mt-4 max-w-4xl text-5xl font-medium uppercase leading-[0.92] tracking-[0.01em] text-[var(--walnut)] sm:text-6xl xl:text-7xl">
                {heading}
              </h1>
            )}
            {intro && (
              <p className="mt-6 max-w-2xl text-xl leading-relaxed text-[var(--walnut)]">
                {intro}
              </p>
            )}
          </header>
        )}

        <RevealOnScroll>
          <GalleryGrid photos={filteredPhotos} />
        </RevealOnScroll>
      </main>
    </div>
  );
}
