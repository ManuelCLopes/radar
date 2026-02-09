import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CompetitorMap } from "../CompetitorMap";

// Mock leaflet before importing the component
vi.mock("leaflet", () => {
    const mockIcon = {};
    return {
        default: {
            icon: vi.fn(() => mockIcon),
            Icon: class MockIcon {
                constructor() {
                    return mockIcon;
                }
            },
            Marker: { prototype: { options: { icon: mockIcon } } }
        }
    };
});

// Mock react-leaflet
vi.mock("react-leaflet", () => ({
    MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: ({ children, position }: any) => (
        <div data-testid="marker" data-lat={position.lat} data-lng={position.lng}>{children}</div>
    ),
    Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
    useMap: () => ({ setView: vi.fn() })
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key
    })
}));

describe("CompetitorMap", () => {
    const defaultProps = {
        center: { lat: 40.7, lng: -74.0 },
        businessName: "Test Business",
        competitors: []
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render map container", () => {
        render(<CompetitorMap {...defaultProps} />);

        expect(screen.getByTestId("map-container")).toBeInTheDocument();
        expect(screen.getByTestId("tile-layer")).toBeInTheDocument();
    });

    it("should render business marker", () => {
        render(<CompetitorMap {...defaultProps} />);

        const markers = screen.getAllByTestId("marker");
        expect(markers.length).toBeGreaterThanOrEqual(1);

        // Check business name is in a popup
        expect(screen.getByText("Test Business")).toBeInTheDocument();
    });

    it("should render competitor markers with valid coordinates", () => {
        const competitors = [
            { name: "Comp 1", address: "123 Test St", latitude: 40.71, longitude: -74.01, rating: 4.5, userRatingsTotal: 100 },
            { name: "Comp 2", address: "456 Test Ave", latitude: 40.72, longitude: -74.02, rating: 4.0, userRatingsTotal: 50 }
        ];

        render(<CompetitorMap {...defaultProps} competitors={competitors} />);

        // Should have 3 markers (1 business + 2 competitors)
        const markers = screen.getAllByTestId("marker");
        expect(markers.length).toBe(3);

        // Competitor names should be visible
        expect(screen.getByText("Comp 1")).toBeInTheDocument();
        expect(screen.getByText("Comp 2")).toBeInTheDocument();
    });

    it("should filter out competitors without valid coordinates", () => {
        const competitors = [
            { name: "Valid Comp", address: "123 Test St", latitude: 40.71, longitude: -74.01 },
            { name: "Invalid Comp", address: "No coords" } // No coordinates
        ];

        render(<CompetitorMap {...defaultProps} competitors={competitors} />);

        // Should have 2 markers (1 business + 1 valid competitor)
        const markers = screen.getAllByTestId("marker");
        expect(markers.length).toBe(2);

        expect(screen.getByText("Valid Comp")).toBeInTheDocument();
        expect(screen.queryByText("Invalid Comp")).not.toBeInTheDocument();
    });

    it("should handle competitors with geometry.location format", () => {
        const competitors = [
            {
                name: "Geometry Comp",
                address: "789 Test Blvd",
                geometry: { location: { lat: 40.73, lng: -74.03 } }
            }
        ];

        render(<CompetitorMap {...defaultProps} competitors={competitors} />);

        expect(screen.getByText("Geometry Comp")).toBeInTheDocument();
        const markers = screen.getAllByTestId("marker");
        expect(markers.length).toBe(2);
    });

    it("should display rating in competitor popup when available", () => {
        const competitors = [
            { name: "Rated Comp", address: "Test St", latitude: 40.71, longitude: -74.01, rating: 4.5, userRatingsTotal: 200 }
        ];

        render(<CompetitorMap {...defaultProps} competitors={competitors} />);

        expect(screen.getByText("⭐ 4.5 (200)")).toBeInTheDocument();
    });

    it("should render with custom radius", () => {
        render(<CompetitorMap {...defaultProps} radius={2000} />);

        expect(screen.getByTestId("map-container")).toBeInTheDocument();
    });
});
