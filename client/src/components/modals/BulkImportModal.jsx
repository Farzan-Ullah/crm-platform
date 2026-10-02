import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  RefreshCw,
  FileText,
  X,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../common/Button.jsx';
import { Badge } from '../common/Badge.jsx';
import { importExportApi } from '../../api/importExportApi.js';
import toast from 'react-hot-toast';

export const BulkImportModal = ({ isOpen, onClose, defaultEntity = 'Lead', onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Map, 3: Configure, 4: Results
  const [entity, setEntity] = useState(defaultEntity);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Preview & mappings state
  const [previewData, setPreviewData] = useState(null);
  const [mappings, setMappings] = useState({});
  const [duplicateStrategy, setDuplicateStrategy] = useState('skip');

  // Result state
  const [resultData, setResultData] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  };

  const handleDownloadSample = async () => {
    try {
      await importExportApi.downloadTemplate(entity);
      toast.success(`Sample template for ${entity} downloaded`);
    } catch (err) {
      toast.error('Failed to download template');
    }
  };

  const handleUploadAndPreview = async () => {
    if (!file) {
      toast.error('Please choose a CSV or Excel file to upload');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entity', entity);

      const res = await importExportApi.previewImport(formData);
      setPreviewData(res);
      setMappings(res.suggestedMappings || {});
      setCurrentStep(2);
      toast.success(`File parsed: ${res.totalRows} records found`);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteImport = async () => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entity', entity);
      formData.append('mappings', JSON.stringify(mappings));
      formData.append('duplicateStrategy', duplicateStrategy);

      const res = await importExportApi.executeImport(formData);
      setResultData(res);
      setCurrentStep(4);
      toast.success('Import completed successfully!');
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Bulk import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadFailureReport = async () => {
    if (!resultData?.errors || resultData.errors.length === 0) return;
    try {
      await importExportApi.downloadErrorReport(resultData.errors);
      toast.success('Failure report downloaded');
    } catch (err) {
      toast.error('Failed to generate error report');
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setFile(null);
    setPreviewData(null);
    setMappings({});
    setResultData(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Bulk Data Import Wizard
              </h2>
              <p className="text-xs text-slate-500">
                Step {currentStep} of 4: {currentStep === 1 && 'Upload Spreadsheet'}
                {currentStep === 2 && 'Map Columns'}
                {currentStep === 3 && 'Duplicate Strategy'}
                {currentStep === 4 && 'Import Summary'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Tracker */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/20 flex items-center justify-between text-xs">
          {[
            { num: 1, label: 'Upload' },
            { num: 2, label: 'Field Mapping' },
            { num: 3, label: 'Deduplication' },
            { num: 4, label: 'Results' },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentStep === s.num
                    ? 'bg-indigo-600 text-white'
                    : currentStep > s.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {currentStep > s.num ? '✓' : s.num}
              </div>
              <span
                className={`font-medium hidden sm:inline ${
                  currentStep === s.num ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500'
                }`}
              >
                {s.label}
              </span>
              {idx < 3 && <div className="w-8 sm:w-12 h-0.5 bg-slate-200 dark:bg-slate-800 mx-1" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: UPLOAD */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Entity Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Select CRM Record Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['Lead', 'Contact', 'Company'].map((ent) => (
                    <button
                      key={ent}
                      type="button"
                      onClick={() => setEntity(ent)}
                      className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                        entity === ent
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      {ent}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Drag & Drop File Zone */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <input
                  type="file"
                  id="import-file-input"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="import-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {file ? file.name : 'Choose a CSV or Excel file or drag & drop'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports .CSV, .XLSX, and .XLS up to 10MB
                    </p>
                  </div>
                  {file && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {(file.size / 1024).toFixed(1)} KB selected
                    </div>
                  )}
                </label>
              </div>

              {/* Download Sample Template */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span>Need an example template with pre-configured headers?</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSample}
                  className="gap-1.5 text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Sample CSV
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: MAP COLUMNS */}
          {currentStep === 2 && previewData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Map file columns to <strong className="text-slate-800 dark:text-slate-200">{entity}</strong> fields.
                </span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {Object.keys(mappings).filter((k) => mappings[k]).length} of {previewData.headers.length} mapped
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">File Column</th>
                      <th className="py-2.5 px-3">Sample Row 1</th>
                      <th className="py-2.5 px-3">Target CRM Field</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {previewData.headers.map((hdr) => {
                      const sampleVal = previewData.previewRows?.[0]?.[hdr] || '—';
                      return (
                        <tr key={hdr} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                            {hdr}
                          </td>
                          <td className="py-2.5 px-3 truncate max-w-xs text-slate-500 font-mono text-[11px]">
                            {sampleVal}
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={mappings[hdr] || ''}
                              onChange={(e) =>
                                setMappings({ ...mappings, [hdr]: e.target.value })
                              }
                              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            >
                              <option value="">— Do Not Import —</option>
                              {previewData.targetFields?.map((tf) => (
                                <option key={tf.key} value={tf.key}>
                                  {tf.label} {tf.required ? '*(Required)' : ''}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: DUPLICATE RESOLUTION */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Deduplication & Duplicate Strategy
                </label>
                <p className="text-xs text-slate-400 mb-4">
                  How should existing CRM records with matching email or company names be handled?
                </p>

                <div className="space-y-3">
                  {[
                    {
                      id: 'skip',
                      title: 'Skip Duplicate Records (Recommended)',
                      desc: 'Existing records in your CRM will be preserved as-is. Duplicate rows in the file are ignored.',
                    },
                    {
                      id: 'overwrite',
                      title: 'Update & Overwrite Existing Records',
                      desc: 'Existing records will be updated with the newly imported non-empty values.',
                    },
                    {
                      id: 'error',
                      title: 'Flag as Error & Reject Duplicate Rows',
                      desc: 'Duplicate rows will be marked as failures in your import report for manual inspection.',
                    },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        duplicateStrategy === opt.id
                          ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="dup-strategy"
                        value={opt.id}
                        checked={duplicateStrategy === opt.id}
                        onChange={() => setDuplicateStrategy(opt.id)}
                        className="mt-1 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {opt.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Ready to Import Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Record Type:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{entity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Rows to Process:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {previewData?.totalRows || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fields to Ingest:</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {Object.values(mappings).filter(Boolean).length} fields
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: RESULTS */}
          {currentStep === 4 && resultData && (
            <div className="space-y-6">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {resultData.importedCount}
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                    Created
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {resultData.updatedCount}
                  </p>
                  <p className="text-[11px] font-semibold text-blue-800 dark:text-blue-300">
                    Updated
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {resultData.skippedCount}
                  </p>
                  <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                    Skipped
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                    {resultData.failedCount}
                  </p>
                  <p className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">
                    Errors
                  </p>
                </div>
              </div>

              {/* Error Details if any */}
              {resultData.errors && resultData.errors.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      {resultData.errors.length} rows encountered validation errors:
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadFailureReport}
                      className="text-xs gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/30"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Failure CSV
                    </Button>
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20 p-2 text-xs divide-y divide-rose-100 dark:divide-rose-900/40 font-mono">
                    {resultData.errors.map((err, idx) => (
                      <div key={idx} className="py-2 px-2 flex items-start gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 text-[10px] font-bold">
                          Row {err.rowNumber}
                        </span>
                        <span className="text-rose-700 dark:text-rose-300 flex-1">
                          {err.error}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          {currentStep > 1 && currentStep < 4 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={isProcessing}
              className="gap-1.5 text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          ) : currentStep === 4 ? (
            <Button variant="outline" size="sm" onClick={resetWizard} className="text-xs">
              Import Another
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {currentStep < 4 && (
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
            )}

            {currentStep === 1 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleUploadAndPreview}
                disabled={!file || isProcessing}
                isLoading={isProcessing}
                className="gap-1.5 text-xs"
              >
                Continue to Mapping
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}

            {currentStep === 2 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCurrentStep(3)}
                disabled={isProcessing}
                className="gap-1.5 text-xs"
              >
                Next: Duplicate Handling
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}

            {currentStep === 3 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteImport}
                disabled={isProcessing}
                isLoading={isProcessing}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Execute Bulk Import
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}

            {currentStep === 4 && (
              <Button variant="primary" size="sm" onClick={onClose} className="text-xs">
                Done
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
