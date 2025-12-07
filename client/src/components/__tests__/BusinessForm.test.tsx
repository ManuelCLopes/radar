import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BusinessForm } from "../BusinessForm";
import userEvent from "@testing-library/user-event";

// Mock hooks
const mockMutateAsync = vi.fn();
vi.mock("@tanstack/react-query", () => ({
    useMutation: () => ({
        mutateAsync: mockMutateAsync,
        isPending: false,
    }),
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
    useToast: () => ({
        toast: mockToast,
    }),
}));

// Mock UI components that might cause issues or are not focus of test
vi.mock("@/components/ui/dialog", () => ({
    Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <div>{children}</div>,
    DialogDescription: ({ children }: any) => <div>{children}</div>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/alert-dialog", () => ({
    AlertDialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
    AlertDialogContent: ({ children }: any) => <div>{children}</div>,
    AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
    AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
    AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
    AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
    AlertDialogAction: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
    AlertDialogCancel: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

vi.mock("@/components/ui/select", () => ({
    Select: ({ children, onValueChange, value }: any) => (
        <select
            data-testid="mock-select"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
        >
            {children}
        </select>
    ),
    SelectTrigger: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    SelectValue: () => null,
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}));

describe("BusinessForm", () => {
    const mockOnSubmit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the form correctly", () => {
        render(<BusinessForm onSubmit={mockOnSubmit} />);
        expect(screen.getByTestId("input-business-name")).toBeInTheDocument();
        // Type field should NOT be present initially
        expect(screen.queryByTestId("select-business-type")).not.toBeInTheDocument();
        expect(screen.getByTestId("input-address")).toBeInTheDocument();
        expect(screen.getByTestId("button-submit-business")).toBeInTheDocument();
    });

    it("validates required fields", async () => {
        render(<BusinessForm onSubmit={mockOnSubmit} />);

        const submitButton = screen.getByTestId("button-submit-business");
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockOnSubmit).not.toHaveBeenCalled();
        });
    });

    it("submits the form with valid data", async () => {
        const user = userEvent.setup();
        render(<BusinessForm onSubmit={mockOnSubmit} />);

        await user.type(screen.getByTestId("input-business-name"), "Test Business");

        // Address first to show type field
        await user.type(screen.getByTestId("input-address"), "Test Address");
        // Simulate manual entry or proceeding so type field appears
        // We can set manual coordinates state via some interaction or just mock the state?
        // Easier to just trigger the "proceed with address" flow if we can, or just type address and click search?
        // But search is async.
        // Let's assume typing address sets pendingLocationAddress? No, only on "Proceed".
        // Wait, the form logic says: `(selectedPlace || manualCoordinates || pendingLocationAddress) && ...`
        // So we need one of these.

        // Let's mock search result to select a place.
        mockMutateAsync.mockResolvedValue({
            results: [{ placeId: "1", name: "P", address: "A", latitude: 0, longitude: 0 }],
            apiKeyMissing: false
        });

        await user.click(screen.getByTestId("button-search-address"));
        await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());

        // Assuming it auto-selects or we select it. 
        // If 1 result and address matches, it might show suggestion.
        // Let's just assume we can select type now.

        // If auto-fill didn't happen (no types in result), select should be visible.
        await waitFor(() => {
            expect(screen.getByTestId("mock-select")).toBeInTheDocument();
        });

        // Select type using mock select
        await user.selectOptions(screen.getByTestId("mock-select"), "restaurant");

        // Submit
        await user.click(screen.getByTestId("button-submit-business"));

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalled(); // Changed to toHaveBeenCalled because we are actually submitting now
        });
    });

    it("handles address search and selection", async () => {
        const user = userEvent.setup();
        mockMutateAsync.mockResolvedValue({
            results: [{
                placeId: "1",
                name: "Test Place",
                address: "Test Address, City",
                latitude: 10,
                longitude: 20,
                rating: 5,
                userRatingsTotal: 10
            }],
            apiKeyMissing: false
        });

        render(<BusinessForm onSubmit={mockOnSubmit} />);

        await user.type(screen.getByTestId("input-business-name"), "Test Business");
        await user.type(screen.getByTestId("input-address"), "Test Address");

        // Click search button
        await user.click(screen.getByTestId("button-search-address"));

        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalledWith("Test Business, Test Address");
        });

        // Should show suggestion dialog or auto-select if 1 result?
        // Code says: if 1 result -> check if address matches -> if not match, show suggestion.
        // "Test Address" vs "Test Address, City".
        // Likely shows suggestion.

        // Let's assume it shows suggestion dialog.
        // We mocked AlertDialog.
        // We should see "Test Place" in the document.
        expect(await screen.findByText("Test Place")).toBeInTheDocument();

        // Click "Use This" (AlertDialogAction)
        await user.click(screen.getByText("addressSearch.suggestion.useThis"));

        // Now address should be updated and verified.
        expect(screen.getByTestId("input-address")).toHaveValue("Test Address, City");
        expect(screen.getByText("addressSearch.addressVerified")).toBeInTheDocument();
    });

    it("auto-fills business type when selecting a place", async () => {
        const user = userEvent.setup();
        mockMutateAsync.mockResolvedValue({
            results: [{
                placeId: "1",
                name: "Test Restaurant",
                address: "Test Address",
                latitude: 10,
                longitude: 20,
                types: ["restaurant", "food"],
            }],
            apiKeyMissing: false
        });

        render(<BusinessForm onSubmit={mockOnSubmit} />);

        await user.type(screen.getByTestId("input-address"), "Test Address");
        await user.click(screen.getByTestId("button-search-address"));

        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalled();
        });

        // Assuming it auto-selects or shows suggestion. 
        // If exact match (address input "Test Address" vs result "Test Address"), it auto-selects.
        // Let's verify type is set and displayed as text.

        // We expect "Restaurant" (or whatever the label is) to be visible as text, not in a select.
        // And the "Change" button to be visible.
        await waitFor(() => {
            expect(screen.getByText("business.types.restaurant")).toBeInTheDocument();
            // Should show info icon/tooltip text (might be hidden, but we can check if the icon is there)
            // Note: Tooltip content is usually not in the document until triggered.
            // We can check if the tooltip trigger is present.
        });

        // Since we removed the change button, we just verify the read-only state persists
        expect(screen.queryByTestId("mock-select")).not.toBeInTheDocument();
    });
});
