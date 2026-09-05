import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Dialog } from '../../components/common/Dialog';
import { Input } from '../../components/common/Input';
import {
  FileCheck,
  AlertTriangle,
  Layers,
  Clock,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Play,
  FileText,
  Copy,
  Activity,
  Search,
  ShieldCheck,
  User,
  MapPin,
  ExternalLink,
  Edit3,
  Check,
  AlertCircle,
  ChevronRight,
  Database,
} from 'lucide-react';
import {
  officerService,
  PendingQueueItem,
  OcrQueueItem,
  ValidationConflictItem,
  DuplicateQueueItem,
  RecentActivityItem,
} from '../../services/officerService';
import { OfficerDashboardStatsDTO, LandRecordDTO } from '@land-digitization/shared';

type ActiveTab = 'pending' | 'ocr' | 'validation' | 'duplicates' | 'activity';

export const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();

  // Dashboard Stats State
  const [stats, setStats] = useState<OfficerDashboardStatsDTO>({
    totalRecords: 0,
    digitized: 0,
    verified: 0,
    pending: 0,
    conflicts: 0,
    duplicates: 0,
  });
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('pending');

  // Operational Queues State
  const [pendingItems, setPendingItems] = useState<PendingQueueItem[]>([]);
  const [ocrItems, setOcrItems] = useState<OcrQueueItem[]>([]);
  const [validationItems, setValidationItems] = useState<ValidationConflictItem[]>([]);
  const [duplicateItems, setDuplicateItems] = useState<DuplicateQueueItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<RecentActivityItem[]>([]);
  const [isQueueLoading, setIsQueueLoading] = useState(false);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedRecord, setSelectedRecord] = useState<LandRecordDTO | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  const [selectedOcrItem, setSelectedOcrItem] = useState<OcrQueueItem | null>(null);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingFieldValue, setEditingFieldValue] = useState('');

  const [approveRecordId, setApproveRecordId] = useState<string | null>(null);
  const [approveRemarks, setApproveRemarks] = useState('');
  const [isApproveOpen, setIsApproveOpen] = useState(false);

  const [rejectRecordId, setRejectRecordId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const [resolveIssueItem, setResolveIssueItem] = useState<ValidationConflictItem | null>(null);
  const [issueNotes, setIssueNotes] = useState('');
  const [isResolveIssueOpen, setIsResolveIssueOpen] = useState(false);

  const [resolveDuplicateItem, setResolveDuplicateItem] = useState<DuplicateQueueItem | null>(null);
  const [duplicateNotes, setDuplicateNotes] = useState('');
  const [duplicateDecision, setDuplicateDecision] = useState<'RESOLVED' | 'DISMISSED'>('RESOLVED');
  const [isResolveDuplicateOpen, setIsResolveDuplicateOpen] = useState(false);

  // Action status message / notification
  const [actionNotification, setActionNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [isActionProcessing, setIsActionProcessing] = useState(false);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setActionNotification({ type, message });
    setTimeout(() => {
      setActionNotification(null);
    }, 4500);
  };

  // Fetch Dashboard Stats from Real DB
  const loadStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      const data = await officerService.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load officer dashboard stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // Fetch Current Active Queue Data
  const loadQueueData = useCallback(async () => {
    try {
      setIsQueueLoading(true);
      if (activeTab === 'pending') {
        const res = await officerService.getPendingQueue();
        setPendingItems(res.items);
      } else if (activeTab === 'ocr') {
        const res = await officerService.getOcrQueue();
        setOcrItems(res.items);
      } else if (activeTab === 'validation') {
        const res = await officerService.getValidationConflictsQueue();
        setValidationItems(res.items);
      } else if (activeTab === 'duplicates') {
        const res = await officerService.getDuplicatesQueue();
        setDuplicateItems(res.items);
      } else if (activeTab === 'activity') {
        const logs = await officerService.getRecentActivity(25);
        setActivityLogs(logs);
      }
    } catch (err: any) {
      console.error(`Failed to load queue data for ${activeTab}:`, err);
    } finally {
      setIsQueueLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadQueueData();
  }, [loadQueueData]);

  const refreshAll = () => {
    loadStats();
    loadQueueData();
    showNotification('info', 'Dashboard and operational queues refreshed.');
  };

  // Officer Action Handlers
  const handleOpenDossier = (record: LandRecordDTO) => {
    setSelectedRecord(record);
    setIsDossierOpen(true);
  };

  const handleRunValidation = async (recordId: string) => {
    try {
      setIsActionProcessing(true);
      const res = await officerService.runValidation(recordId);
      showNotification(
        res.isValid ? 'success' : 'info',
        `Validation executed: Score ${res.overallScore}/100 with ${res.issues?.length || 0} issues detected.`
      );
      loadStats();
      loadQueueData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to execute validation rules');
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleConfirmApprove = async () => {
    if (!approveRecordId) return;
    try {
      setIsActionProcessing(true);
      await officerService.approveRecord(approveRecordId, approveRemarks);
      showNotification('success', 'Land record approved successfully. Audit log recorded.');
      setIsApproveOpen(false);
      setApproveRecordId(null);
      setApproveRemarks('');
      loadStats();
      loadQueueData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to approve record');
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectRecordId || !rejectReason.trim()) {
      showNotification('error', 'Please specify a valid reason for rejection or dispute.');
      return;
    }
    try {
      setIsActionProcessing(true);
      await officerService.rejectRecord(rejectRecordId, rejectReason);
      showNotification('info', 'Land record marked as disputed. Audit log created.');
      setIsRejectOpen(false);
      setRejectRecordId(null);
      setRejectReason('');
      loadStats();
      loadQueueData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to reject record');
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleSaveFieldCorrection = async (fieldId: string) => {
    if (!editingFieldValue.trim()) return;
    try {
      setIsActionProcessing(true);
      await officerService.correctOcrField(fieldId, editingFieldValue.trim());
      showNotification('success', 'Field value corrected and verified. Audit log recorded.');
      setEditingFieldId(null);
      setEditingFieldValue('');
      // Reload OCR queue and update selected modal item
      const res = await officerService.getOcrQueue();
      setOcrItems(res.items);
      if (selectedOcrItem) {
        const updated = res.items.find((item) => item.ocrResultId === selectedOcrItem.ocrResultId);
        if (updated) setSelectedOcrItem(updated);
      }
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to correct field');
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleConfirmResolveIssue = async () => {
    if (!resolveIssueItem) return;
    try {
      setIsActionProcessing(true);
      await officerService.resolveValidationIssue(resolveIssueItem.id, issueNotes);
      showNotification('success', `Validation issue '${resolveIssueItem.ruleCode}' marked as resolved.`);
      setIsResolveIssueOpen(false);
      setResolveIssueItem(null);
      setIssueNotes('');
      loadStats();
      loadQueueData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to resolve validation issue');
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleConfirmResolveDuplicate = async () => {
    if (!resolveDuplicateItem) return;
    try {
      setIsActionProcessing(true);
      await officerService.resolveConflict(
        resolveDuplicateItem.id,
        duplicateNotes || (duplicateDecision === 'RESOLVED' ? 'Verified valid transaction' : 'Dismissed as false positive'),
        duplicateDecision
      );
      showNotification('success', `Conflict resolution recorded as ${duplicateDecision}.`);
      setIsResolveDuplicateOpen(false);
      setResolveDuplicateItem(null);
      setDuplicateNotes('');
      loadStats();
      loadQueueData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to resolve dispute');
    } finally {
      setIsActionProcessing(false);
    }
  };

  // Filter items based on search query
  const filteredPending = pendingItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.khasraNumber?.toLowerCase().includes(q) ||
      item.ulpin?.toLowerCase().includes(q) ||
      item.location?.village?.toLowerCase().includes(q) ||
      item.owners?.some((o) => o.fullName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionNotification && (
        <div
          className={`fixed bottom-5 right-5 z-50 p-4 rounded-lg shadow-gov-lg border flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-5 duration-200 ${
            actionNotification.type === 'success'
              ? 'bg-govgreen-50 border-govgreen-200 text-govgreen-900'
              : actionNotification.type === 'error'
              ? 'bg-govred-50 border-govred-200 text-govred-900'
              : 'bg-govblue-50 border-govblue-200 text-govblue-900'
          }`}
        >
          {actionNotification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-govgreen-600 shrink-0" />}
          {actionNotification.type === 'error' && <AlertCircle className="w-5 h-5 text-govred-600 shrink-0" />}
          {actionNotification.type === 'info' && <Activity className="w-5 h-5 text-govblue-600 shrink-0" />}
          <span>{actionNotification.message}</span>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Revenue Officer Console"
        description={`Administrative & Cadastral Jurisdiction: ${user?.jurisdictionDistrict || 'Jaipur'} District (Tehsil: ${user?.jurisdictionTehsil || 'Sanganer'}). Execute live verifications, OCR auditing, validation engine checks, and conflict resolutions.`}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Revenue Officer Portal' }]}
        badge={
          <Badge variant="navy" size="sm">
            Tehsildar Workspace
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={refreshAll}
              leftIcon={<RefreshCw className={`w-4 h-4 ${isStatsLoading || isQueueLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh Data
            </Button>
          </div>
        }
      />

      {/* Real Database Stats Cards (6 metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Total Records"
          value={isStatsLoading ? '...' : stats.totalRecords.toLocaleString()}
          icon={Database}
          color="navy"
          description="Master Registry"
        />
        <StatCard
          title="Digitized"
          value={isStatsLoading ? '...' : stats.digitized.toLocaleString()}
          icon={FileText}
          color="blue"
          description="Deeds Attached"
        />
        <StatCard
          title="Verified"
          value={isStatsLoading ? '...' : stats.verified.toLocaleString()}
          icon={CheckCircle2}
          color="green"
          description="Legally Sanctioned"
        />
        <StatCard
          title="Pending Review"
          value={isStatsLoading ? '...' : stats.pending.toLocaleString()}
          icon={Clock}
          color="amber"
          description="Awaiting Action"
        />
        <StatCard
          title="Rule Conflicts"
          value={isStatsLoading ? '...' : stats.conflicts.toLocaleString()}
          icon={AlertTriangle}
          color="red"
          description="Violations Flagged"
        />
        <StatCard
          title="Duplicates"
          value={isStatsLoading ? '...' : stats.duplicates.toLocaleString()}
          icon={Copy}
          color="navy"
          description="Spatial/Khasra Overlaps"
        />
      </div>

      {/* Operational Workbenches Hub */}
      <Card>
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'border-govnavy-900 text-govnavy-900 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Clock className="w-4 h-4 text-govamber-600" />
              <span>Pending Verification</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-govamber-100 text-govamber-800 font-mono font-bold">
                {stats.pending}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ocr')}
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'ocr'
                  ? 'border-govnavy-900 text-govnavy-900 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <FileText className="w-4 h-4 text-govblue-600" />
              <span>Low-Confidence OCR</span>
              {ocrItems.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-mono font-bold">
                  {ocrItems.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('validation')}
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'validation'
                  ? 'border-govnavy-900 text-govnavy-900 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-govred-600" />
              <span>Validation Conflicts</span>
              {stats.conflicts > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-govred-100 text-govred-800 font-mono font-bold">
                  {stats.conflicts}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('duplicates')}
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'duplicates'
                  ? 'border-govnavy-900 text-govnavy-900 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Copy className="w-4 h-4 text-purple-600" />
              <span>Duplicate Candidates</span>
              {stats.duplicates > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 font-mono font-bold">
                  {stats.duplicates}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'activity'
                  ? 'border-govnavy-900 text-govnavy-900 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Activity className="w-4 h-4 text-slate-600" />
              <span>Recent Activity & Audit Trail</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <CardContent className="p-6">
          {/* 1. Pending Verification Section */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by Khasra, ULPIN, Owner, or Village..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-govnavy-900"
                  />
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Showing {filteredPending.length} of {pendingItems.length} pending records
                </div>
              </div>

              {isQueueLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-govnavy-900 mb-2" />
                  <p className="text-sm font-medium">Querying PostgreSQL pending verification queue...</p>
                </div>
              ) : filteredPending.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-govgreen-600 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-slate-700">No Pending Records</p>
                  <p className="text-xs text-slate-500 mt-1">All land records in this jurisdiction are up-to-date and verified.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPending.map((record) => (
                    <div
                      key={record.id}
                      className="p-4 rounded-lg border border-slate-200 bg-white hover:border-govblue-300 hover:shadow-gov-xs transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-govnavy-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {record.ulpin}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            Khasra #{record.khasraNumber}
                          </span>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-xs font-medium text-slate-600">
                            Khatauni: {record.khatauniNumber || 'N/A'}
                          </span>
                          <Badge variant="warning" size="sm">
                            Pending Verification
                          </Badge>
                          {record.latestValidation && (
                            <Badge
                              variant={record.latestValidation.isValid ? 'success' : 'danger'}
                              size="sm"
                            >
                              Validation: {record.latestValidation.overallScore}%{' '}
                              {record.latestValidation.isValid ? 'Passed' : 'Issues'}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              <strong className="text-slate-800">Owner:</strong>{' '}
                              {record.owners?.find((o) => o.isPrimary)?.fullName || record.owners?.[0]?.fullName || 'Unknown'}
                              {record.owners && record.owners.length > 1 && ` (+${record.owners.length - 1} co-owners)`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              <strong className="text-slate-800">Village:</strong>{' '}
                              {record.location?.village || 'Unknown'}, {record.location?.tehsil || 'Sanganer'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              <strong className="text-slate-800">Area:</strong>{' '}
                              {record.areaInSqMeters?.toLocaleString()} m² ({record.landType})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDossier(record)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Open Dossier
                        </Button>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleRunValidation(record.id)}
                          disabled={isActionProcessing}
                          leftIcon={<Play className="w-3.5 h-3.5 text-govblue-600" />}
                        >
                          Validate
                        </Button>

                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setApproveRecordId(record.id);
                            setIsApproveOpen(true);
                          }}
                          disabled={isActionProcessing}
                          leftIcon={<Check className="w-3.5 h-3.5" />}
                        >
                          Approve
                        </Button>

                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            setRejectRecordId(record.id);
                            setIsRejectOpen(true);
                          }}
                          disabled={isActionProcessing}
                          leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        >
                          Dispute / Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. Low-Confidence OCR Section */}
          {activeTab === 'ocr' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">AI & OCR Audit Desk:</strong> Documents with optical confidence below 85% or unverified fields require manual officer review and verification. Corrections made are audited and persisted.
                </div>
              </div>

              {isQueueLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-govnavy-900 mb-2" />
                  <p className="text-sm font-medium">Loading scanned deeds and OCR fields...</p>
                </div>
              ) : ocrItems.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-govgreen-600 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-slate-700">All OCR Extractions Verified</p>
                  <p className="text-xs text-slate-500 mt-1">No scanned land documents are currently awaiting OCR field audit.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ocrItems.map((item) => (
                    <div
                      key={item.ocrResultId}
                      className="p-4 rounded-lg border border-slate-200 bg-white hover:border-govblue-300 hover:shadow-gov-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {item.fileName}
                          </span>
                          <Badge variant="navy" size="sm">
                            {item.documentType}
                          </Badge>
                          <Badge
                            variant={
                              item.confidenceScore >= 0.85
                                ? 'success'
                                : item.confidenceScore >= 0.65
                                ? 'warning'
                                : 'danger'
                            }
                            size="sm"
                          >
                            Confidence: {(item.confidenceScore * 100).toFixed(1)}%
                          </Badge>
                          {item.lowConfidenceFieldsCount > 0 && (
                            <span className="text-xs font-semibold text-govamber-800 bg-govamber-50 border border-govamber-200 px-2 py-0.5 rounded">
                              {item.lowConfidenceFieldsCount} Low-Confidence Field{item.lowConfidenceFieldsCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {item.landRecord && (
                          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                            <span>
                              <strong>Khasra:</strong> {item.landRecord.khasraNumber} ({item.landRecord.village})
                            </span>
                            <span>
                              <strong>Owner:</strong> {item.landRecord.primaryOwner || 'N/A'}
                            </span>
                            <span className="font-mono text-slate-500 text-[11px]">
                              ULPIN: {item.landRecord.ulpin}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setSelectedOcrItem(item);
                            setIsOcrModalOpen(true);
                          }}
                          leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                        >
                          Review & Correct Fields
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Validation Conflicts Section */}
          {activeTab === 'validation' && (
            <div className="space-y-4">
              <div className="p-3 bg-govred-50/70 border border-govred-200 rounded-lg text-xs text-govred-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-govred-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Deterministic Validation Issues:</strong> Rule violations discovered during automated validation engine runs. Officers can investigate affected cadastral plots and record formal resolutions.
                </div>
              </div>

              {isQueueLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-govnavy-900 mb-2" />
                  <p className="text-sm font-medium">Scanning for active validation conflicts...</p>
                </div>
              ) : validationItems.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <ShieldCheck className="w-8 h-8 text-govgreen-600 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-slate-700">Zero Validation Conflicts</p>
                  <p className="text-xs text-slate-500 mt-1">All land records passed consistency, ownership share, and spatial checks.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {validationItems.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-4 rounded-lg border border-govred-200 bg-govred-50/30 hover:border-govred-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={issue.severity === 'CRITICAL' ? 'danger' : 'warning'}
                            size="sm"
                          >
                            {issue.severity}
                          </Badge>
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {issue.ruleCode}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            • {issue.title}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 font-medium">{issue.description}</p>

                        {issue.record && (
                          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                            <span>
                              <strong>Khasra:</strong> {issue.record.khasraNumber} ({issue.record.village}, {issue.record.district})
                            </span>
                            <span>
                              <strong>Primary Owner:</strong> {issue.record.primaryOwner}
                            </span>
                            <span className="font-mono text-slate-500 text-[11px]">
                              ULPIN: {issue.record.ulpin}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setResolveIssueItem(issue);
                            setIsResolveIssueOpen(true);
                          }}
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-govgreen-600" />}
                        >
                          Resolve Conflict
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. Duplicate Candidates Section */}
          {activeTab === 'duplicates' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-xs text-purple-900 flex items-start gap-2.5">
                <Copy className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Candidate Duplicate & Overlap Review:</strong> Automatic multi-criteria similarity matching detected potential record overlaps or duplicate Khasras. Strictly requires human review—no automated merging.
                </div>
              </div>

              {isQueueLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-govnavy-900 mb-2" />
                  <p className="text-sm font-medium">Scanning duplicate registry candidates...</p>
                </div>
              ) : duplicateItems.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-govgreen-600 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-slate-700">No Open Duplicate Disputes</p>
                  <p className="text-xs text-slate-500 mt-1">Duplicate detection engine reports no unresolved candidate matches.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {duplicateItems.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="p-4 rounded-lg border border-purple-200 bg-purple-50/20 hover:border-purple-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="info" size="sm">
                            {candidate.conflictType}
                          </Badge>
                          <Badge variant="warning" size="sm">
                            {candidate.status}
                          </Badge>
                          {candidate.overlapPercentage && (
                            <span className="text-xs font-bold text-govred-800">
                              Overlap: {candidate.overlapPercentage.toFixed(1)}% ({candidate.overlapAreaSqM} m²)
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-white p-3 rounded border border-purple-100">
                          <div className="border-l-2 border-govblue-600 pl-2">
                            <span className="font-bold text-slate-800 block">Primary Record</span>
                            <span className="text-slate-600">
                              Khasra #{candidate.primaryRecord?.khasraNumber} • {candidate.primaryRecord?.village}
                            </span>
                            <span className="text-slate-500 block">
                              Owner: {candidate.primaryRecord?.primaryOwner} ({candidate.primaryRecord?.areaInSqMeters} m²)
                            </span>
                          </div>

                          <div className="border-l-2 border-govamber-600 pl-2">
                            <span className="font-bold text-slate-800 block">Conflicting Record</span>
                            <span className="text-slate-600">
                              Khasra #{candidate.conflictingRecord?.khasraNumber} • {candidate.conflictingRecord?.village}
                            </span>
                            <span className="text-slate-500 block">
                              Owner: {candidate.conflictingRecord?.primaryOwner} ({candidate.conflictingRecord?.areaInSqMeters} m²)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setResolveDuplicateItem(candidate);
                            setIsResolveDuplicateOpen(true);
                          }}
                          leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-purple-600" />}
                        >
                          Resolve Dispute
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. Recent Activity & Audit Trail Stream */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-700">
                  Immutable Government Audit Trail (Live PostgreSQL Stream)
                </span>
                <span className="text-xs text-slate-400 font-mono">Real-time</span>
              </div>

              {isQueueLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-govnavy-900 mb-2" />
                  <p className="text-sm font-medium">Fetching recent audit ledger entries...</p>
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-slate-700">No Recent Activity</p>
                  <p className="text-xs text-slate-500 mt-1">Audit logs will stream here as records are processed.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              log.action.includes('VERIFY') || log.action.includes('APPROVE')
                                ? 'success'
                                : log.action.includes('REJECT')
                                ? 'danger'
                                : log.action.includes('RESOLVE')
                                ? 'navy'
                                : 'info'
                            }
                            size="sm"
                          >
                            {log.action}
                          </Badge>
                          <span className="font-bold text-slate-800">{log.entityType}</span>
                          <span className="font-mono text-slate-500 text-[11px]">#{log.entityId.slice(0, 8)}</span>
                        </div>
                        <p className="text-slate-600">
                          By <strong className="text-slate-900">{log.actor.fullName}</strong> ({log.actor.roleName})
                        </p>
                        {log.snapshotDiff && typeof log.snapshotDiff === 'object' && (
                          <div className="bg-white p-2 rounded border border-slate-200 font-mono text-[11px] text-slate-700 mt-1">
                            {log.snapshotDiff.remarks ||
                              log.snapshotDiff.rejectionReason ||
                              log.snapshotDiff.action ||
                              JSON.stringify(log.snapshotDiff)}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================= MODALS & DIALOGS ================= */}

      {/* 1. Full Land Record Dossier Modal */}
      {selectedRecord && (
        <Dialog
          isOpen={isDossierOpen}
          onClose={() => setIsDossierOpen(false)}
          title={`Land Record Dossier • ULPIN ${selectedRecord.ulpin}`}
          description={`Comprehensive cadastral registry details for Khasra #${selectedRecord.khasraNumber}`}
          size="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-slate-500">
                Status: <Badge variant={selectedRecord.status === 'VERIFIED' ? 'success' : 'warning'} size="sm">{selectedRecord.status}</Badge>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setIsDossierOpen(false)}>
                Close Dossier
              </Button>
            </div>
          }
        >
          <div className="space-y-5 text-xs sm:text-sm">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 text-xs block">Survey / Khasra No</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{selectedRecord.khasraNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Khatauni Account</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{selectedRecord.khatauniNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Registered Area</span>
                <span className="font-bold text-slate-900 text-sm">{selectedRecord.areaInSqMeters?.toLocaleString()} m²</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Classification</span>
                <span className="font-bold text-slate-900 text-sm">{selectedRecord.landType}</span>
              </div>
            </div>

            {/* Location */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-govblue-600" />
                Administrative Jurisdiction
              </h4>
              <div className="p-3 bg-white rounded border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div><strong>State:</strong> {selectedRecord.location?.state || 'Rajasthan'}</div>
                <div><strong>District:</strong> {selectedRecord.location?.district || 'Jaipur'}</div>
                <div><strong>Tehsil:</strong> {selectedRecord.location?.tehsil || 'Sanganer'}</div>
                <div><strong>Village:</strong> {selectedRecord.location?.village || 'Rampur'}</div>
              </div>
            </div>

            {/* Owners */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <User className="w-4 h-4 text-govgreen-600" />
                Title Holders & Share Allocation ({selectedRecord.owners?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Owner Name</th>
                      <th className="p-2.5">Relation / Guardian</th>
                      <th className="p-2.5">Share %</th>
                      <th className="p-2.5">Primary Title</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {selectedRecord.owners?.map((owner) => (
                      <tr key={owner.id}>
                        <td className="p-2.5 font-bold text-slate-900">{owner.fullName}</td>
                        <td className="p-2.5 text-slate-600">{owner.relationType} {owner.guardianName || 'N/A'}</td>
                        <td className="p-2.5 font-mono font-bold text-govblue-700">{(owner.shareFraction * 100).toFixed(1)}%</td>
                        <td className="p-2.5">
                          {owner.isPrimary ? <Badge variant="success" size="sm">Primary</Badge> : <Badge variant="neutral" size="sm">Co-owner</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Attached Documents */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-govnavy-900" />
                Attached Legal Deeds & OCR Status ({selectedRecord.documents?.length || 0})
              </h4>
              {selectedRecord.documents && selectedRecord.documents.length > 0 ? (
                <div className="space-y-2">
                  {selectedRecord.documents.map((doc) => (
                    <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{doc.fileName}</span>
                        <span className="text-slate-500 block">Type: {doc.documentType} • Size: {(doc.fileSize / 1024).toFixed(1)} KB</span>
                      </div>
                      <Badge variant={doc.ocrResult ? 'success' : 'warning'} size="sm">
                        {doc.ocrResult ? `OCR: ${(Number(doc.ocrResult.confidenceScore || 0) * 100).toFixed(0)}%` : 'No OCR'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No legal deeds attached to this record yet.</p>
              )}
            </div>
          </div>
        </Dialog>
      )}

      {/* 2. OCR Review & Field Correction Modal */}
      {selectedOcrItem && (
        <Dialog
          isOpen={isOcrModalOpen}
          onClose={() => {
            setIsOcrModalOpen(false);
            setEditingFieldId(null);
          }}
          title={`Document OCR Audit • ${selectedOcrItem.fileName}`}
          description={`Optical confidence score: ${(selectedOcrItem.confidenceScore * 100).toFixed(1)}% (Engine: ${selectedOcrItem.engine})`}
          size="lg"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setIsOcrModalOpen(false)}>
              Done
            </Button>
          }
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900">Document Type: {selectedOcrItem.documentType}</span>
                <span className="text-slate-500 block text-xs">Path: {selectedOcrItem.filePath}</span>
              </div>
              <Badge
                variant={selectedOcrItem.confidenceScore >= 0.85 ? 'success' : 'warning'}
                size="sm"
              >
                Score: {(selectedOcrItem.confidenceScore * 100).toFixed(1)}%
              </Badge>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2">Granular Extracted Fields Audit</h4>
              <div className="space-y-2.5">
                {selectedOcrItem.extractedFields.map((field) => {
                  const isLowConf = field.confidence < 0.85;
                  const isEditing = editingFieldId === field.id;

                  return (
                    <div
                      key={field.id}
                      className={`p-3 rounded-lg border transition-all ${
                        isLowConf ? 'bg-govamber-50/50 border-govamber-300' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-bold text-slate-800 text-xs">{field.fieldName}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isLowConf ? 'bg-govamber-200 text-govamber-900' : 'bg-govgreen-100 text-govgreen-800'
                            }`}
                          >
                            {(field.confidence * 100).toFixed(0)}% Conf
                          </span>
                          {field.isVerified && <Badge variant="success" size="sm">Verified</Badge>}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={editingFieldValue}
                            onChange={(e) => setEditingFieldValue(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-govblue-400 rounded focus:outline-none focus:ring-1 focus:ring-govblue-600"
                            placeholder="Enter corrected value..."
                          />
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleSaveFieldCorrection(field.id)}
                            disabled={isActionProcessing}
                          >
                            Save & Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingFieldId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between pt-1">
                          <span className="font-semibold text-slate-900 text-sm">
                            {field.verifiedValue || field.fieldValue}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingFieldId(field.id);
                              setEditingFieldValue(field.verifiedValue || field.fieldValue);
                            }}
                            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                          >
                            Correct
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* 3. Approve Record Dialog */}
      <Dialog
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        title="Confirm Land Record Verification"
        description="This will legally sanction the land record and transition status to VERIFIED."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmApprove}
              disabled={isActionProcessing}
              leftIcon={<Check className="w-4 h-4" />}
            >
              {isActionProcessing ? 'Verifying...' : 'Confirm Approval'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs sm:text-sm">
          <div className="p-3 bg-govgreen-50 border border-govgreen-200 rounded text-govgreen-900 text-xs">
            An immutable audit log will be created recording your credentials, timestamp, and verification remarks.
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Endorsement Remarks (Optional)
            </label>
            <textarea
              rows={3}
              value={approveRemarks}
              onChange={(e) => setApproveRemarks(e.target.value)}
              placeholder="e.g. Scanned sale deed and Khasra survey boundaries verified in order."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-govnavy-900"
            />
          </div>
        </div>
      </Dialog>

      {/* 4. Reject / Dispute Record Dialog */}
      <Dialog
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="Dispute / Reject Land Record"
        description="Flag this record with disputed status and notify applicant."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmReject}
              disabled={isActionProcessing || !rejectReason.trim()}
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              {isActionProcessing ? 'Recording...' : 'Confirm Dispute / Rejection'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs sm:text-sm">
          <div className="p-3 bg-govred-50 border border-govred-200 rounded text-govred-900 text-xs">
            Mandatory: State clear legal or boundary grounds for disputing this land record.
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Rejection / Dispute Grounds <span className="text-govred-600">*</span>
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Missing certified mutation sanction order or conflicting title claims."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-govred-600"
            />
          </div>
        </div>
      </Dialog>

      {/* 5. Resolve Validation Issue Dialog */}
      {resolveIssueItem && (
        <Dialog
          isOpen={isResolveIssueOpen}
          onClose={() => setIsResolveIssueOpen(false)}
          title={`Resolve Validation Issue • ${resolveIssueItem.ruleCode}`}
          description={resolveIssueItem.title}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsResolveIssueOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmResolveIssue}
                disabled={isActionProcessing}
              >
                Mark as Resolved
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700">
              {resolveIssueItem.description}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Resolution Notes
              </label>
              <textarea
                rows={3}
                value={issueNotes}
                onChange={(e) => setIssueNotes(e.target.value)}
                placeholder="e.g. Field surveyor verified boundary alignment manually on site."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-govnavy-900"
              />
            </div>
          </div>
        </Dialog>
      )}

      {/* 6. Resolve Duplicate Dispute Dialog */}
      {resolveDuplicateItem && (
        <Dialog
          isOpen={isResolveDuplicateOpen}
          onClose={() => setIsResolveDuplicateOpen(false)}
          title="Resolve Duplicate Candidate / Spatial Overlap"
          description={`Conflict Type: ${resolveDuplicateItem.conflictType}`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsResolveDuplicateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmResolveDuplicate}
                disabled={isActionProcessing}
              >
                Record Resolution
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Resolution Verdict
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDuplicateDecision('RESOLVED')}
                  className={`p-2.5 rounded border text-xs font-bold text-center transition-all ${
                    duplicateDecision === 'RESOLVED'
                      ? 'border-govgreen-600 bg-govgreen-50 text-govgreen-900'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  Legitimate Mutation / Resolved
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateDecision('DISMISSED')}
                  className={`p-2.5 rounded border text-xs font-bold text-center transition-all ${
                    duplicateDecision === 'DISMISSED'
                      ? 'border-purple-600 bg-purple-50 text-purple-900'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  False Positive / Dismiss
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Formal Resolution Ledger Notes
              </label>
              <textarea
                rows={3}
                value={duplicateNotes}
                onChange={(e) => setDuplicateNotes(e.target.value)}
                placeholder="State the basis of your administrative decision..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-govnavy-900"
              />
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
