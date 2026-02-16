const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Admin = require("../models/Admin");
const Content = require("../models/Content");
const auth = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";
const LOGIN_CODE_TTL_MS = 10 * 60 * 1000;
const REQUIRE_ADMIN_EMAIL_VERIFICATION =
  String(process.env.REQUIRE_ADMIN_EMAIL_VERIFICATION || "false").toLowerCase() === "true";
const DEFAULT_PRIMARY_ADMIN_EMAIL = "aethonplast@gmail.com";
const DEFAULT_PRIMARY_ADMIN_PASSWORD = "aethonplast@2026";
const DEFAULT_PRIMARY_ADMIN_NAME = "Primary Admin";

const parseAdminAccounts = () => {
  const raw = process.env.ADMIN_ACCOUNTS;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
};

const ensureSeedAdmins = async () => {
  const fromList = parseAdminAccounts();
  const singleSeed = [
    {
      email: process.env.ADMIN_EMAIL || DEFAULT_PRIMARY_ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD || DEFAULT_PRIMARY_ADMIN_PASSWORD,
      name: process.env.ADMIN_NAME || DEFAULT_PRIMARY_ADMIN_NAME,
      forceSync: true,
    },
  ];

  const seeds = fromList && fromList.length > 0 ? fromList : singleSeed;

  for (const seed of seeds) {
    if (!seed?.email || !seed?.password) continue;
    const normalizedEmail = String(seed.email).trim().toLowerCase();
    const existing = await Admin.findOne({ email: normalizedEmail });
    if (existing) {
      if (seed.forceSync) {
        const passwordMatches = await bcrypt.compare(String(seed.password), existing.passwordHash);
        let shouldSave = false;
        if (!passwordMatches) {
          existing.passwordHash = await bcrypt.hash(String(seed.password), 10);
          shouldSave = true;
        }
        if ((existing.name || "") !== String(seed.name || "")) {
          existing.name = String(seed.name || "");
          shouldSave = true;
        }
        if (existing.isVerified !== true) {
          existing.isVerified = true;
          shouldSave = true;
        }
        if (shouldSave) {
          existing.loginVerificationCodeHash = "";
          existing.loginVerificationExpiresAt = null;
          await existing.save();
        }
      }
      continue;
    }

    const passwordHash = await bcrypt.hash(String(seed.password), 10);
    await Admin.create({
      name: String(seed.name || ""),
      email: normalizedEmail,
      passwordHash,
      isVerified: true,
      loginVerificationCodeHash: "",
      loginVerificationExpiresAt: null,
    });
  }
};

const getEmailSettings = async () => {
  try {
    const doc = await Content.findOne({ key: "emailSettings" });
    return doc?.data || {};
  } catch {
    return {};
  }
};

const createTransporter = (settings = {}) => {
  const host = settings.smtpHost || process.env.SMTP_HOST;
  const user = settings.smtpUser || process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = settings.smtpPass || process.env.SMTP_PASS || process.env.EMAIL_PASS;
  if (!user || !pass) return null;

  if (!host) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      dns: { family: 4 },
    });
  }

  const port = Number(settings.smtpPort || process.env.SMTP_PORT || 587);
  const secure =
    settings.smtpSecure != null
      ? String(settings.smtpSecure).toLowerCase() === "true"
      : process.env.SMTP_SECURE != null
      ? String(process.env.SMTP_SECURE).toLowerCase() === "true"
      : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    dns: { family: 4 },
  });
};

const getResendApiKey = (settings = {}) => {
  if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY;
  const host = String(settings.smtpHost || process.env.SMTP_HOST || "").toLowerCase();
  const user = String(settings.smtpUser || process.env.SMTP_USER || "").toLowerCase();
  const pass = String(settings.smtpPass || process.env.SMTP_PASS || "");
  if (host.includes("resend.com") && user === "resend" && pass) {
    return pass;
  }
  return "";
};

const sendWithResend = async ({ to, subject, text, html, settings = {} }) => {
  const apiKey = getResendApiKey(settings);
  if (!apiKey) return false;

  const from =
    settings.contactFromEmail ||
    process.env.CONTACT_FROM_EMAIL ||
    settings.smtpUser ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USER;
  if (!from) return false;

  const payload = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    text,
    html,
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response.ok;
};

const generateVerificationCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const saveVerificationCode = async (admin, code) => {
  admin.loginVerificationCodeHash = crypto.createHash("sha256").update(code).digest("hex");
  admin.loginVerificationExpiresAt = new Date(Date.now() + LOGIN_CODE_TTL_MS);
  await admin.save();
};

