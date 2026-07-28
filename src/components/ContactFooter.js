import SiteFooter from "@/components/SiteFooter";
import SocialIcon from "@/components/SocialIcon";

// ContactFooter keeps the contact form and footer together because they sit
// directly next to each other at the bottom of the homepage.
export default function ContactFooter({ content }) {
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

            {/* This form is visual only for now. Supabase or email logic can be added later. */}
            <form className="contact-form">
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

              <button className="text-button" type="submit">
                Submit
              </button>
            </form>
          </div>
        </div>
      </section>

      <SiteFooter content={content} />
    </>
  );
}
