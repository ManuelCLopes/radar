import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RadiusSelector } from "../RadiusSelector";

// Mock react-i18next
vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe("RadiusSelector", () => {
    it("should render all radius options", () => {
        const onChange = vi.fn();
        render(<RadiusSelector value={1000} onChange={onChange} />);

        expect(screen.getByText("500m")).toBeInTheDocument();
        expect(screen.getByText("1km")).toBeInTheDocument();
        expect(screen.getByText("2km")).toBeInTheDocument();
        expect(screen.getByText("5km")).toBeInTheDocument();
    });

    it("should highlight selected radius", () => {
        const onChange = vi.fn();
        render(<RadiusSelector value={1000} onChange={onChange} />);

        const button1km = screen.getByText("1km").closest("button");
        expect(button1km).toHaveClass("bg-blue-600");
    });

    it("should call onChange when clicking a radius option", () => {
        const onChange = vi.fn();
        render(<RadiusSelector value={1000} onChange={onChange} />);

        const button2km = screen.getByText("2km");
        fireEvent.click(button2km);

        expect(onChange).toHaveBeenCalledWith(2000);
    });

    it("should apply custom className", () => {
        const onChange = vi.fn();
        const { container } = render(<RadiusSelector value={1000} onChange={onChange} className="custom-class" />);

        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper).toHaveClass("custom-class");
    });
});
