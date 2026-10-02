import {
  createQuote,
  getQuotes,
  getQuoteById,
  updateQuote,
  deleteQuote,
  approveQuote,
  rejectQuote,
  markQuoteSent,
  acceptQuote,
  declineQuote,
  getQuoteStats,
} from '../services/quoteService.js';
import { generateQuotePdfStream } from '../services/pdfService.js';
import { Setting } from '../models/Setting.js';
import { sendDirectEmail } from '../services/emailService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const createQuotation = async (req, res, next) => {
  try {
    const quote = await createQuote({
      tenantId: req.tenantId,
      userId: req.user._id,
      userRole: req.user.role,
      data: req.body,
    });
    return sendSuccess(res, 'Quotation created successfully', quote, 201);
  } catch (err) {
    return next(err);
  }
};

export const getQuotations = async (req, res, next) => {
  try {
    const result = await getQuotes({
      tenantId: req.tenantId,
      query: req.query,
    });
    return sendSuccess(res, 'Quotations retrieved successfully', result);
  } catch (err) {
    return next(err);
  }
};

export const getQuotationById = async (req, res, next) => {
  try {
    const quote = await getQuoteById({
      tenantId: req.tenantId,
      quoteId: req.params.id,
    });
    return sendSuccess(res, 'Quotation details retrieved', quote);
  } catch (err) {
    return next(err);
  }
};

export const updateQuotation = async (req, res, next) => {
  try {
    const quote = await updateQuote({
      tenantId: req.tenantId,
      quoteId: req.params.id,
      userId: req.user._id,
      userRole: req.user.role,
      data: req.body,
    });
    return sendSuccess(res, 'Quotation updated successfully', quote);
  } catch (err) {
    return next(err);
  }
};

export const deleteQuotation = async (req, res, next) => {
  try {
    await deleteQuote({
      tenantId: req.tenantId,
      quoteId: req.params.id,
    });
    return sendSuccess(res, 'Quotation deleted successfully', null);
  } catch (err) {
    return next(err);
  }
};

export const approveQuotation = async (req, res, next) => {
  try {
    const quote = await approveQuote({
      tenantId: req.tenantId,
      quoteId: req.params.id,
      managerUserId: req.user._id,
      managerRole: req.user.role,
    });
    return sendSuccess(res, 'Quotation approved successfully', quote);
  } catch (err) {
    return next(err);
  }
};

export const rejectQuotation = async (req, res, next) => {
  try {
    const quote = await rejectQuote({
      tenantId: req.tenantId,
      quoteId: req.params.id,
      managerUserId: req.user._id,
      managerRole: req.user.role,
      reason: req.body.reason,
    });
    return sendSuccess(res, 'Quotation rejected by manager', quote);
  } catch (err) {
    return next(err);
  }
};

export const sendQuotation = async (req, res, next) => {
  try {
    const quote = await markQuoteSent({
      tenantId: req.tenantId,
      quoteId: req.params.id,
      userId: req.user._id,
    });

    // If recipient email provided, dispatch email notification
    if (req.body.to) {
      try {
        const emailSubject = req.body.subject || `Quotation ${quote.quoteNumber}: ${quote.title}`;
        const emailBody = req.body.message || `
          <div style="font-family: sans-serif; color: #1e293b;">
            <h2>Quotation ${quote.quoteNumber}</h2>
            <p>Dear ${quote.contactId?.firstName || 'Client'},</p>
            <p>Please find details of your quotation for <strong>${quote.title}</strong>.</p>
            <p><strong>Grand Total:</strong> ${quote.currency} ${quote.grandTotal.toLocaleString()}</p>
            <p>This quotation is valid until <strong>${new Date(quote.validUntil).toLocaleDateString()}</strong>.</p>
            <p>Best regards,<br/>NexusCRM Sales Team</p>
          </div>
        `;

        await sendDirectEmail({
          tenantId: req.tenantId,
          userId: req.user._id,
          to: req.body.to,
          subject: emailSubject,
          bodyHtml: emailBody,
          entityType: 'Quote',
          entityId: quote._id,
        });
      } catch (emailErr) {
        console.error('Failed to dispatch quote email:', emailErr.message);
      }
    }

    return sendSuccess(res, 'Quotation marked as sent', quote);
  } catch (err) {
    return next(err);
  }
};

export const acceptQuotation = async (req, res, next) => {
  try {
    const quote = await acceptQuote({
      tenantId: req.tenantId,
      quoteId: req.params.id,
      userId: req.user._id,
      syncDeal: req.body.syncDeal !== false,
    });
    return sendSuccess(res, 'Quotation marked as accepted', quote);
  } catch (err) {
    return next(err);
  }
};

export const declineQuotation = async (req, res, next) => {
  try {
    const quote = await declineQuote({
      tenantId: req.tenantId,
      quoteId: req.params.id,
      userId: req.user._id,
      reason: req.body.reason,
    });
    return sendSuccess(res, 'Quotation marked as declined', quote);
  } catch (err) {
    return next(err);
  }
};

export const getQuotationStats = async (req, res, next) => {
  try {
    const stats = await getQuoteStats(req.tenantId);
    return sendSuccess(res, 'Quotation statistics retrieved', stats);
  } catch (err) {
    return next(err);
  }
};

export const streamQuotationPdf = async (req, res, next) => {
  try {
    const quote = await getQuoteById({
      tenantId: req.tenantId,
      quoteId: req.params.id,
    });

    const setting = await Setting.findOne({ tenantId: req.tenantId });
    const isDownload = req.query.download === 'true';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${isDownload ? 'attachment' : 'inline'}; filename="${quote.quoteNumber}.pdf"`
    );

    generateQuotePdfStream(quote, setting?.company || {}, res);
  } catch (err) {
    return next(err);
  }
};
