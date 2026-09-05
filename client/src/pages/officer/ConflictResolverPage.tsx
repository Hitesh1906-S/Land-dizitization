import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AlertTriangle, MapPin, CheckCircle, ShieldAlert, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

export const ConflictResolverPage: React.FC = () => {
  const { showToast } = useToast();

  const handleResolve = () => {
    showToast('Boundary survey report verified. Conflict status marked as Resolved.', 'success', 'Dispute Resolved');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spatial & Boundary Conflict Workbench"
        description="Inspect overlapping cadastral polygons, resolve duplicate survey numbers, and audit boundary encroachment disputes."
        breadcrumbs={[
          { label: 'Revenue Officer', href: '/officer/dashboard' },
          { label: 'Conflict Workbench' },
        ]}
        badge={
          <Badge variant="danger" size="sm">
            Dispute Resolution
          </Badge>
        }
      />

      <Card className="border-govred-200">
        <CardHeader className="bg-govred-50/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-govred-100 border border-govred-200 flex items-center justify-center text-govred-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-govred-800">DISPUTE: OVL-2026-0041</span>
              <CardTitle className="text-govred-950">Spatial Boundary Encroachment Detected (502 m² Overlap)</CardTitle>
            </div>
          </div>
          <Badge variant="danger" withDot>
            Under Investigation
          </Badge>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-500 uppercase tracking-wider">PRIMARY PARCEL A</span>
              <p className="text-sm font-bold text-slate-900">Khasra 102/4 • Rampur Village</p>
              <p className="text-slate-600">Registered Area: 4,050 sq.m</p>
              <p className="text-slate-600">Claimant: Ram Kumar Sharma</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-500 uppercase tracking-wider">CONFLICTING PARCEL B</span>
              <p className="text-sm font-bold text-slate-900">Khasra 102/5 • Rampur Village</p>
              <p className="text-slate-600">Registered Area: 3,200 sq.m</p>
              <p className="text-slate-600">Claimant: Suresh Verma</p>
            </div>
          </div>

          <div className="p-4 bg-govamber-50 border border-govamber-200 rounded-lg text-xs text-govamber-900 space-y-1">
            <strong className="block font-bold">Turf.js Spatial Engine Analysis:</strong>
            <p>
              Intersection polygon calculated with area 502.40 sq.meters (12.40% of Parcel A, 15.70% of Parcel B). Ground survey verification recommended before deed mutation final approval.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Link to="/map">
              <Button variant="secondary" size="sm" leftIcon={<Layers className="w-3.5 h-3.5 text-govblue-600" />}>
                Inspect Overlap on Cadastral Map
              </Button>
            </Link>
            <Button variant="success" size="sm" onClick={handleResolve} leftIcon={<CheckCircle className="w-3.5 h-3.5" />}>
              Mark Resolved (Field Survey Approved)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
