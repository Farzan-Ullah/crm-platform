import { Contact } from '../models/Contact.js';
import { Company } from '../models/Company.js';
import { Lead } from '../models/Lead.js';

export const detectDuplicates = async ({ tenantId, type, email, phone, domain, name, excludeId = null }) => {
  const duplicates = {
    contacts: [],
    companies: [],
    leads: [],
  };

  // 1. Check Contacts by email or phone
  if (['contact', 'lead', 'all'].includes(type)) {
    const contactOr = [];
    if (email && email.trim()) contactOr.push({ email: email.trim().toLowerCase() });
    if (phone && phone.trim()) contactOr.push({ phone: phone.trim() });

    if (contactOr.length > 0) {
      const contactQuery = { tenantId, $or: contactOr, mergedInto: null };
      if (excludeId && type === 'contact') contactQuery._id = { $ne: excludeId };
      duplicates.contacts = await Contact.find(contactQuery)
        .populate('companyId', 'name domain')
        .populate('ownerId', 'firstName lastName')
        .limit(5)
        .lean();
    }
  }

  // 2. Check Companies by domain or name
  if (['company', 'lead', 'all'].includes(type)) {
    const companyOr = [];
    if (domain && domain.trim()) companyOr.push({ domain: domain.trim().toLowerCase() });
    if (name && name.trim()) companyOr.push({ name: new RegExp(`^${name.trim()}$`, 'i') });

    if (companyOr.length > 0) {
      const companyQuery = { tenantId, $or: companyOr };
      if (excludeId && type === 'company') companyQuery._id = { $ne: excludeId };
      duplicates.companies = await Company.find(companyQuery)
        .populate('ownerId', 'firstName lastName')
        .limit(5)
        .lean();
    }
  }

  // 3. Check Leads by email or phone
  if (['lead', 'contact', 'all'].includes(type)) {
    const leadOr = [];
    if (email && email.trim()) leadOr.push({ email: email.trim().toLowerCase() });
    if (phone && phone.trim()) leadOr.push({ phone: phone.trim() });

    if (leadOr.length > 0) {
      const leadQuery = { tenantId, $or: leadOr, isConverted: false };
      if (excludeId && type === 'lead') leadQuery._id = { $ne: excludeId };
      duplicates.leads = await Lead.find(leadQuery)
        .populate('ownerId', 'firstName lastName')
        .limit(5)
        .lean();
    }
  }

  const hasDuplicates =
    duplicates.contacts.length > 0 ||
    duplicates.companies.length > 0 ||
    duplicates.leads.length > 0;

  return {
    hasDuplicates,
    duplicates,
  };
};
