import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import { Input } from '../common/Input.jsx';
import { Button } from '../common/Button.jsx';
import { contactsApi } from '../../api/contactsApi.js';
import { companiesApi } from '../../api/companiesApi.js';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Building2,
  User,
  DollarSign,
  Briefcase,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LeadConversionModal = ({ isOpen, onClose, lead, onSuccess }) => {
  const navigate = useNavigate();

  const [existingCompanies, setExistingCompanies] = useState([]);
  const [existingContacts, setExistingContacts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [companyChoice, setCompanyChoice] = useState('new');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyDomain, setNewCompanyDomain] = useState('');

  const [contactChoice, setContactChoice] = useState('new');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [newContactFirstName, setNewContactFirstName] = useState('');
  const [newContactLastName, setNewContactLastName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactJobTitle, setNewContactJobTitle] = useState('');

  const [createDeal, setCreateDeal] = useState(true);
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState(10000);
  const [dealExpectedClose, setDealExpectedClose] = useState('');

  useEffect(() => {
    if (isOpen && lead) {
      // Default expected close: 30 days ahead
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      const closeDateStr = nextMonth.toISOString().split('T')[0];

      let emailDomain = '';
      if (lead.email && lead.email.includes('@')) {
        const parts = lead.email.split('@')[1];
        if (!['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(parts.toLowerCase())) {
          emailDomain = parts;
        }
      }

      setCompanyChoice(lead.company ? 'new' : 'existing');
      setSelectedCompanyId('');
      setNewCompanyName(lead.company || `${lead.lastName || lead.firstName} Account`);
      setNewCompanyDomain(emailDomain);

      setContactChoice('new');
      setSelectedContactId('');
      setNewContactFirstName(lead.firstName || '');
      setNewContactLastName(lead.lastName || '');
      setNewContactEmail(lead.email || '');
      setNewContactPhone(lead.phone || '');
      setNewContactJobTitle(lead.jobTitle || '');

      setCreateDeal(true);
      setDealTitle(`${lead.company || lead.firstName} - Initial Deal`);
      setDealValue(lead.estimatedValue || 15000);
      setDealExpectedClose(closeDateStr);

      // Load existing records for picker
      companiesApi.getCompanies({ limit: 100 }).then((res) => {
        if (res.success) setExistingCompanies(res.data);
      });
      contactsApi.getContacts({ limit: 100 }).then((res) => {
        if (res.success) setContacts(res.data);
      });
    }
  }, [isOpen, lead]);

  const setContacts = (data) => {
    setExistingContacts(data);
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    if (!lead) return;

    try {
      setIsSubmitting(true);

      const payload = {
        companyChoice,
        companyId: companyChoice === 'existing' ? selectedCompanyId : null,
        newCompanyName: companyChoice === 'new' ? newCompanyName : undefined,
        newCompanyDomain: companyChoice === 'new' ? newCompanyDomain : undefined,

        contactChoice,
        contactId: contactChoice === 'existing' ? selectedContactId : null,
        newContactFirstName: contactChoice === 'new' ? newContactFirstName : undefined,
        newContactLastName: contactChoice === 'new' ? newContactLastName : undefined,
        newContactEmail: contactChoice === 'new' ? newContactEmail : undefined,
        newContactPhone: contactChoice === 'new' ? newContactPhone : undefined,
        newContactJobTitle: contactChoice === 'new' ? newContactJobTitle : undefined,

        createDeal,
        dealTitle: createDeal ? dealTitle : undefined,
        dealValue: createDeal ? Number(dealValue) : 0,
        dealExpectedClose: createDeal ? dealExpectedClose : undefined,
      };

      const res = await contactsApi.convertLead(lead._id, payload);

      if (res.success) {
        toast.success('Lead converted to Account, Contact & Opportunity successfully!');
        onSuccess?.(res.data);
        onClose();
        // Redirect to new contact or company page
        if (res.data?.contactId) {
          navigate(`/contacts/${res.data.contactId}`);
        } else if (res.data?.companyId) {
          navigate(`/companies/${res.data.companyId}`);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to convert lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!lead) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Convert Lead to Account & Contact"
      subtitle={`Transform qualified prospect "${lead.firstName} ${lead.lastName}" into an active enterprise account.`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleConvert} className="space-y-5">
        {/* Step 1: Organization / Company */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                1. Company / Organization
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="compChoice"
                  checked={companyChoice === 'new'}
                  onChange={() => setCompanyChoice('new')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Create New</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="compChoice"
                  checked={companyChoice === 'existing'}
                  onChange={() => setCompanyChoice('existing')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Choose Existing</span>
              </label>
            </div>
          </div>

          {companyChoice === 'new' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Input
                label="Company Name"
                required
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Organization Name"
              />
              <Input
                label="Corporate Domain"
                value={newCompanyDomain}
                onChange={(e) => setNewCompanyDomain(e.target.value)}
                placeholder="domain.com"
              />
            </div>
          ) : (
            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Select Existing Company
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                required={companyChoice === 'existing'}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="">Choose an existing company account...</option>
                {existingCompanies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.domain ? `(${c.domain})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Step 2: Contact Person */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                2. Contact Person
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="contChoice"
                  checked={contactChoice === 'new'}
                  onChange={() => setContactChoice('new')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Create New</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="contChoice"
                  checked={contactChoice === 'existing'}
                  onChange={() => setContactChoice('existing')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Choose Existing</span>
              </label>
            </div>
          </div>

          {contactChoice === 'new' ? (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  required
                  value={newContactFirstName}
                  onChange={(e) => setNewContactFirstName(e.target.value)}
                />
                <Input
                  label="Last Name"
                  required
                  value={newContactLastName}
                  onChange={(e) => setNewContactLastName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Email"
                  type="email"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                />
                <Input
                  label="Phone"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                />
                <Input
                  label="Job Title"
                  value={newContactJobTitle}
                  onChange={(e) => setNewContactJobTitle(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Select Existing Contact
              </label>
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                required={contactChoice === 'existing'}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="">Choose an existing contact...</option>
                {existingContacts.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Step 3: Opportunity / Deal (Optional) */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                3. Create Opportunity / Deal
              </h3>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={createDeal}
                onChange={(e) => setCreateDeal(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Generate Deal Record</span>
            </label>
          </div>

          {createDeal && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Input
                label="Opportunity / Deal Title"
                required={createDeal}
                value={dealTitle}
                onChange={(e) => setDealTitle(e.target.value)}
                placeholder="Deal Name"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Estimated Value ($)"
                  type="number"
                  required={createDeal}
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                />
                <Input
                  label="Expected Close Date"
                  type="date"
                  value={dealExpectedClose}
                  onChange={(e) => setDealExpectedClose(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={Sparkles} isLoading={isSubmitting}>
            Convert & Finalize
          </Button>
        </div>
      </form>
    </Modal>
  );
};
