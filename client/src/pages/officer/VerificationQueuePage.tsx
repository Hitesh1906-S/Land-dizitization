import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/api';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Sparkles,
  Eye,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Search,
  Check,
  Edit3,
  Layers,
  Cpu,
  ArrowRight,
  Database
} from 'lucide-react';

interface ExtractedFieldData {
  id?: string;
  fieldName: string;
  fieldLabel: string;
  fieldValue: string | null;
  confidence: number;
  sourceSnippet: string | null;
  isUncertain: boolean;
  isMissing: boolean;
  status: 'CONFIRMED' | 'UNCERTAIN' | 'MISSING';
  isVerified?: boolean;
  verifiedValue?: string;
}

interface OCRDocumentItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  status: string;
  ocrResult?: {
    id: string;
    status: string;
    engine: string;
    confidenceScore: number;
    rawText: string;
    extractedFields: any[];
  };
}

const DEFAULT_FIELDS_ORDER = [
  { name: 'owner', label: '1. Primary Owner' },
  { name: 'coOwner', label: '2. Co-Owner / Joint Sharer' },
  { name: 'khasraNumber', label: '3. Khasra / Survey Number' },
  { name: 'plotNumber', label: '4. Plot / Site Number' },
  { name: 'area', label: '5. Land Area' },
  { name: 'village', label: '6. Village / Mauza' },
  { name: 'tehsil', label: '7. Tehsil / Taluk' },
  { name: 'district', label: '8. District' },
  { name: 'state', label: '9. State' },
  { name: 'landType', label: '10. Land Type / Classification' },
  { name: 'registrationDate', label: '11. Registration Date' },
  { name: 'documentNumber', label: '12. Document / Deed Ref No.' },
];

