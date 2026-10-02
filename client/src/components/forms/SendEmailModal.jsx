import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sendEmailFormSchema } from '../../validations/emailSchemas.js';
import { Modal } from '../common/Modal.jsx';
import { Input } from '../common/Input.jsx';
import { Button } from '../common/Button.jsx';
import { Badge } from '../common/Badge.jsx';
import { emailsApi } from '../../api/emailsApi.js';
import toast from 'react-hot-toast';
import {
  Send,
  FileText,
  Eye,
  Edit3,
  Sparkles,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

const COMMON_VARIABLES = [
  { key: '{{firstName}}', label: 'First Name' },
  { key: '{{lastName}}', label: 'Last Name' },
  { key: '{{company}}', label: 'Company' },
  { key: '{{jobTitle}}', label: 'Job Title' },
  { key: '{{dealTitle}}', label: 'Deal Title' },
];

export const SendEmailModal = ({
  isOpen,
  onClose,
  onSuccess,
  defaultTo = '',
  defaultSubject = '',
  entityType = null,
  entityId = null,
  entityData = {},
}) => {
  const [templates, setTemplates] = useState([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(sendEmailFormSchema),
    defaultValues: {
      to: defaultTo,
      subject: defaultSubject,
      bodyHtml: '',
      templateId: '',
      entityType: entityType || '',
      entityId: entityId || '',
    },
  });

  const selectedTemplateId = watch('templateId');
  const currentBodyHtml = watch('bodyHtml');
  const currentSubject = watch('subject');

  // Load Templates
  useEffect(() => {
    if (isOpen) {
      emailsApi.getTemplates({ limit: 100 }).then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setTemplates(res.data);
        }
      });
    }
  }, [isOpen]);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setIsPreviewMode(false);
      reset({
        to: defaultTo || '',
        subject: defaultSubject || '',
        bodyHtml: '',
        templateId: '',
        entityType: entityType || '',
        entityId: entityId || '',
      });
    }
  }, [isOpen, defaultTo, defaultSubject, entityType, entityId, reset]);

  // Handle template selection
  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    setValue('templateId', templateId);
    if (!templateId) return;

    const matched = templates.find((t) => t._id === templateId);
    if (matched) {
      setValue('subject', matched.subject);
      setValue('bodyHtml', matched.bodyHtml);
      toast.success(`Template '${matched.name}' loaded`);
    }
  };

  const insertVariable = (variableKey) => {
    const textarea = document.getElementById('emailBodyTextarea');
    if (!textarea) {
      setValue('bodyHtml', (currentBodyHtml || '') + variableKey);
      return;
    }
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const text = currentBodyHtml || '';
    const newText = text.substring(0, start) + variableKey + text.substring(end);
    setValue('bodyHtml', newText);
  };

  // Preview interpolation with entityData
  const getRenderedContent = () => {
    let subject = currentSubject || '';
    let body = currentBodyHtml || '';

    const data = {
      firstName: entityData.firstName || 'Alex',
      lastName: entityData.lastName || 'Morgan',
      company: entityData.company || entityData.name || 'Acme Corp',
      jobTitle: entityData.jobTitle || 'Executive',
      dealTitle: entityData.dealTitle || 'Commercial Deal',
      ...entityData,
    };

    Object.keys(data).forEach((key) => {
      const reg = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
      subject = subject.replace(reg, data[key]);
      body = body.replace(reg, data[key]);
    });

    return { subject, body };
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        to: values.to.trim(),
        subject: values.subject.trim(),
        bodyHtml: values.bodyHtml,
        templateId: values.templateId || undefined,
        entityType: values.entityType || undefined,
        entityId: values.entityId || undefined,
        variables: {
          firstName: entityData.firstName,
          lastName: entityData.lastName,
          company: entityData.company || entityData.name,
          jobTitle: entityData.jobTitle,
        },
      };

      await emailsApi.sendEmail(payload);
      toast.success('Email dispatched with tracking pixel! 🚀');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Send email failed:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to dispatch email';
      toast.error(msg);
    }
  };

  const rendered = isPreviewMode ? getRenderedContent() : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compose Outbound Email"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Recipient + Template Load Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="To (Recipient Email)"
            required
            type="email"
            placeholder="recipient@example.com"
            error={errors.to?.message}
            {...register('to')}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Apply Saved Template
            </label>
            <select
              value={selectedTemplateId || ''}
              onChange={handleTemplateChange}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- Choose template --</option>
              {templates.map((tpl) => (
                <option key={tpl._id} value={tpl._id}>
                  {tpl.name} ({tpl.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject */}
        <Input
          label="Subject"
          required
          placeholder="e.g. Following up on our enterprise discussion"
          error={errors.subject?.message}
          {...register('subject')}
        />

        {/* Variable Insertion Chips */}
        {!isPreviewMode && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Insert Token:
            </span>
            {COMMON_VARIABLES.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => insertVariable(v.key)}
                className="px-2 py-0.5 rounded-lg text-[11px] font-mono bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {v.key}
              </button>
            ))}
          </div>
        )}

        {/* View Switcher: Edit vs Preview */}
        <div className="flex items-center justify-between pt-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Email Content
          </label>
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-850">
            <button
              type="button"
              onClick={() => setIsPreviewMode(false)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                !isPreviewMode
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              Editor
            </button>
            <button
              type="button"
              onClick={() => setIsPreviewMode(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                isPreviewMode
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              <Eye className="w-3 h-3" />
              Live Preview
            </button>
          </div>
        </div>

        {/* Body Editor or Preview */}
        {!isPreviewMode ? (
          <div>
            <textarea
              id="emailBodyTextarea"
              rows={8}
              placeholder="Write your email here. Supports HTML and {{variables}} like {{firstName}}, {{company}}..."
              {...register('bodyHtml')}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.bodyHtml && (
              <p className="mt-1 text-[11px] text-rose-500">{errors.bodyHtml.message}</p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 space-y-3 min-h-[200px]">
            <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Rendered Subject</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                {rendered.subject || '(No subject)'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Rendered Body</span>
              <div
                className="mt-2 text-xs text-slate-800 dark:text-slate-200 prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: rendered.body || '<p class="text-slate-400 italic">No content</p>' }}
              />
            </div>
          </div>
        )}

        {/* Tracking info badge */}
        <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            Automatic 1x1 invisible open pixel & link tracking will be injected
          </span>
          <span className="font-bold text-[10px] uppercase tracking-wider">Active</span>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={Send} isLoading={isSubmitting}>
            Send Email
          </Button>
        </div>
      </form>
    </Modal>
  );
};
