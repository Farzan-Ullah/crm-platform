import { Quote } from '../models/Quote.js';
import { Deal } from '../models/Deal.js';
import { Contact } from '../models/Contact.js';
import { Company } from '../models/Company.js';
import { Setting } from '../models/Setting.js';
import { Activity } from '../models/Activity.js';
import { AppError } from '../utils/AppError.js';
import { ROLES } from '../constants/roles.js';
import { createNotification } from './notificationService.js';

const DEFAULT_DISCOUNT_THRESHOLD = 15; // 15% discount requires manager approval

/**
 * Calculates line item totals and aggregate quote metrics
 */
export const calculateQuoteTotals = (lineItems = [], discountThreshold = DEFAULT_DISCOUNT_THRESHOLD) => {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    throw new AppError('Quotation must contain at least one line item', 400);
  }

  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let hasHighDiscount = false;

  const processedLineItems = lineItems.map((item) => {
    const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const discountPercent = Math.min(100, Math.max(0, Number(item.discountPercent) || 0));
    const taxPercent = Math.min(100, Math.max(0, Number(item.taxPercent) || 0));

    const rawTotal = unitPrice * quantity;
    const discountAmount = rawTotal * (discountPercent / 100);
    const discountedTotal = rawTotal - discountAmount;
    const taxAmount = discountedTotal * (taxPercent / 100);
    const itemTotal = Math.round((discountedTotal + taxAmount) * 100) / 100;

    subtotal += rawTotal;
    totalDiscount += discountAmount;
    totalTax += taxAmount;

    if (discountPercent > discountThreshold) {
      hasHighDiscount = true;
    }

    return {
      name: item.name.trim(),
      description: (item.description || '').trim(),
      unitPrice,
      quantity,
      discountPercent,
      taxPercent,
      itemTotal,
    };
  });

  subtotal = Math.round(subtotal * 100) / 100;
  totalDiscount = Math.round(totalDiscount * 100) / 100;
  totalTax = Math.round(totalTax * 100) / 100;
  const grandTotal = Math.round((subtotal - totalDiscount + totalTax) * 100) / 100;

  const overallDiscountPercent = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0;
  const requiresApproval = hasHighDiscount || overallDiscountPercent > discountThreshold;
  const approvalReason = requiresApproval
    ? `Overall discount of ${overallDiscountPercent.toFixed(1)}% exceeds auto-approval threshold of ${discountThreshold}%`
    : '';

  return {
    processedLineItems,
    subtotal,
    totalDiscount,
    totalTax,
    grandTotal,
    requiresApproval,
    approvalReason,
    overallDiscountPercent,
  };
};

/**
 * Generates an auto-incremented quote number (e.g., QT-2026-0001)
 */
export const generateQuoteNumber = async (tenantId) => {
  const year = new Date().getFullYear();

  let setting = await Setting.findOne({ tenantId });
  if (!setting) {
    setting = await Setting.create({ tenantId });
  }

  const prefix = setting.quotation?.prefix || 'QT';
  const nextNum = setting.quotation?.nextNumber || 1;

  // Increment setting nextNumber
  await Setting.updateOne(
    { tenantId },
    { $inc: { 'quotation.nextNumber': 1 } }
  );

  const formattedNum = String(nextNum).padStart(4, '0');
  let quoteNumber = `${prefix}-${year}-${formattedNum}`;

  // Ensure uniqueness
  const exists = await Quote.findOne({ tenantId, quoteNumber });
  if (exists) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    quoteNumber = `${prefix}-${year}-${formattedNum}-${randomSuffix}`;
  }

  return quoteNumber;
};

/**
 * Create a new quotation
 */
