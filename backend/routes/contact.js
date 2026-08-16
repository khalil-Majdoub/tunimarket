// backend/routes/contact.js
//
// FIX (issue #7): Contact.jsx used to just `await new Promise(r => setTimeout(...))`
// and show a fake success message — nothing was ever actually sent.
//
// This reuses the `sendWhatsApp` helper you already have in
// `backend/utils/whatsapp.js` (the same one orders.js uses) so the contact
// form forwards straight to your admin WhatsApp number — no extra service
// (like an email provider) needs to be set up.
//
// SETUP REQUIRED:
//   Mount this route in server.js:
//     app.use('/api/contact', require('./routes/contact'));
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const { sendWhatsApp } = require('../utils/whatsapp');

// Simple in-memory rate limiter to stop the form being used to spam WhatsApp.
// Fine for a single-instance deploy; swap for a real rate-limit store
// (Redis, etc.) if you scale to multiple server instances.
const recentSubmissions = new Map(); // ip -> timestamp[]
const WINDOW_MS   = 10 * 60 * 1000; // 10 minutes
const MAX_PER_WINDOW = 5;

const isRateLimited = (ip) => {
  const now = Date.now();
  const timestamps = (recentSubmissions.get(ip) || []).filter(t => now - t < WINDOW_MS);
  timestamps.push(now);
  recentSubmissions.set(ip, timestamps);
  return timestamps.length > MAX_PER_WINDOW;
};

router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Email invalide' });
    }
    if (message.trim().length < 20) {
      return res.status(400).json({ message: 'Message trop court (min 20 caractères)' });
    }

    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    if (isRateLimited(ip)) {
      return res.status(429).json({ message: 'Trop de messages envoyés. Réessayez plus tard.' });
    }

    const adminPhone = process.env.ADMIN_PHONE;
    if (!adminPhone) {
      console.error('[CONTACT] ADMIN_PHONE not set in .env');
      return res.status(500).json({ message: 'Formulaire de contact non configuré côté serveur' });
    }

    const whatsappMessage =
      `📩 *Nouveau message de contact*\n\n` +
      `*Nom:* ${name.trim()}\n` +
      `*Email:* ${email.trim()}\n` +
      `*Sujet:* ${subject.trim()}\n\n` +
      `*Message:*\n${message.trim()}`;

    await sendWhatsApp(adminPhone, whatsappMessage);

    console.log(`[CONTACT] ✅ Message received from ${email.trim()}`);
    res.status(200).json({ message: 'Message envoyé avec succès' });

  } catch (err) {
    console.error('[CONTACT] POST error:', err.message);
    res.status(500).json({ message: 'Erreur lors de l\'envoi du message' });
  }
});

module.exports = router;