// backend/routes/auth.js
const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const authMiddleware = require('../middleware/auth');

// ── Helper: sign JWT ────────────────────────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    {
      id:       String(user._id),
      isSeller: Boolean(user.isSeller),
      isAdmin:  Boolean(user.isAdmin),
      email:    user.email,
      name:     user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

// ── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone = '', isSeller = false } = req.body;

    if (!name?.trim())     return res.status(400).json({ message: 'Le nom est requis' });
    if (!email?.trim())    return res.status(400).json({ message: "L'email est requis" });
    if (!password)         return res.status(400).json({ message: 'Le mot de passe est requis' });
    if (password.length < 6) return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(400).json({ message: 'Cet email est déjà utilisé' });

    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password, // hashed by pre-save hook
      phone:    phone.trim(),
      isSeller: Boolean(isSeller),
      isAdmin:  false,
    });

    const token = signToken(user);

    res.status(201).json({
      token,
      user: {
        id:       user._id,
        name:     user.name,
        email:    user.email,
        phone:    user.phone,
        isSeller: user.isSeller,
        isAdmin:  user.isAdmin,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    console.error('[AUTH] Register error:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim()) return res.status(400).json({ message: "L'email est requis" });
    if (!password)       return res.status(400).json({ message: 'Le mot de passe est requis' });

    // Explicitly select password (it's select:false in schema)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password +loginAttempts +lockUntil');

    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        message: `Compte temporairement bloqué. Réessayez dans ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
      });
    }

    const valid = await user.comparePassword(password);

    if (!valid) {
      // Increment failure counter
      const MAX = 5;
      const attempts = (user.loginAttempts || 0) + 1;
      const update   = { loginAttempts: attempts };
      if (attempts >= MAX) {
        update.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2h lock
      }
      await User.updateOne({ _id: user._id }, update);

      const remaining = MAX - attempts;
      return res.status(401).json({
        message: remaining > 0
          ? `Email ou mot de passe incorrect (${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''})`
          : 'Trop de tentatives — compte bloqué temporairement',
      });
    }

    // Reset login attempts on success
    if (user.loginAttempts > 0 || user.lockUntil) {
      await User.updateOne({ _id: user._id }, { $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Compte désactivé. Contactez le support.' });
    }

    const token = signToken(user);

    res.json({
      token,
      user: {
        id:       user._id,
        name:     user.name,
        email:    user.email,
        phone:    user.phone,
        isSeller: user.isSeller,
        isAdmin:  user.isAdmin,
      },
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -loginAttempts -lockUntil');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    console.error('[AUTH] GET /me error:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── DELETE /api/auth/me ─────────────────────────────────────────────────────
router.delete('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Use safe requires to avoid circular dependency issues
    const Product  = require('../models/Product');
    const Cart     = require('../models/Cart');
    const Wishlist = require('../models/Wishlist');

    await Promise.all([
      Product.deleteMany({ seller: userId }),
      Cart.findOneAndDelete({ userId }),
      Wishlist.findOneAndDelete({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    res.json({ message: 'Compte supprimé avec succès' });
  } catch (err) {
    console.error('[AUTH] Delete account error:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;