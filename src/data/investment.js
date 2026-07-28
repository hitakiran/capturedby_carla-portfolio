// Placeholder package data for the Investment page.
// These category/package objects can later map cleanly to Supabase tables.

export const investmentCategories = [
  {
    id: "couples",
    name: "Couples",
    collectionTitle: "Love Story",
    packages: [
      {
        id: "couples-first-glance",
        name: "First Glance",
        description: "a romantic experience focused on genuine connection",
        price: "begins at $295",
        includes: [
          "Up to 45 minutes together",
          "One Outift",
          "One location",
          "35+ hand edited images",
          "Online Gallery",
          "(sneak peeks in 24-48 hours)",
        ],
      },
      {
        id: "couples-romance",
        name: "The Romance",
        description:
          "perfect for anniversaries, engagements, or simply celebrating the season together",
        price: "begins at $375",
        includes: [
          "75-minute portrait experience",
          "Up to two outfit changes",
          "One location",
          "85+ hand edited images",
          "Online Gallery",
          "(sneak peeks in 24-48 hours)",
        ],
      },
      {
        id: "couples-ever-after",
        name: "Ever After",
        description: "an editorial inspired experience with plenty of time for storytelling",
        price: "begins at $445",
        includes: [
          "Up to 2 hours portrait experience",
          "3 or more Outfit changes",
          "Personalized location planning",
          "100+ hand edited images",
          "Priority editing",
          "Online Gallery",
          "(sneak peeks in 24-48 hours)",
        ],
      },
    ],
  },
  {
    id: "wedding",
    name: "Wedding",
    collectionTitle: "Happy Ever After",
    packages: [
      {
        id: "wedding-pelude",
        name: "The Pelude",
        description:
          "for intimate celebrations in the beginning of your forever (elopement, courthouse or intimate ceremony)",
        price: "begins at $1,050",
        includes: [
          "Up to 4 hours of coverage",
          "Timeline guidance",
          "Ceremony coverage",
          "Family portraits",
          "Couple portraits",
          "250+ professionally edited images",
          "Online gallery",
          "Print release",
        ],
      },
      {
        id: "wedding-promise",
        name: "The Promise",
        description:
          "for the couples who want the heart of their day documented from getting ready through the beginning of the reception",
        price: "begins at $1,895",
        includes: [
          "Up to 8 hours of coverage",
          "Complimentary engagement session",
          "Timeline planning",
          "Getting ready",
          "Ceremony",
          "Family portraits",
          "Reception highlights",
          "300+ professionally edited images",
          "Online gallery",
          "Print release",
        ],
      },
      {
        id: "wedding-timeless-piece",
        name: "The Timeless Piece",
        description:
          "curated and designed for couples who want every meaningful moment, captured with intention, artistry, and care",
        price: "begins at $2,345",
        includes: [
          "Up to 10–12 hours of coverage",
          "Complimentary engagement session",
          "Complementary Prints + custom wedding day memory book",
          "Custom wedding timeline planning",
          "Detail styling photographs",
          "Getting ready through grand exit",
          "450+ edited images",
          "Luxury online gallery",
          "Sneak peeks within 48 hours",
          "Print release",
        ],
      },
    ],
  },
  {
    id: "portraits",
    name: "Portraits",
    collectionTitle: "Portrait Collection",
    packages: [
      {
        id: "portrait-keepsake",
        name: "The Keepsake",
        description: "perfect for documenting a season of life with intention and simplicity.",
        price: "begins at $210",
        includes: [
          "Up to 30 minutes",
          "One Outift",
          "One location",
          "35+ hand edited images",
          "Online Gallery",
          "(sneak peeks in 24-48 hours)",
        ],
      },
      {
        id: "portrait-muse",
        name: "The Muse",
        description:
          "A slower more intentional experience with room for creativity and storytelling",
        price: "begins at $295",
        includes: [
          "Up to 60 minutes",
          "Two to three outfit changes",
          "One location",
          "65+ hand edited images",
          "Online Gallery",
          "(sneak peeks in 24-48 hours)",
        ],
      },
      {
        id: "portrait-legacy",
        name: "The Legacy",
        description:
          "for those warning and editorial, artistic portrait experience that feels timeless",
        price: "begins at $370",
        includes: [
          "90 minutes of capturing",
          "3 or more outfit changes",
          "Two locations",
          "90+ hand edited images",
          "Online Gallery",
          "(sneak peeks in 24-48 hours)",
        ],
      },
    ],
  },
  {
    id: "families",
    name: "Families",
    intro: "",
    packages: [
      {
        id: "family-mini",
        name: "Family Mini",
        price: "$325",
        includes: ["30 minute session", "18 edited photos", "One location", "Online gallery"],
      },
      {
        id: "family-classic",
        name: "Classic Family",
        price: "$525",
        includes: ["1 hour session", "35 edited photos", "Up to 6 people", "Styling notes"],
      },
      {
        id: "family-home",
        name: "At-Home Story",
        price: "$725",
        includes: ["90 minute session", "50 edited photos", "In-home lifestyle coverage", "Online gallery"],
      },
    ],
  },
  {
    id: "brands",
    name: "Brands",
    collectionTitle: "The Signature",
    sectionLabel: "Events/Branding",
    packages: [
      {
        id: "brand-hustler",
        name: "Hustler",
        description:
          "for created for entrepreneurs, creative, and small businesses ready to tell their story with timeless imagery",
        price: "begins at $345",
        includes: [
          "Up to 1 hour of coverage",
          "Branding portraits",
          "Product & detail photographs",
          "Lifestyle imagery",
          "One location",
          "A curated gallery of 75+ professionally edited images",
          "Online gallery",
          "Print release",
        ],
      },
      {
        id: "brand-gathering",
        name: "The Gathering",
        description:
          "thoughtfully designed for grand openings, workshops, wellness classes, launch parties, pop-ups, community events, and every meaningful occasion worth remembering",
        price: "begins at $560",
        includes: [
          "Up to 4 hours of coverage",
          "Event storytelling",
          "Branding portraits throughout the event",
          "Guest interactions",
          "Venue, décor & product details",
          "Behind-the-scenes moments",
          "A curated gallery of 300+ professionally edited images",
          "Luxury online gallery",
          "Sneak peeks within 12-24 hours",
          "Print release",
          "(capture photos for website included)",
        ],
      },
    ],
  },
];
