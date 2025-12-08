import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Progress } from "../progress";

describe("Progress", () => {
    it("should render progress bar", () => {
        const { container } = render(<Progress value={50} />);
        expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
    });

    it("should render with 0% value", () => {
        const { container } = render(<Progress value={0} />);
        const progressBar = container.querySelector('[role="progressbar"]');
        expect(progressBar).toBeInTheDocument();
    });

    it("should render with 50% value", () => {
        const { container } = render(<Progress value={50} />);
        const progressBar = container.querySelector('[role="progressbar"]');
        expect(progressBar).toBeInTheDocument();
    });

    it("should render with 100% value", () => {
        const { container } = render(<Progress value={100} />);
        const progressBar = container.querySelector('[role="progressbar"]');
        expect(progressBar).toBeInTheDocument();
    });

    it("should apply custom className", () => {
        const { container } = render(<Progress value={50} className="custom-progress" />);
        const progressBar = container.querySelector('[role="progressbar"]');
        expect(progressBar).toHaveClass("custom-progress");
    });
});
