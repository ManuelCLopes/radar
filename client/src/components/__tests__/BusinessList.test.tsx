
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BusinessList } from "../BusinessList";
import type { Business } from "@shared/schema";

// Mock hooks
vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, options?: any) => {
            if (key === "business.deleteDialog.description") return `Delete ${options.name}?`;
            return key;
        },
    }),
}));

// Mock UI components to avoid complex Radix UI interactions in unit tests
vi.mock("@/components/ui/alert-dialog", () => ({
    AlertDialog: ({ children }: any) => <div>{children}</div>,
    AlertDialogTrigger: ({ children }: any) => <div>{children}</div>,
    AlertDialogContent: ({ children }: any) => <div data-testid="alert-dialog-content">{children}</div>,
    AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
    AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
    AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
    AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
    AlertDialogCancel: ({ children }: any) => <button>{children}</button>,
    AlertDialogAction: ({ children, onClick }: any) => <button onClick={onClick} data-testid="confirm-delete">{children}</button>,
}));

vi.mock("@/components/ui/skeleton", () => ({
    Skeleton: () => <div data-testid="skeleton" />,
}));

describe("BusinessList", () => {
    const mockBusinesses: Business[] = [
        {
            id: "1",
            name: "Test Business 1",
            type: "restaurant",
            address: "123 Test St",
            latitude: 10,
            longitude: 20,
            locationStatus: "validated",
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: "1",
            rating: null,
            userRatingsTotal: null
        },
        {
            id: "2",
            name: "Pending Business",
            type: "retail",
            address: "456 Pending St",
            latitude: null,
            longitude: null,
            locationStatus: "pending",
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: "1",
            rating: null,
            userRatingsTotal: null
        }
    ];

    const defaultProps = {
        businesses: mockBusinesses,
        onGenerateReport: vi.fn(),
        onDelete: vi.fn(),
        onViewHistory: vi.fn(),
        onEdit: vi.fn(),
    };

    it("renders loading state", () => {
        render(<BusinessList {...defaultProps} isLoading={true} />);
        expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
    });

    it("renders empty state", () => {
        render(<BusinessList {...defaultProps} businesses={[]} />);
        expect(screen.getByText("business.list.empty")).toBeInTheDocument();
    });

    it("renders list of businesses", () => {
        render(<BusinessList {...defaultProps} />);
        expect(screen.getByText("Test Business 1")).toBeInTheDocument();
        expect(screen.getByText("Pending Business")).toBeInTheDocument();
        expect(screen.getByText("business.types.restaurant")).toBeInTheDocument();
        expect(screen.getByText("business.types.retail")).toBeInTheDocument();
    });

    it("calls onGenerateReport when button clicked", () => {
        render(<BusinessList {...defaultProps} />);
        const btn = screen.getByTestId("button-generate-report-1");
        fireEvent.click(btn);
        expect(defaultProps.onGenerateReport).toHaveBeenCalledWith("1");
    });

    it("disables generate report button for pending business", () => {
        render(<BusinessList {...defaultProps} />);
        const btn = screen.getByTestId("button-generate-report-2");
        expect(btn).toBeDisabled();
    });

    it("calls onViewHistory when button clicked", () => {
        render(<BusinessList {...defaultProps} />);
        const btn = screen.getByTestId("button-view-history-1");
        fireEvent.click(btn);
        expect(defaultProps.onViewHistory).toHaveBeenCalledWith(mockBusinesses[0]);
    });

    it("calls onEdit when button clicked", () => {
        render(<BusinessList {...defaultProps} />);
        const btn = screen.getByTestId("button-edit-1");
        fireEvent.click(btn);
        expect(defaultProps.onEdit).toHaveBeenCalledWith(mockBusinesses[0]);
    });

    it("shows delete confirmation and calls onDelete", () => {
        render(<BusinessList {...defaultProps} />);

        // Since we mocked AlertDialog to render everything inline (trigger and content),
        // we can find the confirm button directly.
        // But our mock renders children of AlertDialog, which includes Trigger and Content.
        // Wait, standard AlertDialog usage is:
        // <AlertDialog> <Trigger>...</Trigger> <Content>...</Content> </AlertDialog>
        // Our mock renders {children} for AlertDialog. So both Trigger and Content are rendered.

        // Since we have 2 businesses, we have 2 confirm buttons.
        const confirmBtns = screen.getAllByTestId("confirm-delete");
        fireEvent.click(confirmBtns[0]);

        expect(defaultProps.onDelete).toHaveBeenCalledWith("1");
    });

    it("shows loading state for generating report", () => {
        render(<BusinessList {...defaultProps} generatingReportId="1" />);
        expect(screen.getByText("business.list.generating")).toBeInTheDocument();
        const btn = screen.getByTestId("button-generate-report-1");
        expect(btn).toBeDisabled();
    });

    it("shows loading state for deleting", () => {
        render(<BusinessList {...defaultProps} deletingId="1" />);
        const btn = screen.getByTestId("button-delete-1");
        expect(btn).toBeDisabled();
    });
});
