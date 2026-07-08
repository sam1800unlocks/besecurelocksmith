// src/index.js
const escapeHtml = (s = "") =>
  s.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const form = await request.formData();
    // The form has separate firstName/lastName fields; fall back to a single
    // `name` field if present.
    const firstName = (form.get("firstName") || "").toString().trim();
    const lastName = (form.get("lastName") || "").toString().trim();
    const name = (form.get("name") || `${firstName} ${lastName}`).toString().trim();
    const email = (form.get("email") || "").toString().trim();
    const phone = (form.get("phone") || "").toString().trim();
    const message = (form.get("message") || "").toString().trim();
    const token = (form.get("cf-turnstile-response") || "").toString();
    const honeypot = (form.get("bsl_hp") || "").toString().trim();

    // 0) Honeypot: a hidden field real users never see. If it's filled, it's a
    // bot — return a success-looking response (so it gets no signal) and drop
    // the submission without sending or even calling Turnstile.
    if (honeypot) {
      return json({ ok: true }, 200);
    }

    // 1) Verify Turnstile
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
    if (!outcome.success) {
      return json({ error: "Bot verification failed." }, 403);
    }

    // 2) Basic validation
    if (!name || !email || !message) {
      return json({ error: "Please fill in name, email, and message." }, 400);
    }

    // 3) Send via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Be Secure Locksmith Contact <noreply@besecurelocksmith.com>",
        to: ["workorders@besecurelocksmith.com"],
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
      }),
    });

    if (!res.ok) {
      console.log("Resend error:", await res.text());
      return json({ error: "Could not send message. Please try again." }, 502);
    }

    return json({ ok: true }, 200);
  },
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
