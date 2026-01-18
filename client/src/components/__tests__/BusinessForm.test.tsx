import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BusinessForm } from "../BusinessForm";
import userEvent from "@testing-library/user-event";

// Mock hooks
const mockMutateAsync = vi.fn();
vi.mock("@tanstack/react-query", async () => {
    const actual = await vi.importActual("@tanstack/react-query");
    return {
        ...actual as any,
        useMutation: () => ({
            mutateAsync: mockMutateAsync,
            isPending: false,
        }),
    };
});

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

vi.mock("@/hooks/useAuth", () => ({
    useAuth: () => ({
        user: { id: "1", email: "test@example.com", isVerified: true },
        isLoading: false,
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
    Select: ({ children, onValueChange, value, ...props }: any) => (
        <select
            data-testid="mock-select"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            {...props}
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
        expect(screen.getByTestId("input-address")).toBeInTheDocument();
        // Type field should be hidden initially (before address verification)
        expect(screen.queryByTestId("select-business-type")).not.toBeInTheDocument();
        expect(screen.getByTestId("button-submit-business")).toBeInTheDocument();
    });

    it("validates required fields", async () => {
        render(<BusinessForm onSubmit={mockOnSubmit} />);
        const user = userEvent.setup();

        // Submit button should be disabled initially
        expect(screen.getByTestId("button-submit-business")).toBeDisabled();

        // Even with name, it should be disabled if address is not verified
        await user.type(screen.getByTestId("input-business-name"), "Test Business");
        expect(screen.getByTestId("button-submit-business")).toBeDisabled();
    });

    it("triggers address validation when clicking search with empty address", async () => {
        render(<BusinessForm onSubmit={mockOnSubmit} />);
        const user = userEvent.setup();

        await user.type(screen.getByTestId("input-business-name"), "Test Business");
        await user.click(screen.getByTestId("button-search-address"));

        // Should trigger validation error for address
        expect(await screen.findByText("validation.required")).toBeInTheDocument();
        expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it("disables search button if name is empty", async () => {
        render(<BusinessForm onSubmit={mockOnSubmit} />);
        const user = userEvent.setup();
        const searchButton = screen.getByTestId("button-search-address");

        expect(searchButton).toBeDisabled();

        await user.type(screen.getByTestId("input-business-name"), "Test Business");
        expect(searchButton).not.toBeDisabled();
    });

    it("submits the form with valid data", async () => {
        const user = userEvent.setup();
        render(<BusinessForm onSubmit={mockOnSubmit} />);

        await user.type(screen.getByTestId("input-business-name"), "Test Business");
        await user.type(screen.getByTestId("input-address"), "Test Address");

        mockMutateAsync.mockResolvedValue({
            results: [{
                placeId: "1",
                name: "Test Place",
                address: "Test Address, City",
                latitude: 10,
                longitude: 20,
                types: ["restaurant"]
            }],
            apiKeyMissing: false
        });

        await user.click(screen.getByTestId("button-search-address"));
        await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());

        // Select the place from suggestions
        await user.click(screen.getByText("addressSearch.suggestion.useThis"));

        const submitButton = screen.getByTestId("button-submit-business");
        expect(submitButton).not.toBeDisabled();
        fireEvent.submit(submitButton.closest("form")!);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
                name: "Test Business",
                address: "Test Address, City",
                type: "restaurant"
            }));
        });
    });

    it("submits the form with valid data (Manual Entry)", async () => {
        const user = userEvent.setup();
        render(<BusinessForm onSubmit={mockOnSubmit} />);

        await user.type(screen.getByTestId("input-business-name"), "Test Business");
        await user.type(screen.getByTestId("input-address"), "Test Address");

        mockMutateAsync.mockResolvedValue({
            results: [], // No results
            apiKeyMissing: false
        });

        await user.click(screen.getByTestId("button-search-address"));
        await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());

        // Proceed with address
        await user.click(screen.getByTestId("button-proceed-with-address"));

        // Now dropdown should be visible
        await waitFor(() => {
            expect(screen.getByTestId("select-business-type")).toBeInTheDocument();
        });

        // Select type
        fireEvent.change(screen.getByTestId("mock-select"), { target: { value: "restaurant" } });

        const submitButton = screen.getByTestId("button-submit-business");
        expect(submitButton).not.toBeDisabled();
        fireEvent.submit(submitButton.closest("form")!);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalled();
        }, { timeout: 3000 });
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

        // Let's assume it shows suggestion dialog.
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

        await user.type(screen.getByTestId("input-business-name"), "Test Business");
        await user.type(screen.getByTestId("input-address"), "Test Address");
        await user.click(screen.getByTestId("button-search-address"));

        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalled();
        });

        // Verify type is set and displayed in the select (no longer read-only)
        await waitFor(() => {
            expect(screen.getByTestId("select-business-type")).toBeInTheDocument();
            const select = screen.getByTestId("mock-select") as HTMLSelectElement;
            expect(select.value).toBe("restaurant");
        });
    });

    it("handles multiple search results", async () => {
        const user = userEvent.setup();
        mockMutateAsync.mockResolvedValue({
            results: [
                { placeId: "1", name: "Place A", address: "Address A", latitude: 1, longitude: 1 },
                { placeId: "2", name: "Place B", address: "Address B", latitude: 2, longitude: 2 }
            ],
            apiKeyMissing: false
        });

        render(<BusinessForm onSubmit={mockOnSubmit} />);

        await user.type(screen.getByTestId("input-business-name"), "Test Business");
        await user.type(screen.getByTestId("input-address"), "Test Query");
        await user.click(screen.getByTestId("button-search-address"));

        await waitFor(() => {
            expect(screen.getByText("addressSearch.multipleResults.title")).toBeInTheDocument();
        });

        expect(screen.getByText("Place A")).toBeInTheDocument();
        expect(screen.getByText("Place B")).toBeInTheDocument();

        // Select one
        await user.click(screen.getByTestId("card-place-result-0"));

        // Should close dialog and set address
        await waitFor(() => {
            expect(screen.queryByText("addressSearch.multipleResults.title")).not.toBeInTheDocument();
            expect(screen.getByTestId("input-address")).toHaveValue("Address A");
        });
    });

    it("handles no search results", async () => {
        const user = userEvent.setup();
        mockMutateAsync.mockResolvedValue({
            results: [],
            apiKeyMissing: false
        });

        render(<BusinessForm onSubmit={mockOnSubmit} />);

        await user.type(screen.getByTestId("input-business-name"), "Test Business");
        await user.type(screen.getByTestId("input-address"), "Unknown Place");
        await user.click(screen.getByTestId("button-search-address"));

        await waitFor(() => {
            expect(screen.getByText("addressSearch.noResults.title")).toBeInTheDocument();
        });

        // Test "Proceed with address"
        await user.click(screen.getByTestId("button-proceed-with-address"));

        await waitFor(() => {
            expect(screen.queryByText("addressSearch.noResults.title")).not.toBeInTheDocument();
            // Should allow manual entry (type field visible as dropdown)
            expect(screen.getByTestId("select-business-type")).toBeInTheDocument();
        });
    });

    it("handles API key missing", async () => {
        const user = userEvent.setup();
        mockMutateAsync.mockResolvedValue({
            results: [],
            apiKeyMissing: true
        });

        render(<BusinessForm onSubmit={mockOnSubmit} />);

        await user.type(screen.getByTestId("input-business-name"), "Test Business");
        await user.type(screen.getByTestId("input-address"), "Any Place");
        await user.click(screen.getByTestId("button-search-address"));

        await waitFor(() => {
            expect(screen.getByText("addressSearch.apiKeyMissing.title")).toBeInTheDocument();
        });

        // Test "Proceed with address"
        await user.click(screen.getByTestId("button-proceed-with-address-api-missing"));

        await waitFor(() => {
            expect(screen.queryByText("addressSearch.apiKeyMissing.title")).not.toBeInTheDocument();
            expect(screen.getByTestId("select-business-type")).toBeInTheDocument();
        });
    });
});
