import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { Lead } from '../models/Lead.js';
import { Contact } from '../models/Contact.js';
import { Company } from '../models/Company.js';
import { logAuditEvent } from './auditService.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../config/logger.js';

export const TARGET_FIELDS = {
  Lead: [
    { key: 'firstName', label: 'First Name', required: true },
    { key: 'lastName', label: 'Last Name', required: true },
    { key: 'email', label: 'Email', required: false },
    { key: 'phone', label: 'Phone', required: false },
    { key: 'company', label: 'Company Name', required: false },
    { key: 'jobTitle', label: 'Job Title', required: false },
    { key: 'source', label: 'Lead Source', required: false },
    { key: 'status', label: 'Lead Status', required: false },
  ],
  Contact: [
    { key: 'firstName', label: 'First Name', required: true },
    { key: 'lastName', label: 'Last Name', required: true },
    { key: 'email', label: 'Email', required: false },
    { key: 'phone', label: 'Phone', required: false },
    { key: 'jobTitle', label: 'Job Title', required: false },
    { key: 'companyName', label: 'Company Name', required: false },
    { key: 'city', label: 'City', required: false },
    { key: 'country', label: 'Country', required: false },
  ],
  Company: [
    { key: 'name', label: 'Company Name', required: true },
    { key: 'domain', label: 'Domain', required: false },
    { key: 'industry', label: 'Industry', required: false },
    { key: 'size', label: 'Company Size', required: false },
    { key: 'phone', label: 'Phone', required: false },
    { key: 'email', label: 'Email', required: false },
    { key: 'website', label: 'Website', required: false },
    { key: 'city', label: 'City', required: false },
    { key: 'country', label: 'Country', required: false },
  ],
};

const FIELD_SYNONYMS = {
  firstName: ['firstname', 'first_name', 'first name', 'fname', 'given name', 'forename'],
  lastName: ['lastname', 'last_name', 'last name', 'lname', 'surname', 'family name'],
  email: ['email', 'email address', 'e-mail', 'mail', 'work email'],
  phone: ['phone', 'phone number', 'mobile', 'cell', 'telephone', 'tel', 'contact number'],
  company: ['company', 'company name', 'org', 'organization', 'account', 'business'],
  companyName: ['company', 'company name', 'org', 'organization', 'account', 'business'],
  jobTitle: ['title', 'job title', 'designation', 'position', 'role', 'occupation'],
  source: ['source', 'lead source', 'channel', 'origin'],
  status: ['status', 'lead status', 'stage'],
  name: ['name', 'company name', 'company', 'organization name', 'account name'],
  domain: ['domain', 'company domain', 'website domain'],
  industry: ['industry', 'sector', 'vertical', 'business category'],
  size: ['size', 'employees', 'company size', 'headcount'],
  website: ['website', 'url', 'web', 'site'],
  city: ['city', 'town', 'municipality'],
  country: ['country', 'nation'],
};

export const parseFileBuffer = async (buffer, mimetype = '', filename = '') => {
  const isExcel =
    filename.endsWith('.xlsx') ||
    filename.endsWith('.xls') ||
    mimetype.includes('spreadsheet') ||
    mimetype.includes('excel');

  if (isExcel) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new AppError('The uploaded Excel workbook contains no worksheets', 400);
    }

    const rows = [];
    let headers = [];

    worksheet.eachRow((row, rowNumber) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      if (rowNumber === 1) {
        headers = values.map((val) => (val !== undefined && val !== null ? String(val).trim() : ''));
      } else {
        const rowObj = {};
        headers.forEach((header, index) => {
          if (header) {
            let cellVal = values[index];
            if (cellVal && typeof cellVal === 'object' && cellVal.text) {
              cellVal = cellVal.text;
            }
            rowObj[header] = cellVal !== undefined && cellVal !== null ? String(cellVal).trim() : '';
          }
        });
        // Check if row has any non-empty value
        if (Object.values(rowObj).some((v) => v !== '')) {
          rows.push(rowObj);
        }
      }
    });

    return { headers: headers.filter(Boolean), rows };
  }

  // Parse CSV via PapaParse
  const csvString = buffer.toString('utf-8');
  const parseResult = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });

  if (parseResult.errors && parseResult.errors.length > 0 && (!parseResult.data || parseResult.data.length === 0)) {
    throw new AppError(`CSV parsing error: ${parseResult.errors[0].message}`, 400);
  }

  const headers = parseResult.meta?.fields || [];
  const rows = parseResult.data || [];
  return { headers, rows };
};

