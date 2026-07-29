"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const EMPTY_FAQ_FORM = {
  question: "",
  answer: "",
  display_order: "",
  is_active: true,
};

function sortFaqItems(rows) {
  return [...rows].sort((firstRow, secondRow) => {
    const firstOrder =
      typeof firstRow.display_order === "number" ? firstRow.display_order : Number.MAX_SAFE_INTEGER;
    const secondOrder =
      typeof secondRow.display_order === "number" ? secondRow.display_order : Number.MAX_SAFE_INTEGER;

    if (firstOrder !== secondOrder) {
      return firstOrder - secondOrder;
    }

    return new Date(firstRow.created_at || 0) - new Date(secondRow.created_at || 0);
  });
}

function getEditableFaqForm(faqItem) {
  return {
    question: faqItem.question || "",
    answer: faqItem.answer || "",
    display_order:
      faqItem.display_order === null || faqItem.display_order === undefined
        ? ""
        : String(faqItem.display_order),
    is_active: Boolean(faqItem.is_active),
  };
}

function validateFaqForm(form) {
  const displayOrder = Number(form.display_order);

  if (!form.question.trim()) {
    return { error: "Question cannot be empty." };
  }

  if (!form.answer.trim()) {
    return { error: "Answer cannot be empty." };
  }

  if (String(form.display_order).trim() === "") {
    return { error: "Display order must be a valid number." };
  }

  if (!Number.isFinite(displayOrder)) {
    return { error: "Display order must be a valid number." };
  }

  return {
    cleanedForm: {
      question: form.question.trim(),
      answer: form.answer.trim(),
      display_order: displayOrder,
      is_active: form.is_active,
    },
  };
}

