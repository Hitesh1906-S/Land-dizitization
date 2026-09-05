import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { RecordStatus } from '@land-digitization/shared';
import { LeafletParcelMap } from '../../components/maps/LeafletParcelMap';
import { ArrowLeft, Layers, MapPin, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

export const RecordDetailPage: React.FC = () => {
  const { id } = useParams();

  const sampleGeoJSON: any = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          status: RecordStatus.VERIFIED,
          khasraNumber: '102/4',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [75.785, 26.911],
              [75.789, 26.911],
              [75.789, 26.914],
              [75.785, 26.914],
              [75.785, 26.911],
            ],
          ],
        },
      },
    ],
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Land Record Dossier"
        description="Comprehensive ownership chain, registered deed history, and geo-referenced boundary coordinates."
        breadcrumbs={[
          { label: 'Registry', href: '/records' },
          { label: `Khasra 102/4` },
        ]}
        badge={<StatusBadge status={RecordStatus.VERIFIED} />}
        actions={
          <Link to="/records">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Directory
            </Button>
          </Link>
        }
      />

      <Card className="p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="font-mono text-xs font-bold text-govblue-800 bg-govblue-50 px-2.5 py-1 rounded border border-govblue-200">
              ULPIN: RJ-JP-2024-8841
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">Khasra No 102/4 (Khatauni 45-B)</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Rampur Village, Sanganer Tehsil, Jaipur District, Rajasthan
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/map">
              <Button size="sm" variant="primary" leftIcon={<Layers className="w-4 h-4" />}>
                Fullscreen GIS Map
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg text-xs border border-slate-100">
          <div>
            <span className="text-slate-500">Registered Area</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">4,050 sq.meters</p>
          </div>
          <div>
            <span className="text-slate-500">Land Classification</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">Agricultural</p>
          </div>
          <div>
            <span className="text-slate-500">Primary Title Holder</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">Ram Kumar Sharma</p>
          </div>
          <div>
            <span className="text-slate-500">Last Mutation Order</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">MUT-2024-0012</p>
          </div>
        </div>
      </Card>

      {/* Cadastral Boundary Map Preview */}
      <Card className="p-6 space-y-4">
        <CardTitle>Cadastral Boundary Geo-Coordinates</CardTitle>
        <div className="h-80 w-full rounded-lg overflow-hidden border border-slate-200">
          <LeafletParcelMap geojsonData={sampleGeoJSON} center={[26.9125, 75.787]} zoom={15} />
        </div>
      </Card>
    </div>
  );
};
