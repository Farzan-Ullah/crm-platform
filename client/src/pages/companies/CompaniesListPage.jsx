import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  Plus,
  Filter,
  ExternalLink,
  Users,
  MapPin,
  Edit2,
  Trash2,
  Globe,
  Phone,
} from 'lucide-react';
import { companiesApi } from '../../api/companiesApi.js';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { CompanyFormModal } from '../../components/forms/CompanyFormModal.jsx';
import toast from 'react-hot-toast';

export const CompaniesListPage = () => {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  const fetchCompanies = async (page = 1) => {
    try {
      setIsLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        industry: selectedIndustry || undefined,
        size: selectedSize || undefined,
      };
      const res = await companiesApi.getCompanies(params);
      if (res.success) {
        setCompanies(res.data);
        if (res.meta) {
          setPagination(res.meta);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch companies');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies(1);
  }, [search, selectedIndustry, selectedSize]);

  const handleDelete = async (companyId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this company? Associated contacts will remain.')) return;
    try {
      await companiesApi.deleteCompany(companyId);
      toast.success('Company deleted successfully');
      fetchCompanies(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to delete company');
    }
  };

  const handleOpenEdit = (company, e) => {
    e.stopPropagation();
    setEditingCompany(company);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Companies Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise accounts, client organizations, and corporate hierarchies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setEditingCompany(null);
              setIsFormOpen(true);
            }}
          >
            Add Company
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search companies by name or corporate domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Industries</option>
            <option value="Technology">Technology</option>
            <option value="Financial Technology">Fintech</option>
            <option value="Healthcare & Biotech">Healthcare</option>
            <option value="Defense & Aerospace">Defense</option>
            <option value="Retail & Distribution">Retail</option>
            <option value="Manufacturing">Manufacturing</option>
          </select>

          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Sizes</option>
            <option value="1-10">1-10 emp</option>
            <option value="11-50">11-50 emp</option>
            <option value="51-200">51-200 emp</option>
            <option value="201-500">201-500 emp</option>
            <option value="500+">500+ enterprise</option>
          </select>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <EmptyState
            title="No companies found"
            description={search ? 'No companies match your search criteria.' : 'Your corporate directory is currently empty.'}
            actionLabel="Add First Company"
            onAction={() => {
              setEditingCompany(null);
              setIsFormOpen(true);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Industry & Size</th>
                  <th className="py-3 px-4">Contacts</th>
                  <th className="py-3 px-4">Account Owner</th>
                  <th className="py-3 px-4">Headquarters</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {companies.map((company) => (
                  <tr
                    key={company._id}
                    onClick={() => navigate(`/companies/${company._id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Name & Domain */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0">
                          {company.name?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {company.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            {company.domain ? (
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3 text-slate-400" />
                                {company.domain}
                              </span>
                            ) : (
                              <span>No domain</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Industry & Size */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="primary" size="sm">{company.industry}</Badge>
                        <Badge variant="neutral" size="sm">{company.size} emp</Badge>
                      </div>
                    </td>

                    {/* Contacts Count */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
                        <Users className="w-3.5 h-3.5" />
                        {company.contactCount ?? 0} {company.contactCount === 1 ? 'Contact' : 'Contacts'}
                      </span>
                    </td>

                    {/* Owner */}
                    <td className="py-3.5 px-4">
                      {company.ownerId ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {company.ownerId.firstName} {company.ownerId.lastName}
                        </span>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>

                    {/* Headquarters Location */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                      {[company.address?.city, company.address?.country].filter(Boolean).join(', ') || '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleOpenEdit(company, e)}
                          title="Edit company"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(company._id, e)}
                          title="Delete company"
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
              Showing {companies.length} of {pagination.total} companies
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchCompanies(pagination.page - 1)}
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
                onClick={() => fetchCompanies(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <CompanyFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingCompany}
        onSuccess={() => fetchCompanies(pagination.page)}
      />
    </div>
  );
};
