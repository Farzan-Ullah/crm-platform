import mongoose from 'mongoose';

const dealSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Deal title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    value: {
      type: Number,
      required: [true, 'Deal value is required'],
      min: 0,
      default: 0,
      index: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    pipelineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pipeline',
      required: true,
      index: true,
    },
    stageId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
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
      default: null,
      index: true,
    },
    expectedClose: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
      index: true,
    },
    probability: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['Open', 'Won', 'Lost'],
      default: 'Open',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    lostReason: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      default: 'Outbound',
    },
    tags: {
      type: [String],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    stageHistory: [
      {
        stageId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        stageName: {
          type: String,
          default: '',
        },
        movedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
dealSchema.index({ tenantId: 1, pipelineId: 1, stageId: 1, order: 1 });
dealSchema.index({ tenantId: 1, ownerId: 1, status: 1 });
dealSchema.index({ tenantId: 1, expectedClose: 1 });

// Virtual weighted value
dealSchema.virtual('weightedValue').get(function () {
  return (this.value * (this.probability || 0)) / 100;
});

// Virtual expectedCloseDate alias
dealSchema.virtual('expectedCloseDate').get(function () {
  return this.expectedClose;
});

export const Deal = mongoose.model('Deal', dealSchema);
