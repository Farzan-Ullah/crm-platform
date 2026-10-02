import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: true, // 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' etc.
    },
    entity: {
      type: String,
      required: true, // 'Auth' | 'User' | 'Lead' | 'Contact' | 'Deal' | 'Quote' etc.
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ip: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ tenantId: 1, entity: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ tenantId: 1, actorId: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
