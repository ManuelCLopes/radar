
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
    SidebarProvider,
    Sidebar,
    SidebarTrigger,
    SidebarContent,
    useSidebar,
} from "../sidebar";

// Mock useIsMobile
vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => false,
}));

// Component to test useSidebar hook
const TestComponent = () => {
    const { state, toggleSidebar } = useSidebar();
    return (
        <div>
            <span data-testid="sidebar-state">{state}</span>
            <button onClick={toggleSidebar}>Toggle</button>
        </div>
    );
};

describe("Sidebar", () => {
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

    it("should toggle sidebar state", () => {
        render(
            <SidebarProvider defaultOpen={true}>
                <SidebarTrigger />
                <TestComponent />
            </SidebarProvider>
        );

        const stateElement = screen.getByTestId("sidebar-state");
        expect(stateElement).toHaveTextContent("expanded");

        const trigger = screen.getByRole("button", { name: /toggle sidebar/i });
        fireEvent.click(trigger);

        expect(stateElement).toHaveTextContent("collapsed");
    });

    it("should throw error if useSidebar is used outside SidebarProvider", () => {
        // Suppress console.error for this test as React logs the error
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });

        expect(() => render(<TestComponent />)).toThrow(
            "useSidebar must be used within a SidebarProvider."
        );

        consoleSpy.mockRestore();
    });
});
