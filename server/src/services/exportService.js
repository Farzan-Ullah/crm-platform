import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { Lead } from '../models/Lead.js';
import { Contact } from '../models/Contact.js';
import { Company } from '../models/Company.js';
import { Deal } from '../models/Deal.js';
import { Quote } from '../models/Quote.js';
import { logAuditEvent } from './auditService.js';
import { AppError } from '../utils/AppError.js';

export const exportEntities = async ({
  tenantId,
  actorId,
  entity,
  format = 'csv',
  ip = '',
  userAgent = '',
}) => {
  let flatRows = [];
  const normalizedEntity = entity.toLowerCase();

  if (normalizedEntity === 'leads' || normalizedEntity === 'lead') {
    const leads = await Lead.find({ tenantId })
      .populate('ownerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    flatRows = leads.map((l) => ({
      ID: l._id.toString(),
      FirstName: l.firstName,
      LastName: l.lastName,
      Email: l.email || '',
      Phone: l.phone || '',
      Company: l.company || '',
      JobTitle: l.jobTitle || '',
      Source: l.source || '',
      Status: l.status || '',
      Score: l.score || 0,
      AssignedTo: l.ownerId ? `${l.ownerId.firstName} ${l.ownerId.lastName}` : 'Unassigned',
      CreatedAt: l.createdAt ? new Date(l.createdAt).toISOString() : '',
    }));
  } else if (normalizedEntity === 'contacts' || normalizedEntity === 'contact') {
    const contacts = await Contact.find({ tenantId, isMerged: { $ne: true } })
      .populate('companyId', 'name domain')
      .populate('ownerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    flatRows = contacts.map((c) => ({
      ID: c._id.toString(),
      FirstName: c.firstName,
      LastName: c.lastName,
      Email: c.email || '',
      Phone: c.phone || '',
      JobTitle: c.jobTitle || '',
      Company: c.companyId ? c.companyId.name : '',
      City: c.address?.city || '',
      Country: c.address?.country || '',
      Owner: c.ownerId ? `${c.ownerId.firstName} ${c.ownerId.lastName}` : 'Unassigned',
      CreatedAt: c.createdAt ? new Date(c.createdAt).toISOString() : '',
    }));
  } else if (normalizedEntity === 'companies' || normalizedEntity === 'company') {
    const companies = await Company.find({ tenantId })
      .populate('ownerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    flatRows = companies.map((c) => ({
      ID: c._id.toString(),
      CompanyName: c.name,
      Domain: c.domain || '',
      Industry: c.industry || '',
      Size: c.size || '',
      Phone: c.phone || '',
      Email: c.email || '',
      Website: c.website || '',
      City: c.address?.city || '',
      Country: c.address?.country || '',
      Owner: c.ownerId ? `${c.ownerId.firstName} ${c.ownerId.lastName}` : 'Unassigned',
      CreatedAt: c.createdAt ? new Date(c.createdAt).toISOString() : '',
    }));
  } else if (normalizedEntity === 'deals' || normalizedEntity === 'deal') {
    const deals = await Deal.find({ tenantId })
      .populate('companyId', 'name')
      .populate('contactId', 'firstName lastName email')
      .populate('ownerId', 'firstName lastName email')
      .populate('pipelineId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    flatRows = deals.map((d) => ({
      ID: d._id.toString(),
      Title: d.title,
      Value: d.value || 0,
      Currency: d.currency || 'USD',
      Pipeline: d.pipelineId?.name || '',
      Company: d.companyId?.name || '',
      Contact: d.contactId ? `${d.contactId.firstName} ${d.contactId.lastName}` : '',
      ExpectedCloseDate: d.expectedCloseDate ? new Date(d.expectedCloseDate).toISOString().slice(0, 10) : '',
      Status: d.status || 'open',
      LossReason: d.lossReason || '',
      Owner: d.ownerId ? `${d.ownerId.firstName} ${d.ownerId.lastName}` : 'Unassigned',
      CreatedAt: d.createdAt ? new Date(d.createdAt).toISOString() : '',
    }));
  } else if (normalizedEntity === 'quotes' || normalizedEntity === 'quote') {
    const quotes = await Quote.find({ tenantId })
      .populate('dealId', 'title')
      .populate('contactId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    flatRows = quotes.map((q) => ({
      ID: q._id.toString(),
      QuoteNumber: q.quoteNumber,
      Title: q.title,
      Deal: q.dealId?.title || '',
      Contact: q.contactId ? `${q.contactId.firstName} ${q.contactId.lastName}` : '',
      Status: q.status,
      Subtotal: q.subtotal || 0,
      DiscountTotal: q.discountTotal || 0,
      TaxTotal: q.taxTotal || 0,
      TotalAmount: q.totalAmount || 0,
      RequiresApproval: q.requiresApproval ? 'Yes' : 'No',
      ValidUntil: q.validUntil ? new Date(q.validUntil).toISOString().slice(0, 10) : '',
      CreatedBy: q.createdBy ? `${q.createdBy.firstName} ${q.createdBy.lastName}` : '',
      CreatedAt: q.createdAt ? new Date(q.createdAt).toISOString() : '',
    }));
  } else {
    throw new AppError(`Export not supported for entity: ${entity}`, 400);
  }

  // Record audit log
  await logAuditEvent({
    tenantId,
    actorId,
    action: 'EXPORT',
    entity: normalizedEntity.toUpperCase(),
    after: { count: flatRows.length, format },
    ip,
    userAgent,
  });

  if (format.toLowerCase() === 'xlsx' || format.toLowerCase() === 'excel') {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NexusCRM';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(entity);

    if (flatRows.length > 0) {
      const columns = Object.keys(flatRows[0]).map((key) => ({
        header: key,
        key: key,
        width: Math.max(15, key.length + 4),
      }));
      worksheet.columns = columns;

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' }, // Indigo-600
      };

      flatRows.forEach((row) => {
        worksheet.addRow(row);
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return {
      type: 'buffer',
      data: buffer,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `${normalizedEntity}_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
    };
  }

  // Default: CSV
  const csvString = Papa.unparse(flatRows);
  return {
    type: 'string',
    data: csvString,
    contentType: 'text/csv',
    filename: `${normalizedEntity}_export_${new Date().toISOString().slice(0, 10)}.csv`,
  };
};