const sendVerificationCode = async (email, code) => {
  const settings = await getEmailSettings();
  const sentViaResend = await sendWithResend({
    to: email,
    subject: "Admin verification code",
    text: `Your admin verification code is: ${code}. It expires in 10 minutes.`,
    settings,
  });
  if (sentViaResend) return true;

  const transporter = createTransporter(settings);
  if (!transporter) return false;

  await transporter.sendMail({
    from:
      settings.contactFromEmail ||
      process.env.CONTACT_FROM_EMAIL ||
      settings.smtpUser ||
      process.env.SMTP_USER ||
      process.env.EMAIL_USER,
    to: email,
    subject: "Admin verification code",
    text: `Your admin verification code is: ${code}. It expires in 10 minutes.`,
  });
  return true;
};

const handleMissingSmtpVerification = async (admin) => {
  if (REQUIRE_ADMIN_EMAIL_VERIFICATION) return false;
  admin.isVerified = true;
  admin.loginVerificationCodeHash = "";
  admin.loginVerificationExpiresAt = null;
  await admin.save();
  return true;
};

const formatVerificationResponse = (baseMessage, codeSent, code) => {
  if (codeSent) {
    return { message: baseMessage };
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      message: "SMTP is not configured. Use this verification code locally.",
      verificationCode: code,
    };
  }

  return { message: "Email is not configured. Set SMTP credentials in server .env." };
};

router.get("/admins", auth, async (req, res) => {
  try {
    await ensureSeedAdmins();
    const admins = await Admin.find({}, { email: 1, name: 1, createdAt: 1 }).sort({ createdAt: -1 });
    return res.json({
      count: admins.length,
      admins,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch admins" });
  }
});

router.delete("/admins/:id", auth, async (req, res) => {
  try {
    const targetId = String(req.params.id || "");
    if (!targetId) {
      return res.status(400).json({ message: "Admin id is required" });
    }

    const adminsCount = await Admin.countDocuments();
    if (adminsCount <= 1) {
      return res.status(400).json({ message: "Cannot delete the last admin account" });
    }

    const targetAdmin = await Admin.findById(targetId);
    if (!targetAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const requesterId = String(req.admin?.id || "");
    const requesterEmail = String(req.admin?.email || "").trim().toLowerCase();
    if (
      (requesterId && requesterId === String(targetAdmin._id)) ||
      (requesterEmail && requesterEmail === String(targetAdmin.email || "").toLowerCase())
    ) {
      return res.status(400).json({ message: "You cannot delete your own admin account" });
    }

    await Admin.deleteOne({ _id: targetAdmin._id });
    return res.json({ message: "Admin removed successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete admin" });
  }
});

router.post("/admin/signup", async (req, res) => {
  try {
    if (String(process.env.DISABLE_PUBLIC_ADMIN_SIGNUP || "true").toLowerCase() === "true") {
      return res.status(403).json({ message: "Admin signup is disabled." });
    }
    await ensureSeedAdmins();

    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Admin account already exists for this email" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      name,
      email,
      passwordHash,
      isVerified: false,
      loginVerificationCodeHash: "",
      loginVerificationExpiresAt: null,
    });

    const code = generateVerificationCode();
    await saveVerificationCode(admin, code);
    const sent = await sendVerificationCode(email, code);
    if (!sent) {
      const autoVerified = await handleMissingSmtpVerification(admin);
      if (autoVerified) {
        return res.status(201).json({
          message: "Admin created and verified (SMTP not configured).",
          verificationRequired: false,
          email,
        });
      }
    }
    const payload = formatVerificationResponse("Verification code sent to your email.", sent, code);

    return res.status(sent ? 201 : 200).json({
      ...payload,
      verificationRequired: true,
      email,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create admin account" });
  }
});

// Admin-only: create a new admin account
router.post("/admins", auth, async (req, res) => {
  try {
    await ensureSeedAdmins();

    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Admin account already exists for this email" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      name,
      email,
      passwordHash,
      isVerified: true,
      loginVerificationCodeHash: "",
      loginVerificationExpiresAt: null,
    });

    return res.status(201).json({
      message: "Admin created",
      admin: { id: admin._id, name: admin.name, email: admin.email, createdAt: admin.createdAt },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create admin account" });
  }
});

router.post("/admin/resend-verification", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin account not found" });
    }
    if (admin.isVerified === true) {
      return res.status(400).json({ message: "Admin is already verified" });
    }

    const code = generateVerificationCode();
    await saveVerificationCode(admin, code);
    const sent = await sendVerificationCode(email, code);
    if (!sent) {
      const autoVerified = await handleMissingSmtpVerification(admin);
      if (autoVerified) {
        return res.json({ message: "Admin verified (SMTP not configured)." });
      }
    }
    const payload = formatVerificationResponse("Verification code sent to your email.", sent, code);
    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ message: "Failed to resend verification code" });
  }
});

