import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom DivIcon for main business (Blue)
const businessIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #2563eb; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); position: relative; top: -8px; left: -8px;"></div>
           <div style="background-color: #2563eb; width: 2px; height: 10px; position: absolute; top: 8px; left: -1px; margin: 0 auto; opacity: 0.5;"></div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -16]
});

// Custom DivIcon for competitors (Red)
const competitorIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #dc2626; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); position: relative; top: -7px; left: -7px;"></div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -14]
});

interface Competitor {
    name: string;
    address: string;
    rating?: number;
    userRatingsTotal?: number;
    latitude?: number;
    longitude?: number;
    geometry?: {
        location: {
            lat: number;
            lng: number;
        }
    };
}

interface CompetitorMapProps {
    center: { lat: number; lng: number };
    businessName: string;
    competitors: Competitor[];
    radius?: number;
}

export function CompetitorMap({ center, businessName, competitors, radius = 1000 }: CompetitorMapProps) {
    const { t } = useTranslation();

    // Filter competitors with valid location data
    const validCompetitors = competitors.filter(c =>
        (c.latitude && c.longitude) ||
        (c.geometry?.location?.lat && c.geometry?.location?.lng)
    );

    return (
        <div className="h-[400px] w-full rounded-lg overflow-hidden border shadow-sm z-0 relative isolate">
            <MapContainer
                center={center}
                zoom={14}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapUpdater center={center} />

                {/* Main Business Marker */}
                <Marker position={center} icon={businessIcon} zIndexOffset={1000}>
                    <Popup>
                        <div className="font-bold">{businessName}</div>
                        <div className="text-xs text-muted-foreground">{t('dashboard.analysis.businessReport')}</div>
                    </Popup>
                </Marker>

                {/* Competitor Markers */}
                {validCompetitors.map((competitor, index) => {
                    const lat = competitor.latitude || competitor.geometry?.location.lat;
                    const lng = competitor.longitude || competitor.geometry?.location.lng;

                    if (!lat || !lng) return null;

                    return (
                        <Marker
                            key={index}
                            position={{ lat, lng }}
                            icon={competitorIcon}
                        >
                            <Popup>
                                <div className="font-semibold">{competitor.name}</div>
                                <div className="text-xs">{competitor.address}</div>
                                {competitor.rating && (
                                    <div className="text-xs mt-1 font-medium">
                                        ⭐ {competitor.rating} ({competitor.userRatingsTotal})
                                    </div>
                                )}
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}

function MapUpdater({ center }: { center: { lat: number; lng: number } }) {
    const map = useMap();

    useEffect(() => {
        map.setView(center, 14);
        // Force a resize calculation after mount to ensure tiles load
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }, [center.lat, center.lng, map]);

    return null;
}
