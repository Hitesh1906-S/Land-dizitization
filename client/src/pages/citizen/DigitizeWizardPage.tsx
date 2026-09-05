import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { DocumentType } from '@land-digitization/shared';

export const DigitizeWizardPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>(DocumentType.REGISTRATION_DEED);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleStartOcr = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep(2);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Digitize Land Document</h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload deed, jamabandi, or 7/12 extract for AI OCR extraction and validation
        </p>
      </div>

      {/* Stepper Header */}
      <div className="flex items-center justify-between glass-panel p-4 rounded-xl border border-slate-800">
        {[
          { num: 1, title: 'Upload & OCR' },
          { num: 2, title: 'Verify Extracted Fields' },
          { num: 3, title: 'Validation & Submit' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                step >= s.num ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {s.num}
            </div>
            <span className={`text-sm font-medium ${step >= s.num ? 'text-white' : 'text-slate-400'}`}>
              {s.title}
            </span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Document Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value={DocumentType.REGISTRATION_DEED}>Registered Sale Deed / Title Deed</option>
              <option value={DocumentType.KHATAUNI_7_12}>7/12 Extract / Jamabandi Record</option>
              <option value={DocumentType.MUTATION_CERTIFICATE}>Mutation Sanction Order</option>
              <option value={DocumentType.SURVEY_MAP}>Cadastral Survey Map</option>
            </select>
          </div>

          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-8 text-center transition-colors">
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.jpg,.jpeg,.png,.tiff"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-base font-semibold text-white">
                {file ? file.name : 'Click to select document or drag & drop'}
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG or TIFF up to 25MB</p>
            </label>
          </div>

          <div className="flex justify-end">
            <Button size="lg" disabled={!file} isLoading={isProcessing} onClick={handleStartOcr}>
              <Sparkles className="w-4 h-4 mr-2" />
              Run Intelligent OCR Extraction
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white">Extracted Metadata</h2>
              <p className="text-xs text-slate-400">Review and adjust fields parsed by OCR</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Confidence: 94.2%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Khasra Number</label>
              <input
                type="text"
                defaultValue="102/4"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Khatauni Number</label>
              <input
                type="text"
                defaultValue="45-B"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">District</label>
              <input
                type="text"
                defaultValue="Jaipur"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Village</label>
              <input
                type="text"
                defaultValue="Rampur"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)}>
              Proceed to Validation
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Digitization Request Submitted!</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Your document has been cryptographically hashed and forwarded to the Revenue Officer's verification queue.
          </p>
          <div className="pt-4">
            <Button onClick={() => (window.location.href = '/citizen/requests')}>
              View Application Status
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
