import React, { useState } from 'react';
import { LeafletParcelMap } from '../../components/maps/LeafletParcelMap';
import { RecordStatus } from '@land-digitization/shared';
import { Layers, Filter, Eye, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';

export const CadastralMapPage: React.FC = () => {
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

  const villageGeoJSON: any = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          recordId: 'rec-1',
          ulpin: 'RJ-JP-2024-8841',
          khasraNumber: '102/4',
          khatauniNumber: '45-B',
          district: 'Jaipur',
          village: 'Rampur',
          areaInSqMeters: 4050,
          status: RecordStatus.VERIFIED,
          primaryOwner: 'Ram Kumar Sharma',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [75.783, 26.911],
              [75.787, 26.911],
              [75.787, 26.915],
              [75.783, 26.915],
              [75.783, 26.911],
            ],
          ],
        },
      },
      {
        type: 'Feature',
        properties: {
          recordId: 'rec-2',
          ulpin: 'RJ-JP-2024-8842',
          khasraNumber: '102/5',
          khatauniNumber: '45-C',
          district: 'Jaipur',
          village: 'Rampur',
          areaInSqMeters: 3200,
          status: RecordStatus.DISPUTED,
          primaryOwner: 'Suresh Verma',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [75.7865, 26.913],
              [75.791, 26.913],
              [75.791, 26.917],
              [75.7865, 26.917],
              [75.7865, 26.913],
            ],
          ],
        },
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Cadastral GIS Map Viewer</h1>
          <p className="text-sm text-slate-400 mt-1">
            Interactive geo-referenced parcel boundary maps and spatial overlap inspection
          </p>
        </div>
        <div className="flex gap-2">
          <select className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white">
            <option>Village: Rampur (Sanganer)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map View Canvas */}
        <div className="lg:col-span-8 h-[600px]">
          <LeafletParcelMap
            geojsonData={villageGeoJSON}
            center={[26.914, 75.787]}
            zoom={15}
            onParcelClick={(f) => setSelectedFeature(f.properties)}
            className="h-full w-full"
          />
        </div>

        {/* Selected Parcel Inspector Side Panel */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              Parcel Inspector
            </h2>
            <p className="text-xs text-slate-400">Click any parcel on the map to inspect records</p>
          </div>

          {selectedFeature ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-500 uppercase tracking-wider font-semibold">ULPIN Code</span>
                <p className="text-sm font-mono text-emerald-400 font-bold mt-0.5">
                  {selectedFeature.ulpin}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500">Khasra Number:</span>
                  <p className="font-semibold text-white mt-0.5">{selectedFeature.khasraNumber}</p>
                </div>
                <div>
                  <span className="text-slate-500">Khatauni:</span>
                  <p className="font-semibold text-white mt-0.5">{selectedFeature.khatauniNumber}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-500">Primary Owner:</span>
                <p className="font-semibold text-white mt-0.5">{selectedFeature.primaryOwner}</p>
              </div>

              <div>
                <span className="text-slate-500">Registered Area:</span>
                <p className="font-semibold text-white mt-0.5">{selectedFeature.areaInSqMeters} sq.m</p>
              </div>

              <div className="pt-2">
                <Link to={`/records/${selectedFeature.recordId}`}>
                  <Button variant="primary" size="sm" className="w-full">
                    <Eye className="w-4 h-4 mr-1.5" />
                    Open Record Details
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 text-xs p-4">
              <Layers className="w-10 h-10 mb-2 opacity-40 text-slate-400" />
              <p>Select any polygon on the cadastral map to inspect boundary details and metadata.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
