import cors from "cors";
import express from "express";
import nodemailer from "nodemailer";

const app = express();
app.use(
  cors({
    origin: ["https://l2l-union.cheshiretail.ru", "https://www.l2l-union.cheshiretail.ru"],
  })
);
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: "gmail", // или SMTP твоего провайдера
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

app.post("/api/contact", async (req, res) => {
  const { name, phone, comment } = req.body;

  console.log("→ Incoming request /api/contact");
  console.log("  Body:", JSON.stringify({ name, phone, comment }));
  console.log("  MAIL_USER set:", !!process.env.MAIL_USER);
  console.log("  MAIL_PASS set:", !!process.env.MAIL_PASS);

  try {
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
