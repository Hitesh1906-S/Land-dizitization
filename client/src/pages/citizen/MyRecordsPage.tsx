import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { RecordStatus } from '@land-digitization/shared';
import { Link } from 'react-router-dom';
import { MapPin, PlusCircle, ArrowRight, ShieldCheck, Download, Eye } from 'lucide-react';

export const MyRecordsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Registered Land Records"
        description="Official digitized records and titles associated with your verified Citizen identification."
        breadcrumbs={[
          { label: 'Citizen Portal', href: '/citizen/dashboard' },
          { label: 'My Records' },
        ]}
        actions={
          <Link to="/citizen/digitize">
            <Button size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Digitize New Deed
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-mono text-xs font-bold text-govnavy-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              ULPIN: RJ-JP-2024-8841
            </span>
            <StatusBadge status={RecordStatus.VERIFIED} />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">Khasra No: 102/4</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Rampur Village, Sanganer Tehsil, Jaipur District (Rajasthan)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-3 bg-slate-50 rounded-lg p-3 text-xs border border-slate-200/80">
            <div>
              <span className="text-slate-500">Khatauni Number:</span>
              <p className="font-bold text-slate-800 mt-0.5">45-B</p>
            </div>
            <div>
              <span className="text-slate-500">Registered Area:</span>
              <p className="font-bold text-slate-800 mt-0.5">4,050 sq.meters (1.0 Acre)</p>
            </div>
            <div>
              <span className="text-slate-500">Classification:</span>
              <p className="font-bold text-slate-800 mt-0.5">Agricultural</p>
            </div>
            <div>
              <span className="text-slate-500">Ownership Share:</span>
              <p className="font-bold text-slate-800 mt-0.5">100.0% (Single Title)</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link to="/map">
              <Button variant="secondary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                Cadastral Map
              </Button>
            </Link>
            <Link to="/records/rec-1">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Record Dossier
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
