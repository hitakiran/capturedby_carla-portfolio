import FaqAccordion from "@/components/FaqAccordion";
import RevealOnScroll from "@/components/RevealOnScroll";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { contactContent, heroContent, navLinks } from "@/data/homepage";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "FAQ | Carla Santos Photography",
  description: "Frequently asked questions for Captured by Carla photography sessions.",
};

async function getFaqItems() {
  const supabase = await createClient();

  // The public FAQ page only shows rows Carla has marked active.
  const { data, error } = await supabase
    .from("faq_items")
    .select("id, question, answer, display_order, is_active")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    return [];
  }

  return data || [];
}

export default async function FaqPage() {
  const faqItems = await getFaqItems();

  return (
    <main className="site-shell faq-page" id="top">
      <SiteHeader navLinks={navLinks} navLogo={heroContent.navLogo} />

      <RevealOnScroll
        as="section"
        className="faq-hero"
        aria-labelledby="faq-heading"
      >
        <h1 id="faq-heading">FAQs</h1>
        {/* Reuse the site's lace divider so this page matches the other sections. */}
        <div className="faq-lace-strip" aria-hidden="true" />
      </RevealOnScroll>

      <RevealOnScroll
        as="section"
        className="faq-section"
        aria-label="Frequently asked questions accordion"
      >
        {faqItems.length > 0 ? (
          <FaqAccordion items={faqItems} />
        ) : (
          <p className="faq-empty-state">FAQs coming soon</p>
        )}
      </RevealOnScroll>

      <RevealOnScroll>
        <SiteFooter content={contactContent} />
      </RevealOnScroll>
    </main>
  );
}
