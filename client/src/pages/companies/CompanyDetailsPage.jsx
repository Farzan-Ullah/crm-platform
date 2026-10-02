import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Tag,
  Users,
  DollarSign,
  Edit2,
  Trash2,
  Plus,
  Save,
  ExternalLink,
} from 'lucide-react';
import { companiesApi } from '../../api/companiesApi.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { CompanyFormModal } from '../../components/forms/CompanyFormModal.jsx';
import { ContactFormModal } from '../../components/forms/ContactFormModal.jsx';
import { ActivityTimeline } from '../../components/activities/ActivityTimeline.jsx';
import toast from 'react-hot-toast';

export const CompanyDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  const fetchCompanyDetails = async () => {
    try {
      setIsLoading(true);
      const res = await companiesApi.getCompany(id);
      if (res.success) {
        setCompany(res.data);
        setNoteContent(res.data.notes || '');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch company profile');
      navigate('/companies');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyDetails();
  }, [id]);

  const handleSaveNotes = async () => {
    try {
      setIsSavingNote(true);
      await companiesApi.updateCompany(id, { notes: noteContent });
      toast.success('Notes saved successfully');
      fetchCompanyDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to save notes');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this company? Associated contacts will be unlinked.')) return;
    try {
      await companiesApi.deleteCompany(id);
      toast.success('Company deleted successfully');
      navigate('/companies');
    } catch (err) {
      toast.error(err.message || 'Failed to delete company');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/companies')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Companies Directory
        </button>
      </div>

      {/* Hero Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-extrabold shadow-md shrink-0">
            {company.name?.[0]}
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2.5 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {company.name}
              </h1>
              <Badge variant="primary" size="sm">{company.industry}</Badge>
              <Badge variant="neutral" size="sm">{company.size} employees</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              {company.domain && (
                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  {company.domain}
                </span>
              )}
              {company.website && (
                <a
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Visit Website
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            onClick={() => setIsAddContactOpen(true)}
          >
            Add Contact
          </Button>

          <Button
            size="sm"
            variant="secondary"
            icon={Edit2}
            onClick={() => setIsEditOpen(true)}
          >
            Edit
          </Button>

          <Button
            size="sm"
            variant="danger"
            icon={Trash2}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Grid: Details + Contacts + Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Profile info & Contacts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Details Card */}
          <Card title="Corporate Details" subtitle="Business information, addresses, and communications">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Corporate Domain</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {company.domain || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">HQ Phone</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {company.phone || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Corporate Email</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {company.email || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">HQ Address</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {[company.address?.street, company.address?.city, company.address?.state, company.address?.country]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tags */}
            {company.tags && company.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {company.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Associated Contacts List */}
          <Card
            title="Associated Contacts"
            subtitle={`${company.contacts?.length || 0} person(s) registered under this account`}
            action={
              <Button
                size="sm"
                variant="secondary"
                icon={Plus}
                onClick={() => setIsAddContactOpen(true)}
              >
                Add Person
              </Button>
            }
          >
            {company.contacts && company.contacts.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {company.contacts.map((contact) => (
                  <div
                    key={contact._id}
                    onClick={() => navigate(`/contacts/${contact._id}`)}
                    className="py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 p-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                        {contact.firstName?.[0]}{contact.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-xs">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {contact.jobTitle || 'No title'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>{contact.email || '—'}</p>
                      <p className="text-[11px]">{contact.phone || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No contacts currently associated with this company.
              </div>
            )}
          </Card>

          {/* Associated Deals */}
          <Card
            title="Associated Deals & Opportunities"
            subtitle={`${company.deals?.length || 0} commercial deal(s) active on this account`}
          >
            {company.deals && company.deals.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {company.deals.map((deal) => (
                  <div key={deal._id} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{deal.title}</p>
                      <div className="flex items-center gap-3 text-slate-500 mt-0.5">
                        <span>Stage: <strong>{deal.stageName || deal.stage || 'In Pipeline'}</strong></span>
                        {deal.expectedCloseDate && (
                          <span>Target: {new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        ${(deal.value || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No deals currently associated with this company account.
              </div>
            )}
          </Card>

          {/* Notes Card */}
          <Card title="Internal Account Notes" subtitle="Context, communication notes, and reminders">
            <textarea
              rows={4}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Record notes on company strategy, negotiation terms, and stakeholder feedback..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                variant="primary"
                icon={Save}
                isLoading={isSavingNote}
                onClick={handleSaveNotes}
              >
                Save Notes
              </Button>
            </div>
          </Card>

          {/* Activity & Timeline Feed */}
          <ActivityTimeline
            entityType="Company"
            entityId={company._id}
            entityName={company.name}
          />
        </div>

        {/* Right Col: Account Owner & System Details */}
        <div className="space-y-6">
          {/* Account Owner Card */}
          <Card title="Account Executive" subtitle="Designated owner for this enterprise">
            <div className="flex items-center gap-3 text-xs">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                {company.ownerId?.firstName?.[0] || 'U'}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {company.ownerId ? `${company.ownerId.firstName} ${company.ownerId.lastName}` : 'Unassigned'}
                </p>
                <p className="text-slate-400">{company.ownerId?.email || 'Assign an account owner'}</p>
              </div>
            </div>
          </Card>

          {/* System Metadata Card */}
          <Card title="Account Metadata" subtitle="System timestamps & tracking">
            <div className="space-y-2 text-[11px] text-slate-500">
              <div className="flex justify-between">
                <span>Created</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {new Date(company.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {new Date(company.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Company ID</span>
                <span className="font-mono text-[10px] text-slate-400">{company._id}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Company Modal */}
      <CompanyFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        initialData={company}
        onSuccess={fetchCompanyDetails}
      />

      {/* Add Contact Modal with company pre-selected */}
      <ContactFormModal
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        initialData={{ companyId: company }}
        onSuccess={fetchCompanyDetails}
      />
    </div>
  );
};
