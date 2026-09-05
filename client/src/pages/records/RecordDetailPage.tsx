import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, MapPin, FileText, ArrowLeft, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { RecordStatus } from '@land-digitization/shared';
import { LeafletParcelMap } from '../../components/maps/LeafletParcelMap';

export const RecordDetailPage: React.FC = () => {
  const { id } = useParams();

  // Mock parcel GeoJSON geometry for demo
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
      <div className="flex items-center justify-between">
        <Link to="/records" className="text-sm text-slate-400 hover:text-white flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </Link>
        <StatusBadge status={RecordStatus.VERIFIED} />
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-semibold text-emerald-400 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30">
              ULPIN: RJ-JP-2024-8841
            </span>
            <h1 className="text-2xl font-bold text-white mt-2">Khasra No 102/4 (Khatauni 45-B)</h1>
            <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4 text-slate-500" />
              Rampur Village, Sanganer Tehsil, Jaipur District, Rajasthan
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/map">
              <Button size="sm">
                <Layers className="w-4 h-4 mr-1.5" />
                Fullscreen GIS
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-500">Registered Area</span>
            <p className="text-sm font-semibold text-white mt-0.5">4,050 sq.meters</p>
          </div>
          <div>
            <span className="text-slate-500">Land Classification</span>
            <p className="text-sm font-semibold text-white mt-0.5">Agricultural (Irrigated)</p>
          </div>
          <div>
            <span className="text-slate-500">Primary Owner</span>
            <p className="text-sm font-semibold text-white mt-0.5">Ram Kumar Sharma (100%)</p>
          </div>
          <div>
            <span className="text-slate-500">Last Mutation Order</span>
            <p className="text-sm font-semibold text-white mt-0.5">MUT-2024-0012</p>
          </div>
        </div>
      </div>

      {/* Cadastral Boundary Map Preview */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white">Cadastral Boundary & Geo-Coordinates</h2>
        <div className="h-80 w-full rounded-xl overflow-hidden">
          <LeafletParcelMap geojsonData={sampleGeoJSON} center={[26.9125, 75.787]} zoom={15} />
        </div>
      </div>
    </div>
  );
};
