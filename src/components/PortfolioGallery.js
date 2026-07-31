"use client";

import { useMemo, useState } from "react";
import GalleryGrid from "@/components/portfolio/GalleryGrid";
import RevealOnScroll from "@/components/RevealOnScroll";
import Sidebar from "@/components/portfolio/Sidebar";

const searchResultSizes = [
  { width: 900, height: 1180 },
  { width: 1100, height: 760 },
  { width: 900, height: 1125 },
  { width: 900, height: 900 },
  { width: 1000, height: 760 },
];

function formatSearchResults(results) {
  /*
    Search results from the API only need the image data. The gallery component
    also expects width and height, so we add simple placeholder dimensions here.
  */
  return results.map((photo, index) => {
    const size = searchResultSizes[index % searchResultSizes.length];

    return {
      ...photo,
      width: size.width,
      height: size.height,
    };
  });
}

// PortfolioGallery controls which category is selected and passes the filtered
// image list down to the masonry gallery.
export default function PortfolioGallery({ categories, heading, intro, photos }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const hasIntroHeader = heading || intro;

  const filteredPhotos = useMemo(() => {
    if (activeCategory === "All") {
      return photos;
    }

    return photos.filter((photo) => photo.category === activeCategory);
  }, [activeCategory, photos]);

  const formattedSearchResults = useMemo(
    () => formatSearchResults(searchResults),
    [searchResults],
  );

  function chooseCategory(category) {
    setActiveCategory(category);
    setIsMenuOpen(false);
  }

  async function handleSearch(event) {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery && !selectedImage) {
      setSearchError("Please type a search description or choose an image.");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setHasSearched(false);

    try {
      let response;

      if (selectedImage) {
        /*
          Uploaded images need FormData because files cannot be sent as plain
          JSON. The API route will use the image first when one is present.
        */
        const formData = new FormData();
        formData.append("image", selectedImage);

        if (trimmedQuery) {
          formData.append("query", trimmedQuery);
        }

        response = await fetch("/api/search-photos", {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch("/api/search-photos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: trimmedQuery }),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Photo search failed.");
      }

      setSearchResults(result.matches || []);
      setHasSearched(true);
    } catch (error) {
      setSearchResults([]);
      setHasSearched(true);
      setSearchError(error.message || "Photo search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
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
          <section
            aria-label="Search portfolio photos"
            className="mb-12 rounded-[2rem] border border-[rgba(var(--text-rgb),0.16)] bg-[rgba(var(--section-alternate-rgb),0.55)] p-6 shadow-[0_16px_36px_rgba(70,60,50,0.08)] sm:p-8"
          >
            <p className="section-eyebrow">Search</p>
            <h2 className="mt-3 text-3xl font-medium text-[var(--walnut)] sm:text-4xl">
              Find photos by feeling
            </h2>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-[rgba(var(--text-rgb),0.76)]">
              Type a description, or upload an inspiration image to find
              portfolio photos with a similar mood.
            </p>

            <form className="mt-7 grid gap-5" onSubmit={handleSearch}>
              <label className="grid gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[var(--walnut)]">
                Search description
                <input
                  className="w-full rounded-full border border-[rgba(var(--text-rgb),0.2)] bg-[var(--sand)] px-5 py-4 text-base normal-case tracking-[0] text-[var(--walnut)] outline-none transition-all duration-200 ease-out placeholder:text-[rgba(var(--text-rgb),0.45)] focus:border-[var(--clay)] focus:shadow-[0_0_0_4px_rgba(var(--text-rgb),0.06)]"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="golden hour backlighting"
                  type="search"
                  value={query}
                />
              </label>

              <div className="grid gap-3 rounded-[1.5rem] border border-dashed border-[rgba(var(--text-rgb),0.22)] bg-[rgba(var(--background-rgb),0.5)] p-5">
                <label className="grid gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[var(--walnut)]">
                  Or upload an image to find similar photos
                  <input
                    accept="image/*"
                    className="w-full rounded-full border border-[rgba(var(--text-rgb),0.2)] bg-[var(--sand)] px-4 py-3 text-base normal-case tracking-[0] text-[var(--walnut)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--clay)] file:px-5 file:py-2 file:text-sm file:font-bold file:uppercase file:tracking-[0.12em] file:text-[var(--sand)]"
                    onChange={(event) =>
                      setSelectedImage(event.target.files?.[0] || null)
                    }
                    type="file"
                  />
                </label>

                {selectedImage && (
                  <p className="text-sm text-[rgba(var(--text-rgb),0.68)]">
                    Selected image: {selectedImage.name}
                  </p>
                )}
              </div>

              {searchError && (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {searchError}
                </p>
              )}

              <button
                className="text-button w-fit disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSearching}
                type="submit"
              >
                {isSearching ? "Searching..." : "Search Photos"}
              </button>
            </form>
          </section>
        </RevealOnScroll>

        {hasSearched && (
          <RevealOnScroll>
            <section className="mb-14">
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="section-eyebrow">Matches</p>
                  <h2 className="mt-2 text-3xl font-medium text-[var(--walnut)] sm:text-4xl">
                    Search Results
                  </h2>
                </div>

                {formattedSearchResults.length > 0 && (
                  <p className="text-sm uppercase tracking-[0.14em] text-[rgba(var(--text-rgb),0.62)]">
                    {formattedSearchResults.length} photos found
                  </p>
                )}
              </div>

              {formattedSearchResults.length > 0 ? (
                <GalleryGrid photos={formattedSearchResults} />
              ) : (
                <p className="rounded-[1.5rem] border border-[rgba(var(--text-rgb),0.16)] bg-[rgba(var(--section-alternate-rgb),0.55)] px-6 py-8 text-lg text-[rgba(var(--text-rgb),0.72)]">
                  No matching photos yet. Try a different description or image.
                </p>
              )}
            </section>
          </RevealOnScroll>
        )}

        <RevealOnScroll>
          <GalleryGrid photos={filteredPhotos} />
        </RevealOnScroll>
      </main>
    </div>
  );
}
