// backend/routes/googleAuth.js
//
// FIX (issue #6): AuthModal.jsx calls POST /api/auth/google but no matching
// backend route existed, so the Google login button always failed.
//
// ⚠️ IMPORTANT — read before dropping this in:
// I don't have your existing `backend/routes/auth.js` or your `User` model,
// so this file makes reasonable assumptions based on the fields I *did* see
// referenced elsewhere in your code (user.name, user.email, user.isAdmin,
// user.isSeller, user.phone, and a JWT with `{ id }` in the payload — see
// `getUserId` in orders.js/cart.js). You will likely need to adjust field
// names to match your actual User schema.
//
// SETUP REQUIRED:
//   1. npm install google-auth-library
//   2. Add GOOGLE_CLIENT_ID=your-google-oauth-client-id to backend/.env
//      (same client ID your frontend's <GoogleLogin> component uses)
//   3. Mount this route. Either:
//        a) In server.js:  app.use('/api/auth', require('./routes/googleAuth'));
//           — as long as it's mounted at the same '/api/auth' prefix as your
//           existing auth.js, OR
//        b) Merge the router.post('/google', ...) handler below directly
//           into your existing routes/auth.js file instead of using this
//           as a separate file.
//   4. Make sure your User model's `phone` field (if required) is optional,
//      or has a default — Google sign-ins won't have a phone number unless
//      you prompt for one afterward.
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User'); // adjust path/name if different

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token Google requis' });
  }
  if (!process.env.GOOGLE_CLIENT_ID) {
    console.error('[AUTH] GOOGLE_CLIENT_ID not set in .env');
    return res.status(500).json({ message: 'Connexion Google non configurée côté serveur' });
  }

  try {
    // ── Verify the Google ID token server-side (never trust the client) ────
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.email) {
      return res.status(400).json({ message: 'Token Google invalide' });
    }
    if (payload.email_verified === false) {
      return res.status(400).json({ message: 'Email Google non vérifié' });
    }

    const { email, name, sub: googleId } = payload;

    // ── Find or create the user ─────────────────────────────────────────────
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name:     name || email.split('@')[0],
        email,
        googleId,
        // No password for Google-created accounts. If your User schema
        // requires `password`, either make it optional or generate a
        // random unusable placeholder here.
      });
      await user.save();
    } else if (!user.googleId) {
      // Existing email/password account signing in with Google for the
      // first time — link the accounts.
      user.googleId = googleId;
      await user.save();
    }

    // ── Issue the same kind of JWT your other auth routes issue ───────────
    // NOTE: orders.js/cart.js read `req.user.id`, so the payload key must
    // be `id` to stay consistent with the rest of the app.
    const jwtToken = jwt.sign(
      { id: user._id, isAdmin: !!user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token: jwtToken,
      user: {
        _id:      user._id,
        name:     user.name,
        email:    user.email,
        phone:    user.phone,
        isAdmin:  user.isAdmin,
        isSeller: user.isSeller,
      },
    });

  } catch (err) {
    console.error('[AUTH] Google login error:', err.message);
    res.status(401).json({ message: 'Échec de la connexion Google' });
  }
});

module.exports = router;