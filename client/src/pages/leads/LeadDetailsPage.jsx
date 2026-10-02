import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Briefcase,
  Flame,
  UserCheck,
  Edit,
  Trash2,
  Calendar,
  Tag,
  CheckCircle2,
  Clock,
  Sparkles,
  Save,
} from 'lucide-react';
import { leadsApi } from '../../api/leadsApi.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { LeadFormModal } from '../../components/forms/LeadFormModal.jsx';
import { LeadAssignModal } from '../../components/modals/LeadAssignModal.jsx';
import { LeadConversionModal } from '../../components/modals/LeadConversionModal.jsx';
import { SendEmailModal } from '../../components/forms/SendEmailModal.jsx';
import { ActivityTimeline } from '../../components/activities/ActivityTimeline.jsx';
import toast from 'react-hot-toast';

export const LeadDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  const fetchLeadDetails = async () => {
    try {
      setIsLoading(true);
      const res = await leadsApi.getLead(id);
      if (res.success) {
        setLead(res.data);
        setNoteContent(res.data.notes || '');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch lead profile');
      navigate('/leads');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const handleSaveNotes = async () => {
    try {
      setIsSavingNote(true);
      await leadsApi.updateLead(id, { notes: noteContent });
      toast.success('Notes saved successfully');
      fetchLeadDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to save notes');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await leadsApi.updateLead(id, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchLeadDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this lead?')) return;
    try {
      await leadsApi.deleteLead(id);
      toast.success('Lead deleted successfully');
      navigate('/leads');
    } catch (err) {
      toast.error(err.message || 'Failed to delete lead');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/leads')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads Directory
        </button>
      </div>

      {/* Lead Hero Profile Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-extrabold shadow-md shrink-0">
            {lead.firstName?.[0]}{lead.lastName?.[0]}
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2.5 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {lead.firstName} {lead.lastName}
              </h1>
              <Badge variant="primary" size="md">{lead.status}</Badge>
              <Badge variant="neutral" size="sm">Source: {lead.source}</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lead.jobTitle ? `${lead.jobTitle} at ` : ''}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {lead.company || 'Individual Client'}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {!lead.isConverted ? (
            <Button
              size="sm"
              variant="primary"
              icon={Sparkles}
              onClick={() => setIsConvertOpen(true)}
            >
              Convert to Account
            </Button>
          ) : (
            <Badge variant="success" size="md">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Converted
            </Badge>
          )}

          <select
            value={lead.status}
            disabled={lead.isConverted}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="New">Status: New</option>
            <option value="Contacted">Status: Contacted</option>
            <option value="Qualified">Status: Qualified</option>
            <option value="Unqualified">Status: Unqualified</option>
            <option value="Lost">Status: Lost</option>
            {lead.isConverted && <option value="Converted">Status: Converted</option>}
          </select>

          <Button
            size="sm"
            variant="secondary"
            icon={UserCheck}
            onClick={() => setIsAssignOpen(true)}
          >
            Assign
          </Button>

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
            icon={Edit}
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

      {/* Converted Success Banner if applicable */}
      {lead.isConverted && lead.conversionDetails && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-emerald-900 dark:text-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Prospect Converted to Account & Contact</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Converted on {new Date(lead.conversionDetails.convertedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lead.conversionDetails.contactId && (
              <Link
                to={`/contacts/${lead.conversionDetails.contactId}`}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
              >
                View Contact
              </Link>
            )}
            {lead.conversionDetails.companyId && (
              <Link
                to={`/companies/${lead.conversionDetails.companyId}`}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-semibold hover:bg-emerald-50 transition-colors"
              >
                View Company
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Details + Lead Scoring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Contact Info, Notes, Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Details Card */}
          <Card title="Prospect Information" subtitle="Direct contact credentials & corporate affiliations">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div
                onClick={() => lead.email && setIsEmailOpen(true)}
                className={`flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 transition-colors ${
                  lead.email ? 'cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/30' : ''
                }`}
                title={lead.email ? 'Click to send email' : ''}
              >
                <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Email Address (Click to Send)</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {lead.email || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Primary Phone</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {lead.phone || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                <Building className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Company Name</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {lead.company || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Job Title</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {lead.jobTitle || '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tags display */}
            {lead.tags && lead.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Tags:</span>
                {lead.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Notes Card */}
          <Card
            title="Discovery & Call Notes"
            subtitle="Internal context, qualification observations, and stakeholder feedback"
            actions={
              <Button
                size="xs"
                variant="primary"
                icon={Save}
                isLoading={isSavingNote}
                onClick={handleSaveNotes}
              >
                Save Notes
              </Button>
            }
          >
            <textarea
              rows={4}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Add discovery takeaways, budget constraints, decision makers..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </Card>

          {/* Activity & Timeline Feed */}
          <ActivityTimeline
            entityType="Lead"
            entityId={lead._id}
            entityName={`${lead.firstName} ${lead.lastName}`}
          />
        </div>

        {/* Right 1 Column: Lead Score & Ownership */}
        <div className="space-y-6">
          {/* Automated Score Breakdown */}
          <Card title="Lead Quality Score" subtitle="Algorithmic qualification evaluation">
            <div className="text-center py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-xl mb-3">
                <span className="text-3xl font-extrabold">{lead.score || 0}</span>
                <span className="text-xs font-semibold opacity-80">/100</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {lead.scoreCategory} Prospect
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Calculated by automated rule-based scoring engine
              </p>
            </div>

            {/* Score points breakdown */}
            <div className="pt-4 space-y-2.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Scoring Breakdown Criteria:
              </p>
              {lead.scoreBreakdown && lead.scoreBreakdown.length > 0 ? (
                lead.scoreBreakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-850"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {item.criterion}
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      +{item.points} pts
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No points accumulated yet.</p>
              )}
            </div>
          </Card>

          {/* Assigned Owner Card */}
          <Card title="Account Representative" subtitle="Sales executive managing this prospect">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
              {lead.ownerId ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center text-sm font-bold">
                    {lead.ownerId.firstName?.[0]}{lead.ownerId.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {lead.ownerId.firstName} {lead.ownerId.lastName}
                    </p>
                    <p className="text-[11px] text-slate-500">{lead.ownerId.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {lead.ownerId.role}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Unassigned Prospect</span>
              )}

              <Button
                size="xs"
                variant="outline"
                onClick={() => setIsAssignOpen(true)}
              >
                Reassign
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit & Assign Modals */}
      <LeadFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        initialData={lead}
        onSuccess={fetchLeadDetails}
      />

      <LeadAssignModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        leadIds={[lead._id]}
        onSuccess={fetchLeadDetails}
      />

      <LeadConversionModal
        isOpen={isConvertOpen}
        onClose={() => setIsConvertOpen(false)}
        lead={lead}
        onSuccess={fetchLeadDetails}
      />

      <SendEmailModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        defaultTo={lead.email || ''}
        entityType="Lead"
        entityId={lead._id}
        entityData={{
          firstName: lead.firstName,
          lastName: lead.lastName,
          company: lead.company,
          jobTitle: lead.jobTitle,
        }}
        onSuccess={fetchLeadDetails}
      />
    </div>
  );
};
