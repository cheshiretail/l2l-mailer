import cors from "cors";
import express from "express";
import nodemailer from "nodemailer";
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

// Фабрика транспортера, чтобы всегда иметь актуальный access_token
async function createTransporter() {
  const { token: accessToken } = await oAuth2Client.getAccessToken();

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.MAIL_USER,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

// Проверяем подключение при старте
(async () => {
  try {
    const transporter = await createTransporter();
    await transporter.verify();
    console.log("✓ SMTP OAuth2 connection verified");
  } catch (err) {
    console.error("✗ SMTP OAuth2 connection failed:", err.message);
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
    const transporter = await createTransporter();

    console.log("  Sending email...");
    await transporter.sendMail({
      from: `"Site form" <${process.env.MAIL_USER}>`,
      to: "posad_92@mail.ru",
      subject: "Новая заявка с сайта",
      text: `Имя: ${name}\nТелефон: ${phone}\nКомментарий: ${comment || "—"}`,
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
