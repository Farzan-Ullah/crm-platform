import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { templateFormSchema } from '../../validations/emailSchemas.js';
import { Modal } from '../common/Modal.jsx';
import { Input } from '../common/Input.jsx';
import { Button } from '../common/Button.jsx';
import { emailsApi } from '../../api/emailsApi.js';
import toast from 'react-hot-toast';
import {
  FileText,
  Eye,
  Edit3,
  Sparkles,
  Save,
  Tag,
} from 'lucide-react';

const CATEGORIES = [
  'Sales',
  'Marketing',
  'FollowUp',
  'Onboarding',
  'Transactional',
  'Other',
];

const VARIABLE_TAGS = [
  '{{firstName}}',
  '{{lastName}}',
  '{{company}}',
  '{{jobTitle}}',
  '{{dealTitle}}',
  '{{dealValue}}',
];

export const EmailTemplateModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const isEdit = !!initialData?._id;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: '',
      subject: '',
      category: 'Sales',
      bodyHtml: '',
      bodyText: '',
      isShared: true,
    },
  });

  const bodyHtmlValue = watch('bodyHtml');
  const subjectValue = watch('subject');

  useEffect(() => {
    if (isOpen) {
      setIsPreview(false);
      if (initialData) {
        reset({
          name: initialData.name || '',
          subject: initialData.subject || '',
          category: initialData.category || 'Sales',
          bodyHtml: initialData.bodyHtml || '',
          bodyText: initialData.bodyText || '',
          isShared: initialData.isShared ?? true,
        });
      } else {
        reset({
          name: '',
          subject: '',
          category: 'Sales',
          bodyHtml: `<h2>Hi {{firstName}},</h2>\n<p>I wanted to follow up on our previous discussion regarding {{company}}.</p>\n<p>Best regards,<br/>The Team</p>`,
          bodyText: '',
          isShared: true,
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const insertVariable = (tag) => {
    const el = document.getElementById('templateBodyTextarea');
    if (!el) {
      setValue('bodyHtml', (bodyHtmlValue || '') + tag);
      return;
    }
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const text = bodyHtmlValue || '';
    const newText = text.substring(0, start) + tag + text.substring(end);
    setValue('bodyHtml', newText);
  };

  const getPreviewContent = () => {
    const sample = {
      firstName: 'Jordan',
      lastName: 'Miller',
      company: 'Quantum Innovations',
      jobTitle: 'VP of Engineering',
      dealTitle: 'Enterprise Suite License',
      dealValue: '$50,000',
    };

    let subject = subjectValue || '';
    let body = bodyHtmlValue || '';

    Object.keys(sample).forEach((k) => {
      const reg = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'gi');
      subject = subject.replace(reg, sample[k]);
      body = body.replace(reg, sample[k]);
    });

    return { subject, body };
  };

  const onSubmit = async (values) => {
    try {
      if (isEdit) {
        await emailsApi.updateTemplate(initialData._id, values);
        toast.success('Template updated successfully!');
      } else {
        await emailsApi.createTemplate(values);
        toast.success('Template created successfully!');
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Template save error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save template';
      toast.error(msg);
    }
  };

  const previewData = isPreview ? getPreviewContent() : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Email Template' : 'New Email Template'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name + Category Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Template Name"
            required
            placeholder="e.g. Discovery Pitch Q4"
            error={errors.name?.message}
            {...register('name')}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              {...register('category')}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject */}
        <Input
          label="Email Subject Line"
          required
          placeholder="e.g. Accelerate growth at {{company}}"
          error={errors.subject?.message}
          {...register('subject')}
        />

        {/* Variable Insertion Chips */}
        {!isPreview && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Dynamic Tags:
            </span>
            {VARIABLE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => insertVariable(tag)}
                className="px-2 py-0.5 rounded-lg text-[11px] font-mono bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Editor vs Preview Mode Switcher */}
        <div className="flex items-center justify-between pt-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            HTML Template Body
          </label>
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-850">
            <button
              type="button"
              onClick={() => setIsPreview(false)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                !isPreview
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              HTML Editor
            </button>
            <button
              type="button"
              onClick={() => setIsPreview(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                isPreview
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              <Eye className="w-3 h-3" />
              Live Preview
            </button>
          </div>
        </div>

        {/* Editor / Preview Area */}
        {!isPreview ? (
          <div>
            <textarea
              id="templateBodyTextarea"
              rows={8}
              placeholder="Paste HTML or write template content with {{variable}} placeholders..."
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
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Sample Subject</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                {previewData.subject || '(Empty subject)'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Sample Render</span>
              <div
                className="mt-2 text-xs text-slate-800 dark:text-slate-200 prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: previewData.body || '<p class="text-slate-400 italic">No content</p>' }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={Save} isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Template'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
