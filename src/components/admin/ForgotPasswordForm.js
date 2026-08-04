"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// This form starts Supabase's built-in password reset flow.
// Supabase sends the email, then the email link brings the user back to
// /admin/reset-password where they can choose a new password.
export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/admin/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage("Something went wrong. Please try again.");
      return;
    }

    // Show the same message no matter what. This keeps the site from revealing
    // whether a specific email address is registered as an admin user.
    setHasSubmitted(true);
  }

  if (hasSubmitted) {
    return (
      <div className="grid gap-5 text-stone-700">
        <p className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-base leading-relaxed">
          If an account exists with that email, a reset link has been sent. Check
          your email, including spam/junk.
        </p>

        <Link
          className="text-sm font-semibold text-stone-600 underline-offset-4 transition hover:text-stone-900 hover:underline"
          href="/admin/login"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-semibold text-stone-700">
        Email
        <input
          autoComplete="email"
          className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
          disabled={isSubmitting}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
      </label>

      {errorMessage && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      )}

      <button
        className="rounded-full bg-stone-900 px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Sending..." : "Send reset link"}
      </button>

      <Link
        className="text-center text-sm font-semibold text-stone-600 underline-offset-4 transition hover:text-stone-900 hover:underline"
        href="/admin/login"
      >
        Back to login
      </Link>
    </form>
  );
}
