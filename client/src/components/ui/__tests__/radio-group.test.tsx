import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { RadioGroup, RadioGroupItem } from "../radio-group";

describe("RadioGroup", () => {
    it("should render radio group", () => {
        const { container } = render(
            <RadioGroup>
                <RadioGroupItem value="1" />
                <RadioGroupItem value="2" />
            </RadioGroup>
        );
        expect(container.querySelector('[role="radiogroup"]')).toBeInTheDocument();
    });

    it("should render multiple radio items", () => {
        const { container } = render(
            <RadioGroup>
                <RadioGroupItem value="option1" />
                <RadioGroupItem value="option2" />
                <RadioGroupItem value="option3" />
            </RadioGroup>
        );
        const radios = container.querySelectorAll('[role="radio"]');
        expect(radios).toHaveLength(3);
    });

    it("should select radio option", async () => {
        const user = userEvent.setup();
        const { container } = render(
            <RadioGroup>
                <RadioGroupItem value="1" data-testid="radio-1" />
                <RadioGroupItem value="2" data-testid="radio-2" />
            </RadioGroup>
        );

        const radio1 = screen.getByTestId("radio-1");
        await user.click(radio1);
        expect(radio1).toBeChecked();
    });

    it("should render with default value", () => {
        const { container } = render(
            <RadioGroup defaultValue="2">
                <RadioGroupItem value="1" />
                <RadioGroupItem value="2" />
            </RadioGroup>
        );
        const radioGroup = container.querySelector('[role="radiogroup"]');
        expect(radioGroup).toBeInTheDocument();
    });

    it("should apply custom className", () => {
        const { container } = render(
            <RadioGroup className="custom-radio-group">
                <RadioGroupItem value="1" />
            </RadioGroup>
        );
        const radioGroup = container.querySelector('[role="radiogroup"]');
        expect(radioGroup).toHaveClass("custom-radio-group");
    });
});
