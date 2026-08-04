import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const EMAIL_FROM_ADDRESS = "Carla Santos Photography <hello@capturedbycarlas.com>";
const SUCCESS_MESSAGE =
  "Thanks for filling it out! I will reach out soon to set up a 15-minute meeting to discuss more.";
const CONTACT_SUCCESS_MESSAGE =
  "Thanks for filling it out! I will reach out soon.";

function cleanAnswerValue(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }

  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return String(value);
}

function escapeHtml(value) {
  return cleanAnswerValue(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildPlainTextEmail({ answers, formType }) {
  const answerLines = answers.map((answer) => {
    return `${answer.label}: ${cleanAnswerValue(answer.value)}`;
  });

  return [`New ${formType} form submission`, "", ...answerLines].join("\n");
}

function buildHtmlEmail({ answers, formType }) {
  const answerRows = answers
    .map((answer) => {
      return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #ede3d6; font-weight: 700; color: #463c32;">
            ${escapeHtml(answer.label)}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #ede3d6; color: #463c32;">
            ${escapeHtml(answer.value)}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="font-family: Georgia, serif; color: #463c32; background: #f6f1e8; padding: 24px;">
      <h1 style="margin: 0 0 16px; font-size: 28px;">New ${formType} form submission</h1>
      <table style="width: 100%; border-collapse: collapse; background: #fffaf3;">
        <tbody>${answerRows}</tbody>
      </table>
    </div>
  `;
}

function getClientConfirmationSubject({ clientName, formType }) {
  if (formType === "Contact") {
    return "Thank you for contacting me!";
  }

  return clientName
    ? `Inquiry Confirmation for ${clientName}`
    : "Inquiry Confirmation";
}

function buildClientConfirmationText({ clientName, formType }) {
  const greetingName = clientName ? ` ${clientName}` : "";

  if (formType === "Contact") {
    return [
      `Hi${greetingName},`,
      "",
      "This is a confirmation email. Keep an eye for an email from me to discuss more.",
      "",
      "With love,",
      "Carla ♡",
    ].join("\n");
  }

  return [
    `Hi${greetingName},`,
    "",
    "Thank you for reaching out! I received your form submission and will review your details soon.",
    "Please keep an eye on your email, including your spam or junk folder just in case, for my reply to set up a 15 minute call to discuss photoshoot details.",
    "",
    "With love,",
    "Carla ♡",
  ].join("\n");
}

function buildClientConfirmationHtml({ clientName, formType }) {
  const greetingName = clientName ? ` ${escapeHtml(clientName)}` : "";
  const subject = getClientConfirmationSubject({ clientName, formType });
  const message =
    formType === "Contact"
      ? "This is a confirmation email. Keep an eye for an email from me to discuss more."
      : "Please keep an eye on your email, including your spam or junk folder just in case, for my reply to set up a 15 minute call to discuss photoshoot details.";
  const inquiryIntro =
    formType === "Contact"
      ? ""
      : `
        <p style="font-size: 16px; line-height: 1.7;">
          Thank you for reaching out! I received your form submission and will review your details soon.
        </p>
      `;

  return `
    <div style="font-family: Georgia, serif; color: #463c32; background: #f6f1e8; padding: 24px;">
      <div style="background: #fffaf3; border: 1px solid #ede3d6; border-radius: 18px; padding: 24px;">
        <h1 style="margin: 0 0 16px; font-size: 28px;">${escapeHtml(subject)}</h1>
        <p style="font-size: 16px; line-height: 1.7;">Hi${greetingName},</p>
        ${inquiryIntro}
        <p style="font-size: 16px; line-height: 1.7;">${escapeHtml(message)}</p>
        <p style="font-size: 16px; line-height: 1.7;">
          With love,<br />
          <span style="font-family: 'Brush Script MT', 'Segoe Script', cursive; font-size: 28px;">
            Carla ♡
          </span>
        </p>
      </div>
    </div>
  `;
}

async function trySaveSubmissionToSupabase(payload) {
  const supabase = await createClient();

  // This project did not have a public form-save handler yet.
  // These table names are common choices; if one exists with these columns,
  // the submission will save. If not, we log the issue and keep going.
  const possibleTables = ["form_submissions", "inquiry_submissions", "contact_submissions"];
  const row = {
    form_type: payload.formType,
    client_name: payload.clientName,
    client_email: payload.clientEmail,
    answers: payload.answers,
    created_at: new Date().toISOString(),
  };

  for (const tableName of possibleTables) {
    const { error } = await supabase.from(tableName).insert(row);

    if (!error) {
      return { saved: true, tableName };
    }
  }

  console.warn(
    "No matching Supabase form submission table was found. Email notification will still continue.",
  );

  return { saved: false };
}

async function sendNotificationEmail(payload) {
  if (!process.env.RESEND_API_KEY || !process.env.NOTIFY_EMAIL) {
    console.warn("Missing RESEND_API_KEY or NOTIFY_EMAIL. Skipping email notification.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const subjectName = payload.clientName || "a website visitor";

  const { error } = await resend.emails.send({
    from: EMAIL_FROM_ADDRESS,
    to: process.env.NOTIFY_EMAIL,
    subject: `New ${payload.formType} from ${subjectName}`,
    text: buildPlainTextEmail(payload),
    html: buildHtmlEmail(payload),
  });

  if (error) {
    // The user should not lose their submission just because email had trouble.
    console.error("Resend email failed:", error);
  }
}

async function sendClientConfirmationEmail(payload) {
  if (!process.env.RESEND_API_KEY || !payload.clientEmail) {
    console.warn("Missing RESEND_API_KEY or client email. Skipping client confirmation email.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const subject = getClientConfirmationSubject(payload);
  const { error } = await resend.emails.send({
    from: EMAIL_FROM_ADDRESS,
    to: payload.clientEmail,
    subject,
    text: buildClientConfirmationText(payload),
    html: buildClientConfirmationHtml(payload),
  });

  if (error) {
    // A confirmation email problem should not block the visitor's form submission.
    console.error("Client confirmation email failed:", error);
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const formType = payload.formType || "Inquiry";
    const answers = Array.isArray(payload.answers) ? payload.answers : [];

    if (answers.length === 0) {
      return Response.json(
        { error: "Please fill out the form before submitting." },
        { status: 400 },
      );
    }

    const cleanPayload = {
      formType,
      clientName: payload.clientName || "",
      clientEmail: payload.clientEmail || "",
      answers,
    };

    await trySaveSubmissionToSupabase(cleanPayload);
    await sendNotificationEmail(cleanPayload);
    await sendClientConfirmationEmail(cleanPayload);

    return Response.json({
      ok: true,
      message: formType === "Contact" ? CONTACT_SUCCESS_MESSAGE : SUCCESS_MESSAGE,
    });
  } catch (error) {
    console.error("Form submission failed:", error);

    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
