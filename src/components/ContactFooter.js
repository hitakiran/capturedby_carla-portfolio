"use client";

import { useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import SocialIcon from "@/components/SocialIcon";

const SUCCESS_MESSAGE =
  "Thanks for filling it out! I will reach out soon.";

// ContactFooter keeps the contact form and footer together because they sit
// directly next to each other at the bottom of the homepage.
export default function ContactFooter({ content }) {
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  function getFormValue(formData, fieldName) {
    // This helper turns empty fields into clean strings before we send them.
    return String(formData.get(fieldName) || "").trim();
  }

  async function handleContactSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const answers = [
      { label: "Name", value: getFormValue(formData, "contact-name") },
      { label: "Phone", value: getFormValue(formData, "contact-phone") },
      { label: "Email", value: getFormValue(formData, "contact-email") },
      { label: "Message", value: getFormValue(formData, "contact-message") },
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
          formType: "Contact",
          clientName: getFormValue(formData, "contact-name"),
          clientEmail: getFormValue(formData, "contact-email"),
          answers,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong. Please try again.");
      }

      form.reset();
      // Clear formMessage because the success card has its own fixed copy below.
      setFormMessage("");
      setIsSubmitted(true);
    } catch (error) {
      setFormMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <section className="contact-section" id="contact" aria-labelledby="contact-heading">
        <div className="contact-inner">
          {/* This small note points visitors back to the future FAQ area. */}
          <p className="contact-faq-note">
            {content.faqText}
            <a href="/faq">{content.faqLinkLabel}</a>!
          </p>

          <h2 id="contact-heading">{content.heading}</h2>

          <div className="contact-layout">
            <div className="contact-details">
              {content.details.map((detail) => (
                <div className="contact-detail" key={detail.label}>
                  <strong>{detail.label}</strong>
                  {detail.href ? (
                    <a href={detail.href}>{detail.value}</a>
                  ) : (
                    <span>{detail.value}</span>
                  )}
                </div>
              ))}

              <div className="contact-detail">
                <strong>Social</strong>
                <div className="social-links" aria-label="Social links">
                  {content.socialLinks.map((link) => (
                    <a
                      aria-label={link.label}
                      href={link.href}
                      key={link.label}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <SocialIcon label={link.label} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {isSubmitted ? (
              <div className="form-success-card contact-success-card" role="status" aria-live="polite">
                <span className="form-success-icon" aria-hidden="true" />
                <h3>Message received!</h3>
                <p>{SUCCESS_MESSAGE}</p>
                <p className="contact-success-signature">With love, Carla ♡</p>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleContactSubmit}>
                {content.formFields.map((field) => (
                  <label key={field.id}>
                    <span>{field.label}</span>
                    <input id={field.id} name={field.id} type={field.type} />
                  </label>
                ))}

                <label>
                  <span>Message</span>
                  <textarea id="contact-message" name="contact-message" rows="6" />
                </label>

                {formMessage && <p className="form-submit-message">{formMessage}</p>}

                <button className="text-button" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <SiteFooter content={content} />
    </>
  );
}
