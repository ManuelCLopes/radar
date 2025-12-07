
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "../dropdown-menu";
import { useState } from "react";

describe("DropdownMenu", () => {
    it("should render trigger and open menu", async () => {
        const user = userEvent.setup();
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>My Menu</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Item 1</DropdownMenuItem>
                    <DropdownMenuItem>Item 2</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );

        const trigger = screen.getByText("Open Menu");
        expect(trigger).toBeInTheDocument();

        // Menu content should not be visible initially
        expect(screen.queryByText("My Menu")).not.toBeInTheDocument();

        // Click trigger
        await user.click(trigger);

        // Menu content should be visible
        expect(await screen.findByText("My Menu")).toBeInTheDocument();
        expect(screen.getByText("Item 1")).toBeInTheDocument();
        expect(screen.getByText("Item 2")).toBeInTheDocument();
    });

    it("should handle checkbox items", async () => {
        const user = userEvent.setup();
        const TestComponent = () => {
            const [checked, setChecked] = useState(false);
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuCheckboxItem
                            checked={checked}
                            onCheckedChange={setChecked}
                        >
                            Checkbox Item
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        };

        render(<TestComponent />);

        await user.click(screen.getByText("Open Menu"));
        const checkboxItem = await screen.findByText("Checkbox Item");

        // Initial state: unchecked
        expect(screen.getByRole("menuitemcheckbox")).toHaveAttribute("aria-checked", "false");

        await user.click(checkboxItem);

        // Re-open
        await user.click(screen.getByText("Open Menu"));
        expect(await screen.findByRole("menuitemcheckbox")).toHaveAttribute("aria-checked", "true");
    });

    it("should handle radio items", async () => {
        const user = userEvent.setup();
        const TestComponent = () => {
            const [value, setValue] = useState("one");
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuRadioGroup value={value} onValueChange={setValue}>
                            <DropdownMenuRadioItem value="one">One</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="two">Two</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        };

        render(<TestComponent />);

        await user.click(screen.getByText("Open Menu"));
        const itemOne = await screen.findByText("One");
        const itemTwo = screen.getByText("Two");

        expect(screen.getAllByRole("menuitemradio")[0]).toHaveAttribute("aria-checked", "true");
        expect(screen.getAllByRole("menuitemradio")[1]).toHaveAttribute("aria-checked", "false");

        await user.click(itemTwo);

        // Re-open
        await user.click(screen.getByText("Open Menu"));
        expect(await screen.findAllByRole("menuitemradio").then(items => items[0])).toHaveAttribute("aria-checked", "false");
        expect(await screen.findAllByRole("menuitemradio").then(items => items[1])).toHaveAttribute("aria-checked", "true");
    });

    it("should render submenus", async () => {
        const user = userEvent.setup();
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>Item 1</DropdownMenuItem>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Sub Menu</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem>Sub Item 1</DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
        );

        await user.click(screen.getByText("Open Menu"));
        const subTrigger = await screen.findByText("Sub Menu");

        // Sub content not visible yet
        expect(screen.queryByText("Sub Item 1")).not.toBeInTheDocument();

        // Click sub trigger
        await user.click(subTrigger);

        // Wait for sub item
        expect(await screen.findByText("Sub Item 1")).toBeInTheDocument();
    });
});
