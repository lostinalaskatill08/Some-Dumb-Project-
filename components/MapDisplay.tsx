
import React, { useEffect, useRef, useState } from 'react';

declare const L: any; // Standard Leaflet global

const waitForLeaflet = (onSuccess: () => void, onError: () => void) => {
  let attempts = 0;
  const intervalId = setInterval(() => {
    if (typeof L !== 'undefined' && L.esri && L.drawLocal && L.GeometryUtil) {
      clearInterval(intervalId);
      onSuccess();
    } else if (++attempts > 70) { // ~7 seconds timeout
      clearInterval(intervalId);
      console.error("Map libraries (Leaflet, Esri, Draw, GeometryUtil) failed to load. Check index.html and network.");
      onError();
    }
  }, 100);
};

interface MapDisplayProps {
  onLocationSelect: (lat: number, lon: number) => void;
  analysisStatus: 'idle' | 'countdown' | 'analyzing';
  countdown: number;
  disabled: boolean;
  centerCoords?: { lat: number; lon: number } | null;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ 
    onLocationSelect, analysisStatus, countdown, disabled, centerCoords
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapStatus, setMapStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  // Use refs for callbacks and props to prevent re-triggering the map initialization effect
  const onLocationSelectRef = useRef(onLocationSelect);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);
  
  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    waitForLeaflet(() => setMapStatus('loaded'), () => setMapStatus('error'));
  }, []);

  // Effect for map initialization (runs only once after libraries are loaded)
  useEffect(() => {
    if (mapStatus !== 'loaded' || !mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current, { zoomControl: true }).setView([39.8283, -98.5795], 4);
    mapRef.current = map;

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
    });
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    
    streetLayer.addTo(map);
    
    L.control.layers({ "Satellite": satelliteLayer, "Street Map": streetLayer }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: { color: '#059669' }
        },
        polyline: false,
        rectangle: {
          showArea: true,
          shapeOptions: { color: '#059669' }
        },
        circle: false,
        circlemarker: false,
        marker: true,
      },
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (event: any) => {
      if (disabledRef.current) return;
      const layer = event.layer;
      
      drawnItems.clearLayers();
      drawnItems.addLayer(layer);

      if (event.layerType === 'marker') {
        const { lat, lng } = layer.getLatLng();
        onLocationSelectRef.current(lat, lng);
      } else if (event.layerType === 'polygon' || event.layerType === 'rectangle') {
        const latlngs = event.layerType === 'polygon' ? layer.getLatLngs()[0] : layer.getLatLngs();
        const area = L.GeometryUtil.geodesicArea(latlngs);
        const areaSqFt = area * 10.7639; // Convert sq meters to sq feet
        const areaAcres = area / 4046.86; // Convert sq meters to acres
        layer.bindPopup(
          `<b>Area</b><br>
           ${area.toLocaleString(undefined, {maximumFractionDigits: 2})} m²<br>
           ${areaSqFt.toLocaleString(undefined, {maximumFractionDigits: 2})} ft²<br>
           ${areaAcres.toLocaleString(undefined, {maximumFractionDigits: 4})} acres`
        ).openPopup();
      }
    });

    return () => {
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
    };
  }, [mapStatus]);
  
  // This effect handles panning the map when centerCoords prop changes.
  useEffect(() => {
    if (mapRef.current && centerCoords) {
      const newLatLng = L.latLng(centerCoords.lat, centerCoords.lon);
      mapRef.current.setView(newLatLng, 16);
      // You could optionally add a marker here, but the draw control is the primary interaction now.
    }
  }, [centerCoords]);

  const getOverlayContent = () => {
    if (disabled) {
        return <p className="text-slate-100 font-semibold text-lg">Please select a role to enable the map.</p>;
    }
    switch (analysisStatus) {
      case 'countdown':
        return <p className="text-white font-bold text-2xl animate-ping-once">{countdown}</p>;
      case 'analyzing':
        return (
            <div className="flex flex-col items-center gap-2 text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <p>Analyzing...</p>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-4 space-y-2">
      <div 
        className="relative w-full h-80 sm:h-96 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-inner flex items-center justify-center"
      >
        {mapStatus === 'loading' && <p>Loading Map...</p>}
        {mapStatus === 'error' && <p className="text-red-500">Map failed to load.</p>}
        <div ref={mapContainerRef} className={`w-full h-full ${mapStatus !== 'loaded' ? 'invisible' : ''}`} />
        {(analysisStatus !== 'idle' || disabled) && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 pointer-events-none">
                {getOverlayContent()}
            </div>
        )}
      </div>
       <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Use the toolbar on the map to place a marker for analysis, or draw shapes to measure area.</p>
    </div>
  );
};

export default MapDisplay;