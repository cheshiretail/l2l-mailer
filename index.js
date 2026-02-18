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

  try {
    await transporter.sendMail({
      from: `"Site form" <${process.env.MAIL_USER}>`,
      to: "posad_92@mail.ru",
      subject: "Новая заявка с сайта",
      text: `Имя: ${name}\nТелефон: ${phone}\nКомментарий: ${comment || "—"}`,
    });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

app.listen(3000, () => console.log("API listening on 3000"));