router.post("/admin/login", async (req, res) => {
  try {
    await ensureSeedAdmins();

    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email: String(email).trim().toLowerCase() });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(String(password), admin.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (admin.isVerified === false) {
      const code = generateVerificationCode();
      await saveVerificationCode(admin, code);
      const sent = await sendVerificationCode(admin.email, code);
      if (!sent) {
        const autoVerified = await handleMissingSmtpVerification(admin);
        if (autoVerified) {
          const token = jwt.sign({ email: admin.email, role: "admin", id: admin._id }, JWT_SECRET, {
            expiresIn: "1d",
          });
          return res.json({
            token,
            admin: { email: admin.email, role: "admin", name: admin.name || "" },
            message: "Logged in (SMTP not configured).",
          });
        }
      }
      const payload = formatVerificationResponse("Verification required. Code sent to your email.", sent, code);
      return res.status(403).json({
        ...payload,
        verificationRequired: true,
        email: admin.email,
      });
    }

    const token = jwt.sign({ email: admin.email, role: "admin", id: admin._id }, JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.json({
      token,
      admin: { email: admin.email, role: "admin", name: admin.name || "" },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to login" });
  }
});

router.post("/admin/verify-login", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const code = String(req.body?.code || "").trim();
    if (!email || !code) {
      return res.status(400).json({ message: "Email and verification code are required" });
    }

    const admin = await Admin.findOne({
      email,
      loginVerificationExpiresAt: { $gt: new Date() },
    });
    if (!admin) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    const hash = crypto.createHash("sha256").update(code).digest("hex");
    if (hash !== admin.loginVerificationCodeHash) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    admin.isVerified = true;
    admin.loginVerificationCodeHash = "";
    admin.loginVerificationExpiresAt = null;
    await admin.save();

    const token = jwt.sign({ email: admin.email, role: "admin", id: admin._id }, JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.json({
      token,
      admin: { email: admin.email, role: "admin", name: admin.name || "" },
      message: "Verification successful. Logged in.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to verify code" });
  }
});

router.post("/admin/forgot-password", async (req, res) => {
  try {
    await ensureSeedAdmins();

    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.json({ message: "If this email exists, a reset code has been sent." });
    }

    const resetCode = generateVerificationCode();
    const tokenHash = crypto.createHash("sha256").update(resetCode).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    admin.resetPasswordTokenHash = tokenHash;
    admin.resetPasswordExpiresAt = expiresAt;
    await admin.save();

    const settings = await getEmailSettings();
    const resetText = `Your password reset code is: ${resetCode}. It expires in 15 minutes.`;
    const sentViaResend = await sendWithResend({
      to: admin.email,
      subject: "Admin password reset",
      text: resetText,
      settings,
    });

    if (!sentViaResend) {
      const transporter = createTransporter(settings);
      if (!transporter) {
        if (process.env.NODE_ENV !== "production") {
          return res.json({
            message: "Email is not configured. Use this reset code locally.",
            resetCode,
          });
        }
        return res
          .status(500)
          .json({ message: "Email is not configured. Set SMTP credentials in server .env." });
      }

      await transporter.sendMail({
        from:
          settings.contactFromEmail ||
          process.env.CONTACT_FROM_EMAIL ||
          settings.smtpUser ||
          process.env.SMTP_USER ||
          process.env.EMAIL_USER,
        to: admin.email,
        subject: "Admin password reset",
        text: resetText,
      });
    }

    return res.json({ message: "If this email exists, a reset code has been sent." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to process forgot password request" });
  }
});

router.post("/admin/reset-password", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const token = String(req.body?.token || "").trim();
    const code = String(req.body?.code || "").trim();
    const newPassword = String(req.body?.newPassword || "");

    if (!email || !newPassword || (!token && !code)) {
      return res.status(400).json({ message: "Email, reset code (or token), and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const resetValue = code || token;
    const tokenHash = crypto.createHash("sha256").update(resetValue).digest("hex");
    const admin = await Admin.findOne({
      email,
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!admin) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    admin.passwordHash = await bcrypt.hash(newPassword, 10);
    admin.resetPasswordTokenHash = "";
    admin.resetPasswordExpiresAt = null;
    await admin.save();

    return res.json({ message: "Password reset successful. Please login." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to reset password" });
  }
});

module.exports = router;
