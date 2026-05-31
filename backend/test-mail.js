require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function test() {
  console.log("Using user:", process.env.SMTP_USER);
  try {
    const info = await transporter.sendMail({
      from: `"SafeTrip Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // sending to oneself
      subject: "Test Configuration",
      text: "Si vous lisez ceci, l'envoi d'email fonctionne !",
    });
    console.log("Succès ! Message ID:", info.messageId);
  } catch (error) {
    console.error("Erreur SMTP :", error);
  }
}

test();