// AdminFaqManager is a Client Component because it loads editable rows,
// tracks form state, and talks to Supabase when buttons are clicked.
export default function AdminFaqManager() {
  const [addForm, setAddForm] = useState(EMPTY_FAQ_FORM);
  const [errorMessage, setErrorMessage] = useState("");
  const [faqItems, setFaqItems] = useState([]);
  const [formById, setFormById] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isShowingAddForm, setIsShowingAddForm] = useState(false);
  const [saveStatusById, setSaveStatusById] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const sortedFaqItems = useMemo(() => sortFaqItems(faqItems), [faqItems]);

  useEffect(() => {
    async function fetchFaqItems() {
      setErrorMessage("");
      setIsLoading(true);

      const supabase = createClient();

      // Load all FAQ rows for the admin, including inactive rows.
      const { data, error } = await supabase
        .from("faq_items")
        .select("id, question, answer, display_order, is_active, created_at, updated_at")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        setErrorMessage(`Could not load FAQs: ${error.message}`);
        setIsLoading(false);
        return;
      }

      const loadedFaqItems = sortFaqItems(data || []);
      const nextForms = {};

      loadedFaqItems.forEach((faqItem) => {
        nextForms[faqItem.id] = getEditableFaqForm(faqItem);
      });

      setFaqItems(loadedFaqItems);
      setFormById(nextForms);
      setIsLoading(false);
    }

    fetchFaqItems();
  }, []);

  function getNextDisplayOrder() {
    const displayOrders = faqItems
      .map((faqItem) => faqItem.display_order)
      .filter((displayOrder) => typeof displayOrder === "number");

    if (displayOrders.length === 0) {
      return faqItems.length + 1;
    }

    return Math.max(...displayOrders) + 1;
  }

  function startAddingFaq() {
    setErrorMessage("");
    setSuccessMessage("");
    setAddForm({
      ...EMPTY_FAQ_FORM,
      display_order: String(getNextDisplayOrder()),
    });
    setIsShowingAddForm(true);
  }

  function updateExistingForm(faqId, fieldName, value) {
    setFormById((currentForms) => ({
      ...currentForms,
      [faqId]: {
        ...currentForms[faqId],
        [fieldName]: value,
      },
    }));
  }

  function updateRowStatus(faqId, status) {
    setSaveStatusById((currentStatuses) => ({
      ...currentStatuses,
      [faqId]: status,
    }));
  }

  async function handleAddFaq(event) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const { cleanedForm, error } = validateFaqForm(addForm);

    if (error) {
      setErrorMessage(error);
      return;
    }

    setIsAdding(true);

    const supabase = createClient();

    // Insert only the fields that belong to a new FAQ row.
    const { data: insertedFaq, error: insertError } = await supabase
      .from("faq_items")
      .insert(cleanedForm)
      .select("id, question, answer, display_order, is_active, created_at, updated_at")
      .single();

    if (insertError) {
      setErrorMessage(`Could not add FAQ: ${insertError.message}`);
      setIsAdding(false);
      return;
    }

    setFaqItems((currentItems) => sortFaqItems([...currentItems, insertedFaq]));
    setFormById((currentForms) => ({
      ...currentForms,
      [insertedFaq.id]: getEditableFaqForm(insertedFaq),
    }));
    setAddForm(EMPTY_FAQ_FORM);
    setIsShowingAddForm(false);
    setSuccessMessage("FAQ added!");
    setIsAdding(false);
  }

  async function handleSaveFaq(faqItem) {
    const form = formById[faqItem.id] || EMPTY_FAQ_FORM;

    setErrorMessage("");
    setSuccessMessage("");
    updateRowStatus(faqItem.id, "saving");

    const { cleanedForm, error } = validateFaqForm(form);

    if (error) {
      setErrorMessage(error);
      updateRowStatus(faqItem.id, "");
      return;
    }

    const supabase = createClient();

    // Update only the editable fields. id and created_at are intentionally untouched.
    const { data: updatedFaq, error: updateError } = await supabase
      .from("faq_items")
      .update({
        ...cleanedForm,
        updated_at: new Date().toISOString(),
      })
      .eq("id", faqItem.id)
      .select("id, question, answer, display_order, is_active, created_at, updated_at")
      .single();

    if (updateError) {
      setErrorMessage(`Could not save FAQ: ${updateError.message}`);
      updateRowStatus(faqItem.id, "");
      return;
    }

    setFaqItems((currentItems) =>
      sortFaqItems(currentItems.map((item) => (item.id === faqItem.id ? updatedFaq : item))),
    );
    setFormById((currentForms) => ({
      ...currentForms,
      [faqItem.id]: getEditableFaqForm(updatedFaq),
    }));
    setSuccessMessage("FAQ saved!");
    updateRowStatus(faqItem.id, "saved");
  }

  async function handleDeleteFaq(faqItem) {
    const confirmed = window.confirm(`Delete this FAQ?\n\n${faqItem.question || "Untitled FAQ"}`);

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    updateRowStatus(faqItem.id, "deleting");

    const supabase = createClient();

    // Delete by id so only the selected FAQ row is removed.
    const { error } = await supabase.from("faq_items").delete().eq("id", faqItem.id);

    if (error) {
      setErrorMessage(`Could not delete FAQ: ${error.message}`);
      updateRowStatus(faqItem.id, "");
      return;
    }

    setFaqItems((currentItems) => currentItems.filter((item) => item.id !== faqItem.id));
    setFormById((currentForms) => {
      const nextForms = { ...currentForms };
      delete nextForms[faqItem.id];
      return nextForms;
    });
    setSuccessMessage("FAQ deleted.");
  }

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-stone-600">Loading FAQs...</p>
      </section>
    );
  }

  return (
    <div className="grid gap-8">
      <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-stone-500">
            FAQ
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-900">
            FAQ editor
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-stone-600">
            Add, edit, hide, reorder, and delete questions from the faq_items table.
          </p>
        </div>

        <button
          className="w-fit rounded-full bg-stone-900 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isAdding}
          onClick={startAddingFaq}
          type="button"
        >
          Add FAQ
        </button>
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

      {isShowingAddForm && (
        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
          <div className="border-b border-stone-200 pb-5">
            <h2 className="text-2xl font-semibold text-stone-900">Add FAQ</h2>
            <p className="mt-2 text-sm text-stone-600">
              Add a new question and choose where it appears on the public FAQ page.
            </p>
          </div>

          <form className="mt-6 grid gap-5" onSubmit={handleAddFaq}>
            <div className="grid gap-5 md:grid-cols-[1fr_180px]">
              <label className="grid gap-2 text-sm font-semibold text-stone-700">
                Question
                <input
                  className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                  disabled={isAdding}
                  onChange={(event) =>
                    setAddForm((currentForm) => ({
                      ...currentForm,
                      question: event.target.value,
                    }))
                  }
                  type="text"
                  value={addForm.question}
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-stone-700">
                Display order
                <input
                  className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                  disabled={isAdding}
                  onChange={(event) =>
                    setAddForm((currentForm) => ({
                      ...currentForm,
                      display_order: event.target.value,
                    }))
                  }
                  type="number"
                  value={addForm.display_order}
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              Answer
              <textarea
                className="min-h-32 rounded-xl border border-stone-300 bg-white px-4 py-3 text-base leading-7 text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                disabled={isAdding}
                onChange={(event) =>
                  setAddForm((currentForm) => ({
                    ...currentForm,
                    answer: event.target.value,
                  }))
                }
                value={addForm.answer}
              />
            </label>

            <label className="flex w-fit items-center gap-3 text-sm font-semibold text-stone-700">
              <input
                checked={addForm.is_active}
                className="h-5 w-5 rounded border-stone-300 text-stone-900"
                disabled={isAdding}
                onChange={(event) =>
                  setAddForm((currentForm) => ({
                    ...currentForm,
                    is_active: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              Active on public FAQ page
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-stone-900 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isAdding}
                type="submit"
              >
                {isAdding ? "Saving..." : "Save FAQ"}
              </button>
              <button
                className="rounded-full border border-stone-300 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isAdding}
                onClick={() => setIsShowingAddForm(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
        <div className="border-b border-stone-200 pb-5">
          <h2 className="text-2xl font-semibold text-stone-900">Current FAQs</h2>
          <p className="mt-2 text-sm text-stone-600">
            Ordered by display_order from smallest to largest.
          </p>
        </div>

        {sortedFaqItems.length === 0 ? (
          <p className="mt-8 leading-7 text-stone-600">
            No FAQs yet — add your first one above.
          </p>
        ) : (
          <div className="mt-6 grid gap-5">
            {sortedFaqItems.map((faqItem) => {
              const form = formById[faqItem.id] || getEditableFaqForm(faqItem);
              const rowStatus = saveStatusById[faqItem.id];
              const isSaving = rowStatus === "saving";
              const isDeleting = rowStatus === "deleting";

              return (
                <article
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-5"
                  key={faqItem.id}
                >
                  <div className="grid gap-5 md:grid-cols-[1fr_180px]">
                    <label className="grid gap-2 text-sm font-semibold text-stone-700">
                      Question
                      <input
                        className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                        disabled={isSaving || isDeleting}
                        onChange={(event) =>
                          updateExistingForm(faqItem.id, "question", event.target.value)
                        }
                        type="text"
                        value={form.question}
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-semibold text-stone-700">
                      Display order
                      <input
                        className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                        disabled={isSaving || isDeleting}
                        onChange={(event) =>
                          updateExistingForm(faqItem.id, "display_order", event.target.value)
                        }
                        type="number"
                        value={form.display_order}
                      />
                    </label>
                  </div>

                  <label className="mt-5 grid gap-2 text-sm font-semibold text-stone-700">
                    Answer
                    <textarea
                      className="min-h-32 rounded-xl border border-stone-300 bg-white px-4 py-3 text-base leading-7 text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                      disabled={isSaving || isDeleting}
                      onChange={(event) =>
                        updateExistingForm(faqItem.id, "answer", event.target.value)
                      }
                      value={form.answer}
                    />
                  </label>

                  <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <label className="flex w-fit items-center gap-3 text-sm font-semibold text-stone-700">
                      <input
                        checked={form.is_active}
                        className="h-5 w-5 rounded border-stone-300 text-stone-900"
                        disabled={isSaving || isDeleting}
                        onChange={(event) =>
                          updateExistingForm(faqItem.id, "is_active", event.target.checked)
                        }
                        type="checkbox"
                      />
                      Active on public FAQ page
                    </label>

                    <div className="flex flex-wrap gap-3">
                      <button
                        className="rounded-full bg-stone-900 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isSaving || isDeleting}
                        onClick={() => handleSaveFaq(faqItem)}
                        type="button"
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="rounded-full border border-red-200 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isSaving || isDeleting}
                        onClick={() => handleDeleteFaq(faqItem)}
                        type="button"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
