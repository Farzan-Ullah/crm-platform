import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Email subject is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Sales', 'Marketing', 'FollowUp', 'Onboarding', 'Transactional', 'Other'],
      default: 'Sales',
      index: true,
    },
    bodyHtml: {
      type: String,
      required: [true, 'HTML body content is required'],
    },
    bodyText: {
      type: String,
      default: '',
    },
    variables: {
      type: [String],
      default: ['firstName', 'lastName', 'company', 'jobTitle', 'ownerName', 'dealTitle'],
    },
    isShared: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

emailTemplateSchema.index({ tenantId: 1, name: 1 });
emailTemplateSchema.index({ tenantId: 1, category: 1 });

export const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);
