import cors from "cors";
import express from "express";
import { google } from "googleapis";

const app = express();
app.use(
  cors({
    origin: [
      "https://l2l-union.cheshiretail.ru",
      "https://www.l2l-union.cheshiretail.ru",
    ],
  })
);
app.use(express.json());

// OAuth2 клиент Google
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oAuth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});

const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

// Собираем RFC 2822 письмо и кодируем в base64url
function buildMessage({ from, to, subject, body }) {
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    body,
  ];
  const raw = lines.join("\r\n");
  return Buffer.from(raw).toString("base64url");
}

// Проверяем OAuth2 токен при старте
(async () => {
  try {
    const { token } = await oAuth2Client.getAccessToken();
    console.log("✓ Gmail OAuth2 token obtained:", !!token);
  } catch (err) {
    console.error("✗ Gmail OAuth2 token failed:", err.message);
  }
})();

app.post("/api/contact", async (req, res) => {
  const { name, phone, comment } = req.body;

  console.log("→ Incoming request /api/contact");
  console.log("  Body:", JSON.stringify({ name, phone, comment }));
  console.log("  MAIL_USER set:", !!process.env.MAIL_USER);
  console.log("  CLIENT_ID set:", !!process.env.CLIENT_ID);
  console.log("  REFRESH_TOKEN set:", !!process.env.REFRESH_TOKEN);

  try {
    const raw = buildMessage({
      from: `"Site form" <${process.env.MAIL_USER}>`,
      to: "sf92@yandex.ru",
      subject: "Новая заявка с сайта",
      body: `Имя: ${name}\nТелефон: ${phone}\nКомментарий: ${comment || "—"}`,
    });

    console.log("  Sending email via Gmail API...");
    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    console.log("  ✓ Email sent successfully");
    res.json({ ok: true });
  } catch (e) {
    console.error("  ✗ Email failed:", e.message);
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

app.listen(3000, () => console.log("API listening on 3000"));
