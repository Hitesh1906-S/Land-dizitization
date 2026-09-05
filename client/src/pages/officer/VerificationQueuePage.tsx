import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
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
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Send,
  ArrowRight,
  Info,
  CheckCheck,
  Filter,
  FileCode2,
  FileCheck
} from 'lucide-react';

interface ExtractedFieldData {
  id: string;
  ocrResultId: string;
  fieldName: string;
  fieldLabel: string;
  fieldValue: string;
  confidence: number;
  sourceSnippet: string | null;
  isUncertain: boolean;
  isMissing: boolean;
  status: 'CONFIRMED' | 'UNCERTAIN' | 'MISSING';
  isVerified: boolean;
  verifiedValue?: string;
  verificationState: 'PENDING' | 'APPROVED' | 'CORRECTED' | 'REJECTED';
  rejectionReason?: string;
  history?: Array<{
    previousValue: string;
    correctedValue: string;
    correctedBy: string;
    reason: string;
    correctedAt: string;
  }>;
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

const FIELD_METADATA: Record<string, { label: string; placeholder: string; order: number }> = {
  owner: { label: '1. Primary Owner', placeholder: 'e.g. Ramesh Kumar Sharma', order: 1 },
  coOwner: { label: '2. Co-Owner / Joint Sharers', placeholder: 'e.g. Smt. Sunita Devi (50% Share)', order: 2 },
  khasraNumber: { label: '3. Khasra / Survey Number', placeholder: 'e.g. 142/4/1', order: 3 },
  plotNumber: { label: '4. Plot / Site Number', placeholder: 'e.g. 88-B, Sector 4', order: 4 },
  area: { label: '5. Land Area', placeholder: 'e.g. 0.8500 Hectares (8500 sq.m)', order: 5 },
  village: { label: '6. Village / Mauza', placeholder: 'e.g. Rampur Khurd', order: 6 },
  tehsil: { label: '7. Tehsil / Taluk', placeholder: 'e.g. Sanganer', order: 7 },
  district: { label: '8. District', placeholder: 'e.g. Jaipur', order: 8 },
  state: { label: '9. State', placeholder: 'e.g. Rajasthan', order: 9 },
  landType: { label: '10. Land Type / Classification', placeholder: 'e.g. Agricultural (कृषि)', order: 10 },
  registrationDate: { label: '11. Registration Date', placeholder: 'YYYY-MM-DD or DD/MM/YYYY', order: 11 },
  documentNumber: { label: '12. Document / Deed Ref No.', placeholder: 'e.g. DEED-2024-8891', order: 12 },
};

export const VerificationQueuePage: React.FC = () => {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<OCRDocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [fieldActionLoading, setFieldActionLoading] = useState<Record<string, boolean>>({});
  const [ocrData, setOcrData] = useState<any>(null);

  // Field Verification State
  const [fields, setFields] = useState<ExtractedFieldData[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [activeRejectingFieldId, setActiveRejectingFieldId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'ATTENTION' | 'VERIFIED'>('ALL');

  // Document Viewer State
  const [viewerTab, setViewerTab] = useState<'DOCUMENT' | 'RAW_OCR'>('DOCUMENT');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rawSearchQuery, setRawSearchQuery] = useState<string>('');

  // Send Back Modal State
  const [showSendBackModal, setShowSendBackModal] = useState<boolean>(false);
  const [sendBackReason, setSendBackReason] = useState<string>('');
  const [approveNotes, setApproveNotes] = useState<string>('');

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

        ocr.extractedFields.forEach((f: any) => {
          let meta: any = {
            sourceSnippet: null,
            isUncertain: false,
            isMissing: false,
            status: 'CONFIRMED',
            verificationState: 'PENDING',
          };

          if (f.boundingBoxJson) {
            try {
              meta = JSON.parse(f.boundingBoxJson);
            } catch (e) {}
          }

          const val = f.verifiedValue ?? f.fieldValue ?? '';
          fieldMap[f.id] = val;

          const metaDef = FIELD_METADATA[f.fieldName] || {
            label: f.fieldName,
            placeholder: '',
            order: 99,
          };

          const isLowConf = f.confidence < 0.75;
          const isMissing = meta.isMissing || !f.fieldValue || f.fieldValue.trim() === '';
          const isUncertain = meta.isUncertain || isLowConf;

          // Determine current verification state
          let vState: 'PENDING' | 'APPROVED' | 'CORRECTED' | 'REJECTED' = 'PENDING';
          if (meta.verificationState) {
            vState = meta.verificationState;
          } else if (f.isVerified) {
            vState = f.verifiedValue && f.verifiedValue !== f.fieldValue ? 'CORRECTED' : 'APPROVED';
          }

          parsedList.push({
            id: f.id,
            ocrResultId: f.ocrResultId,
            fieldName: f.fieldName,
            fieldLabel: metaDef.label,
            fieldValue: f.fieldValue,
            confidence: f.confidence,
            sourceSnippet: meta.sourceSnippet,
            isUncertain,
            isMissing,
            status: isMissing ? 'MISSING' : (isUncertain ? 'UNCERTAIN' : 'CONFIRMED'),
            isVerified: f.isVerified,
            verifiedValue: f.verifiedValue,
            verificationState: vState,
            rejectionReason: meta.rejectionReason,
            history: meta.history,
          });
        });

        // Sort fields by logical order
        parsedList.sort((a, b) => {
          const orderA = FIELD_METADATA[a.fieldName]?.order || 99;
          const orderB = FIELD_METADATA[b.fieldName]?.order || 99;
          return orderA - orderB;
        });

        setEditedValues(fieldMap);
        setFields(parsedList);
      }
    } catch (err: any) {
      setOcrData(null);
      setFields([]);
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

  // Field Level Actions
  const handleApproveField = async (fieldId: string) => {
    try {
      setFieldActionLoading((prev) => ({ ...prev, [fieldId]: true }));
      await apiClient.post(`/ocr/field/${fieldId}/approve`);
      showToast('Field approved successfully', 'success');
      await fetchOcrForDoc(selectedDocId);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to approve field', 'danger');
    } finally {
      setFieldActionLoading((prev) => ({ ...prev, [fieldId]: false }));
    }
  };

  const handleCorrectField = async (fieldId: string) => {
    const correctedValue = editedValues[fieldId];
    if (!correctedValue || correctedValue.trim() === '') {
      showToast('Please enter a valid corrected value', 'warning');
      return;
    }

    try {
      setFieldActionLoading((prev) => ({ ...prev, [fieldId]: true }));
      await apiClient.post(`/ocr/field/${fieldId}/correct`, {
        correctedValue,
        reason: 'Officer human verification & correction',
      });
      showToast('Field corrected and approved', 'success');
      await fetchOcrForDoc(selectedDocId);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to correct field', 'danger');
    } finally {
      setFieldActionLoading((prev) => ({ ...prev, [fieldId]: false }));
    }
  };

  const handleRejectField = async (fieldId: string) => {
    const reason = rejectionReasons[fieldId];
    if (!reason || reason.trim().length < 3) {
      showToast('Please enter a reason for rejecting this field', 'warning');
      return;
    }

    try {
      setFieldActionLoading((prev) => ({ ...prev, [fieldId]: true }));
      await apiClient.post(`/ocr/field/${fieldId}/reject`, {
        reason,
      });
      showToast('Field marked as rejected', 'info');
      setActiveRejectingFieldId(null);
      await fetchOcrForDoc(selectedDocId);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to reject field', 'danger');
    } finally {
      setFieldActionLoading((prev) => ({ ...prev, [fieldId]: false }));
    }
  };

  // Record Level Actions
  const handleApproveCompleteRecord = async () => {
    if (!selectedDocId) return;

    // Guardrail Check
    const unreviewedLowConf = fields.filter(
      (f) =>
        (f.confidence < 0.75 || f.isMissing || f.isUncertain) &&
        !['APPROVED', 'CORRECTED'].includes(f.verificationState)
    );

    if (unreviewedLowConf.length > 0) {
      showToast(
        `Cannot approve complete record: ${unreviewedLowConf.length} low-confidence/uncertain fields require your review or correction first.`,
        'warning',
        'Human Verification Required'
      );
      setFilterMode('ATTENTION');
      return;
    }

    try {
      setActionLoading(true);
      await apiClient.post(`/ocr/document/${selectedDocId}/approve-record`, {
        notes: approveNotes || 'All fields verified and sanctioned by Revenue Officer',
      });
      showToast(
        'Complete land record approved, sanitized, and digitized into registry!',
        'success',
        'Record Sanctioned'
      );
      await fetchOcrForDoc(selectedDocId);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to approve record', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendBackForCorrection = async () => {
    if (!selectedDocId) return;
    if (!sendBackReason || sendBackReason.trim().length < 5) {
      showToast('Please provide specific correction instructions for the citizen', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      await apiClient.post(`/ocr/document/${selectedDocId}/send-back`, {
        reason: sendBackReason,
      });
      showToast(
        'Document flagged as Needs Correction and sent back to citizen',
        'warning',
        'Correction Dispatched'
      );
      setShowSendBackModal(false);
      setSendBackReason('');
      await fetchOcrForDoc(selectedDocId);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to send back document', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  // Filter calculations
  const totalFields = fields.length;
  const verifiedCount = fields.filter((f) => ['APPROVED', 'CORRECTED'].includes(f.verificationState)).length;
  const lowConfidenceCount = fields.filter(
    (f) => (f.confidence < 0.75 || f.isMissing || f.isUncertain) && f.verificationState === 'PENDING'
  ).length;

  const filteredFields = fields.filter((f) => {
    if (filterMode === 'ATTENTION') {
      return (
        f.verificationState === 'REJECTED' ||
        ((f.confidence < 0.75 || f.isMissing || f.isUncertain) && f.verificationState === 'PENDING')
      );
    }
    if (filterMode === 'VERIFIED') {
      return ['APPROVED', 'CORRECTED'].includes(f.verificationState);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Human-in-the-Loop OCR Verification"
        description="Side-by-side deed comparison interface. Review AI-extracted fields, correct low-confidence OCR values, and sanction digital land records."
        breadcrumbs={[
          { label: 'Revenue Officer', href: '/officer/dashboard' },
          { label: 'OCR Verification Workstation' },
        ]}
        badge={
          <Badge variant="navy" size="sm">
            Interactive HITL Verification
          </Badge>
        }
      />

      {/* Top Document Selection & Master Control Bar */}
      <Card className="p-4 bg-slate-50 border border-slate-200">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <FileText className="w-5 h-5 text-govblue-700 shrink-0" />
            <div className="w-full lg:w-96">
              <select
                className="w-full text-sm font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-govblue-600 shadow-sm"
                value={selectedDocId}
                onChange={(e) => handleDocChange(e.target.value)}
              >
                {documents.length === 0 && <option value="">No documents in queue</option>}
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fileName} ({d.fileType.toUpperCase()} - {(d.fileSize / 1024).toFixed(0)} KB)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchOcrForDoc(selectedDocId)}
              disabled={loading || !selectedDocId}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRunOcr}
              disabled={actionLoading || !selectedDocId}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-govamber-600" />}
            >
              {actionLoading ? 'Running...' : 'Re-run OCR Engine'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowSendBackModal(true)}
              disabled={actionLoading || !selectedDocId}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Send Back for Correction
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleApproveCompleteRecord}
              disabled={actionLoading || !selectedDocId || totalFields === 0}
              leftIcon={<CheckCheck className="w-4 h-4" />}
            >
              Approve Complete Record
            </Button>
          </div>
        </div>
      </Card>

      {/* Low-Confidence Alert Warning Banner if unverified low-confidence fields exist */}
      {lowConfidenceCount > 0 && (
        <Alert
          variant="warning"
          title={`Action Required: ${lowConfidenceCount} Low-Confidence Field(s) Detected`}
        >
          <div className="text-xs text-govamber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              To prevent unverified AI estimates from being recorded into official land titles, you must review or
              correct all low-confidence and missing values before approving the complete record.
            </span>
            <button
              onClick={() => setFilterMode('ATTENTION')}
              className="font-bold underline text-govamber-950 hover:text-govamber-800 shrink-0 text-xs"
            >
              Filter Needs Attention
            </button>
          </div>
        </Alert>
      )}

      {/* Main Responsive Split Layout:
          Desktop: lg:grid-cols-12 (Col 6 LEFT document, Col 6 RIGHT fields)
          Mobile/Tablet: Stacked vertically
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =========================================================================
            LEFT COLUMN: SOURCE DOCUMENT INSPECTION & RAW OCR VIEWER
           ========================================================================= */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="p-5 flex flex-col h-[760px]">
            {/* Header with Viewer Tabs & Zoom Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewerTab('DOCUMENT')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    viewerTab === 'DOCUMENT'
                      ? 'bg-white text-govblue-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Source Deed Scan
                </button>
                <button
                  onClick={() => setViewerTab('RAW_OCR')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    viewerTab === 'RAW_OCR'
                      ? 'bg-white text-govblue-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  Raw OCR Transcript
                </button>
              </div>

              {viewerTab === 'DOCUMENT' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded border border-slate-200"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono font-semibold text-slate-600 px-1.5">
                    {zoomLevel}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(250, z + 15))}
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded border border-slate-200"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(100)}
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded border border-slate-200"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Document / Raw OCR Body */}
            <div className="flex-1 overflow-hidden mt-3 relative bg-slate-900 rounded-lg border border-slate-800 flex flex-col">
              {viewerTab === 'DOCUMENT' ? (
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                  {selectedDoc ? (
                    selectedDoc.fileType.includes('pdf') ? (
                      <iframe
                        src={`/api/v1/documents/${selectedDoc.id}/view`}
                        className="w-full h-full min-h-[580px] rounded border border-slate-700 bg-white"
                        title="Document Viewer"
                        style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                      />
                    ) : (
                      <img
                        src={`/api/v1/documents/${selectedDoc.id}/view`}
                        alt="Scanned Deed Document"
                        className="max-w-none transition-transform duration-150 rounded shadow-lg"
                        style={{ width: `${zoomLevel}%` }}
                      />
                    )
                  ) : (
                    <div className="text-center text-slate-400 text-xs">No document selected</div>
                  )}
                </div>
              ) : (
                /* Raw OCR Text Viewer with Search */
                <div className="flex-1 flex flex-col p-4 space-y-3 overflow-hidden">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search recognized OCR text..."
                      value={rawSearchQuery}
                      onChange={(e) => setRawSearchQuery(e.target.value)}
                      className="w-full text-xs bg-slate-800 border border-slate-700 text-slate-100 pl-8 pr-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-govblue-500"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto font-mono text-xs text-slate-200 p-3 rounded bg-slate-950 border border-slate-800 leading-relaxed whitespace-pre-wrap selection:bg-govblue-600">
                    {ocrData?.rawText ? (
                      ocrData.rawText
                    ) : (
                      <span className="text-slate-500 italic">No OCR text extracted yet.</span>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Metadata Ribbon */}
              <div className="bg-slate-950/80 backdrop-blur px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate font-mono">{selectedDoc?.fileName}</span>
                <span className="shrink-0 font-semibold text-slate-300">
                  OCR Engine: {ocrData?.engine || 'HYBRID'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: 12 EXTRACTED FIELDS & HUMAN VERIFICATION WORKBENCH
           ========================================================================= */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="p-5 flex flex-col h-[760px]">
            {/* Header & Verification Progress */}
            <div className="space-y-3 pb-3 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-govblue-700" />
                  <h3 className="text-base font-bold text-slate-900">Extracted Fields Audit</h3>
                </div>
                <Badge variant={verifiedCount === totalFields && totalFields > 0 ? 'success' : 'navy'} size="sm">
                  {verifiedCount} / {totalFields} Fields Verified
                </Badge>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setFilterMode('ALL')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded ${
                      filterMode === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({totalFields})
                  </button>
                  <button
                    onClick={() => setFilterMode('ATTENTION')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1 ${
                      filterMode === 'ATTENTION'
                        ? 'bg-govamber-600 text-white'
                        : 'bg-govamber-50 text-govamber-800 hover:bg-govamber-100'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Needs Attention ({lowConfidenceCount})
                  </button>
                  <button
                    onClick={() => setFilterMode('VERIFIED')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded ${
                      filterMode === 'VERIFIED'
                        ? 'bg-govgreen-700 text-white'
                        : 'bg-govgreen-50 text-govgreen-800 hover:bg-govgreen-100'
                    }`}
                  >
                    Verified ({verifiedCount})
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 font-medium">
                  {ocrData?.confidenceScore ? `Doc Conf: ${(ocrData.confidenceScore * 100).toFixed(0)}%` : ''}
                </span>
              </div>
            </div>

            {/* Scrollable Fields Verification List */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 mt-3">
              {filteredFields.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  {fields.length === 0
                    ? 'No extracted fields. Click "Re-run OCR Engine" to parse document.'
                    : 'No fields match the selected filter.'}
                </div>
              ) : (
                filteredFields.map((field) => {
                  const isLowConf = field.confidence < 0.75;
                  const isPending = field.verificationState === 'PENDING';
                  const isApproved = field.verificationState === 'APPROVED';
                  const isCorrected = field.verificationState === 'CORRECTED';
                  const isRejected = field.verificationState === 'REJECTED';
                  const isActionBusy = fieldActionLoading[field.id];

                  const confidencePct = (field.confidence * 100).toFixed(0);

                  return (
                    <div
                      key={field.id}
                      className={`p-3.5 rounded-lg border transition-all ${
                        isRejected
                          ? 'bg-govred-50/50 border-govred-300'
                          : isApproved
                          ? 'bg-govgreen-50/40 border-govgreen-300'
                          : isCorrected
                          ? 'bg-govblue-50/40 border-govblue-300'
                          : isLowConf || field.isMissing
                          ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Field Card Header: Title, Confidence Pill, Verification Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">{field.fieldLabel}</span>
                          {(isLowConf || field.isMissing) && isPending && (
                            <span className="flex items-center text-[10px] text-amber-700 bg-amber-100 font-semibold px-1.5 py-0.5 rounded">
                              <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                              Low Confidence
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={field.confidence >= 0.85 ? 'success' : isLowConf ? 'danger' : 'warning'}
                            size="sm"
                          >
                            {confidencePct}% Conf
                          </Badge>

                          {isApproved && (
                            <Badge variant="success" size="sm" withDot>
                              Approved
                            </Badge>
                          )}
                          {isCorrected && (
                            <Badge variant="navy" size="sm" withDot>
                              Corrected
                            </Badge>
                          )}
                          {isRejected && (
                            <Badge variant="danger" size="sm" withDot>
                              Rejected
                            </Badge>
                          )}
                          {isPending && (
                            <Badge variant="neutral" size="sm">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Editable Field Input */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editedValues[field.id] ?? ''}
                            placeholder={
                              field.isMissing ? 'Explicitly missing - Enter verified value' : 'Enter value'
                            }
                            onChange={(e) =>
                              setEditedValues({
                                ...editedValues,
                                [field.id]: e.target.value,
                              })
                            }
                            className={`w-full text-xs font-medium px-3 py-1.5 rounded border focus:outline-none focus:ring-2 ${
                              isLowConf && isPending
                                ? 'bg-amber-50/50 border-amber-300 focus:ring-amber-500 text-slate-900'
                                : 'bg-white border-slate-300 focus:ring-govblue-600 text-slate-900'
                            }`}
                          />
                        </div>

                        {/* Source OCR Snippet Reference */}
                        {field.sourceSnippet && (
                          <div className="text-[11px] bg-slate-100/90 rounded px-2.5 py-1 text-slate-600 flex items-start gap-1">
                            <span className="font-semibold text-govblue-800 shrink-0">Source OCR:</span>
                            <span className="font-mono italic text-slate-700 truncate">
                              "{field.sourceSnippet}"
                            </span>
                          </div>
                        )}

                        {/* Rejection Note Display */}
                        {isRejected && field.rejectionReason && (
                          <div className="text-[11px] bg-govred-100/80 rounded px-2.5 py-1 text-govred-800 flex items-center gap-1">
                            <span className="font-bold">Rejection Reason:</span>
                            <span>{field.rejectionReason}</span>
                          </div>
                        )}
                      </div>

                      {/* Field Action Buttons (Approve, Correct & Save, Reject) */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between gap-2">
                        <div className="text-[10px] text-slate-400">
                          {field.history && field.history.length > 0 && (
                            <span>Corrected {field.history.length} time(s)</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Inline Rejection Input Trigger */}
                          {activeRejectingFieldId === field.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                placeholder="Rejection reason..."
                                value={rejectionReasons[field.id] || ''}
                                onChange={(e) =>
                                  setRejectionReasons({
                                    ...rejectionReasons,
                                    [field.id]: e.target.value,
                                  })
                                }
                                className="text-[11px] px-2 py-1 border border-govred-300 rounded bg-white"
                              />
                              <Button
                                variant="danger"
                                size="sm"
                                disabled={isActionBusy}
                                onClick={() => handleRejectField(field.id)}
                              >
                                Confirm Reject
                              </Button>
                              <button
                                onClick={() => setActiveRejectingFieldId(null)}
                                className="text-xs text-slate-400 hover:text-slate-600 px-1"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => setActiveRejectingFieldId(field.id)}
                                disabled={isActionBusy}
                                className="px-2 py-1 text-[11px] font-semibold text-govred-700 hover:bg-govred-50 rounded border border-govred-200 transition-colors"
                              >
                                Reject
                              </button>

                              {editedValues[field.id] !== field.fieldValue ? (
                                <button
                                  onClick={() => handleCorrectField(field.id)}
                                  disabled={isActionBusy}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-govblue-700 hover:bg-govblue-50 rounded border border-govblue-200 flex items-center gap-1 transition-colors"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  Correct & Save
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleApproveField(field.id)}
                                  disabled={isActionBusy || isApproved}
                                  className={`px-2.5 py-1 text-[11px] font-semibold rounded border flex items-center gap-1 transition-colors ${
                                    isApproved
                                      ? 'bg-govgreen-100 text-govgreen-800 border-govgreen-300 opacity-80'
                                      : 'text-govgreen-700 hover:bg-govgreen-50 border-govgreen-200'
                                  }`}
                                >
                                  <Check className="w-3 h-3" />
                                  {isApproved ? 'Approved' : 'Approve Value'}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Footer Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                {verifiedCount === totalFields
                  ? 'All fields verified! Ready for title sanctioning.'
                  : `${totalFields - verifiedCount} field(s) pending officer review.`}
              </span>

              <Button
                variant="success"
                size="md"
                onClick={handleApproveCompleteRecord}
                disabled={actionLoading || totalFields === 0}
                leftIcon={<CheckCheck className="w-4 h-4" />}
              >
                {actionLoading ? 'Sanctioning...' : 'Approve Complete Record'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Send Back for Correction Modal Dialog */}
      {showSendBackModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-6 space-y-4 shadow-2xl bg-white">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-govamber-600" />
                <h3 className="text-base font-bold text-slate-900">Send Back for Correction</h3>
              </div>
              <button
                onClick={() => setShowSendBackModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This document and its associated citizen workflow request will be marked as{' '}
              <strong className="text-govamber-800">NEEDS_CORRECTION</strong>. The applicant will be notified to
              re-upload or provide clarified deed certificates.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Specific Officer Instructions / Defect Details</label>
              <textarea
                rows={4}
                className="w-full text-xs font-medium p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-govblue-600 text-slate-900 bg-white"
                placeholder="e.g. Scanned copy of Khasra 142/4 is partially illegible. Please submit high-resolution certified Jamabandi copy from Tehsil registrar."
                value={sendBackReason}
                onChange={(e) => setSendBackReason(e.target.value)}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <Button variant="secondary" size="sm" onClick={() => setShowSendBackModal(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleSendBackForCorrection}
                disabled={actionLoading || sendBackReason.trim().length < 5}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                {actionLoading ? 'Dispatching...' : 'Dispatch Defect Notice'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
