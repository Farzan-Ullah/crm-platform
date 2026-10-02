import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tenant name is required'],
      trim: true,
    },
    subdomain: {
      type: String,
      required: [true, 'Subdomain is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'trial'],
      default: 'active',
    },
    subscription: {
      plan: {
        type: String,
        enum: ['starter', 'professional', 'enterprise'],
        default: 'professional',
      },
      validTill: {
        type: Date,
        default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    },
    settings: {
      company: {
        name: { type: String, default: '' },
        logo: { type: String, default: '' },
        website: { type: String, default: '' },
        phone: { type: String, default: '' },
        email: { type: String, default: '' },
        taxId: { type: String, default: '' },
        address: {
          street: { type: String, default: '' },
          city: { type: String, default: '' },
          state: { type: String, default: '' },
          postalCode: { type: String, default: '' },
          country: { type: String, default: 'United States' },
        },
      },
      localization: {
        currency: { type: String, default: 'USD' },
        currencySymbol: { type: String, default: '$' },
        timezone: { type: String, default: 'UTC' },
        dateFormat: { type: String, default: 'YYYY-MM-DD' },
      },
      sales: {
        defaultQuoteValidityDays: { type: Number, default: 30 },
        defaultTaxRate: { type: Number, default: 10 },
        leadStages: {
          type: [String],
          default: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'],
        },
      },
      smtp: {
        enabled: { type: Boolean, default: false },
        host: { type: String, default: '' },
        port: { type: Number, default: 587 },
        user: { type: String, default: '' },
        password: { type: String, default: '' },
        fromEmail: { type: String, default: '' },
        fromName: { type: String, default: '' },
        secure: { type: Boolean, default: false },
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Tenant = mongoose.model('Tenant', tenantSchema);
