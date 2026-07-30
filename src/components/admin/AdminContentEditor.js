"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const aboutRowOrder = [
  "about_intro",
  "about_paragraph_1",
  "about_paragraph_2",
  "about_paragraph_3",
  "about_paragraph_4",
  "about_closing",
];

const contentSections = [
  {
    id: "about",
    title: "About Me",
    description: "Edit the About section intro, paragraphs, and closing line.",
    matchesRow: (row) => row.section_key?.startsWith("about_"),
  },
  {
    id: "stats",
    title: "Stats",
    description: "Edit the homepage stat numbers.",
    matchesRow: (row) => row.section_key?.startsWith("stats_"),
  },
];

function sortRowsForSection(sectionId, rows) {
  // About text should read in the same order it appears on the public page.
  if (sectionId === "about") {
    return [...rows].sort((firstRow, secondRow) => {
      return (
        aboutRowOrder.indexOf(firstRow.section_key) -
        aboutRowOrder.indexOf(secondRow.section_key)
      );
    });
  }

  return rows;
}

// AdminContentEditor is a Client Component because it needs browser state:
// loading rows, editing textarea values, and saving updates without reloading.
export default function AdminContentEditor() {
  const [contentRows, setContentRows] = useState([]);
  const [editedValues, setEditedValues] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatusBySection, setSaveStatusBySection] = useState({});

  useEffect(() => {
    async function fetchContentRows() {
      setErrorMessage("");
      setIsLoading(true);

      const supabase = createClient();

      // Select every content row. Ordering keeps the admin form predictable.
      const { data, error } = await supabase
        .from("site_content")
        .select("id, page, section_key, label, value, updated_at")
        .order("page", { ascending: true })
        .order("section_key", { ascending: true });

      if (error) {
        setErrorMessage("Could not load content sections. Please try again.");
        setIsLoading(false);
        return;
      }

      const rows = data || [];
      setContentRows(rows);

      // Store textarea values by row id so each field can be edited independently.
      const startingValues = {};
      rows.forEach((row) => {
        startingValues[row.id] = row.value || "";
      });

      setEditedValues(startingValues);
      setIsLoading(false);
    }

    fetchContentRows();
  }, []);

  function updateTextareaValue(rowId, nextValue) {
    setEditedValues((currentValues) => ({
      ...currentValues,
      [rowId]: nextValue,
    }));
  }

  async function saveContentSection(sectionId, rowsForSection) {
    setSaveStatusBySection((currentStatus) => ({
      ...currentStatus,
      [sectionId]: { type: "saving", message: "Saving..." },
    }));

    const supabase = createClient();

    try {
      // Update every row in this section by matching its id.
      const updateRequests = rowsForSection.map((row) =>
        supabase
          .from("site_content")
          .update({
            value: editedValues[row.id] || "",
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id),
      );

      const results = await Promise.all(updateRequests);
      const failedUpdate = results.find((result) => result.error);

      if (failedUpdate) {
        throw failedUpdate.error;
      }

      // Keep local row data in sync with the saved textarea values.
      const savedRowIds = new Set(rowsForSection.map((row) => row.id));

      setContentRows((currentRows) =>
        currentRows.map((row) => {
          if (!savedRowIds.has(row.id)) {
            return row;
          }

          return {
            ...row,
            value: editedValues[row.id] || "",
            updated_at: new Date().toISOString(),
          };
        }),
      );

      setSaveStatusBySection((currentStatus) => ({
        ...currentStatus,
        [sectionId]: { type: "success", message: "Saved!" },
      }));

      setTimeout(() => {
        setSaveStatusBySection((currentStatus) => ({
          ...currentStatus,
          [sectionId]: null,
        }));
      }, 2500);
    } catch {
      setSaveStatusBySection((currentStatus) => ({
        ...currentStatus,
        [sectionId]: {
          type: "error",
          message: "Something went wrong while saving. Please try again.",
        },
      }));
    }
  }

  const visibleContentSections = contentSections
    .map((section) => ({
      ...section,
      rows: sortRowsForSection(section.id, contentRows.filter(section.matchesRow)),
    }))
    .filter((section) => section.rows.length > 0);

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-stone-600">Loading content sections...</p>
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

  if (contentRows.length === 0) {
    return (
      <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-stone-900">Content</h1>
        <p className="mt-4 leading-7 text-stone-600">
          No content sections yet — add some rows in Supabase to get started.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-semibold text-stone-900">Content</h1>
        <p className="mt-4 max-w-2xl leading-7 text-stone-600">
          Edit about me text & stat numbers.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        {visibleContentSections.map((section) => {
          const saveStatus = saveStatusBySection[section.id];
          const isSaving = saveStatus?.type === "saving";

          return (
            <section
              className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-8"
              key={section.id}
            >
              <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-stone-900">{section.title}</h2>
                  <p className="mt-2 leading-7 text-stone-600">{section.description}</p>
                </div>

                <button
                  className="rounded-full bg-stone-900 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSaving}
                  onClick={() => saveContentSection(section.id, section.rows)}
                  type="button"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>

              <div className="mt-6 grid gap-6">
                {section.rows.map((row) => (
                  <label className="grid gap-2" key={row.id}>
                    <span className="text-sm font-semibold text-stone-700">{row.label}</span>
                    {section.id === "stats" ? (
                      <input
                        className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base leading-7 text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                        onChange={(event) => updateTextareaValue(row.id, event.target.value)}
                        value={editedValues[row.id] || ""}
                      />
                    ) : (
                      <textarea
                        className="min-h-32 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base leading-7 text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                        onChange={(event) => updateTextareaValue(row.id, event.target.value)}
                        value={editedValues[row.id] || ""}
                      />
                    )}
                  </label>
                ))}
              </div>

              {saveStatus && (
                <p
                  className={`mt-5 rounded-2xl px-4 py-3 text-sm font-medium ${
                    saveStatus.type === "error"
                      ? "border border-red-200 bg-red-50 text-red-700"
                      : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {saveStatus.message}
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
