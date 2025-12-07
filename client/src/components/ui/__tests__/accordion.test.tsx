
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "../accordion";

describe("Accordion", () => {
    it("should expand and collapse item", async () => {
        const user = userEvent.setup();
        render(
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                    <AccordionTrigger>Trigger 1</AccordionTrigger>
                    <AccordionContent>Content 1</AccordionContent>
                </AccordionItem>
            </Accordion>
        );

        expect(screen.queryByText("Content 1")).not.toBeInTheDocument();

        await user.click(screen.getByText("Trigger 1"));

        expect(screen.getByText("Content 1")).toBeVisible();

        await user.click(screen.getByText("Trigger 1"));

        // Radix UI might keep it in DOM but hidden, or remove it.
        // Usually it animates height.
        // waitFor might be needed for animation.
        await waitFor(() => {
            expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
        });
    });

    it("should handle multiple items", async () => {
        const user = userEvent.setup();
        render(
            <Accordion type="multiple">
                <AccordionItem value="item-1">
                    <AccordionTrigger>Trigger 1</AccordionTrigger>
                    <AccordionContent>Content 1</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>Trigger 2</AccordionTrigger>
                    <AccordionContent>Content 2</AccordionContent>
                </AccordionItem>
            </Accordion>
        );

        await user.click(screen.getByText("Trigger 1"));
        expect(screen.getByText("Content 1")).toBeVisible();
        expect(screen.queryByText("Content 2")).not.toBeInTheDocument();

        await user.click(screen.getByText("Trigger 2"));
        expect(screen.getByText("Content 1")).toBeVisible();
        expect(screen.getByText("Content 2")).toBeVisible();
    });
});