export const createQuote = async ({ tenantId, userId, userRole, data }) => {
  const {
    title,
    dealId,
    contactId,
    companyId,
    lineItems,
    terms,
    notes,
    validUntil,
    currency = 'USD',
  } = data;

  if (!title) {
    throw new AppError('Quotation title is required', 400);
  }

  // Fetch setting threshold if configured
  const setting = await Setting.findOne({ tenantId });
  const threshold = setting?.crm?.discountApprovalThreshold || DEFAULT_DISCOUNT_THRESHOLD;

  const calc = calculateQuoteTotals(lineItems, threshold);
  const quoteNumber = await generateQuoteNumber(tenantId);

  // Status calculation:
  // If high discount:
  // - Admin or Sales Manager can create directly as 'Approved' or 'Draft'
  // - Sales Executive must be 'Pending Approval'
  let initialStatus = 'Draft';
  if (calc.requiresApproval) {
    if (userRole === ROLES.ADMIN || userRole === ROLES.SALES_MANAGER) {
      initialStatus = data.status === 'Approved' ? 'Approved' : 'Draft';
    } else {
      initialStatus = 'Pending Approval';
    }
  } else if (data.status && ['Draft', 'Approved'].includes(data.status)) {
    initialStatus = data.status;
  }

  const quote = await Quote.create({
    tenantId,
    quoteNumber,
    title: title.trim(),
    dealId: dealId || null,
    contactId: contactId || null,
    companyId: companyId || null,
    ownerId: userId,
    lineItems: calc.processedLineItems,
    subtotal: calc.subtotal,
    totalDiscount: calc.totalDiscount,
    totalTax: calc.totalTax,
    grandTotal: calc.grandTotal,
    currency,
    status: initialStatus,
    approvalDetails: {
      requiresApproval: calc.requiresApproval,
      approvalReason: calc.approvalReason,
      approvedBy: initialStatus === 'Approved' ? userId : null,
      approvedAt: initialStatus === 'Approved' ? new Date() : null,
    },
    terms: terms || setting?.quotation?.defaultTerms || 'Payment due within 30 days of issue. All prices in USD.',
    notes: notes || '',
    validUntil: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  // Log Activity
  try {
    await Activity.create({
      tenantId,
      type: 'Note',
      title: `Quotation Created: ${quote.quoteNumber}`,
      description: `New quote '${quote.title}' generated for ${quote.currency} ${quote.grandTotal.toLocaleString()}.\nStatus: ${quote.status}`,
      status: 'Completed',
      priority: 'Low',
      dueDate: new Date(),
      completedAt: new Date(),
      assignedTo: userId,
      createdBy: userId,
      entityType: dealId ? 'Deal' : contactId ? 'Contact' : 'Company',
      entityId: dealId || contactId || companyId || quote._id,
      dealId: dealId || null,
      contactId: contactId || null,
      companyId: companyId || null,
    });
  } catch (err) {
    console.error('Failed to log activity for quote creation:', err.message);
  }

  return quote;
};

/**
 * Update an existing quotation
 */
export const updateQuote = async ({ tenantId, quoteId, userId, userRole, data }) => {
  const quote = await Quote.findOne({ _id: quoteId, tenantId });
  if (!quote) {
    throw new AppError('Quotation not found', 404);
  }

  if (quote.status === 'Accepted' && userRole !== ROLES.ADMIN) {
    throw new AppError('Accepted quotations cannot be edited', 400);
  }

  const setting = await Setting.findOne({ tenantId });
  const threshold = setting?.crm?.discountApprovalThreshold || DEFAULT_DISCOUNT_THRESHOLD;

  let calc = {
    processedLineItems: quote.lineItems,
    subtotal: quote.subtotal,
    totalDiscount: quote.totalDiscount,
    totalTax: quote.totalTax,
    grandTotal: quote.grandTotal,
    requiresApproval: quote.approvalDetails.requiresApproval,
    approvalReason: quote.approvalDetails.approvalReason,
  };

  if (data.lineItems && Array.isArray(data.lineItems)) {
    calc = calculateQuoteTotals(data.lineItems, threshold);
    quote.lineItems = calc.processedLineItems;
    quote.subtotal = calc.subtotal;
    quote.totalDiscount = calc.totalDiscount;
    quote.totalTax = calc.totalTax;
    quote.grandTotal = calc.grandTotal;
    quote.approvalDetails.requiresApproval = calc.requiresApproval;
    quote.approvalDetails.approvalReason = calc.approvalReason;

    // If discount changed to require approval and user is not manager, transition to Pending Approval
    if (calc.requiresApproval) {
      if (userRole !== ROLES.ADMIN && userRole !== ROLES.SALES_MANAGER) {
        quote.status = 'Pending Approval';
        quote.approvalDetails.approvedBy = null;
        quote.approvalDetails.approvedAt = null;
      }
    }
  }

  if (data.title) quote.title = data.title.trim();
  if (data.dealId !== undefined) quote.dealId = data.dealId || null;
  if (data.contactId !== undefined) quote.contactId = data.contactId || null;
  if (data.companyId !== undefined) quote.companyId = data.companyId || null;
  if (data.terms !== undefined) quote.terms = data.terms;
  if (data.notes !== undefined) quote.notes = data.notes;
  if (data.validUntil) quote.validUntil = data.validUntil;
  if (data.currency) quote.currency = data.currency;

  quote.version = (quote.version || 1) + 1;
  await quote.save();

  return quote;
};

/**
 * Approve quotation (Managers & Admins only)
 */
export const approveQuote = async ({ tenantId, quoteId, managerUserId, managerRole }) => {
  if (managerRole !== ROLES.ADMIN && managerRole !== ROLES.SALES_MANAGER) {
    throw new AppError('Only Sales Managers and Administrators have permission to approve quotations', 403);
  }

  const quote = await Quote.findOne({ _id: quoteId, tenantId });
  if (!quote) throw new AppError('Quotation not found', 404);

  quote.status = 'Approved';
  quote.approvalDetails.approvedBy = managerUserId;
  quote.approvalDetails.approvedAt = new Date();
  quote.approvalDetails.rejectedBy = null;
  quote.approvalDetails.rejectedAt = null;
  quote.approvalDetails.rejectionReason = '';

  await quote.save();

  // Activity log
  try {
    await Activity.create({
      tenantId,
      type: 'Note',
      title: `Quotation Approved: ${quote.quoteNumber}`,
      description: `Quotation '${quote.title}' was approved by manager for release.`,
      status: 'Completed',
      priority: 'Medium',
      dueDate: new Date(),
      completedAt: new Date(),
      assignedTo: quote.ownerId,
      createdBy: managerUserId,
      entityType: quote.dealId ? 'Deal' : quote.contactId ? 'Contact' : 'Company',
      entityId: quote.dealId || quote.contactId || quote.companyId || quote._id,
      dealId: quote.dealId || null,
      contactId: quote.contactId || null,
      companyId: quote.companyId || null,
    });
  } catch (err) {
    console.error('Failed to log approval activity:', err.message);
  }

  if (quote.ownerId) {
    createNotification({
      tenantId,
      userId: quote.ownerId,
      title: 'Quotation Approved',
      message: `Quote #${quote.quoteNumber} (${quote.title}) was approved by sales management.`,
      type: 'quote',
      link: '/quotes',
    }).catch(() => {});
  }

  return quote;
};

/**
 * Reject quotation with reason (Managers & Admins only)
 */
export const rejectQuote = async ({ tenantId, quoteId, managerUserId, managerRole, reason }) => {
  if (managerRole !== ROLES.ADMIN && managerRole !== ROLES.SALES_MANAGER) {
    throw new AppError('Only Sales Managers and Administrators have permission to reject quotations', 403);
  }

  if (!reason || !reason.trim()) {
    throw new AppError('A rejection reason must be provided', 400);
  }

  const quote = await Quote.findOne({ _id: quoteId, tenantId });
  if (!quote) throw new AppError('Quotation not found', 404);

  quote.status = 'Rejected';
  quote.approvalDetails.rejectedBy = managerUserId;
  quote.approvalDetails.rejectedAt = new Date();
  quote.approvalDetails.rejectionReason = reason.trim();

  await quote.save();

  if (quote.ownerId) {
    createNotification({
      tenantId,
      userId: quote.ownerId,
      title: 'Quotation Needs Revision',
      message: `Quote #${quote.quoteNumber} was rejected: "${reason.trim()}"`,
      type: 'quote',
      link: '/quotes',
    }).catch(() => {});
  }

  // Activity log
  try {
    await Activity.create({
      tenantId,
      type: 'Note',
      title: `Quotation Rejected: ${quote.quoteNumber}`,
      description: `Quotation '${quote.title}' was rejected by manager.\nReason: ${reason.trim()}`,
      status: 'Completed',
      priority: 'High',
      dueDate: new Date(),
      completedAt: new Date(),
      assignedTo: quote.ownerId,
      createdBy: managerUserId,
      entityType: quote.dealId ? 'Deal' : quote.contactId ? 'Contact' : 'Company',
      entityId: quote.dealId || quote.contactId || quote.companyId || quote._id,
      dealId: quote.dealId || null,
      contactId: quote.contactId || null,
      companyId: quote.companyId || null,
    });
  } catch (err) {
    console.error('Failed to log rejection activity:', err.message);
  }

  return quote;
};

/**
 * Mark quotation as Sent
 */
export const markQuoteSent = async ({ tenantId, quoteId, userId }) => {
  const quote = await Quote.findOne({ _id: quoteId, tenantId });
  if (!quote) throw new AppError('Quotation not found', 404);

  if (quote.status === 'Pending Approval') {
    throw new AppError('Quotation cannot be sent while pending manager approval', 400);
  }

  quote.status = 'Sent';
  quote.sentAt = new Date();
  await quote.save();

  return quote;
};

/**
 * Mark quotation as Accepted (Customer Accepted)
 */
export const acceptQuote = async ({ tenantId, quoteId, userId, syncDeal = true }) => {
  const quote = await Quote.findOne({ _id: quoteId, tenantId });
  if (!quote) throw new AppError('Quotation not found', 404);

  quote.status = 'Accepted';
  quote.acceptedAt = new Date();
  await quote.save();

  // Sync with Deal value if linked
  if (syncDeal && quote.dealId) {
    try {
      await Deal.updateOne(
        { _id: quote.dealId, tenantId },
        { $set: { value: quote.grandTotal } }
      );
    } catch (err) {
      console.error('Failed to sync deal value on quote acceptance:', err.message);
    }
  }

  // Activity log
  try {
    await Activity.create({
      tenantId,
      type: 'Note',
      title: `🎉 Quotation Accepted: ${quote.quoteNumber}`,
      description: `Customer officially accepted quotation '${quote.title}' for ${quote.currency} ${quote.grandTotal.toLocaleString()}.${syncDeal && quote.dealId ? ' Opportunity value was updated.' : ''}`,
      status: 'Completed',
      priority: 'High',
      dueDate: new Date(),
      completedAt: new Date(),
      assignedTo: userId,
      createdBy: userId,
      entityType: quote.dealId ? 'Deal' : quote.contactId ? 'Contact' : 'Company',
      entityId: quote.dealId || quote.contactId || quote.companyId || quote._id,
      dealId: quote.dealId || null,
      contactId: quote.contactId || null,
      companyId: quote.companyId || null,
    });
  } catch (err) {
    console.error('Failed to log accepted activity:', err.message);
  }

  return quote;
};

/**
 * Mark quotation as Declined
 */
export const declineQuote = async ({ tenantId, quoteId, userId, reason = '' }) => {
  const quote = await Quote.findOne({ _id: quoteId, tenantId });
  if (!quote) throw new AppError('Quotation not found', 404);

  quote.status = 'Declined';
  quote.declinedAt = new Date();
  quote.declineReason = reason.trim();
  await quote.save();

  return quote;
};

/**
 * Get single quotation with populated relations
 */
export const getQuoteById = async ({ tenantId, quoteId }) => {
  const quote = await Quote.findOne({ _id: quoteId, tenantId })
    .populate('dealId', 'title value stageId pipelineId status')
    .populate('contactId', 'firstName lastName email phone jobTitle')
    .populate('companyId', 'name industry website phone address')
    .populate('ownerId', 'firstName lastName email role')
    .populate('approvalDetails.approvedBy', 'firstName lastName email role')
    .populate('approvalDetails.rejectedBy', 'firstName lastName email role');

  if (!quote) throw new AppError('Quotation not found', 404);
  return quote;
};

/**
 * Get quotations with filtering and pagination
 */
export const getQuotes = async ({ tenantId, query = {} }) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = { tenantId };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.dealId) {
    filter.dealId = query.dealId;
  }

  if (query.contactId) {
    filter.contactId = query.contactId;
  }

  if (query.companyId) {
    filter.companyId = query.companyId;
  }

  if (query.ownerId) {
    filter.ownerId = query.ownerId;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [
      { quoteNumber: searchRegex },
      { title: searchRegex },
    ];
  }

  const [quotes, total] = await Promise.all([
    Quote.find(filter)
      .populate('dealId', 'title value status')
      .populate('contactId', 'firstName lastName email')
      .populate('companyId', 'name')
      .populate('ownerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Quote.countDocuments(filter),
  ]);

  return {
    quotes,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Delete quotation
 */
export const deleteQuote = async ({ tenantId, quoteId }) => {
  const quote = await Quote.findOneAndDelete({ _id: quoteId, tenantId });
  if (!quote) throw new AppError('Quotation not found', 404);
  return quote;
};

/**
 * Aggregate quotation statistics for dashboard and quotes hub
 */
export const getQuoteStats = async (tenantId) => {
  const stats = await Quote.aggregate([
    { $match: { tenantId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$grandTotal' },
      },
    },
  ]);

  const defaultStats = {
    totalQuotes: 0,
    totalQuotedAmount: 0,
    pendingApprovalCount: 0,
    pendingApprovalAmount: 0,
    approvedCount: 0,
    approvedAmount: 0,
    acceptedCount: 0,
    acceptedAmount: 0,
    draftCount: 0,
    draftAmount: 0,
  };

  stats.forEach((item) => {
    defaultStats.totalQuotes += item.count;
    defaultStats.totalQuotedAmount += item.totalAmount;

    if (item._id === 'Pending Approval') {
      defaultStats.pendingApprovalCount = item.count;
      defaultStats.pendingApprovalAmount = item.totalAmount;
    } else if (item._id === 'Approved') {
      defaultStats.approvedCount = item.count;
      defaultStats.approvedAmount = item.totalAmount;
    } else if (item._id === 'Accepted') {
      defaultStats.acceptedCount = item.count;
      defaultStats.acceptedAmount = item.totalAmount;
    } else if (item._id === 'Draft') {
      defaultStats.draftCount = item.count;
      defaultStats.draftAmount = item.totalAmount;
    }
  });

  return defaultStats;
};
