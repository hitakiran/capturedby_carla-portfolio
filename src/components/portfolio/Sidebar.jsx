import Link from "next/link";
import SocialIcon from "@/components/SocialIcon";

// Social links shown at the bottom of the portfolio sidebar.
// These are placeholders for now, so Carla's real profile URLs can be added later.
const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/capturedbycarlas/" },
  { label: "TikTok", href: "https://www.tiktok.com/@capturedbycarlas" },
];

function getCategoryLabel(category) {
  if (category === "All") {
    return "All";
  }

  if (category === "Wedding") {
    return "Weddings";
  }

  return category;
}

// Sidebar is the fixed desktop navigation for the Portfolio page.
// On smaller screens it becomes a compact top menu with a hamburger button.
export default function Sidebar({
  activeCategory,
  categories,
  isMenuOpen,
  onCategoryChange,
  onMenuToggle,
}) {
  const sidebarCategories = ["All", ...categories];

  return (
    <aside className="z-20 border-[rgba(var(--text-rgb),0.12)] bg-[var(--background)] lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[300px] lg:flex-col lg:border-r">
      <div className="flex items-center justify-between border-b border-[rgba(var(--text-rgb),0.12)] px-5 py-5 lg:block lg:border-b-0 lg:px-9 lg:py-10">
        <Link
          className="text-lg font-bold uppercase leading-none tracking-[0.16em] text-[var(--walnut)]"
          href="/"
          aria-label="Captured by Carla home"
        >
          Captured
          <span className="block">by Carla</span>
        </Link>

        <button
          aria-expanded={isMenuOpen}
          aria-label="Open portfolio menu"
          className="grid h-11 w-11 place-items-center rounded-full border border-[rgba(var(--text-rgb),0.22)] text-xl lg:hidden"
          onClick={onMenuToggle}
          type="button"
        >
          ☰
        </button>
      </div>

      <div
        className={`${
          isMenuOpen ? "grid" : "hidden"
        } gap-10 px-5 py-7 lg:flex lg:flex-1 lg:flex-col lg:px-9 lg:pb-9 lg:pt-8`}
      >
        <nav className="grid gap-4" aria-label="Portfolio categories">
          {sidebarCategories.map((category) => (
            <button
              className={`group flex items-center justify-between rounded-full border px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.18em] shadow-none transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_12px_24px_rgba(70,60,50,0.10)] ${
                activeCategory === category
                  ? "border-[rgba(var(--text-rgb),0.22)] bg-[var(--section-alternate)] text-[var(--walnut)]"
                  : "border-transparent text-[rgba(var(--text-rgb),0.62)] hover:border-[rgba(var(--text-rgb),0.18)] hover:bg-[var(--section-alternate)] hover:text-[var(--walnut)]"
              }`}
              key={category}
              onClick={() => onCategoryChange(category)}
              type="button"
            >
              <span>{getCategoryLabel(category)}</span>
              <span
                className="text-base transition-transform duration-200 ease-out group-hover:translate-x-1"
                aria-hidden="true"
              >
                ›
              </span>
            </button>
          ))}
        </nav>

        <nav className="grid gap-4" aria-label="Portfolio links">
          <Link
            className="w-fit rounded-full border border-transparent px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[rgba(var(--text-rgb),0.62)] transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-[1.03] hover:border-[rgba(var(--text-rgb),0.18)] hover:bg-[var(--section-alternate)] hover:text-[var(--walnut)] hover:shadow-[0_12px_24px_rgba(70,60,50,0.10)]"
            href="/#contact"
          >
            Contact
          </Link>
        </nav>

        <div className="mt-auto grid gap-6">
          <div className="flex gap-3" aria-label="Social links">
            {socialLinks.map((link) => (
              <a
                aria-label={link.label}
                className="grid h-10 w-10 place-items-center rounded-full border border-[rgba(var(--text-rgb),0.24)] text-[var(--walnut)] transition-all duration-200 ease-out hover:border-[var(--clay)] hover:text-[var(--clay)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--clay)] active:text-[var(--clay)]"
                href={link.href}
                key={link.label}
                rel="noreferrer"
                target="_blank"
              >
                <SocialIcon label={link.label} />
              </a>
            ))}
          </div>

          <p className="text-xs uppercase leading-relaxed tracking-[0.16em] text-[rgba(var(--text-rgb),0.55)]">
            © 2026 Captured by Carla
          </p>
        </div>
      </div>
    </aside>
  );
}
