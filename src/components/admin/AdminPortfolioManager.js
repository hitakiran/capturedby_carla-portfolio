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
  const selectedFilesRef = useRef([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(null);

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
        .select("id, category, image_url, created_at")
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

  useEffect(() => {
    selectedFilesRef.current = selectedFiles;
  }, [selectedFiles]);

  useEffect(() => {
    return () => {
      /*
        Preview URLs are temporary browser-only links. Cleaning them up when
        this page unmounts prevents the browser from holding those files in memory.
      */
      selectedFilesRef.current.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  function addFilesToBatch(files) {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      setErrorMessage("Please choose image files only.");
      return;
    }

    /*
      Add the newly selected files to the current batch instead of replacing
      it. This lets Carla pick multiple photos at once OR open the file picker
      several times to build one upload batch.
    */
    const newPreviewItems = imageFiles.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setSelectedFiles((currentFiles) => [...currentFiles, ...newPreviewItems]);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleFileSelection(event) {
    const files = Array.from(event.target.files || []);

    addFilesToBatch(files);

    /*
      Reset the native input after reading its files. This makes it possible to
      choose the same file again later if the admin removes it by mistake.
    */
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleDrop(event) {
    /*
      Drag-and-drop is an extra path for adding several photos at once. The
      browser gives us the dropped files through event.dataTransfer.files.
    */
    event.preventDefault();

    if (isUploading) {
      return;
    }

    addFilesToBatch(Array.from(event.dataTransfer.files || []));
  }

  function removeSelectedFile(fileId) {
    setSelectedFiles((currentFiles) => {
      const removedFile = currentFiles.find((item) => item.id === fileId);

      if (removedFile) {
        URL.revokeObjectURL(removedFile.previewUrl);
      }

      return currentFiles.filter((item) => item.id !== fileId);
    });

    /*
      Reset the native input so the same removed file can be selected again
      later if the admin changes their mind.
    */
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUpload(event) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const uploadedFiles = selectedFiles;
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
    setUploadProgress({ current: 0, total: uploadedFiles.length });

    const supabase = createClient();
    const safeCategoryFolder = finalCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const insertedRows = [];
    const failedUploads = [];

    // Upload each selected image one at a time. If one fails, keep going.
    for (const [fileIndex, selectedItem] of uploadedFiles.entries()) {
      const uploadedFile = selectedItem.file;
      setUploadProgress({ current: fileIndex + 1, total: uploadedFiles.length });

      const filePath = `${safeCategoryFolder}/${Date.now()}-${fileIndex}-${cleanFileName(
        uploadedFile.name,
      )}`;

      try {
        // 1. Upload the actual file into the public "portfolio" Storage bucket.
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, uploadedFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message || "Storage upload failed.");
        }

        // 2. Get the public URL so the photo can be displayed on the site.
        const {
          data: { publicUrl },
        } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

        /*
          3. Ask our server route to create the database row.
          The route also tries to generate a CLIP image embedding first.
          We keep that ML work on the server so the browser does not have to
          download or run a machine-learning model inside the admin page.
        */
        const insertResponse = await fetch("/api/admin/portfolio-images", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category: finalCategory,
            image_url: publicUrl,
          }),
        });

        const insertResult = await insertResponse.json();

        if (!insertResponse.ok) {
          /*
            If the Storage upload worked but the database insert failed, remove
            the uploaded file so we do not leave orphaned files in the bucket.
          */
          await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
          throw new Error(
            insertResult.error || "The database row could not be saved.",
          );
        }

        insertedRows.push(insertResult.image);
      } catch (uploadError) {
        failedUploads.push({
          ...selectedItem,
          error: uploadError.message || "Upload failed.",
        });
      }
    }

    if (insertedRows.length > 0) {
      // Add the new rows to the top of the grid immediately.
      setImages((currentImages) => [...insertedRows.reverse(), ...currentImages]);
    }

    setSelectedCategory(finalCategory);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    /*
      Remove successful files from the preview batch. Failed files stay visible
      so the admin can try them again or remove them manually.
    */
    const failedFileIds = new Set(failedUploads.map((item) => item.id));
    selectedFiles.forEach((item) => {
      if (!failedFileIds.has(item.id)) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setSelectedFiles(failedUploads);

    if (failedUploads.length > 0) {
      setErrorMessage(
        `${insertedRows.length} of ${uploadedFiles.length} photos uploaded successfully, ${failedUploads.length} failed.`,
      );
    } else {
      setSuccessMessage(
        uploadedFiles.length === 1
          ? "1 photo uploaded successfully."
          : `${uploadedFiles.length} photos uploaded successfully.`,
      );
    }

    setUploadProgress(null);
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

          <div className="grid gap-2">
            <p className="text-sm font-semibold text-stone-700">Image files</p>

            <input
              accept="image/*"
              className="hidden"
              disabled={isUploading}
              multiple
              onChange={handleFileSelection}
              ref={fileInputRef}
              type="file"
            />

            <button
              className="grid min-h-36 place-items-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-8 text-center transition hover:-translate-y-0.5 hover:border-stone-500 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              type="button"
            >
              <span>
                <span className="block text-base font-semibold text-stone-900">
                  Add Photos
                </span>
                <span className="mt-2 block text-sm font-normal leading-6 text-stone-500">
                  Select multiple photos together, add one photo at a time, or
                  drag several images here before clicking Upload.
                </span>
              </span>
            </button>
          </div>

          {selectedFiles.length > 0 && (
            <div className="grid gap-3">
              <p className="text-sm font-semibold text-stone-700">
                Selected photos
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {selectedFiles.map((item) => (
                  <article
                    className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-50"
                    key={item.id}
                  >
                    <img
                      alt={`Preview of ${item.file.name}`}
                      className="h-40 w-full object-cover"
                      src={item.previewUrl}
                    />

                    <button
                      aria-label={`Remove ${item.file.name}`}
                      className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white text-lg font-bold text-stone-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-stone-100"
                      disabled={isUploading}
                      onClick={() => removeSelectedFile(item.id)}
                      type="button"
                    >
                      ×
                    </button>

                    <div className="grid gap-1 p-3">
                      <p className="truncate text-sm font-semibold text-stone-900">
                        {item.file.name}
                      </p>
                      {item.error && (
                        <p className="text-xs font-semibold text-red-700">
                          {item.error}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {uploadProgress && (
            <p className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-700">
              Uploading {uploadProgress.current} of {uploadProgress.total}...
            </p>
          )}

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
                  alt={`${image.category} portfolio photo`}
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
