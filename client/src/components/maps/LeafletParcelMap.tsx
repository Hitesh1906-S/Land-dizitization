import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Tooltip,
  useMap,
  LayersControl,
} from 'react-leaflet';
import { GeoJSONFeatureCollection, RecordStatus } from '@land-digitization/shared';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Layers, Map as MapIcon, Globe } from 'lucide-react';

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
  selectedParcelId?: string | null;
  onParcelClick?: (feature: any) => void;
  className?: string;
  tileProvider?: 'topo' | 'osm' | 'satellite';
}

// Controller component to handle programmatically fitting bounds or panning
const MapViewController: React.FC<{
  geojsonData?: GeoJSONFeatureCollection | null;
  selectedParcelId?: string | null;
  center?: [number, number];
  zoom?: number;
}> = ({ geojsonData, selectedParcelId, center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedParcelId && geojsonData && geojsonData.features) {
      const selectedFeature = geojsonData.features.find(
        (f: any) =>
          f.id === selectedParcelId ||
          f.properties?.parcelId === selectedParcelId ||
          f.properties?.recordId === selectedParcelId
      );

      if (selectedFeature) {
        try {
          const geoJsonLayer = L.geoJSON(selectedFeature as any);
          const bounds = geoJsonLayer.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18, animate: true });
          }
        } catch (e) {
          // ignore parsing fallback
        }
      }
    } else if (geojsonData && geojsonData.features && geojsonData.features.length > 0) {
      try {
        const geoJsonLayer = L.geoJSON(geojsonData as any);
        const bounds = geoJsonLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
        }
      } catch (e) {
        // ignore fallback
      }
    }
  }, [geojsonData, selectedParcelId, map]);

  return null;
};

export const LeafletParcelMap: React.FC<LeafletParcelMapProps> = ({
  geojsonData,
  center = [26.9124, 75.7873], // Default: Jaipur, Rajasthan
  zoom = 14,
  selectedParcelId,
  onParcelClick,
  className = 'h-[500px] w-full',
}) => {
  const [activeLayer, setActiveLayer] = useState<'topo' | 'satellite' | 'osm'>('topo');

  const getParcelStyle = (feature: any) => {
    const isSelected =
      selectedParcelId &&
      (feature.id === selectedParcelId ||
        feature.properties?.parcelId === selectedParcelId ||
        feature.properties?.recordId === selectedParcelId);

    if (isSelected) {
      return {
        fillColor: '#6366f1', // Indigo
        weight: 3.5,
        opacity: 1,
        color: '#312e81',
        dashArray: '',
        fillOpacity: 0.65,
      };
    }

    const valStatus = feature.properties?.validationStatus;
    const recStatus = feature.properties?.status;

    let fillColor = '#10b981'; // Green for passed / verified
    let color = '#047857';

    if (valStatus === 'FAILED' || recStatus === RecordStatus.DISPUTED || feature.properties?.hasConflict) {
      fillColor = '#ef4444'; // Red
      color = '#b91c1c';
    } else if (valStatus === 'WARNINGS' || recStatus === RecordStatus.PENDING_VERIFICATION) {
      fillColor = '#f59e0b'; // Amber
      color = '#b45309';
    } else if (valStatus === 'UNVALIDATED' || recStatus === RecordStatus.DRAFT) {
      fillColor = '#64748b'; // Slate
      color = '#334155';
    }

    return {
      fillColor,
      weight: 2,
      opacity: 0.9,
      color,
      dashArray: '2',
      fillOpacity: 0.45,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    // Attach click handler
    layer.on({
      click: () => {
        if (onParcelClick) {
          onParcelClick(feature);
        }
      },
      mouseover: (e: any) => {
        const l = e.target;
        const isSelected =
          selectedParcelId &&
          (feature.id === selectedParcelId ||
            feature.properties?.parcelId === selectedParcelId ||
            feature.properties?.recordId === selectedParcelId);

        if (!isSelected) {
          l.setStyle({
            weight: 3,
            color: '#ffffff',
            fillOpacity: 0.7,
          });
        }
      },
      mouseout: (e: any) => {
        const l = e.target;
        l.setStyle(getParcelStyle(feature));
      },
    });

    // Tooltip popup
    const p = feature.properties || {};
    const tooltipContent = `
      <div style="font-family: inherit; font-size: 11px; line-height: 1.3;">
        <strong style="color: #0f172a; font-size: 12px;">Khasra ${p.khasraNumber || 'N/A'}</strong><br/>
        <span style="color: #475569;">Owner: <b>${p.primaryOwner || 'N/A'}</b></span><br/>
        <span style="color: #475569;">Area: ${Number(p.areaInSqMeters || 0).toLocaleString()} m²</span><br/>
        <span style="color: ${
          p.validationStatus === 'PASSED'
            ? '#059669'
            : p.validationStatus === 'FAILED'
            ? '#dc2626'
            : '#d97706'
        }; font-weight: 600;">
          ● ${p.validationStatus || p.status || 'Active'}
        </span>
      </div>
    `;

    layer.bindTooltip(tooltipContent, {
      sticky: true,
      direction: 'top',
      opacity: 0.95,
      className: 'cadastral-tooltip',
    });
  };

  const tileLayerUrls = {
    topo: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  };

  const tileAttributions = {
    topo: 'Tiles &copy; Esri &mdash; Esri, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, and the GIS User Community',
    satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    osm: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  };

  return (
    <div className={`relative rounded-xl overflow-hidden border border-slate-300 shadow-lg bg-slate-100 ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          key={activeLayer}
          url={tileLayerUrls[activeLayer]}
          attribution={tileAttributions[activeLayer]}
        />

        {geojsonData && (
          <GeoJSON
            key={JSON.stringify(geojsonData) + (selectedParcelId || '')}
            data={geojsonData as any}
            style={getParcelStyle}
            onEachFeature={onEachFeature}
          />
        )}

        <MapViewController
          geojsonData={geojsonData}
          selectedParcelId={selectedParcelId}
          center={center}
          zoom={zoom}
        />
      </MapContainer>

      {/* Floating Basemap Layer Switcher */}
      <div className="absolute top-3 right-3 z-[400] flex items-center bg-white/95 backdrop-blur-md rounded-lg p-1 border border-slate-200 shadow-md">
        <button
          type="button"
          onClick={() => setActiveLayer('topo')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
            activeLayer === 'topo'
              ? 'bg-govnavy-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Vector</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveLayer('satellite')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
            activeLayer === 'satellite'
              ? 'bg-govnavy-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Satellite</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveLayer('osm')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
            activeLayer === 'osm'
              ? 'bg-govnavy-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>OSM</span>
        </button>
      </div>

      {/* Cadastral Legend Box */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs shadow-md space-y-1.5 pointer-events-auto">
        <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">
          Cadastral Status Legend
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-500/60 border border-emerald-600"></span>
            <span className="text-slate-700">Verified / Passed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-500/60 border border-amber-600"></span>
            <span className="text-slate-700">Pending / Warnings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-red-500/60 border border-red-600"></span>
            <span className="text-slate-700">Disputed / Failed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-indigo-500/80 border border-indigo-700"></span>
            <span className="text-slate-700 font-bold">Selected Parcel</span>
          </div>
        </div>
      </div>
    </div>
  );
};
