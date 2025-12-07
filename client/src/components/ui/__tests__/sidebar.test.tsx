
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    SidebarProvider,
    Sidebar,
    SidebarTrigger,
    SidebarContent,
    useSidebar,
    SidebarRail,
    SidebarInset,
    SidebarInput,
    SidebarHeader,
    SidebarFooter,
    SidebarSeparator,
} from "../sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

// Mock useIsMobile
vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: vi.fn(),
}));

// Mock Sheet components to avoid complex rendering issues in unit tests
vi.mock("@/components/ui/sheet", () => ({
    Sheet: ({ children, open, onOpenChange }: any) => (
        <div data-testid="sheet" data-open={open} onClick={() => onOpenChange(false)}>
            {open && children}
        </div>
    ),
    SheetContent: ({ children }: any) => <div data-testid="sheet-content">{children}</div>,
    SheetHeader: ({ children }: any) => <div>{children}</div>,
    SheetTitle: ({ children }: any) => <div>{children}</div>,
    SheetDescription: ({ children }: any) => <div>{children}</div>,
}));

// Component to test useSidebar hook
const TestComponent = () => {
    const { state, toggleSidebar, open, setOpen, isMobile, openMobile, setOpenMobile } = useSidebar();
    return (
        <div>
            <span data-testid="sidebar-state">{state}</span>
            <span data-testid="sidebar-open">{open.toString()}</span>
            <span data-testid="sidebar-mobile">{isMobile.toString()}</span>
            <span data-testid="sidebar-open-mobile">{openMobile.toString()}</span>
            <button onClick={toggleSidebar}>Toggle</button>
            <button onClick={() => setOpen(true)}>Open</button>
            <button onClick={() => setOpen(false)}>Close</button>
            <button onClick={() => setOpenMobile(true)}>Open Mobile</button>
        </div>
    );
};

describe("Sidebar", () => {
    beforeEach(() => {
        vi.mocked(useIsMobile).mockReturnValue(false);
        // Clear cookies
        document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
    });

    it("should render sidebar and content", () => {
        render(
            <SidebarProvider>
                <Sidebar>
                    <SidebarContent>Sidebar Content</SidebarContent>
                </Sidebar>
            </SidebarProvider>
        );

        expect(screen.getByText("Sidebar Content")).toBeInTheDocument();
    });

    it("should toggle sidebar state", async () => {
        const user = userEvent.setup();
        render(
            <SidebarProvider defaultOpen={true}>
                <SidebarTrigger />
                <TestComponent />
            </SidebarProvider>
        );

        const stateElement = screen.getByTestId("sidebar-state");
        expect(stateElement).toHaveTextContent("expanded");

        const trigger = screen.getByRole("button", { name: /toggle sidebar/i });
        await user.click(trigger);

        expect(stateElement).toHaveTextContent("collapsed");
    });

    it("should handle mobile state", async () => {
        vi.mocked(useIsMobile).mockReturnValue(true);
        const user = userEvent.setup();

        render(
            <SidebarProvider>
                <Sidebar>
                    <SidebarContent>Mobile Content</SidebarContent>
                </Sidebar>
                <TestComponent />
            </SidebarProvider>
        );

        expect(screen.getByTestId("sidebar-mobile")).toHaveTextContent("true");

        // Initially closed on mobile
        expect(screen.queryByTestId("sheet-content")).not.toBeInTheDocument();

        // Open mobile sidebar
        await user.click(screen.getByText("Open Mobile"));

        expect(screen.getByTestId("sheet-content")).toBeInTheDocument();
        expect(screen.getByText("Mobile Content")).toBeInTheDocument();
    });

    it("should toggle with keyboard shortcut (Ctrl+b)", async () => {
        const user = userEvent.setup();
        render(
            <SidebarProvider defaultOpen={true}>
                <TestComponent />
            </SidebarProvider>
        );

        expect(screen.getByTestId("sidebar-state")).toHaveTextContent("expanded");

        await user.keyboard("{Control>}b{/Control}");

        expect(screen.getByTestId("sidebar-state")).toHaveTextContent("collapsed");
    });

    it("should persist state in cookie", async () => {
        const user = userEvent.setup();
        render(
            <SidebarProvider defaultOpen={true}>
                <TestComponent />
            </SidebarProvider>
        );

        await user.click(screen.getByText("Close"));
        expect(document.cookie).toContain("sidebar_state=false");

        await user.click(screen.getByText("Open"));
        expect(document.cookie).toContain("sidebar_state=true");
    });

    it("should render sidebar rail and toggle on click", async () => {
        const user = userEvent.setup();
        render(
            <SidebarProvider defaultOpen={true}>
                <SidebarRail />
                <TestComponent />
            </SidebarProvider>
        );

        const rail = screen.getByTitle("Toggle Sidebar");
        await user.click(rail);

        expect(screen.getByTestId("sidebar-state")).toHaveTextContent("collapsed");
    });

    it("should render other sidebar components", () => {
        render(
            <SidebarProvider>
                <Sidebar>
                    <SidebarHeader>Header</SidebarHeader>
                    <SidebarContent>
                        <SidebarInput placeholder="Search" />
                        <SidebarSeparator />
                    </SidebarContent>
                    <SidebarFooter>Footer</SidebarFooter>
                    <SidebarRail />
                </Sidebar>
                <SidebarInset>Inset Content</SidebarInset>
            </SidebarProvider>
        );

        expect(screen.getByText("Header")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
        expect(screen.getByText("Footer")).toBeInTheDocument();
        expect(screen.getByText("Inset Content")).toBeInTheDocument();
    });

    it("should throw error if useSidebar is used outside SidebarProvider", () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });

        expect(() => render(<TestComponent />)).toThrow(
            "useSidebar must be used within a SidebarProvider."
        );

        consoleSpy.mockRestore();
    });
});
