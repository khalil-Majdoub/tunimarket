// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Le nom est requis'],
      trim:      true,
      minlength: [2,   'Le nom doit contenir au moins 2 caractères'],
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
    },
    email: {
      type:      String,
      required:  [true, "L'email est requis"],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email invalide'],
      maxlength: [255, "L'email est trop long"],
    },
    password: {
      type:      String,
      required:  [true, 'Le mot de passe est requis'],
      minlength: [6,   'Le mot de passe doit contenir au moins 6 caractères'],
      select:    false, // Never returned in queries unless explicitly requested
    },
    phone: {
      type:    String,
      default: '',
      trim:    true,
    },
    avatar: {
      type:    String,
      default: '',
    },
    isSeller: {
      type:    Boolean,
      default: false,
    },
    isAdmin: {
      type:    Boolean,
      default: false,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    // Basic brute-force protection
    loginAttempts: {
      type:    Number,
      default: 0,
      select:  false,
    },
    lockUntil: {
      type:   Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true, versionKey: false },
    toObject:   { virtuals: true, versionKey: false },
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
userSchema.index({ email:    1 }, { unique: true });
userSchema.index({ isSeller: 1 });

// ── Virtual: account locked? ───────────────────────────────────────────────────
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ── Pre-save: hash password only when modified ─────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    next();
  } catch (err) {
    next(err);
  }
});

// ── Method: compare plain password ────────────────────────────────────────────
userSchema.methods.comparePassword = async function (plainText) {
  if (!plainText || !this.password) return false;
  return bcrypt.compare(plainText, this.password);
};

// ── Method: public-safe object (no password) ──────────────────────────────────
userSchema.methods.toSafeObject = function () {
  return {
    id:       this._id,
    name:     this.name,
    email:    this.email,
    phone:    this.phone,
    avatar:   this.avatar,
    isSeller: this.isSeller,
    isAdmin:  this.isAdmin,
  };
};

// ── SAFE registration ─────────────────────────────────────────────────────────
module.exports = mongoose.models.User || mongoose.model('User', userSchema);