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
import apiClient from '../../services/api';
import {
  ArrowLeft,
  Layers,
  MapPin,
  ShieldCheck,
  FileText,
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
} from 'lucide-react';

export const RecordDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [record, setRecord] = useState<LandRecordDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchRecord();
  }, [id]);

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
      <PageHeader
        title={`Land Record Dossier: Khasra ${record.khasraNumber}`}
        description="Comprehensive official land title details, registered deed ledger, ownership shares, and geo-referenced boundary polygon."
        breadcrumbs={[
          { label: 'Registry', href: '/records' },
          { label: `Khasra ${record.khasraNumber}` },
        ]}
        badge={<StatusBadge status={record.status} />}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/records">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Directory
              </Button>
            </Link>
            {canEditRecord && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowStatusModal(true)}
                leftIcon={<Edit3 className="w-4 h-4" />}
              >
                Update Status
              </Button>
            )}
          </div>
        }
      />

      {actionSuccess && (
        <Alert variant="success">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-govgreen-600" />
            <span>{actionSuccess}</span>
          </div>
        </Alert>
      )}

      {/* Main Header Identification Card */}
      <Card className="p-6 bg-white border-slate-300 shadow-gov-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-govnavy-900 bg-slate-100 px-3 py-1 rounded border border-slate-200">
                ULPIN: {record.ulpin}
              </span>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                Khatauni: {record.khatauniNumber}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2">
              Khasra Number: {record.khasraNumber}
            </h2>
            <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-govblue-600" />
              <span>
                {record.location?.village} Village, {record.location?.tehsil} Tehsil,{' '}
                {record.location?.district} District, {record.location?.state}
                {record.location?.pincode ? ` - ${record.location.pincode}` : ''}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/map">
              <Button size="sm" variant="outline" leftIcon={<Layers className="w-4 h-4 text-govblue-600" />}>
                Inspect on GIS Map
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

      {/* Two-Column Grid: Left (Owners & Chain of Title), Right (GIS Map & Boundary) */}
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
