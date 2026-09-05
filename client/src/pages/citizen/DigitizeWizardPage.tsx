import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';
import { DocumentType, RequestType, LandRecordDTO, RequestDTO } from '@land-digitization/shared';
import { Upload, FileText, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, ShieldCheck, Trash2, MapPin, Eye, Printer, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

interface UploadedDoc {
  id: string;
  fileName: string;
  fileSize: number;
  fileHash: string;
  documentType: DocumentType;
}

export const DigitizeWizardPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Step 1: Application Category & Location / Record
  const [requestType, setRequestType] = useState<RequestType>(RequestType.NEW_DIGITIZATION);
  const [existingRecords, setExistingRecords] = useState<LandRecordDTO[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  
  // Custom manual entry (if not selecting existing computerized record)
  const [stateName, setStateName] = useState('Rajasthan');
  const [district, setDistrict] = useState('Jaipur');
  const [tehsil, setTehsil] = useState('Sanganer');
  const [village, setVillage] = useState('Rampur');
  const [khasraNumber, setKhasraNumber] = useState('');
  const [khatauniNumber, setKhatauniNumber] = useState('');
  const [areaInSqMeters, setAreaInSqMeters] = useState<number>(4050);
  const [applicantRemarks, setApplicantRemarks] = useState('');

  // Step 2: Documents
  const [docType, setDocType] = useState<DocumentType>(DocumentType.REGISTRATION_DEED);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);

  // Step 3: Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [declarationChecked, setDeclarationChecked] = useState(false);

  // Step 4: Result
  const [createdRequest, setCreatedRequest] = useState<RequestDTO | null>(null);

  useEffect(() => {
    // Fetch existing records for easy attachment if mutating
    apiClient
      .get('/records', { params: { limit: 20 } })
      .then((res: any) => {
        if (res.data?.data) {
          setExistingRecords(res.data.data);
        }
      })
      .catch((err: any) => console.error('Failed to load records:', err));
  }, []);

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('documentType', docType);
    if (selectedRecordId) {
      formData.append('landRecordId', selectedRecordId);
    }

    try {
      const res = await apiClient.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.data) {
        const newDoc: UploadedDoc = {
          id: res.data.data.id,
          fileName: res.data.data.fileName,
          fileSize: res.data.data.fileSize,
          fileHash: res.data.data.fileHash,
          documentType: res.data.data.documentType,
        };
        setUploadedDocs((prev) => [...prev, newDoc]);
        setSelectedFile(null);
        showToast('Document uploaded and SHA-256 checksum verified', 'success', 'Upload Successful');
      }
    } catch (err: any) {
      console.error('File upload failed:', err);
      showToast(err.response?.data?.error?.message || 'Failed to upload document', 'danger', 'Upload Error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveDoc = (id: string) => {
    setUploadedDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleFinalSubmit = async () => {
    if (!declarationChecked) {
      setSubmissionError('Please confirm the legal declaration before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    const payload = {
      requestType,
      landRecordId: selectedRecordId || undefined,
      documentIds: uploadedDocs.map((d) => d.id),
      metadata: {
        state: stateName,
        district,
        tehsil,
        village,
        khasraNumber: khasraNumber || (selectedRecordId ? undefined : '102/4'),
        khatauniNumber,
        areaInSqMeters: Number(areaInSqMeters),
        applicantRemarks,
      },
    };

    try {
      const res = await apiClient.post('/workflows', payload);
      if (res.data?.data) {
        setCreatedRequest(res.data.data);
        setStep(4);
        showToast(`Application ${res.data.data.applicationNumber} registered successfully`, 'success', 'Application Filed');
      }
    } catch (err: any) {
      console.error('Application submission failed:', err);
      setSubmissionError(err.response?.data?.error?.message || 'Failed to submit application. Please verify form details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Digitize Land Deed & Submit Application"
        description="Submit official land digitization requests, sale deed mutations, or inheritance title updates with cryptographic document verification."
        breadcrumbs={[
          { label: 'Citizen Portal', href: '/citizen/dashboard' },
          { label: 'Digitize Wizard' },
        ]}
      />

      {/* Stepper Ribbon */}
      <Card className="p-4 bg-white border-slate-300">
        <div className="flex items-center justify-between">
          {[
            { num: 1, title: 'Application & Parcel' },
            { num: 2, title: 'Upload Supporting Deeds' },
            { num: 3, title: 'Review & Declaration' },
            { num: 4, title: 'Acknowledgment' },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center gap-2 sm:gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= s.num
                    ? 'bg-govnavy-900 text-white shadow-gov-sm'
                    : 'bg-slate-100 text-slate-500 border border-slate-300'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:inline ${
                  step >= s.num ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                {s.title}
              </span>
              {idx < 3 && <div className="hidden sm:block w-8 h-[1px] bg-slate-200" />}
            </div>
          ))}
        </div>
      </Card>

      {/* STEP 1: Application Category & Location / Land Record */}
      {step === 1 && (
        <Card className="p-6 bg-white border-slate-300 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Step 1: Application Type & Land Holding</h3>
            <p className="text-xs text-slate-500">
              Select the administrative filing category and link to an existing computerized record or provide survey identifiers.
            </p>
          </div>

          <div className="space-y-4">
            <Select
              label="Application Category"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value as RequestType)}
              options={[
                { value: RequestType.NEW_DIGITIZATION, label: 'New Digitization of Legacy Jamabandi / 7/12 Extract' },
                { value: RequestType.SALE_MUTATION, label: 'Sale Deed Title Mutation (Registry Transfer)' },
                { value: RequestType.INHERITANCE, label: 'Inheritance & Succession Title Mutation' },
                { value: RequestType.PARTITION, label: 'Land Partition & Boundary Division' },
              ]}
              helperText="Choose the relevant statutory land revenue procedure"
            />

            {requestType !== RequestType.NEW_DIGITIZATION && existingRecords.length > 0 && (
              <Select
                label="Target Existing Land Record (Optional)"
                value={selectedRecordId}
                onChange={(e) => setSelectedRecordId(e.target.value)}
                options={[
                  { value: '', label: '-- Or enter manual parcel identifiers below --' },
                  ...existingRecords.map((r) => ({
                    value: r.id,
                    label: `ULPIN: ${r.ulpin} | Khasra ${r.khasraNumber} (${r.location?.village || 'Village'})`,
                  })),
                ]}
              />
            )}

            {!selectedRecordId && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-govblue-600" />
                  Administrative Location & Cadastral Identifiers
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <Input label="State" value={stateName} onChange={(e) => setStateName(e.target.value)} required />
                  <Input label="District" value={district} onChange={(e) => setDistrict(e.target.value)} required />
                  <Input label="Tehsil" value={tehsil} onChange={(e) => setTehsil(e.target.value)} required />
                  <Input label="Village" value={village} onChange={(e) => setVillage(e.target.value)} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Khasra / Survey Number"
                    placeholder="e.g. 102/4"
                    value={khasraNumber}
                    onChange={(e) => setKhasraNumber(e.target.value)}
                    required
                  />
                  <Input
                    label="Khatauni / Account Number"
                    placeholder="e.g. 45-B"
                    value={khatauniNumber}
                    onChange={(e) => setKhatauniNumber(e.target.value)}
                  />
                  <Input
                    label="Registered Area (sq.meters)"
                    type="number"
                    value={areaInSqMeters}
                    onChange={(e) => setAreaInSqMeters(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
            )}

            <Input
              label="Applicant Remarks / Additional Details"
              placeholder="Provide context regarding the mutation or legacy document registration..."
              value={applicantRemarks}
              onChange={(e) => setApplicantRemarks(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              variant="primary"
              onClick={() => setStep(2)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next: Upload Supporting Documents
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: Supporting Document Upload */}
      {step === 2 && (
        <Card className="p-6 bg-white border-slate-300 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Step 2: Upload Supporting Documents</h3>
            <p className="text-xs text-slate-500">
              Upload clear scanned copies of registered deeds, 7/12 extracts, survey maps, or identity proofs. Each document is cryptographically hashed with SHA-256 for audit integrity.
            </p>
          </div>

          {/* Upload Input Box */}
          <div className="p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Document Classification"
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                options={[
                  { value: DocumentType.REGISTRATION_DEED, label: 'Registered Sale / Title Deed' },
                  { value: DocumentType.KHATAUNI_7_12, label: '7/12 Extract / Jamabandi Record' },
                  { value: DocumentType.MUTATION_SANCTION, label: 'Mutation Sanction Order' },
                  { value: DocumentType.SURVEY_MAP, label: 'Cadastral Survey Map / Tatima' },
                  { value: DocumentType.IDENTITY_PROOF, label: 'Applicant Identity Proof (Aadhaar / PAN)' },
                ]}
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Scanned File
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.tiff"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-govnavy-50 file:text-govnavy-900 hover:file:bg-govnavy-100 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-govgreen-700" />
                SHA-256 Checksum Computed upon upload
              </span>
              <Button
                size="sm"
                variant="primary"
                disabled={!selectedFile || isUploading}
                isLoading={isUploading}
                onClick={handleFileUpload}
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Upload & Verify Hash
              </Button>
            </div>
          </div>

          {/* List of Uploaded Documents */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Attached Documents ({uploadedDocs.length})
            </h4>

            {uploadedDocs.length > 0 ? (
              <div className="space-y-2">
                {uploadedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 max-w-md">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-govnavy-900 shrink-0" />
                        <span className="font-bold text-slate-900">{doc.fileName}</span>
                        <Badge variant="navy" size="sm">
                          {doc.documentType.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="font-mono text-[11px] text-slate-400 truncate">
                        SHA-256: {doc.fileHash}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveDoc(doc.id)}
                      className="text-govred-600 hover:text-govred-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center bg-slate-50 rounded border border-slate-200">
                No supporting documents attached yet. Attach at least one registered deed or Jamabandi record.
              </p>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={() => setStep(3)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next: Review & Declaration
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: Review & Citizen Declaration */}
      {step === 3 && (
        <Card className="p-6 bg-white border-slate-300 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Step 3: Review Filing & Statutory Declaration</h3>
            <p className="text-xs text-slate-500">
              Verify all application parameters before final submission to the digital land revenue repository.
            </p>
          </div>

          {submissionError && (
            <Alert variant="danger">
              <span>{submissionError}</span>
            </Alert>
          )}

          {/* Application Summary Box */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 text-xs">
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Application Type:</span>
              <strong className="text-slate-900">{requestType.replace(/_/g, ' ')}</strong>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Location Jurisdiction:</span>
              <strong className="text-slate-900">{village}, {tehsil}, {district}, {stateName}</strong>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Khasra / Survey Number:</span>
              <strong className="text-slate-900">{khasraNumber || '102/4'}</strong>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Registered Area:</span>
              <strong className="text-slate-900">{areaInSqMeters.toLocaleString('en-IN')} sq.m</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Attached Supporting Deeds:</span>
              <strong className="text-slate-900">{uploadedDocs.length} Verified Documents</strong>
            </div>
          </div>

          {/* Statutory Declaration */}
          <div className="p-4 bg-govnavy-50 rounded-lg border border-govnavy-200 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={declarationChecked}
                onChange={(e) => setDeclarationChecked(e.target.checked)}
                className="mt-1 rounded border-slate-300 text-govnavy-900 focus:ring-govblue-500"
              />
              <span className="text-xs text-govnavy-900 leading-relaxed font-medium">
                I hereby solemnly declare under statutory provisions that the land particulars, scanned deed copies, and title representations submitted above are authentic, accurate, and lawfully held. I understand that submitting fraudulent documentation is punishable under applicable land revenue codes.
              </span>
            </label>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button
              variant="primary"
              disabled={isSubmitting || !declarationChecked}
              isLoading={isSubmitting}
              onClick={handleFinalSubmit}
              rightIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Submit Application
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: Acknowledgment & Official Receipt */}
      {step === 4 && createdRequest && (
        <Card className="p-8 text-center space-y-5 bg-white border-slate-300 shadow-gov-md">
          <div className="w-16 h-16 rounded-full bg-govgreen-50 border border-govgreen-200 flex items-center justify-center text-govgreen-700 mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Application Filed Successfully!</h2>
            <p className="text-xs text-slate-500">
              Your application has been registered into the government digital land registry pipeline.
            </p>
          </div>

          <div className="max-w-md mx-auto p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Application Number:</span>
              <span className="font-mono font-bold text-govblue-900 text-sm">
                {createdRequest.applicationNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Status:</span>
              <Badge variant="info" size="sm">
                {createdRequest.stage}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Filing Timestamp:</span>
              <span className="text-slate-800">
                {new Date(createdRequest.createdAt).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link to="/citizen/requests">
              <Button variant="primary" leftIcon={<Eye className="w-4 h-4" />}>
                Track in Application Pipeline
              </Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print Receipt
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
