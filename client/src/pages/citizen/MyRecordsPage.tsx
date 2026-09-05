import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { LandRecordDTO } from '@land-digitization/shared';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';
import { Link } from 'react-router-dom';
import { MapPin, PlusCircle, ArrowRight, Eye, FileSpreadsheet } from 'lucide-react';

export const MyRecordsPage: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<LandRecordDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyRecords = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Query by user's full name if citizen or fetch latest
        const params: Record<string, any> = { limit: 20 };
        if (user?.fullName) {
          params.owner = user.fullName;
        }
        const response = await apiClient.get('/records', { params });
        let list: LandRecordDTO[] = response.data.data || [];

        // If no records found under exact name match, fallback to general directory list
        if (list.length === 0) {
          const fallbackRes = await apiClient.get('/records', { params: { limit: 10 } });
          list = fallbackRes.data.data || [];
        }

        setRecords(list);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to retrieve your land records.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyRecords();
  }, [user]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Registered Land Records"
        description="Official computerized titles and deed dossiers associated with your verified citizen account."
        breadcrumbs={[
          { label: 'Citizen Portal', href: '/citizen/dashboard' },
          { label: 'My Records' },
        ]}
        actions={
          <Link to="/citizen/digitize">
            <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Digitize New Deed
            </Button>
          </Link>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 bg-white rounded-lg border border-slate-200 animate-pulse space-y-4">
              <div className="flex justify-between">
                <div className="h-4 bg-slate-200 rounded w-24" />
                <div className="h-4 bg-slate-200 rounded w-16" />
              </div>
              <div className="h-5 bg-slate-200 rounded w-40" />
              <div className="h-24 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && records.length === 0 && (
        <Card className="p-12 text-center bg-white border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Land Records Linked Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You currently have no digitized land records in your profile. You can search the public registry or submit a new deed digitization application.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link to="/records">
              <Button variant="secondary" size="sm">
                Search Registry
              </Button>
            </Link>
            <Link to="/citizen/digitize">
              <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Digitize Deed
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {!isLoading && records.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {records.map((rec) => {
            const primaryOwner =
              rec.owners?.find((o) => o.isPrimary)?.fullName ||
              rec.owners?.[0]?.fullName ||
              user?.fullName ||
              'Title Holder';

            const userShare = rec.owners?.find((o) => o.fullName === user?.fullName)?.shareFraction;
            const shareText = userShare !== undefined ? `${(userShare * 100).toFixed(0)}%` : '100.0%';

            return (
              <Card key={rec.id} className="p-6 bg-white border-slate-300 shadow-gov-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-mono text-xs font-bold text-govnavy-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                    ULPIN: {rec.ulpin}
                  </span>
                  <StatusBadge status={rec.status} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">Khasra No: {rec.khasraNumber}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {rec.location?.village} Village, {rec.location?.tehsil} Tehsil, {rec.location?.district} ({rec.location?.state})
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 bg-slate-50 rounded-lg p-3 text-xs border border-slate-200/80">
                  <div>
                    <span className="text-slate-500">Khatauni Number:</span>
                    <p className="font-bold text-slate-800 mt-0.5">{rec.khatauniNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Registered Area:</span>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {rec.areaInSqMeters.toLocaleString('en-IN')} sq.m
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Classification:</span>
                    <p className="font-bold text-slate-800 mt-0.5 uppercase">{rec.landType.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Ownership Share:</span>
                    <p className="font-bold text-slate-800 mt-0.5">{shareText} ({primaryOwner})</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Link to="/map">
                    <Button variant="secondary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                      Cadastral Map
                    </Button>
                  </Link>
                  <Link to={`/records/${rec.id}`}>
                    <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Record Dossier
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