export const VerificationQueuePage: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'queue' | 'playground'>('queue');
  const [documents, setDocuments] = useState<OCRDocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [ocrData, setOcrData] = useState<any>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [extractedFieldList, setExtractedFieldList] = useState<ExtractedFieldData[]>([]);

  // Live Playground State
  const [sampleOcrText, setSampleOcrText] = useState<string>(
    `GOVERNMENT OF UTTAR PRADESH - REVENUE DEPARTMENT\n` +
    `KHATAUNI / LAND RECORD OF RIGHTS (RoR) - 1428 Fasli\n` +
    `Village: Rampur Khurd | Tehsil: Sanganer | District: Jaipur | State: Rajasthan\n` +
    `Document / Deed Registration No: REG/2024/99418\n` +
    `Primary Owner Name: Shri Ramesh Chandra Sharma S/O Late Badri Prasad\n` +
    `Co-Owner: Smt. Sunita Devi (50% Share - W/O Ramesh Chandra)\n` +
    `Khasra / Survey Number: 142/4/1\n` +
    `Plot No: 88-B, Sector 4\n` +
    `Total Area: 0.8500 Hectares (8,500 Sq. Meters)\n` +
    `Land Type: Agricultural (सिंचित कृषि भूमि)\n` +
    `Registration Date: 18/03/2024\n` +
    `Surveyor Seal: Verified by Revenue Circle Officer`
  );
  const [selectedProvider, setSelectedProvider] = useState<'deterministic' | 'gemini'>('deterministic');
  const [playgroundResult, setPlaygroundResult] = useState<any>(null);
  const [extractingPlayground, setExtractingPlayground] = useState<boolean>(false);

  // Fetch initial documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>('/documents');
      const docs = res.data?.data?.documents || [];
      setDocuments(docs);
      if (docs.length > 0 && !selectedDocId) {
        setSelectedDocId(docs[0].id);
        fetchOcrForDoc(docs[0].id);
      }
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOcrForDoc = async (docId: string) => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>(`/ocr/document/${docId}`);
      const ocr = res.data?.data;
      setOcrData(ocr);

      if (ocr && ocr.extractedFields) {
        const fieldMap: Record<string, string> = {};
        const parsedList: ExtractedFieldData[] = [];

        // Map 12 standard fields
        DEFAULT_FIELDS_ORDER.forEach(({ name, label }) => {
          const match = ocr.extractedFields.find((f: any) => f.fieldName === name);
          let meta: any = { sourceSnippet: null, isUncertain: false, isMissing: true, status: 'MISSING' };
          if (match?.boundingBoxJson) {
            try {
              meta = JSON.parse(match.boundingBoxJson);
            } catch (e) {}
          }

          const val = match?.verifiedValue || match?.fieldValue || '';
          fieldMap[name] = val;

          parsedList.push({
            id: match?.id,
            fieldName: name,
            fieldLabel: label,
            fieldValue: match?.fieldValue ?? null,
            confidence: match?.confidence ?? 0,
            sourceSnippet: meta.sourceSnippet,
            isUncertain: meta.isUncertain || match?.confidence < 0.75,
            isMissing: !match?.fieldValue,
            status: !match?.fieldValue ? 'MISSING' : (meta.isUncertain ? 'UNCERTAIN' : 'CONFIRMED'),
            isVerified: match?.isVerified,
            verifiedValue: match?.verifiedValue,
          });
        });

        setFieldValues(fieldMap);
        setExtractedFieldList(parsedList);
      }
    } catch (err: any) {
      setOcrData(null);
      setExtractedFieldList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDocChange = (docId: string) => {
    setSelectedDocId(docId);
    fetchOcrForDoc(docId);
  };

  const handleRunOcr = async () => {
    if (!selectedDocId) return;
    try {
      setActionLoading(true);
      await apiClient.post('/ocr/process', {
        documentId: selectedDocId,
        engine: 'HYBRID',
      });
      showToast('OCR extraction completed! 12 structured fields parsed.', 'success', 'OCR Successful');
      await fetchOcrForDoc(selectedDocId);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to run OCR', 'danger', 'OCR Failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchApprove = async () => {
    if (!selectedDocId || !extractedFieldList.length) return;
    try {
      setActionLoading(true);
      const verifications = extractedFieldList
        .filter((f) => f.id)
        .map((f) => ({
          fieldId: f.id!,
          verifiedValue: fieldValues[f.fieldName] || f.fieldValue || '',
        }));

      await apiClient.post(`/ocr/document/${selectedDocId}/verify-all`, {
        verifications,
        createOrUpdateRecord: true,
      });

      showToast(
        'All 12 structured fields approved and saved to digital registry!',
        'success',
        'Verification Sanctioned'
      );
      await fetchOcrForDoc(selectedDocId);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Verification failed', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFlagDiscrepancy = () => {
    showToast(
      'Document flagged for discrepancy. Applicant notified for physical deed re-submission.',
      'warning',
      'Discrepancy Flagged'
    );
  };

  const handleTestExtraction = async () => {
    try {
      setExtractingPlayground(true);
      const res = await apiClient.post<any>('/ocr/extract-fields', {
        rawOcrText: sampleOcrText,
        provider: selectedProvider,
      });
      setPlaygroundResult(res.data?.data);
      showToast('Fields extracted from text successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Extraction failed', 'danger');
    } finally {
      setExtractingPlayground(false);
    }
  };

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Officer OCR Field Verification"
        description="Verify 12 structured land-record fields extracted from scanned deeds. Validate confidence scores, examine source OCR text references, and sanction digital titles."
        breadcrumbs={[
          { label: 'Revenue Officer', href: '/officer/dashboard' },
          { label: 'OCR Verification Queue' },
        ]}
        badge={
          <Badge variant="navy" size="sm">
            12-Field Extraction Pipeline
          </Badge>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'queue'
              ? 'bg-govblue-50 text-govblue-900 border border-govblue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          Document Verification Queue
        </button>
        <button
          onClick={() => {
            setActiveTab('playground');
            if (!playgroundResult) handleTestExtraction();
          }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'playground'
              ? 'bg-govblue-50 text-govblue-900 border border-govblue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Live Field Extractor Playground
        </button>
      </div>

      {activeTab === 'queue' ? (
        <div className="space-y-6">
          {/* Document Selector Header Bar */}
          <Card className="p-4 bg-slate-50 border border-slate-200">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <FileText className="w-5 h-5 text-govblue-700 shrink-0" />
                <div className="w-full md:w-80">
                  <select
                    className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-govblue-600"
                    value={selectedDocId}
                    onChange={(e) => handleDocChange(e.target.value)}
                  >
                    {documents.length === 0 && <option value="">No documents found</option>}
                    {documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fileName} ({d.fileType.toUpperCase()} - {(d.fileSize / 1024).toFixed(0)} KB)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fetchOcrForDoc(selectedDocId)}
                  disabled={loading || !selectedDocId}
                  leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
                >
                  Reload Document
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunOcr}
                  disabled={actionLoading || !selectedDocId}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-govamber-300" />}
                >
                  {actionLoading ? 'Processing OCR...' : 'Run / Re-run OCR Pipeline'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Verification Workspace Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Document Information & Raw OCR Preview */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-govblue-700" />
                    <h3 className="text-base font-bold text-slate-900">Original Document Preview</h3>
                  </div>
                  {ocrData && (
                    <Badge variant={ocrData.status === 'COMPLETED' ? 'success' : 'warning'} size="sm">
                      {ocrData.status}
                    </Badge>
                  )}
                </div>

                <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold">File Name:</span>
                    <span className="font-mono">{selectedDoc?.fileName || 'None'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold">Document ID:</span>
                    <span className="font-mono">{selectedDocId || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold">OCR Engine:</span>
                    <span className="font-medium text-govblue-700">{ocrData?.engine || 'HYBRID (Tesseract + AI)'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold">Overall Document Confidence:</span>
                    <span className="font-bold text-slate-900">
                      {ocrData?.confidenceScore ? `${ocrData.confidenceScore.toFixed(1)}%` : 'Pending OCR'}
                    </span>
                  </div>
                  {ocrData?.processingTimeMs && (
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="font-semibold">Processing Duration:</span>
                      <span>{(ocrData.processingTimeMs / 1000).toFixed(2)} seconds</span>
                    </div>
                  )}
                </div>

                {/* Raw OCR Text Viewer */}
                <div className="mt-4 space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Recognized Raw OCR Text</span>
                    <span className="text-slate-400 text-[11px] font-normal">
                      {ocrData?.rawText?.length || 0} characters
                    </span>
                  </label>
                  <div className="h-72 overflow-y-auto bg-slate-900 text-slate-100 font-mono text-xs p-3 rounded-lg border border-slate-700 leading-relaxed whitespace-pre-wrap selection:bg-govblue-600">
                    {ocrData?.rawText ? (
                      ocrData.rawText
                    ) : (
                      <span className="text-slate-500 italic">
                        No OCR text extracted yet. Click "Run / Re-run OCR Pipeline" above.
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: 12 Structured Extracted Fields with Provenance & Inline Edits */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-govamber-600" />
                    <h3 className="text-base font-bold text-slate-900">Structured Extracted Fields (12 Target Fields)</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="navy" size="sm">
                      {extractedFieldList.filter((f) => !f.isMissing).length} / 12 Fields Extracted
                    </Badge>
                  </div>
                </div>

                {!ocrData || extractedFieldList.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <AlertTriangle className="w-10 h-10 text-govamber-500 mx-auto" />
                    <h4 className="text-base font-bold text-slate-800">No Structured Fields Available</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Run the OCR pipeline on this document to automatically extract owner, survey numbers, land area,
                      and registry reference details.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleRunOcr}
                      disabled={actionLoading || !selectedDocId}
                    >
                      Extract Fields Now
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {extractedFieldList.map((item) => {
                      const confidencePct = (item.confidence * 100).toFixed(0);

                      return (
                        <div
                          key={item.fieldName}
                          className={`p-3.5 rounded-lg border transition-all ${
                            item.isMissing
                              ? 'bg-slate-50/70 border-slate-200 opacity-80'
                              : item.isUncertain
                              ? 'bg-amber-50/40 border-amber-200'
                              : 'bg-white border-slate-200 hover:border-govblue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-900">{item.fieldLabel}</span>
                            <div className="flex items-center gap-2">
                              {item.status === 'CONFIRMED' && (
                                <Badge variant="success" size="sm">
                                  CONFIRMED ({confidencePct}%)
                                </Badge>
                              )}
                              {item.status === 'UNCERTAIN' && (
                                <Badge variant="warning" size="sm">
                                  UNCERTAIN ({confidencePct}%)
                                </Badge>
                              )}
                              {item.status === 'MISSING' && (
                                <Badge variant="neutral" size="sm">
                                  MISSING
                                </Badge>
                              )}
                              {item.isVerified && (
                                <Badge variant="navy" size="sm" withDot>
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Field Input */}
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={fieldValues[item.fieldName] ?? ''}
                              placeholder={item.isMissing ? 'Explicitly missing - Enter value if present on scan' : ''}
                              onChange={(e) =>
                                setFieldValues({
                                  ...fieldValues,
                                  [item.fieldName]: e.target.value,
                                })
                              }
                              className={`w-full text-xs font-medium px-3 py-1.5 rounded border ${
                                item.isMissing
                                  ? 'bg-slate-100/50 text-slate-600 border-dashed border-slate-300'
                                  : 'bg-white text-slate-900 border-slate-300 focus:border-govblue-600'
                              } focus:outline-none focus:ring-1 focus:ring-govblue-600`}
                            />
                          </div>

                          {/* Source Snippet Reference */}
                          {item.sourceSnippet && (
                            <div className="mt-2 text-[11px] bg-slate-100/80 rounded px-2.5 py-1 text-slate-600 flex items-start gap-1.5">
                              <span className="font-semibold text-govblue-800 shrink-0">Source OCR Snippet:</span>
                              <span className="font-mono italic text-slate-700 truncate">
                                "{item.sourceSnippet}"
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Officer Action Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                      <Button
                        variant="danger"
                        size="md"
                        onClick={handleFlagDiscrepancy}
                        leftIcon={<XCircle className="w-4 h-4" />}
                      >
                        Flag Discrepancy
                      </Button>
                      <Button
                        variant="success"
                        size="md"
                        onClick={handleBatchApprove}
                        disabled={actionLoading}
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        {actionLoading ? 'Saving...' : 'Approve & Sanction All 12 Fields'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      ) : (
        /* Live Field Extractor Playground */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-govblue-700" />
                  <h3 className="text-base font-bold text-slate-900">OCR Text Input</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <select
                    className="text-xs font-semibold border border-slate-300 rounded px-2 py-1 bg-white text-slate-700"
                    value={selectedProvider}
                    onChange={(e: any) => setSelectedProvider(e.target.value)}
                  >
                    <option value="deterministic">Deterministic Heuristic Engine</option>
                    <option value="gemini">Gemini 1.5 Flash AI Engine</option>
                  </select>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Paste any scanned land deed, Jamabandi, or RoR transcript below to test structured 12-field extraction
                in real time.
              </p>

              <textarea
                rows={14}
                className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-govblue-600 leading-relaxed bg-slate-50 text-slate-800"
                value={sampleOcrText}
                onChange={(e) => setSampleOcrText(e.target.value)}
              />

              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={handleTestExtraction}
                disabled={extractingPlayground || !sampleOcrText.trim()}
                leftIcon={<Sparkles className="w-4 h-4 text-govamber-300" />}
              >
                {extractingPlayground ? 'Extracting Fields...' : 'Extract 12 Structured Fields'}
              </Button>
            </Card>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-govgreen-700" />
                  <h3 className="text-base font-bold text-slate-900">Extraction Results & Metadata</h3>
                </div>
                {playgroundResult && (
                  <Badge variant="success" size="sm">
                    Provider: {playgroundResult.provider}
                  </Badge>
                )}
              </div>

              {playgroundResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                      <div className="text-xs text-slate-500 font-semibold">Overall Confidence</div>
                      <div className="text-lg font-black text-govblue-900">
                        {(playgroundResult.overallConfidence * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                      <div className="text-xs text-slate-500 font-semibold">Extracted Fields</div>
                      <div className="text-lg font-black text-govgreen-700">
                        {playgroundResult.extractedFieldsCount} / 12
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                      <div className="text-xs text-slate-500 font-semibold">Missing Fields</div>
                      <div className="text-lg font-black text-slate-600">
                        {playgroundResult.missingFieldsCount}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {playgroundResult.fieldList.map((item: any) => (
                      <div
                        key={item.fieldName}
                        className={`p-3 rounded-lg border ${
                          item.isMissing
                            ? 'bg-slate-50/70 border-slate-200'
                            : item.isUncertain
                            ? 'bg-amber-50/40 border-amber-200'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">{item.fieldLabel}</span>
                          <Badge
                            variant={item.isMissing ? 'neutral' : item.isUncertain ? 'warning' : 'success'}
                            size="sm"
                          >
                            {item.status} ({Math.round(item.confidence * 100)}%)
                          </Badge>
                        </div>
                        <div className="text-xs font-semibold text-slate-800 mt-1">
                          {item.fieldValue ?? <span className="text-slate-400 italic">Explicitly Missing</span>}
                        </div>
                        {item.sourceSnippet && (
                          <div className="mt-1.5 text-[11px] text-slate-500 font-mono italic">
                            Line: "{item.sourceSnippet}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-500 text-xs">
                  Click "Extract 12 Structured Fields" to test the AI / Rule Extraction pipeline.
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
