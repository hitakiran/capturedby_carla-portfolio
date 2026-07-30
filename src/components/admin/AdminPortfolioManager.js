"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_BUCKET = "portfolio";

const PORTFOLIO_CATEGORIES = ["Couples", "Wedding", "Portraits", "Families", "Brands"];

function cleanFileName(fileName) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replaceAll("--", "-");
}

function getStoragePathFromPublicUrl(imageUrl) {
  const publicUrlMarker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;

  if (!imageUrl) {
    return "";
  }

  // If the database ever stores just the path, this lets delete still work.
  if (!imageUrl.startsWith("http")) {
    return imageUrl;
  }

  const markerIndex = imageUrl.indexOf(publicUrlMarker);

  if (markerIndex === -1) {
    return "";
  }

  return decodeURIComponent(imageUrl.slice(markerIndex + publicUrlMarker.length));
}

// AdminPortfolioManager handles the interactive photo tools:
// fetching rows, filtering, uploading files, and deleting storage objects.
export default function AdminPortfolioManager() {
  const fileInputRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const categories = useMemo(() => {
    const uniqueCategories = new Set();

    images.forEach((image) => {
      if (image.category) {
        uniqueCategories.add(image.category);
      }
    });

    return Array.from(uniqueCategories).sort();
  }, [images]);

  const visibleImages = useMemo(() => {
    if (filterCategory === "All") {
      return images;
    }

    return images.filter((image) => image.category === filterCategory);
  }, [filterCategory, images]);

  useEffect(() => {
    async function fetchImages() {
      setErrorMessage("");
      setIsLoading(true);

      const supabase = createClient();

      // Load all portfolio image rows from newest to oldest.
      const { data, error } = await supabase
        .from("portfolio_images")
        .select("id, category, image_url, caption, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage("Could not load portfolio photos. Please try again.");
        setIsLoading(false);
        return;
      }

      setImages(data || []);
      setIsLoading(false);
    }

    fetchImages();
  }, []);

  async function handleUpload(event) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const uploadedFiles = Array.from(fileInputRef.current?.files || []);
    const finalCategory = selectedCategory;

    if (!finalCategory) {
      setErrorMessage("Please choose a category.");
      return;
    }

    if (uploadedFiles.length === 0) {
      setErrorMessage("Please choose at least one image file to upload.");
      return;
    }

    setIsUploading(true);

    const supabase = createClient();
    const safeCategoryFolder = finalCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const insertedRows = [];

    // Upload each selected image one at a time. This keeps the code beginner-friendly
    // while still letting Carla choose multiple files in the file picker.
    for (const [fileIndex, uploadedFile] of uploadedFiles.entries()) {
      const filePath = `${safeCategoryFolder}/${Date.now()}-${fileIndex}-${cleanFileName(
        uploadedFile.name,
      )}`;

      // 1. Upload the actual file into the public "portfolio" Storage bucket.
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, uploadedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setErrorMessage("One of the uploads failed. Please try again.");
        setIsUploading(false);
        return;
      }

      // 2. Get the public URL so the photo can be displayed on the site.
      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

      // 3. Insert the matching database row. Captions are intentionally blank now.
      const { data: insertedRow, error: insertError } = await supabase
        .from("portfolio_images")
        .insert({
          category: finalCategory,
          image_url: publicUrl,
          caption: "",
        })
        .select("id, category, image_url, caption, created_at")
        .single();

      if (insertError) {
        setErrorMessage("A file uploaded, but the database row could not be saved.");
        setIsUploading(false);
        return;
      }

      insertedRows.push(insertedRow);
    }

    // Add the new rows to the top of the grid immediately.
    setImages((currentImages) => [...insertedRows.reverse(), ...currentImages]);
    setSelectedCategory(finalCategory);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setSuccessMessage(
      uploadedFiles.length === 1 ? "Photo uploaded!" : `${uploadedFiles.length} photos uploaded!`,
    );
    setIsUploading(false);
  }

  async function handleDelete(image) {
    const confirmed = window.confirm("Delete this photo from storage and the database?");

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const storagePath = getStoragePathFromPublicUrl(image.image_url);

    if (!storagePath) {
      setErrorMessage("Could not find this file's storage path, so it was not deleted.");
      return;
    }

    const supabase = createClient();

    // Delete the file from Storage first so there is no orphaned file left behind.
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    if (storageError) {
      setErrorMessage("Could not delete the file from storage. Please try again.");
      return;
    }

    // After the file is removed, delete the database row by id.
    const { error: deleteRowError } = await supabase
      .from("portfolio_images")
      .delete()
      .eq("id", image.id);

    if (deleteRowError) {
      setErrorMessage("The file was deleted, but the database row could not be removed.");
      return;
    }

    setImages((currentImages) => currentImages.filter((item) => item.id !== image.id));
    setSuccessMessage("Photo deleted.");
  }

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-semibold text-stone-900">Portfolio Photos</h1>
        <p className="mt-4 max-w-2xl leading-7 text-stone-600">
          Upload or delete portfolio photos.
        </p>
      </header>

      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-2xl font-semibold text-stone-900">Upload</h2>

        <form className="mt-6 grid gap-5" onSubmit={handleUpload}>
          <label className="grid gap-2 text-sm font-semibold text-stone-700">
            Choose a category
            <select
              className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
              disabled={isUploading}
              onChange={(event) => setSelectedCategory(event.target.value)}
              value={selectedCategory}
            >
              <option value="">Choose a category</option>
              {PORTFOLIO_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-stone-700">
            Image files
            <input
              accept="image/*"
              className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 file:mr-4 file:rounded-full file:border-0 file:bg-stone-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              disabled={isUploading}
              multiple
              ref={fileInputRef}
              type="file"
            />
          </label>

          <button
            className="w-fit rounded-full bg-stone-900 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isUploading}
            type="submit"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </section>

      {(errorMessage || successMessage) && (
        <p
          className={`rounded-2xl px-4 py-3 text-sm font-medium ${
            errorMessage
              ? "border border-red-200 bg-red-50 text-red-700"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {errorMessage || successMessage}
        </p>
      )}

      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-stone-900">Portfolio Photos</h2>
            <p className="mt-2 text-sm text-stone-600">
              {images.length} total photo{images.length === 1 ? "" : "s"}
            </p>
          </div>

          <label className="grid gap-2 text-sm font-semibold text-stone-700">
            Filter category
            <select
              className="min-w-52 rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
              onChange={(event) => setFilterCategory(event.target.value)}
              value={filterCategory}
            >
              <option value="All">All</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isLoading ? (
          <p className="mt-8 text-sm font-semibold text-stone-600">Loading photos...</p>
        ) : images.length === 0 ? (
          <p className="mt-8 leading-7 text-stone-600">
            No photos yet — upload your first one above.
          </p>
        ) : visibleImages.length === 0 ? (
          <p className="mt-8 leading-7 text-stone-600">
            No photos match this category filter.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleImages.map((image) => (
              <article
                className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 shadow-sm"
                key={image.id}
              >
                <img
                  alt={image.caption || `${image.category} portfolio photo`}
                  className="h-64 w-full object-cover"
                  src={image.image_url}
                />

                <div className="grid gap-3 p-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
                      {image.category}
                    </p>
                  </div>

                  <button
                    className="w-fit rounded-full border border-red-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-red-700 transition hover:bg-red-50"
                    onClick={() => handleDelete(image)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
