import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Building2,
  Mail,
  Phone,
  Search,
  Plus,
  GitMerge,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  Users,
} from 'lucide-react';
import { contactsApi } from '../../api/contactsApi.js';
import { companiesApi } from '../../api/companiesApi.js';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { ContactFormModal } from '../../components/forms/ContactFormModal.jsx';
import { ContactMergeModal } from '../../components/modals/ContactMergeModal.jsx';
import toast from 'react-hot-toast';

export const ContactsListPage = () => {
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [companiesList, setCompaniesList] = useState([]);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [mergePrimary, setMergePrimary] = useState(null);

  const fetchContacts = async (page = 1) => {
    try {
      setIsLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        companyId: selectedCompanyId || undefined,
      };
      const res = await contactsApi.getContacts(params);
      if (res.success) {
        setContacts(res.data);
        if (res.meta) {
          setPagination(res.meta);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch contacts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    companiesApi.getCompanies({ limit: 100, sortBy: 'name', sortOrder: 'asc' }).then((res) => {
      if (res.success) setCompaniesList(res.data);
    });
  }, []);

  useEffect(() => {
    fetchContacts(1);
  }, [search, selectedCompanyId]);

  const handleDelete = async (contactId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      await contactsApi.deleteContact(contactId);
      toast.success('Contact deleted successfully');
      fetchContacts(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to delete contact');
    }
  };

  const handleOpenEdit = (contact, e) => {
    e.stopPropagation();
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const handleOpenMerge = (contact, e) => {
    e.stopPropagation();
    setMergePrimary(contact);
    setIsMergeOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Contacts Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage individual stakeholders, account leads, and communication records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={GitMerge}
            onClick={() => {
              setMergePrimary(null);
              setIsMergeOpen(true);
            }}
          >
            Merge Contacts
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setEditingContact(null);
              setIsFormOpen(true);
            }}
          >
            Add Contact
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search contacts by name, email, phone, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Companies</option>
            {companiesList.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contacts Table View */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <EmptyState
            title="No contacts found"
            description={search ? 'No contacts match your query. Try resetting your search filter.' : 'Your contact directory is currently empty.'}
            actionLabel="Add First Contact"
            onAction={() => {
              setEditingContact(null);
              setIsFormOpen(true);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Account Owner</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {contacts.map((contact) => (
                  <tr
                    key={contact._id}
                    onClick={() => navigate(`/contacts/${contact._id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Name & Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0">
                          {contact.firstName?.[0]}{contact.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {contact.firstName} {contact.lastName}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {contact.jobTitle || 'No title specified'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="py-3.5 px-4">
                      {contact.companyId ? (
                        <div
                          className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 hover:text-indigo-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/companies/${contact.companyId._id || contact.companyId}`);
                          }}
                        >
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium truncate max-w-[160px]">
                            {contact.companyId.name || 'Organization Account'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Individual / Unlinked</span>
                      )}
                    </td>

                    {/* Contact Info */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        {contact.email ? (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{contact.email}</span>
                          </div>
                        ) : null}
                        {contact.phone ? (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{contact.phone}</span>
                          </div>
                        ) : null}
                        {!contact.email && !contact.phone && (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="py-3.5 px-4">
                      {contact.ownerId ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {contact.ownerId.firstName} {contact.ownerId.lastName}
                        </span>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleOpenMerge(contact, e)}
                          title="Merge with duplicate"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <GitMerge className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEdit(contact, e)}
                          title="Edit contact"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(contact._id, e)}
                          title="Delete contact"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {contacts.length} of {pagination.total} contacts
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchContacts(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchContacts(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ContactFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingContact}
        onSuccess={() => fetchContacts(pagination.page)}
      />

      <ContactMergeModal
        isOpen={isMergeOpen}
        onClose={() => setIsMergeOpen(false)}
        initialPrimary={mergePrimary}
        onSuccess={() => fetchContacts(pagination.page)}
      />
    </div>
  );
};
