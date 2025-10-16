import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

router.post('/send-email', async (req, res) => {
  const { to, subject, text, attachments } = req.body;

  if (!to || !subject || !text) {
    return res.status(400).send({ success: false, error: 'Missing required fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_SERVER,
      port: Number(process.env.BREVO_PORT),
      secure: false,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS
      },
      tls: { rejectUnauthorized: false }
    });

    const mailOptions = {
      from: process.env.BREVO_FROM,
      to,
      subject,
      text,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(' Email sent:', info.messageId);

    res.status(200).send({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error(' Email sending failed:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});

export default router;
