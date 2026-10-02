import React, { useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { apiClient } from '../../api/apiClient.js';
import { useAuth } from '../../hooks/useAuth.js';
import toast from 'react-hot-toast';
import { Code, Send, Check } from 'lucide-react';

export const WebToLeadModal = ({ isOpen, onClose, onSuccess }) => {
  const { tenant } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testForm, setTestForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
  });

  const tenantSubdomain = 'acme'; // default tenant

  const embedCodeSnippet = `<!-- NexusCRM Public Web-To-Lead Form -->
<form action="http://localhost:5000/api/v1/public/leads" method="POST">
  <input type="hidden" name="tenantSubdomain" value="${tenantSubdomain}" />
  <input type="hidden" name="source" value="Website" />
  <!-- Spam Bot Honeypot (leave empty) -->
  <input type="text" name="hpField" style="display:none !important;" tabindex="-1" autocomplete="off" />

  <input type="text" name="firstName" placeholder="First Name" required />
  <input type="text" name="lastName" placeholder="Last Name" required />
  <input type="email" name="email" placeholder="Work Email" required />
  <input type="tel" name="phone" placeholder="Phone Number" />
  <input type="text" name="company" placeholder="Company Name" />
  <textarea name="notes" placeholder="How can we help?"></textarea>

  <button type="submit">Submit Inquiry</button>
</form>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCodeSnippet);
    setCopied(true);
    toast.success('Embed code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await apiClient.post('/public/leads', {
        tenantSubdomain,
        ...testForm,
      });

      if (res.success) {
        toast.success('Test web lead received and automatically scored!');
        setTestForm({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          notes: '',
        });
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Web-to-Lead Capture Integration"
      subtitle="Embed a public inquiry form on your marketing website to automatically capture and score prospects."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Code Snippet Box */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Code className="w-4 h-4 text-indigo-500" />
              Embeddable HTML Code
            </span>
            <Button size="xs" variant="secondary" onClick={handleCopy}>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 mr-1" /> : null}
              {copied ? 'Copied!' : 'Copy Code'}
            </Button>
          </div>
          <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800">
            {embedCodeSnippet}
          </pre>
        </div>

        {/* Live Test Sandbox */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Test Live Public Web Submission
          </h4>
          <form onSubmit={handleTestSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="First Name *"
                required
                value={testForm.firstName}
                onChange={(e) => setTestForm({ ...testForm, firstName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Last Name *"
                required
                value={testForm.lastName}
                onChange={(e) => setTestForm({ ...testForm, lastName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="email"
                placeholder="Work Email"
                value={testForm.email}
                onChange={(e) => setTestForm({ ...testForm, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={testForm.phone}
                onChange={(e) => setTestForm({ ...testForm, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <input
              type="text"
              placeholder="Company Name"
              value={testForm.company}
              onChange={(e) => setTestForm({ ...testForm, company: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white"
            />
            <textarea
              rows={2}
              placeholder="Inquiry notes..."
              value={testForm.notes}
              onChange={(e) => setTestForm({ ...testForm, notes: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white resize-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" type="submit" variant="primary" icon={Send} isLoading={isSubmitting}>
                Send Test Lead
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};
