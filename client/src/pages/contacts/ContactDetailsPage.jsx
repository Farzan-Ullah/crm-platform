import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  Tag,
  GitMerge,
  Edit2,
  Trash2,
  DollarSign,
  Calendar,
  Save,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { contactsApi } from '../../api/contactsApi.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { ContactFormModal } from '../../components/forms/ContactFormModal.jsx';
import { ContactMergeModal } from '../../components/modals/ContactMergeModal.jsx';
import { SendEmailModal } from '../../components/forms/SendEmailModal.jsx';
import { ActivityTimeline } from '../../components/activities/ActivityTimeline.jsx';
import toast from 'react-hot-toast';

export const ContactDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contact, setContact] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  const fetchContactDetails = async () => {
    try {
      setIsLoading(true);
      const res = await contactsApi.getContact(id);
      if (res.success) {
        setContact(res.data);
        setNoteContent(res.data.notes || '');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch contact profile');
      navigate('/contacts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContactDetails();
  }, [id]);

  const handleSaveNotes = async () => {
    try {
      setIsSavingNote(true);
      await contactsApi.updateContact(id, { notes: noteContent });
      toast.success('Notes saved successfully');
      fetchContactDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to save notes');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      await contactsApi.deleteContact(id);
      toast.success('Contact deleted successfully');
      navigate('/contacts');
    } catch (err) {
      toast.error(err.message || 'Failed to delete contact');
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

  if (!contact) return null;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/contacts')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contacts Directory
        </button>
      </div>

      {/* Hero Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-extrabold shadow-md shrink-0">
            {contact.firstName?.[0]}{contact.lastName?.[0]}
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2.5 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {contact.firstName} {contact.lastName}
              </h1>
              {contact.companyId && (
                <Badge variant="primary" size="sm">
                  {contact.companyId.name}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {contact.jobTitle ? `${contact.jobTitle} • ` : ''}
              {contact.companyId ? (
                <Link
                  to={`/companies/${contact.companyId._id}`}
                  className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {contact.companyId.name}
                </Link>
              ) : (
                'Individual Client'
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={Mail}
            onClick={() => setIsEmailOpen(true)}
          >
            Send Email
          </Button>

          <Button
            size="sm"
            variant="secondary"
            icon={GitMerge}
            onClick={() => setIsMergeOpen(true)}
          >
            Merge
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

      {/* Main Grid: Details + Company / Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info Card */}
          <Card title="Contact Information" subtitle="Direct contact credentials & address">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div
                onClick={() => contact.email && setIsEmailOpen(true)}
                className={`flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 transition-colors ${
                  contact.email ? 'cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/30' : ''
                }`}
                title={contact.email ? 'Click to send email' : ''}
              >
                <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Email (Click to Send)</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {contact.email || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Primary Phone</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {contact.phone || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Alternate Phone</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {contact.alternatePhone || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Location</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {[contact.address?.city, contact.address?.state, contact.address?.country].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tags */}
            {contact.tags && contact.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {contact.tags.map((t, idx) => (
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

          {/* Associated Deals */}
          <Card
            title="Associated Deals & Opportunities"
            subtitle={`${contact.deals?.length || 0} commercial deal(s) linked to this contact`}
          >
            {contact.deals && contact.deals.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {contact.deals.map((deal) => (
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
                No deals currently associated with this contact.
              </div>
            )}
          </Card>

          {/* Notes Card */}
          <Card title="Internal Notes" subtitle="Context, communication notes, and reminders">
            <textarea
              rows={4}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Record notes on meetings, discussion topics, and next steps..."
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
            entityType="Contact"
            entityId={contact._id}
            entityName={`${contact.firstName} ${contact.lastName}`}
          />
        </div>

        {/* Right Col: Associated Company Profile & Owner */}
        <div className="space-y-6">
          {/* Company Card */}
          <Card title="Organization Account" subtitle="Parent enterprise record">
            {contact.companyId ? (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-bold text-slate-900 dark:text-white">{contact.companyId.name}</p>
                    <Badge variant="primary" size="sm">{contact.companyId.industry || 'Industry'}</Badge>
                  </div>
                  {contact.companyId.domain && (
                    <p className="text-slate-500">{contact.companyId.domain}</p>
                  )}
                  {contact.companyId.size && (
                    <p className="text-[11px] text-slate-400 mt-1">Size: {contact.companyId.size} employees</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate(`/companies/${contact.companyId._id}`)}
                >
                  View Company Profile
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                <Building2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p>Not linked to an organization.</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                  onClick={() => setIsEditOpen(true)}
                >
                  Link Company
                </Button>
              </div>
            )}
          </Card>

          {/* Account Owner Card */}
          <Card title="Contact Owner" subtitle="Assigned account executive">
            <div className="flex items-center gap-3 text-xs">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                {contact.ownerId?.firstName?.[0] || 'U'}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {contact.ownerId ? `${contact.ownerId.firstName} ${contact.ownerId.lastName}` : 'Unassigned'}
                </p>
                <p className="text-slate-400">{contact.ownerId?.email || 'Assign a sales rep'}</p>
              </div>
            </div>
          </Card>

          {/* System Metadata Card */}
          <Card title="Record Metadata" subtitle="System timestamps & tracking">
            <div className="space-y-2 text-[11px] text-slate-500">
              <div className="flex justify-between">
                <span>Created</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {new Date(contact.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {new Date(contact.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Contact ID</span>
                <span className="font-mono text-[10px] text-slate-400">{contact._id}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <ContactFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        initialData={contact}
        onSuccess={fetchContactDetails}
      />

      {/* Merge Modal */}
      <ContactMergeModal
        isOpen={isMergeOpen}
        onClose={() => setIsMergeOpen(false)}
        initialPrimary={contact}
        onSuccess={() => {
          fetchContactDetails();
        }}
      />

      {/* Send Direct Email Modal */}
      <SendEmailModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        defaultTo={contact.email || ''}
        entityType="Contact"
        entityId={contact._id}
        entityData={{
          firstName: contact.firstName,
          lastName: contact.lastName,
          company: contact.companyId?.name || '',
          jobTitle: contact.jobTitle || '',
        }}
        onSuccess={fetchContactDetails}
      />
    </div>
  );
};
