// src/index.js
// One Worker, two routes (see wrangler.jsonc `routes`):
//   POST /api/contact     -> contact form (Turnstile + honeypot)
//   POST /api/employment  -> job application w/ résumé attachment (honeypot)
const escapeHtml = (s = "") =>
  s.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));

const FROM = "Be Secure Locksmith <noreply@besecurelocksmith.com>";
const TO = ["workorders@besecurelocksmith.com"];

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    const { pathname } = new URL(request.url);
    if (pathname === "/api/employment") return handleEmployment(request, env);
    return handleContact(request, env); // default: /api/contact
  },
};

// ---------------------------------------------------------------------------
// Contact form
// ---------------------------------------------------------------------------
async function handleContact(request, env) {
  const form = await request.formData();
  const firstName = (form.get("firstName") || "").toString().trim();
  const lastName = (form.get("lastName") || "").toString().trim();
  const name = (form.get("name") || `${firstName} ${lastName}`).toString().trim();
  const email = (form.get("email") || "").toString().trim();
  const phone = (form.get("phone") || "").toString().trim();
  const message = (form.get("message") || "").toString().trim();
  const token = (form.get("cf-turnstile-response") || "").toString();
  const honeypot = (form.get("bsl_hp") || "").toString().trim();

  // Honeypot: filled == bot. Look successful, drop silently.
  if (honeypot) return json({ ok: true }, 200);

  // Verify Turnstile
  const verify = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: request.headers.get("CF-Connecting-IP") || "",
      }),
    }
  );
  const outcome = await verify.json();
  if (!outcome.success) return json({ error: "Bot verification failed." }, 403);

  if (!name || !email || !message) {
    return json({ error: "Please fill in name, email, and message." }, 400);
  }

  const res = await sendEmail(env, {
    reply_to: email,
    subject: `New contact form submission from ${name}`,
    html: `
      <h2>New contact form submission</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
    `,
  });
  if (!res.ok) {
    console.log("Resend error (contact):", await res.text());
    return json({ error: "Could not send message. Please try again." }, 502);
  }
  return json({ ok: true }, 200);
}

// ---------------------------------------------------------------------------
// Employment application (multipart, résumé file attachment)
// ---------------------------------------------------------------------------
const MAX_RESUME_BYTES = 10 * 1024 * 1024; // 10 MB (matches the form's stated limit)
const RESUME_EXT = /\.(pdf|docx?|rtf|txt)$/i;

async function handleEmployment(request, env) {
  const form = await request.formData();
  const honeypot = (form.get("bsl_hp") || "").toString().trim();
  if (honeypot) return json({ ok: true }, 200); // bot

  // Verify Turnstile (same widget/secret as the contact form)
  const token = (form.get("cf-turnstile-response") || "").toString();
  const verify = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: request.headers.get("CF-Connecting-IP") || "",
      }),
    }
  );
  const outcome = await verify.json();
  if (!outcome.success) return json({ error: "Bot verification failed. Please complete the challenge and try again." }, 403);

  const firstName = (form.get("firstName") || "").toString().trim();
  const lastName = (form.get("lastName") || "").toString().trim();
  const name = `${firstName} ${lastName}`.trim();
  const email = (form.get("email") || "").toString().trim();
  const phone = (form.get("phone") || "").toString().trim();
  const street = (form.get("street") || "").toString().trim();
  const city = (form.get("city") || "").toString().trim();
  const state = (form.get("state") || "").toString().trim();
  const zip = (form.get("zip") || "").toString().trim();
  const position = (form.get("position") || "").toString().trim();
  const message = (form.get("message") || "").toString().trim();
  const resume = form.get("resume");

  // Validation (email, phone, résumé are required on the form)
  if (!email || !phone) {
    return json({ error: "Please provide your email and phone." }, 400);
  }
  if (!resume || typeof resume === "string" || resume.size === 0) {
    return json({ error: "Please attach your résumé." }, 400);
  }
  if (!RESUME_EXT.test(resume.name || "")) {
    return json({ error: "Résumé must be a PDF or Word document (.pdf, .doc, .docx, .rtf, .txt)." }, 400);
  }
  if (resume.size > MAX_RESUME_BYTES) {
    return json({ error: "Résumé is too large — please keep it under 10 MB." }, 400);
  }

  const addr = [street, [city, state].filter(Boolean).join(", "), zip].filter(Boolean).join(" · ");
  const content = await fileToBase64(resume);

  const res = await sendEmail(env, {
    reply_to: email,
    subject: `New job application — ${name || email}${position ? ` (${position})` : ""}`,
    html: `
      <h2>New employment application</h2>
      <p><strong>Name:</strong> ${escapeHtml(name) || "—"}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Address:</strong> ${escapeHtml(addr) || "—"}</p>
      <p><strong>Position:</strong> ${escapeHtml(position) || "—"}</p>
      <p><strong>Notes:</strong></p>
      <p>${message ? escapeHtml(message).replace(/\n/g, "<br>") : "—"}</p>
      <p><em>Résumé attached: ${escapeHtml(resume.name)}</em></p>
    `,
    attachments: [{ filename: resume.name, content }],
  });
  if (!res.ok) {
    console.log("Resend error (employment):", await res.text());
    return json({ error: "Could not submit your application. Please call 352-706-5295." }, 502);
  }
  return json({ ok: true }, 200);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function sendEmail(env, { reply_to, subject, html, attachments }) {
  const body = { from: FROM, to: TO, reply_to, subject, html };
  if (attachments) body.attachments = attachments;
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

// Base64-encode a File's bytes without blowing the call stack on large files.
async function fileToBase64(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
