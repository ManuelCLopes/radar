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

// Custom icon for the main business (blue)
const businessIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Custom icon for competitors (red)
const competitorIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
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

function MapUpdater({ center }: { center: { lat: number; lng: number } }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, 14);
    }, [center, map]);
    return null;
}

export function CompetitorMap({ center, businessName, competitors, radius = 1000 }: CompetitorMapProps) {
    const { t } = useTranslation();

    // Filter competitors with valid location data
    const validCompetitors = competitors.filter(c =>
        (c.latitude && c.longitude) ||
        (c.geometry?.location?.lat && c.geometry?.location?.lng)
    );

    return (
        <div className="h-[400px] w-full rounded-lg overflow-hidden border shadow-sm z-0 relative">
            <MapContainer
                center={center}
                zoom={14}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapUpdater center={center} />



                {/* Main Business Marker */}
                <Marker position={center} icon={businessIcon}>
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
