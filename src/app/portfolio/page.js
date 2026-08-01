import PortfolioGallery from "@/components/PortfolioGallery";
import { portfolioCategories, portfolioPhotos } from "@/data/portfolio";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Portfolio | Carla Santos Photography",
  description: "A masonry photography portfolio for Carla Santos.",
};

const masonrySizes = [
  { width: 900, height: 1180 },
  { width: 1100, height: 760 },
  { width: 900, height: 1125 },
  { width: 900, height: 900 },
  { width: 1000, height: 760 },
];

function buildLivePortfolioPhotos(rows) {
  return rows
    .filter((photo) => photo.image_url)
    .map((photo, index) => {
      const fallbackSize = masonrySizes[index % masonrySizes.length];

      return {
        id: photo.id,
        image_url: photo.image_url,
        category: photo.category || "Portfolio",
        order: index + 1,
        // The database does not store image dimensions yet, so these preset
        // sizes keep the masonry grid varied while Carla's uploaded images load.
        width: fallbackSize.width,
        height: fallbackSize.height,
      };
    });
}

async function getPortfolioPhotos() {
  const supabase = await createClient();

  try {
    // Pull every portfolio image from Supabase. If there are no rows yet, the
    // page keeps using the placeholder gallery so visitors never see an empty page.
    const { data, error } = await supabase
      .from("portfolio_images")
      .select("id, category, image_url, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return portfolioPhotos;
    }

    const livePhotos = buildLivePortfolioPhotos(data || []);

    return livePhotos.length > 0 ? livePhotos : portfolioPhotos;
  } catch {
    // If Supabase is temporarily unreachable, keep the gallery usable with
    // the existing placeholder photos.
    return portfolioPhotos;
  }
}

export default async function PortfolioPage() {
  const livePortfolioPhotos = await getPortfolioPhotos();

  return (
    <main className="portfolio-page" id="top">
      <PortfolioGallery
        categories={portfolioCategories}
        photos={livePortfolioPhotos}
      />
    </main>
  );
}
