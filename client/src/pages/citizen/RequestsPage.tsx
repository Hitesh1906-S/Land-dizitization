import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { RequestStage, WorkflowType, RequestDTO } from '@land-digitization/shared';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Alert } from '../../components/common/Alert';
import { Dialog } from '../../components/common/Dialog';
import { PlusCircle, Eye, Search, Filter, Clock, FileText, CheckCircle2, AlertTriangle, XCircle, ArrowRight, ShieldCheck, Download, UserCheck, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api';

export const RequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<RequestDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Request for Tracking Modal
  const [selectedRequest, setSelectedRequest] = useState<RequestDTO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (selectedStage !== 'ALL') {
        params.stage = selectedStage;
      }
      const res = await apiClient.get('/workflows', { params });
      if (res.data?.data) {
        setRequests(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load applications:', err);
      setError(err.response?.data?.error?.message || 'Failed to retrieve application records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [selectedStage]);

  const handleTrack = (req: RequestDTO) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  const filteredRequests = requests.filter((r) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.applicationNumber.toLowerCase().includes(query) ||
      r.requestType.toLowerCase().includes(query) ||
      (r.landRecord?.khasraNumber && r.landRecord.khasraNumber.toLowerCase().includes(query)) ||
      (r.landRecord?.location?.village && r.landRecord.location.village.toLowerCase().includes(query))
    );
  });

  const getStageStep = (stage: RequestStage | string): number => {
    switch (stage) {
      case RequestStage.SUBMITTED:
        return 1;
      case RequestStage.UNDER_REVIEW:
      case 'DOCUMENT_VERIFICATION':
        return 2;
      case RequestStage.PROCESSING:
      case 'FIELD_SURVEY':
      case 'OBJECTION_WINDOW':
        return 3;
      case RequestStage.NEEDS_CORRECTION:
        return 3;
      case RequestStage.VERIFIED:
      case 'FINAL_APPROVAL':
        return 4;
      case RequestStage.REJECTED:
        return 4;
      default:
        return 1;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Application Pipeline & Tracking"
        description="Monitor state progression of mutation orders, partition filings, and deed digitization requests across government review stages."
        breadcrumbs={[
          { label: 'Citizen Portal', href: '/citizen/dashboard' },
          { label: 'Applications' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRequests}
              isLoading={isLoading}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <Link to="/citizen/digitize">
              <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
                New Application
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filter Ribbon */}
      <Card className="p-4 bg-white border-slate-300">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-6">
            <Input
              placeholder="Search by Application No (e.g. DIG-2026-...) or Khasra..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <div className="md:col-span-6 flex items-center gap-3">
            <div className="flex-1">
              <Select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Lifecycle Stages' },
                  { value: RequestStage.SUBMITTED, label: 'Submitted' },
                  { value: RequestStage.UNDER_REVIEW, label: 'Under Review' },
                  { value: RequestStage.PROCESSING, label: 'Processing / Survey' },
                  { value: RequestStage.NEEDS_CORRECTION, label: 'Needs Correction' },
                  { value: RequestStage.VERIFIED, label: 'Verified / Approved' },
                  { value: RequestStage.REJECTED, label: 'Rejected' },
                ]}
              />
            </div>
            {selectedStage !== 'ALL' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedStage('ALL')}
                className="text-xs text-slate-500"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger">
          <div className="flex items-center justify-between w-full">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={fetchRequests}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 bg-white rounded-lg border border-slate-200 animate-pulse space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-slate-200 rounded w-36" />
                <div className="h-6 bg-slate-200 rounded w-24" />
              </div>
              <div className="h-4 bg-slate-100 rounded w-64" />
              <div className="h-3 bg-slate-100 rounded w-48" />
            </div>
          ))}
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const currentStep = getStageStep(req.stage);
            const isRejected = req.stage === RequestStage.REJECTED;
            const isCorrection = req.stage === RequestStage.NEEDS_CORRECTION;

            return (
              <Card
                key={req.id}
                className="p-5 bg-white border-slate-200 hover:border-govblue-300 transition-shadow hover:shadow-gov-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-govblue-900 bg-govblue-50 px-2.5 py-1 rounded border border-govblue-200">
                        {req.applicationNumber}
                      </span>
                      <StatusBadge status={req.stage} />
                      <Badge variant="neutral" size="sm">
                        {req.requestType.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400">Target Parcel:</span>{' '}
                        <strong className="text-slate-900">
                          {req.landRecord ? `Khasra ${req.landRecord.khasraNumber}` : 'New Computerized Holding'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Location:</span>{' '}
                        <span className="text-slate-800">
                          {req.landRecord?.location ? `${req.landRecord.location.village}, ${req.landRecord.location.tehsil}` : 'Jurisdiction Pending'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Submission Date:</span>{' '}
                        <span className="text-slate-800">
                          {new Date(req.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Officer defect notice or remarks */}
                    {(isCorrection || isRejected) && req.rejectionReason && (
                      <div className="mt-2 p-2.5 rounded bg-govred-50 border border-govred-200 text-xs text-govred-800 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-govred-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold">
                            {isCorrection ? 'Officer Defect Notice:' : 'Rejection Order:'}
                          </strong>{' '}
                          {req.rejectionReason}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column Action */}
                  <div className="flex items-center gap-3 self-end lg:self-center">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleTrack(req)}
                      leftIcon={<Eye className="w-4 h-4" />}
                    >
                      Track Application
                    </Button>
                  </div>
                </div>

                {/* Micro Progress Track */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
                    <span>Stage 1: Submitted</span>
                    <span>Stage 2: Under Review</span>
                    <span>Stage 3: Processing</span>
                    <span className={isRejected ? 'text-govred-700' : 'text-govgreen-700'}>
                      {isRejected ? 'Declined' : 'Stage 4: Verified'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        isRejected
                          ? 'bg-govred-600 w-full'
                          : isCorrection
                          ? 'bg-govamber-500 w-3/4'
                          : currentStep === 4
                          ? 'bg-govgreen-600 w-full'
                          : currentStep === 3
                          ? 'bg-govblue-600 w-3/4'
                          : currentStep === 2
                          ? 'bg-govamber-600 w-1/2'
                          : 'bg-govblue-500 w-1/4'
                      }`}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Filter className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">No Applications Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedStage !== 'ALL'
                ? 'No filed applications matched your filter criteria. Try resetting the filters.'
                : 'You have not submitted any land digitization or mutation applications yet.'}
            </p>
          </div>
          <div>
            <Link to="/citizen/digitize">
              <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
                File New Application
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Comprehensive Application Tracking Dialog */}
      {selectedRequest && (
        <Dialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Application Tracking Dossier - ${selectedRequest.applicationNumber}`}
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
              {selectedRequest.landRecordId && (
                <Link to={`/records/${selectedRequest.landRecordId}`}>
                  <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    View Land Dossier
                  </Button>
                </Link>
              )}
            </>
          }
        >
          <div className="space-y-6">
            {/* Status Header Ribbon */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-500">Application Type</p>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedRequest.requestType.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 text-right">Current Status</p>
                  <StatusBadge status={selectedRequest.stage} size="md" />
                </div>
              </div>

              {/* Progress Timeline Stepper */}
              <div className="pt-2">
                <div className="relative flex items-center justify-between">
                  {[
                    { key: RequestStage.SUBMITTED, label: 'Submitted', num: 1 },
                    { key: RequestStage.UNDER_REVIEW, label: 'Under Review', num: 2 },
                    { key: RequestStage.PROCESSING, label: 'Processing', num: 3 },
                    { key: RequestStage.VERIFIED, label: 'Verified', num: 4 },
                  ].map((step, idx) => {
                    const currentStep = getStageStep(selectedRequest.stage);
                    const isPassed = currentStep >= step.num;
                    const isCurrent = currentStep === step.num;

                    return (
                      <div key={step.key} className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                            isPassed
                              ? selectedRequest.stage === RequestStage.REJECTED && idx === 3
                                ? 'bg-govred-600 text-white'
                                : 'bg-govnavy-900 text-white shadow-gov-sm'
                              : 'bg-white border-2 border-slate-300 text-slate-400'
                          }`}
                        >
                          {isPassed ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                        </div>
                        <span
                          className={`text-[11px] font-semibold mt-1.5 ${
                            isCurrent ? 'text-govblue-900 font-bold' : isPassed ? 'text-slate-800' : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                  {/* Connecting line */}
                  <div className="absolute left-4 right-4 top-3.5 h-0.5 bg-slate-200 -z-0" />
                </div>
              </div>
            </div>

            {/* Rejection / Defect Notice Alert if applicable */}
            {selectedRequest.rejectionReason && (
              <Alert variant="danger">
                <div className="space-y-1">
                  <p className="font-bold text-xs">
                    {selectedRequest.stage === RequestStage.NEEDS_CORRECTION
                      ? 'Action Required: Official Defect Notice'
                      : 'Application Decision: Rejected'}
                  </p>
                  <p className="text-xs">{selectedRequest.rejectionReason}</p>
                </div>
              </Alert>
            )}

            {/* Target Land Record Info */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Land Parcel & Administrative Jurisdiction
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-white rounded border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block">Khasra Number:</span>
                  <span className="font-bold text-slate-900">
                    {selectedRequest.landRecord?.khasraNumber || 'New Digitization'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Village:</span>
                  <span className="font-bold text-slate-900">
                    {selectedRequest.landRecord?.location?.village || 'Rampur'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tehsil:</span>
                  <span className="font-bold text-slate-900">
                    {selectedRequest.landRecord?.location?.tehsil || 'Sanganer'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">District:</span>
                  <span className="font-bold text-slate-900">
                    {selectedRequest.landRecord?.location?.district || 'Jaipur'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Registered Area:</span>
                  <span className="font-bold text-slate-900">
                    {selectedRequest.landRecord?.areaInSqMeters ? `${selectedRequest.landRecord.areaInSqMeters.toLocaleString('en-IN')} sq.m` : 'As per Deed'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Officer:</span>
                  <span className="font-bold text-slate-900">
                    {selectedRequest.assignedOfficer ? selectedRequest.assignedOfficer.fullName : 'Tehsildar Office Queue'}
                  </span>
                </div>
              </div>
            </div>

            {/* Attached Supporting Deeds & Cryptographic Hash */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Attached Supporting Documents ({selectedRequest.documents?.length || 0})
              </h4>
              {selectedRequest.documents && selectedRequest.documents.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedRequest.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5 truncate max-w-[280px] sm:max-w-md">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-govnavy-900 shrink-0" />
                          <span className="font-bold text-slate-900 truncate">{doc.fileName}</span>
                          <Badge variant="navy" size="sm">
                            {doc.documentType.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="font-mono text-[10px] text-slate-400 truncate">
                          SHA-256: {doc.fileHash}
                        </p>
                      </div>
                      <a
                        href={`/api/v1/documents/${doc.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-govblue-600 hover:text-govblue-800 p-1.5 rounded hover:bg-slate-200"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-3 text-center bg-slate-50 rounded border border-slate-200">
                  No supporting physical documents indexed in this filing.
                </p>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
