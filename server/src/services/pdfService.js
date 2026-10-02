import PDFDocument from 'pdfkit';

/**
 * Formats numbers into currency string: e.g. $1,250.00
 */
const formatCurrency = (amount = 0, currency = 'USD') => {
  const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  return `${symbol}${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Formats Date to readable string: e.g. Oct 14, 2026
 */
const formatDate = (date) => {
  if (!date) return '—';
  try {
    const d = new Date(date);
    return isNaN(d.getTime())
      ? '—'
      : d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
  } catch {
    return '—';
  }
};

/**
 * Generates and streams PDF document to a writable stream (such as Express res)
 */
export const generateQuotePdfStream = (quote, companyInfo = {}, outputStream) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `Quotation - ${quote.quoteNumber}`,
      Author: companyInfo.name || 'NexusCRM Enterprise',
      Subject: quote.title,
      Keywords: 'Quotation, CRM, Invoice, Estimate',
    },
  });

  if (outputStream) {
    doc.pipe(outputStream);
  }

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const contentWidth = pageWidth - 80; // 515.28

  // Helper: Draw Header Bar
  const drawHeader = () => {
    // Top Accent colored line
    doc
      .rect(40, 30, contentWidth, 4)
      .fill('#4338ca'); // Indigo 700

    // Left Company Info
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#1e1b4b') // Slate 900
      .text(companyInfo.name || 'NexusCRM Technologies Inc.', 40, 45);

    doc
      .fontSize(8.5)
      .font('Helvetica')
      .fillColor('#64748b') // Slate 500
      .text(companyInfo.street || '100 Innovation Way, Suite 400', 40, 65)
      .text(`${companyInfo.city || 'San Francisco'}, ${companyInfo.state || 'CA'} ${companyInfo.postalCode || '94105'}, ${companyInfo.country || 'USA'}`)
      .text(`Email: ${companyInfo.email || 'billing@nexuscrm.io'} | Phone: ${companyInfo.phone || '+1 (555) 234-5678'}`)
      .text(`Tax ID / EIN: ${companyInfo.taxId || 'US-987654321'}`);

    // Right: "QUOTATION" Title & Reference Meta
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#312e81') // Deep Indigo
      .text('QUOTATION', 350, 45, { align: 'right', width: contentWidth - 310 });

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#4f46e5') // Indigo 600
      .text(quote.quoteNumber, 350, 70, { align: 'right', width: contentWidth - 310 });

    doc
      .fontSize(8.5)
      .font('Helvetica')
      .fillColor('#475569')
      .text(`Date Issued: ${formatDate(quote.createdAt)}`, 350, 85, { align: 'right', width: contentWidth - 310 })
      .text(`Valid Until: ${formatDate(quote.validUntil)}`, 350, 98, { align: 'right', width: contentWidth - 310 });

    // Status Badge
    const status = quote.status || 'Draft';
    let statusBg = '#f1f5f9';
    let statusTextColor = '#475569';

    if (status === 'Approved') {
      statusBg = '#ecfdf5';
      statusTextColor = '#059669';
    } else if (status === 'Accepted') {
      statusBg = '#dcfce7';
      statusTextColor = '#15803d';
    } else if (status === 'Pending Approval') {
      statusBg = '#fffbeb';
      statusTextColor = '#d97706';
    } else if (status === 'Rejected' || status === 'Declined') {
      statusBg = '#fef2f2';
      statusTextColor = '#e11d48';
    }

    doc
      .roundedRect(pageWidth - 40 - 100, 114, 100, 16, 4)
      .fill(statusBg);

    doc
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .fillColor(statusTextColor)
      .text(status.toUpperCase(), pageWidth - 40 - 100, 118, { align: 'center', width: 100 });
  };

  drawHeader();

  // Divider Line
  doc
    .moveTo(40, 140)
    .lineTo(pageWidth - 40, 140)
    .lineWidth(0.5)
    .stroke('#e2e8f0');

  // Customer & Deal Information Block
  const customerY = 152;
  const boxWidth = (contentWidth - 15) / 2;

  // Box 1: Prepared For (Contact & Company)
  doc
    .roundedRect(40, customerY, boxWidth, 72, 6)
    .fillAndStroke('#f8fafc', '#e2e8f0');

  doc
    .fontSize(7.5)
    .font('Helvetica-Bold')
    .fillColor('#6366f1')
    .text('PREPARED FOR / CLIENT', 52, customerY + 8);

  const contactName = quote.contactId
    ? `${quote.contactId.firstName || ''} ${quote.contactId.lastName || ''}`.trim()
    : 'Valued Client';
  const companyName = quote.companyId?.name || (quote.contactId ? quote.contactId.jobTitle : '') || 'Enterprise Account';

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text(contactName, 52, customerY + 22);

  doc
    .fontSize(8.5)
    .font('Helvetica')
    .fillColor('#475569')
    .text(companyName, 52, customerY + 36)
    .text(`Email: ${quote.contactId?.email || 'client@example.com'}`, 52, customerY + 48)
    .text(`Phone: ${quote.contactId?.phone || '—'}`, 52, customerY + 60);

  // Box 2: Opportunity & Account Rep
  doc
    .roundedRect(40 + boxWidth + 15, customerY, boxWidth, 72, 6)
    .fillAndStroke('#f8fafc', '#e2e8f0');

  doc
    .fontSize(7.5)
    .font('Helvetica-Bold')
    .fillColor('#6366f1')
    .text('QUOTATION DETAILS', 40 + boxWidth + 27, customerY + 8);

  const ownerName = quote.ownerId
    ? `${quote.ownerId.firstName || ''} ${quote.ownerId.lastName || ''}`.trim()
    : 'Account Representative';

  doc
    .fontSize(9.5)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text(`Project: ${quote.title}`, 40 + boxWidth + 27, customerY + 22, { width: boxWidth - 24, ellipsis: true });

  doc
    .fontSize(8.5)
    .font('Helvetica')
    .fillColor('#475569')
    .text(`Deal / Opportunity: ${quote.dealId?.title || 'Direct Quotation'}`, 40 + boxWidth + 27, customerY + 36, { width: boxWidth - 24, ellipsis: true })
    .text(`Sales Rep: ${ownerName}`, 40 + boxWidth + 27, customerY + 48)
    .text(`Currency: ${quote.currency || 'USD'}`, 40 + boxWidth + 27, customerY + 60);

  // Line Items Table Header
  let tableY = 240;

  const drawTableHeader = (yPos) => {
    doc
      .roundedRect(40, yPos, contentWidth, 22, 4)
      .fill('#312e81'); // Deep Indigo

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
    doc.text('#', 48, yPos + 6, { width: 22 });
    doc.text('ITEM / SERVICE & DESCRIPTION', 72, yPos + 6, { width: 195 });
    doc.text('PRICE', 270, yPos + 6, { width: 60, align: 'right' });
    doc.text('QTY', 335, yPos + 6, { width: 35, align: 'center' });
    doc.text('DISC %', 375, yPos + 6, { width: 45, align: 'right' });
    doc.text('TAX %', 425, yPos + 6, { width: 40, align: 'right' });
    doc.text('TOTAL', 470, yPos + 6, { width: 75, align: 'right' });
  };

  drawTableHeader(tableY);
  tableY += 26;

  // Render Line Items
  const items = quote.lineItems || [];

  items.forEach((item, index) => {
    const hasDesc = Boolean(item.description && item.description.trim());
    const rowHeight = hasDesc ? 34 : 22;

    // Page overflow check
    if (tableY + rowHeight > 710) {
      doc.addPage();
      drawHeader();
      tableY = 150;
      drawTableHeader(tableY);
      tableY += 26;
    }

    // Alternating Row Background
    if (index % 2 === 1) {
      doc
        .rect(40, tableY - 2, contentWidth, rowHeight)
        .fill('#f8fafc');
    }

    // Row contents
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a');
    doc.text(String(index + 1), 48, tableY + 2, { width: 22 });
    doc.text(item.name, 72, tableY + 2, { width: 195, ellipsis: true });

    if (hasDesc) {
      doc.fontSize(7.5).font('Helvetica').fillColor('#64748b');
      doc.text(item.description, 72, tableY + 15, { width: 195, height: 16, ellipsis: true });
    }

    doc.fontSize(8.5).font('Helvetica').fillColor('#334155');
    doc.text(formatCurrency(item.unitPrice, quote.currency), 270, tableY + 2, { width: 60, align: 'right' });
    doc.text(String(item.quantity), 335, tableY + 2, { width: 35, align: 'center' });

    // Discount
    if (item.discountPercent > 0) {
      doc.fillColor('#e11d48').text(`${item.discountPercent}%`, 375, tableY + 2, { width: 45, align: 'right' });
    } else {
      doc.fillColor('#94a3b8').text('—', 375, tableY + 2, { width: 45, align: 'right' });
    }

    // Tax
    if (item.taxPercent > 0) {
      doc.fillColor('#475569').text(`${item.taxPercent}%`, 425, tableY + 2, { width: 40, align: 'right' });
    } else {
      doc.fillColor('#94a3b8').text('—', 425, tableY + 2, { width: 40, align: 'right' });
    }

    // Total
    doc.font('Helvetica-Bold').fillColor('#0f172a');
    doc.text(formatCurrency(item.itemTotal, quote.currency), 470, tableY + 2, { width: 75, align: 'right' });

    // Subtle bottom border
    doc
      .moveTo(40, tableY + rowHeight - 2)
      .lineTo(pageWidth - 40, tableY + rowHeight - 2)
      .lineWidth(0.5)
      .stroke('#f1f5f9');

    tableY += rowHeight;
  });

  // Check room for totals block
  if (tableY + 140 > 750) {
    doc.addPage();
    tableY = 50;
  }

  tableY += 15;

  // Left Column: Terms & Notes
  const termsWidth = 280;
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor('#4338ca')
    .text('TERMS & CONDITIONS', 40, tableY);

  doc
    .fontSize(7.5)
    .font('Helvetica')
    .fillColor('#64748b')
    .text(quote.terms || 'Payment due within 30 days. All deliveries subject to standard SLA.', 40, tableY + 12, {
      width: termsWidth,
      lineGap: 2,
    });

  if (quote.notes) {
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#4338ca')
      .text('SPECIAL NOTES / INSTRUCTIONS', 40, tableY + 55);

    doc
      .fontSize(7.5)
      .font('Helvetica')
      .fillColor('#64748b')
      .text(quote.notes, 40, tableY + 67, { width: termsWidth, lineGap: 2 });
  }

  // Right Column: Financial Summary Card
  const totalsX = 340;
  const totalsW = contentWidth - 300; // 215

  doc
    .roundedRect(totalsX, tableY, totalsW, 95, 6)
    .fillAndStroke('#f8fafc', '#e2e8f0');

  let rowY = tableY + 8;

  // Subtotal
  doc.fontSize(8.5).font('Helvetica').fillColor('#475569');
  doc.text('Subtotal:', totalsX + 12, rowY);
  doc.font('Helvetica-Bold').fillColor('#0f172a');
  doc.text(formatCurrency(quote.subtotal, quote.currency), totalsX + 80, rowY, { width: totalsW - 92, align: 'right' });
  rowY += 16;

  // Discount
  doc.font('Helvetica').fillColor('#475569');
  doc.text('Total Discount:', totalsX + 12, rowY);
  doc.font('Helvetica-Bold').fillColor(quote.totalDiscount > 0 ? '#e11d48' : '#64748b');
  doc.text(
    quote.totalDiscount > 0 ? `-${formatCurrency(quote.totalDiscount, quote.currency)}` : '$0.00',
    totalsX + 80,
    rowY,
    { width: totalsW - 92, align: 'right' }
  );
  rowY += 16;

  // Estimated Tax
  doc.font('Helvetica').fillColor('#475569');
  doc.text('Estimated Tax:', totalsX + 12, rowY);
  doc.font('Helvetica-Bold').fillColor('#0f172a');
  doc.text(formatCurrency(quote.totalTax, quote.currency), totalsX + 80, rowY, { width: totalsW - 92, align: 'right' });
  rowY += 18;

  // Divider
  doc
    .moveTo(totalsX + 10, rowY)
    .lineTo(totalsX + totalsW - 10, rowY)
    .lineWidth(0.75)
    .stroke('#cbd5e1');

  rowY += 8;

  // Grand Total Banner
  doc
    .roundedRect(totalsX + 8, rowY - 2, totalsW - 16, 24, 4)
    .fill('#312e81');

  doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
  doc.text('GRAND TOTAL:', totalsX + 16, rowY + 5);
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff');
  doc.text(formatCurrency(quote.grandTotal, quote.currency), totalsX + 90, rowY + 4, {
    width: totalsW - 110,
    align: 'right',
  });

  // Signatures Section at bottom
  const sigY = 730;

  // Rep Sign
  doc
    .moveTo(40, sigY)
    .lineTo(220, sigY)
    .lineWidth(0.5)
    .stroke('#94a3b8');

  doc
    .fontSize(7.5)
    .font('Helvetica')
    .fillColor('#64748b')
    .text('Authorized NexusCRM Representative', 40, sigY + 5)
    .text(`Date: ${formatDate(quote.approvalDetails?.approvedAt || quote.createdAt)}`, 40, sigY + 16);

  // Client Sign
  doc
    .moveTo(350, sigY)
    .lineTo(pageWidth - 40, sigY)
    .lineWidth(0.5)
    .stroke('#94a3b8');

  doc
    .fontSize(7.5)
    .font('Helvetica')
    .fillColor('#64748b')
    .text('Client Acceptance Signature & Printed Name', 350, sigY + 5)
    .text('Date: ________________________', 350, sigY + 16);

  // Footer Note
  doc
    .fontSize(7.5)
    .font('Helvetica')
    .fillColor('#94a3b8')
    .text(
      'Thank you for your business! This quotation is subject to company terms of service and acceptance before validity expiration.',
      40,
      pageHeight - 35,
      { align: 'center', width: contentWidth }
    );

  doc.end();
  return doc;
};

/**
 * Returns a Buffer containing the complete PDF document
 */
export const generateQuotePdfBuffer = (quote, companyInfo = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      generateQuotePdfStream(quote, companyInfo, doc);
    } catch (err) {
      reject(err);
    }
  });
};
