"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const EMPTY_PACKAGE_FORM = {
  category: "",
  section_title: "",
  package_title: "",
  description: "",
  features: [""],
  price: "",
  display_order: "",
};

// These are the only package categories Carla wants to use on the site.
// Keeping this list fixed prevents accidental duplicates like "Couple" vs. "Couples".
const FIXED_INVESTMENT_CATEGORIES = [
  { value: "couples", label: "Couples" },
  { value: "wedding", label: "Wedding" },
  { value: "portraits", label: "Portraits" },
  { value: "families", label: "Families" },
  { value: "brands", label: "Brands" },
];

const DEFAULT_PACKAGE_CATEGORY = FIXED_INVESTMENT_CATEGORIES[0].value;

function formatCategoryName(category) {
  return category
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function sortByDisplayOrder(rows) {
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

function getFeaturesArray(features) {
  if (Array.isArray(features) && features.length > 0) {
    return features;
  }

  return [""];
}

function getEditablePackageForm(packageItem) {
  return {
    category: packageItem.category || "",
    section_title: packageItem.section_title || "",
    package_title: packageItem.package_title || "",
    description: packageItem.description || "",
    features: getFeaturesArray(packageItem.features),
    price:
      packageItem.price === null || packageItem.price === undefined
        ? ""
        : String(packageItem.price),
    display_order:
      packageItem.display_order === null || packageItem.display_order === undefined
        ? ""
        : String(packageItem.display_order),
  };
}

function validatePackageForm(form) {
  const numericPrice = Number(form.price);
  const displayOrder = Number(form.display_order);

  if (!form.category.trim()) {
    return { error: "Category cannot be empty." };
  }

  if (!form.section_title.trim()) {
    return { error: "Section title cannot be empty." };
  }

  if (!form.package_title.trim()) {
    return { error: "Package title cannot be empty." };
  }

  if (!form.description.trim()) {
    return { error: "Description cannot be empty." };
  }

  if (String(form.price).trim() === "" || !Number.isFinite(numericPrice) || numericPrice < 0) {
    return { error: "Price must be a valid number greater than or equal to 0." };
  }

  if (String(form.display_order).trim() === "" || !Number.isFinite(displayOrder)) {
    return { error: "Display order must be a valid number." };
  }

  const cleanedFeatures = form.features
    .map((feature) => feature.trim())
    .filter(Boolean);

  if (cleanedFeatures.length === 0) {
    return { error: "Please add at least one feature." };
  }

  return {
    cleanedForm: {
      category: form.category.trim(),
      section_title: form.section_title.trim(),
      package_title: form.package_title.trim(),
      description: form.description.trim(),
      features: cleanedFeatures,
      price: numericPrice,
      display_order: displayOrder,
    },
  };
}

function groupPackagesByCategory(packages) {
  const groups = {};

  packages.forEach((packageItem) => {
    const category = packageItem.category || "uncategorized";

    if (!groups[category]) {
      groups[category] = {
        category,
        packages: [],
        section_title: packageItem.section_title || "",
      };
    }

    if (!groups[category].section_title && packageItem.section_title) {
      groups[category].section_title = packageItem.section_title;
    }

    groups[category].packages.push(packageItem);
  });

  return Object.values(groups)
    .map((group) => ({
      ...group,
      packages: sortByDisplayOrder(group.packages),
    }))
    .sort((firstGroup, secondGroup) => {
      const firstIndex = FIXED_INVESTMENT_CATEGORIES.findIndex(
        (category) => category.value === firstGroup.category,
      );
      const secondIndex = FIXED_INVESTMENT_CATEGORIES.findIndex(
        (category) => category.value === secondGroup.category,
      );

      if (firstIndex !== -1 && secondIndex !== -1) {
        return firstIndex - secondIndex;
      }

      return firstGroup.category.localeCompare(secondGroup.category);
    });
}

// AdminInvestmentManager is a Client Component because it lets the admin edit,
// add, and delete package rows directly from Supabase.
export default function AdminInvestmentManager() {
  const [activeCategory, setActiveCategory] = useState(DEFAULT_PACKAGE_CATEGORY);
  const [addPackageForm, setAddPackageForm] = useState(EMPTY_PACKAGE_FORM);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isShowingPackageForm, setIsShowingPackageForm] = useState(false);
  const [packageForms, setPackageForms] = useState({});
  const [packages, setPackages] = useState([]);
  const [saveStatusById, setSaveStatusById] = useState({});
  const [sectionTitleForms, setSectionTitleForms] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const groupedPackages = useMemo(
    () => groupPackagesByCategory(packages),
    [packages],
  );

  useEffect(() => {
    async function fetchPackages() {
      setErrorMessage("");
      setIsLoading(true);

      const supabase = createClient();

      // Load every investment package row. Groups are built in JavaScript from category.
      const { data, error } = await supabase
        .from("investment_packages")
        .select(
          "id, category, section_title, package_title, description, features, price, display_order, created_at",
        )
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        setErrorMessage(`Could not load packages: ${error.message}`);
        setIsLoading(false);
        return;
      }

      const loadedPackages = sortByDisplayOrder(data || []);
      const nextPackageForms = {};
      const nextSectionTitleForms = {};

      loadedPackages.forEach((packageItem) => {
        nextPackageForms[packageItem.id] = getEditablePackageForm(packageItem);

        if (!nextSectionTitleForms[packageItem.category]) {
          nextSectionTitleForms[packageItem.category] = packageItem.section_title || "";
        }
      });

      setPackages(loadedPackages);
      setPackageForms(nextPackageForms);
      setSectionTitleForms(nextSectionTitleForms);
      setIsLoading(false);
    }

    fetchPackages();
  }, []);

  function getNextDisplayOrder(category) {
    const displayOrders = packages
      .filter((packageItem) => packageItem.category === category)
      .map((packageItem) => packageItem.display_order)
      .filter((displayOrder) => typeof displayOrder === "number");

    if (displayOrders.length === 0) {
      return 1;
    }

    return Math.max(...displayOrders) + 1;
  }

  function startAddingPackage() {
    setErrorMessage("");
    setSuccessMessage("");
    setAddPackageForm({
      ...EMPTY_PACKAGE_FORM,
      category: DEFAULT_PACKAGE_CATEGORY,
      section_title: sectionTitleForms[DEFAULT_PACKAGE_CATEGORY] || "",
      display_order: String(getNextDisplayOrder(DEFAULT_PACKAGE_CATEGORY)),
    });
    setIsShowingPackageForm(true);
  }

  function updatePackageForm(packageId, fieldName, value) {
    setPackageForms((currentForms) => ({
      ...currentForms,
      [packageId]: {
        ...currentForms[packageId],
        [fieldName]: value,
      },
    }));
  }

  function updatePackageFeature(packageId, featureIndex, value) {
    setPackageForms((currentForms) => {
      const currentFeatures = currentForms[packageId]?.features || [""];
      const nextFeatures = currentFeatures.map((feature, index) =>
        index === featureIndex ? value : feature,
      );

      return {
        ...currentForms,
        [packageId]: {
          ...currentForms[packageId],
          features: nextFeatures,
        },
      };
    });
  }

  function addPackageFeature(packageId) {
    setPackageForms((currentForms) => {
      const currentFeatures = currentForms[packageId]?.features || [""];

      return {
        ...currentForms,
        [packageId]: {
          ...currentForms[packageId],
          features: [...currentFeatures, ""],
        },
      };
    });
  }

  function removePackageFeature(packageId, featureIndex) {
    setPackageForms((currentForms) => {
      const currentFeatures = currentForms[packageId]?.features || [""];

      return {
        ...currentForms,
        [packageId]: {
          ...currentForms[packageId],
          features: currentFeatures.filter((_, index) => index !== featureIndex),
        },
      };
    });
  }

  function updateAddPackageFeature(featureIndex, value) {
    setAddPackageForm((currentForm) => ({
      ...currentForm,
      features: currentForm.features.map((feature, index) =>
        index === featureIndex ? value : feature,
      ),
    }));
  }

  function addNewPackageFeature() {
    setAddPackageForm((currentForm) => ({
      ...currentForm,
      features: [...currentForm.features, ""],
    }));
  }

  function removeNewPackageFeature(featureIndex) {
    setAddPackageForm((currentForm) => ({
      ...currentForm,
      features: currentForm.features.filter((_, index) => index !== featureIndex),
    }));
  }

  function updateRowStatus(rowId, status) {
    setSaveStatusById((currentStatuses) => ({
      ...currentStatuses,
      [rowId]: status,
    }));
  }

  function updateAddPackageCategory(category) {
    setAddPackageForm((currentForm) => ({
      ...currentForm,
      category,
      section_title: sectionTitleForms[category] || currentForm.section_title,
      display_order: String(getNextDisplayOrder(category)),
    }));
  }

  async function handleAddPackage(event) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const { cleanedForm, error } = validatePackageForm(addPackageForm);

    if (error) {
      setErrorMessage(error);
      return;
    }

    setIsAddingPackage(true);

    const supabase = createClient();

    // Insert one new package row into the existing investment_packages table.
    const { data: insertedPackage, error: insertError } = await supabase
      .from("investment_packages")
      .insert(cleanedForm)
      .select(
        "id, category, section_title, package_title, description, features, price, display_order, created_at",
      )
      .single();

    if (insertError) {
      setErrorMessage(`Could not add package: ${insertError.message}`);
      setIsAddingPackage(false);
      return;
    }

    setPackages((currentPackages) => sortByDisplayOrder([...currentPackages, insertedPackage]));
    setActiveCategory(insertedPackage.category);
    setPackageForms((currentForms) => ({
      ...currentForms,
      [insertedPackage.id]: getEditablePackageForm(insertedPackage),
    }));
    setSectionTitleForms((currentForms) => ({
      ...currentForms,
      [insertedPackage.category]: insertedPackage.section_title || "",
    }));
    setAddPackageForm(EMPTY_PACKAGE_FORM);
    setIsShowingPackageForm(false);
    setSuccessMessage("Package added!");
    setIsAddingPackage(false);
  }

  async function handleSaveSectionTitle(category) {
    const sectionTitle = sectionTitleForms[category]?.trim() || "";

    setErrorMessage("");
    setSuccessMessage("");
    updateRowStatus(`section-${category}`, "saving");

    if (!sectionTitle) {
      setErrorMessage("Section title cannot be empty.");
      updateRowStatus(`section-${category}`, "");
      return;
    }

    const supabase = createClient();

    // Every row in the same category shares one section_title.
    const { data: updatedRows, error } = await supabase
      .from("investment_packages")
      .update({ section_title: sectionTitle })
      .eq("category", category)
      .select(
        "id, category, section_title, package_title, description, features, price, display_order, created_at",
      );

    if (error) {
      setErrorMessage(`Could not save section title: ${error.message}`);
      updateRowStatus(`section-${category}`, "");
      return;
    }

    const updatedById = new Map((updatedRows || []).map((packageItem) => [packageItem.id, packageItem]));

    setPackages((currentPackages) =>
      sortByDisplayOrder(
        currentPackages.map((packageItem) =>
          updatedById.get(packageItem.id) || packageItem,
        ),
      ),
    );
    setPackageForms((currentForms) => {
      const nextForms = { ...currentForms };

      (updatedRows || []).forEach((packageItem) => {
        nextForms[packageItem.id] = getEditablePackageForm(packageItem);
      });

      return nextForms;
    });
    setSuccessMessage("Section title saved!");
    updateRowStatus(`section-${category}`, "saved");
  }

  async function handleSavePackage(packageItem) {
    const form = packageForms[packageItem.id] || EMPTY_PACKAGE_FORM;
    const { cleanedForm, error } = validatePackageForm(form);

    setErrorMessage("");
    setSuccessMessage("");
    updateRowStatus(packageItem.id, "saving");

    if (error) {
      setErrorMessage(error);
      updateRowStatus(packageItem.id, "");
      return;
    }

    const supabase = createClient();

    // Save only the editable package fields. id and created_at stay untouched.
    const { data: updatedPackage, error: updateError } = await supabase
      .from("investment_packages")
      .update({
        package_title: cleanedForm.package_title,
        description: cleanedForm.description,
        features: cleanedForm.features,
        price: cleanedForm.price,
        display_order: cleanedForm.display_order,
      })
      .eq("id", packageItem.id)
      .select(
        "id, category, section_title, package_title, description, features, price, display_order, created_at",
      )
      .single();

    if (updateError) {
      setErrorMessage(`Could not save package: ${updateError.message}`);
      updateRowStatus(packageItem.id, "");
      return;
    }

    setPackages((currentPackages) =>
      sortByDisplayOrder(
        currentPackages.map((currentPackage) =>
          currentPackage.id === packageItem.id ? updatedPackage : currentPackage,
        ),
      ),
    );
    setPackageForms((currentForms) => ({
      ...currentForms,
      [packageItem.id]: getEditablePackageForm(updatedPackage),
    }));
    setSuccessMessage("Package saved!");
    updateRowStatus(packageItem.id, "saved");
  }

  async function handleDeletePackage(packageItem) {
    const confirmed = window.confirm(
      `Delete ${packageItem.package_title || "this package"} from ${formatCategoryName(
        packageItem.category || "this category",
      )}?`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    updateRowStatus(packageItem.id, "deleting");

    const supabase = createClient();

    // Delete by id so only the selected package row is removed.
    const { error } = await supabase.from("investment_packages").delete().eq("id", packageItem.id);

    if (error) {
      setErrorMessage(`Could not delete package: ${error.message}`);
      updateRowStatus(packageItem.id, "");
      return;
    }

    setPackages((currentPackages) =>
      currentPackages.filter((currentPackage) => currentPackage.id !== packageItem.id),
    );
    setPackageForms((currentForms) => {
      const nextForms = { ...currentForms };
      delete nextForms[packageItem.id];
      return nextForms;
    });
    setSuccessMessage("Package deleted.");
  }

  function renderFeatureInputs({ disabled, features, onAdd, onChange, onRemove }) {
    return (
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-stone-700">Features</p>
          <button
            className="rounded-full border border-stone-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled}
            onClick={onAdd}
            type="button"
          >
            Add Feature
          </button>
        </div>

        {features.map((feature, featureIndex) => (
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]" key={`feature-${featureIndex}`}>
            <input
              aria-label={`Feature ${featureIndex + 1}`}
              className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
              disabled={disabled}
              onChange={(event) => onChange(featureIndex, event.target.value)}
              type="text"
              value={feature}
            />
            <button
              className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={disabled || features.length === 1}
              onClick={() => onRemove(featureIndex)}
              type="button"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-stone-600">Loading investment packages...</p>
      </section>
    );
  }

  return (
    <div className="grid gap-8">
      <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-stone-900">
            Investment
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-stone-600">
            Add, edit, reorder, and delete investments.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-full bg-stone-900 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-stone-700"
            onClick={startAddingPackage}
            type="button"
          >
            Add Package
          </button>
        </div>
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

      {isShowingPackageForm && (
        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
          <div className="border-b border-stone-200 pb-5">
            <h2 className="text-2xl font-semibold text-stone-900">Add package</h2>
            <p className="mt-2 text-sm text-stone-600">
              Pick one of Carla&apos;s package categories.
            </p>
          </div>

          <form className="mt-6 grid gap-5" onSubmit={handleAddPackage}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid min-w-0 gap-2 text-sm font-semibold text-stone-700">
                Category
                <select
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                  disabled={isAddingPackage}
                  onChange={(event) => updateAddPackageCategory(event.target.value)}
                  value={addPackageForm.category}
                >
                  {FIXED_INVESTMENT_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid min-w-0 gap-2 text-sm font-semibold text-stone-700">
                Section title
                <input
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                  disabled={isAddingPackage}
                  onChange={(event) =>
                    setAddPackageForm((currentForm) => ({
                      ...currentForm,
                      section_title: event.target.value,
                    }))
                  }
                  type="text"
                  value={addPackageForm.section_title}
                />
              </label>
            </div>

            <div className="grid gap-5">
              <label className="grid gap-2 text-sm font-semibold text-stone-700">
                Package title
                <input
                  className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                  disabled={isAddingPackage}
                  onChange={(event) =>
                    setAddPackageForm((currentForm) => ({
                      ...currentForm,
                      package_title: event.target.value,
                    }))
                  }
                  type="text"
                  value={addPackageForm.package_title}
                />
              </label>

              {/* Price and display order share their own row so they stay evenly spaced. */}
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid min-w-0 gap-2 text-sm font-semibold text-stone-700">
                  Price
                  <input
                    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                    disabled={isAddingPackage}
                    min="0"
                    onChange={(event) =>
                      setAddPackageForm((currentForm) => ({
                        ...currentForm,
                        price: event.target.value,
                      }))
                    }
                    type="number"
                    value={addPackageForm.price}
                  />
                </label>

                <label className="grid min-w-0 gap-2 text-sm font-semibold text-stone-700">
                  Display order
                  <input
                    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                    disabled={isAddingPackage}
                    onChange={(event) =>
                      setAddPackageForm((currentForm) => ({
                        ...currentForm,
                        display_order: event.target.value,
                      }))
                    }
                    type="number"
                    value={addPackageForm.display_order}
                  />
                </label>
              </div>
            </div>

            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              Description
              <textarea
                className="min-h-28 rounded-xl border border-stone-300 bg-white px-4 py-3 text-base leading-7 text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                disabled={isAddingPackage}
                onChange={(event) =>
                  setAddPackageForm((currentForm) => ({
                    ...currentForm,
                    description: event.target.value,
                  }))
                }
                value={addPackageForm.description}
              />
            </label>

            {renderFeatureInputs({
              disabled: isAddingPackage,
              features: addPackageForm.features,
              onAdd: addNewPackageFeature,
              onChange: updateAddPackageFeature,
              onRemove: removeNewPackageFeature,
            })}

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-stone-900 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isAddingPackage}
                type="submit"
              >
                {isAddingPackage ? "Saving..." : "Save Package"}
              </button>
              <button
                className="rounded-full border border-stone-300 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isAddingPackage}
                onClick={() => setIsShowingPackageForm(false)}
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
          <h2 className="text-2xl font-semibold text-stone-900">Saved</h2>
          <p className="mt-2 text-sm text-stone-600">
            Choose a category to view and edit its packages.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {FIXED_INVESTMENT_CATEGORIES.map((category) => {
            const packageCount =
              groupedPackages.find((group) => group.category === category.value)?.packages.length || 0;
            const isActive = activeCategory === category.value;

            return (
              <button
                className={`rounded-full px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] transition ${
                  isActive
                    ? "bg-stone-900 text-white"
                    : "border border-stone-300 text-stone-700 hover:bg-stone-50"
                }`}
                key={category.value}
                onClick={() => setActiveCategory(category.value)}
                type="button"
              >
                {category.label} ({packageCount})
              </button>
            );
          })}
        </div>

        {(() => {
          const activeGroup =
            groupedPackages.find((group) => group.category === activeCategory) || {
              category: activeCategory,
              packages: [],
              section_title: sectionTitleForms[activeCategory] || "",
            };
          const sectionStatus = saveStatusById[`section-${activeGroup.category}`];
          const isSectionSaving = sectionStatus === "saving";

          return (
            <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-5">
              <div className="grid gap-4 border-b border-stone-200 pb-5 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
                    Category
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-stone-900">
                    {formatCategoryName(activeGroup.category)}
                  </h2>
                </div>

                <button
                  className="w-fit rounded-full bg-stone-900 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSectionSaving || activeGroup.packages.length === 0}
                  onClick={() => handleSaveSectionTitle(activeGroup.category)}
                  type="button"
                >
                  {isSectionSaving ? "Saving..." : "Save Section Title"}
                </button>
              </div>

              <label className="mt-6 grid gap-2 text-sm font-semibold text-stone-700">
                Section title
                <input
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                  disabled={isSectionSaving}
                  onChange={(event) =>
                    setSectionTitleForms((currentForms) => ({
                      ...currentForms,
                      [activeGroup.category]: event.target.value,
                    }))
                  }
                  type="text"
                  value={sectionTitleForms[activeGroup.category] ?? activeGroup.section_title}
                />
              </label>

              {activeGroup.packages.length === 0 ? (
                <p className="mt-6 leading-7 text-stone-600">
                  No packages in this category yet — use Add Package above.
                </p>
              ) : (
                <div className="mt-6 grid gap-5">
                  {activeGroup.packages.map((packageItem) => {
                    const form = packageForms[packageItem.id] || getEditablePackageForm(packageItem);
                    const rowStatus = saveStatusById[packageItem.id];
                    const isSaving = rowStatus === "saving";
                    const isDeleting = rowStatus === "deleting";

                    return (
                      <article
                        className="rounded-2xl border border-stone-200 bg-stone-50 p-5"
                        key={packageItem.id}
                      >
                        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,150px)_minmax(0,150px)]">
                          <label className="grid min-w-0 gap-2 text-sm font-semibold text-stone-700">
                            Package title
                            <input
                              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                              disabled={isSaving || isDeleting}
                              onChange={(event) =>
                                updatePackageForm(
                                  packageItem.id,
                                  "package_title",
                                  event.target.value,
                                )
                              }
                              type="text"
                              value={form.package_title}
                            />
                          </label>

                          <label className="grid min-w-0 gap-2 text-sm font-semibold text-stone-700">
                            Price
                            <input
                              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                              disabled={isSaving || isDeleting}
                              min="0"
                              onChange={(event) =>
                                updatePackageForm(packageItem.id, "price", event.target.value)
                              }
                              type="number"
                              value={form.price}
                            />
                          </label>

                          <label className="grid min-w-0 gap-2 text-sm font-semibold text-stone-700">
                            Display order
                            <input
                              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                              disabled={isSaving || isDeleting}
                              onChange={(event) =>
                                updatePackageForm(
                                  packageItem.id,
                                  "display_order",
                                  event.target.value,
                                )
                              }
                              type="number"
                              value={form.display_order}
                            />
                          </label>
                        </div>

                        <label className="mt-5 grid gap-2 text-sm font-semibold text-stone-700">
                          Description
                          <textarea
                            className="min-h-28 rounded-xl border border-stone-300 bg-white px-4 py-3 text-base leading-7 text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                            disabled={isSaving || isDeleting}
                            onChange={(event) =>
                              updatePackageForm(packageItem.id, "description", event.target.value)
                            }
                            value={form.description}
                          />
                        </label>

                        <div className="mt-5">
                          {renderFeatureInputs({
                            disabled: isSaving || isDeleting,
                            features: form.features,
                            onAdd: () => addPackageFeature(packageItem.id),
                            onChange: (featureIndex, value) =>
                              updatePackageFeature(packageItem.id, featureIndex, value),
                            onRemove: (featureIndex) =>
                              removePackageFeature(packageItem.id, featureIndex),
                          })}
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            className="rounded-full bg-stone-900 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isSaving || isDeleting}
                            onClick={() => handleSavePackage(packageItem)}
                            type="button"
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                          <button
                            className="rounded-full border border-red-200 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isSaving || isDeleting}
                            onClick={() => handleDeletePackage(packageItem)}
                            type="button"
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </section>
    </div>
  );
}
