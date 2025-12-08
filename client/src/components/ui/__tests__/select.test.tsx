import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    SelectGroup,
    SelectLabel,
} from "../select";

describe("Select", () => {
    it("should render select trigger", () => {
        render(
            <Select>
                <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                </SelectContent>
            </Select>
        );

        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("should display placeholder", () => {
        render(
            <Select>
                <SelectTrigger>
                    <SelectValue placeholder="Choose option" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="opt1">Opt 1</SelectItem>
                </SelectContent>
            </Select>
        );

        expect(screen.getByText("Choose option")).toBeInTheDocument();
    });

    it("should open and show options when clicked", async () => {
        const user = userEvent.setup();
        render(
            <Select>
                <SelectTrigger>
                    <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">First</SelectItem>
                    <SelectItem value="2">Second</SelectItem>
                </SelectContent>
            </Select>
        );

        const trigger = screen.getByRole("combobox");
        await user.click(trigger);

        expect(screen.getByText("First")).toBeInTheDocument();
        expect(screen.getByText("Second")).toBeInTheDocument();
    });

    it("should render grouped items with label", async () => {
        const user = userEvent.setup();
        render(
            <Select>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Group 1</SelectLabel>
                        <SelectItem value="a">Item A</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        );

        await user.click(screen.getByRole("combobox"));
        expect(screen.getByText("Group 1")).toBeInTheDocument();
    });

    it("should apply custom className to trigger", () => {
        render(
            <Select>
                <SelectTrigger className="custom-trigger">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">One</SelectItem>
                </SelectContent>
            </Select>
        );

        expect(screen.getByRole("combobox")).toHaveClass("custom-trigger");
    });
});
