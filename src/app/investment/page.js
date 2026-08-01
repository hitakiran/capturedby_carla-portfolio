import InvestmentPackages from "@/components/InvestmentPackages";
import RevealOnScroll from "@/components/RevealOnScroll";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { contactContent, heroContent, navLinks } from "@/data/homepage";
import { investmentCategories } from "@/data/investment";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Investment | Carla Santos Photography",
  description: "Placeholder photography packages and pricing for Carla Santos.",
};

function getFeaturesArray(features) {
  // Supabase stores features as a text[] array. If the value is missing, use
  // an empty array so the package card can still render safely.
  if (Array.isArray(features)) {
    return features;
  }

  return [];
}

function sortByDisplayOrder(rows) {
  return [...rows].sort((firstRow, secondRow) => {
    const firstOrder =
      typeof firstRow.display_order === "number" ? firstRow.display_order : Number.MAX_SAFE_INTEGER;
    const secondOrder =
      typeof secondRow.display_order === "number" ? secondRow.display_order : Number.MAX_SAFE_INTEGER;

    if (firstOrder !== secondOrder) {
      return firstOrder - secondOrder;
    }

    return new Date(firstRow.created_at || 0) - new Date(secondRow.created_at || 0);
  });
}

const INVESTMENT_CATEGORY_ALIASES = {
  brand: "brands",
  branding: "brands",
  brands: "brands",
  "events-branding": "brands",
  event: "brands",
  events: "brands",
  couple: "couples",
  couples: "couples",
  families: "families",
  family: "families",
  portrait: "portraits",
  portraits: "portraits",
  wedding: "wedding",
  weddings: "wedding",
};

function getCategorySlug(category) {
  return String(category || "")
    .trim()
    .toLowerCase()
    .replaceAll("/", "-")
    .replaceAll(" ", "-");
}

function getCategoryId(category) {
  const categorySlug = getCategorySlug(category);

  // Supabase rows may use labels like "Wedding", "Weddings", or "Events/Branding".
  // This maps those labels back to the five public tabs used on the page.
  return INVESTMENT_CATEGORY_ALIASES[categorySlug] || categorySlug;
}

function buildLiveInvestmentCategories(packages) {
  if (packages.length === 0) {
    return investmentCategories;
  }

  const packagesByCategory = packages.reduce((groups, packageItem) => {
    const categoryId = getCategoryId(packageItem.category);

    if (!groups[categoryId]) {
      groups[categoryId] = {
        category: packageItem.category,
        packages: [],
        sectionTitle: packageItem.section_title || "",
      };
    }

    if (!groups[categoryId].sectionTitle && packageItem.section_title) {
      groups[categoryId].sectionTitle = packageItem.section_title;
    }

    groups[categoryId].packages.push(packageItem);
    return groups;
  }, {});

  // Keep the existing category order/design data, but replace editable content
  // with Supabase rows when they are available.
  return investmentCategories.map((fallbackCategory) => {
    const matchingGroup = packagesByCategory[fallbackCategory.id];

    if (!matchingGroup) {
      return fallbackCategory;
    }

    const livePackages = sortByDisplayOrder(matchingGroup.packages).map((packageItem) => ({
      id: packageItem.id,
      name: packageItem.package_title || "",
      description: packageItem.description || "",
      includes: getFeaturesArray(packageItem.features),
      startingPrice: packageItem.price,
    }));

    return {
      ...fallbackCategory,
      collectionTitle:
        matchingGroup.sectionTitle ||
        fallbackCategory.collectionTitle ||
        fallbackCategory.name,
      packages: livePackages.length > 0 ? livePackages : fallbackCategory.packages,
    };
  });
}

async function getInvestmentCategories() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("investment_packages")
      .select(
        "id, category, section_title, package_title, description, features, price, display_order, created_at",
      )
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      return investmentCategories;
    }

    return buildLiveInvestmentCategories(sortByDisplayOrder(data || []));
  } catch {
    // When live package data cannot load, the public page keeps its fallback
    // cards so visitors can still browse the Investment page.
    return investmentCategories;
  }
}

export default async function InvestmentPage() {
  const liveInvestmentCategories = await getInvestmentCategories();

  return (
    <main className="site-shell investment-page" id="top">
      <SiteHeader navLinks={navLinks} navLogo={heroContent.navLogo} />

      <RevealOnScroll
        as="section"
        className="investment-hero"
        aria-labelledby="investment-heading"
      >
        <p className="section-eyebrow">Investment</p>
        <h1 id="investment-heading">Choose the story you want documented.</h1>
        <p>
          Every session is tailored to you — explore the collections below to find the
          experience that fits your story.
        </p>
      </RevealOnScroll>

      <RevealOnScroll>
        <InvestmentPackages categories={liveInvestmentCategories} />
      </RevealOnScroll>

      <RevealOnScroll>
        <SiteFooter content={contactContent} />
      </RevealOnScroll>
    </main>
  );
}
