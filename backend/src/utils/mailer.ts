import nodemailer from 'nodemailer';

// Create a reusable transporter using SMTP transport
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendWelcomeEmail = async (email: string, fullName: string, role: string) => {
  // If no SMTP_USER is configured, we log and skip (prevents crashes in dev)
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[MAILER] SMTP credentials not configured. Skipping welcome email to ${email}`);
    return;
  }

  const roleText = role === 'agency' ? 'Agence Partenaire' : 'Voyageur';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenue sur SafeTrip</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          background-color: #f7fafc;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .header {
          background: linear-gradient(135deg, #0A2F1D 0%, #00673C 100%);
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          color: #FCD116;
          margin: 0;
          font-size: 28px;
          letter-spacing: -0.5px;
        }
        .content {
          padding: 40px 30px;
          color: #2d3748;
          line-height: 1.6;
        }
        .content h2 {
          color: #0A2F1D;
          font-size: 22px;
          margin-top: 0;
        }
        .footer {
          background-color: #eef8f3;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #718096;
        }
        .button {
          display: inline-block;
          background-color: #C8941E;
          color: #ffffff;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: bold;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SafeTrip</h1>
        </div>
        <div class="content">
          <h2>Bienvenue, ${fullName} !</h2>
          <p>Nous sommes ravis de vous compter parmi nous en tant que <strong>${roleText}</strong>.</p>
          <p>Avec SafeTrip, réservez vos billets de bus, tracez vos colis en temps réel et voyagez en toute sérénité à travers le Cameroun.</p>
          <center>
            <a href="http://localhost:3000/login" class="button">Accéder à mon espace</a>
          </center>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} SafeTrip Cameroun. Tous droits réservés.</p>
          <p>Ceci est un message automatique, merci de ne pas y répondre.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"SafeTrip Cameroun" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Bienvenue sur SafeTrip, ${fullName} ! 🎉`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAILER] Welcome email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[MAILER] Error sending email to ${email}:`, error);
    return false;
  }
};
