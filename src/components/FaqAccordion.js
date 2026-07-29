"use client";

import { useState } from "react";

// FaqAccordion is a Client Component because it uses React state.
// State lets us remember which question is currently open after a click.
export default function FaqAccordion({ items }) {
  const [openIndex, setOpenIndex] = useState(0);

  function toggleQuestion(index) {
    // If the open question is clicked again, close it.
    // Otherwise, open the question that was clicked.
    setOpenIndex((currentIndex) => {
      return currentIndex === index ? null : index;
    });
  }

  return (
    <div className="faq-accordion">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const answerId = `faq-answer-${index}`;

        return (
          <article className={`faq-item${isOpen ? " is-open" : ""}`} key={item.id || item.question}>
            <button
              aria-controls={answerId}
              aria-expanded={isOpen}
              className="faq-question"
              onClick={() => toggleQuestion(index)}
              type="button"
            >
              <span>{item.question}</span>
              <span className="faq-icon" aria-hidden="true">
                +
              </span>
            </button>

            {/* The wrapper uses CSS grid rows for a smooth open/close animation. */}
            <div className="faq-answer-wrap" id={answerId}>
              <div className="faq-answer">
                <p>{item.answer}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
