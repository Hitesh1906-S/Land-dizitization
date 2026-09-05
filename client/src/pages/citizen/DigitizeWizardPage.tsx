import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';
import { DocumentType } from '@land-digitization/shared';
import { Upload, FileText, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const DigitizeWizardPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>(DocumentType.REGISTRATION_DEED);
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToast();

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
      showToast('OCR extraction completed with 94.2% confidence', 'success', 'AI Extraction Complete');
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Digitize Legacy Land Document"
        description="Upload scanned physical Jamabandi records or registered sale deeds for automated OCR AI field extraction and multi-tier validation."
        breadcrumbs={[
          { label: 'Citizen Portal', href: '/citizen/dashboard' },
          { label: 'Digitize Wizard' },
        ]}
      />

      {/* Stepper Steps Ribbon */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          {[
            { num: 1, title: 'Document Upload & OCR' },
            { num: 2, title: 'Audit Extracted Fields' },
            { num: 3, title: 'Validation & Submission' },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center gap-2 sm:gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= s.num
                    ? 'bg-govnavy-900 text-white shadow-gov-sm'
                    : 'bg-slate-100 text-slate-500 border border-slate-300'
                }`}
              >
                {s.num}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:inline ${
                  step >= s.num ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                {s.title}
              </span>
              {idx < 2 && <div className="hidden sm:block w-8 h-[1px] bg-slate-200" />}
            </div>
          ))}
        </div>
      </Card>

      {/* Step 1: Upload & Engine Selection */}
      {step === 1 && (
        <Card className="p-6 space-y-6">
          <Select
            label="Document Classification"
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocumentType)}
            options={[
              { value: DocumentType.REGISTRATION_DEED, label: 'Registered Sale Deed / Title Deed' },
              { value: DocumentType.KHATAUNI_7_12, label: '7/12 Extract / Jamabandi Record' },
              { value: DocumentType.MUTATION_CERTIFICATE, label: 'Mutation Sanction Order' },
              { value: DocumentType.SURVEY_MAP, label: 'Cadastral Survey Map' },
            ]}
          />

          <div className="border-2 border-dashed border-slate-300 hover:border-govnavy-800 rounded-lg p-8 text-center transition-colors bg-slate-50/50">
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.jpg,.jpeg,.png,.tiff"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-govblue-50 border border-govblue-200 flex items-center justify-center text-govblue-700 mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                {file ? file.name : 'Click to select scanned document or drag & drop'}
              </p>
              <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG, TIFF up to 25MB</p>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-govgreen-700" />
              SHA-256 Checksum Computed upon upload
            </span>
            <Button
              size="md"
              disabled={!file}
              isLoading={isProcessing}
              onClick={handleStartOcr}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Run AI OCR Extraction
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Extracted Metadata Verification */}
      {step === 2 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Extracted Land Record Fields</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and correct parsed key-value pairs before running mathematical validation.
              </p>
            </div>
            <Badge variant="success" withDot>
              Confidence: 94.2%
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Khasra / Survey Number" defaultValue="102/4" required />
            <Input label="Khatauni / Account Number" defaultValue="45-B" required />
            <Input label="District" defaultValue="Jaipur" required />
            <Input label="Tehsil" defaultValue="Sanganer" required />
            <Input label="Village Name" defaultValue="Rampur" required />
            <Input label="Registered Area (sq.meters)" defaultValue="4050" type="number" required />
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Extracted Owner Titles & Shares
            </label>
            <Input defaultValue="Ram Kumar Sharma (100% Share - S/O Mohan Lal)" />
          </div>

          <div className="flex justify-between pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button variant="primary" onClick={() => setStep(3)} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Verify & Submit Application
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Success Confirmation */}
      {step === 3 && (
        <Card className="p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-govgreen-50 border border-govgreen-200 flex items-center justify-center text-govgreen-700 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Digitization Application Registered!</h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Application <span className="font-mono font-bold text-slate-900">DIG-2026-928104</span> has been queued for Revenue Officer verification and mathematical rule clearance.
          </p>
          <div className="pt-3">
            <Button onClick={() => (window.location.href = '/citizen/requests')}>
              View Application in Pipeline
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
