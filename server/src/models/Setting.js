import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      unique: true,
      index: true,
    },
    company: {
      name: { type: String, default: 'NexusCRM Technologies' },
      logo: { type: String, default: '' },
      address: {
        street: { type: String, default: '100 Innovation Way' },
        city: { type: String, default: 'San Francisco' },
        state: { type: String, default: 'CA' },
        country: { type: String, default: 'USA' },
        postalCode: { type: String, default: '94105' },
      },
      phone: { type: String, default: '+1 (555) 234-5678' },
      email: { type: String, default: 'contact@nexuscrm.io' },
      website: { type: String, default: 'https://nexuscrm.io' },
      taxId: { type: String, default: 'US-987654321' },
      currency: { type: String, default: 'USD' },
      timezone: { type: String, default: 'UTC' },
    },
    crm: {
      leadStatuses: {
        type: [String],
        default: ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Lost'],
      },
      leadSources: {
        type: [String],
        default: ['Website', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Advertisement', 'Campaign', 'Partner', 'Other'],
      },
      lostReasons: {
        type: [String],
        default: ['Budget', 'Competitor', 'Timing', 'No Need', 'Feature Gap', 'Unresponsive'],
      },
      activityTypes: {
        type: [String],
        default: ['Call', 'Meeting', 'Task', 'Follow-up', 'Reminder'],
      },
      scoringRules: {
        type: [
          {
            criterion: String,
            points: Number,
          },
        ],
        default: [
          { criterion: 'Email provided', points: 10 },
          { criterion: 'Phone provided', points: 10 },
          { criterion: 'Company provided', points: 10 },
          { criterion: 'Website inquiry', points: 20 },
          { criterion: 'High-value company', points: 15 },
          { criterion: 'Meeting booked', points: 25 },
        ],
      },
    },
    email: {
      smtpHost: { type: String, default: 'smtp.mailtrap.io' },
      smtpPort: { type: Number, default: 2525 },
      smtpUser: { type: String, default: '' },
      smtpPassEncrypted: { type: String, default: '' },
      senderName: { type: String, default: 'NexusCRM Team' },
      senderEmail: { type: String, default: 'noreply@nexuscrm.io' },
    },
    quotation: {
      prefix: { type: String, default: 'QT' },
      nextNumber: { type: Number, default: 1 },
      taxRate: { type: Number, default: 10 },
      defaultTerms: { type: String, default: 'Payment due within 30 days from date of invoice.' },
    },
  },
  {
    timestamps: true,
  }
);

export const Setting = mongoose.model('Setting', settingSchema);
