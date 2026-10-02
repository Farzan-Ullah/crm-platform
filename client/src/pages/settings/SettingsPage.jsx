import React, { useEffect, useState } from 'react';
import {
  Building2,
  Globe2,
  Coins,
  Sliders,
  Mail,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Database,
  FileSpreadsheet,
  Download,
  Upload,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { settingsApi } from '../../api/settingsApi.js';
import { importExportApi } from '../../api/importExportApi.js';
import { BulkImportModal } from '../../components/modals/BulkImportModal.jsx';
import toast from 'react-hot-toast';

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('company'); // 'company' | 'localization' | 'sales' | 'smtp' | 'data'
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importEntity, setImportEntity] = useState('Lead');

  // Form State
  const [settings, setSettings] = useState({
    name: '',
    subdomain: '',
    company: {
      name: '',
      logo: '',
      website: '',
      phone: '',
      email: '',
      taxId: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',
      },
    },
    localization: {
      currency: 'USD',
      currencySymbol: '$',
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
    },
    sales: {
      defaultQuoteValidityDays: 30,
      defaultTaxRate: 10,
      leadStages: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'],
    },
    smtp: {
      enabled: false,
      host: '',
      port: 587,
      user: '',
      password: '',
      fromEmail: '',
      fromName: '',
      secure: false,
    },
  });

  const [newStageInput, setNewStageInput] = useState('');

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await settingsApi.getSettings();
      setSettings(data);
    } catch (err) {
      toast.error('Failed to load system settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await settingsApi.updateSettings({
        company: settings.company,
        localization: settings.localization,
        sales: settings.sales,
        smtp: settings.smtp,
      });
      setSettings(updated);
      toast.success('Organization settings updated successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    try {
      const result = await settingsApi.testSmtp(settings.smtp);
      toast.success(result.message || 'SMTP verified successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'SMTP test failed');
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleAddStage = () => {
    if (!newStageInput.trim()) return;
    if (settings.sales.leadStages.includes(newStageInput.trim())) {
      toast.error('Stage already exists');
      return;
    }
    setSettings({
      ...settings,
      sales: {
        ...settings.sales,
        leadStages: [...settings.sales.leadStages, newStageInput.trim()],
      },
    });
    setNewStageInput('');
  };

  const handleRemoveStage = (stageToRemove) => {
    if (settings.sales.leadStages.length <= 2) {
      toast.error('You must keep at least 2 pipeline stages');
      return;
    }
    setSettings({
      ...settings,
      sales: {
        ...settings.sales,
        leadStages: settings.sales.leadStages.filter((s) => s !== stageToRemove),
      },
    });
  };

  const handleExport = async (entity, format = 'csv') => {
    try {
      await importExportApi.exportData(entity, format);
      toast.success(`${entity} exported successfully`);
    } catch (err) {
      toast.error(`Failed to export ${entity}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
              System Administration
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            CRM Organization Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure tenant branding, financial defaults, sales stages, SMTP delivery, and data backups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettings}
            disabled={isSaving}
            className="text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            isLoading={isSaving}
            className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto text-xs font-semibold">
        {[
          { id: 'company', label: 'Company Profile', icon: Building2 },
          { id: 'localization', label: 'Currency & Timezone', icon: Coins },
          { id: 'sales', label: 'Sales & Pipeline Stages', icon: Sliders },
          { id: 'smtp', label: 'SMTP & Email Delivery', icon: Mail },
          { id: 'data', label: 'Data Import & Backups', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: COMPANY PROFILE */}
      {activeTab === 'company' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Organization Identity</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              These details will appear on generated PDF quotations, customer emails, and invoices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company Legal Name
              </label>
              <input
                type="text"
                value={settings.company.name}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company: { ...settings.company, name: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Organization Subdomain (Immutable)
              </label>
              <input
                type="text"
                value={settings.subdomain ? `${settings.subdomain}.nexuscrm.io` : 'acme.nexuscrm.io'}
                disabled
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 px-3 py-2 text-xs text-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company Website
              </label>
              <input
                type="url"
                placeholder="https://example.com"
                value={settings.company.website}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company: { ...settings.company, website: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary Phone Number
              </label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={settings.company.phone}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company: { ...settings.company, phone: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Billing / Contact Email
              </label>
              <input
                type="email"
                placeholder="billing@example.com"
                value={settings.company.email}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company: { ...settings.company, email: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tax Registration / VAT ID
              </label>
              <input
                type="text"
                placeholder="US-123456789"
                value={settings.company.taxId}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company: { ...settings.company, taxId: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Corporate Headquarters Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  placeholder="100 Silicon Blvd, Suite 400"
                  value={settings.company.address?.street || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: {
                        ...settings.company,
                        address: { ...settings.company.address, street: e.target.value },
                      },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  placeholder="San Francisco"
                  value={settings.company.address?.city || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: {
                        ...settings.company,
                        address: { ...settings.company.address, city: e.target.value },
                      },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  State / Province
                </label>
                <input
                  type="text"
                  placeholder="CA"
                  value={settings.company.address?.state || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: {
                        ...settings.company,
                        address: { ...settings.company.address, state: e.target.value },
                      },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  placeholder="94107"
                  value={settings.company.address?.postalCode || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: {
                        ...settings.company,
                        address: { ...settings.company.address, postalCode: e.target.value },
                      },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 2: LOCALIZATION & CURRENCY */}
      {activeTab === 'localization' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Localization & Currency</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Control the default currency, time formatting, and numerical presentation across your CRM.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary Currency
              </label>
              <select
                value={settings.localization.currency}
                onChange={(e) => {
                  const val = e.target.value;
                  const symbols = {
                    USD: '$',
                    EUR: '€',
                    GBP: '£',
                    CAD: '$',
                    AUD: '$',
                    INR: '₹',
                    JPY: '¥',
                  };
                  setSettings({
                    ...settings,
                    localization: {
                      ...settings.localization,
                      currency: val,
                      currencySymbol: symbols[val] || '$',
                    },
                  });
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
                <option value="CAD">CAD - Canadian Dollar ($)</option>
                <option value="AUD">AUD - Australian Dollar ($)</option>
                <option value="INR">INR - Indian Rupee (₹)</option>
                <option value="JPY">JPY - Japanese Yen (¥)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Organization Timezone
              </label>
              <select
                value={settings.localization.timezone}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    localization: { ...settings.localization, timezone: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America/New_York (Eastern Time)</option>
                <option value="America/Chicago">America/Chicago (Central Time)</option>
                <option value="America/Denver">America/Denver (Mountain Time)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (Pacific Time)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Europe/Paris">Europe/Paris (CET)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date Presentation Format
              </label>
              <select
                value={settings.localization.dateFormat}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    localization: { ...settings.localization, dateFormat: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="YYYY-MM-DD">ISO Standard (YYYY-MM-DD)</option>
                <option value="MM/DD/YYYY">US Standard (MM/DD/YYYY)</option>
                <option value="DD/MM/YYYY">International (DD/MM/YYYY)</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 3: SALES & STAGES */}
      {activeTab === 'sales' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Sales & Commercial Rules</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure default quotation expiration windows, tax calculations, and customizable lead lifecycle stages.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Quotation Validity (Days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.sales.defaultQuoteValidityDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sales: {
                      ...settings.sales,
                      defaultQuoteValidityDays: parseInt(e.target.value, 10) || 30,
                    },
                  })
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Value Added Tax / GST Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.sales.defaultTaxRate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sales: {
                      ...settings.sales,
                      defaultTaxRate: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Custom Lead Pipeline Stages
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Stages representing progression in your qualification workflow.
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {settings.sales.leadStages.map((stg) => (
                <div
                  key={stg}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                >
                  <span>{stg}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStage(stg)}
                    className="p-0.5 rounded text-slate-400 hover:text-rose-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Add custom stage (e.g. In Review)..."
                value={newStageInput}
                onChange={(e) => setNewStageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStage())}
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <Button variant="outline" size="sm" onClick={handleAddStage} className="text-xs">
                Add Stage
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 4: SMTP & EMAIL DELIVERY */}
      {activeTab === 'smtp' && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Custom SMTP Server</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Route system emails and marketing campaigns through your own corporate mail server.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smtp.enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    smtp: { ...settings.smtp, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Enable Custom SMTP
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                SMTP Server Host
              </label>
              <input
                type="text"
                placeholder="smtp.office365.com or smtp.mailgun.org"
                value={settings.smtp.host}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    smtp: { ...settings.smtp, host: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Port
              </label>
              <input
                type="number"
                placeholder="587 or 465"
                value={settings.smtp.port}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    smtp: { ...settings.smtp, port: parseInt(e.target.value, 10) || 587 },
                  })
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                SMTP Username
              </label>
              <input
                type="text"
                placeholder="apikey or user@company.com"
                value={settings.smtp.user}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    smtp: { ...settings.smtp, user: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                SMTP Password / API Key
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={settings.smtp.password}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      smtp: { ...settings.smtp, password: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-3 pr-9 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                From Email Address
              </label>
              <input
                type="email"
                placeholder="notifications@company.com"
                value={settings.smtp.fromEmail}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    smtp: { ...settings.smtp, fromEmail: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                From Display Name
              </label>
              <input
                type="text"
                placeholder="NexusCRM Support"
                value={settings.smtp.fromName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    smtp: { ...settings.smtp, fromName: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={settings.smtp.secure}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    smtp: { ...settings.smtp, secure: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700 dark:text-slate-300 font-semibold">
                Use Secure SSL / TLS Handshake (Port 465)
              </span>
            </label>

            <Button
              variant="outline"
              size="sm"
              onClick={handleTestSmtp}
              disabled={isTestingSmtp || !settings.smtp.host}
              isLoading={isTestingSmtp}
              className="text-xs gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
            >
              <Send className="w-3.5 h-3.5" />
              Test SMTP Connection
            </Button>
          </div>
        </Card>
      )}

      {/* TAB 5: DATA IMPORT & EXPORTS */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* Bulk Ingest Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-500" />
                  Bulk Data Import
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Import high-volume records from external spreadsheets (.CSV or .XLSX) with automatic column mapping.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { ent: 'Lead', label: 'Import Leads', desc: 'Import prospects with contact details & source' },
                { ent: 'Contact', label: 'Import Contacts', desc: 'Import customer contacts with company linkage' },
                { ent: 'Company', label: 'Import Companies', desc: 'Import corporate accounts and domains' },
              ].map((item) => (
                <div
                  key={item.ent}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</h3>
                    <p className="text-[11px] text-slate-500 mt-1">{item.desc}</p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setImportEntity(item.ent);
                      setIsImportModalOpen(true);
                    }}
                    className="mt-3 text-xs gap-1.5 w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Launch {item.ent} Wizard
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Data Export Center */}
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-500" />
                Data Export & Backups
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Download your organization records on demand in CSV or Microsoft Excel (.XLSX) format.
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {[
                { name: 'Leads & Prospects', entity: 'leads' },
                { name: 'Contacts Database', entity: 'contacts' },
                { name: 'Companies & Accounts', entity: 'companies' },
                { name: 'Deals & Revenue Pipeline', entity: 'deals' },
                { name: 'Quotations & Invoices', entity: 'quotes' },
              ].map((item) => (
                <div key={item.entity} className="py-3 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(item.entity, 'csv')}
                      className="text-xs gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(item.entity, 'xlsx')}
                      className="text-xs gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Excel (.xlsx)
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Bulk Import Wizard Modal */}
      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        defaultEntity={importEntity}
        onSuccess={() => {
          fetchSettings();
        }}
      />
    </div>
  );
};
