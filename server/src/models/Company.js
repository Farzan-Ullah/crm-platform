import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    domain: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    industry: {
      type: String,
      trim: true,
      default: 'Technology',
    },
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
      default: '11-50',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      postalCode: { type: String, default: '' },
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
companySchema.index({ tenantId: 1, domain: 1 });
companySchema.index({ tenantId: 1, name: 1 });
companySchema.index({ tenantId: 1, ownerId: 1 });
companySchema.index({ tenantId: 1, createdAt: -1 });

// Full text search
companySchema.index({
  name: 'text',
  domain: 'text',
  website: 'text',
});

export const Company = mongoose.model('Company', companySchema);
