import mongoose from 'mongoose';

const openEventSchema = new mongoose.Schema(
  {
    openedAt: { type: Date, default: Date.now },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { _id: false }
);

const clickEventSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    clickedAt: { type: Date, default: Date.now },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { _id: false }
);

const emailLogSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    trackingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    to: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    from: {
      type: String,
      required: true,
      trim: true,
    },
    cc: {
      type: [String],
      default: [],
    },
    bcc: {
      type: [String],
      default: [],
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    bodyHtml: {
      type: String,
      required: true,
    },
    bodyText: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Sent', 'Delivered', 'Opened', 'Clicked', 'Bounced', 'Failed'],
      default: 'Sent',
      index: true,
    },
    openCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    clickCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    openedAt: {
      type: Date,
      default: null,
    },
    clickedAt: {
      type: Date,
      default: null,
    },
    opens: {
      type: [openEventSchema],
      default: [],
    },
    clicks: {
      type: [clickEventSchema],
      default: [],
    },

    // Polymorphic association
    entityType: {
      type: String,
      enum: ['Lead', 'Contact', 'Company', 'Deal', 'Quote', null],
      default: null,
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'entityType',
      default: null,
      index: true,
    },

    // Direct foreign keys
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
      index: true,
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      default: null,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      index: true,
    },
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      default: null,
      index: true,
    },
    quoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
      default: null,
      index: true,
    },

    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      default: null,
      index: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailTemplate',
      default: null,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    messageId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

emailLogSchema.index({ tenantId: 1, createdAt: -1 });
emailLogSchema.index({ tenantId: 1, to: 1 });
emailLogSchema.index({ tenantId: 1, status: 1 });

export const EmailLog = mongoose.model('EmailLog', emailLogSchema);
