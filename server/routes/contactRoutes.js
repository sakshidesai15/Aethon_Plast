const express = require("express");
const nodemailer = require("nodemailer");
const ContactMessage = require("../models/ContactMessage");
const Content = require("../models/Content");
const auth = require("../middleware/auth");

const router = express.Router();

const CONTACT_RECEIVER_EMAIL = process.env.CONTACT_RECEIVER_EMAIL || "sakshidesai314@gmail.com";

const parseList = (value) =>
  String(value || "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const parsePort = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sendWithResend = async ({ from, to, subject, text, html, replyTo }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, reason: "missing_key" };

  const payload = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    text,
    html,
  };
  if (replyTo) payload.reply_to = replyTo;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    return { ok: false, reason: "api_error", message };
  }
  return { ok: true };
};

const getTransporter = (settings) => {
  const host = settings?.smtpHost || process.env.SMTP_HOST;
  const user = settings?.smtpUser || process.env.SMTP_USER;
  const pass = settings?.smtpPass || process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: parsePort(settings?.smtpPort || process.env.SMTP_PORT, 587),
      secure: String(settings?.smtpSecure || process.env.SMTP_SECURE || "false").toLowerCase() === "true",
      auth: { user, pass },
      dns: { family: 4 },
    });
  }

  const gmailUser = process.env.EMAIL_USER;
  const gmailPass = process.env.EMAIL_PASS;
  if (gmailUser && gmailPass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
      dns: { family: 4 },
    });
  }

  return null;
};

router.post("/send", async (req, res) => {
  let doc = null;
  try {
    const { fullName, email, subject, message } = req.body || {};

    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const emailSettingsDoc = await Content.findOne({ key: "emailSettings" });
    const emailSettings = emailSettingsDoc?.data || {};
    const receivers = parseList(emailSettings.contactRecipients || CONTACT_RECEIVER_EMAIL);
    const receiverList = receivers.length ? receivers : parseList(CONTACT_RECEIVER_EMAIL);
    const senderEmail =
      emailSettings.contactFromEmail ||
      process.env.CONTACT_FROM_EMAIL ||
      emailSettings.smtpUser ||
      process.env.SMTP_USER ||
      process.env.EMAIL_USER;
    const senderName = String(emailSettings.contactFromName || "").trim();
    const fromValue = senderName ? `${senderName} <${senderEmail}>` : senderEmail;

    doc = await ContactMessage.create({
      fullName,
      email,
      subject,
      message,
      sentTo: receiverList.join(", "),
    });

    const transporter = getTransporter(emailSettings);
    if (!transporter) {
      return res.status(202).json({
        message:
          "Message saved successfully, but email is not configured. Set SMTP credentials in server .env.",
        id: doc._id,
      });
    }

    const fromEmail = senderEmail;

    const emailText = `Name: ${fullName}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`;
    const emailHtml = `
        <h3>New Contact Form Message</h3>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong><br/>${String(message).replace(/\n/g, "<br/>")}</p>
      `;

    const resendResult = await sendWithResend({
      from: fromValue,
      to: receiverList,
      subject: `Website Contact: ${subject}`,
      text: emailText,
      html: emailHtml,
      replyTo: email,
    });

    if (!resendResult.ok) {
      if (!transporter) {
        throw new Error(resendResult.message || "Resend API error");
      }
      await transporter.sendMail({
        from: fromValue,
        to: receiverList,
        replyTo: email,
        subject: `Website Contact: ${subject}`,
        text: emailText,
        html: emailHtml,
      });
    }

    doc.mailStatus = "sent";
    doc.sentAt = new Date();
    doc.errorMessage = "";
    await doc.save();

    return res.json({ message: "Message sent successfully", id: doc._id });
  } catch (error) {
    if (doc && doc._id) {
      try {
        await ContactMessage.findByIdAndUpdate(doc._id, {
          mailStatus: "failed",
          errorMessage: error.message || "Email send failed",
        });
      } catch {
        // ignore secondary failure
      }
    }
    return res.status(500).json({ message: "Failed to send message" });
  }
});

// Admin route: list all contact form leads
router.get("/leads", auth, async (req, res) => {
  try {
    const leads = await ContactMessage.find().sort({ createdAt: -1 });
    return res.json(leads);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch leads" });
  }
});

// Admin route: delete a contact form lead
router.delete("/leads/:id", auth, async (req, res) => {
  try {
    const { id } = req.params || {};
    if (!id) {
      return res.status(400).json({ message: "Lead id is required" });
    }
    const deleted = await ContactMessage.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Lead not found" });
    }
    return res.json({ message: "Lead deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete lead" });
  }
});

// Admin route: send a test email with current settings
router.post("/test", auth, async (req, res) => {
  try {
    const emailSettingsDoc = await Content.findOne({ key: "emailSettings" });
    const emailSettings = emailSettingsDoc?.data || {};
    const receivers = parseList(emailSettings.contactRecipients || CONTACT_RECEIVER_EMAIL);
    const receiverList = receivers.length ? receivers : parseList(CONTACT_RECEIVER_EMAIL);
    const target = String(req.body?.to || receiverList[0] || "").trim();
    if (!target) {
      return res.status(400).json({ message: "Recipient email is required for test." });
    }

    const senderEmail =
      emailSettings.contactFromEmail ||
      process.env.CONTACT_FROM_EMAIL ||
      emailSettings.smtpUser ||
      process.env.SMTP_USER ||
      process.env.EMAIL_USER;
    const senderName = String(emailSettings.contactFromName || "").trim();
    const fromValue = senderName ? `${senderName} <${senderEmail}>` : senderEmail;

    const resendResult = await sendWithResend({
      from: fromValue,
      to: target,
      subject: "Test email from Aethon Plast",
      text: "This is a test email to verify SMTP settings.",
    });

    if (!resendResult.ok) {
      const transporter = getTransporter(emailSettings);
      if (!transporter) {
        return res.status(400).json({
          message:
            resendResult.message ||
            "SMTP is not configured. Set host, port, user, and password in Email Settings.",
        });
      }
      await transporter.sendMail({
        from: fromValue,
        to: target,
        subject: "Test email from Aethon Plast",
        text: "This is a test email to verify SMTP settings.",
      });
    }

    return res.json({ message: "Test email sent successfully." });
  } catch (error) {
    return res.status(500).json({
      message: error?.message || "Failed to send test email.",
    });
  }
});

module.exports = router;
