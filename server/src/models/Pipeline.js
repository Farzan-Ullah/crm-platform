import mongoose from 'mongoose';

const stageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  order: {
    type: Number,
    required: true,
  },
  probability: {
    type: Number,
    default: 10,
    min: 0,
    max: 100,
  },
  color: {
    type: String,
    default: '#6366f1',
  },
  isWon: {
    type: Boolean,
    default: false,
  },
  isLost: {
    type: Boolean,
    default: false,
  },
});

const pipelineSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Pipeline name is required'],
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    stages: {
      type: [stageSchema],
      default: [
        { name: 'New', order: 0, probability: 10, color: '#3b82f6', isWon: false, isLost: false },
        { name: 'Qualified', order: 1, probability: 25, color: '#6366f1', isWon: false, isLost: false },
        { name: 'Proposal', order: 2, probability: 50, color: '#8b5cf6', isWon: false, isLost: false },
        { name: 'Negotiation', order: 3, probability: 75, color: '#f59e0b', isWon: false, isLost: false },
        { name: 'Won', order: 4, probability: 100, color: '#10b981', isWon: true, isLost: false },
        { name: 'Lost', order: 5, probability: 0, color: '#ef4444', isWon: false, isLost: true },
      ],
    },
  },
  {
    timestamps: true,
  }
);

pipelineSchema.index({ tenantId: 1, isDefault: 1 });

export const Pipeline = mongoose.model('Pipeline', pipelineSchema);
