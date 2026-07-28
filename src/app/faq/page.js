import FaqAccordion from "@/components/FaqAccordion";
import RevealOnScroll from "@/components/RevealOnScroll";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { contactContent, heroContent, navLinks } from "@/data/homepage";

export const metadata = {
  title: "FAQ | Carla Santos Photography",
  description: "Frequently asked questions for Captured by Carla photography sessions.",
};

// Placeholder FAQ content for now.
// Later, these objects can be replaced with rows from Supabase or another database.
const faqItems = [
  {
    question: "Do you travel for sessions?",
    answer:
      "Yes. Carla photographs sessions throughout the Bay Area and beyond. Travel fees may apply depending on the location, but those details can be discussed during your inquiry.",
  },
  {
    question: "What is included in a session?",
    answer:
      "Each session includes planning guidance, photography time, edited digital images, and an online gallery. The exact number of images and session length depends on the package you choose.",
  },
  {
    question: "How far in advance should I book?",
    answer:
      "For portraits, couples, families, and brand sessions, booking at least 4 to 8 weeks ahead is helpful. Weddings and larger events should be booked earlier whenever possible.",
  },
  {
    question: "Can you help with location ideas?",
    answer:
      "Absolutely. Carla can suggest locations based on the feeling you want for your photos, whether that is romantic, editorial, playful, cozy, or natural.",
  },
  {
    question: "What should I wear for my photoshoot?",
    answer:
      "Neutral tones, textures, and outfits that feel like you usually photograph beautifully. Styling notes can be shared before your session so everything feels intentional and comfortable.",
  },
  {
    question: "When will I receive my gallery?",
    answer:
      "Turnaround time depends on the session type and season. Placeholder timing for now is 2 to 4 weeks for most sessions, with wedding galleries taking longer.",
  },
];

export default function FaqPage() {
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
        <FaqAccordion items={faqItems} />
      </RevealOnScroll>

      <RevealOnScroll>
        <SiteFooter content={contactContent} />
      </RevealOnScroll>
    </main>
  );
}
