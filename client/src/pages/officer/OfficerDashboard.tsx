import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { FileCheck, AlertTriangle, Layers, Clock, ArrowRight, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue Officer Console"
        description={`Jurisdictional oversight for ${user?.jurisdictionDistrict || 'Jaipur'} District (Tehsil: ${user?.jurisdictionTehsil || 'Sanganer'}). Review OCR verification queues and resolve parcel overlaps.`}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Revenue Officer Portal' }]}
        badge={
          <Badge variant="navy" size="sm">
            Tehsildar Workspace
          </Badge>
        }
        actions={
          <>
            <Link to="/officer/verification-queue">
              <Button size="sm" variant="primary" leftIcon={<FileCheck className="w-4 h-4" />}>
                Verification Queue (14)
              </Button>
            </Link>
            <Link to="/officer/conflicts">
              <Button size="sm" variant="secondary" leftIcon={<AlertTriangle className="w-4 h-4 text-govamber-600" />}>
                Resolve Conflicts (3)
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Verification"
          value="14 Records"
          icon={Clock}
          color="amber"
          description="Avg wait: 1.8 days"
        />
        <StatCard
          title="Flagged Conflicts"
          value="3 Disputes"
          icon={AlertTriangle}
          color="red"
          badgeText="Requires Survey"
        />
        <StatCard
          title="Approved This Month"
          value="48 Deeds"
          icon={FileCheck}
          color="green"
          change="+18%"
          changeType="positive"
        />
        <StatCard
          title="Jurisdiction Parcels"
          value="1,240 Total"
          icon={Layers}
          color="navy"
          description="Sanganer Tehsil"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Urgent Document Audit Queue</CardTitle>
            <Link to="/officer/verification-queue">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Open Queue
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-slate-700">DOC-2026-09142</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">Sale Deed • Khasra 102/4 (Rampur)</p>
                <p className="text-xs text-govgreen-700 font-medium">OCR Confidence: 94.2%</p>
              </div>
              <Link to="/officer/verification-queue">
                <Button variant="secondary" size="sm">
                  Review
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spatial Boundary Overlaps</CardTitle>
            <Link to="/officer/conflicts">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Workbench
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 rounded-lg border border-govred-200 bg-govred-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-govred-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-govred-700" />
                  Boundary Encroachment Detected
                </span>
                <span className="text-xs font-semibold text-slate-600">Overlap: 12.4% (502 m²)</span>
              </div>
              <p className="text-sm font-bold text-slate-900">Khasra No 102/4 vs Khasra No 102/5</p>
              <p className="text-xs text-slate-600">Village: Rampur • Tehsil: Sanganer</p>
              <div className="pt-2 flex justify-end">
                <Link to="/officer/conflicts">
                  <Button variant="danger" size="sm">
                    Open Dispute Workbench
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
