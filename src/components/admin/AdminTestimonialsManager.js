"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_TESTIMONIALS = 10;
const EMPTY_FORM = {
  client_name: "",
  testimonial_text: "",
  rating: 5,
};

function getSafeRating(rating) {
  const numericRating = Number(rating) || 1;
  return Math.min(Math.max(numericRating, 1), 5);
}

function sortTestimonials(rows) {
  return [...rows].sort((firstRow, secondRow) => {
    const firstHasOrder = typeof firstRow.display_order === "number";
    const secondHasOrder = typeof secondRow.display_order === "number";

    // Rows with display_order come first, because that is the intended display order.
    if (firstHasOrder && secondHasOrder) {
      return firstRow.display_order - secondRow.display_order;
    }

    if (firstHasOrder) {
      return -1;
    }

    if (secondHasOrder) {
      return 1;
    }

    // If display_order is missing, fall back to created_at so the list is stable.
    return new Date(firstRow.created_at || 0) - new Date(secondRow.created_at || 0);
  });
}

function StarSelector({ disabled = false, label, onChange, rating }) {
  return (
    <div aria-label={label} className="flex gap-1" role="radiogroup">
      {[1, 2, 3, 4, 5].map((starValue) => {
        const isFilled = starValue <= rating;

        return (
          <button
            aria-checked={rating === starValue}
            aria-label={`${starValue} star${starValue === 1 ? "" : "s"}`}
            className={`text-2xl transition ${
              isFilled ? "text-[var(--button)]" : "text-stone-300"
            } hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60`}
            disabled={disabled}
            key={starValue}
            onClick={() => onChange(starValue)}
            role="radio"
            type="button"
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

function RatingDisplay({ rating }) {
  const safeRating = getSafeRating(rating);

  return (
    <p
      className="text-lg tracking-[0.08em] text-[var(--button)]"
      aria-label={`${safeRating} out of 5 stars`}
    >
      {"★".repeat(safeRating)}
      <span className="text-stone-300">{"★".repeat(5 - safeRating)}</span>
    </p>
  );
}

// This Client Component manages testimonial rows with Supabase:
// it loads rows, adds new rows, edits existing rows, and deletes rows.
export default function AdminTestimonialsManager() {
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatusById, setSaveStatusById] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [testimonials, setTestimonials] = useState([]);

  const sortedTestimonials = useMemo(
    () => sortTestimonials(testimonials),
    [testimonials],
  );
  const hasReachedLimit = testimonials.length >= MAX_TESTIMONIALS;

  useEffect(() => {
    async function fetchTestimonials() {
      setErrorMessage("");
      setIsLoading(true);

      const supabase = createClient();

      // Load all testimonials. We sort in JavaScript so rows without
      // display_order can fall back to created_at in a predictable way.
      const { data, error } = await supabase
        .from("testimonials")
        .select("id, client_name, testimonial_text, rating, display_order, created_at")
        .order("created_at", { ascending: true });

      if (error) {
        setErrorMessage("Could not load testimonials. Please try again.");
        setIsLoading(false);
        return;
      }

      setTestimonials(data || []);
      setIsLoading(false);
    }

    fetchTestimonials();
  }, []);

  function startEditing(testimonial) {
    setEditingId(testimonial.id);
    setEditForm({
      client_name: testimonial.client_name || "",
      testimonial_text: testimonial.testimonial_text || "",
      rating: getSafeRating(testimonial.rating),
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  }

  function getNextDisplayOrder() {
    const displayOrders = testimonials
      .map((testimonial) => testimonial.display_order)
      .filter((displayOrder) => typeof displayOrder === "number");

    if (displayOrders.length === 0) {
      return testimonials.length + 1;
    }

    return Math.max(...displayOrders) + 1;
  }

  async function handleAddTestimonial(event) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (hasReachedLimit) {
      setErrorMessage("Maximum of 10 testimonials reached — delete one to add a new one.");
      return;
    }

    if (!addForm.client_name.trim() || !addForm.testimonial_text.trim()) {
      setErrorMessage("Please enter both a client name and testimonial text.");
      return;
    }

    setIsAdding(true);

    const supabase = createClient();

    // Insert one new testimonial row, then ask Supabase to return it with .select().
    const { data: insertedRow, error } = await supabase
      .from("testimonials")
      .insert({
        client_name: addForm.client_name.trim(),
        testimonial_text: addForm.testimonial_text.trim(),
        rating: getSafeRating(addForm.rating),
        display_order: getNextDisplayOrder(),
      })
      .select("id, client_name, testimonial_text, rating, display_order, created_at")
      .single();

    if (error) {
      setErrorMessage("Could not add testimonial. Please try again.");
      setIsAdding(false);
      return;
    }

    setTestimonials((currentRows) => sortTestimonials([...currentRows, insertedRow]));
    setAddForm(EMPTY_FORM);
    setSuccessMessage("Testimonial added!");
    setIsAdding(false);
  }

  async function handleSaveEdit(testimonialId) {
    setErrorMessage("");
    setSuccessMessage("");
    setSaveStatusById((currentStatuses) => ({
      ...currentStatuses,
      [testimonialId]: "saving",
    }));

    if (!editForm.client_name.trim() || !editForm.testimonial_text.trim()) {
      setErrorMessage("Please enter both a client name and testimonial text.");
      setSaveStatusById((currentStatuses) => ({
        ...currentStatuses,
        [testimonialId]: "",
      }));
      return;
    }

    const supabase = createClient();

    // Update only the fields the admin can edit on this page.
    const { data: updatedRow, error } = await supabase
      .from("testimonials")
      .update({
        client_name: editForm.client_name.trim(),
        testimonial_text: editForm.testimonial_text.trim(),
        rating: getSafeRating(editForm.rating),
      })
      .eq("id", testimonialId)
      .select("id, client_name, testimonial_text, rating, display_order, created_at")
      .single();

    if (error) {
      setErrorMessage("Could not save testimonial. Please try again.");
      setSaveStatusById((currentStatuses) => ({
        ...currentStatuses,
        [testimonialId]: "",
      }));
      return;
    }

    setTestimonials((currentRows) =>
      sortTestimonials(
        currentRows.map((row) => (row.id === testimonialId ? updatedRow : row)),
      ),
    );
    setEditingId(null);
    setEditForm(EMPTY_FORM);
    setSuccessMessage("Testimonial saved!");
    setSaveStatusById((currentStatuses) => ({
      ...currentStatuses,
      [testimonialId]: "saved",
    }));
  }

  async function handleDelete(testimonial) {
    const confirmed = window.confirm(
      `Delete the testimonial from ${testimonial.client_name || "this client"}?`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setSaveStatusById((currentStatuses) => ({
      ...currentStatuses,
      [testimonial.id]: "deleting",
    }));

    const supabase = createClient();

    // Delete the row by id so only this testimonial is removed.
    const { error } = await supabase.from("testimonials").delete().eq("id", testimonial.id);

    if (error) {
      setErrorMessage("Could not delete testimonial. Please try again.");
      setSaveStatusById((currentStatuses) => ({
        ...currentStatuses,
        [testimonial.id]: "",
      }));
      return;
    }

    setTestimonials((currentRows) =>
      currentRows.filter((row) => row.id !== testimonial.id),
    );
    setSuccessMessage("Testimonial deleted.");
  }

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-stone-600">Loading testimonials...</p>
      </section>
    );
  }

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-semibold text-stone-900">
          Testimonials
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-stone-600">
          Add, edit, and delete client reviews from the testimonials table. Keep
          this list to 10 testimonials or fewer.
        </p>
      </header>

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
        <div className="flex flex-col gap-3 border-b border-stone-200 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-stone-900">Add testimonial</h2>
            <p className="mt-2 text-sm text-stone-600">
              {testimonials.length} of {MAX_TESTIMONIALS} testimonials used
            </p>
          </div>
        </div>

        {hasReachedLimit ? (
          <p className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-700">
            Maximum of 10 testimonials reached — delete one to add a new one.
          </p>
        ) : (
          <form className="mt-6 grid gap-5" onSubmit={handleAddTestimonial}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-stone-700">
                Client name
                <input
                  className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                  disabled={isAdding}
                  onChange={(event) =>
                    setAddForm((currentForm) => ({
                      ...currentForm,
                      client_name: event.target.value,
                    }))
                  }
                  placeholder="Example: Alice"
                  type="text"
                  value={addForm.client_name}
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-stone-700">
                Rating
                <StarSelector
                  disabled={isAdding}
                  label="New testimonial rating"
                  onChange={(rating) =>
                    setAddForm((currentForm) => ({ ...currentForm, rating }))
                  }
                  rating={addForm.rating}
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              Testimonial text
              <textarea
                className="min-h-32 rounded-xl border border-stone-300 bg-white px-4 py-3 text-base leading-7 text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                disabled={isAdding}
                onChange={(event) =>
                  setAddForm((currentForm) => ({
                    ...currentForm,
                    testimonial_text: event.target.value,
                  }))
                }
                placeholder="Write the client review here..."
                value={addForm.testimonial_text}
              />
            </label>

            <button
              className="w-fit rounded-full bg-stone-900 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isAdding}
              type="submit"
            >
              {isAdding ? "Saving..." : "Add Testimonial"}
            </button>
          </form>
        )}
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
        <div className="border-b border-stone-200 pb-5">
          <h2 className="text-2xl font-semibold text-stone-900">Current</h2>
        </div>

        {sortedTestimonials.length === 0 ? (
          <p className="mt-8 leading-7 text-stone-600">
            No testimonials yet — add your first one above.
          </p>
        ) : (
          <div className="mt-6 grid gap-5">
            {sortedTestimonials.map((testimonial) => {
              const isEditing = editingId === testimonial.id;
              const rowStatus = saveStatusById[testimonial.id];
              const isSaving = rowStatus === "saving";
              const isDeleting = rowStatus === "deleting";

              return (
                <article
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-5"
                  key={testimonial.id}
                >
                  {isEditing ? (
                    <div className="grid gap-5">
                      <div className="grid gap-5 md:grid-cols-2">
                        <label className="grid gap-2 text-sm font-semibold text-stone-700">
                          Client name
                          <input
                            className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                            disabled={isSaving}
                            onChange={(event) =>
                              setEditForm((currentForm) => ({
                                ...currentForm,
                                client_name: event.target.value,
                              }))
                            }
                            type="text"
                            value={editForm.client_name}
                          />
                        </label>

                        <label className="grid gap-2 text-sm font-semibold text-stone-700">
                          Rating
                          <StarSelector
                            disabled={isSaving}
                            label={`Rating for ${editForm.client_name || "testimonial"}`}
                            onChange={(rating) =>
                              setEditForm((currentForm) => ({ ...currentForm, rating }))
                            }
                            rating={editForm.rating}
                          />
                        </label>
                      </div>

                      <label className="grid gap-2 text-sm font-semibold text-stone-700">
                        Testimonial text
                        <textarea
                          className="min-h-32 rounded-xl border border-stone-300 bg-white px-4 py-3 text-base leading-7 text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                          disabled={isSaving}
                          onChange={(event) =>
                            setEditForm((currentForm) => ({
                              ...currentForm,
                              testimonial_text: event.target.value,
                            }))
                          }
                          value={editForm.testimonial_text}
                        />
                      </label>

                      <div className="flex flex-wrap gap-3">
                        <button
                          className="rounded-full bg-stone-900 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isSaving}
                          onClick={() => handleSaveEdit(testimonial.id)}
                          type="button"
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </button>
                        <button
                          className="rounded-full border border-stone-300 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-stone-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isSaving}
                          onClick={cancelEditing}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                      <div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <h3 className="text-xl font-semibold text-stone-900">
                            {testimonial.client_name || "Unnamed client"}
                          </h3>
                          <RatingDisplay rating={testimonial.rating} />
                        </div>
                        <p className="mt-4 max-w-3xl leading-7 text-stone-700">
                          {testimonial.testimonial_text || "No testimonial text added"}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          className="rounded-full border border-stone-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-700 transition hover:bg-white"
                          onClick={() => startEditing(testimonial)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isDeleting}
                          onClick={() => handleDelete(testimonial)}
                          type="button"
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
