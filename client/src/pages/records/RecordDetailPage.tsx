import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { LeafletParcelMap } from '../../components/maps/LeafletParcelMap';
import { LandRecordDTO, RecordStatus, UserRole } from '@land-digitization/shared';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/api';
import {
  ArrowLeft,
  Layers,
  MapPin,
  ShieldCheck,
  FileText,
  Check,
  CheckCircle2,
  AlertTriangle,
  History,
  Users,
  Hash,
  Download,
  Calendar,
  Compass,
  FileCheck,
  Edit3,
  Printer,
  Sparkles,
  Search,
  Eye,
  Activity,
  CheckCheck,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  XCircle,
} from 'lucide-react';

export const RecordDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [record, setRecord] = useState<LandRecordDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validation State
  const [validationReport, setValidationReport] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'VALIDATION' | 'MUTATIONS' | 'DOCUMENTS'>('OVERVIEW');
  const [resolvingIssueId, setResolvingIssueId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [isResolving, setIsResolving] = useState(false);

  // Status Update State for Officers
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<RecordStatus>(RecordStatus.VERIFIED);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchRecord = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/records/${id}`);
      setRecord(response.data.data);
      if (response.data.data?.status) {
        setNewStatus(response.data.data.status);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to retrieve land record dossier. Please check ID and server connection.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchValidation = async () => {
    if (!id) return;
    try {
      const res = await apiClient.get(`/validation/record/${id}`);
      if (res.data?.data) {
        setValidationReport(res.data.data);
      }
    } catch (e) {
      // Silently ignore if not yet run
    }
  };

  useEffect(() => {
    fetchRecord();
    fetchValidation();
  }, [id]);

  const handleRunValidation = async () => {
    if (!id) return;
    setIsValidating(true);
    try {
      const res = await apiClient.post('/validation/run', { landRecordId: id });
      setValidationReport(res.data.data);
      showToast('Automated validation engine executed successfully!', 'success', 'Audit Complete');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to run validation', 'danger');
    } finally {
      setIsValidating(false);
    }
  };

  const handleResolveIssue = async (issueId: string) => {
    if (!resolutionNotes || resolutionNotes.trim().length < 3) {
      showToast('Please provide officer resolution notes', 'warning');
      return;
    }

    setIsResolving(true);
    try {
      await apiClient.patch(`/validation/issue/${issueId}/resolve`, {
        resolutionNotes,
      });
      showToast('Validation issue marked as resolved', 'success');
      setResolvingIssueId(null);
      setResolutionNotes('');
      await fetchValidation();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to resolve issue', 'danger');
    } finally {
      setIsResolving(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!id || !record) return;
    setIsUpdating(true);
    setActionSuccess(null);
    try {
      await apiClient.patch(`/records/${id}`, { status: newStatus });
      setActionSuccess(`Record status updated to ${newStatus.replace(/_/g, ' ')} successfully.`);
      setShowStatusModal(false);
      await fetchRecord();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update record status.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="p-8 bg-white rounded-lg border border-slate-200 animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
          <div className="h-48 bg-slate-100 rounded mt-6" />
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="space-y-6">
        <Alert variant="danger">{error || 'Land record not found'}</Alert>
        <Link to="/records">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Registry Directory
          </Button>
        </Link>
      </div>
    );
  }

  // Construct GeoJSON FeatureCollection for Leaflet
  const parcelGeoJSON: any = record.parcel?.geometryJson
    ? {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: record.id,
            properties: {
              recordId: record.id,
              ulpin: record.ulpin,
              khasraNumber: record.khasraNumber,
              status: record.status,
            },
            geometry: record.parcel.geometryJson,
          },
        ],
      }
    : null;

  const mapCenter: [number, number] =
    record.parcel?.centroidLat && record.parcel?.centroidLng
      ? [record.parcel.centroidLat, record.parcel.centroidLng]
      : [26.9124, 75.7873];

  const canEditRecord = user?.role === UserRole.REVENUE_OFFICER || user?.role === UserRole.ADMIN;

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/records"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-govblue-700 hover:text-govblue-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Registry Search
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-slate-900 font-serif">
              Khasra #{record.khasraNumber}
            </h1>
            <StatusBadge status={record.status} />
          </div>
          <p className="text-xs font-mono text-slate-500">ULPIN: {record.ulpin}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleRunValidation}
            disabled={isValidating}
            leftIcon={<Activity className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin text-govblue-600' : 'text-govblue-600'}`} />}
          >
            {isValidating ? 'Executing Validation...' : 'Run Validation Audit'}
          </Button>

          {canEditRecord && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowStatusModal(true)}
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            >
              Update Title Status
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Dossier
          </Button>
        </div>
      </div>

      {actionSuccess && <Alert variant="success">{actionSuccess}</Alert>}

      {/* Main Identity Banner Card */}
      <Card className="p-6 bg-white border-slate-300 shadow-gov-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-govblue-700" />
              <span className="font-bold text-slate-900 text-sm">
                Village {record.location?.village || 'Rampur'}, Tehsil {record.location?.tehsil || 'Sanganer'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              District {record.location?.district || 'Jaipur'}, {record.location?.state || 'Rajasthan'}
              <span className="ml-2 font-mono text-[11px] text-slate-400">
                (Census Code: {record.location?.censusCode || 'RJ-JPR-001'})
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {validationReport && (
              <Badge
                variant={
                  validationReport.status === 'PASSED'
                    ? 'success'
                    : validationReport.status === 'WARNINGS'
                    ? 'warning'
                    : 'danger'
                }
                size="md"
              >
                Validation Score: {validationReport.overallScore}/100 ({validationReport.status})
              </Badge>
            )}
            <Link to="/map">
              <Button size="sm" variant="outline" leftIcon={<Layers className="w-4 h-4 text-govblue-600" />}>
                Inspect GIS Map
              </Button>
            </Link>
          </div>
        </div>

        {/* Core Attributes Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg text-xs border border-slate-200">
          <div>
            <span className="text-slate-500 font-medium">Registered Area</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {record.areaInSqMeters.toLocaleString('en-IN')} sq.m
            </p>
            <span className="text-[11px] text-slate-400">
              ≈ {(record.areaInSqMeters / 2529.28).toFixed(2)} Bigha
            </span>
          </div>

          <div>
            <span className="text-slate-500 font-medium">Land Classification</span>
            <p className="text-sm font-bold text-govnavy-900 mt-0.5 uppercase">
              {record.landType.replace(/_/g, ' ')}
            </p>
            <span className="text-[11px] text-slate-400">Revenue Code: AGR-101</span>
          </div>

          <div>
            <span className="text-slate-500 font-medium">Title Holders Count</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {record.owners?.length || 0} Co-Owner(s)
            </p>
            <span className="text-[11px] text-slate-400">Share Total: 100.0%</span>
          </div>

          <div>
            <span className="text-slate-500 font-medium">Registration Date</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {new Date(record.createdAt).toLocaleDateString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-400">
              Updated: {new Date(record.updatedAt).toLocaleDateString('en-IN')}
            </span>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'OVERVIEW'
              ? 'bg-govblue-50 text-govblue-900 border border-govblue-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Overview & Cadastral GIS
        </button>
        <button
          onClick={() => {
            setActiveTab('VALIDATION');
            if (!validationReport) handleRunValidation();
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'VALIDATION'
              ? 'bg-govblue-50 text-govblue-900 border border-govblue-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Automated Rule Validation & Integrity
          {validationReport && validationReport.issues?.length > 0 && (
            <span className="px-1.5 py-0.2 bg-govamber-200 text-govamber-900 rounded-full text-[10px] font-bold">
              {validationReport.issues.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'OVERVIEW' ? (
        /* Two-Column Grid: Left (Owners & Chain of Title), Right (GIS Map & Boundary) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Title Holders / Owners */}
            <Card className="p-5 bg-white border-slate-300 shadow-gov-sm space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Users className="w-4 h-4 text-govblue-600" />
                  Verified Title Holders & Ownership Shares
                </CardTitle>
                <Badge variant="navy" size="sm">
                  {record.owners?.length || 0} Registered
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold text-left">
                      <th className="py-2.5 px-3">Owner Legal Name</th>
                      <th className="py-2.5 px-3">Relation / Guardian</th>
                      <th className="py-2.5 px-3">Ownership Share</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {record.owners && record.owners.length > 0 ? (
                      record.owners.map((owner) => (
                        <tr key={owner.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900">{owner.fullName}</span>
                            {owner.identifierMasked && (
                              <span className="block text-[10px] text-slate-400 font-mono">
                                ID: {owner.identifierMasked}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {owner.relationType ? `${owner.relationType} ${owner.guardianName || ''}` : 'Direct Title'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-govnavy-900">
                              {(owner.shareFraction * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {owner.isPrimary ? (
                              <Badge variant="success" size="sm">
                                Primary
                              </Badge>
                            ) : (
                              <Badge variant="neutral" size="sm">
                                Co-Owner
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400">
                          No owner records attached to this title.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Chain of Title & Mutation Ledger */}
            <Card className="p-5 bg-white border-slate-300 shadow-gov-sm space-y-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <History className="w-4 h-4 text-govblue-600" />
                Chain of Title & Mutation Sanction Ledger
              </CardTitle>

              {record.ownershipHistory && record.ownershipHistory.length > 0 ? (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {record.ownershipHistory.map((item) => (
                    <div key={item.id} className="relative text-xs space-y-1">
                      <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-govblue-600 ring-4 ring-white" />
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          Order #{item.mutationOrderNumber} ({item.mutationType.replace(/_/g, ' ')})
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(item.mutationDate).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <p className="text-slate-600">
                        Transferred from <strong className="text-slate-800">{item.previousOwnerName}</strong> to{' '}
                        <strong className="text-slate-800">{item.newOwnerName}</strong> (Share:{' '}
                        {(item.transferredShare * 100).toFixed(0)}%)
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-3 text-center bg-slate-50 rounded">
                  No previous mutations recorded. Current registration is primary computerized baseline.
                </p>
              )}
            </Card>

            {/* Attached Legal Documents */}
            <Card className="p-5 bg-white border-slate-300 shadow-gov-sm space-y-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <FileCheck className="w-4 h-4 text-govblue-600" />
                Attached Deeds & SHA-256 Checksums
              </CardTitle>

              {record.documents && record.documents.length > 0 ? (
                <div className="space-y-2">
                  {record.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-govnavy-900" />
                          <span className="font-bold text-slate-900">{doc.fileName}</span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 truncate max-w-sm">
                          SHA-256: {doc.fileHash}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="info" size="sm">
                          {doc.documentType.replace(/_/g, ' ')}
                        </Badge>
                        <a
                          href={`/api/v1/documents/${doc.id}/view`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-slate-500 hover:text-govblue-600 hover:bg-slate-200 rounded"
                          title="View Document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`/api/v1/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-slate-500 hover:text-govblue-600 hover:bg-slate-200 rounded"
                          title="Download Document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-3 text-center bg-slate-50 rounded">
                  No physical deeds currently indexed for this computerized record.
                </p>
              )}
            </Card>
          </div>

          {/* Right Column (5 cols): Cadastral GIS & Boundary */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-5 bg-white border-slate-300 shadow-gov-sm space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Compass className="w-4 h-4 text-govblue-600" />
                  Cadastral Survey Map
                </CardTitle>
                <span className="text-[11px] font-mono text-slate-500">EPSG:4326</span>
              </div>

              {/* Leaflet Map Preview */}
              <div className="h-72 w-full rounded-lg overflow-hidden border border-slate-300 shadow-inner">
                {parcelGeoJSON ? (
                  <LeafletParcelMap geojsonData={parcelGeoJSON} center={mapCenter} zoom={16} />
                ) : (
                  <div className="h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
                    No cadastral boundary polygon mapped
                  </div>
                )}
              </div>

              {/* Boundaries Matrix */}
              {record.parcel && (
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1.5">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                    Surrounding Boundary Demarcation:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400">North: </span>
                      <span className="font-medium text-slate-700">{record.parcel.northBoundary || 'Survey Road'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">South: </span>
                      <span className="font-medium text-slate-700">{record.parcel.southBoundary || 'Khasra 102/5'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">East: </span>
                      <span className="font-medium text-slate-700">{record.parcel.eastBoundary || 'Canal Drain'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">West: </span>
                      <span className="font-medium text-slate-700">{record.parcel.westBoundary || 'Khasra 102/3'}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        /* VALIDATION & RULE INTEGRITY TAB */
        <div className="space-y-6">
          {/* Validation Header Summary Card */}
          <Card className="p-6 bg-white border-slate-300 shadow-gov-sm space-y-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-govblue-700" />
                  <h3 className="text-base font-bold text-slate-900">
                    Automated Cadastral & Legal Rule Engine
                  </h3>
                </div>
                <p className="text-xs text-slate-500 max-w-xl">
                  {validationReport?.summary ||
                    'Run the multi-tier deterministic validation engine to evaluate statutory completeness, area tolerance, ownership shares, duplicate detection, and chronological integrity.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunValidation}
                  disabled={isValidating}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-govamber-300" />}
                >
                  {isValidating ? 'Executing Engine...' : 'Re-run Validation Engine'}
                </Button>
              </div>
            </div>

            {/* Score & Category Meters */}
            {validationReport && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xs text-slate-500 font-semibold">Integrity Score</div>
                  <div
                    className={`text-2xl font-black mt-1 ${
                      validationReport.overallScore >= 85
                        ? 'text-govgreen-700'
                        : validationReport.overallScore >= 70
                        ? 'text-govamber-700'
                        : 'text-govred-700'
                    }`}
                  >
                    {validationReport.overallScore} / 100
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xs text-slate-500 font-semibold">Overall Status</div>
                  <div className="mt-1.5">
                    <Badge
                      variant={
                        validationReport.status === 'PASSED'
                          ? 'success'
                          : validationReport.status === 'WARNINGS'
                          ? 'warning'
                          : 'danger'
                      }
                      size="md"
                    >
                      {validationReport.status}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xs text-slate-500 font-semibold">Critical Defects</div>
                  <div className="text-2xl font-black mt-1 text-govred-700">
                    {validationReport.criticalIssuesCount}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xs text-slate-500 font-semibold">Warnings / Discrepancies</div>
                  <div className="text-2xl font-black mt-1 text-govamber-600">
                    {validationReport.warningIssuesCount}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Detailed Issues & Checks List */}
          {validationReport && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Rule Verification Checklist & Issue Ledger</span>
                <span className="text-xs font-normal text-slate-500">
                  {validationReport.issues?.length || 0} issue(s) detected
                </span>
              </h4>

              {validationReport.issues && validationReport.issues.length > 0 ? (
                validationReport.issues.map((issue: any) => (
                  <Card
                    key={issue.id}
                    className={`p-5 space-y-3 border ${
                      issue.isResolved
                        ? 'bg-slate-50/70 border-slate-200 opacity-75'
                        : issue.severity === 'CRITICAL'
                        ? 'bg-govred-50/30 border-govred-200'
                        : 'bg-govamber-50/30 border-govamber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {issue.isResolved ? (
                          <CheckCircle2 className="w-5 h-5 text-govgreen-600" />
                        ) : issue.severity === 'CRITICAL' ? (
                          <XCircle className="w-5 h-5 text-govred-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-govamber-600" />
                        )}
                        <span className="text-sm font-bold text-slate-900">{issue.title}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            issue.isResolved
                              ? 'success'
                              : issue.severity === 'CRITICAL'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {issue.isResolved ? 'RESOLVED' : issue.severity}
                        </Badge>
                        <span className="text-[11px] font-mono text-slate-400">{issue.ruleCode}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">{issue.explanation || issue.description}</p>

                    {/* Conflicting Values Comparison Box */}
                    {issue.conflictingValues && (
                      <div className="p-3 bg-white rounded border border-slate-200 text-xs font-mono space-y-1">
                        <div className="font-bold text-slate-800 text-[11px] font-sans uppercase mb-1">
                          Conflicting Values Detected:
                        </div>
                        {issue.conflictingValues.expected && (
                          <div className="text-govgreen-800">
                            <strong>Expected: </strong>
                            {issue.conflictingValues.expected}
                          </div>
                        )}
                        {issue.conflictingValues.actual && (
                          <div className="text-govred-800">
                            <strong>Actual Record: </strong>
                            {issue.conflictingValues.actual}
                          </div>
                        )}
                        {issue.conflictingValues.ocrExtracted && (
                          <div className="text-govblue-800">
                            <strong>Detected in Scanned Deed: </strong>
                            {issue.conflictingValues.ocrExtracted}
                          </div>
                        )}
                        {issue.conflictingValues.registered && (
                          <div className="text-slate-700">
                            <strong>Registered Title: </strong>
                            {issue.conflictingValues.registered}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Recommended Action */}
                    {issue.recommendedAction && (
                      <div className="text-xs bg-slate-100 rounded p-2.5 text-slate-700 flex items-start gap-1.5">
                        <span className="font-bold text-govblue-800 shrink-0">Recommended Action:</span>
                        <span>{issue.recommendedAction}</span>
                      </div>
                    )}

                    {/* Resolve Action Button for Officers */}
                    {canEditRecord && !issue.isResolved && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                        {resolvingIssueId === issue.id ? (
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="text"
                              placeholder="Enter officer resolution notes (e.g. Verified with physical ledger)..."
                              value={resolutionNotes}
                              onChange={(e) => setResolutionNotes(e.target.value)}
                              className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
                            />
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleResolveIssue(issue.id)}
                              disabled={isResolving || resolutionNotes.trim().length < 3}
                            >
                              Confirm
                            </Button>
                            <button
                              onClick={() => setResolvingIssueId(null)}
                              className="text-xs text-slate-500 hover:text-slate-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setResolvingIssueId(issue.id)}
                            leftIcon={<Check className="w-3.5 h-3.5" />}
                          >
                            Mark Issue as Resolved
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center space-y-2 bg-govgreen-50/30 border-govgreen-200">
                  <CheckCircle2 className="w-10 h-10 text-govgreen-600 mx-auto" />
                  <h4 className="text-base font-bold text-govgreen-900">Zero Rule Violations</h4>
                  <p className="text-xs text-govgreen-800">
                    This land title complies with all 8 statutory revenue rules and cadastral consistency checks.
                  </p>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Officer Status Management Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-slate-300 shadow-gov-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Update Land Record Status</h3>
            <p className="text-xs text-slate-500">
              Change official status for Khasra {record.khasraNumber} (ULPIN: {record.ulpin}). This action is logged into the national audit trail.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">Select Title Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as RecordStatus)}
                className="w-full text-xs font-medium border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-govnavy-900"
              >
                <option value={RecordStatus.VERIFIED}>VERIFIED - Certified Clean Title</option>
                <option value={RecordStatus.PENDING_VERIFICATION}>PENDING VERIFICATION - Under Survey Review</option>
                <option value={RecordStatus.DISPUTED}>DISPUTED - Overlap / Encroachment / Title Claim</option>
                <option value={RecordStatus.ARCHIVED}>ARCHIVED - Superseded by New Subdivision</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="ghost" size="sm" onClick={() => setShowStatusModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleUpdateStatus} isLoading={isUpdating}>
                Confirm Status Update
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
