import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
// leaflet.css is now imported in main.tsx
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';

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
    latitude?: number | string | null;
    longitude?: number | string | null;
    geometry?: {
        location: {
            lat: number | string;
            lng: number | string;
        }
    };
}

interface CompetitorMapProps {
    center: { lat: number; lng: number };
    businessName: string;
    competitors: Competitor[];
    radius?: number;
}

const toFiniteNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return null;
};

const toLatLng = (latValue: unknown, lngValue: unknown): { lat: number; lng: number } | null => {
    const lat = toFiniteNumber(latValue);
    const lng = toFiniteNumber(lngValue);

    if (lat === null || lng === null) {
        return null;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return null;
    }

    // Keep previous behavior: treat (0,0) as invalid for this app's business data.
    if (lat === 0 && lng === 0) {
        return null;
    }

    return { lat, lng };
};

const getCompetitorCoordinates = (competitor: Competitor): { lat: number; lng: number } | null => {
    if (competitor.geometry?.location) {
        const geometryCoords = toLatLng(
            competitor.geometry.location.lat,
            competitor.geometry.location.lng
        );
        if (geometryCoords) {
            return geometryCoords;
        }
    }

    return toLatLng(competitor.latitude, competitor.longitude);
};

export function CompetitorMap({ center, businessName, competitors }: CompetitorMapProps) {
    const { t } = useTranslation();

    const normalizedCenter = useMemo(
        () => toLatLng(center?.lat, center?.lng),
        [center?.lat, center?.lng]
    );

    const validCompetitors = useMemo(
        () =>
            competitors
                .map((competitor) => ({
                    competitor,
                    coordinates: getCompetitorCoordinates(competitor),
                }))
                .filter(
                    (
                        item
                    ): item is { competitor: Competitor; coordinates: { lat: number; lng: number } } =>
                        item.coordinates !== null
                ),
        [competitors]
    );

    const hasCompetitors = validCompetitors.length > 0;

    // Fallback UI if no data
    if (!normalizedCenter && !hasCompetitors) {
        return (
            <div className="h-[400px] w-full rounded-lg border shadow-sm bg-muted/30 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                <AlertCircle className="h-10 w-10 mb-3 opacity-50" />
                <p className="font-medium">{t('map.unavailable') || "Map data unavailable"}</p>
                <p className="text-sm mt-1 max-w-xs">{t('map.unavailableDesc') || "Location coordinates for this business could not be determined."}</p>
            </div>
        );
    }

    // Default to center if valid, otherwise first competitor
    const mapCenter = normalizedCenter || validCompetitors[0].coordinates;

    return (
        <div className="h-[400px] w-full rounded-lg overflow-hidden border shadow-sm z-0 relative isolate">
            <MapContainer
                center={mapCenter}
                zoom={14}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapBoundsFitter
                    center={normalizedCenter || undefined}
                    competitorCoordinates={validCompetitors.map((item) => item.coordinates)}
                />

                {/* Main Business Marker */}
                {normalizedCenter && (
                    <Marker position={normalizedCenter} icon={businessIcon} zIndexOffset={1000}>
                        <Popup>
                            <div className="font-bold">{businessName}</div>
                            <div className="text-xs text-muted-foreground">{t('dashboard.analysis.businessReport')}</div>
                        </Popup>
                    </Marker>
                )}

                {/* Competitor Markers */}
                {validCompetitors.map(({ competitor, coordinates }, index) => {
                    return (
                        <Marker
                            key={index}
                            position={coordinates}
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

// Component to handle bounds fitting and resizing
function MapBoundsFitter({
    center,
    competitorCoordinates
}: {
    center?: { lat: number; lng: number };
    competitorCoordinates: Array<{ lat: number; lng: number }>;
}) {
    const map = useMap();

    useEffect(() => {
        // 1. Invalidate size to fix "gray box" issues
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });

        const container = map.getContainer();
        if (container.parentElement) {
            resizeObserver.observe(container.parentElement);
        }

        // Safety triggers
        const timeouts = [100, 300, 500, 1000].map(ms =>
            setTimeout(() => map.invalidateSize(), ms)
        );

        // 2. Fit Bounds logic
        const points: L.LatLngExpression[] = [];

        if (center) {
            points.push([center.lat, center.lng]);
        }

        competitorCoordinates.forEach((coords) => {
            points.push([coords.lat, coords.lng]);
        });

        if (points.length > 0) {
            // Add a small delay to ensure map is ready
            setTimeout(() => {
                const bounds = L.latLngBounds(points);
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
            }, 200);
        } else if (center) {
            map.setView(center, 14);
        }

        return () => {
            resizeObserver.disconnect();
            timeouts.forEach(clearTimeout);
        };
    }, [center, competitorCoordinates, map]);

    return null;
}
