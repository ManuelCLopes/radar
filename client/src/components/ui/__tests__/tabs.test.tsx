
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../tabs";

describe("Tabs", () => {
    it("should render tabs and switch content", async () => {
        const user = userEvent.setup();
        render(
            <Tabs defaultValue="tab1">
                <TabsList>
                    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1">Content 1</TabsContent>
                <TabsContent value="tab2">Content 2</TabsContent>
            </Tabs>
        );

        // Initial state
        expect(screen.getByText("Content 1")).toBeInTheDocument();
        expect(screen.queryByText("Content 2")).not.toBeInTheDocument();

        const tab1 = screen.getByRole("tab", { name: "Tab 1" });
        const tab2 = screen.getByRole("tab", { name: "Tab 2" });

        expect(tab1).toHaveAttribute("aria-selected", "true");
        expect(tab2).toHaveAttribute("aria-selected", "false");

        // Switch tab
        await user.click(tab2);

        expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
        expect(screen.getByText("Content 2")).toBeInTheDocument();

        expect(tab1).toHaveAttribute("aria-selected", "false");
        expect(tab2).toHaveAttribute("aria-selected", "true");
    });
});
