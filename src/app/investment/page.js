import InvestmentPackages from "@/components/InvestmentPackages";
import RevealOnScroll from "@/components/RevealOnScroll";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { contactContent, heroContent, navLinks } from "@/data/homepage";
import { investmentCategories } from "@/data/investment";

export const metadata = {
  title: "Investment | Carla Santos Photography",
  description: "Placeholder photography packages and pricing for Carla Santos.",
};

export default function InvestmentPage() {
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
        <InvestmentPackages categories={investmentCategories} />
      </RevealOnScroll>

      <RevealOnScroll>
        <SiteFooter content={contactContent} />
      </RevealOnScroll>
    </main>
  );
}
