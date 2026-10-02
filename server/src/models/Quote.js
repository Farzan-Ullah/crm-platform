import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Line item product or service name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
      default: 0,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    discountPercent: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
      default: 0,
    },
    taxPercent: {
      type: Number,
      min: [0, 'Tax percentage cannot be negative'],
      max: [100, 'Tax percentage cannot exceed 100%'],
      default: 0,
    },
    itemTotal: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const quoteSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    quoteNumber: {
      type: String,
      required: [true, 'Quotation number is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Quotation title is required'],
      trim: true,
    },
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
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
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lineItems: {
      type: [lineItemSchema],
      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: 'A quotation must contain at least one line item',
      },
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    totalDiscount: {
      type: Number,
      default: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      default: 0,
      index: true,
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Approved', 'Rejected', 'Sent', 'Accepted', 'Declined', 'Expired'],
      default: 'Draft',
      index: true,
    },
    approvalDetails: {
      requiresApproval: {
        type: Boolean,
        default: false,
      },
      approvalReason: {
        type: String,
        default: '',
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      approvedAt: {
        type: Date,
        default: null,
      },
      rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      rejectedAt: {
        type: Date,
        default: null,
      },
      rejectionReason: {
        type: String,
        default: '',
      },
    },
    terms: {
      type: String,
      default: 'Payment due within 30 days of issue. All prices in USD.',
    },
    notes: {
      type: String,
      default: '',
    },
    validUntil: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
    },
    sentAt: {
      type: Date,
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    declinedAt: {
      type: Date,
      default: null,
    },
    declineReason: {
      type: String,
      default: '',
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
quoteSchema.index({ tenantId: 1, quoteNumber: 1 }, { unique: true });
quoteSchema.index({ tenantId: 1, status: 1 });
quoteSchema.index({ tenantId: 1, dealId: 1 });
quoteSchema.index({ tenantId: 1, contactId: 1 });
quoteSchema.index({ tenantId: 1, createdAt: -1 });

export const Quote = mongoose.model('Quote', quoteSchema);
