"use client";

import { useMemo, useRef, useState } from "react";
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
  const fileInputRef = useRef(null);
  const searchRequestIdRef = useRef(0);
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

  const isSearchActive =
    query.trim().length > 0 ||
    Boolean(selectedImage) ||
    hasSearched ||
    isSearching ||
    Boolean(searchError);

  function chooseCategory(category) {
    setActiveCategory(category);
    setIsMenuOpen(false);
  }

  function openImagePicker() {
    /*
      The file input is visually hidden so the search UI can stay compact.
      Clicking the image icon opens the normal browser file picker.
    */
    fileInputRef.current?.click();
  }

  function clearSearch() {
    /*
      Clearing search should return the page to the regular portfolio view.
      We reset every search-related value, including the hidden file input.
    */
    searchRequestIdRef.current += 1;
    setQuery("");
    setSelectedImage(null);
    setSearchResults([]);
    setHasSearched(false);
    setIsSearching(false);
    setSearchError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

    /*
      This id helps us ignore an older search response if the user clears the
      search before the API finishes responding.
    */
    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;

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

      if (searchRequestIdRef.current === requestId) {
        setSearchResults(result.matches || []);
        setHasSearched(true);
      }
    } catch (error) {
      if (searchRequestIdRef.current === requestId) {
        setSearchResults([]);
        setHasSearched(true);
        setSearchError(
          error.message || "Photo search failed. Please try again.",
        );
      }
    } finally {
      if (searchRequestIdRef.current === requestId) {
        setIsSearching(false);
      }
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
            className="mb-16 flex justify-center"
          >
            <div className="w-full max-w-4xl">
              <div className="relative">
                <form onSubmit={handleSearch}>
                  <label className="sr-only" htmlFor="portfolio-photo-search">
                    Search portfolio photos
                  </label>
                  <div className="flex items-center gap-2 rounded-full border border-[rgba(var(--text-rgb),0.18)] bg-[rgba(var(--background-rgb),0.92)] px-4 py-3 shadow-[0_14px_30px_rgba(var(--text-rgb),0.08)] transition-all duration-200 ease-out focus-within:border-[var(--dusty-olive)] focus-within:shadow-[0_18px_34px_rgba(var(--text-rgb),0.12)] sm:px-5">
                    <input
                      className="min-w-0 flex-1 bg-transparent px-2 py-2 text-base text-[var(--walnut)] outline-none placeholder:text-[rgba(var(--text-rgb),0.48)] sm:text-lg"
                      id="portfolio-photo-search"
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Type a description, or upload an inspiration image to find portfolio photos with a similar mood."
                      type="text"
                      value={query}
                    />

                    <input
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        setSelectedImage(event.target.files?.[0] || null)
                      }
                      ref={fileInputRef}
                      type="file"
                    />

                    <button
                      aria-label="Upload an inspiration image"
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--dusty-olive)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[var(--section-alternate)] hover:text-[var(--walnut)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--dusty-olive)]"
                      onClick={openImagePicker}
                      type="button"
                    >
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                      >
                        <rect height="16" rx="2.5" width="18" x="3" y="4" />
                        <circle cx="8.5" cy="9" r="1.5" />
                        <path d="m21 16-5.4-5.4a1.4 1.4 0 0 0-2 0L5 19" />
                      </svg>
                    </button>

                    <button
                      aria-label="Search portfolio photos"
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--dusty-olive)] text-[var(--sand)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-105 hover:bg-[var(--walnut)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--dusty-olive)] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isSearching}
                      type="submit"
                    >
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="11" cy="11" r="7" />
                        <path d="m16.5 16.5 3.5 3.5" />
                      </svg>
                    </button>
                  </div>
                </form>

                {isSearchActive && (
                  <button
                    aria-label="Clear photo search"
                    className="absolute -right-2 -top-2 grid h-9 w-9 place-items-center rounded-full border border-[rgba(var(--text-rgb),0.18)] bg-[var(--section-alternate)] text-xl leading-none text-[var(--walnut)] shadow-[0_8px_18px_rgba(var(--text-rgb),0.10)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[var(--dusty-olive)] hover:text-[var(--sand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--dusty-olive)]"
                    onClick={clearSearch}
                    type="button"
                  >
                    ×
                  </button>
                )}
              </div>

              {selectedImage && (
                <p className="mt-3 text-center text-sm text-[rgba(var(--text-rgb),0.68)]">
                  Image selected: {selectedImage.name}
                </p>
              )}

              {searchError && (
                <p className="mt-3 rounded-full border border-[rgba(var(--text-rgb),0.16)] bg-[var(--section-alternate)] px-5 py-3 text-center text-sm text-[var(--walnut)]">
                  {searchError}
                </p>
              )}

              {isSearching && (
                <p className="mt-3 text-center text-sm uppercase tracking-[0.14em] text-[var(--dusty-olive)]">
                  Searching...
                </p>
              )}
            </div>
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

        {!hasSearched && (
          <RevealOnScroll>
            <GalleryGrid photos={filteredPhotos} />
          </RevealOnScroll>
        )}
      </main>
    </div>
  );
}
