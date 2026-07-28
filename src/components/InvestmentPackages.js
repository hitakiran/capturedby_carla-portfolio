"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// InvestmentPackages is a Client Component because the tabs change the
// selected package category and read the URL hash, like /investment#couples.
export default function InvestmentPackages({ categories }) {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0].id);

  useEffect(() => {
    function selectCategoryFromHash() {
      const hashId = window.location.hash.replace("#", "");
      const matchingCategory = categories.find((category) => category.id === hashId);

      if (matchingCategory) {
        setActiveCategoryId(matchingCategory.id);
      }
    }

    selectCategoryFromHash();
    window.addEventListener("hashchange", selectCategoryFromHash);

    return () => window.removeEventListener("hashchange", selectCategoryFromHash);
  }, [categories]);

  function chooseCategory(categoryId) {
    setActiveCategoryId(categoryId);
  }

  const activeCategory =
    categories.find((category) => category.id === activeCategoryId) || categories[0];
  const activeTitle = activeCategory.collectionTitle || activeCategory.name;
  const activeLabel = activeCategory.sectionLabel || activeCategory.name;
  const packageGridClassName =
    activeCategory.packages.length === 2
      ? "investment-package-grid has-two-packages"
      : "investment-package-grid";

  return (
    <section className="investment-packages-section" aria-labelledby="investment-packages-heading">
      <div className="investment-tabs" role="tablist" aria-label="Choose package category">
        {categories.map((category) => (
          <a
            aria-selected={activeCategory.id === category.id}
            className={activeCategory.id === category.id ? "is-active" : ""}
            href={`#${category.id}`}
            key={category.id}
            onClick={() => chooseCategory(category.id)}
            role="tab"
          >
            {category.name}
          </a>
        ))}
      </div>

      {/* Decorative lace divider between the tabs and package cards. */}
      <div className="investment-lace-strip" aria-hidden="true" />

      {/* This id lets direct links like /investment#wedding land on this category. */}
      <div className="investment-category-panel" id={activeCategory.id}>
        <h2 id="investment-packages-heading">{activeTitle}</h2>
        {activeCategory.intro && <p>{activeCategory.intro}</p>}

        <div className={`${packageGridClassName} reveal-stagger-group is-visible`}>
          {activeCategory.packages.map((packageItem, index) => (
            <article
              className="investment-package-card reveal-stagger-item"
              key={packageItem.id}
              style={{ "--reveal-index": index }}
            >
              <div className="investment-package-header">
                <p className="investment-package-label">{activeLabel}</p>
                <h3>{packageItem.name}</h3>
                {packageItem.description && (
                  <p className="investment-package-description">{packageItem.description}</p>
                )}
              </div>

              <ul>
                {packageItem.includes.map((includedItem) => (
                  <li key={includedItem}>{includedItem}</li>
                ))}
              </ul>

              <strong className="investment-package-price">
                {packageItem.price.startsWith("begins at ") ? (
                  <>
                    <span>begins at</span>
                    <span>{packageItem.price.replace("begins at ", "")}</span>
                  </>
                ) : (
                  <span>{packageItem.price}</span>
                )}
              </strong>
            </article>
          ))}
        </div>

        {/* One inquiry button keeps the package cards clean and points to the new form. */}
        <Link className="text-button investment-inquiry-button" href="/inquiry">
          Inquiry
        </Link>
      </div>
    </section>
  );
}
