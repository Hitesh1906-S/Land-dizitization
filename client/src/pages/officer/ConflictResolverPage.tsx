import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { Dialog } from '../../components/common/Dialog';
import {
  AlertTriangle,
  CheckCircle2,
  Layers,
  Search,
  RefreshCw,
  Sparkles,
  ArrowRightLeft,
  UserCheck,
  Clock,
  Check,
  XCircle,
  Eye,
  Sliders,
  Scale,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/api';
import { DuplicateCandidateDTO, ConflictStatus, ConflictType } from '@land-digitization/shared';

export const ConflictResolverPage: React.FC = () => {
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState<DuplicateCandidateDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Resolution Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<DuplicateCandidateDTO | null>(null);
  const [resolveStatus, setResolveStatus] = useState<ConflictStatus>(ConflictStatus.RESOLVED);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/conflicts');
      setCandidates(res.data?.data || []);
    } catch (err: any) {
      console.error('Failed to load duplicate candidates:', err);
      showToast('Could not load conflict candidates from registry', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleGlobalScan = async () => {
    try {
      setScanning(true);
      const res = await apiClient.post('/conflicts/scan-all');
      showToast(
        res.data?.message || 'Global duplicate scan completed successfully.',
        'success',
        'Duplicate Scan'
      );
      await fetchCandidates();
    } catch (err: any) {
      console.error('Error running duplicate scan:', err);
      showToast('Failed to execute duplicate scan', 'danger');
    } finally {
      setScanning(false);
    }
  };

  const handleOpenResolveModal = (candidate: DuplicateCandidateDTO) => {
    setSelectedCandidate(candidate);
    setResolveStatus(
      candidate.status === ConflictStatus.RESOLVED
        ? ConflictStatus.RESOLVED
        : ConflictStatus.RESOLVED
    );
    setResolutionNotes(candidate.resolutionNotes || '');
  };

  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    if (!resolutionNotes.trim()) {
      showToast('Please provide mandatory resolution notes / rationale', 'warning');
      return;
    }

    try {
      setResolving(true);
      await apiClient.patch(`/conflicts/${selectedCandidate.id}/resolve`, {
        status: resolveStatus,
        resolutionNotes: resolutionNotes.trim(),
      });

      showToast(
        `Conflict decision marked as ${resolveStatus}. Audit trail logged.`,
        'success',
        'Human Review Recorded'
      );
      setSelectedCandidate(null);
      await fetchCandidates();
    } catch (err: any) {
      console.error('Error submitting resolution decision:', err);
      showToast(
        err.response?.data?.message || 'Failed to submit resolution decision',
        'danger'
      );
    } finally {
      setResolving(false);
    }
  };

  // Filtered Candidates
  const filteredCandidates = candidates.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && c.conflictType !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchKhasraA = c.primaryRecord?.khasraNumber?.toLowerCase().includes(q);
      const matchKhasraB = c.conflictingRecord?.khasraNumber?.toLowerCase().includes(q);
      const matchUlpinA = c.primaryRecord?.ulpin?.toLowerCase().includes(q);
      const matchUlpinB = c.conflictingRecord?.ulpin?.toLowerCase().includes(q);
      const matchOwnerA = c.primaryRecord?.owners?.some((o) => o.fullName.toLowerCase().includes(q));
      const matchOwnerB = c.conflictingRecord?.owners?.some((o) => o.fullName.toLowerCase().includes(q));
      return matchKhasraA || matchKhasraB || matchUlpinA || matchUlpinB || matchOwnerA || matchOwnerB;
    }
    return true;
  });

  // Statistics
  const openCount = candidates.filter((c) => c.status === ConflictStatus.OPEN).length;
  const investigatingCount = candidates.filter((c) => c.status === ConflictStatus.INVESTIGATING).length;
  const resolvedCount = candidates.filter((c) => c.status === ConflictStatus.RESOLVED).length;
  const dismissedCount = candidates.filter((c) => c.status === ConflictStatus.DISMISSED).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Duplicate Detection & Dispute Workbench"
        description="Multi-vector similarity engine comparing Khasra numbers, titleholders, geographic hierarchy, area tolerances, and registration deeds. Zero automated merging: authorized human determination required."
        breadcrumbs={[
          { label: 'Revenue Officer', href: '/officer/dashboard' },
          { label: 'Duplicate & Dispute Workbench' },
        ]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={handleGlobalScan}
            isLoading={scanning}
            leftIcon={<Sparkles className="w-4 h-4 text-govblue-600" />}
          >
            Run Duplicate Scan Across Records
          </Button>
        }
      />

      {/* Statistical Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Open Disputes</span>
            <AlertTriangle className="w-4 h-4 text-govred-600" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-govred-700">{openCount}</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Under Investigation</span>
            <Clock className="w-4 h-4 text-govamber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-govamber-700">{investigatingCount}</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-govgreen-600" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-govgreen-700">{resolvedCount}</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Dismissed (False Positives)</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-slate-700">{dismissedCount}</p>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Khasra, ULPIN, or Owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Sliders className="w-3.5 h-3.5" />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-medium border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-govblue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value={ConflictStatus.OPEN}>Open</option>
                <option value={ConflictStatus.INVESTIGATING}>Under Investigation</option>
                <option value={ConflictStatus.RESOLVED}>Resolved</option>
                <option value={ConflictStatus.DISMISSED}>Dismissed</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs font-medium border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-govblue-500"
              >
                <option value="ALL">All Types</option>
                <option value={ConflictType.DUPLICATE_KHASRA}>Duplicate Khasra</option>
                <option value={ConflictType.FUZZY_DUPLICATE}>Fuzzy Match Duplicate</option>
                <option value={ConflictType.SPATIAL_OVERLAP}>Spatial Polygon Overlap</option>
                <option value={ConflictType.TITLE_DISPUTE}>Title Dispute</option>
                <option value={ConflictType.AREA_DISCREPANCY}>Area Discrepancy</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchCandidates}
              isLoading={loading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Candidate List / Comparison Cards */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin text-govblue-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading duplicate candidate comparison pairs...</p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <CheckCircle2 className="w-12 h-12 text-govgreen-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Conflict Candidates Match Filter</h3>
          <p className="text-xs text-slate-500 mt-1">
            All registered land records have clear cadastral separation and title integrity.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={handleGlobalScan}
            isLoading={scanning}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Trigger Fresh Duplicate Scan
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredCandidates.map((candidate) => {
            const score = candidate.scoreBreakdown?.compositeScore || candidate.overlapPercentage || 0;
            const isHigh = score >= 80;
            const isMedium = score >= 60 && score < 80;

            return (
              <Card
                key={candidate.id}
                className={`overflow-hidden border transition-all ${
                  candidate.status === ConflictStatus.OPEN
                    ? isHigh
                      ? 'border-govred-300 shadow-sm'
                      : 'border-govamber-300 shadow-sm'
                    : 'border-slate-200'
                }`}
              >
                {/* Header Strip */}
                <div
                  className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
                    candidate.status === ConflictStatus.OPEN
                      ? isHigh
                        ? 'bg-govred-50/60 border-govred-100'
                        : 'bg-govamber-50/60 border-govamber-100'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                        isHigh
                          ? 'bg-govred-100 text-govred-700'
                          : isMedium
                          ? 'bg-govamber-100 text-govamber-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          PAIR: {candidate.id.substring(0, 8)}
                        </span>
                        <Badge
                          variant={
                            candidate.conflictType === ConflictType.DUPLICATE_KHASRA ||
                            candidate.conflictType === ConflictType.SPATIAL_OVERLAP
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {candidate.conflictType.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-500">
                        Detected: {new Date(candidate.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Confidence Score Dial Badge */}
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-xs text-slate-500 font-semibold">Similarity:</span>
                      <span
                        className={`text-sm font-extrabold font-mono ${
                          isHigh ? 'text-govred-600' : isMedium ? 'text-govamber-600' : 'text-slate-600'
                        }`}
                      >
                        {score}%
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        ({candidate.scoreBreakdown?.confidenceLevel || (isHigh ? 'HIGH' : 'MEDIUM')})
                      </span>
                    </div>

                    <Badge
                      variant={
                        candidate.status === ConflictStatus.RESOLVED
                          ? 'success'
                          : candidate.status === ConflictStatus.INVESTIGATING
                          ? 'warning'
                          : candidate.status === ConflictStatus.DISMISSED
                          ? 'neutral'
                          : 'danger'
                      }
                      size="sm"
                      withDot
                    >
                      {candidate.status}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6 space-y-5">
                  {/* Side-by-Side Record Comparison Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                    {/* Center connector indicator */}
                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 border border-slate-300 items-center justify-center text-slate-500 z-10">
                      <ArrowRightLeft className="w-4 h-4" />
                    </div>

                    {/* Primary Record A */}
                    <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="text-xs font-bold text-govblue-800 uppercase tracking-wider">
                          PRIMARY RECORD A
                        </span>
                        {candidate.primaryRecord && (
                          <Link
                            to={`/records/${candidate.primaryRecord.id}`}
                            className="text-xs font-medium text-govblue-600 hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Record
                          </Link>
                        )}
                      </div>

                      {candidate.primaryRecord ? (
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Khasra / Survey No:</span>
                            <span className="font-mono font-bold text-slate-900">
                              {candidate.primaryRecord.khasraNumber}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">ULPIN:</span>
                            <span className="font-mono text-slate-800">
                              {candidate.primaryRecord.ulpin || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Titleholder(s):</span>
                            <span className="font-semibold text-slate-900 text-right">
                              {candidate.primaryRecord.owners && candidate.primaryRecord.owners.length > 0
                                ? candidate.primaryRecord.owners.map((o) => o.fullName).join(', ')
                                : 'No owners registered'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Location:</span>
                            <span className="text-slate-800 text-right">
                              {candidate.primaryRecord.location
                                ? `${candidate.primaryRecord.location.village}, ${candidate.primaryRecord.location.tehsil}, ${candidate.primaryRecord.location.district}`
                                : 'Location not linked'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Registered Area:</span>
                            <span className="font-semibold text-slate-900">
                              {candidate.primaryRecord.areaInSqMeters.toLocaleString()} sq.m ({candidate.primaryRecord.areaUnit})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Khatauni / Deed Ref:</span>
                            <span className="font-mono text-slate-700">
                              {candidate.primaryRecord.khatauniNumber || 'N/A'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Record metadata unavailable</p>
                      )}
                    </div>

                    {/* Conflicting Record B */}
                    <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="text-xs font-bold text-govred-800 uppercase tracking-wider">
                          CONFLICTING RECORD B
                        </span>
                        {candidate.conflictingRecord && (
                          <Link
                            to={`/records/${candidate.conflictingRecord.id}`}
                            className="text-xs font-medium text-govblue-600 hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Record
                          </Link>
                        )}
                      </div>

                      {candidate.conflictingRecord ? (
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Khasra / Survey No:</span>
                            <span className="font-mono font-bold text-slate-900">
                              {candidate.conflictingRecord.khasraNumber}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">ULPIN:</span>
                            <span className="font-mono text-slate-800">
                              {candidate.conflictingRecord.ulpin || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Titleholder(s):</span>
                            <span className="font-semibold text-slate-900 text-right">
                              {candidate.conflictingRecord.owners && candidate.conflictingRecord.owners.length > 0
                                ? candidate.conflictingRecord.owners.map((o) => o.fullName).join(', ')
                                : 'No owners registered'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Location:</span>
                            <span className="text-slate-800 text-right">
                              {candidate.conflictingRecord.location
                                ? `${candidate.conflictingRecord.location.village}, ${candidate.conflictingRecord.location.tehsil}, ${candidate.conflictingRecord.location.district}`
                                : 'Location not linked'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Registered Area:</span>
                            <span className="font-semibold text-slate-900">
                              {candidate.conflictingRecord.areaInSqMeters.toLocaleString()} sq.m ({candidate.conflictingRecord.areaUnit})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Khatauni / Deed Ref:</span>
                            <span className="font-mono text-slate-700">
                              {candidate.conflictingRecord.khatauniNumber || 'N/A'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Spatial overlap without specific secondary title</p>
                      )}
                    </div>
                  </div>

                  {/* Multi-Vector Similarity Breakdown */}
                  {candidate.scoreBreakdown && (
                    <div className="p-3.5 bg-slate-100/70 border border-slate-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Multi-Vector Similarity Breakdown:</span>
                        <span className="text-[11px] text-slate-500">Algorithm: Jaro-Winkler + Khasra Normalizer</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <span className="text-[10px] text-slate-400 block font-semibold">KHASRA</span>
                          <span className="font-mono font-bold text-slate-800">{candidate.scoreBreakdown.khasraScore}%</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <span className="text-[10px] text-slate-400 block font-semibold">OWNER</span>
                          <span className="font-mono font-bold text-slate-800">{candidate.scoreBreakdown.ownerScore}%</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <span className="text-[10px] text-slate-400 block font-semibold">LOCATION</span>
                          <span className="font-mono font-bold text-slate-800">{candidate.scoreBreakdown.locationScore}%</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <span className="text-[10px] text-slate-400 block font-semibold">AREA</span>
                          <span className="font-mono font-bold text-slate-800">{candidate.scoreBreakdown.areaScore}%</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <span className="text-[10px] text-slate-400 block font-semibold">REGISTRATION</span>
                          <span className="font-mono font-bold text-slate-800">{candidate.scoreBreakdown.registrationScore}%</span>
                        </div>
                      </div>

                      {candidate.scoreBreakdown.matchReasons && candidate.scoreBreakdown.matchReasons.length > 0 && (
                        <div className="pt-1 flex flex-wrap gap-1.5">
                          {candidate.scoreBreakdown.matchReasons.map((reason, idx) => (
                            <span key={idx} className="text-[11px] px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600 font-medium">
                              ✓ {reason}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resolution Notes / Decision Trail if already reviewed */}
                  {candidate.resolutionNotes && (
                    <div className="p-3 bg-govgreen-50/50 border border-govgreen-200 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between text-govgreen-900 font-bold">
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-govgreen-700" />
                          Human Review Resolution Recorded:
                        </span>
                        {candidate.resolvedAt && (
                          <span className="text-[11px] font-normal text-slate-500">
                            {new Date(candidate.resolvedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-govgreen-950 italic">"{candidate.resolutionNotes}"</p>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Link to="/map">
                        <Button variant="outline" size="sm" leftIcon={<Layers className="w-3.5 h-3.5 text-govblue-600" />}>
                          Inspect on Cadastral Map
                        </Button>
                      </Link>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={candidate.status === ConflictStatus.RESOLVED ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleOpenResolveModal(candidate)}
                        leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                      >
                        {candidate.status === ConflictStatus.RESOLVED ? 'Update Resolution Decision' : 'Submit Human Review Decision'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Human Review & Conflict Resolution Modal */}
      {selectedCandidate && (
        <Dialog
          isOpen={true}
          onClose={() => setSelectedCandidate(null)}
          title="Authorized Human Review Determination"
          size="lg"
        >
          <form onSubmit={handleSubmitResolution} className="space-y-4">
            <Alert variant="info" title="Strict Non-Automated Merging Policy">
              Per Land Registry statutory guidelines, AI/algorithmically detected duplicates must NEVER be automatically merged. Authorized Revenue Officers must inspect both titles and record determinations with an immutable audit trail.
            </Alert>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Resolution Decision / Action:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label
                  className={`p-3 border rounded-lg cursor-pointer text-xs flex flex-col items-center gap-1.5 text-center transition-all ${
                    resolveStatus === ConflictStatus.RESOLVED
                      ? 'border-govgreen-500 bg-govgreen-50 text-govgreen-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="resolveStatus"
                    value={ConflictStatus.RESOLVED}
                    checked={resolveStatus === ConflictStatus.RESOLVED}
                    onChange={() => setResolveStatus(ConflictStatus.RESOLVED)}
                    className="sr-only"
                  />
                  <CheckCircle2 className="w-4 h-4 text-govgreen-600" />
                  <span>Resolved (Approved Sub-division)</span>
                </label>

                <label
                  className={`p-3 border rounded-lg cursor-pointer text-xs flex flex-col items-center gap-1.5 text-center transition-all ${
                    resolveStatus === ConflictStatus.DISMISSED
                      ? 'border-slate-500 bg-slate-100 text-slate-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="resolveStatus"
                    value={ConflictStatus.DISMISSED}
                    checked={resolveStatus === ConflictStatus.DISMISSED}
                    onChange={() => setResolveStatus(ConflictStatus.DISMISSED)}
                    className="sr-only"
                  />
                  <XCircle className="w-4 h-4 text-slate-600" />
                  <span>Dismissed (False Positive)</span>
                </label>

                <label
                  className={`p-3 border rounded-lg cursor-pointer text-xs flex flex-col items-center gap-1.5 text-center transition-all ${
                    resolveStatus === ConflictStatus.INVESTIGATING
                      ? 'border-govamber-500 bg-govamber-50 text-govamber-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="resolveStatus"
                    value={ConflictStatus.INVESTIGATING}
                    checked={resolveStatus === ConflictStatus.INVESTIGATING}
                    onChange={() => setResolveStatus(ConflictStatus.INVESTIGATING)}
                    className="sr-only"
                  />
                  <Clock className="w-4 h-4 text-govamber-600" />
                  <span>Order Field Survey / Dispute</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mandatory Officer Rationale & Resolution Notes <span className="text-govred-600">*</span>:
              </label>
              <textarea
                required
                rows={4}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Explain the legal, cadastral, or survey rationale (e.g., 'Inspected 1982 consolidation map and mutation order #9281. Distinct sub-parcels with clear physical boundaries confirmed by Kanungo.')..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-govblue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCandidate(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={resolving}
                leftIcon={<Check className="w-4 h-4" />}
              >
                Submit Decision & Write Audit Log
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
};
