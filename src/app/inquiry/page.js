import InquiryForm from "@/components/InquiryForm";
import RevealOnScroll from "@/components/RevealOnScroll";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { contactContent, heroContent, navLinks } from "@/data/homepage";
import { investmentCategories } from "@/data/investment";

const inquiryCategories = investmentCategories.map((category) => {
  return {
    ...category,
    // The form uses the singular label the client requested.
    formLabel: category.id === "brands" ? "Brand" : category.name,
  };
});

export default function InquiryPage() {
  return (
    <main className="inquiry-page" id="top">
      <SiteHeader navLinks={navLinks} navLogo={heroContent.navLogo} />

      <RevealOnScroll
        as="section"
        className="inquiry-hero"
        aria-labelledby="inquiry-heading"
      >
        <h1 id="inquiry-heading">Inquiry Form</h1>
        {/* Same lace artwork used elsewhere, repeated so it stays crisp. */}
        <div className="inquiry-lace-strip" aria-hidden="true" />
      </RevealOnScroll>

      <RevealOnScroll
        as="section"
        className="inquiry-form-section"
        aria-label="Photography inquiry form"
      >
        <InquiryForm categories={inquiryCategories} />
      </RevealOnScroll>

      <RevealOnScroll>
        <SiteFooter content={contactContent} />
      </RevealOnScroll>
    </main>
  );
}
