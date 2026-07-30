"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_BUCKET = "portfolio";
const SITE_IMAGES_FOLDER = "site-images";

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

  // If the database ever stores only the storage path, this still works.
  if (!imageUrl.startsWith("http")) {
    return imageUrl;
  }

  const markerIndex = imageUrl.indexOf(publicUrlMarker);

  if (markerIndex === -1) {
    return "";
  }

  return decodeURIComponent(imageUrl.slice(markerIndex + publicUrlMarker.length));
}

function formatImageKey(imageKey) {
  return imageKey
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function sortSiteImages(rows) {
  const imageOrder = {
    hero_banner: 1,
    about_portrait: 2,
  };

  return [...rows].sort((firstRow, secondRow) => {
    const firstOrder = imageOrder[firstRow.image_key] || 99;
    const secondOrder = imageOrder[secondRow.image_key] || 99;

    if (firstOrder !== secondOrder) {
      return firstOrder - secondOrder;
    }

    return (firstRow.label || "").localeCompare(secondRow.label || "");
  });
}

function getSiteImageLabel(row) {
  if (row.image_key === "about_portrait") {
    return '"About Me" Section Portrait';
  }

  return row.label || formatImageKey(row.image_key || "Site image");
}

// AdminSiteImagesManager controls the single-purpose images used around the site,
// like the homepage hero banner and About section portrait.
export default function AdminSiteImagesManager() {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilesById, setSelectedFilesById] = useState({});
  const [siteImages, setSiteImages] = useState([]);
  const [statusById, setStatusById] = useState({});

  useEffect(() => {
    async function fetchSiteImages() {
      setErrorMessage("");
      setIsLoading(true);

      const supabase = createClient();

      // Load every site image row. These rows are seeded in Supabase already.
      const { data, error } = await supabase
        .from("site_images")
        .select("id, page, image_key, label, image_url, updated_at")
        .order("page", { ascending: true })
        .order("image_key", { ascending: true });

      if (error) {
        setErrorMessage("Could not load site images. Please try again.");
        setIsLoading(false);
        return;
      }

      setSiteImages(sortSiteImages(data || []));
      setIsLoading(false);
    }

    fetchSiteImages();
  }, []);

  function updateSelectedFile(rowId, file) {
    setSelectedFilesById((currentFiles) => ({
      ...currentFiles,
      [rowId]: file,
    }));
  }

  function setRowStatus(rowId, status) {
    setStatusById((currentStatuses) => ({
      ...currentStatuses,
      [rowId]: status,
    }));
  }

  async function handleUpload(row) {
    const selectedFile = selectedFilesById[row.id];

    if (!selectedFile) {
      setRowStatus(row.id, {
        type: "error",
        message: "Please choose an image file first.",
      });
      return;
    }

    setRowStatus(row.id, {
      type: "saving",
      message: "Uploading...",
    });

    const supabase = createClient();
    const safeImageKey = row.image_key || `image-${row.id}`;
    const filePath = `${SITE_IMAGES_FOLDER}/${safeImageKey}/${Date.now()}-${cleanFileName(
      selectedFile.name,
    )}`;
    const oldStoragePath = getStoragePathFromPublicUrl(row.image_url);

    // If this row already has a site image, remove the old file from Storage.
    // This keeps the bucket from filling with unused replacement images.
    if (oldStoragePath && oldStoragePath.startsWith(`${SITE_IMAGES_FOLDER}/`)) {
      const { error: removeError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([oldStoragePath]);

      if (removeError) {
        setRowStatus(row.id, {
          type: "error",
          message: "Could not delete the old image. Please try again.",
        });
        return;
      }
    }

    // Upload the new file into the shared public portfolio bucket, but under
    // the site-images folder so these files stay separate from gallery photos.
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, selectedFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setRowStatus(row.id, {
        type: "error",
        message: "Upload failed. Please try again.",
      });
      return;
    }

    // Supabase public buckets can give us a URL immediately after upload.
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    // Save the new public URL back onto the matching site_images row.
    const { data: updatedRow, error: updateError } = await supabase
      .from("site_images")
      .update({
        image_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .select("id, page, image_key, label, image_url, updated_at")
      .single();

    if (updateError) {
      setRowStatus(row.id, {
        type: "error",
        message: "The image uploaded, but the database row could not be updated.",
      });
      return;
    }

    // Update the preview immediately without forcing a full page refresh.
    setSiteImages((currentRows) =>
      sortSiteImages(
        currentRows.map((currentRow) => {
          if (currentRow.id !== row.id) {
            return currentRow;
          }

          return updatedRow;
        }),
      ),
    );

    setSelectedFilesById((currentFiles) => ({
      ...currentFiles,
      [row.id]: null,
    }));

    setRowStatus(row.id, {
      type: "success",
      message: "Image updated!",
    });
  }

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-stone-600">Loading site images...</p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">
        <p className="font-medium text-red-700">{errorMessage}</p>
      </section>
    );
  }

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-semibold text-stone-900">
          Single- Purpose Photos
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-stone-600">
          Replace Hero Banner &amp; &quot;About Me&quot; section portrait.
        </p>
      </header>

      {siteImages.length === 0 ? (
        <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
          <p className="leading-7 text-stone-600">
            No site image rows yet — add rows in Supabase to get started.
          </p>
        </section>
      ) : (
        <div className="grid gap-6">
          {siteImages.map((row) => {
            const rowStatus = statusById[row.id];
            const isUploading = rowStatus?.type === "saving";
            const selectedFile = selectedFilesById[row.id];

            return (
              <article
                className="grid gap-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] md:p-8"
                key={row.id}
              >
                <div>
                  <h2 className="text-2xl font-semibold text-stone-900">
                    {getSiteImageLabel(row)}
                  </h2>

                  <div className="mt-6 grid gap-4">
                    <label className="grid gap-2 text-sm font-semibold text-stone-700">
                      Image file
                      <input
                        accept="image/*"
                        className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 file:mr-4 file:rounded-full file:border-0 file:bg-stone-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                        disabled={isUploading}
                        onChange={(event) =>
                          updateSelectedFile(row.id, event.target.files?.[0] || null)
                        }
                        type="file"
                      />
                    </label>

                    <button
                      className="w-fit rounded-full bg-stone-900 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isUploading || !selectedFile}
                      onClick={() => handleUpload(row)}
                      type="button"
                    >
                      {isUploading ? "Uploading..." : "Upload"}
                    </button>
                  </div>

                  {rowStatus && (
                    <p
                      className={`mt-5 rounded-2xl px-4 py-3 text-sm font-medium ${
                        rowStatus.type === "error"
                          ? "border border-red-200 bg-red-50 text-red-700"
                          : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {rowStatus.message}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  {row.image_url ? (
                    <img
                      alt={getSiteImageLabel(row)}
                      className="h-72 w-full rounded-xl object-cover"
                      src={row.image_url}
                    />
                  ) : (
                    <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-6 text-center text-sm font-medium text-stone-500">
                      No photo uploaded yet
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
