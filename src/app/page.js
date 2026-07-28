import Image from "next/image";
import CategoryShowcase from "@/components/CategoryShowcase";
import ContactFooter from "@/components/ContactFooter";
import MarqueeStrip from "@/components/MarqueeStrip";
import MirrorArcText from "@/components/MirrorArcText";
import RevealOnScroll from "@/components/RevealOnScroll";
import ReviewsSection from "@/components/ReviewsSection";
import SiteHeader from "@/components/SiteHeader";
import StatsSection from "@/components/StatsSection";
import { createClient } from "@/lib/supabase/server";
import {
  aboutContent,
  categoryShowcase,
  contactContent,
  heroContent,
  navLinks,
  reviewsContent,
  statsContent,
} from "@/data/homepage";

function getSiteImageUrl(siteImages, imageKey, fallbackUrl) {
  const matchingImage = siteImages.find((image) => image.image_key === imageKey);

  // If Supabase has not been filled in yet, keep the existing placeholder photo.
  return matchingImage?.image_url || fallbackUrl;
}

function getCategoryPhotos(portfolioImages, categoryName, fallbackPhotos) {
  const matchingPhotos = portfolioImages
    .filter((image) => image.category === categoryName && image.image_url)
    .map((image) => image.image_url);

  // Only fall back when a category has no database photos yet.
  if (matchingPhotos.length === 0) {
    return fallbackPhotos;
  }

  return matchingPhotos;
}

async function getHomepageImageData() {
  const supabase = await createClient();
  const categoryNames = categoryShowcase.map((category) => category.category);

  // These two queries only fetch public image data. Decorative design files stay local.
  const [siteImagesResult, portfolioImagesResult] = await Promise.all([
    supabase
      .from("site_images")
      .select("id, page, image_key, image_url")
      .eq("page", "home")
      .in("image_key", ["hero_banner", "about_portrait"]),
    supabase
      .from("portfolio_images")
      .select("id, category, image_url, created_at")
      .in("category", categoryNames)
      .order("created_at", { ascending: false }),
  ]);

  return {
    siteImages: siteImagesResult.data || [],
    portfolioImages: portfolioImagesResult.data || [],
  };
}

export default async function Home() {
  const { siteImages, portfolioImages } = await getHomepageImageData();

  const liveHeroContent = {
    ...heroContent,
    image_url: getSiteImageUrl(siteImages, "hero_banner", heroContent.image_url),
  };

  const liveAboutContent = {
    ...aboutContent,
    image_url: getSiteImageUrl(siteImages, "about_portrait", aboutContent.image_url),
  };

  const liveCategoryShowcase = categoryShowcase.map((category) => ({
    ...category,
    photos: getCategoryPhotos(portfolioImages, category.category, category.photos),
  }));

  return (
    <main className="site-shell" id="top">
      <section className="hero-section" id="home">
        {/* Hero background photo. The dark overlay is added in CSS. */}
        <Image
          src={liveHeroContent.image_url}
          alt="Placeholder wedding photography hero"
          fill
          priority
          sizes="100vw"
          className="hero-image object-cover"
        />

        {/* Top navigation is split left and right, with the site name centered. */}
        <SiteHeader
          navLinks={navLinks}
          navLogo={liveHeroContent.navLogo}
          socialLinks={contactContent.socialLinks}
          variant="hero"
        />

        {/* This group keeps the mirror, tagline, button, and arrow centered together. */}
        <div className="hero-content">
          {/* The mirror image and the logo words are separate layers for easy editing. */}
          <div className="mirror-logo" aria-label="Carla Santos, Since 2019">
            <Image
              src="/brand/mirror-frame-cream.png"
              alt=""
              width={300}
              height={372}
              priority
              className="mirror-frame"
            />
            <MirrorArcText
              bottomText={liveHeroContent.specialty}
              className="mirror-arc-text"
              idPrefix="hero-mirror"
              topText={liveHeroContent.since}
            />
            <div className="mirror-copy">
              {/* Keep the editable full name separate from the mirror image. */}
              <strong>{liveHeroContent.name}</strong>
            </div>
          </div>

          {/* Short editable intro line under the mirror logo. */}
          <p className="hero-tagline">{liveHeroContent.tagline}</p>

          {/* These buttons give visitors a clear next step from the hero. */}
          <div className="hero-actions">
            <a className="text-button hero-portfolio-button" href="/portfolio">
              {liveHeroContent.portfolioButton}
            </a>
            <a className="text-button hero-inquiry-button" href="/inquiry">
              Inquiry
            </a>
          </div>

          {/* The arrow links to the next homepage section. */}
          <a className="hero-scroll-link" href="#styles" aria-label="Scroll to photography styles">
            <span className="hero-scroll-arrow" aria-hidden="true" />
          </a>
        </div>
      </section>

      {/* Section 2: rotating placeholder category collage. */}
      <RevealOnScroll>
        <CategoryShowcase categories={liveCategoryShowcase} />
      </RevealOnScroll>

      {/* Section 3: placeholder About Me section. */}
      <RevealOnScroll
        as="section"
        className="about-section"
        id="about"
        aria-labelledby="about-heading"
      >
        <div className="about-image-wrap">
          {/* border.png is the only frame around the portrait. */}
          <span className="about-frame-border" aria-hidden="true" />
          {/* The photo sits inside the open center of the frame image. */}
          <div className="about-photo-window">
            <Image
              src={liveAboutContent.image_url}
              alt="Placeholder portrait of photographer Carla Santos"
              fill
              sizes="(max-width: 768px) 90vw, 420px"
              className="object-cover"
            />
          </div>
        </div>

        <div className="about-copy">
          {/* Split "ABOUT me" so each word can use its own existing font. */}
          <p className="section-eyebrow about-eyebrow">
            <span>{liveAboutContent.eyebrow}</span>
            <span className="about-eyebrow-script">me</span>
          </p>
          {/* This heading reuses the same script font as the mirror logo. */}
          <h2 className="about-heading-script" id="about-heading">
            {liveAboutContent.heading}
          </h2>
          {liveAboutContent.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {/* The closing signature uses the same cursive font as the brand name. */}
          <p className="about-signature">{liveAboutContent.signature}</p>
          <a className="text-button" href="#contact">
            Get in Touch
          </a>
        </div>
      </RevealOnScroll>

      {/* Section 4: simple animated proof points for social trust. */}
      <RevealOnScroll>
        <StatsSection content={statsContent} />
      </RevealOnScroll>

      {/* Small scrolling brand strip between stats and reviews. */}
      <MarqueeStrip />

      {/* Section 5: rotating placeholder reviews from future clients. */}
      <RevealOnScroll>
        <ReviewsSection content={reviewsContent} />
      </RevealOnScroll>

      {/* Section 6: contact form UI and footer navigation. */}
      <RevealOnScroll>
        <ContactFooter content={contactContent} />
      </RevealOnScroll>
    </main>
  );
}
