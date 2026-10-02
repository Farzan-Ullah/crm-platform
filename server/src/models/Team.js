import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    memberIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

teamSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const Team = mongoose.model('Team', teamSchema);
