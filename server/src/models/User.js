import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.SALES_EXECUTIVE,
      index: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound Unique Index: email must be unique per tenant
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, role: 1, isActive: 1 });

// Full name virtual
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Check if account is locked
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment failed attempts and lock if >= 5
userSchema.methods.handleFailedLogin = async function () {
  const attempts = this.failedLoginAttempts + 1;
  const updates = { failedLoginAttempts: attempts };

  if (attempts >= 5) {
    updates.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes lockout
  }

  return this.updateOne(updates);
};

// Reset failed attempts upon successful login
userSchema.methods.handleSuccessfulLogin = async function () {
  return this.updateOne({
    $set: {
      failedLoginAttempts: 0,
      lockUntil: null,
      lastLogin: new Date(),
    },
  });
};

export const User = mongoose.model('User', userSchema);
