// This file keeps all homepage placeholder content in one easy-to-edit place.
// Later, these objects can be replaced with data from Supabase tables.

export const navLinks = {
  left: [
    { label: "Home", href: "/#home" },
    { label: "About", href: "/#about" },
    { label: "Portfolio", href: "/portfolio" },
  ],
  right: [
    { label: "Investment", href: "/investment" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/#contact" },
  ],
};

export const heroContent = {
  navLogo: "capturedbycarla",
  name: "Carla Santos",
  since: "since 2019",
  specialty: "Photography",
  tagline: "bay area photographer + beyond.",
  portfolioButton: "View Portfolio",
  image_url:
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85",
};

export const categoryShowcase = [
  {
    id: "couples",
    investmentHref: "/investment#couples",
    category: "Couples",
    label: "Honest connection, gentle direction, and room to be playful.",
    layoutVariant: "layout-three",
    photos: [
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=700&q=85",
      "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=700&q=85",
      "https://images.unsplash.com/photo-1501901609772-df0848060b33?auto=format&fit=crop&w=700&q=85",
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=700&q=85",
    ],
  },
  {
    id: "wedding",
    investmentHref: "/investment#wedding",
    category: "Wedding",
    label: "Romantic wedding stories with an editorial, timeless feeling.",
    layoutVariant: "layout-four",
    photos: [
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=700&q=85",
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=700&q=85",
      "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=700&q=85",
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=700&q=85",
    ],
  },
  {
    id: "portraits",
    investmentHref: "/investment#portraits",
    category: "Portraits",
    label: "Soft, expressive portraits made to feel like you.",
    layoutVariant: "layout-two",
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=700&q=85",
      "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=700&q=85",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=700&q=85",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=700&q=85",
    ],
  },
  {
    id: "families",
    investmentHref: "/investment#families",
    category: "Families",
    label: "Warm family photos that feel relaxed, connected, and real.",
    layoutVariant: "layout-five",
    photos: [
      "https://images.unsplash.com/photo-1506836467174-27f1042aa48c?auto=format&fit=crop&w=700&q=85",
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=700&q=85",
      "https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?auto=format&fit=crop&w=700&q=85",
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=700&q=85",
    ],
  },
  {
    id: "business-branding",
    investmentHref: "/investment#brands",
    category: "Brands",
    label: "Personal brands with presence, polish, and personality.",
    layoutVariant: "layout-one",
    photos: [
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=700&q=85",
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=700&q=85",
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=700&q=85",
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=700&q=85",
    ],
  },
];

export const aboutContent = {
  eyebrow: "About",
  heading: "Hi I am Carla!",
  image_url:
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85",
  paragraphs: [
    "I'm so happy you're here. ♡",
    "Photography has never just been about taking pretty pictures for me it's about preserving the feeling of a moment before it quietly becomes a memory. The way someone looks at the person they love, the laughter that happens in between poses, the happy tears, the wind in your hair, the little moments you didn't even realize were happening. Those are the moments I live for.",
    "My faith is also a huge part of who I am and the way I see the world. I believe every person is created with incredible value and every season of life is a gift worth remembering. That perspective shapes the way I photograph my clients. My prayer is that the people who step in front of my camera feel seen, loved, and leave with memories they'll cherish for years to come.",
    "Outside of photography, your girl is a musical theater lover. You'll usually find me at a musical theater production or exploring anything that lets creativity come to life. I've always been drawn to the arts, and I believe every creative expression tells a story in its own beautiful way. That love for storytelling is what inspires me behind the camera and helps me create photographs that don't just capture how a moment looked, but how it truly felt.",
    "Thank you for considering me to tell your story. I can't wait to create something timeless together memories you'll be able to hold onto for years to come.",
    "With love,",
  ],
  signature: "Carla Santos ♡",
};

export const statsContent = {
  heading: "Stats",
  stats: [
    {
      id: "years",
      value: 7,
      displayValue: "7+",
      label: "Years of Experience",
    },
    {
      id: "photos",
      value: 50000,
      displayValue: "50,000+",
      label: "Photos Delivered",
    },
    {
      id: "clients",
      value: 200,
      displayValue: "200+",
      label: "# of Clients",
    },
    {
      id: "cities",
      value: 60,
      displayValue: "60+",
      label: "Cities Traveled",
    },
  ],
};

export const reviewsContent = {
  heading: "Testimonials",
  reviews: [
    {
      id: "alice",
      name: "Alice",
      text: "Carla made the whole session feel calm and easy. The photos feel timeless, natural, and so true to us.",
    },
    {
      id: "jordan",
      name: "Jordan",
      text: "Every image felt thoughtful and beautifully directed. We loved how comfortable she made us feel.",
    },
    {
      id: "priya",
      name: "Priya",
      text: "The gallery was warm, elegant, and full of the small moments we hoped someone would notice.",
    },
    {
      id: "sam",
      name: "Sam",
      text: "Professional, kind, and incredibly talented. Carla captured our family exactly as we are.",
    },
  ],
};

export const contactContent = {
  faqText: "Have questions? We may have your answer in our FAQ section — take a quick look ",
  faqLinkLabel: "here",
  heading: "Contact me via the form below & I'll get back to you as soon as I can.",
  details: [
    {
      label: "Email",
      value: "capturedbycarlas@gmail.com",
      href: "mailto:capturedbycarlas@gmail.com",
    },
    {
      label: "Address",
      value: "Bay Area, California",
    },
  ],
  socialLinks: [
    {
      label: "Instagram",
      shortLabel: "IG",
      href: "https://www.instagram.com/capturedbycarlas/",
    },
    {
      label: "TikTok",
      shortLabel: "TT",
      href: "https://www.tiktok.com/@capturedbycarlas",
    },
  ],
  formFields: [
    { id: "contact-name", label: "Name", type: "text" },
    { id: "contact-phone", label: "Phone", type: "tel" },
    { id: "contact-email", label: "Email", type: "email" },
  ],
  footerText: "bay area photographer + beyond.",
  footerNav: [
    { label: "Home", href: "/#home" },
    { label: "About", href: "/#about" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Investment", href: "/investment" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/#contact" },
  ],
};
