import mongoose from 'mongoose';
import { Lead } from '../models/Lead.js';
import { Contact } from '../models/Contact.js';
import { Company } from '../models/Company.js';
import { Deal } from '../models/Deal.js';
import { Pipeline } from '../models/Pipeline.js';
import { AppError } from '../utils/AppError.js';
import { logAuditEvent } from './auditService.js';

export const convertLeadToAccount = async ({
  leadId,
  tenantId,
  actorId,
  companyChoice, // 'existing' | 'new'
  companyId,
  newCompanyName,
  newCompanyDomain,
  contactChoice, // 'existing' | 'new'
  contactId,
  newContactFirstName,
  newContactLastName,
  newContactEmail,
  newContactPhone,
  newContactJobTitle,
  createDeal = false,
  dealTitle,
  dealValue = 0,
  dealExpectedClose,
  dealPipelineId,
  dealStageId,
  ip = '',
  userAgent = '',
}) => {
  const lead = await Lead.findOne({ _id: leadId, tenantId });
  if (!lead) {
    throw new AppError('Lead not found.', 404, 'NOT_FOUND');
  }

  if (lead.isConverted) {
    throw new AppError('This lead has already been converted.', 400, 'BAD_REQUEST');
  }

  // Check if connected MongoDB deployment supports transactions (Replica Set / Mongos)
  const topologyType = mongoose.connection.client?.topology?.description?.type;
  const supportsTransactions = topologyType === 'ReplicaSetWithPrimary' || topologyType === 'Sharded';

  let session = null;
  if (supportsTransactions) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (e) {
      session = null;
    }
  }

  try {
    const opts = session ? { session } : {};

    // 1. Resolve Company
    let finalCompanyId = null;
    if (companyChoice === 'existing' && companyId) {
      const existingComp = await Company.findOne({ _id: companyId, tenantId }, null, opts);
      if (!existingComp) {
        throw new AppError('Selected company not found.', 404, 'NOT_FOUND');
      }
      finalCompanyId = existingComp._id;
    } else if (companyChoice === 'new' && newCompanyName) {
      // Check if duplicate company exists by domain or exact name to prevent duplication
      let existingComp = null;
      if (newCompanyDomain && newCompanyDomain.trim()) {
        existingComp = await Company.findOne(
          { tenantId, domain: newCompanyDomain.toLowerCase().trim() },
          null,
          opts
        );
      }
      if (!existingComp) {
        existingComp = await Company.findOne(
          { tenantId, name: new RegExp(`^${newCompanyName.trim()}$`, 'i') },
          null,
          opts
        );
      }

      if (existingComp) {
        finalCompanyId = existingComp._id;
      } else {
        const createdCompany = await Company.create(
          [
            {
              tenantId,
              name: newCompanyName.trim(),
              domain: newCompanyDomain ? newCompanyDomain.toLowerCase().trim() : '',
              ownerId: lead.ownerId || actorId,
              phone: lead.phone || '',
            },
          ],
          opts
        );
        finalCompanyId = createdCompany[0]._id;
      }
    }

    // 2. Resolve Contact
    let finalContactId = null;
    if (contactChoice === 'existing' && contactId) {
      const existingCont = await Contact.findOne({ _id: contactId, tenantId }, null, opts);
      if (!existingCont) {
        throw new AppError('Selected contact not found.', 404, 'NOT_FOUND');
      }
      finalContactId = existingCont._id;
    } else {
      const contactEmail = (newContactEmail || lead.email || '').toLowerCase().trim();

      // Check if contact already exists by email
      let existingCont = null;
      if (contactEmail) {
        existingCont = await Contact.findOne(
          { tenantId, email: contactEmail, mergedInto: null },
          null,
          opts
        );
      }

      if (existingCont) {
        finalContactId = existingCont._id;
        // Optionally link to company if not set
        if (!existingCont.companyId && finalCompanyId) {
          existingCont.companyId = finalCompanyId;
          await existingCont.save(opts);
        }
      } else {
        const createdContact = await Contact.create(
          [
            {
              tenantId,
              firstName: newContactFirstName || lead.firstName,
              lastName: newContactLastName || lead.lastName,
              email: contactEmail,
              phone: newContactPhone || lead.phone || '',
              jobTitle: newContactJobTitle || lead.jobTitle || '',
              companyId: finalCompanyId,
              ownerId: lead.ownerId || actorId,
              notes: lead.notes || '',
            },
          ],
          opts
        );
        finalContactId = createdContact[0]._id;
      }
    }

    // 3. Resolve Optional Deal
    let finalDealId = null;
    if (createDeal) {
      // Find pipeline
      let targetPipeline;
      if (dealPipelineId) {
        targetPipeline = await Pipeline.findOne({ _id: dealPipelineId, tenantId }, null, opts);
      } else {
        targetPipeline = await Pipeline.findOne({ tenantId, isDefault: true }, null, opts);
        if (!targetPipeline) {
          targetPipeline = await Pipeline.findOne({ tenantId }, null, opts);
        }
      }

      // If no pipeline exists at all in tenant, create default one
      if (!targetPipeline) {
        const defaultPipelines = await Pipeline.create(
          [
            {
              tenantId,
              name: 'Standard Sales Pipeline',
              isDefault: true,
            },
          ],
          opts
        );
        targetPipeline = defaultPipelines[0];
      }

      const stage =
        targetPipeline.stages.find((s) => s._id.toString() === dealStageId) ||
        targetPipeline.stages[0];

      const createdDeal = await Deal.create(
        [
          {
            tenantId,
            title: dealTitle || `${lead.company || lead.fullName} Deal`,
            value: Number(dealValue) || 0,
            pipelineId: targetPipeline._id,
            stageId: stage._id,
            contactId: finalContactId,
            companyId: finalCompanyId,
            ownerId: lead.ownerId || actorId,
            probability: stage.probability || 10,
            expectedClose: dealExpectedClose || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            source: lead.source || 'Website',
          },
        ],
        opts
      );
      finalDealId = createdDeal[0]._id;
    }

    // 4. Update Lead Record
    lead.isConverted = true;
    lead.status = 'Converted';
    lead.conversionDetails = {
      convertedAt: new Date(),
      convertedBy: actorId,
      contactId: finalContactId,
      companyId: finalCompanyId,
      dealId: finalDealId,
    };
    await lead.save(opts);

    // Commit transaction if active
    if (session) {
      await session.commitTransaction();
    }

    // 5. Audit Log
    await logAuditEvent({
      tenantId,
      actorId,
      action: 'CONVERT_LEAD',
      entity: 'Lead',
      entityId: lead._id,
      after: {
        contactId: finalContactId,
        companyId: finalCompanyId,
        dealId: finalDealId,
      },
      ip,
      userAgent,
    });

    return {
      lead,
      contactId: finalContactId,
      companyId: finalCompanyId,
      dealId: finalDealId,
    };
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};
