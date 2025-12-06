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
        // With mock select, trigger is inside select, might behave differently but testId should be there
        expect(screen.getByTestId("select-business-type")).toBeInTheDocument();
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

        // Select type using mock select
        await user.selectOptions(screen.getByTestId("mock-select"), "restaurant");

        // Address
        await user.type(screen.getByTestId("input-address"), "Test Address");

        // Submit
        await user.click(screen.getByTestId("button-submit-business"));

        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalled();
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
});
