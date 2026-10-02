import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { quoteFormSchema } from '../../validations/quoteSchemas.js';
import { Modal } from '../common/Modal.jsx';
import { Input } from '../common/Input.jsx';
import { Button } from '../common/Button.jsx';
import { Badge } from '../common/Badge.jsx';
import { quotesApi } from '../../api/quotesApi.js';
import { dealsApi } from '../../api/dealsApi.js';
import { contactsApi } from '../../api/contactsApi.js';
import { companiesApi } from '../../api/companiesApi.js';
import toast from 'react-hot-toast';
import {
  Plus,
  Trash2,
  AlertTriangle,
  FileText,
  DollarSign,
  Percent,
  CheckCircle,
} from 'lucide-react';

const DISCOUNT_THRESHOLD = 15;

export const QuoteFormModal = ({
  isOpen,
  onClose,
  initialData = null,
  defaultDealId = null,
  defaultContactId = null,
  defaultCompanyId = null,
  onSuccess,
}) => {
  const isEditing = Boolean(initialData?._id);

  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      title: '',
      dealId: defaultDealId || '',
      contactId: defaultContactId || '',
      companyId: defaultCompanyId || '',
      currency: 'USD',
      validUntil: '',
      terms: 'Payment due within 30 days of issue. Standard terms and conditions apply.',
      notes: '',
      lineItems: [
        {
          name: '',
          description: '',
          unitPrice: 0,
          quantity: 1,
          discountPercent: 0,
          taxPercent: 10,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  // Load dropdown resources
  useEffect(() => {
    if (isOpen) {
      setIsLoadingDropdowns(true);
      Promise.all([
        dealsApi.getDeals({ limit: 100 }),
        contactsApi.getContacts({ limit: 100 }),
        companiesApi.getCompanies({ limit: 100 }),
      ])
        .then(([dealsRes, contactsRes, companiesRes]) => {
          if (dealsRes?.data?.deals) setDeals(dealsRes.data.deals);
          if (contactsRes?.data) setContacts(contactsRes.data);
          if (companiesRes?.data) setCompanies(companiesRes.data);
        })
        .catch((err) => {
          console.error('Failed to load associations:', err);
        })
        .finally(() => {
          setIsLoadingDropdowns(false);
        });
    }
  }, [isOpen]);

  // Reset or populate initial values
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          title: initialData.title || '',
          dealId: initialData.dealId?._id || initialData.dealId || defaultDealId || '',
          contactId: initialData.contactId?._id || initialData.contactId || defaultContactId || '',
          companyId: initialData.companyId?._id || initialData.companyId || defaultCompanyId || '',
          currency: initialData.currency || 'USD',
          validUntil: initialData.validUntil
            ? new Date(initialData.validUntil).toISOString().split('T')[0]
            : '',
          terms: initialData.terms || 'Payment due within 30 days of issue.',
          notes: initialData.notes || '',
          lineItems: initialData.lineItems?.length
            ? initialData.lineItems.map((item) => ({
                name: item.name,
                description: item.description || '',
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                discountPercent: item.discountPercent || 0,
                taxPercent: item.taxPercent || 0,
              }))
            : [
                {
                  name: '',
                  description: '',
                  unitPrice: 0,
                  quantity: 1,
                  discountPercent: 0,
                  taxPercent: 10,
                },
              ],
        });
      } else {
        const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        reset({
          title: '',
          dealId: defaultDealId || '',
          contactId: defaultContactId || '',
          companyId: defaultCompanyId || '',
          currency: 'USD',
          validUntil: nextMonth,
          terms: 'Payment due within 30 days of issue. Standard terms and conditions apply.',
          notes: '',
          lineItems: [
            {
              name: '',
              description: '',
              unitPrice: 0,
              quantity: 1,
              discountPercent: 0,
              taxPercent: 10,
            },
          ],
        });
      }
    }
  }, [isOpen, initialData, defaultDealId, defaultContactId, defaultCompanyId, reset]);

  // Watch line items for real-time calculations
  const watchedLineItems = watch('lineItems') || [];
  const watchedCurrency = watch('currency') || 'USD';

  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let hasHighDiscount = false;

  watchedLineItems.forEach((item) => {
    const price = Number(item.unitPrice) || 0;
    const qty = Number(item.quantity) || 1;
    const disc = Number(item.discountPercent) || 0;
    const tax = Number(item.taxPercent) || 0;

    const raw = price * qty;
    const discAmt = raw * (disc / 100);
    const discounted = raw - discAmt;
    const taxAmt = discounted * (tax / 100);

    subtotal += raw;
    totalDiscount += discAmt;
    totalTax += taxAmt;

    if (disc > DISCOUNT_THRESHOLD) {
      hasHighDiscount = true;
    }
  });

  const grandTotal = Math.max(0, subtotal - totalDiscount + totalTax);
  const overallDiscount = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0;
  const requiresApproval = hasHighDiscount || overallDiscount > DISCOUNT_THRESHOLD;

  const onSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        dealId: values.dealId || undefined,
        contactId: values.contactId || undefined,
        companyId: values.companyId || undefined,
        validUntil: values.validUntil ? new Date(values.validUntil) : undefined,
      };

      if (isEditing) {
        await quotesApi.updateQuote(initialData._id, payload);
        toast.success('Quotation updated successfully');
      } else {
        await quotesApi.createQuote(payload);
        toast.success(
          requiresApproval
            ? 'Quotation submitted for Manager Approval! 📋'
            : 'Quotation created successfully! 🚀'
        );
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Save quotation error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save quotation';
      toast.error(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Quotation ${initialData?.quoteNumber}` : 'Create New Quotation'}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Header Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Quotation Title / Project Name"
            placeholder="e.g. Enterprise Cloud Migration Proposal"
            error={errors.title?.message}
            {...register('title')}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Currency
            </label>
            <select
              {...register('currency')}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
              <option value="CAD">CAD ($) - Canadian Dollar</option>
              <option value="AUD">AUD ($) - Australian Dollar</option>
            </select>
          </div>
        </div>

        {/* Association Linkages */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Link Deal / Pipeline
            </label>
            <select
              {...register('dealId')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="">-- No Linked Deal --</option>
              {deals.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.title} (${d.value?.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contact / Decision Maker
            </label>
            <select
              {...register('contactId')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="">-- No Contact Linked --</option>
              {contacts.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.firstName} {c.lastName} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Client Company
            </label>
            <select
              {...register('companyId')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="">-- No Company Linked --</option>
              {companies.map((cmp) => (
                <option key={cmp._id} value={cmp._id}>
                  {cmp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Line Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-500" />
              Line Items & Services ({fields.length})
            </h4>
            <Button
              type="button"
              size="xs"
              variant="outline"
              icon={Plus}
              onClick={() =>
                append({
                  name: '',
                  description: '',
                  unitPrice: 0,
                  quantity: 1,
                  discountPercent: 0,
                  taxPercent: 10,
                })
              }
            >
              Add Item
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 min-w-[200px]">Product / Service</th>
                  <th className="py-2.5 px-2 w-28 text-right">Price</th>
                  <th className="py-2.5 px-2 w-20 text-center">Qty</th>
                  <th className="py-2.5 px-2 w-24 text-right">Disc %</th>
                  <th className="py-2.5 px-2 w-20 text-right">Tax %</th>
                  <th className="py-2.5 px-3 w-28 text-right">Total</th>
                  <th className="py-2.5 px-2 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {fields.map((field, index) => {
                  const currentItem = watchedLineItems[index] || {};
                  const price = Number(currentItem.unitPrice) || 0;
                  const qty = Number(currentItem.quantity) || 1;
                  const disc = Number(currentItem.discountPercent) || 0;
                  const tax = Number(currentItem.taxPercent) || 0;

                  const raw = price * qty;
                  const itemTotal = (raw * (1 - disc / 100) * (1 + tax / 100)).toFixed(2);

                  return (
                    <tr key={field.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850">
                      <td className="p-2 space-y-1">
                        <input
                          type="text"
                          placeholder="Item name (required)"
                          {...register(`lineItems.${index}.name`)}
                          className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 text-xs text-slate-900 dark:text-white"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Description or specifications (optional)"
                          {...register(`lineItems.${index}.description`)}
                          className="w-full rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1 text-[11px] text-slate-500"
                        />
                      </td>

                      <td className="p-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`lineItems.${index}.unitPrice`)}
                          className="w-full text-right rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 text-xs text-slate-900 dark:text-white"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="1"
                          {...register(`lineItems.${index}.quantity`)}
                          className="w-full text-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 text-xs text-slate-900 dark:text-white"
                        />
                      </td>

                      <td className="p-2 text-right">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          {...register(`lineItems.${index}.discountPercent`)}
                          className={`w-full text-right rounded-md border p-1.5 text-xs ${
                            disc > DISCOUNT_THRESHOLD
                              ? 'border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                          }`}
                        />
                      </td>

                      <td className="p-2 text-right">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          {...register(`lineItems.${index}.taxPercent`)}
                          className="w-full text-right rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 text-xs text-slate-900 dark:text-white"
                        />
                      </td>

                      <td className="p-2 text-right font-bold text-slate-900 dark:text-white">
                        ${Number(itemTotal).toLocaleString()}
                      </td>

                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculations & Discount Warning Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div>
            {requiresApproval ? (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Manager Approval Required</p>
                  <p className="text-[11px] mt-0.5">
                    Overall discount of {overallDiscount.toFixed(1)}% exceeds the company threshold of {DISCOUNT_THRESHOLD}%.
                    This quote will automatically transition to <strong>Pending Approval</strong> upon creation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <p>Standard discount pricing is within auto-approval limits.</p>
              </div>
            )}

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Validity Expiration Date
              </label>
              <input
                type="date"
                {...register('validUntil')}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Totals Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Gross Subtotal:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Total Discount:</span>
              <span className={`font-semibold ${totalDiscount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                -${totalDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {subtotal > 0 && ` (${overallDiscount.toFixed(1)}%)`}
              </span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Estimated Tax:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                +${totalTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline text-sm font-bold text-slate-900 dark:text-white">
              <span>Net Grand Total:</span>
              <span className="text-base text-indigo-600 dark:text-indigo-400">
                {watchedCurrency} ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Terms & Conditions
            </label>
            <textarea
              rows={2}
              {...register('terms')}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Client Visible Notes / Deliverables
            </label>
            <textarea
              rows={2}
              {...register('notes')}
              placeholder="e.g. Includes initial configuration, migration assistance, and 30-day onboarding."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            {isEditing
              ? 'Save Changes'
              : requiresApproval
              ? 'Submit for Approval'
              : 'Create Quotation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
