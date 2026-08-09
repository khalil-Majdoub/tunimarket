// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  console.log('[AUTH MIDDLEWARE] Starting for:', req.originalUrl);

  const authHeader = req.headers.authorization || req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[AUTH MIDDLEWARE] Missing or invalid Authorization header');
    return res.status(401).json({ message: 'Token manquant ou invalide' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // This attaches the user object

    console.log('[AUTH MIDDLEWARE] Token valid - user:', decoded.id || decoded._id || 'no id');
    console.log('[AUTH MIDDLEWARE] req.user attached successfully');

    next(); // MUST be called here — do NOT return anything after next()
  } catch (err) {
    console.error('[AUTH MIDDLEWARE] Token verification failed:', err.name, err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré' });
    }
    return res.status(401).json({ message: 'Token invalide' });
  }
};