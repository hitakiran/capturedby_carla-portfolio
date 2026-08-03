"use client";

import { useEffect, useRef, useState } from "react";

// GalleryImage handles the small fade/slide-in animation for each photo card.
export default function GalleryImage({ delay, photo }) {
  const [isVisible, setIsVisible] = useState(false);
  const imageRef = useRef(null);

  useEffect(() => {
    const imageElement = imageRef.current;

    if (!imageElement) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        setIsVisible(true);
        observer.unobserve(entry.target);
      },
      { threshold: 0.16 },
    );

    observer.observe(imageElement);

    return () => observer.disconnect();
  }, []);

  return (
    <article
      className={`mb-10 inline-block w-full break-inside-avoid cursor-pointer transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.03] hover:shadow-[0_18px_36px_rgba(70,60,50,0.16)] ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-7 opacity-0"
      }`}
      ref={imageRef}
      style={{ transitionDelay: delay }}
    >
      {/* Use a regular img tag here so admin-uploaded Supabase images render even
          if the storage hostname changes later. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={`${photo.category} portfolio photo`}
        className="h-auto w-full object-cover"
        height={photo.height}
        loading="lazy"
        src={photo.image_url}
        width={photo.width}
      />
    </article>
  );
}
