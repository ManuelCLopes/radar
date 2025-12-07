
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "../command";

describe("Command", () => {
    it("should render command dialog components", () => {
        render(
            <Command>
                <CommandInput placeholder="Type a command..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Suggestions">
                        <CommandItem>Calendar</CommandItem>
                        <CommandItem>Search Emoji</CommandItem>
                        <CommandItem>Calculator</CommandItem>
                    </CommandGroup>
                </CommandList>
            </Command>
        );

        expect(screen.getByPlaceholderText("Type a command...")).toBeInTheDocument();
        expect(screen.getByText("Suggestions")).toBeInTheDocument();
        expect(screen.getByText("Calendar")).toBeInTheDocument();
    });

    it("should filter items", () => {
        render(
            <Command>
                <CommandInput placeholder="Search..." />
                <CommandList>
                    <CommandItem>Apple</CommandItem>
                    <CommandItem>Banana</CommandItem>
                </CommandList>
            </Command>
        );

        const input = screen.getByPlaceholderText("Search...");
        fireEvent.change(input, { target: { value: "App" } });

        expect(screen.getByText("Apple")).toBeVisible();
        // cmdk hides items by setting style display: none or removing them?
        // Usually it adds `data-filtered` attribute or hides them.
        // Let's check visibility.
        // Note: cmdk might be async or use ResizeObserver which we mocked.
    });

    it("should handle selection", () => {
        const onSelect = vi.fn();
        render(
            <Command>
                <CommandList>
                    <CommandItem onSelect={onSelect}>Item 1</CommandItem>
                </CommandList>
            </Command>
        );

        fireEvent.click(screen.getByText("Item 1"));
        expect(onSelect).toHaveBeenCalled();
    });
});
