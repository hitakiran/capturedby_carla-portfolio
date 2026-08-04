"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// This form runs after the admin clicks the password reset email link.
// Supabase gives the browser a temporary reset session, and updateUser uses
// that session to save the new password.
export default function ResetPasswordForm() {
  const router = useRouter();
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (newPassword.length < 6) {
      setErrorMessage("Please use a password with at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(
        "This reset link may be expired or invalid. Please request a new password reset email.",
      );
      return;
    }

    setSuccessMessage("Password updated. Redirecting to login...");

    // Give the admin a moment to read the confirmation before returning to login.
    window.setTimeout(() => {
      router.push("/admin/login");
      router.refresh();
    }, 1600);
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-semibold text-stone-700">
        New password
        <input
          autoComplete="new-password"
          className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
          disabled={isSubmitting}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="New password"
          required
          type="password"
          value={newPassword}
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-stone-700">
        Confirm password
        <input
          autoComplete="new-password"
          className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
          disabled={isSubmitting}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm password"
          required
          type="password"
          value={confirmPassword}
        />
      </label>

      {errorMessage && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {successMessage}
        </p>
      )}

      <button
        className="rounded-full bg-stone-900 px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
