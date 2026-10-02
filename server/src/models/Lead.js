import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
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
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: '',
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    jobTitle: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      enum: [
        'Website',
        'Referral',
        'Cold Call',
        'Email',
        'Social Media',
        'Advertisement',
        'Campaign',
        'Partner',
        'Other',
      ],
      default: 'Website',
      index: true,
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Lost'],
      default: 'New',
      index: true,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
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
    isConverted: {
      type: Boolean,
      default: false,
      index: true,
    },
    conversionDetails: {
      convertedAt: { type: Date, default: null },
      convertedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', default: null },
      companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
      dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', default: null },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for high performance querying
leadSchema.index({ tenantId: 1, ownerId: 1, status: 1 });
leadSchema.index({ tenantId: 1, email: 1 });
leadSchema.index({ tenantId: 1, phone: 1 });
leadSchema.index({ tenantId: 1, score: -1 });
leadSchema.index({ tenantId: 1, createdAt: -1 });

// Full text search index across relevant fields
leadSchema.index({
  firstName: 'text',
  lastName: 'text',
  company: 'text',
  email: 'text',
  jobTitle: 'text',
});

// Virtual for fullName
leadSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Virtual for score categorization
leadSchema.virtual('scoreCategory').get(function () {
  if (this.score >= 80) return 'Very Hot';
  if (this.score >= 60) return 'Hot';
  if (this.score >= 30) return 'Warm';
  return 'Cold';
});

export const Lead = mongoose.model('Lead', leadSchema);
