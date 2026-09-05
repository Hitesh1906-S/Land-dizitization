import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { Shield, MapPin, GitPullRequest, FileCheck, PlusCircle, Search, ArrowRight, FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LandRecordDTO, RequestDTO, RequestStage, RecordStatus } from '@land-digitization/shared';
import apiClient from '../../services/api';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<LandRecordDTO[]>([]);
  const [requests, setRequests] = useState<RequestDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [recordsRes, requestsRes] = await Promise.all([
          apiClient.get('/records', { params: { limit: 5 } }).catch(() => ({ data: { data: [] } })),
          apiClient.get('/workflows').catch(() => ({ data: { data: [] } })),
        ]);

        if (recordsRes.data?.data) {
          setRecords(recordsRes.data.data);
        }
        if (requestsRes.data?.data) {
          setRequests(requestsRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalArea = records.reduce((acc, r) => acc + (r.areaInSqMeters || 0), 0);
  const activeRequests = requests.filter(
    (r) => r.stage !== RequestStage.VERIFIED && r.stage !== RequestStage.REJECTED
  );
  const verifiedRecordsCount = records.filter((r) => r.status === RecordStatus.VERIFIED).length;
  const totalDocumentsCount = requests.reduce((acc, r) => acc + (r.documents?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Official Page Header */}
      <PageHeader
        title={`Citizen Services Portal`}
        description={`Welcome, ${user?.fullName || 'Citizen'}. Review your verified cadastral holdings, track mutation applications, and digitize legacy deeds.`}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Citizen Portal' }]}
        badge={
          <Badge variant="navy" size="sm">
            Citizen Profile
          </Badge>
        }
        actions={
          <>
            <Link to="/citizen/digitize">
              <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Digitize Land Deed
              </Button>
            </Link>
            <Link to="/search">
              <Button size="sm" variant="secondary" leftIcon={<Search className="w-4 h-4" />}>
                Public Search
              </Button>
            </Link>
          </>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Verified Titles"
          value={isLoading ? '...' : `${verifiedRecordsCount} ${verifiedRecordsCount === 1 ? 'Parcel' : 'Parcels'}`}
          icon={Shield}
          color="green"
          badgeText={records.length > 0 ? `${Math.round((verifiedRecordsCount / records.length) * 100)}% Verified` : 'Registry Active'}
        />
        <StatCard
          title="Total Registered Area"
          value={isLoading ? '...' : `${totalArea.toLocaleString('en-IN')} sq.m`}
          description={totalArea > 0 ? `${(totalArea / 4046.86).toFixed(2)} Acres indexed` : 'No registered holdings yet'}
          icon={MapPin}
          color="blue"
        />
        <StatCard
          title="Active Applications"
          value={isLoading ? '...' : `${activeRequests.length} ${activeRequests.length === 1 ? 'Filing' : 'Filings'}`}
          icon={GitPullRequest}
          color="amber"
          description={activeRequests.length > 0 ? 'Under Official Verification' : 'No pending filings'}
        />
        <StatCard
          title="Digitized Deeds"
          value={isLoading ? '...' : `${totalDocumentsCount} Documents`}
          icon={FileCheck}
          color="navy"
          description="SHA-256 Checksum Verified"
        />
      </div>

      {/* Main Content 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Registered Land Records */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">Registered Land Holdings</CardTitle>
            <Link to="/citizen/my-records">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View All ({records.length})
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 flex-1">
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-slate-100 rounded-lg" />
                ))}
              </div>
            ) : records.length > 0 ? (
              records.slice(0, 3).map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-govblue-800 bg-govblue-50 px-2.5 py-0.5 rounded border border-govblue-200">
                      ULPIN: {record.ulpin}
                    </span>
                    <StatusBadge status={record.status} />
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    Khasra No {record.khasraNumber} • {record.location?.village || 'Local Village'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tehsil: {record.location?.tehsil} • District: {record.location?.district}
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      Area: <strong className="text-slate-900">{record.areaInSqMeters.toLocaleString('en-IN')} sq.m</strong>
                    </span>
                    <span className="text-slate-600">
                      Type: <strong className="text-slate-900">{record.landType}</strong>
                    </span>
                    <Link to={`/records/${record.id}`} className="text-govblue-600 font-semibold hover:underline">
                      View Dossier →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <MapPin className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-sm font-semibold text-slate-700">No Land Records Indexed</p>
                <p className="text-xs text-slate-500">Digitize your physical Jamabandi deed to index your holding.</p>
                <Link to="/citizen/digitize" className="inline-block mt-2">
                  <Button size="sm" variant="primary">Start Digitization</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Application Pipeline */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">Application Pipeline</CardTitle>
            <Link to="/citizen/requests">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Track All ({requests.length})
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 flex-1">
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-slate-100 rounded-lg" />
                ))}
              </div>
            ) : requests.length > 0 ? (
              requests.slice(0, 3).map((req) => (
                <div key={req.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {req.applicationNumber}
                    </span>
                    <StatusBadge status={req.stage} />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {req.requestType.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {req.landRecord ? `Target: Khasra ${req.landRecord.khasraNumber} • ${req.landRecord.location?.village || ''}` : 'New Computerized Digitization'}
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Filed: {new Date(req.createdAt).toLocaleDateString('en-IN')}
                    </span>
                    <Link to="/citizen/requests" className="text-govblue-600 font-semibold hover:underline">
                      Track Status →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <GitPullRequest className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-sm font-semibold text-slate-700">No Active Applications</p>
                <p className="text-xs text-slate-500">Submit a deed digitization or title mutation request.</p>
                <Link to="/citizen/digitize" className="inline-block mt-2">
                  <Button size="sm" variant="secondary">File New Application</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
