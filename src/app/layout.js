import { Cormorant_Garamond, Pinyon_Script } from "next/font/google";
import "./globals.css";
import "./faq.css";
import "./home-sections.css";
import "./inquiry.css";
import "./investment.css";
import "./portfolio.css";

// Cormorant Garamond is the tall, elegant serif used for headings and body text.
const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Pinyon Script is only used for the "Carla Santos" mirror logo text.
const scriptFont = Pinyon_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

export const metadata = {
  title: "Carla Santos Photography",
  description: "A placeholder portfolio and booking website for a photographer.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${scriptFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
