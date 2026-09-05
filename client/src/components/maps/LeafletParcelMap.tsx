import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, Marker } from 'react-leaflet';
import { GeoJSONFeatureCollection, RecordStatus } from '@land-digitization/shared';
import L from 'leaflet';

// Fix Leaflet marker icons in React/Vite
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface LeafletParcelMapProps {
  geojsonData?: GeoJSONFeatureCollection | null;
  center?: [number, number];
  zoom?: number;
  onParcelClick?: (feature: any) => void;
  className?: string;
}

export const LeafletParcelMap: React.FC<LeafletParcelMapProps> = ({
  geojsonData,
  center = [26.9124, 75.7873], // Default: Jaipur, Rajasthan
  zoom = 14,
  onParcelClick,
  className = 'h-[500px] w-full',
}) => {
  const [selectedParcel, setSelectedParcel] = useState<any>(null);

  const getParcelStyle = (feature: any) => {
    const status = feature.properties?.status;
    let fillColor = '#10b981'; // Green for verified
    let color = '#059669';

    if (status === RecordStatus.PENDING_VERIFICATION) {
      fillColor = '#f59e0b'; // Amber
      color = '#d97706';
    } else if (status === RecordStatus.DISPUTED) {
      fillColor = '#ef4444'; // Red
      color = '#dc2626';
    }

    return {
      fillColor,
      weight: 2,
      opacity: 1,
      color,
      dashArray: '2',
      fillOpacity: 0.45,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    layer.on({
      click: () => {
        setSelectedParcel(feature);
        if (onParcelClick) {
          onParcelClick(feature);
        }
      },
      mouseover: (e: any) => {
        const l = e.target;
        l.setStyle({
          weight: 3,
          color: '#ffffff',
          fillOpacity: 0.7,
        });
      },
      mouseout: (e: any) => {
        const l = e.target;
        l.setStyle(getParcelStyle(feature));
      },
    });
  };

  return (
    <div className={`relative rounded-xl overflow-hidden border border-slate-800 shadow-2xl ${className}`}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="h-full w-full">
        {/* CartoDB Dark Matter Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {geojsonData && (
          <GeoJSON
            key={JSON.stringify(geojsonData)}
            data={geojsonData as any}
            style={getParcelStyle}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] glass-panel px-3 py-2 rounded-lg text-xs space-y-1">
        <div className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider mb-1">Cadastral Legend</div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-emerald-500/60 border border-emerald-400"></span>
          <span className="text-slate-300">Verified & Clear</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-amber-500/60 border border-amber-400"></span>
          <span className="text-slate-300">Under Verification / Mutation</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-red-500/60 border border-red-400"></span>
          <span className="text-slate-300">Disputed / Spatial Overlap</span>
        </div>
      </div>
    </div>
  );
};
