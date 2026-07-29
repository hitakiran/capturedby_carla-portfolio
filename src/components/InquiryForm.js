"use client";

import { useState } from "react";

const SUCCESS_MESSAGE =
  "Thanks for filling it out! I will reach out soon to set up a 15-minute meeting to discuss more.";

// InquiryForm is a Client Component because it shows/hides fields based on
// the visitor's choices.
export default function InquiryForm({ categories }) {
  const [sessionType, setSessionType] = useState(categories[0].id);
  const [selectedPackage, setSelectedPackage] = useState(categories[0].packages[0].id);
  const [dateInput, setDateInput] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [foundMe, setFoundMe] = useState("Instagram");
  const foundMeOptions = ["Instagram", "TikTok", "Word of Mouth", "Other"];

  const activeCategory =
    categories.find((category) => category.id === sessionType) || categories[0];

  function handleSessionChange(event) {
    const nextSessionType = event.target.value;
    const nextCategory =
      categories.find((category) => category.id === nextSessionType) || categories[0];

    setSessionType(nextSessionType);
    setSelectedPackage(nextCategory.packages[0].id);
  }

  function addDesiredDate() {
    // Do nothing if the date is blank or already selected.
    if (!dateInput || selectedDates.includes(dateInput)) {
      return;
    }

    setSelectedDates([...selectedDates, dateInput]);
    setDateInput("");
  }

  function removeDesiredDate(dateToRemove) {
    setSelectedDates(selectedDates.filter((date) => date !== dateToRemove));
  }

  function getFormValue(formData, fieldName) {
    // FormData can return null if a field is blank, so this helper keeps
    // every answer safe and easy to send to the server.
    return String(formData.get(fieldName) || "").trim();
  }

  async function handleSubmit(event) {
    // This prevents the browser from refreshing the page while we submit with fetch().
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const selectedPackageName =
      activeCategory.packages.find((packageItem) => packageItem.id === selectedPackage)?.name ||
      selectedPackage;

    const answers = [
      { label: "First Name(s)", value: getFormValue(formData, "firstNames") },
      { label: "Last Name(s)", value: getFormValue(formData, "lastNames") },
      { label: "Email", value: getFormValue(formData, "email") },
      { label: "Phone", value: getFormValue(formData, "phone") },
      { label: "Session Type", value: activeCategory.formLabel || activeCategory.name },
      { label: "Package of Interest", value: selectedPackageName },
      { label: "Desired Photoshoot Dates", value: selectedDates },
      { label: "Additional Date Notes", value: getFormValue(formData, "dateNotes") },
      { label: "Morning or Evening Availability", value: getFormValue(formData, "availability") },
      { label: "Preferred Time", value: getFormValue(formData, "preferredTime") },
      { label: "Location", value: getFormValue(formData, "location") },
      { label: "Vision", value: getFormValue(formData, "vision") },
      { label: "Pinterest Board", value: getFormValue(formData, "pinterest") },
      { label: "Instagram", value: getFormValue(formData, "instagram") },
      { label: "TikTok", value: getFormValue(formData, "tiktok") },
      { label: "Where They Found Carla", value: foundMe },
      { label: "Other Referral Details", value: getFormValue(formData, "foundMeOther") },
    ];

    setFormMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/form-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formType: "Inquiry",
          clientName: `${getFormValue(formData, "firstNames")} ${getFormValue(
            formData,
            "lastNames",
          )}`.trim(),
          clientEmail: getFormValue(formData, "email"),
          answers,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong. Please try again.");
      }

      form.reset();
      setSelectedDates([]);
      setDateInput("");
      setFoundMe("Instagram");
      setSessionType(categories[0].id);
      setSelectedPackage(categories[0].packages[0].id);
      // Use this local message so the separate signature below does not repeat.
      setFormMessage(SUCCESS_MESSAGE);
      setIsSubmitted(true);
    } catch (error) {
      setFormMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="form-success-card inquiry-success-state" role="status" aria-live="polite">
        <span className="form-success-icon" aria-hidden="true" />
        <h2>Inquiry received</h2>
        <p>{formMessage || SUCCESS_MESSAGE}</p>
        <p className="inquiry-success-signature">With love, Carla ♡</p>
      </div>
    );
  }

  return (
    <>
      {/* This intro sits outside the form card so it reads like a page note. */}
      <p className="inquiry-intro-message">
        This is an inquiry form. Once you fill it out, you will receive a few time
        options to choose for a 15-minute call to discuss more details about your photoshoot.
      </p>

      <form className="inquiry-form" onSubmit={handleSubmit}>
        <div className="inquiry-form-grid">
          <label>
            <span>First Name(s)</span>
            <input name="firstNames" type="text" />
          </label>

          <label>
            <span>Last Name(s)</span>
            <input name="lastNames" type="text" />
          </label>

          <label>
            <span>Email</span>
            <input name="email" type="email" />
          </label>

          <label>
            <span>Phone</span>
            <input name="phone" type="tel" />
          </label>
        </div>

        <fieldset className="inquiry-fieldset">
          <legend>What session type are you inquiring about?</legend>
          <select name="sessionType" value={sessionType} onChange={handleSessionChange}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.formLabel || category.name}
              </option>
            ))}
          </select>

          {/* This package dropdown changes when the visitor changes the session type. */}
          <label className="inquiry-followup">
            <span>Package of interest</span>
            <select
              name="package"
              value={selectedPackage}
              onChange={(event) => setSelectedPackage(event.target.value)}
            >
              {activeCategory.packages.map((packageItem) => (
                <option key={packageItem.id} value={packageItem.id}>
                  {packageItem.name}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        <fieldset className="inquiry-fieldset">
          <legend>Date desired for photoshoot, are you flexible?</legend>
          <div className="inquiry-date-row">
            <input
              aria-label="Choose a desired photoshoot date"
              type="date"
              value={dateInput}
              onChange={(event) => setDateInput(event.target.value)}
            />
            <button className="inquiry-small-button" type="button" onClick={addDesiredDate}>
              Add Date
            </button>
          </div>

          {selectedDates.length > 0 && (
            <div className="selected-date-list" aria-label="Selected desired dates">
              {selectedDates.map((date) => (
                <button key={date} type="button" onClick={() => removeDesiredDate(date)}>
                  {date} ×
                </button>
              ))}
            </div>
          )}

          <label className="inquiry-followup">
            <span>Additional date notes</span>
            <textarea name="dateNotes" rows="3" />
          </label>
        </fieldset>

        <fieldset className="inquiry-fieldset">
          <legend>Would you prefer morning or evening availability for the photoshoot?</legend>
          <div className="option-row">
            <label>
              <input name="availability" type="radio" value="morning" />
              <span>Morning (AM)</span>
            </label>

            <label>
              <input name="availability" type="radio" value="evening" />
              <span>Evening (PM)</span>
            </label>
          </div>

          <label className="inquiry-followup">
            <span>Preferred time</span>
            <input name="preferredTime" placeholder="Example: around 6:00 PM" type="text" />
          </label>
        </fieldset>

        <label>
          <span>Where?</span>
          <input name="location" placeholder="City, venue, or general location" type="text" />
        </label>

        <label>
          <span>
            Tell me about yourself and the vision for the project! If you are inquiring for a
            couples session, tell me a little about your relationship too!
          </span>
          <textarea name="vision" rows="7" />
        </label>

        <label>
          <span>Please link your Pinterest board here so I can see your inspiration!</span>
          <input name="pinterest" placeholder="https://..." type="url" />
        </label>

        <fieldset className="inquiry-fieldset">
          <legend>Social Media</legend>
          <p className="inquiry-helper">Optional handles are helpful, but not required.</p>
          <div className="inquiry-form-grid">
            <label>
              <span>Instagram</span>
              <input name="instagram" placeholder="@username" type="text" />
            </label>

            <label>
              <span>TikTok</span>
              <input name="tiktok" placeholder="@username" type="text" />
            </label>
          </div>
        </fieldset>

        <fieldset className="inquiry-fieldset">
          <legend>Where did you find me?</legend>
          <div className="option-row option-row-wrap">
            {foundMeOptions.map((option) => (
              <label key={option}>
                <input
                  checked={foundMe === option}
                  name="foundMe"
                  onChange={(event) => setFoundMe(event.target.value)}
                  type="radio"
                  value={option}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>

          {foundMe === "Other" && (
            <label className="inquiry-followup">
              <span>Tell me where</span>
              <input name="foundMeOther" type="text" />
            </label>
          )}
        </fieldset>

        {formMessage && <p className="form-submit-message">{formMessage}</p>}

        <button className="text-button inquiry-submit-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </>
  );
}
