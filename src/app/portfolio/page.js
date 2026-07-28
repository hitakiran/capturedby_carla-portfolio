import PortfolioGallery from "@/components/PortfolioGallery";
import { portfolioCategories, portfolioPhotos } from "@/data/portfolio";

export const metadata = {
  title: "Portfolio | Carla Santos Photography",
  description: "A masonry photography portfolio for Carla Santos.",
};

export default function PortfolioPage() {
  return (
    <main className="portfolio-page" id="top">
      <PortfolioGallery
        categories={portfolioCategories}
        photos={portfolioPhotos}
      />
    </main>
  );
}