export const getPreviewAndMappings = async (buffer, mimetype, filename, entity = 'Lead') => {
  if (!TARGET_FIELDS[entity]) {
    throw new AppError(`Unsupported import entity: ${entity}`, 400);
  }

  const { headers, rows } = await parseFileBuffer(buffer, mimetype, filename);

  if (headers.length === 0 || rows.length === 0) {
    throw new AppError('The uploaded file is empty or missing valid tabular rows', 400);
  }

  const targetFields = TARGET_FIELDS[entity];
  const suggestedMappings = {};

  headers.forEach((header) => {
    const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    let matchedField = '';

    for (const target of targetFields) {
      const key = target.key;
      const synonyms = FIELD_SYNONYMS[key] || [key.toLowerCase()];
      if (
        synonyms.some((syn) => {
          const normSyn = syn.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normalizedHeader === normSyn || normalizedHeader.includes(normSyn);
        })
      ) {
        matchedField = key;
        break;
      }
    }

    if (matchedField) {
      suggestedMappings[header] = matchedField;
    }
  });

  return {
    totalRows: rows.length,
    headers,
    previewRows: rows.slice(0, 10),
    suggestedMappings,
    targetFields,
  };
};

export const executeBulkImport = async ({
  tenantId,
  actorId,
  entity = 'Lead',
  buffer,
  mimetype,
  filename,
  mappings = {},
  duplicateStrategy = 'skip', // 'skip' | 'overwrite' | 'error'
  ip = '',
  userAgent = '',
}) => {
  if (!TARGET_FIELDS[entity]) {
    throw new AppError(`Unsupported import entity: ${entity}`, 400);
  }

  const { rows } = await parseFileBuffer(buffer, mimetype, filename);

  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2; // Row 1 is header, 1-indexed
    const rawRow = rows[i];
    const mapped = {};

    // Transform headers based on mappings
    Object.entries(mappings).forEach(([csvHeader, targetKey]) => {
      if (targetKey && rawRow[csvHeader] !== undefined) {
        mapped[targetKey] = String(rawRow[csvHeader]).trim();
      }
    });

    try {
      if (entity === 'Lead') {
        if (!mapped.firstName || !mapped.lastName) {
          throw new Error('Both First Name and Last Name are required');
        }

        let existing = null;
        if (mapped.email) {
          existing = await Lead.findOne({ tenantId, email: mapped.email.toLowerCase() });
        }

        if (existing) {
          if (duplicateStrategy === 'skip') {
            skippedCount++;
            continue;
          } else if (duplicateStrategy === 'error') {
            throw new Error(`Lead with email '${mapped.email}' already exists`);
          } else if (duplicateStrategy === 'overwrite') {
            Object.assign(existing, mapped);
            await existing.save();
            updatedCount++;
            continue;
          }
        }

        await Lead.create({
          tenantId,
          firstName: mapped.firstName,
          lastName: mapped.lastName,
          email: mapped.email || '',
          phone: mapped.phone || '',
          company: mapped.company || '',
          jobTitle: mapped.jobTitle || '',
          source: mapped.source || 'Website',
          status: mapped.status || 'New',
          createdBy: actorId,
        });
        importedCount++;
      } else if (entity === 'Contact') {
        if (!mapped.firstName || !mapped.lastName) {
          throw new Error('Both First Name and Last Name are required');
        }

        let existing = null;
        if (mapped.email) {
          existing = await Contact.findOne({ tenantId, email: mapped.email.toLowerCase() });
        }

        if (existing) {
          if (duplicateStrategy === 'skip') {
            skippedCount++;
            continue;
          } else if (duplicateStrategy === 'error') {
            throw new Error(`Contact with email '${mapped.email}' already exists`);
          } else if (duplicateStrategy === 'overwrite') {
            Object.assign(existing, mapped);
            await existing.save();
            updatedCount++;
            continue;
          }
        }

        let companyId = null;
        if (mapped.companyName) {
          let company = await Company.findOne({
            tenantId,
            name: { $regex: new RegExp(`^${mapped.companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          });
          if (!company) {
            company = await Company.create({
              tenantId,
              name: mapped.companyName,
              ownerId: actorId,
            });
          }
          companyId = company._id;
        }

        await Contact.create({
          tenantId,
          firstName: mapped.firstName,
          lastName: mapped.lastName,
          email: mapped.email || '',
          phone: mapped.phone || '',
          jobTitle: mapped.jobTitle || '',
          companyId,
          address: {
            city: mapped.city || '',
            country: mapped.country || '',
          },
          ownerId: actorId,
        });
        importedCount++;
      } else if (entity === 'Company') {
        if (!mapped.name) {
          throw new Error('Company Name is required');
        }

        const existing = await Company.findOne({
          tenantId,
          name: { $regex: new RegExp(`^${mapped.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        });

        if (existing) {
          if (duplicateStrategy === 'skip') {
            skippedCount++;
            continue;
          } else if (duplicateStrategy === 'error') {
            throw new Error(`Company with name '${mapped.name}' already exists`);
          } else if (duplicateStrategy === 'overwrite') {
            Object.assign(existing, mapped);
            await existing.save();
            updatedCount++;
            continue;
          }
        }

        await Company.create({
          tenantId,
          name: mapped.name,
          domain: mapped.domain || '',
          industry: mapped.industry || 'Technology',
          size: mapped.size || '11-50',
          phone: mapped.phone || '',
          email: mapped.email || '',
          website: mapped.website || '',
          address: {
            city: mapped.city || '',
            country: mapped.country || '',
          },
          ownerId: actorId,
        });
        importedCount++;
      }
    } catch (err) {
      failedCount++;
      errors.push({
        rowNumber,
        rowData: rawRow,
        error: err.message,
      });
    }
  }

  // Record audit log event for the bulk import
  await logAuditEvent({
    tenantId,
    actorId,
    action: 'IMPORT',
    entity,
    after: {
      totalRows: rows.length,
      importedCount,
      updatedCount,
      skippedCount,
      failedCount,
      duplicateStrategy,
    },
    ip,
    userAgent,
  });

  return {
    totalRows: rows.length,
    importedCount,
    updatedCount,
    skippedCount,
    failedCount,
    errors,
  };
};

export const generateTemplateCsv = (entity = 'Lead') => {
  const templates = {
    Lead: [
      {
        'First Name': 'Sarah',
        'Last Name': 'Connor',
        Email: 'sarah.connor@cyberdyne.com',
        Phone: '+1-555-0199',
        Company: 'Cyberdyne Systems',
        'Job Title': 'Operations Director',
        'Lead Source': 'Website',
        'Lead Status': 'Qualified',
      },
      {
        'First Name': 'Bruce',
        'Last Name': 'Wayne',
        Email: 'bruce@wayneenterprises.com',
        Phone: '+1-555-0144',
        Company: 'Wayne Enterprises',
        'Job Title': 'Chief Executive Officer',
        'Lead Source': 'Referral',
        'Lead Status': 'New',
      },
    ],
    Contact: [
      {
        'First Name': 'Tony',
        'Last Name': 'Stark',
        Email: 'tony@starkindustries.com',
        Phone: '+1-555-0101',
        'Job Title': 'Chief Technology Officer',
        'Company Name': 'Stark Industries',
        City: 'New York',
        Country: 'United States',
      },
    ],
    Company: [
      {
        'Company Name': 'Acme Global Corp',
        Domain: 'acmeglobal.com',
        Industry: 'Technology',
        'Company Size': '51-200',
        Phone: '+1-555-0188',
        Email: 'contact@acmeglobal.com',
        Website: 'https://acmeglobal.com',
        City: 'San Francisco',
        Country: 'United States',
      },
    ],
  };

  const data = templates[entity] || templates.Lead;
  return Papa.unparse(data);
};

export const generateErrorsCsv = (errors = []) => {
  const rows = errors.map((err) => ({
    RowNumber: err.rowNumber,
    ErrorMessage: err.error,
    RawRowData: JSON.stringify(err.rowData),
  }));

  return Papa.unparse(rows);
};
